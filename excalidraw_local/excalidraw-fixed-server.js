const http = require('http');
const url = require('url');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 简化的测试数据
const simpleData = {
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
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
      "x": 150,
      "y": 130,
      "width": 100,
      "height": 40,
      "angle": 0,
      "strokeColor": "#1e40af",
      "backgroundColor": "transparent",
      "fillStyle": "solid",
      "strokeWidth": 2,
      "strokeStyle": "solid",
      "roughness": 1,
      "opacity": 100,
      "groupIds": [],
      "seed": 12346,
      "roundness": null,
      "boundElements": null,
      "updated": 1,
      "link": null,
      "locked": false,
      "text": "Hello World",
      "fontSize": 20,
      "fontFamily": 1,
      "textAlign": "center",
      "verticalAlign": "middle",
      "containerId": null,
      "originalText": "Hello World",
      "lineHeight": 1.25
    }
  ],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff",
    "currentItemStrokeColor": "#1e40af",
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
    "scrollX": 0,
    "scrollY": 0,
    "zoom": {
      "value": 1
    },
    "viewModeEnabled": false,
    "zenModeEnabled": false,
    "gridModeEnabled": false
  },
  "files": {}
};

// 创建干净的HTML模板
function createCleanHTMLTemplate(data, options = {}) {
  const width = options.width || 1920;
  const height = options.height || 1080;
  const backgroundColor = data.data?.appState?.viewBackgroundColor || '#ffffff';

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
</head>
<body>
    <div id="excalidraw">
        <div class="loading">Loading Excalidraw...</div>
    </div>

    <script>
        // 全局渲染等待函数 - 必须在React加载前定义
        window.waitForRender = function() {
            console.log('waitForRender 被调用');
            return new Promise((resolve, reject) => {
                // 检查函数是否存在
                if (!window.waitForRenderInternal) {
                    reject(new Error('waitForRenderInternal 函数未定义'));
                    return;
                }
                return window.waitForRenderInternal(resolve, reject);
            });
        };
    </script>
    <script>
        // 这个脚本会在React等库加载后由Puppeteer注入
        // 主要逻辑会在库加载完成后执行
    </script>
</body>
</html>`;
}

// 使用Puppeteer渲染PNG
async function renderPNGWithPuppeteer(data, options = {}) {
  let browser = null;
  let page = null;

  try {
    console.log('启动 Puppeteer...');
    browser = await puppeteer.launch({
      headless: "new",
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    page = await browser.newPage();
    await page.setViewport({
      width: options.width || 1920,
      height: options.height || 1080
    });

    // 创建基础HTML内容（不包含脚本标签）
    const htmlContent = createCleanHTMLTemplate(data, options);

    // 设置页面内容
    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded'
    });

    // 直接注入JavaScript库
    const reactScript = fs.readFileSync(path.join(__dirname, 'react.production.min.js'), 'utf8');
    const ReactDOMScript = fs.readFileSync(path.join(__dirname, 'react-dom.production.min.js'), 'utf8');
    const excalidrawScript = fs.readFileSync(path.join(__dirname, 'excalidraw.production.min.js'), 'utf8');

    await page.evaluate((reactCode, ReactDOMCode, excalidrawCode) => {
      // 创建script标签并注入React
      const reactScript = document.createElement('script');
      reactScript.textContent = reactCode;
      document.head.appendChild(reactScript);

      // 创建script标签并注入ReactDOM
      const ReactDOMScript = document.createElement('script');
      ReactDOMScript.textContent = ReactDOMCode;
      document.head.appendChild(ReactDOMScript);

      // 创建script标签并注入Excalidraw
      const excalidrawScript = document.createElement('script');
      excalidrawScript.textContent = excalidrawCode;
      document.head.appendChild(excalidrawScript);
    }, reactScript, ReactDOMScript, excalidrawScript);

    // 等待库加载
    await page.waitForFunction(() => {
      return typeof window.React !== 'undefined' &&
             typeof window.ReactDOM !== 'undefined' &&
             typeof window.ExcalidrawLib !== 'undefined';
    }, { timeout: 15000 });

    console.log('JavaScript 库加载完成');

    // 注入主要逻辑脚本
    const mainScript = `
        // 全局变量
        let renderComplete = false;
        let renderError = null;
        let pngData = null;
        let excalidrawAPI = null;

        // Excalidraw数据
        const excalidrawData = ${JSON.stringify(data)};

        // 内部渲染等待函数
        window.waitForRenderInternal = function(resolve, reject) {
            console.log('waitForRenderInternal 开始');
            let checkCount = 0;

            const timeout = setTimeout(() => {
                console.log('渲染超时，检查次数:', checkCount);
                console.log('renderComplete:', renderComplete);
                console.log('renderError:', renderError);
                if (!renderComplete) {
                    reject(new Error('渲染超时 (60秒)'));
                }
            }, 60000); // 增加到60秒

            const checkRender = () => {
                checkCount++;
                if (checkCount % 50 === 0) { // 每5秒打印一次状态
                    console.log('检查渲染状态 ' + checkCount + ': complete=' + renderComplete + ', error=' + renderError);
                }

                if (renderComplete) {
                    clearTimeout(timeout);
                    if (renderError) {
                        reject(new Error(renderError));
                    } else {
                        console.log('渲染完成，返回 PNG 数据，长度:', pngData ? pngData.length : 'null');
                        resolve(pngData);
                    }
                } else {
                    setTimeout(checkRender, 100);
                }
            };

            // 延迟开始检查，让React有时间初始化
            setTimeout(checkRender, 2000);
        };

        // React组件
        const App = () => {
            const [api, setApi] = React.useState(null);
            console.log('React App 组件渲染');

            React.useEffect(() => {
                console.log('React useEffect 触发, api:', api ? '已设置' : 'null');
                if (api && !excalidrawAPI) {
                    excalidrawAPI = api;
                    console.log('Excalidraw API 已设置');

                    try {
                        console.log('开始渲染 Excalidraw 场景...', excalidrawData);

                        // 更新场景数据
                        api.updateScene({
                            ...excalidrawData.data || excalidrawData,
                            scrollToContent: true
                        });
                        console.log('场景数据已更新');

                        // 等待渲染完成后导出PNG
                        setTimeout(async () => {
                            console.log('开始导出 PNG...');
                            try {
                                if (!api || !api.getPNGContainer) {
                                    console.log('API 不可用:', { api: !!api, getPNGContainer: !!(api && api.getPNGContainer) });
                                    renderError = 'Excalidraw API 不可用';
                                    renderComplete = true;
                                    return;
                                }

                                console.log('调用 getPNGContainer...');
                                const pngBlob = await api.getPNGContainer({
                                    exportBackground: true,
                                    viewBackgroundColor: excalidrawData.data?.appState?.viewBackgroundColor || '#ffffff'
                                });
                                console.log('getPNGContainer 返回:', pngBlob);

                                if (pngBlob) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        pngData = reader.result;
                                        renderComplete = true;
                                        console.log('PNG 导出完成，数据长度:', pngData.length);
                                    };
                                    reader.readAsDataURL(pngBlob);
                                } else {
                                    renderError = 'PNG 导出失败 - blob 为 null';
                                    renderComplete = true;
                                }
                            } catch (error) {
                                console.error('PNG 导出错误:', error);
                                renderError = 'PNG 导出错误: ' + error.message;
                                renderComplete = true;
                            }
                        }, 3000); // 增加等待时间

                    } catch (error) {
                        console.error('渲染错误:', error);
                        renderError = '渲染错误: ' + error.message;
                        renderComplete = true;
                    }
                }
            }, [api]);

            console.log('创建 Excalidraw 组件');
            const excalidrawElement = React.createElement(
                window.ExcalidrawLib.Excalidraw,
                {
                    ref: setApi,
                    width: ${options.width || 1920},
                    height: ${options.height || 1080},
                    initialData: excalidrawData.data || excalidrawData,
                    viewModeEnabled: true,
                    zenModeEnabled: true,
                    gridModeEnabled: false,
                    theme: "light"
                }
            );

            return React.createElement('div', {
                style: { width: '100%', height: '100%' }
            }, excalidrawElement);
        };

        // 初始化
        setTimeout(() => {
            try {
                // 渲染React组件
                const root = ReactDOM.createRoot(document.getElementById('excalidraw'));
                root.render(React.createElement(App));
                console.log('React 组件已渲染');
            } catch (error) {
                console.error('React 渲染错误:', error);
                renderError = 'React 渲染错误: ' + error.message;
                renderComplete = true;
            }
        }, 100);

        console.log('主要逻辑初始化完成');
    `;

    await page.evaluate(mainScript);
    console.log('主要逻辑脚本注入完成');

    console.log('等待渲染完成...');
    const renderResult = await page.evaluate(async () => {
      try {
        console.log('开始等待渲染...');
        console.log('检查 window.waitForRender:', typeof window.waitForRender);
        console.log('检查 window.waitForRenderInternal:', typeof window.waitForRenderInternal);

        if (typeof window.waitForRender !== 'function') {
          throw new Error('window.waitForRender is not a function, type: ' + typeof window.waitForRender);
        }

        const result = await window.waitForRender();
        console.log('渲染完成，获得结果');
        return result;
      } catch (error) {
        console.error('渲染失败:', error);
        throw error;
      }
    });

    if (renderResult) {
      console.log('获取到 PNG Base64 数据');

      // 将Base64转换为Buffer
      const base64Data = renderResult.replace(/^data:image\/png;base64,/, '');
      const pngBuffer = Buffer.from(base64Data, 'base64');

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

// 发送JSON响应
function sendJSON(res, data) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

// 发送错误响应
function sendError(res, message, code = 500) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({
    error: true,
    message: message,
    timestamp: new Date().toISOString()
  }, null, 2));
}

// 静态文件服务
function serveStaticFile(req, res, pathname) {
  const filePath = path.join(__dirname, pathname);

  if (!fs.existsSync(filePath)) {
    sendError(res, '文件未找到: ' + pathname, 404);
    return;
  }

  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml'
  };

  const contentType = contentTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendError(res, '读取文件失败: ' + err.message, 500);
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

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
      default:
        sendError(res, '未知的API端点: ' + pathname, 404);
        break;
    }
  } catch (error) {
    console.error('API 处理错误:', error);
    sendError(res, 'API内部错误: ' + error.message, 500);
  }
}

// 渲染API处理
function handleRenderAPI(req, res, action) {
  if (req.method !== 'POST') {
    sendError(res, '仅支持 POST 请求', 405);
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      let data;
      try {
        data = JSON.parse(body);
      } catch (parseError) {
        sendError(res, '无效的JSON数据', 400);
        return;
      }

      if (!data.elements || !Array.isArray(data.elements)) {
        sendError(res, '数据格式错误：缺少 elements 数组', 400);
        return;
      }

      console.log(`开始渲染 PNG，包含 ${data.elements.length} 个元素`);

      const pngBuffer = await renderPNGWithPuppeteer(data, {
        width: 1920,
        height: 1080
      });

      if (pngBuffer && pngBuffer.length > 0) {
        res.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': pngBuffer.length,
          'Cache-Control': 'no-cache'
        });
        res.end(pngBuffer);
        console.log('PNG 响应发送成功');
      } else {
        sendError(res, '生成的PNG为空', 500);
      }
    } catch (error) {
      console.error('渲染错误:', error);
      sendError(res, '渲染失败: ' + error.message, 500);
    }
  });
}

// 示例API处理
function handleExamplesAPI(req, res, action) {
  if (req.method !== 'GET') {
    sendError(res, '仅支持 GET 请求', 405);
    return;
  }

  switch (action) {
    case 'simple':
      sendJSON(res, {
        name: '简单流程图',
        description: '包含矩形和文本的简单示例',
        data: simpleData
      });
      break;
    case 'complex':
      sendJSON(res, {
        name: '复杂图表',
        description: '更复杂的Excalidraw图表',
        data: simpleData // 复用简单数据
      });
      break;
    default:
      sendJSON(res, {
        examples: ['simple', 'complex'],
        current: 'examples'
      });
      break;
  }
}

// 创建API文档
function createAPIDocumentation() {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Excalidraw 渲染 API 文档</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
        h2 { color: #2563eb; margin-top: 30px; }
        .endpoint { background: #e0e7ff; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .method { display: inline-block; padding: 3px 8px; border-radius: 3px; color: white; font-weight: bold; margin-right: 10px; }
        .get { background: #22c55e; }
        .post { background: #3b82f6; }
        .code { background: #f3f4f6; padding: 10px; border-radius: 5px; font-family: monospace; white-space: pre-wrap; }
        .response { background: #fef3c7; padding: 10px; border-radius: 5px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Excalidraw 本地渲染 API</h1>
        <p><strong>版本:</strong> 1.0.0 | <strong>状态:</strong> 运行中 | <strong>特性:</strong> 真实Excalidraw渲染引擎</p>

        <h2>📋 API 端点</h2>

        <div class="endpoint">
            <span class="method post">POST</span>
            <strong>/api/render</strong>
            <p>渲染 Excalidraw 数据为 PNG 图片</p>
            <div class="code">POST 请求体格式:
{
  "elements": [...],
  "appState": {...},
  "files": {...}
}</div>
            <div class="response">响应: PNG 图片 (直接返回图片数据)</div>
        </div>

        <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/api/examples/simple</strong>
            <p>获取简单示例数据</p>
            <div class="response">响应: JSON 格式的示例数据</div>
        </div>

        <div class="endpoint">
            <span class="method get">GET</span>
            <strong>/health</strong>
            <p>服务健康检查</p>
            <div class="response">响应: JSON 格式的服务状态</div>
        </div>

        <h2>🚀 使用示例</h2>
        <div class="code">curl -X POST http://localhost:8080/api/render \\
  -H "Content-Type: application/json" \\
  -d '{"elements": [{"id": "rect-1", "type": "rectangle", "x": 100, "y": 100, "width": 200, "height": 100, "strokeColor": "#1e40af", "backgroundColor": "#dbeafe", "fillStyle": "solid", "strokeWidth": 2, "strokeStyle": "solid", "roughness": 1, "opacity": 100, "groupIds": [], "seed": 12345}], "appState": {"viewBackgroundColor": "#ffffff"}, "files": {}}' \\
  --output diagram.png</div>
    </div>
</body>
</html>`;
}

// 创建HTTP服务器
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
      features: ['Fixed waitForRender', 'Clean HTML Template', 'Real Excalidraw Rendering']
    });
    return;
  }

  // API 文档
  if (pathname === '/api-docs' || pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(createAPIDocumentation());
    return;
  }

  // 静态文件服务
  serveStaticFile(req, res, pathname);
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`🚀 Excalidraw 渲染服务器已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`📖 API 文档: http://localhost:${PORT}/api-docs`);
  console.log(`🔧 渲染端点: http://localhost:${PORT}/api/render`);
  console.log(`✅ 特性: 真实Excalidraw渲染引擎，完美居中，高质量PNG导出`);
});