@echo off
echo ========================================
echo GEO平台 Playwright 功能测试
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
    echo 尝试使用完整路径...
    set MAVEN_CMD=/c/Users/Administrator/.m2/wrapper/dists/apache-maven-3.9.11-bin/6mqf5t809d9geo83kj4ttckcbc/apache-maven-3.9.11/bin/mvn.cmd
    if not exist "%MAVEN_CMD%" (
        echo ❌ 错误: 未找到Maven环境
        pause
        exit /b 1
    )
    echo ✅ Maven环境检查通过 (使用完整路径)
) else (
    set MAVEN_CMD=mvn
    echo ✅ Maven环境检查通过
)

echo.
echo 正在编译项目...
"%MAVEN_CMD%" compile -q
if errorlevel 1 (
    echo ❌ 项目编译失败
    pause
    exit /b 1
)
echo ✅ 项目编译成功

echo.
echo 正在测试Playwright浏览器功能...

:: 使用Maven执行简单的Playwright测试
"%MAVEN_CMD%" exec:java -Dexec.mainClass="com.microsoft.playwright.CLI" -Dexec.args="install-deps" -q
if errorlevel 1 (
    echo ⚠️  Playwright依赖安装失败，但继续测试...
)

echo.
echo ✅ 环境检查完成！
echo.
echo 建议下一步操作:
echo 1. 安装Playwright浏览器: setup-playwright.bat
echo 2. 启动后端服务: "%MAVEN_CMD%" spring-boot:run
echo 3. 启动前端: cd frontend && npm run dev
echo.
pause