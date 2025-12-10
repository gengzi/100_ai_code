const http = require('http');

const API_BASE = 'http://localhost:8080';

// 测试数据
const testData = {
  simple: {
    "data": {
      "elements": [
        {
          "type": "rectangle",
          "id": "rect-test",
          "x": 100,
          "y": 100,
          "width": 200,
          "height": 100,
          "strokeColor": "#1e40af",
          "backgroundColor": "#dbeafe",
          "fillStyle": "solid",
          "strokeWidth": 2,
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
          "type": "text",
          "id": "text-test",
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
          "text": "API Test!",
          "fontSize": 20,
          "fontFamily": 1,
          "textAlign": "center",
          "verticalAlign": "middle",
          "containerId": null,
          "originalText": "API Test!",
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
  }
};

// HTTP 请求辅助函数
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = res.headers['content-type'].includes('application/json')
            ? JSON.parse(body)
            : body;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 测试函数
async function testHealth() {
  console.log('\n🏥 测试健康检查...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/health',
      method: 'GET'
    });

    if (response.statusCode === 200) {
      console.log('✅ 健康检查通过');
      console.log('   状态:', response.data.status);
      console.log('   版本:', response.data.version);
      console.log('   运行时间:', response.data.uptime, '秒');
    } else {
      console.log('❌ 健康检查失败:', response.statusCode);
    }
  } catch (error) {
    console.log('❌ 健康检查错误:', error.message);
  }
}

async function testRenderAPI() {
  console.log('\n🎨 测试渲染API...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/render',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testData.simple);

    if (response.statusCode === 200) {
      console.log('✅ 渲染API测试通过');
      console.log('   成功:', response.data.success);
      console.log('   消息:', response.data.message);
      console.log('   元素数量:', response.data.elementsCount);
      console.log('   渲染时间:', response.data.renderTime, 'ms');
    } else {
      console.log('❌ 渲染API测试失败:', response.statusCode);
      console.log('   错误:', response.data);
    }
  } catch (error) {
    console.log('❌ 渲染API测试错误:', error.message);
  }
}

async function testExamplesAPI() {
  console.log('\n📚 测试示例API...');
  try {
    // 测试获取所有示例
    const response1 = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/examples',
      method: 'GET'
    });

    if (response1.statusCode === 200) {
      console.log('✅ 获取示例列表成功');
      console.log('   示例数量:', response1.data.count);
      console.log('   可用示例:', response1.data.examples.join(', '));
    } else {
      console.log('❌ 获取示例列表失败:', response1.statusCode);
    }

    // 测试获取特定示例
    const response2 = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/render/simple',
      method: 'GET'
    });

    if (response2.statusCode === 200) {
      console.log('✅ 获取示例数据成功');
      console.log('   示例名称:', response2.data.example);
      console.log('   元素数量:', response2.data.data.data.elements.length);
    } else {
      console.log('❌ 获取示例数据失败:', response2.statusCode);
    }
  } catch (error) {
    console.log('❌ 示例API测试错误:', error.message);
  }
}

async function testValidateAPI() {
  console.log('\n✅ 测试验证API...');
  try {
    // 测试有效数据
    const response1 = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/validate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testData.simple);

    if (response1.statusCode === 200) {
      console.log('✅ 有效数据验证通过');
      console.log('   验证结果:', response1.data.valid);
    } else {
      console.log('❌ 有效数据验证失败:', response1.statusCode);
    }

    // 测试无效数据
    const response2 = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/validate',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, { invalid: 'data' });

    if (response2.statusCode === 200) {
      console.log('✅ 无效数据验证正确');
      console.log('   验证结果:', response2.data.valid);
      console.log('   错误信息:', response2.data.error);
    } else {
      console.log('❌ 无效数据验证失败:', response2.statusCode);
    }
  } catch (error) {
    console.log('❌ 验证API测试错误:', error.message);
  }
}

async function testInfoAPI() {
  console.log('\nℹ️ 测试信息API...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 8080,
      path: '/api/info',
      method: 'GET'
    });

    if (response.statusCode === 200) {
      console.log('✅ 信息API测试通过');
      console.log('   服务:', response.data.service);
      console.log('   版本:', response.data.version);
      console.log('   端点数量:', Object.keys(response.data.endpoints).length);
    } else {
      console.log('❌ 信息API测试失败:', response.statusCode);
    }
  } catch (error) {
    console.log('❌ 信息API测试错误:', error.message);
  }
}

// 性能测试
async function testPerformance() {
  console.log('\n⚡ 性能测试...');
  try {
    const requests = [];
    const startTime = Date.now();

    // 并发发送10个请求
    for (let i = 0; i < 10; i++) {
      const request = makeRequest({
        hostname: 'localhost',
        port: 8080,
        path: '/api/render',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, testData.simple);
      requests.push(request);
    }

    const results = await Promise.all(requests);
    const endTime = Date.now();
    const totalTime = endTime - startTime;

    const successCount = results.filter(r => r.statusCode === 200).length;
    const avgRenderTime = results
      .filter(r => r.statusCode === 200)
      .reduce((sum, r) => sum + r.data.renderTime, 0) / successCount;

    console.log('✅ 性能测试完成');
    console.log('   总时间:', totalTime, 'ms');
    console.log('   成功请求:', successCount, '/ 10');
    console.log('   平均响应时间:', (totalTime / 10).toFixed(2), 'ms');
    console.log('   平均渲染时间:', avgRenderTime.toFixed(2), 'ms');
    console.log('   QPS:', (10000 / totalTime).toFixed(2), '请求/秒');
  } catch (error) {
    console.log('❌ 性能测试错误:', error.message);
  }
}

// 主测试函数
async function runTests() {
  console.log('🧪 开始Excalidraw API测试...');
  console.log('📍 API地址:', API_BASE);

  try {
    // 检查服务器是否运行
    await testHealth();

    // 运行所有测试
    await testInfoAPI();
    await testExamplesAPI();
    await testValidateAPI();
    await testRenderAPI();
    await testPerformance();

    console.log('\n🎉 所有测试完成!');
  } catch (error) {
    console.log('\n💥 测试过程中发生错误:', error.message);
    console.log('请确保API服务器正在运行: node api-server.js');
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  testHealth,
  testRenderAPI,
  testExamplesAPI,
  testValidateAPI,
  testInfoAPI,
  testPerformance,
  runTests,
  testData
};