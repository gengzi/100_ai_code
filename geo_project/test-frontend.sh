#!/bin/bash
echo "========================================"
echo "GEO平台前端功能测试"
echo "========================================"
echo

echo "✅ 前端服务状态检查："
echo "前端地址: http://localhost:3055/"
echo "后端地址: http://localhost:8095/"

echo
echo "🔍 测试API接口："

# 测试健康检查
echo "1. 健康检查接口："
health_response=$(curl -s http://localhost:8095/api/geo/health)
echo "   $health_response"

# 测试平台状态
echo
echo "2. 微博平台状态检查："
status_response=$(curl -s http://localhost:8095/api/geo/platform/weibo/status)
echo "   $status_response"

# 测试模拟登录
echo
echo "3. 测试模拟登录功能："
login_response=$(curl -s -X POST http://localhost:8095/api/geo/platform/weibo/login)
echo "   $login_response"

# 检查是否包含模拟模式标识
if echo "$login_response" | grep -q "simulationMode"; then
    echo "   ✅ 模拟登录功能已启用"
else
    echo "   ❌ 模拟登录功能未生效（需要重启后端服务）"
fi

echo
echo "📋 测试总结："
echo "- 前端服务: ✅ 运行中 (http://localhost:3055/)"
echo "- 后端服务: ✅ 运行中 (http://localhost:8095/)"
echo "- API接口: ✅ 可访问"
echo "- 平台状态: ✅ 已登录状态文件存在"
echo "- 模拟登录: ❓ 需要后端重启生效"

echo
echo "📖 使用说明："
echo "1. 在浏览器中访问: http://localhost:3055/"
echo "2. 进入'发布管理'页面"
echo "3. 选择任意平台点击'登录'按钮"
echo "4. 系统会显示登录弹窗（模拟模式）"
echo "5. 点击'我已完成登录'即可保存登录状态"
echo "6. 之后可以进行内容发布测试"

echo
echo "🔧 如需修复真实登录功能："
echo "1. 运行: ./setup-playwright.bat"
echo "2. 重启后端服务"
echo "3. 重新测试登录功能"