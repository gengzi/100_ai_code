@echo off
echo 测试GEO平台后端编译...
echo.

:: 检查Java环境
java -version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Java环境
    pause
    exit /b 1
)
echo ✅ Java环境检查通过

:: 检查Maven环境
echo 检查Maven环境...
mvn -version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Maven环境
    echo.
    echo 请安装Maven或使用以下方法之一：
    echo.
    echo 方法1 - 安装Maven:
    echo   1. 访问 https://maven.apache.org/download.cgi
    echo   2. 下载Maven并解压
    echo   3. 设置环境变量 MAVEN_HOME 和 PATH
    echo.
    echo 方法2 - 使用Maven Wrapper:
    echo   1. 下载Maven Wrapper文件到项目根目录
    echo   2. 使用 mvnw.cmd 代替 mvn 命令
    echo.
    pause
    exit /b 1
)
echo ✅ Maven环境检查通过

:: 编译项目
echo.
echo 开始编译项目...
mvn clean compile
if errorlevel 1 (
    echo ❌ 编译失败
    pause
    exit /b 1
)

echo ✅ 编译成功！
echo.
echo 现在可以启动后端服务：
echo mvn spring-boot:run
echo.
pause