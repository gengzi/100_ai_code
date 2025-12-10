#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const http = require('http');

const API_URL = 'http://localhost:3000/render';

// 测试配置
const tests = [
  {
    name: '简单矩形',
    file: 'examples/simple-diagram.json',
    output: 'test-output/simple-rectangle.png'
  },
  {
    name: '流程图',
    file: 'examples/flowchart.json',
    output: 'test-output/flowchart.png'
  }
];

// 确保 output 目录存在
async function ensureOutputDir() {
  try {
    await fs.mkdir('test-output', { recursive: true });
  } catch (error) {
    // 目录可能已存在，忽略错误
  }
}

// 发送 HTTP 请求
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/render',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = Buffer.alloc(0);

      res.on('data', (chunk) => {
        responseData = Buffer.concat([responseData, chunk]);
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(responseData);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData.toString()}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(60000); // 60秒超时
    req.write(postData);
    req.end();
  });
}

// 运行单个测试
async function runTest(test) {
  console.log(`\n🧪 测试: ${test.name}`);
  console.log(`📁 输入文件: ${test.file}`);
  console.log(`💾 输出文件: ${test.output}`);

  try {
    // 读取测试数据
    const testData = await fs.readFile(test.file, 'utf8');
    const jsonData = JSON.parse(testData);

    console.log(`📊 元素数量: ${jsonData.data.elements.length}`);

    // 发送请求
    console.log(`🚀 发送渲染请求...`);
    const startTime = Date.now();

    const imageBuffer = await makeRequest(API_URL, jsonData);

    const renderTime = Date.now() - startTime;
    console.log(`✅ 渲染完成，耗时: ${renderTime}ms`);
    console.log(`📏 图片大小: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

    // 保存图片
    await fs.writeFile(test.output, imageBuffer);
    console.log(`💾 图片已保存到: ${test.output}`);

    return { success: true, renderTime, size: imageBuffer.length };

  } catch (error) {
    console.error(`❌ 测试失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    console.log(`🔍 检查服务器状态...`);
    const response = await fetch('http://localhost:3000/health');
    const data = await response.json();
    console.log(`✅ 服务器状态: ${data.status}`);
    console.log(`📈 运行时间: ${data.uptime.toFixed(2)}s`);
    return true;
  } catch (error) {
    console.error(`❌ 服务器连接失败: ${error.message}`);
    console.log(`💡 请确保服务器正在运行: npm start`);
    return false;
  }
}

// 主函数
async function main() {
  console.log('🎨 Excalidraw 渲染服务测试工具');
  console.log('=====================================');

  // 检查服务器
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }

  // 准备输出目录
  await ensureOutputDir();

  const results = [];

  // 运行所有测试
  for (const test of tests) {
    const result = await runTest(test);
    results.push({ ...test, ...result });
  }

  // 显示结果摘要
  console.log('\n📊 测试结果摘要');
  console.log('=====================================');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  successful.forEach(result => {
    console.log(`✅ ${result.name}: ${result.renderTime}ms, ${(result.size / 1024).toFixed(2)} KB`);
  });

  failed.forEach(result => {
    console.log(`❌ ${result.name}: ${result.error}`);
  });

  console.log(`\n📈 总计: ${successful.length} 成功, ${failed.length} 失败`);

  if (successful.length > 0) {
    const avgTime = successful.reduce((sum, r) => sum + r.renderTime, 0) / successful.length;
    const avgSize = successful.reduce((sum, r) => sum + r.size, 0) / successful.length;
    console.log(`⏱️ 平均渲染时间: ${avgTime.toFixed(2)}ms`);
    console.log(`📏 平均图片大小: ${(avgSize / 1024).toFixed(2)} KB`);
  }

  if (failed.length > 0) {
    console.log('\n💡 请检查失败原因并重试');
    process.exit(1);
  } else {
    console.log('\n🎉 所有测试通过！');
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTest, checkServer };