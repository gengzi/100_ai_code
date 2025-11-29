@echo off
chcp 65001 >nul

echo 🚀 启动GEO内容生成平台...

REM 检查Java环境
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Java环境，请先安装Java 17+
    pause
    exit /b 1
)

REM 检查Maven环境
mvn -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Maven环境，请先安装Maven 3.6+
    pause
    exit /b 1
)

REM 检查AI API密钥
if "%AI_API_KEY%"=="" (
    echo ⚠️  警告: 未设置AI_API_KEY环境变量，GEO优化功能将无法正常使用
    echo 请运行: set AI_API_KEY=your-openai-api-key
)

REM 创建存储目录
if not exist "storage-states" mkdir storage-states

REM 安装Playwright浏览器（如果需要）
if not exist "%USERPROFILE%\.cache\ms-playwright" (
    echo 📦 安装Playwright浏览器...
    mvn exec:java -Dexec.mainClass="com.microsoft.playwright.CLI" -Dexec.args="install" -q
)

REM 编译项目
echo 🔨 编译项目...
mvn clean compile -q

if %errorlevel% neq 0 (
    echo ❌ 编译失败，请检查代码
    pause
    exit /b 1
)

REM 启动应用
echo ✅ 启动应用...
mvn spring-boot:run