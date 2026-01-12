@echo off
REM 前端HTTP服务器启动脚本

echo 启动前端HTTP服务器...
echo.
echo 前端服务将在 http://localhost:8080 启动
echo 按 Ctrl+C 停止服务
echo.

cd frontend
python -m http.server 8080
