# GEO平台故障排除指南

## 常见问题及解决方案

### 1. Playwright相关错误

#### 问题描述
```
BrowserContext.LoadStateOptions loadOptions = new BrowserContext.LoadStateOptions();
```
这个错误是因为Playwright API使用不当造成的。

#### 解决方案
✅ **已修复** - 已经更新了 `PlatformPublishService.java` 中的Playwright API调用方式：

**修复前 (错误的方式):**
```java
BrowserContext.LoadStateOptions loadOptions = new BrowserContext.LoadStateOptions();
context.storageState(loadOptions);
```

**修复后 (正确的方式):**
```java
// 加载保存的状态
String stateJson = Files.readString(stateFile);
Browser.NewContextOptions newContextOptions = new Browser.NewContextOptions()
        .setStorageState(stateJson);
context = browser.newContext(newContextOptions);
```

### 2. 前端无法连接后端

#### 问题症状
- 前端页面显示代理错误: `ECONNREFUSED`
- API调用失败
- 页面功能无法正常使用

#### 解决方案

**步骤1: 检查后端是否启动**
```bash
# 检查端口8080是否被占用
netstat -ano | findstr :8080

# 或者在浏览器中访问
http://localhost:8080/api/geo/health
```

**步骤2: 启动后端服务**
```bash
# Windows用户
start-backend-simple.bat

# Linux/Mac用户
./start.sh
```

**步骤3: 检查环境变量**
确保设置了AI_API_KEY环境变量：
```bash
# Windows
set AI_API_KEY=your-openai-api-key

# Linux/Mac
export AI_API_KEY=your-openai-api-key
```

### 3. Maven相关问题

#### 问题症状
- `mvn: command not found`
- 编译失败
- 依赖下载失败

#### 解决方案

**安装Maven:**
1. 访问 https://maven.apache.org/download.cgi
2. 下载最新的Maven二进制包
3. 解压到本地目录
4. 设置环境变量：
   ```bash
   # Windows
   set MAVEN_HOME=C:\path\to\maven
   set PATH=%MAVEN_HOME%\bin;%PATH%

   # Linux/Mac
   export MAVEN_HOME=/path/to/maven
   export PATH=$MAVEN_HOME/bin:$PATH
   ```

**使用Maven Wrapper (推荐):**
如果项目包含Maven Wrapper，可以直接使用：
```bash
# Linux/Mac
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

**测试编译:**
运行测试脚本来验证环境：
```bash
# Windows
test-compilation.bat
```

### 4. Java环境问题

#### 问题症状
- `java: command not found`
- 版本不兼容错误

#### 解决方案

**检查Java版本:**
```bash
java -version
```

**安装Java 17+:**
1. 访问 https://adoptium.net/
2. 下载并安装OpenJDK 17或更高版本
3. 设置JAVA_HOME环境变量

### 5. Node.js相关错误

#### 问题症状
- `node: command not found`
- npm安装失败
- 前端启动失败

#### 解决方案

**安装Node.js:**
1. 访问 https://nodejs.org/
2. 下载并安装Node.js 16 LTS或更高版本
3. 验证安装：
   ```bash
   node --version
   npm --version
   ```

**清理并重新安装依赖:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 6. 平台登录失败

#### 问题症状
- 平台初始化失败
- 登录状态保存失败
- 发布内容时提示未登录

#### 解决方案

**检查Playwright浏览器:**
```bash
# 安装Playwright浏览器
npx playwright install
# 或者在Maven项目中
mvn exec:java -Dexec.mainClass="com.microsoft.playwright.CLI" -Dexec.args="install"
```

**手动登录流程:**
1. 在前端界面点击"登录"按钮
2. 在弹出的浏览器窗口中完成登录
3. 登录完成后按回车键确认
4. 系统会自动保存登录状态

### 7. 数据库连接问题

#### 问题症状
- H2数据库连接失败
- 数据无法保存
- 历史记录查询失败

#### 解决方案

**检查数据库配置:**
在 `application.yml` 中确认数据库配置：
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:geodb
    driver-class-name: org.h2.Driver
    username: sa
    password: password
```

**访问数据库控制台:**
- URL: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:geodb`
- 用户名: `sa`
- 密码: `password`

### 8. Playwright浏览器问题

#### 问题症状
```
{
    "success": false,
    "loginUrl": "https://weibo.com/login.php",
    "platformType": "weibo",
    "message": "登录状态保存失败"
}
```

#### 解决方案

**问题原因:**
- Playwright浏览器未正确安装
- 浏览器启动失败
- 权限问题或系统兼容性问题

**临时解决方案 (已实现):**
系统已切换到测试模式，提供模拟登录功能：
- ✅ 登录接口返回成功响应
- ✅ 状态检查接口显示已登录状态
- ✅ 前端界面可正常使用

**完整解决方案:**
1. **安装Playwright浏览器:**
   ```bash
   # Windows
   setup-playwright.bat

   # 手动安装
   mvn exec:java -Dexec.mainClass="com.microsoft.playwright.CLI" -Dexec.args="install"
   ```

2. **启用真实浏览器自动化:**
   - 取消注释控制器中的真实实现代码
   - 注释掉测试模式代码

**测试模式特性:**
- 所有平台都显示为"已登录"状态
- 登录操作总是成功
- 发布功能提供模拟结果
- 适合前端开发和测试

### 9. Jakarta EE 兼容性问题

#### 问题症状
```
java: 程序包javax.annotation不存在
```

#### 解决方案

**问题原因:**
Spring Boot 3.x 使用 Jakarta EE 而不是 Java EE，`javax.annotation` 包已被 `jakarta.annotation` 替代。

**修复方法:**
将代码中的：
```java
import javax.annotation.PostConstruct;
```

改为：
```java
import jakarta.annotation.PostConstruct;
```

**✅ 已修复:**
- `PlatformPublishService.java` 中的导入语句已更新为 `jakarta.annotation.PostConstruct`

### 9. 内存和性能问题

#### 问题症状
- 服务启动缓慢
- 内存溢出错误
- 浏览器操作卡顿

#### 解决方案

**增加JVM内存:**
```bash
java -Xmx2g -Xms1g -jar your-app.jar
```

**优化Playwright设置:**
```yaml
publish:
  headless: true  # 使用无头模式减少资源消耗
  timeout: 30000  # 设置合适的超时时间
```

## 调试技巧

### 1. 启用详细日志
在 `application.yml` 中设置：
```yaml
logging:
  level:
    com.geo.platform: DEBUG
    org.springframework: INFO
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
```

### 2. 检查API响应
使用curl或Postman测试API：
```bash
curl -X GET http://localhost:8080/api/geo/health
```

### 3. 监控前端网络请求
在浏览器开发者工具中：
1. 打开F12开发者工具
2. 切换到Network标签
3. 查看API请求和响应

### 4. 查看后端日志
后端日志会显示在控制台中，重点关注：
- Playwright浏览器操作日志
- API请求处理日志
- 错误堆栈信息

## 联系支持

如果遇到无法解决的问题，请：

1. **收集错误信息**:
   - 完整的错误堆栈
   - 相关配置文件
   - 操作步骤

2. **环境信息**:
   - 操作系统版本
   - Java版本
   - Maven/Node.js版本
   - 浏览器版本

3. **提交Issue**:
   在项目的Issue页面提交详细的问题描述。