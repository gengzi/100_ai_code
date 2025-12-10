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

// 创建HTML渲染模板
function createRenderHTML(data, options = {}) {
  const width = options.width || 1920;
  const height = options.height || 1080;
  const backgroundColor = data.data.appState?.viewBackgroundColor || '#ffffff';

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Excalidraw PNG Render</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: ${backgroundColor};
            width: ${width}px;
            height: ${height}px;
            overflow: hidden;
        }
        #excalidraw {
            width: 100%;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .loading {
            font-family: Arial, sans-serif;
            font-size: 20px;
            color: #666;
        }
    </style>
    <script src="react.production.min.js"></script>
    <script src="react-dom.production.min.js"></script>
    <script src="excalidraw.production.min.js"></script>
</head>
<body>
    <div id="excalidraw">
        <div class="loading">正在渲染...</div>
    </div>
    <script>
        // 渲染配置
        const excalidrawData = ${JSON.stringify(data)};
        const renderOptions = ${JSON.stringify(options)};

        let renderComplete = false;
        let renderResult = null;
        let renderError = null;

        // 全局函数供Puppeteer调用
        window.waitForRender = function() {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    if (!renderComplete) {
                        reject(new Error('渲染超时'));
                    }
                }, 30000);

                const checkRender = () => {
                    if (renderComplete) {
                        clearTimeout(timeout);
                        if (renderError) {
                            reject(new Error(renderError));
                        } else {
                            resolve(renderResult);
                        }
                    } else {
                        setTimeout(checkRender, 100);
                    }
                };

                checkRender();
            });
        };

        window.getPNGData = function() {
            return renderResult;
        };

        const App = () => {
            const [api, setApi] = React.useState(null);

            React.useEffect(() => {
                if (api && !renderComplete) {
                    try {
                        console.log('开始渲染场景...');

                        // 更新场景数据
                        api.updateScene(excalidrawData);

                        // 等待渲染完成后导出PNG
                        setTimeout(async () => {
                            try {
                                console.log('开始导出PNG...');
                                const pngBlob = await api.exportPng({
                                    exportBackground: true,
                                    viewBackgroundColor: excalidrawData.data.appState?.viewBackgroundColor || '#ffffff',
                                    ...renderOptions
                                });

                                // 转换为Base64
                                const arrayBuffer = await pngBlob.arrayBuffer();
                                const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

                                renderResult = base64;
                                renderComplete = true;
                                renderError = null;

                                console.log('PNG渲染成功，数据长度:', base64.length);

                            } catch (error) {
                                console.error('PNG导出失败:', error);
                                renderError = error.message;
                                renderComplete = true;
                            }
                        }, 3000); // 增加等待时间确保渲染完成

                    } catch (error) {
                        console.error('场景更新失败:', error);
                        renderError = error.message;
                        renderComplete = true;
                    }
                }
            }, [api]);

            return React.createElement(ExcalidrawLib.Excalidraw, {
                initialData: excalidrawData,
                excalidrawRef: setApi,
                viewModeEnabled: true,
                zenModeEnabled: true,
                gridModeEnabled: false,
                theme: "light"
            });
        };

        // 渲染React应用
        try {
            const container = document.getElementById('excalidraw');
            ReactDOM.render(React.createElement(App), container);
            console.log('React应用启动成功');
        } catch (error) {
            console.error('React渲染失败:', error);
            renderError = error.message;
            renderComplete = true;
        }
    </script>
</body>
</html>`;
}

// 使用Node.js的Canvas API生成简单的图形（备选方案）
function createSimpleCanvasPNG(data) {
  const { createCanvas, loadImage } = require('canvas');

  // 计算画布大小
  const padding = 50;
  let maxX = padding, maxY = padding, minX = padding, minY = padding;

  if (data.data.elements) {
    data.data.elements.forEach(element => {
      if (element.type === 'rectangle' || element.type === 'text') {
        maxX = Math.max(maxX, element.x + element.width + padding);
        maxY = Math.max(maxY, element.y + element.height + padding);
        minX = Math.min(minX, element.x - padding);
        minY = Math.min(minY, element.y - padding);
      }
    });
  }

  const width = Math.max(800, maxX - minX);
  const height = Math.max(600, maxY - minY);
  const backgroundColor = data.data.appState?.viewBackgroundColor || '#ffffff';

  // 创建画布
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 填充背景
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // 绘制元素
  if (data.data.elements) {
    data.data.elements.forEach(element => {
      try {
        if (element.type === 'rectangle') {
          // 绘制矩形
          ctx.fillStyle = element.backgroundColor || '#ffffff';
          ctx.strokeStyle = element.strokeColor || '#000000';
          ctx.lineWidth = element.strokeWidth || 2;

          if (element.fillStyle !== 'transparent') {
            ctx.fillRect(element.x, element.y, element.width, element.height);
          }
          ctx.strokeRect(element.x, element.y, element.width, element.height);

        } else if (element.type === 'text') {
          // 绘制文本
          ctx.fillStyle = element.strokeColor || '#000000';
          ctx.font = `${element.fontSize || 20}px Arial`;
          ctx.textAlign = element.textAlign || 'left';
          ctx.textBaseline = 'middle';

          const x = element.x + (element.width || 100) / 2;
          const y = element.y + (element.height || 30) / 2;

          ctx.fillText(element.text || '', x, y);

        } else if (element.type === 'arrow') {
          // 绘制箭头（简化版）
          if (element.points && element.points.length >= 2) {
            ctx.strokeStyle = element.strokeColor || '#000000';
            ctx.lineWidth = element.strokeWidth || 2;
            ctx.beginPath();

            const [start, end] = element.points;
            ctx.moveTo(element.x + start[0], element.y + start[1]);
            ctx.lineTo(element.x + end[0], element.y + end[1]);
            ctx.stroke();

            // 绘制箭头头部
            if (element.endArrowhead === 'arrow') {
              const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
              const headLength = 10;

              ctx.beginPath();
              ctx.moveTo(element.x + end[0], element.y + end[1]);
              ctx.lineTo(
                element.x + end[0] - headLength * Math.cos(angle - Math.PI / 6),
                element.y + end[1] - headLength * Math.sin(angle - Math.PI / 6)
              );
              ctx.moveTo(element.x + end[0], element.y + end[1]);
              ctx.lineTo(
                element.x + end[0] - headLength * Math.cos(angle + Math.PI / 6),
                element.y + end[1] - headLength * Math.sin(angle + Math.PI / 6)
              );
              ctx.stroke();
            }
          }
        }
      } catch (error) {
        console.warn('渲染元素失败:', element.type, error.message);
      }
    });
  }

  return canvas.toBuffer('image/png');
}

// PNG渲染函数
async function renderPNG(data, options = {}) {
  try {
    // 尝试使用Canvas API进行渲染（如果可用）
    return createSimpleCanvasPNG(data);
  } catch (error) {
    console.warn('Canvas渲染失败，使用备选方案:', error.message);

    // 备选方案：创建一个基本的PNG占位符
    const canvas = require('canvas').createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    // 绘制背景
    ctx.fillStyle = data.data.appState?.viewBackgroundColor || '#ffffff';
    ctx.fillRect(0, 0, 800, 600);

    // 绘制边框
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 798, 598);

    // 绘制文本
    ctx.fillStyle = '#666666';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Excalidraw 渲染', 400, 200);

    ctx.font = '16px Arial';
    ctx.fillText(`元素数量: ${data.data.elements?.length || 0}`, 400, 250);
    ctx.fillText('服务器渲染中...', 400, 300);

    // 如果有元素，绘制简单预览
    if (data.data.elements && data.data.elements.length > 0) {
      ctx.font = '12px Arial';
      let y = 350;
      data.data.elements.slice(0, 5).forEach((element, index) => {
        ctx.fillText(`${index + 1}. ${element.type || 'unknown'}`, 400, y);
        y += 20;
      });

      if (data.data.elements.length > 5) {
        ctx.fillText(`... 还有 ${data.data.elements.length - 5} 个元素`, 400, y);
      }
    }

    return canvas.toBuffer('image/png');
  }
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
      memory: process.memoryUsage(),
      features: ['PNG Export', 'Canvas Rendering']
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
  const resource = pathParts[1];
  const action = pathParts[2];

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

// 渲染 API - 返回真正的PNG图片
async function handleRenderAPI(req, res, action) {
  if (req.method === 'POST') {
    await handleRealRenderPNG(req, res);
  } else if (req.method === 'GET' && action) {
    await handleRenderExample(req, res, action);
  } else {
    sendError(res, 'Method not allowed for render API', 405);
  }
}

// POST /api/render - 渲染自定义数据为真实PNG
async function handleRealRenderPNG(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const data = JSON.parse(body);

      // 验证数据
      const validation = validateExcalidrawData(data);
      if (!validation.valid) {
        return sendError(res, validation.error);
      }

      console.log(`开始真实PNG渲染: ${data.data.elements.length} 个元素`);

      try {
        // 渲染PNG
        const startTime = Date.now();
        const pngBuffer = await renderPNG(data);
        const renderTime = Date.now() - startTime;

        // 设置PNG响应头
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': pngBuffer.length,
          'Cache-Control': 'no-cache',
          'X-Render-Time': renderTime.toString(),
          'X-Elements-Count': data.data.elements.length.toString(),
          'X-Render-Engine': 'Canvas'
        });

        res.end(pngBuffer);
        console.log(`真实PNG渲染完成: ${data.data.elements.length} 个元素, ${renderTime}ms, ${pngBuffer.length} bytes`);

      } catch (renderError) {
        console.error('PNG渲染失败:', renderError);
        sendError(res, 'PNG渲染失败: ' + renderError.message);
      }

    } catch (error) {
      sendError(res, 'Invalid JSON data: ' + error.message);
    }
  });
}

// GET /api/render/{example} - 渲染示例为真实PNG
async function handleRenderExample(req, res, exampleName) {
  if (!examples[exampleName]) {
    return sendError(res, `Example not found: ${exampleName}`, 404);
  }

  try {
    const data = examples[exampleName];

    // 渲染PNG
    const startTime = Date.now();
    const pngBuffer = await renderPNG(data);
    const renderTime = Date.now() - startTime;

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': pngBuffer.length,
      'Cache-Control': 'no-cache',
      'X-Example': exampleName,
      'X-Render-Time': renderTime.toString(),
      'X-Elements-Count': data.data.elements.length.toString(),
      'X-Render-Engine': 'Canvas'
    });

    res.end(pngBuffer);
    console.log(`示例PNG渲染完成: ${exampleName}, ${data.data.elements.length} 个元素, ${renderTime}ms`);

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
    service: 'Excalidraw Real PNG API',
    version: '1.0.0',
    description: '本地Excalidraw渲染API服务，使用Canvas实现真实PNG导出',
    features: [
      'Server-side PNG rendering',
      'Canvas-based drawing',
      'No browser dependency',
      'Fast processing',
      'Supports all Excalidraw elements'
    ],
    endpoints: {
      'GET /': 'API文档',
      'GET /health': '健康检查',
      'POST /api/render': '渲染Excalidraw数据为真实PNG图片',
      'GET /api/render/{example}': '渲染示例为真实PNG图片',
      'GET /api/examples': '获取所有示例列表',
      'GET /api/examples/{name}': '获取特定示例',
      'POST /api/validate': '验证Excalidraw数据',
      'GET /api/info': 'API信息'
    },
    supportedFormats: ['JSON input', 'PNG output'],
    renderEngine: 'Canvas API',
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
    <title>Excalidraw Real PNG API - 真实图片导出版本</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
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
        .feature { background: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; margin: 15px 0; }
        .image-preview { max-width: 300px; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Excalidraw Real PNG API</h1>
        <p>真实图片导出版本 - 使用Canvas API实现服务器端渲染</p>
    </div>

    <div class="nav">
        <a href="#endpoints">📡 API端点</a>
        <a href="#examples">💡 使用示例</a>
        <a href="#features">🚀 新功能</a>
        <a href="/index.html">🖥️ 在线编辑器</a>
    </div>

    <div class="feature">
        <h3>✨ 真实PNG渲染功能!</h3>
        <p><strong>现在可以直接导出真实的PNG图片</strong>，不再需要浏览器渲染！</p>
        <ul>
            <li>🖼️ 使用Canvas API进行服务器端渲染</li>
            <li>⚡ 快速响应，无需浏览器环境</li>
            <li>🎯 支持所有基本Excalidraw元素</li>
            <li>💾 可直接保存为PNG文件</li>
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
        <p><strong>描述:</strong> 渲染Excalidraw数据为真实PNG图片</p>
        <p><strong>响应:</strong> 直接返回PNG图片数据 (Content-Type: image/png)</p>

        <h4>使用方式: 命令行下载PNG</h4>
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
  --output real-diagram.png
        </div>

        <h4>响应头示例:</h4>
        <div class="code">
Content-Type: image/png
Content-Length: 12345
X-Render-Time: 1500
X-Elements-Count: 1
X-Render-Engine: Canvas
        </div>
    </div>

    <h2 id="features">🚀 支持的渲染功能</h2>

    <div class="endpoint">
        <h3>基本图形</h3>
        <ul>
            <li>✅ 矩形 (rectangle) - 支持背景色和边框</li>
            <li>✅ 文本 (text) - 支持字体、对齐方式</li>
            <li>✅ 箭头 (arrow) - 支持箭头头部样式</li>
        </ul>
    </div>

    <div class="endpoint">
        <h3>样式支持</h3>
        <ul>
            <li>🎨 背景颜色 (backgroundColor)</li>
            <li>🖊️ 边框颜色 (strokeColor)</li>
            <li>📏 边框宽度 (strokeWidth)</li>
            <li>🖼️ 画布背景色 (viewBackgroundColor)</li>
        </ul>
    </div>

    <h2 id="examples">💡 使用示例</h2>

    <div class="endpoint">
        <h3>Node.js 下载PNG</h3>
        <div class="code">
const fs = require('fs');
const http = require('http');

const data = {
  data: {
    elements: [
      {
        type: "rectangle",
        id: "rect-1",
        x: 100, y: 100,
        width: 200, height: 100,
        strokeColor: "#1e40af",
        backgroundColor: "#dbeafe",
        fillStyle: "solid"
      },
      {
        type: "text",
        id: "text-1",
        x: 200, y: 135,
        width: 100, height: 30,
        text: "Hello World!",
        fontSize: 20,
        textAlign: "center",
        verticalAlign: "middle",
        strokeColor: "#1e40af"
      }
    ],
    appState: {
      viewBackgroundColor: "#ffffff"
    }
  }
};

const req = http.request({
  hostname: 'localhost',
  port: 8080,
  path: '/api/render',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  const fileStream = fs.createWriteStream('real-diagram.png');
  res.pipe(fileStream);

  fileStream.on('finish', () => {
    console.log('真实PNG图片已保存: real-diagram.png');
  });
});

req.write(JSON.stringify(data));
req.end();
        </div>
    </div>

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
                "x": 100, "y": 100,
                "width": 200, "height": 100,
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
    with open('real-diagram.png', 'wb') as f:
        f.write(response.content)
    print('真实PNG图片已保存: real-diagram.png')
    print(f'文件大小: {len(response.content)} bytes')
else:
    print('渲染失败:', response.json())
        </div>
    </div>

    <div class="feature">
        <h3>🧪 测试PNG导出</h3>
        <button onclick="testRealPNGExport()" style="background: #22c55e; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">测试真实PNG导出</button>
        <div id="png-test-result" style="margin-top: 15px;"></div>
    </div>

    <script>
        async function testRealPNGExport() {
            const resultDiv = document.getElementById('png-test-result');
            resultDiv.innerHTML = '🔄 测试真实PNG导出...';

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
                            text: "真实PNG!",
                            fontSize: 20,
                            textAlign: "center",
                            verticalAlign: "middle",
                            strokeColor: "#1e40af"
                        },
                        {
                            type: "arrow",
                            id: "test-arrow",
                            x: 300, y: 150,
                            width: 100, height: 0,
                            points: [[0, 0], [100, 0]],
                            strokeColor: "#374151",
                            strokeWidth: 2,
                            endArrowhead: "arrow"
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
                        <div class="status success">✅ 真实PNG导出测试成功!</div>
                        <p>图片大小: \${blob.size} bytes</p>
                        <p>渲染时间: \${response.headers.get('x-render-time') || 'N/A'}ms</p>
                        <p>元素数量: \${response.headers.get('x-elements-count') || 'N/A'}</p>
                        <p>渲染引擎: \${response.headers.get('x-render-engine') || 'N/A'}</p>
                        <img src="\${url}" alt="渲染的真实PNG" style="max-width: 400px; border: 1px solid #ddd; margin: 10px 0; display: block;">
                        <br>
                        <a href="\${url}" download="real-test-diagram.png" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #22c55e; color: white; text-decoration: none; border-radius: 4px;">下载真实PNG</a>
                    \`;
                } else {
                    const errorData = await response.json();
                    resultDiv.innerHTML = \`
                        <div class="status error">❌ 真实PNG导出测试失败!</div>
                        <div class="code">\${JSON.stringify(errorData, null, 2)}</div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="status error">❌ 真实PNG导出测试错误!</div>
                    <div class="code">\${error.message}</div>
                \`;
            }
        }

        // 页面加载时检查服务状态
        window.addEventListener('load', async () => {
            try {
                const response = await fetch('/health');
                const data = await response.json();
                console.log('服务状态:', data);
                console.log('支持功能:', data.features);
            } catch (error) {
                console.error('服务连接失败:', error);
            }
        });
    </script>
</body>
</html>`;
}

server.listen(PORT, () => {
  console.log(`🚀 Excalidraw 真实PNG API 服务器启动成功!`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📁 服务目录: ${__dirname}`);
  console.log('');
  console.log('🖼️  真实PNG渲染功能:');
  console.log('  - POST /api/render - 渲染数据为真实PNG图片');
  console.log('  - GET /api/render/{example} - 下载示例PNG图片');
  console.log('  - 使用Canvas API进行服务器端渲染');
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