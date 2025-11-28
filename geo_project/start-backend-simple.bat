@echo off
echo ========================================
echo GEO平台后端服务启动脚本
echo ========================================
echo.

:: 检查Java环境
echo 检查Java环境...
java -version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Java环境
    echo 请先安装Java 17或更高版本
    echo 下载地址: https://adoptium.net/
    pause
    exit /b 1
)
echo ✅ Java环境检查通过

:: 检查Maven环境
echo 检查Maven环境...
mvn -version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Maven环境
    echo 请先安装Maven 3.6或更高版本
    echo 下载地址: https://maven.apache.org/download.cgi
    echo.
    echo 或者使用Maven Wrapper (如果存在)
    pause
    exit /b 1
)
echo ✅ Maven环境检查通过

:: AI配置已设置在配置文件中
echo ✅ AI配置: SiliconFlow DeepSeek-V3
echo.

:: 创建存储目录
echo 创建存储目录...
if not exist "storage-states" mkdir storage-states

:: 编译项目
echo 编译项目...
mvn clean compile -q
if errorlevel 1 (
    echo ❌ 编译失败，请检查代码
    pause
    exit /b 1
)
echo ✅ 项目编译成功

echo.
echo ========================================
echo 🚀 启动GEO后端服务...
echo ========================================
echo.
echo 服务访问地址：
echo - 后端API: http://localhost:8095
echo - API文档: http://localhost:8095/swagger-ui.html (如果启用了Swagger)
echo - H2数据库控制台: http://localhost:8095/h2-console
echo.
echo 按 Ctrl+C 停止服务
echo.

mvn spring-boot:run

pause