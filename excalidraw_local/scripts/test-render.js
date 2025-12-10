const fs = require('fs');
const path = require('path');

// 测试服务器渲染功能
async function testRender() {
  try {
    // 读取示例数据
    const examplePath = path.join(__dirname, '../examples/simple-diagram.json');
    const exampleData = JSON.parse(fs.readFileSync(examplePath, 'utf8'));

    console.log('Testing with valid example data...');
    console.log('Data structure:', {
      hasData: !!exampleData.data,
      hasElements: !!(exampleData.data && exampleData.data.elements),
      elementsCount: exampleData.data ? exampleData.data.elements.length : 0
    });

    // 发送请求到服务器
    const response = await fetch('http://localhost:3000/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exampleData)
    });

    if (response.ok) {
      console.log('✅ Rendering successful!');
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      // 保存结果图片
      const buffer = await response.arrayBuffer();
      fs.writeFileSync('test-output.png', Buffer.from(buffer));
      console.log('📸 Image saved as test-output.png');
    } else {
      const error = await response.json();
      console.log('❌ Rendering failed:', error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// 测试错误情况
async function testErrorCases() {
  console.log('\nTesting error cases...');

  // 测试 1: 缺少 data 属性
  try {
    const response = await fetch('http://localhost:3000/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const result = await response.json();
    console.log('Test 1 - Missing data:', result.error || result.message);
  } catch (error) {
    console.log('Test 1 - Missing data:', error.message);
  }

  // 测试 2: 无效数据格式
  try {
    const response = await fetch('http://localhost:3000/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: null
      })
    });

    const result = await response.json();
    console.log('Test 2 - Null data:', result.error || result.message);
  } catch (error) {
    console.log('Test 2 - Null data:', error.message);
  }
}

// 运行测试
console.log('🧪 Testing Excalidraw Render Service');
console.log('Make sure the server is running on http://localhost:3000');

testRender().then(() => {
  return testErrorCases();
}).then(() => {
  console.log('\n✨ Testing completed!');
}).catch(console.error);