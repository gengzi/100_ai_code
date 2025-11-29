#!/bin/bash

# Excalidraw API 启动脚本

set -e

echo "🚀 启动 Excalidraw API 服务..."

# 检查 Node.js 版本
echo "📋 检查环境..."
node_version=$(node -v)
echo "Node.js 版本: $node_version"

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 创建必要的目录
mkdir -p fonts logs

# 复制环境配置文件（如果不存在）
if [ ! -f ".env" ]; then
    echo "⚙️  创建环境配置文件..."
    cp .env.example .env
    echo "请编辑 .env 文件配置您的环境变量"
fi

# 设置环境变量
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}
export HOST=${HOST:-0.0.0.0}

echo "🎯 环境配置:"
echo "  NODE_ENV: $NODE_ENV"
echo "  PORT: $PORT"
echo "  HOST: $HOST"

# 启动服务
echo "🌟 启动服务器..."
if [ "$NODE_ENV" = "development" ]; then
    # 开发模式：使用 nodemon
    if command -v nodemon &> /dev/null; then
        nodemon src/server.js
    else
        echo "⚠️  nodemon 未安装，使用 node 启动"
        node src/server.js
    fi
else
    # 生产模式：直接使用 node
    node src/server.js
fi