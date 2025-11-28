@echo off
echo 启动GEO平台前端服务...
echo.

cd frontend

:: 检查是否安装了依赖
if not exist "node_modules" (
    echo 正在安装依赖...
    npm install
    if errorlevel 1 (
        echo 依赖安装失败，请检查网络连接和Node.js版本
        pause
        exit /b 1
    )
)

:: 启动开发服务器
echo 启动开发服务器...
echo.
echo 前端服务将在 http://localhost:3000 启动
echo 后端API将自动代理到 http://localhost:8080
echo.
echo 按 Ctrl+C 停止服务
echo.

npm run dev

pause