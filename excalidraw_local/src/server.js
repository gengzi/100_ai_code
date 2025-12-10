  const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');

// 配置日志
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

const app = express();
const PORT = process.env.PORT || 3004; // 改为3005端口以避免冲突

// 中间件配置
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// 静态文件服务 - 提供 node_modules 访问
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));

// 静态文件服务 - 提供根目录文件访问（用于 React 文件）
app.use(express.static(path.join(__dirname, '../')));

// 静态文件服务 - 提供 js 目录访问
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/static', express.static(path.join(__dirname, '../static')));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// 缓存 HTML 模板
let htmlTemplate = null;

async function loadTemplate() {
  try {
    const templatePath = path.join(__dirname, '../templates/excalidraw-template.html');
    htmlTemplate = await fs.readFile(templatePath, 'utf8');
    logger.info('HTML template loaded successfully');
  } catch (error) {
    logger.error('Failed to load HTML template:', error);
    throw error;
  }
}

// 验证 Excalidraw 数据格式
function validateExcalidrawData(data) {
  // 检查数据是否存在且为对象
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data format: data must be an object');
  }

  // 检查是否有 elements 数组
  if (!data.elements || !Array.isArray(data.elements)) {
    throw new Error('Missing or invalid elements array in data');
  }

  // 检查 elements 数组是否为空
  if (data.elements.length === 0) {
    throw new Error('Empty elements array - nothing to render');
  }

  // 基本元素验证
  for (let i = 0; i < data.elements.length; i++) {
    const element = data.elements[i];
    if (!element || typeof element !== 'object') {
      throw new Error(`Invalid element at index ${i}: element must be an object`);
    }
    if (!element.type) {
      throw new Error(`Invalid element at index ${i}: missing type`);
    }
    if (!element.id) {
      throw new Error(`Invalid element at index ${i}: missing id`);
    }
  }

  return true;
}

// 渲染选项配置
const renderOptions = {
  viewport: { width: 1920, height: 1080 },
  timeout: 120000, // 增加到 2 分钟
  waitUntil: 'networkidle2'
};

// 主要的渲染端点
app.post('/render', async (req, res) => {
  const startTime = Date.now();


  try {
    // 检查请求体是否存在
    if (!req.body || typeof req.body !== 'object') {
      throw new Error('Invalid request body: expected JSON object');
    }

    const { data, options = {} } = req.body;

    // 检查 data 是否存在
    if (data === undefined || data === null) {
      throw new Error('Missing "data" property in request body');
    }

    // 验证输入数据
    validateExcalidrawData(data);

    // 合并渲染选项
    const finalOptions = { ...renderOptions, ...options };

    // 启动 Puppeteer 浏览器
    logger.info('Launching browser for rendering...');
    const browser = await puppeteer.launch({
      headless: false, // 显示浏览器窗口
      devtools: true,  // 打开开发者工具
      slowMo: 100,     // 减慢操作速度以便观察
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--start-maximized', // 最大化窗口
        '--window-position=0,0',
        '--window-size=1920,1080',
        '--allow-file-access-from-files',   // 关键
        '--disable-web-security'            // 关键
      ],
      defaultViewport: null // 使用浏览器默认视口
    });

    const page = await browser.newPage();

    // 设置用户代理
    await page.setUserAgent('ExcalidrawRenderer/1.0');

    // 注入数据到 HTML 模板
    const fullHtml = htmlTemplate.replace(
      '<script type="module">',
      `<script>window.initialData = ${JSON.stringify(data)};</script><script type="module">`
    );

    // 设置页面内容
    logger.info('Setting page content...');
    await page.setContent(fullHtml, {
      waitUntil: 'networkidle2',
      timeout: finalOptions.timeout
    });

    // 监听控制台输出
    page.on('console', msg => {
      logger.info('Browser console:', {
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });

    // 监听页面错误
    page.on('pageerror', error => {
      logger.error('Browser page error:', error.message);
    });

    // 等待一下让页面初始化
    await page.waitForTimeout(2000);

    // 等待渲染完成
    logger.info('Waiting for rendering to complete...');
    await page.waitForFunction(() => window.exportReady, {
      timeout: finalOptions.timeout
    });

    // 检查渲染是否成功
    const exportSuccess = await page.evaluate(() => window.exportSuccess);

    if (!exportSuccess) {
      const errorMessage = await page.evaluate(() => window.exportError);
      throw new Error(`Rendering failed: ${errorMessage}`);
    }

    // 获取渲染结果
    const base64Png = await page.evaluate(() => window.exportBlob);
    await browser.close();

    const renderTime = Date.now() - startTime;
    logger.info(`Rendering completed successfully in ${renderTime}ms`);

    // 返回图片数据
    const imageBuffer = Buffer.from(base64Png.split(',')[1], 'base64');

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=3600',
      'X-Render-Time': renderTime,
      'X-Elements-Count': data.elements.length
    });

    res.send(imageBuffer);

  } catch (error) {
    const renderTime = Date.now() - startTime;
    logger.error('Rendering failed:', {
      error: error.message,
      stack: error.stack,
      renderTime: renderTime
    });

    res.status(500).json({
      error: 'Rendering failed',
      message: error.message,
      renderTime: renderTime
    });
  }
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// API 文档端点
app.get('/', (req, res) => {
  res.json({
    name: 'Excalidraw Render Service',
    version: '1.0.0',
    description: 'Convert Excalidraw JSON data to PNG images',
    endpoints: {
      'POST /render': {
        description: 'Render Excalidraw JSON to PNG image',
        body: {
          data: {
            elements: 'Array of Excalidraw elements',
            appState: 'Excalidraw application state (optional)',
            files: 'Files data (optional)'
          },
          options: {
            timeout: 'Rendering timeout in milliseconds (default: 30000)',
            viewport: { width: 'Viewport width', height: 'Viewport height' }
          }
        },
        response: 'PNG image data'
      },
      'GET /health': 'Health check endpoint'
    },
    example: {
      curl: `curl -X POST http://localhost:${PORT}/render \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": {
      "elements": [
        {
          "type": "rectangle",
          "id": "rect-1",
          "x": 100,
          "y": 100,
          "width": 200,
          "height": 100,
          "strokeColor": "#000000",
          "backgroundColor": "#fff",
          "fillStyle": "solid"
        }
      ],
      "appState": {
        "viewBackgroundColor": "#ffffff"
      }
    }
      }'`
    }
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// 启动服务器
async function startServer() {
  try {
    // 确保 logs 目录存在
    await fs.mkdir('logs', { recursive: true });

    // 加载 HTML 模板
    await loadTemplate();

    app.listen(PORT, () => {
      logger.info(`🚀 Excalidraw Render Service running on http://localhost:${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API docs: http://localhost:${PORT}/`);
      logger.info(`🎨 Render endpoint: POST http://localhost:${PORT}/render`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// 启动应用
startServer();