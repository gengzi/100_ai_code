#!/bin/bash

# API 测试脚本

set -e

API_URL=${API_URL:-"http://localhost:3000"}

echo "🧪 Excalidraw API 测试脚本"
echo "测试地址: $API_URL"
echo ""

# 健康检查
echo "1️⃣ 健康检查..."
curl -s "$API_URL/health" | jq '.' || echo "健康检查失败"
echo ""

# API 文档
echo "2️⃣ 获取 API 文档..."
curl -s "$API_URL/api" | jq '.name, .version, .endpoints | keys' || echo "获取文档失败"
echo ""

# 简单矩形渲染测试
echo "3️⃣ 简单矩形渲染测试..."
curl -s -X POST "$API_URL/api/render" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "excalidraw",
    "version": 2,
    "elements": [
      {
        "id": "rect-1",
        "type": "rectangle",
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 100,
        "strokeColor": "#e67700",
        "backgroundColor": "#fff3bf",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "strokeStyle": "solid",
        "roughness": 0,
        "opacity": 100
      }
    ],
    "appState": {
      "viewBackgroundColor": "#ffffff"
    }
  }' \
  --output test-rectangle.png

if [ -f "test-rectangle.png" ]; then
    echo "✅ 矩形渲染成功，文件大小: $(wc -c < test-rectangle.png) 字节"
    rm test-rectangle.png
else
    echo "❌ 矩形渲染失败"
fi
echo ""

# 文本渲染测试
echo "4️⃣ 文本渲染测试..."
curl -s -X POST "$API_URL/api/render" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "excalidraw",
    "version": 2,
    "elements": [
      {
        "id": "text-1",
        "type": "text",
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 40,
        "text": "Hello World!",
        "fontSize": 24,
        "fontFamily": 1,
        "textAlign": "center",
        "verticalAlign": "middle",
        "strokeColor": "#000000",
        "opacity": 100
      }
    ],
    "appState": {
      "viewBackgroundColor": "#ffffff"
    }
  }' \
  --output test-text.png

if [ -f "test-text.png" ]; then
    echo "✅ 文本渲染成功，文件大小: $(wc -c < test-text.png) 字节"
    rm test-text.png
else
    echo "❌ 文本渲染失败"
fi
echo ""

# 复杂图形测试
echo "5️⃣ 复杂图形渲染测试..."
if [ -f "examples/diagram-with-shapes.json" ]; then
    curl -s -X POST "$API_URL/api/render" \
      -H "Content-Type: application/json" \
      -d @examples/diagram-with-shapes.json \
      --output test-diagram.png

    if [ -f "test-diagram.png" ]; then
        echo "✅ 复杂图形渲染成功，文件大小: $(wc -c < test-diagram.png) 字节"
        rm test-diagram.png
    else
        echo "❌ 复杂图形渲染失败"
    fi
else
    echo "⚠️  示例文件不存在，跳过复杂图形测试"
fi
echo ""

# 错误处理测试
echo "6️⃣ 错误处理测试..."
response=$(curl -s -X POST "$API_URL/api/render" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "excalidraw",
    "version": 2,
    "elements": []
  }')

error_message=$(echo "$response" | jq -r '.error // "unknown"')
if [ "$error_message" = "Invalid data" ]; then
    echo "✅ 错误处理测试通过"
else
    echo "❌ 错误处理测试失败: $error_message"
fi
echo ""

# 性能统计
echo "7️⃣ 获取性能统计..."
curl -s "$API_URL/stats" | jq '.requests, .pool.summary' || echo "获取统计失败"
echo ""

echo "🎉 测试完成！"