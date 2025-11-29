@echo off
echo ========================================
echo GEO平台 Playwright 浏览器安装
echo ========================================
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
mvn -version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Maven环境
    pause
    exit /b 1
)
echo ✅ Maven环境检查通过

echo.
echo 正在安装Playwright浏览器...
echo 这可能需要几分钟时间，请耐心等待...
echo.

:: 使用Maven执行Playwright浏览器安装
mvn exec:java -Dexec.mainClass="com.microsoft.playwright.CLI" -Dexec.args="install" -q

if errorlevel 1 (
    echo.
    echo ❌ Playwright浏览器安装失败
    echo 请尝试手动安装或检查网络连接
    echo.
    echo 手动安装方法:
    echo 1. 访问 https://playwright.dev/docs/intro
    echo 2. 下载并安装Playwright
    echo 3. 运行: playwright install
    pause
    exit /b 1
)

echo.
echo ✅ Playwright浏览器安装完成！
echo.
echo 现在可以启动GEO平台后端服务:
echo mvn spring-boot:run
echo.
pause