const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 文件上传配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// 统计变量
let requestCount = 0;

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    stats: {
      totalRequests: requestCount,
      message: '简化版本 - 演示模式'
    }
  });
});

// API文档
app.get('/api', (req, res) => {
  res.json({
    name: 'Excalidraw API (Demo)',
    version: '1.0.0',
    description: 'Excalidraw JSON to image conversion service - 演示版本',
    message: '这是一个简化的演示版本，实际渲染需要完整的Canvas环境',
    endpoints: {
      'POST /api/render': {
        description: '渲染Excalidraw JSON数据',
        status: '演示模式',
        response: '返回模拟数据'
      },
      'POST /api/render/file': {
        description: '上传JSON文件进行渲染',
        status: '演示模式',
        response: '返回模拟数据'
      },
      'GET /health': {
        description: '健康检查',
        status: '正常工作'
      }
    }
  });
});

// 主渲染接口（模拟）
app.post('/api/render', async (req, res) => {
  requestCount++;
  const startTime = Date.now();

  try {
    const { format = 'png', quality = 90 } = req.query;

    // 基本验证
    if (!req.body || !req.body.type || !req.body.elements) {
      return res.status(400).json({
        error: 'Invalid data',
        message: '缺少必要的Excalidraw数据字段',
        timestamp: new Date().toISOString()
      });
    }

    // 验证元素数量
    const elementCount = req.body.elements ? req.body.elements.length : 0;

    // 模拟渲染处理时间
    await new Promise(resolve => setTimeout(resolve, 100));

    // 返回模拟图片数据（一个简单的PNG头）
    const mockImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk start
      0x00, 0x00, 0x00, 0x64, // Width: 100
      0x00, 0x00, 0x00, 0x64, // Height: 100
      0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, etc.
      0x4C, 0x87, 0x95, 0x0B, // CRC
      0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01 // Compressed data
    ]);

    const renderTime = Date.now() - startTime;

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': mockImageData.length,
      'X-Cache': 'MISS',
      'X-Render-Time': `${renderTime}ms`,
      'X-Elements-Count': elementCount.toString(),
      'X-Demo-Mode': 'true',
      'X-Message': '这是一个模拟的演示版本'
    });

    res.send(mockImageData);

  } catch (error) {
    console.error('渲染错误:', error);
    res.status(500).json({
      error: 'Render failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 文件上传渲染接口（模拟）
app.post('/api/render/file', upload.single('file'), async (req, res) => {
  requestCount++;
  const startTime = Date.now();

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

    // 基本验证
    if (!excalidrawData.type || !excalidrawData.elements) {
      return res.status(400).json({
        error: 'Invalid Excalidraw data',
        message: '文件内容不符合Excalidraw格式',
        timestamp: new Date().toISOString()
      });
    }

    // 模拟渲染处理时间
    await new Promise(resolve => setTimeout(resolve, 150));

    // 返回模拟图片数据
    const mockImageData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0xC8, // Width: 200
      0x00, 0x00, 0x00, 0xC8, // Height: 200
      0x08, 0x02, 0x00, 0x00, 0x00,
      0x4C, 0x87, 0x95, 0x0B,
      0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54,
      0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01
    ]);

    const renderTime = Date.now() - startTime;

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': mockImageData.length,
      'X-Render-Time': `${renderTime}ms`,
      'X-File-Size': req.file.size.toString(),
      'X-Elements-Count': excalidrawData.elements.length.toString(),
      'X-Demo-Mode': 'true',
      'X-Message': '这是一个模拟的演示版本'
    });

    res.send(mockImageData);

  } catch (error) {
    console.error('渲染错误:', error);
    res.status(500).json({
      error: 'Render failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 统计接口
app.get('/stats', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    requests: {
      total: requestCount,
      errors: 0,
      successRate: '100%'
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    mode: 'demo',
    message: '这是演示模式的统计数据'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `路径 ${req.method} ${req.originalUrl} 不存在`,
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`
╔═════════════════════════════════════════════════════════════════╗
║               Excalidraw API 服务启动成功 (演示版本)               ║
╠═════════════════════════════════════════════════════════════════╣
║  服务地址: http://${HOST}:${PORT}                                  ║
║  API文档:  http://${HOST}:${PORT}/api                              ║
║  健康检查:  http://${HOST}:${PORT}/health                           ║
║  性能统计:  http://${HOST}:${PORT}/stats                           ║
║  模式:     演示模式 (模拟渲染结果)                                  ║
╚═════════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;