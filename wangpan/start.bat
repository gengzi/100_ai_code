@echo off
REM 抖音视频下载器启动脚本 (Windows)

echo ====================================
echo 抖音视频下载器 - 启动脚本
echo ====================================
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python 3.8+
    pause
    exit /b 1
)

echo [1/3] 检查后端依赖...
cd backend
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)

echo 激活虚拟环境...
call venv\Scripts\activate.bat

echo 安装依赖...
pip install -r requirements.txt -q

echo.
echo [2/3] 启动后端服务...
echo 后端服务将在 http://localhost:5000 启动
echo.
start cmd /k "cd /d %cd% && venv\Scripts\activate.bat && python main.py"

REM 等待后端启动
timeout /t 3 /nobreak >nul

cd ..

echo.
echo [3/3] 打开前端界面...
echo 前端界面将在浏览器中打开
echo.

REM 打开浏览器
start frontend\index.html

echo.
echo ====================================
echo 启动完成！
echo 后端API: http://localhost:5000
echo API文档: http://localhost:5000/docs
echo ====================================
echo.
echo 按任意键退出...
pause >nul
