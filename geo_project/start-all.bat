@echo off
echo 启动GEO内容生成平台（前后端完整版）
echo.

:: 检查后端目录
if not exist "backend" (
    echo 错误: 未找到backend目录
    pause
    exit /b 1
)

:: 检查前端目录
if not exist "frontend" (
    echo 错误: 未找到frontend目录
    pause
    exit /b 1
)

:: 检查Java环境
java -version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Java环境，请先安装Java 17+
    pause
    exit /b 1
)

:: 检查Maven环境
mvn -version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Maven环境，请先安装Maven 3.6+
    pause
    exit /b 1
)

:: 检查Node.js环境
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Node.js环境，请先安装Node.js 16+
    pause
    exit /b 1
)

:: 检查AI API密钥
if "%AI_API_KEY%"=="" (
    echo 警告: 未设置AI_API_KEY环境变量，GEO优化功能将无法正常使用
    echo 请设置环境变量: set AI_API_KEY=your-openai-api-key
    echo.
)

:: 创建存储目录
if not exist "storage-states" mkdir storage-states

:: 安装前端依赖
echo 检查前端依赖...
cd frontend
if not exist "node_modules" (
    echo 安装前端依赖...
    npm install
    if errorlevel 1 (
        echo 前端依赖安装失败
        pause
        exit /b 1
    )
)
cd ..

:: 编译后端项目
echo 编译后端项目...
mvn clean compile -q
if errorlevel 1 (
    echo 后端编译失败，请检查代码
    pause
    exit /b 1
)

echo.
echo ========================================
echo 启动GEO内容生成平台
echo ========================================
echo.
echo 服务访问地址：
echo - 前端界面: http://localhost:3055
echo - 后端API: http://localhost:8095
echo - H2数据库控制台: http://localhost:8095/h2-console
echo.
echo 按 Ctrl+C 停止所有服务
echo.

:: 使用start命令在新窗口中启动后端
echo 启动后端服务...
start "GEO后端服务" cmd /k "mvn spring-boot:run"

:: 等待后端启动
echo 等待后端服务启动...
timeout /t 15 /nobreak >nul

:: 启动前端服务
echo 启动前端服务...
cd frontend
npm run dev

pause