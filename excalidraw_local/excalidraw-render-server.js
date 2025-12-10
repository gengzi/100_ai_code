const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const puppeteer = require('puppeteer');

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
  '.svg': 'image/svg+xml'
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
          "text": "Hello Excalidraw!",
          "fontSize": 20,
          "fontFamily": 1,
          "textAlign": "center",
          "verticalAlign": "middle",
          "containerId": null,
          "originalText": "Hello Excalidraw!",
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
      "scrollToContent": true
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
      "scrollToContent": true
    }
  }
};

// 创建用于Puppeteer渲染的HTML模板
function createExcalidrawHTML(data, options = {}) {
  const width = options.width || 1920;
  const height = options.height || 1080;
  const backgroundColor = data.data.appState?.viewBackgroundColor || '#ffffff';

  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Excalidraw Render</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            background: ${backgroundColor};
            width: ${width}px;
            height: ${height}px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #excalidraw {
            width: 100%;
            height: 100%;
        }
        .loading {
            font-family: Arial, sans-serif;
            font-size: 20px;
            color: #666;
            text-align: center;
            padding: 50px;
        }
    </style>
    <script src="react.production.min.js"></script>
    <script src="react-dom.production.min.js"></script>
    <script src="excalidraw.production.min.js"></script>
    <script>
        // 确保React和ReactDOM在全局作用域中可用
        if (typeof React === 'undefined') {
            console.error('React 未加载');
        }
        if (typeof ReactDOM === 'undefined') {
            console.error('ReactDOM 未加载');
        }
        if (typeof ExcalidrawLib === 'undefined') {
            console.error('ExcalidrawLib 未加载');
        }
    </script>
</head>
<body>
    <div id="excalidraw">
        <div class="loading">正在初始化 Excalidraw...</div>
    </div>
    <script>
        // 等待所有脚本加载完成
        function waitForScripts() {
            return new Promise((resolve) => {
                const checkLoaded = () => {
                    if (typeof React !== 'undefined' &&
                        typeof ReactDOM !== 'undefined' &&
                        typeof ExcalidrawLib !== 'undefined') {
                        resolve();
                    } else {
                        setTimeout(checkLoaded, 50);
                    }
                };
                checkLoaded();
            });
        }

        // 初始化应用
        waitForScripts().then(() => {
            // Excalidraw 数据
            const excalidrawData = ${JSON.stringify(data)};
            const renderOptions = ${JSON.stringify(options)};

            // 全局变量
            let excalidrawAPI = null;
            let renderComplete = false;
            let renderError = null;
            let pngData = null;

        // 等待渲染完成的函数
        window.waitForRender = function() {
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    if (!renderComplete) {
                        reject(new Error('渲染超时 (30秒)'));
                    }
                }, 30000);

                const checkRender = () => {
                    if (renderComplete) {
                        clearTimeout(timeout);
                        if (renderError) {
                            reject(new Error(renderError));
                        } else {
                            resolve(pngData);
                        }
                    } else {
                        setTimeout(checkRender, 100);
                    }
                };

                // 延迟开始检查，让React有时间初始化
                setTimeout(checkRender, 100);
            });
        };

        // 检查库是否正确加载
        function checkLibraries() {
            const checks = [
                { name: 'React', obj: window.React },
                { name: 'ReactDOM', obj: window.ReactDOM },
                { name: 'ExcalidrawLib', obj: window.ExcalidrawLib }
            ];

            for (const check of checks) {
                if (typeof check.obj === 'undefined') {
                    console.error(check.name + ' 未加载');
                    renderError = check.name + ' 未加载';
                    renderComplete = true;
                    return false;
                } else {
                    console.log(check.name + ' 加载成功');
                }
            }
            return true;
        }

        // 延迟初始化检查
        setTimeout(() => {
            if (!checkLibraries()) {
                return;
            }
        }, 100);

            // 检查库是否正确加载
            function checkLibraries() {
                const checks = [
                    { name: 'React', obj: window.React },
                    { name: 'ReactDOM', obj: window.ReactDOM },
                    { name: 'ExcalidrawLib', obj: window.ExcalidrawLib }
                ];

                for (const check of checks) {
                    if (typeof check.obj === 'undefined') {
                        console.error(check.name + ' 未加载');
                        renderError = check.name + ' 未加载';
                        renderComplete = true;
                        return false;
                    } else {
                        console.log(check.name + ' 加载成功');
                    }
                }
                return true;
            }

            // 延迟初始化检查
            setTimeout(() => {
                if (!checkLibraries()) {
                    return;
                }
            }, 100);

            // React 组件
            const App = () => {
                const [api, setApi] = React.useState(null);

                React.useEffect(() => {
                    if (api && !excalidrawAPI) {
                        excalidrawAPI = api;

                        try {
                            console.log('开始渲染 Excalidraw 场景...');

                            // 更新场景数据
                            api.updateScene({
                                ...excalidrawData.data,
                                scrollToContent: true // 确保内容居中显示
                            });

                            // 等待渲染完成后导出PNG
                            setTimeout(async () => {
                                try {
                                    console.log('开始导出 PNG...');

                                    const exportOptions = {
                                        exportBackground: true,
                                        viewBackgroundColor: excalidrawData.data.appState?.viewBackgroundColor || '#ffffff',
                                        ...renderOptions
                                    };

                                    const pngBlob = await api.exportPng(exportOptions);

                                    // 转换为Base64
                                    const arrayBuffer = await pngBlob.arrayBuffer();
                                    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

                                    pngData = base64;
                                    renderComplete = true;
                                    renderError = null;

                                    console.log('PNG 导出成功，数据长度:', base64.length);
                                    console.log('Blob 大小:', pngBlob.size, 'bytes');

                                } catch (error) {
                                    console.error('PNG 导出失败:', error);
                                    renderError = error.message || 'PNG导出过程中发生错误';
                                    renderComplete = true;
                                }
                            }, 4000); // 等待4秒确保完全渲染

                        } catch (error) {
                            console.error('场景更新失败:', error);
                            renderError = error.message || '场景更新失败';
                            renderComplete = true;
                        }
                    }
                }, [api]);

                return React.createElement(ExcalidrawLib.Excalidraw, {
                    initialData: excalidrawData.data,
                    excalidrawRef: setApi,
                    viewModeEnabled: true,
                    zenModeEnabled: true,
                    gridModeEnabled: false,
                    theme: "light",
                    autoFocus: false
                });
            };

            // 渲染 React 应用
            try {
                const container = document.getElementById('excalidraw');
                ReactDOM.render(React.createElement(App), container);
                console.log('React 应用启动成功');
            } catch (error) {
                console.error('React 渲染失败:', error);
                renderError = error.message || 'React应用启动失败';
                renderComplete = true;
            }
        });
    </script>
</body>
</html>`;
}

// 使用Puppeteer进行真实的PNG渲染
async function renderPNGWithPuppeteer(data, options = {}) {
  let browser = null;
  let page = null;

  try {
    console.log('启动 Puppeteer 浏览器...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--allow-running-insecure-content'
      ]
    });

    page = await browser.newPage();

    // 设置视口大小
    const width = options.width || 1920;
    const height = options.height || 1080;
    await page.setViewport({ width, height });

    // 创建HTML内容
    const html = createExcalidrawHTML(data, options);

    // 设置页面内容
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // 等待Excalidraw完成渲染
    console.log('等待 Excalidraw 渲染完成...');
    const renderResult = await page.evaluate(() => {
      return window.waitForRender();
    });

    if (renderResult) {
      console.log('获取到 PNG Base64 数据');

      // 将Base64转换为Buffer
      const pngBuffer = Buffer.from(renderResult, 'base64');

      console.log(`PNG 渲染完成，大小: ${pngBuffer.length} bytes`);
      return pngBuffer;
    } else {
      throw new Error('渲染结果为空');
    }

  } catch (error) {
    console.error('Puppeteer 渲染失败:', error);
    throw new Error('PNG渲染失败: ' + error.message);
  } finally {
    // 清理资源
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.warn('关闭页面失败:', e.message);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.warn('关闭浏览器失败:', e.message);
      }
    }
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
      features: ['Excalidraw Native Export', 'Puppeteer Rendering', 'Perfect Centering']
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

// 渲染 API - 使用真正的Excalidraw导出
async function handleRenderAPI(req, res, action) {
  if (req.method === 'POST') {
    await handleExcalidrawRender(req, res);
  } else if (req.method === 'GET' && action) {
    await handleRenderExample(req, res, action);
  } else {
    sendError(res, 'Method not allowed for render API', 405);
  }
}

// POST /api/render - 使用真实Excalidraw渲染
async function handleExcalidrawRender(req, res) {
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

      console.log(`开始 Excalidraw 渲染: ${data.data.elements.length} 个元素`);

      try {
        // 使用Puppeteer进行真实渲染
        const startTime = Date.now();
        const pngBuffer = await renderPNGWithPuppeteer(data, {
          width: 1920,
          height: 1080
        });
        const renderTime = Date.now() - startTime;

        // 设置PNG响应头
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': pngBuffer.length,
          'Cache-Control': 'no-cache',
          'X-Render-Time': renderTime.toString(),
          'X-Elements-Count': data.data.elements.length.toString(),
          'X-Render-Engine': 'Excalidraw-Puppeteer'
        });

        res.end(pngBuffer);
        console.log(`Excalidraw PNG 渲染完成: ${data.data.elements.length} 个元素, ${renderTime}ms, ${pngBuffer.length} bytes`);

      } catch (renderError) {
        console.error('Excalidraw PNG 渲染失败:', renderError);
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
    const pngBuffer = await renderPNGWithPuppeteer(data, {
      width: 1920,
      height: 1080
    });
    const renderTime = Date.now() - startTime;

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': pngBuffer.length,
      'Cache-Control': 'no-cache',
      'X-Example': exampleName,
      'X-Render-Time': renderTime.toString(),
      'X-Elements-Count': data.data.elements.length.toString(),
      'X-Render-Engine': 'Excalidraw-Puppeteer'
    });

    res.end(pngBuffer);
    console.log(`示例 Excalidraw PNG 渲染完成: ${exampleName}, ${data.data.elements.length} 个元素, ${renderTime}ms`);

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
    service: 'Excalidraw Native Export API',
    version: '1.0.0',
    description: '使用真实Excalidraw渲染引擎和Puppeteer进行服务器端PNG导出',
    features: [
      'Native Excalidraw Rendering',
      'Puppeteer Browser Engine',
      'Perfect Element Positioning',
      'Automatic Canvas Centering',
      'All Excalidraw Features',
      'High Quality PNG Export'
    ],
    endpoints: {
      'GET /': 'API文档',
      'GET /health': '健康检查',
      'POST /api/render': '使用真实Excalidraw引擎渲染PNG',
      'GET /api/render/{example}': '渲染示例为PNG',
      'GET /api/examples': '获取所有示例列表',
      'GET /api/examples/{name}': '获取特定示例',
      'POST /api/validate': '验证Excalidraw数据',
      'GET /api/info': 'API信息'
    },
    supportedFormats: ['JSON input', 'PNG output'],
    renderEngine: 'Excalidraw + Puppeteer',
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
    <title>Excalidraw Native Export API - 真实渲染引擎</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
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
        .feature { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 15px 0; }
        .image-preview { max-width: 400px; border: 1px solid #ddd; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 Excalidraw Native Export API</h1>
        <p>使用真实Excalidraw渲染引擎和Puppeteer - 完美的PNG导出</p>
    </div>

    <div class="nav">
        <a href="#endpoints">📡 API端点</a>
        <a href="#features">🚀 核心特性</a>
        <a href="#examples">💡 使用示例</a>
        <a href="/index.html">🖥️ 在线编辑器</a>
    </div>

    <div class="feature">
        <h3>✨ 真正的Excalidraw渲染引擎!</h3>
        <p><strong>现在使用真实的Excalidraw导出API</strong>，完美支持所有功能！</p>
        <ul>
            <li>🎯 使用Puppeteer无头浏览器</li>
            <li>🖼️ 真正的Excalidraw渲染引擎</li>
            <li>📐 自动居中和完美布局</li>
            <li>⚡ 支持所有Excalidraw特性</li>
            <li>🎨 高质量PNG输出</li>
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
        <p><strong>描述:</strong> 使用真实Excalidraw引擎渲染PNG图片</p>
        <p><strong>响应:</strong> 直接返回PNG图片数据 (Content-Type: image/png)</p>

        <h4>完整使用示例:</h4>
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
        },
        {
          "type": "text",
          "id": "text-1",
          "x": 200,
          "y": 135,
          "width": 100,
          "height": 30,
          "text": "Hello Excalidraw!",
          "fontSize": 20,
          "textAlign": "center",
          "verticalAlign": "middle",
          "strokeColor": "#1e40af"
        }
      ],
      "appState": {
        "viewBackgroundColor": "#ffffff"
      }
    }
  }' \\
  --output excalidraw-native.png
        </div>

        <h4>响应头包含:</h4>
        <div class="code">
Content-Type: image/png
Content-Length: [文件大小]
X-Render-Time: [渲染时间]
X-Elements-Count: [元素数量]
X-Render-Engine: Excalidraw-Puppeteer
        </div>
    </div>

    <h2 id="features">🚀 核心特性</h2>

    <div class="endpoint">
        <h3>✨ 完美的渲染特性</h3>
        <ul>
            <li><strong>真实Excalidraw引擎</strong> - 100%兼容官方渲染</li>
            <li><strong>自动居中</strong> - scrollToContent自动居中所有元素</li>
            <li><strong>完整功能支持</strong> - 支持所有图形类型和样式</li>
            <li><strong>高质量输出</strong> - 保持原始清晰度和样式</li>
            <li><strong>稳定可靠</strong> - Puppeteer无头浏览器引擎</li>
        </ul>
    </div>

    <h2 id="examples">💡 编程语言示例</h2>

    <div class="endpoint">
        <h3>JavaScript / Node.js</h3>
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
        text: "完美渲染!",
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
  const fileStream = fs.createWriteStream('excalidraw-native.png');
  res.pipe(fileStream);

  fileStream.on('finish', () => {
    console.log('✅ Excalidraw原生PNG已保存: excalidraw-native.png');
    console.log('📏 文件大小:', res.headers['content-length'], 'bytes');
    console.log('⏱️ 渲染时间:', res.headers['x-render-time'], 'ms');
  });
});

req.write(JSON.stringify(data));
req.end();
        </div>
    </div>

    <div class="endpoint">
        <h3>Python</h3>
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
            },
            {
                "type": "text",
                "id": "text-1",
                "x": 200, "y": 135,
                "width": 100, "height": 30,
                "text": "Python测试!",
                "fontSize": 20,
                "textAlign": "center",
                "verticalAlign": "middle",
                "strokeColor": "#1e40af"
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
    with open('excalidraw-python.png', 'wb') as f:
        f.write(response.content)

    print('✅ Excalidraw原生PNG已保存: excalidraw-python.png')
    print('📏 文件大小:', len(response.content), 'bytes')
    print('⏱️ 渲染时间:', response.headers.get('x-render-time'), 'ms')
    print('🔢 元素数量:', response.headers.get('x-elements-count'))
    print('🔧 渲染引擎:', response.headers.get('x-render-engine'))
else:
    print('❌ 渲染失败:', response.json())
        </div>
    </div>

    <div class="feature">
        <h3>🧪 在线测试</h3>
        <button onclick="testNativeExport()" style="background: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 16px;">测试原生Excalidraw导出</button>
        <div id="png-test-result" style="margin-top: 15px;"></div>
    </div>

    <script>
        async function testNativeExport() {
            const resultDiv = document.getElementById('png-test-result');
            resultDiv.innerHTML = '🔄 启动原生Excalidraw渲染...';

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
                            text: "原生渲染!",
                            fontSize: 20,
                            textAlign: "center",
                            verticalAlign": "middle",
                            strokeColor: "#1e40af"
                        },
                        {
                            type: "ellipse",
                            id: "test-ellipse",
                            x: 400, y: 100,
                            width: 150, height: 80,
                            strokeColor: "#dc2626",
                            backgroundColor: "#fecaca",
                            fillStyle: "solid"
                        },
                        {
                            type: "arrow",
                            id: "test-arrow",
                            x: 300, y: 140,
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
                        <div class="status success">✅ 原生Excalidraw渲染成功!</div>
                        <p>📏 图片大小: \${blob.size} bytes</p>
                        <p>⏱️ 渲染时间: \${response.headers.get('x-render-time') || 'N/A'}ms</p>
                        <p>🔢 元素数量: \${response.headers.get('x-elements-count') || 'N/A'}</p>
                        <p>🔧 渲染引擎: \${response.headers.get('x-render-engine') || 'N/A'}</p>
                        <img src="\${url}" alt="原生渲染的Excalidraw PNG" style="max-width: 600px; border: 1px solid #ddd; margin: 10px 0; display: block;">
                        <br>
                        <a href="\${url}" download="excalidraw-native-render.png" style="display: inline-block; margin-top: 10px; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 4px; font-size: 16px;">下载原生PNG</a>
                    \`;
                } else {
                    const errorData = await response.json();
                    resultDiv.innerHTML = \`
                        <div class="status error">❌ 原生渲染测试失败!</div>
                        <div class="code">\${JSON.stringify(errorData, null, 2)}</div>
                    \`;
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="status error">❌ 原生渲染测试错误!</div>
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
  console.log(`🎨 Excalidraw Native Export API 服务器启动成功!`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📁 服务目录: ${__dirname}`);
  console.log('');
  console.log('🖼️  真实Excalidraw渲染功能:');
  console.log('  - POST /api/render - 使用原生Excalidraw引擎渲染PNG');
  console.log('  - GET /api/render/{example} - 渲染示例为PNG');
  console.log('  - Puppeteer无头浏览器引擎');
  console.log('  - 自动居中和完美布局');
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