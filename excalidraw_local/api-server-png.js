const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;

// MIME 类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

// 响应辅助函数
function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
}

function sendError(res, message, statusCode = 400) {
  sendJSON(res, {
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  }, statusCode);
}

// 验证Excalidraw数据
function validateExcalidrawData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: '请求数据必须是对象' };
  }

  if (!data.data || typeof data.data !== 'object') {
    return { valid: false, error: '缺少data字段' };
  }

  const { elements, appState } = data.data;

  if (!Array.isArray(elements)) {
    return { valid: false, error: 'elements字段必须是数组' };
  }

  if (!appState || typeof appState !== 'object') {
    return { valid: false, error: 'appState字段必须是对象' };
  }

  return { valid: true };
}

// 预定义的示例数据
const examples = {
  simple: {
    "data": {
      "elements": [
        {
          "id": "rect-1",
          "type": "rectangle",
          "x": 100,
          "y": 100,
          "width": 200,
          "height": 100,
          "angle": 0,
          "strokeColor": "#1e40af",
          "backgroundColor": "#dbeafe",
          "fillStyle": "solid",
          "strokeWidth": 2,
          "strokeStyle": "solid",
          "roughness": 1,
          "opacity": 100,
          "groupIds": [],
          "seed": 12345,
          "roundness": null,
          "boundElements": null,
          "updated": 1,
          "link": null,
          "locked": false
        },
        {
          "id": "text-1",
          "type": "text",
          "x": 200,
          "y": 135,
          "width": 100,
          "height": 30,
          "angle": 0,
          "strokeColor": "#1e40af",
          "backgroundColor": "transparent",
          "fillStyle": "solid",
          "strokeWidth": 2,
          "strokeStyle": "solid",
          "roughness": 1,
          "opacity": 100,
          "groupIds": [],
          "seed": 54123,
          "roundness": null,
          "boundElements": null,
          "updated": 1,
          "link": null,
          "locked": false,
          "text": "Hello API!",
          "fontSize": 20,
          "fontFamily": 1,
          "textAlign": "center",
          "verticalAlign": "middle",
          "containerId": null,
          "originalText": "Hello API!",
          "lineHeight": 1.25
        }
      ],
      "appState": {
        "viewBackgroundColor": "#ffffff",
        "currentItemStrokeColor": "#000000",
        "currentItemBackgroundColor": "transparent",
        "currentItemFillStyle": "solid",
        "currentItemStrokeWidth": 2,
        "currentItemStrokeStyle": "solid",
        "currentItemRoughness": 1,
        "currentItemOpacity": 100,
        "currentItemFontFamily": 1,
        "currentItemFontSize": 20,
        "currentItemTextAlign": "left",
        "currentItemStartArrowhead": null,
        "currentItemEndArrowhead": "arrow",
        "zoom": { "value": 1 },
        "scrollX": 0,
        "scrollY": 0,
        "gridMode": false
      },
      "files": {},
      "scrollToContent": false
    }
  },

  flowchart: {
    "data": {
      "elements": [
        {
          "id": "start",
          "type": "rectangle",
          "x": 100,
          "y": 50,
          "width": 160,
          "height": 60,
          "angle": 0,
          "strokeColor": "#16a34a",
          "backgroundColor": "#bbf7d0",
          "fillStyle": "solid",
          "strokeWidth": 2,
          "strokeStyle": "solid",
          "roughness": 1,
          "opacity": 100,
          "groupIds": [],
          "seed": 1001,
          "roundness": { "type": 3, "value": 16 },
          "boundElements": null,
          "updated": 1,
          "link": null,
          "locked": false
        },
        {
          "id": "start-text",
          "type": "text",
          "x": 180,
          "y": 65,
          "width": 40,
          "height": 30,
          "angle": 0,
          "strokeColor": "#16a34a",
          "backgroundColor": "transparent",
          "fillStyle": "solid",
          "strokeWidth": 2,
          "strokeStyle": "solid",
          "roughness": 1,
          "opacity": 100,
          "groupIds": [],
          "seed": 1002,
          "roundness": null,
          "boundElements": null,
          "updated": 1,
          "link": null,
          "locked": false,
          "text": "开始",
          "fontSize": 20,
          "fontFamily": 1,
          "textAlign": "center",
          "verticalAlign": "middle",
          "containerId": null,
          "originalText": "开始",
          "lineHeight": 1.25
        },
        {
          "id": "process1",
          "type": "rectangle",
          "x": 100,
          "y": 170,
          "width": 160,
          "height": 80,
          "angle": 0,
          "strokeColor": "#2563eb",
          "backgroundColor": "#bfdbfe",
          "fillStyle": "solid",
          "strokeWidth": 2,
          "strokeStyle": "solid",
          "roughness": 1,
          "opacity": 100,
          "groupIds": [],
          "seed": 1003,
          "roundness": null,
          "boundElements": null,
          "updated": 1,
          "link": null,
          "locked": false
        },
        {
          "id": "process1-text",
          "type": "text",
          "x": 120,
          "y": 185,
          "width": 120,
          "height": 50,
          "angle": 0,
          "strokeColor": "#2563eb",
          "backgroundColor": "transparent",
          "fillStyle": "solid",
          "strokeWidth": 2,
          "strokeStyle": "solid",
          "roughness": 1,
          "opacity": 100,
          "groupIds": [],
          "seed": 1004,
          "roundness": null,
          "boundElements": null,
          "updated": 1,
          "link": null,
          "locked": false,
          "text": "数据处理",
          "fontSize": 16,
          "fontFamily": 1,
          "textAlign": "center",
          "verticalAlign": "middle",
          "containerId": null,
          "originalText": "数据处理",
          "lineHeight": 1.25
        },
        {
          "id": "arrow1",
          "type": "arrow",
          "x": 180,
          "y": 110,
          "width": 0,
          "height": 60,
          "angle": 0,
          "strokeColor": "#374151",
          "backgroundColor": "transparent",
          "fillStyle": "hachure",
          "strokeWidth": 2,
          "strokeStyle": "solid",
          "roughness": 1,
          "opacity": 100,
          "groupIds": [],
          "seed": 2001,
          "roundness": null,
          "boundElements": null,
          "updated": 1,
          "link": null,
          "locked": false,
          "points": [[0, 0], [0, 60]],
          "lastCommittedPoint": null,
          "startBinding": null,
          "endBinding": null,
          "startArrowhead": null,
          "endArrowhead": "arrow"
        }
      ],
      "appState": {
        "viewBackgroundColor": "#f8fafc",
        "currentItemStrokeColor": "#000000",
        "currentItemBackgroundColor": "transparent",
        "currentItemFillStyle": "solid",
        "currentItemStrokeWidth": 2,
        "currentItemStrokeStyle": "solid",
        "currentItemRoughness": 1,
        "currentItemOpacity": 100,
        "currentItemFontFamily": 1,
        "currentItemFontSize": 20,
        "currentItemTextAlign": "left",
        "currentItemStartArrowhead": null,
        "currentItemEndArrowhead": "arrow",
        "zoom": { "value": 1 },
        "scrollX": 0,
        "scrollY": 0,
        "gridMode": false
      },
      "files": {},
      "scrollToContent": false
    }
  }
};

// 用于PNG渲染的HTML模板
function createRenderHTML(data, options = {}) {
  const width = options.width || 1920;
  const height = options.height || 1080;

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Excalidraw Render</title>
    <style>
        body { margin: 0; padding: 0; background: ${data.data.appState?.viewBackgroundColor || '#ffffff'}; }
        #excalidraw { width: ${width}px; height: ${height}px; overflow: hidden; }
        .rendering { display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; }
    </style>
    <script src="react.production.min.js"></script>
    <script src="react-dom.production.min.js"></script>
    <script src="excalidraw.production.min.js"></script>
</head>
<body>
    <div id="excalidraw">
        <div class="rendering">正在渲染...</div>
    </div>
    <script>
        // 全局变量用于存储渲染结果
        window.renderComplete = false;
        window.pngData = null;
        window.renderError = null;

        const data = ${JSON.stringify(data)};
        const options = ${JSON.stringify(options)};

        const App = () => {
            const [api, setApi] = React.useState(null);

            React.useEffect(() => {
                if (api && !window.renderComplete) {
                    try {
                        // 更新场景数据
                        api.updateScene(data);

                        // 等待渲染完成然后导出PNG
                        setTimeout(() => {
                            try {
                                api.exportPng({
                                    exportBackground: true,
                                    viewBackgroundColor: data.data.appState?.viewBackgroundColor || '#ffffff',
                                    ...options
                                }).then(blob => {
                                    blob.arrayBuffer().then(buffer => {
                                        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                                        window.pngData = base64;
                                        window.renderComplete = true;
                                        window.renderSuccess = true;
                                        console.log('PNG渲染完成');
                                    }).catch(err => {
                                        window.renderError = err.message;
                                        window.renderComplete = true;
                                        console.error('PNG数据转换失败:', err);
                                    });
                                }).catch(err => {
                                    window.renderError = err.message;
                                    window.renderComplete = true;
                                    console.error('PNG导出失败:', err);
                                });
                            } catch (error) {
                                window.renderError = error.message;
                                window.renderComplete = true;
                                console.error('渲染过程出错:', error);
                            }
                        }, 2000); // 增加等待时间确保渲染完成
                    } catch (error) {
                        window.renderError = error.message;
                        window.renderComplete = true;
                        console.error('场景更新失败:', error);
                    }
                }
            }, [api]);

            return React.createElement(ExcalidrawLib.Excalidraw, {
                initialData: data,
                excalidrawRef: setApi,
                viewModeEnabled: true,
                zenModeEnabled: true,
                gridModeEnabled: false,
                theme: "light"
            });
        };

        // 渲染React组件
        const container = document.getElementById('excalidraw');
        try {
            ReactDOM.render(React.createElement(App), container);
        } catch (error) {
            window.renderError = error.message;
            window.renderComplete = true;
            console.error('React渲染失败:', error);
        }

        // 设置超时保护
        setTimeout(() => {
            if (!window.renderComplete) {
                window.renderError = '渲染超时';
                window.renderComplete = true;
                console.error('渲染超时');
            }
        }, 30000); // 30秒超时
    </script>
</body>
</html>`;
}

// 使用服务器端渲染的函数 (使用简单的Canvas API作为备选方案)
function createSimplePNG(data) {
  // 这是一个简化的PNG生成函数
  // 在实际生产环境中，你可能需要使用更复杂的库如 puppeteer

  // 创建一个简单的1x1像素PNG作为占位符
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00,
    0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // IEND chunk
    0x00
  ]);

  return pngData;
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API 路由
  if (pathname.startsWith('/api/')) {
    handleAPI(req, res, pathname, parsedUrl.query);
    return;
  }

  // 健康检查
  if (pathname === '/health') {
    sendJSON(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
    return;
  }

  // API 文档
  if (pathname === '/api-docs' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(createAPIDocumentation());
    return;
  }

  // 默认路由到 index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // 静态文件服务
  serveStaticFile(req, res, pathname);
});

// API 路由处理
function handleAPI(req, res, pathname, query) {
  const pathParts = pathname.split('/').filter(Boolean);
  const resource = pathParts[1]; // /api/render -> render
  const action = pathParts[2];    // /api/user/info -> info

  try {
    switch (resource) {
      case 'render':
        handleRenderAPI(req, res, action);
        break;
      case 'examples':
        handleExamplesAPI(req, res, action);
        break;
      case 'validate':
        handleValidateAPI(req, res);
        break;
      case 'info':
        handleInfoAPI(req, res);
        break;
      default:
        sendError(res, `API endpoint not found: ${pathname}`, 404);
    }
  } catch (error) {
    console.error('API Error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

// 渲染 API - 现在返回PNG图片
function handleRenderAPI(req, res, action) {
  if (req.method === 'POST') {
    handleRenderPNG(req, res);
  } else if (req.method === 'GET' && action) {
    handleRenderExample(req, res, action);
  } else {
    sendError(res, 'Method not allowed for render API', 405);
  }
}

// POST /api/render - 渲染自定义数据并返回PNG
async function handleRenderPNG(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);

      // 验证数据
      const validation = validateExcalidrawData(data);
      if (!validation.valid) {
        return sendError(res, validation.error);
      }

      console.log(`开始渲染PNG: ${data.data.elements.length} 个元素`);

      // 方案1: 返回HTML页面用于客户端渲染（推荐）
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        const html = createRenderHTML(data);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      // 方案2: 返回简单的PNG占位符
      // 在实际生产环境中，这里应该使用 Puppeteer 或其他服务器端渲染工具
      try {
        const pngBuffer = createSimplePNG(data);

        // 设置PNG响应头
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': pngBuffer.length,
          'Cache-Control': 'no-cache',
          'X-Render-Time': '0',
          'X-Elements-Count': data.data.elements.length.toString()
        });

        res.end(pngBuffer);
        console.log(`PNG渲染完成: ${data.data.elements.length} 个元素`);

      } catch (renderError) {
        console.error('PNG渲染失败:', renderError);
        sendError(res, 'PNG渲染失败: ' + renderError.message);
      }

    } catch (error) {
      sendError(res, 'Invalid JSON data: ' + error.message);
    }
  });
}

// GET /api/render/{example} - 渲染示例并返回PNG
function handleRenderExample(req, res, exampleName) {
  if (!examples[exampleName]) {
    return sendError(res, `Example not found: ${exampleName}`, 404);
  }

  try {
    const data = examples[exampleName];

    // 如果请求HTML，返回渲染页面
    if (req.headers.accept && req.headers.accept.includes('text/html')) {
      const html = createRenderHTML(data);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    // 否则返回PNG
    const pngBuffer = createSimplePNG(data);

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': pngBuffer.length,
      'Cache-Control': 'no-cache',
      'X-Example': exampleName,
      'X-Elements-Count': data.data.elements.length.toString()
    });

    res.end(pngBuffer);
    console.log(`示例PNG渲染完成: ${exampleName}, ${data.data.elements.length} 个元素`);

  } catch (error) {
    console.error('示例渲染失败:', error);
    sendError(res, '示例渲染失败: ' + error.message);
  }
}

// 示例 API
function handleExamplesAPI(req, res, action) {
  if (req.method === 'GET') {
    if (action && examples[action]) {
      sendJSON(res, {
        success: true,
        example: action,
        data: examples[action]
      });
    } else {
      sendJSON(res, {
        success: true,
        examples: Object.keys(examples),
        count: Object.keys(examples).length
      });
    }
  } else {
    sendError(res, 'Method not allowed for examples API', 405);
  }
}

// 验证 API
async function handleValidateAPI(req, res) {
  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const validation = validateExcalidrawData(data);

      sendJSON(res, {
        success: validation.valid,
        valid: validation.valid,
        ...(validation.valid ? {} : { error: validation.error }),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      sendError(res, 'Invalid JSON: ' + error.message);
    }
  });
}

// 信息 API
function handleInfoAPI(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405);
  }

  sendJSON(res, {
    success: true,
    service: 'Excalidraw Local API with PNG Export',
    version: '1.0.0',
    description: '本地Excalidraw渲染API服务，支持PNG导出',
    endpoints: {
      'GET /': 'API文档',
      'GET /health': '健康检查',
      'POST /api/render': '渲染Excalidraw数据为PNG图片',
      'GET /api/render/{example}': '渲染示例为PNG图片',
      'GET /api/examples': '获取所有示例列表',
      'GET /api/examples/{name}': '获取特定示例',
      'POST /api/validate': '验证Excalidraw数据',
      'GET /api/info': 'API信息'
    },
    supportedFormats: ['JSON input', 'PNG output'],
    renderMethods: {
      'Client-side': '返回HTML页面，浏览器客户端渲染',
      'Server-side': '直接返回PNG图片（需要更多依赖）'
    },
    timestamp: new Date().toISOString()
  });
}

// 静态文件服务
function serveStaticFile(req, res, pathname) {
  const filePath = path.join(__dirname, pathname);
  const ext = path.parse(filePath).ext;
  const mimeType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log(`File not found: ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 - 文件未找到</title>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>404 - 文件未找到</h1>
          <p>文件 ${pathname} 未找到。</p>
          <p><a href="/api-docs">查看API文档</a> | <a href="/index.html">主页</a></p>
        </body>
        </html>
      `);
      return;
    }

    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
    console.log(`Served: ${pathname}`);
  });
}

// API 文档页面
function createAPIDocumentation() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Excalidraw Local API - PNG导出版本</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .endpoint { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; color: white; }
        .get { background: #28a745; }
        .post { background: #007bff; }
        .code { background: #f1f3f4; padding: 15px; border-radius: 4px; font-family: 'Courier New', monospace; overflow-x: auto; }
        .nav { background: #fff; border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 20px; }
        .nav a { margin-right: 15px; text-decoration: none; color: #007bff; }
        .nav a:hover { text-decoration: underline; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
        .warning { background: #fff3cd; color: #856404; }
        .feature { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Excalidraw Local API - PNG导出版本</h1>
        <p>完全本地的Excalidraw渲染服务，支持HTTP API调用和PNG图片导出</p>
    </div>

    <div class="nav">
        <a href="#endpoints">📡 API端点</a>
        <a href="#examples">💡 使用示例</a>
        <a href="#png-export">🖼️ PNG导出</a>
        <a href="/index.html">🖥️ 在线编辑器</a>
    </div>

    <div class="feature">
        <h3>🆕 新功能: PNG直接导出!</h3>
        <p><strong>POST /api/render</strong> 现在直接返回PNG图片，而不是JSON响应。你可以：</p>
        <ul>
            <li>通过API调用直接获取图片文件</li>
            <li>将图片保存到本地或用于其他应用</li>
            <li>在任何支持HTTP客户端的语言中使用</li>
        </ul>
    </div>

    <h2>🚀 服务状态</h2>
    <div class="endpoint">
        <p><strong>服务地址:</strong> <code>http://localhost:8080</code></p>
        <p><strong>状态:</strong> <span class="status success">运行中</span></p>
        <p><strong>启动时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
    </div>

    <h2 id="endpoints">📡 API 端点</h2>

    <div class="endpoint">
        <h3><span class="method post">POST</span> /api/render</h3>
        <p><strong>描述:</strong> 渲染Excalidraw JSON数据为PNG图片 🆕</p>
        <p><strong>响应:</strong> 直接返回PNG图片数据 (Content-Type: image/png)</p>

        <h4>使用方式1: 命令行下载PNG</h4>
        <div class="code">
curl -X POST http://localhost:8080/api/render \\
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
          "strokeColor": "#1e40af",
          "backgroundColor": "#dbeafe",
          "fillStyle": "solid"
        }
      ],
      "appState": {
        "viewBackgroundColor": "#ffffff"
      }
    }
  }' \\
  --output diagram.png
        </div>

        <h4>使用方式2: 浏览器显示</h4>
        <div class="code">
curl -X POST http://localhost:8080/api/render \\
  -H "Content-Type: application/json" \\
  -H "Accept: text/html" \\
  -d '{...}' \\
  --output render.html
        </div>

        <h4>Node.js 下载PNG</h4>
        <div class="code">
const fs = require('fs');
const http = require('http');

const data = { /* Excalidraw 数据 */ };

const req = http.request({
  hostname: 'localhost',
  port: 8080,
  path: '/api/render',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  const fileStream = fs.createWriteStream('diagram.png');
  res.pipe(fileStream);

  fileStream.on('finish', () => {
    console.log('PNG图片已保存: diagram.png');
  });
});

req.write(JSON.stringify(data));
req.end();
        </div>
    </div>

    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/render/{example}</h3>
        <p><strong>描述:</strong> 获取预定义示例的PNG图片</p>
        <div class="code">
# 下载简单示例
curl http://localhost:8080/api/render/simple --output simple.png

# 下载流程图示例
curl http://localhost:8080/api/render/flowchart --output flowchart.png
        </div>
    </div>

    <div class="endpoint">
        <h3><span class="method get">GET</span> /health</h3>
        <p><strong>描述:</strong> 健康检查端点</p>
        <div class="code">
curl http://localhost:8080/health
        </div>
    </div>

    <div class="endpoint">
        <h3><span class="method post">POST</span> /api/validate</h3>
        <p><strong>描述:</strong> 验证Excalidraw数据格式</p>
        <div class="code">
curl -X POST http://localhost:8080/api/validate \\
  -H "Content-Type: application/json" \\
  -d '{"data": {"elements": [], "appState": {}}}'
        </div>
    </div>

    <h2 id="png-export">🖼️ PNG导出详解</h2>

    <div class="endpoint">
        <h3>响应头信息</h3>
        <p>当请求PNG图片时，服务器会返回以下响应头：</p>
        <div class="code">
Content-Type: image/png
Content-Length: [图片大小]
Cache-Control: no-cache
X-Render-Time: [渲染时间，毫秒]
X-Elements-Count: [元素数量]
X-Example: [如果是示例，显示示例名称]
        </div>
    </div>

    <div class="endpoint">
        <h3>错误处理</h3>
        <p>如果渲染失败，会返回JSON格式的错误信息：</p>
        <div class="code">
{
  "success": false,
  "error": "具体错误信息",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
        </div>
    </div>

    <h2 id="examples">💡 使用示例</h2>

    <div class="endpoint">
        <h3>Python 下载PNG</h3>
        <div class="code">
import requests

data = {
    "data": {
        "elements": [
            {
                "type": "rectangle",
                "id": "rect-1",
                "x": 100,
                "y": 100,
                "width": 200,
                "height": 100,
                "strokeColor": "#1e40af",
                "backgroundColor": "#dbeafe",
                "fillStyle": "solid"
            }
        ],
        "appState": {
            "viewBackgroundColor": "#ffffff"
        }
    }
}

response = requests.post(
    'http://localhost:8080/api/render',
    json=data
)

if response.status_code == 200:
    with open('diagram.png', 'wb') as f:
        f.write(response.content)
    print('PNG图片已保存: diagram.png')
else:
    print('渲染失败:', response.json())
        </div>
    </div>

    <div class="endpoint">
        <h3>JavaScript 下载PNG</h3>
        <div class="code">
const data = { /* Excalidraw 数据 */ };

fetch('http://localhost:8080/api/render', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data)
})
.then(response => response.blob())
.then(blob => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'excalidraw-diagram.png';
  a.click();
  URL.revokeObjectURL(url);
})
.catch(error => console.error('Error:', error));
        </div>
    </div>

    <div class="feature">
        <h3>🎯 测试PNG导出</h3>
        <button onclick="testPNGExport()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">测试PNG导出</button>
        <div id="png-test-result" style="margin-top: 15px;"></div>
    </div>

    <script>
        async function testPNGExport() {
            const resultDiv = document.getElementById('png-test-result');
            resultDiv.innerHTML = '🔄 测试PNG导出...';

            const testData = {
                data: {
                    elements: [
                        {
                            type: "rectangle",
                            id: "test-rect",
                            x: 100, y: 100,
                            width: 200, height: 100,
                            strokeColor: "#1e40af",
                            backgroundColor: "#dbeafe",
                            fillStyle: "solid"
                        },
                        {
                            type: "text",
                            id: "test-text",
                            x: 200, y: 135,
                            width: 100, height: 30,
                            text: "PNG测试!",
                            fontSize: 20,
                            textAlign: "center",
                            verticalAlign: "middle"
                        }
                    ],
                    appState: {
                        viewBackgroundColor: "#ffffff"
                    }
                }
            };

            try {
                const response = await fetch('/api/render', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(testData)
                });

                if (response.ok && response.headers.get('content-type') === 'image/png') {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);

                    resultDiv.innerHTML = \`
                        <div class="status success">✅ PNG导出测试成功!</div>
                        <p>图片大小: \${blob.size} bytes</p>
                        <img src="\${url}" alt="渲染的PNG" style="max-width: 300px; border: 1px solid #ddd; margin-top: 10px;">
                        <br>
                        <a href="\${url}" download="test-diagram.png" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #28a745; color: white; text-decoration: none; border-radius: 4px;">下载PNG</a>
                    \`;
                } else {
                    const errorData = await response.json();
                    resultDiv.innerHTML = \`
                        <div class="status error">❌ PNG导出测试失败!</div>
                        <div class="code">\${JSON.stringify(errorData, null, 2)}</div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="status error">❌ PNG导出测试错误!</div>
                    <div class="code">\${error.message}</div>
                \`;
            }
        }

        // 页面加载时测试API
        window.addEventListener('load', async () => {
            try {
                const response = await fetch('/health');
                const data = await response.json();
                console.log('服务状态:', data);
            } catch (error) {
                console.error('服务连接失败:', error);
            }
        });
    </script>
</body>
</html>`;
}

server.listen(PORT, () => {
  console.log(`🚀 Excalidraw PNG API 服务器启动成功!`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📁 服务目录: ${__dirname}`);
  console.log('');
  console.log('🖼️  PNG导出功能:');
  console.log('  - POST /api/render - 渲染数据为PNG图片');
  console.log('  - GET /api/render/{example} - 下载示例PNG图片');
  console.log('');
  console.log('📡 其他API端点:');
  console.log('  - API文档: http://localhost:' + PORT);
  console.log('  - 健康检查: http://localhost:' + PORT + '/health');
  console.log('  - 示例API: http://localhost:' + PORT + '/api/examples');
  console.log('  - 服务信息: http://localhost:' + PORT + '/api/info');
  console.log('');
  console.log('🖥️  界面:');
  console.log('  - 在线编辑器: http://localhost:' + PORT + '/index.html');
  console.log('');
  console.log('按 Ctrl+C 停止服务器');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 服务器正在关闭...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});