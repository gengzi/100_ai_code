#!/bin/bash
echo "========================================"
echo "GEO平台 Playwright 浏览器安装"
echo "========================================"
echo

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo "❌ 错误: 未找到Java环境"
    exit 1
fi
echo "✅ Java环境检查通过"

# 检查Maven环境
if ! command -v mvn &> /dev/null; then
    # 尝试使用已发现的Maven路径
    MAVEN_CMD="/c/Users/Administrator/.m2/wrapper/dists/apache-maven-3.9.11-bin/6mqf5t809d9geo83kj4ttckcbc/apache-maven-3.9.11/bin/mvn.cmd"
    if [ ! -f "$MAVEN_CMD" ]; then
        echo "❌ 错误: 未找到Maven环境"
        exit 1
    fi
    echo "✅ Maven环境检查通过 (使用完整路径)"
else
    MAVEN_CMD="mvn"
    echo "✅ Maven环境检查通过"
fi

echo
echo "正在安装Playwright浏览器..."
echo "这可能需要几分钟时间，请耐心等待..."
echo

# 使用Maven执行Playwright浏览器安装
"$MAVEN_CMD" exec:java -Dexec.mainClass="com.microsoft.playwright.CLI" -Dexec.args="install" -q

if [ $? -ne 0 ]; then
    echo
    echo "❌ Playwright浏览器安装失败"
    echo "请尝试手动安装或检查网络连接"
    echo
    echo "手动安装方法:"
    echo "1. 访问 https://playwright.dev/docs/intro"
    echo "2. 下载并安装Playwright"
    echo "3. 运行: playwright install"
    exit 1
fi

echo
echo "✅ Playwright浏览器安装完成！"
echo
echo "现在可以启动GEO平台后端服务:"
echo "mvn spring-boot:run"
echo