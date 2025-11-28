#!/bin/bash

# GEO平台启动脚本

echo "🚀 启动GEO内容生成平台..."

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo "❌ 错误: 未找到Java环境，请先安装Java 17+"
    exit 1
fi

# 检查Maven环境
if ! command -v mvn &> /dev/null; then
    echo "❌ 错误: 未找到Maven环境，请先安装Maven 3.6+"
    exit 1
fi

# 检查AI API密钥
if [ -z "$AI_API_KEY" ]; then
    echo "⚠️  警告: 未设置AI_API_KEY环境变量，GEO优化功能将无法正常使用"
    echo "请运行: export AI_API_KEY='your-openai-api-key'"
fi

# 创建存储目录
mkdir -p storage-states

# 安装Playwright浏览器（如果需要）
if [ ! -d "$HOME/.cache/ms-playwright" ]; then
    echo "📦 安装Playwright浏览器..."
    mvn exec:java -Dexec.mainClass="com.microsoft.playwright.CLI" -Dexec.args="install" -q
fi

# 编译项目
echo "🔨 编译项目..."
mvn clean compile -q

if [ $? -ne 0 ]; then
    echo "❌ 编译失败，请检查代码"
    exit 1
fi

# 启动应用
echo "✅ 启动应用..."
echo ""
echo "服务访问地址："
echo "- 后端API: http://localhost:8095"
echo "- 前端界面: http://localhost:3055"
echo "- H2数据库控制台: http://localhost:8095/h2-console"
echo ""
mvn spring-boot:run