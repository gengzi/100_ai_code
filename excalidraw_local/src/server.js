const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const crypto = require('crypto');
const { RendererPool } = require('./renderer-pool');
const {
  validateExcalidrawData,
  validateRenderOptions,
  cleanAndOptimizeData
} = require('./validator');

// 创建Express应用
const app = express();

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: false, // API服务不需要CSP
}));
app.use(compression());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

// 日志中间件
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// 解析请求体
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '50mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.MAX_REQUEST_SIZE || '50mb' }));

// 文件上传配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // 只允许JSON文件
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('只支持JSON文件'), false);
    }
  }
});

// 创建渲染器池
const rendererPool = new RendererPool({
  maxSize: parseInt(process.env.RENDERER_POOL_SIZE) || 5,
  minSize: parseInt(process.env.RENDERER_POOL_MIN_SIZE) || 1
});

// Redis缓存（可选）
let redisClient = null;
if (process.env.REDIS_URL) {
  try {
    const redis = require('redis');
    redisClient = redis.createClient({ url: process.env.REDIS_URL });
    redisClient.connect().then(() => {
      console.log('Redis连接成功');
    }).catch(error => {
      console.warn('Redis连接失败:', error.message);
    });
  } catch (error) {
    console.warn('Redis模块加载失败:', error.message);
  }
}

// 请求计数器
let requestCount = 0;
let errorCount = 0;

/**
 * 生成缓存键
 * @param {Object} data - 请求数据
 * @param {Object} options - 渲染选项
 * @returns {string} 缓存键
 */
function generateCacheKey(data, options) {
  const cacheData = {
    data: data,
    options: options,
    version: '1.0' // 缓存版本，用于失效旧缓存
  };
  const hash = crypto.createHash('md5');
  hash.update(JSON.stringify(cacheData));
  return `excalidraw:${hash.digest('hex')}`;
}

/**
 * 错误处理中间件
 */
function errorHandler(error, req, res, next) {
  errorCount++;
  console.error(`[${new Date().toISOString()}] 渲染错误:`, error);

  // 客户端错误
  if (error.name === 'ValidationError' || error.message.includes('Invalid data')) {
    return res.status(400).json({
      error: 'Invalid data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }

  // 超时错误
  if (error.message.includes('超时')) {
    return res.status(408).json({
      error: 'Request timeout',
      message: '渲染请求超时，请稍后重试',
      timestamp: new Date().toISOString()
    });
  }

  // 资源不足错误
  if (error.message.includes('资源不足') || error.message.includes('内存不足')) {
    return res.status(503).json({
      error: 'Service unavailable',
      message: '服务器资源不足，请稍后重试',
      timestamp: new Date().toISOString()
    });
  }

  // 其他错误
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : '渲染过程中发生错误',
    timestamp: new Date().toISOString()
  });
}

/**
 * 主渲染接口 - JSON数据渲染
 */
app.post('/api/render', async (req, res, next) => {
  const startTime = Date.now();
  requestCount++;

  try {
    // 验证渲染选项
    const optionsValidation = validateRenderOptions(req.query);
    if (!optionsValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid options',
        details: optionsValidation.errors,
        timestamp: new Date().toISOString()
      });
    }

    const options = optionsValidation.data;

    // 生成缓存键
    const cacheKey = generateCacheKey(req.body, options);

    // 检查缓存
    if (redisClient) {
      try {
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
          const buffer = Buffer.from(cachedResult, 'base64');
          const contentType = `image/${options.format}`;

          res.set({
            'Content-Type': contentType,
            'Content-Length': buffer.length,
            'X-Cache': 'HIT',
            'X-Render-Time': `${Date.now() - startTime}ms`
          });

          return res.send(buffer);
        }
      } catch (cacheError) {
        console.warn('缓存读取失败:', cacheError.message);
      }
    }

    // 验证数据
    const validation = validateExcalidrawData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid data',
        details: validation.errors,
        timestamp: new Date().toISOString()
      });
    }

    // 清理和优化数据
    const cleanedData = cleanAndOptimizeData(req.body);

    // 如果有警告，添加到响应头
    if (validation.warnings.length > 0) {
      res.set('X-Warnings', JSON.stringify(validation.warnings));
    }

    // 计算最优画布尺寸
    const canvasSize = calculateOptimalCanvasSize(cleanedData);
    options.width = options.width || canvasSize.width;
    options.height = options.height || canvasSize.height;

    // 执行渲染
    const buffer = await rendererPool.render(cleanedData, options);

    // 缓存结果
    if (redisClient) {
      try {
        await redisClient.setex(
          cacheKey,
          parseInt(process.env.CACHE_TTL) || 3600,
          buffer.toString('base64')
        );
      } catch (cacheError) {
        console.warn('缓存写入失败:', cacheError.message);
      }
    }

    // 返回结果
    const contentType = options.format === 'svg' ? 'image/svg+xml' : `image/${options.format}`;
    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'X-Cache': 'MISS',
      'X-Render-Time': `${Date.now() - startTime}ms`,
      'X-Elements-Count': cleanedData.elements.length.toString()
    });

    res.send(buffer);

  } catch (error) {
    next(error);
  }
});

/**
 * 文件上传渲染接口
 */
app.post('/api/render/file', upload.single('file'), async (req, res, next) => {
  const startTime = Date.now();
  requestCount++;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: '请上传Excalidraw JSON文件',
        timestamp: new Date().toISOString()
      });
    }

    // 解析JSON文件
    let excalidrawData;
    try {
      const jsonContent = req.file.buffer.toString('utf-8');
      excalidrawData = JSON.parse(jsonContent);
    } catch (parseError) {
      return res.status(400).json({
        error: 'Invalid JSON file',
        message: `JSON解析失败: ${parseError.message}`,
        timestamp: new Date().toISOString()
      });
    }

    // 验证渲染选项
    const optionsValidation = validateRenderOptions(req.query);
    if (!optionsValidation.isValid) {
      return res.status(400).json({
        error: 'Invalid options',
        details: optionsValidation.errors,
        timestamp: new Date().toISOString()
      });
    }

    const options = optionsValidation.data;

    // 处理表单中的选项
    if (req.body.backgroundColor) {
      options.backgroundColor = req.body.backgroundColor;
    }
    if (req.body.width) {
      options.width = parseInt(req.body.width);
    }
    if (req.body.height) {
      options.height = parseInt(req.body.height);
    }

    // 验证数据
    const validation = validateExcalidrawData(excalidrawData);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid data',
        details: validation.errors,
        timestamp: new Date().toISOString()
      });
    }

    // 清理和优化数据
    const cleanedData = cleanAndOptimizeData(excalidrawData);

    // 计算画布尺寸
    const canvasSize = calculateOptimalCanvasSize(cleanedData);
    options.width = options.width || canvasSize.width;
    options.height = options.height || canvasSize.height;

    // 执行渲染
    const buffer = await rendererPool.render(cleanedData, options);

    // 返回结果
    const contentType = options.format === 'svg' ? 'image/svg+xml' : `image/${options.format}`;
    res.set({
      'Content-Type': contentType,
      'Content-Length': buffer.length,
      'X-Render-Time': `${Date.now() - startTime}ms`,
      'X-File-Size': req.file.size.toString()
    });

    res.send(buffer);

  } catch (error) {
    next(error);
  }
});

/**
 * 健康检查接口
 */
app.get('/health', async (req, res) => {
  try {
    const poolHealth = rendererPool.healthCheck();

    let redisHealth = { status: 'disabled' };
    if (redisClient) {
      try {
        await redisClient.ping();
        redisHealth = { status: 'connected' };
      } catch (error) {
        redisHealth = { status: 'error', message: error.message };
      }
    }

    const isHealthy = poolHealth.healthy && redisHealth.status !== 'error';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      pool: poolHealth.pool,
      redis: redisHealth,
      stats: {
        totalRequests: requestCount,
        errorCount: errorCount,
        successRate: requestCount > 0 ? ((requestCount - errorCount) / requestCount * 100).toFixed(2) + '%' : 'N/A'
      }
    });

  } catch (error) {
    console.error('健康检查失败:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * 性能统计接口
 */
app.get('/stats', async (req, res) => {
  try {
    const poolStats = rendererPool.getPerformanceReport();

    res.json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pool: poolStats,
      requests: {
        total: requestCount,
        errors: errorCount,
        successRate: requestCount > 0 ? ((requestCount - errorCount) / requestCount * 100).toFixed(2) + '%' : 'N/A'
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    });

  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

/**
 * API文档接口
 */
app.get('/api', (req, res) => {
  res.json({
    name: 'Excalidraw API',
    version: '1.0.0',
    description: 'Excalidraw JSON to image conversion service',
    endpoints: {
      'POST /api/render': {
        description: '渲染Excalidraw JSON数据',
        contentType: 'application/json',
        parameters: {
          query: {
            format: { type: 'string', enum: ['png', 'jpeg', 'webp', 'svg'], default: 'png' },
            quality: { type: 'number', min: 1, max: 100, default: 90 },
            width: { type: 'number', min: 1, max: 4096 },
            height: { type: 'number', min: 1, max: 4096 }
          },
          body: {
            type: 'excalidraw',
            version: { type: 'number', enum: [1, 2] },
            elements: { type: 'array' },
            appState: { type: 'object' },
            files: { type: 'object' }
          }
        },
        response: 'image/*'
      },
      'POST /api/render/file': {
        description: '上传JSON文件进行渲染',
        contentType: 'multipart/form-data',
        parameters: {
          file: { type: 'file', required: true, format: 'json' },
          format: { type: 'string', enum: ['png', 'jpeg', 'webp', 'svg'], default: 'png' },
          quality: { type: 'number', min: 1, max: 100, default: 90 },
          backgroundColor: { type: 'string', format: 'hex' }
        },
        response: 'image/*'
      },
      'GET /health': {
        description: '健康检查',
        response: 'application/json'
      },
      'GET /stats': {
        description: '获取性能统计',
        response: 'application/json'
      }
    }
  });
});

/**
 * 根路径重定向到API文档
 */
app.get('/', (req, res) => {
  res.redirect('/api');
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `路径 ${req.method} ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use(errorHandler);

/**
 * 计算最优画布尺寸
 * @param {Object} data - Excalidraw数据
 * @returns {Object} 画布尺寸
 */
function calculateOptimalCanvasSize(data) {
  if (!data.elements || data.elements.length === 0) {
    return { width: 1920, height: 1080 };
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  data.elements.forEach(element => {
    if (element.isDeleted) return;

    const x = element.x || 0;
    const y = element.y || 0;
    const width = element.width || 0;
    const height = element.height || 0;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  // 添加边距
  const padding = 100;
  const calculatedWidth = maxX - minX + padding * 2;
  const calculatedHeight = maxY - minY + padding * 2;

  return {
    width: Math.max(calculatedWidth, 800),
    height: Math.max(calculatedHeight, 600)
  };
}

/**
 * 优雅关闭处理
 */
async function gracefulShutdown(signal) {
  console.log(`收到 ${signal} 信号，开始优雅关闭...`);

  try {
    // 关闭渲染器池
    await rendererPool.clear();
    console.log('渲染器池已关闭');

    // 关闭Redis连接
    if (redisClient) {
      await redisClient.quit();
      console.log('Redis连接已关闭');
    }

    console.log('优雅关闭完成');
    process.exit(0);
  } catch (error) {
    console.error('优雅关闭失败:', error);
    process.exit(1);
  }
}

// 注册关闭信号监听器
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  errorCount++;
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  errorCount++;
});

// 启动服务器
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`
╔═════════════════════════════════════════════════════════════════╗
║                     Excalidraw API 服务启动成功                      ║
╠═════════════════════════════════════════════════════════════════╣
║  服务地址: http://${HOST}:${PORT}                                  ║
║  API文档:  http://${HOST}:${PORT}/api                              ║
║  健康检查:  http://${HOST}:${PORT}/health                           ║
║  性能统计:  http://${HOST}:${PORT}/stats                           ║
╚═════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;