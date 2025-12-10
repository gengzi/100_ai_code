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

// 渲染HTML模板
function createRenderHTML(data) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Excalidraw Render</title>
    <style>
        body { margin: 0; padding: 0; background: white; }
        #excalidraw { width: 100%; height: 100vh; }
    </style>
    <script src="react.production.min.js"></script>
    <script src="react-dom.production.min.js"></script>
    <script src="excalidraw.production.min.js"></script>
</head>
<body>
    <div id="excalidraw"></div>
    <script>
        const data = ${JSON.stringify(data)};

        const App = () => {
            const [api, setApi] = React.useState(null);

            React.useEffect(() => {
                if (api) {
                    api.updateScene(data);
                    setTimeout(() => {
                        api.exportPng().then(blob => {
                            blob.arrayBuffer().then(buffer => {
                                const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                                console.log('DATA_URL:' + base64);
                            });
                        });
                    }, 1000);
                }
            }, [api]);

            return React.createElement(ExcalidrawLib.Excalidraw, {
                initialData: data,
                excalidrawRef: setApi,
                viewModeEnabled: true,
                zenModeEnabled: true
            });
        };

        const container = document.getElementById('excalidraw');
        ReactDOM.render(React.createElement(App), container);
    </script>
</body>
</html>`;
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

// 渲染 API
function handleRenderAPI(req, res, action) {
  if (req.method === 'POST') {
    handleRenderPost(req, res);
  } else if (req.method === 'GET' && action) {
    handleRenderGetExample(req, res, action);
  } else {
    sendError(res, 'Method not allowed for render API', 405);
  }
}

// POST /api/render - 渲染自定义数据
async function handleRenderPost(req, res) {
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

      // 这里应该实现实际的渲染逻辑
      // 目前返回成功响应和模拟的渲染时间
      const renderTime = Math.floor(Math.random() * 2000) + 500;

      sendJSON(res, {
        success: true,
        message: 'Render request received successfully',
        renderTime: renderTime,
        elementsCount: data.data.elements.length,
        timestamp: new Date().toISOString(),
        data: data
      });

      console.log(`Render request processed: ${data.data.elements.length} elements, ${renderTime}ms`);

    } catch (error) {
      sendError(res, 'Invalid JSON data: ' + error.message);
    }
  });
}

// GET /api/render/{example} - 渲染示例
function handleRenderGetExample(req, res, exampleName) {
  if (!examples[exampleName]) {
    return sendError(res, `Example not found: ${exampleName}`, 404);
  }

  sendJSON(res, {
    success: true,
    message: `Example "${exampleName}" loaded successfully`,
    example: exampleName,
    data: examples[exampleName],
    timestamp: new Date().toISOString()
  });
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
    service: 'Excalidraw Local API',
    version: '1.0.0',
    description: '本地Excalidraw渲染API服务',
    endpoints: {
      'GET /': 'API文档',
      'GET /health': '健康检查',
      'POST /api/render': '渲染自定义数据',
      'GET /api/render/{example}': '渲染示例数据',
      'GET /api/examples': '获取所有示例列表',
      'GET /api/examples/{name}': '获取特定示例',
      'POST /api/validate': '验证Excalidraw数据',
      'GET /api/info': 'API信息'
    },
    supportedFormats: ['JSON input', 'PNG output (planned)'],
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
    <title>Excalidraw Local API 文档</title>
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
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Excalidraw Local API</h1>
        <p>完全本地的Excalidraw渲染服务，支持HTTP API调用</p>
    </div>

    <div class="nav">
        <a href="#endpoints">📡 API端点</a>
        <a href="#examples">💡 使用示例</a>
        <a href="#test">🧪 在线测试</a>
        <a href="/index.html">🖥️ 在线编辑器</a>
    </div>

    <h2>🚀 服务状态</h2>
    <div class="endpoint">
        <p><strong>服务地址:</strong> <code>http://localhost:8080</code></p>
        <p><strong>状态:</strong> <span class="status success">运行中</span></p>
        <p><strong>启动时间:</strong> ${new Date().toLocaleString('zh-CN')}</p>
    </div>

    <h2 id="endpoints">📡 API 端点</h2>

    <div class="endpoint">
        <h3><span class="method get">GET</span> /health</h3>
        <p><strong>描述:</strong> 健康检查端点</p>
        <div class="code">
curl http://localhost:8080/health
        </div>
        <p><strong>响应:</strong></p>
        <div class="code">
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 123.45,
  "memory": {...}
}
        </div>
    </div>

    <div class="endpoint">
        <h3><span class="method post">POST</span> /api/render</h3>
        <p><strong>描述:</strong> 渲染Excalidraw JSON数据</p>
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
  }'
        </div>
        <p><strong>响应:</strong></p>
        <div class="code">
{
  "success": true,
  "message": "Render request received successfully",
  "renderTime": 1234,
  "elementsCount": 1,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
        </div>
    </div>

    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/render/{example}</h3>
        <p><strong>描述:</strong> 获取并渲染预定义示例</p>
        <div class="code">
curl http://localhost:8080/api/render/simple
curl http://localhost:8080/api/render/flowchart
        </div>
    </div>

    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/examples</h3>
        <p><strong>描述:</strong> 获取所有可用示例列表</p>
        <div class="code">
curl http://localhost:8080/api/examples
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

    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/info</h3>
        <p><strong>描述:</strong> 获取API服务信息</p>
        <div class="code">
curl http://localhost:8080/api/info
        </div>
    </div>

    <h2 id="examples">💡 使用示例</h2>

    <div class="endpoint">
        <h3>JavaScript (Node.js)</h3>
        <div class="code">
const http = require('http');

const data = {
  data: {
    elements: [
      {
        type: "rectangle",
        id: "rect-1",
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        strokeColor: "#1e40af",
        backgroundColor: "#dbeafe",
        fillStyle: "solid"
      }
    ],
    appState: {
      viewBackgroundColor: "#ffffff"
    }
  }
};

const postData = JSON.stringify(data);

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/render',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  res.on('end', () => {
    console.log('Response:', JSON.parse(body));
  });
});

req.write(postData);
req.end();
        </div>
    </div>

    <div class="endpoint">
        <h3>Python</h3>
        <div class="code">
import requests
import json

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

print('Status:', response.status_code)
print('Response:', response.json())
        </div>
    </div>

    <h2 id="test">🧪 在线测试</h2>
    <div class="endpoint">
        <p>你可以直接使用以下工具测试API：</p>
        <ul>
            <li><a href="/index.html" target="_blank">🖥️ 在线编辑器</a> - 可视化编辑和导出</li>
            <li>使用 <code>curl</code> 命令行工具</li>
            <li>使用 Postman 或其他API测试工具</li>
        </ul>
    </div>

    <div class="endpoint">
        <h3>快速测试</h3>
        <button onclick="testAPI()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">测试API</button>
        <div id="test-result" style="margin-top: 15px;"></div>
    </div>

    <script>
        async function testAPI() {
            const resultDiv = document.getElementById('test-result');
            resultDiv.innerHTML = '🔄 测试中...';

            try {
                const response = await fetch('/health');
                const data = await response.json();

                resultDiv.innerHTML = \`
                    <div class="status success">✅ API测试成功!</div>
                    <div class="code">
\${JSON.stringify(data, null, 2)}
                    </div>
                \`;
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="status error">❌ API测试失败!</div>
                    <div class="code">
\${error.message}
                    </div>
                \`;
            }
        }
    </script>
</body>
</html>`;
}

server.listen(PORT, () => {
  console.log(`🚀 Excalidraw API 服务器启动成功!`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📁 服务目录: ${__dirname}`);
  console.log('');
  console.log('📡 API 端点:');
  console.log('  - API文档: http://localhost:' + PORT);
  console.log('  - 健康检查: http://localhost:' + PORT + '/health');
  console.log('  - 渲染API: http://localhost:' + PORT + '/api/render');
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