#!/bin/bash
echo "========================================"
echo "GEO平台 Playwright 功能测试"
echo "========================================"
echo

# 检查Java环境
if ! command -v java &> /dev/null; then
    echo "❌ 错误: 未找到Java环境"
    exit 1
fi
echo "✅ Java环境检查通过: $(java -version 2>&1 | head -1)"

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
    echo "✅ Maven环境检查通过: $(mvn -version 2>&1 | head -1)"
fi

echo
echo "正在编译项目..."
if "$MAVEN_CMD" compile -q; then
    echo "✅ 项目编译成功"
else
    echo "❌ 项目编译失败"
    exit 1
fi

echo
echo "正在测试Playwright浏览器功能..."

# 创建一个简单的测试类
cat > TestPlaywright.java << 'EOF'
import com.microsoft.playwright.*;

public class TestPlaywright {
    public static void main(String[] args) {
        System.out.println("开始测试Playwright...");
        try (Playwright playwright = Playwright.create()) {
            System.out.println("✅ Playwright实例创建成功");

            try (Browser browser = playwright.chromium().launch(
                new BrowserType.LaunchOptions().setHeadless(true)
            )) {
                System.out.println("✅ 浏览器启动成功");

                BrowserContext context = browser.newContext();
                Page page = context.newPage();

                page.navigate("https://www.baidu.com");
                System.out.println("✅ 页面导航成功: " + page.title());

                page.close();
                context.close();
                System.out.println("✅ 测试完成 - Playwright功能正常");
            }
        } catch (Exception e) {
            System.err.println("❌ 测试失败: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
EOF

echo "正在编译测试程序..."
if javac -cp "target/classes/*" TestPlaywright.java; then
    echo "✅ 测试程序编译成功"
else
    echo "❌ 测试程序编译失败"
    rm -f TestPlaywright.java
    exit 1
fi

echo "正在运行测试程序..."
if java -cp ".:target/classes/*" TestPlaywright; then
    echo "✅ Playwright测试通过！"
else
    echo "❌ Playwright测试失败"
    echo "请确保已正确安装Playwright浏览器:"
    echo "mvn exec:java -Dexec.mainClass=\"com.microsoft.playwright.CLI\" -Dexec.args=\"install\""
fi

# 清理
rm -f TestPlaywright.java TestPlaywright.class

echo
echo "测试完成！"