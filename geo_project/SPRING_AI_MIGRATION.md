# Spring AI 迁移文档

## 迁移概述

本次迁移将GEO平台的人工智能调用部分从手动OkHttp调用改造为使用Spring AI框架，提供了更好的集成性、可维护性和扩展性。

## 改造内容

### 1. 依赖更新 (pom.xml)

**新增依赖：**
- `spring-ai-openai-spring-boot-starter` - Spring AI OpenAI集成（兼容SiliconFlow）
- `spring-boot-starter-aop` - 支持重试注解

**配置：**
```xml
<spring.ai.version>1.0.0-M1</spring.ai.version>
```

**新增仓库：**
```xml
<repositories>
    <repository>
        <id>spring-milestones</id>
        <name>Spring Milestones</name>
        <url>https://repo.spring.io/milestone</url>
    </repository>
</repositories>
```

### 2. 配置文件更新 (application.yml)

**新增Spring AI配置：**
```yaml
spring:
  ai:
    openai:
      api-key: "sk-wkekvkigaytxuokxdcbrcimuugyawdnxevihgwvxwerdmzqa"
      chat:
        options:
          model: "deepseek-ai/DeepSeek-V3"
          temperature: 0.7
          max-tokens: 4000
      base-url: "https://api.siliconflow.cn"
```

**保留原有配置作为备份：**
- 原有 `geo.platform.ai` 配置保留，确保向后兼容

### 3. 服务类重构 (GeoOptimizationService)

**主要变化：**

#### 依赖注入
```java
// 旧版本
private final OkHttpClient httpClient;
private final ObjectMapper objectMapper;

// 新版本
private final ChatClient chatClient;

public GeoOptimizationService(OpenAiChatModel chatModel) {
    this.chatClient = ChatClient.create(chatModel);
}
```

#### AI调用方法
```java
// 旧版本 - 手动HTTP调用
private String callAIAPI(String prompt) throws IOException {
    // 大量的JSON构建和HTTP处理代码
    String requestBody = String.format("""...""");
    Request request = new Request.Builder()...;
    // 复杂的响应解析
}

// 新版本 - Spring AI
public String optimizeForGEO(String rawContent, String targetQuery) {
    ChatResponse response = chatClient
        .prompt()
        .user(prompt)
        .call()
        .chatResponse();
    return response.getResult().getOutput().getContent();
}
```

#### 新增功能
- **重试机制：** `@Retryable` 注解，3次重试，指数退避
- **Token监控：** 自动记录Token使用情况
- **增强日志：** 更详细的请求和响应日志

### 4. 配置类 (SpringAIConfig)

**新增配置类：**
```java
@Configuration
public class SpringAIConfig {
    @Bean
    public OpenAiApi openAiApi() { ... }

    @Bean
    public OpenAiChatModel openAiChatModel(OpenAiApi openAiApi) { ... }
}
```

## 技术优势

### 1. 框架集成
- **自动配置：** Spring Boot自动配置OpenAiApi和ChatModel
- **依赖注入：** 通过DI容器管理AI组件
- **类型安全：** 强类型的API和响应处理

### 2. 功能增强
- **重试机制：** 自动重试失败的API调用
- **错误处理：** 更好的异常处理和日志记录
- **监控集成：** 支持Micrometer等监控工具
- **Token跟踪：** 自动跟踪Token使用情况

### 3. 可维护性
- **代码简化：** 减少样板代码和手动HTTP处理
- **配置集中：** 统一的配置管理
- **测试友好：** 更容易进行单元测试和集成测试

### 4. 扩展性
- **多模型支持：** 易于切换不同的AI模型
- **插件化：** 支持Spring AI的插件机制
- **功能函数：** 准备支持Function Calling等高级功能

## 兼容性说明

### API兼容性
- ✅ **SiliconFlow兼容：** 完全兼容现有的SiliconFlow API
- ✅ **OpenAI格式：** 支持标准OpenAI API格式
- ✅ **配置迁移：** 原有配置保留，确保平滑迁移

### 功能兼容性
- ✅ **GEO优化：** 所有原有的GEO优化功能保持不变
- ✅ **错误处理：** 增强的错误处理不影响现有功能
- ✅ **日志格式：** 保持日志格式的兼容性

## 使用方式

### 1. 开发环境
```bash
# 重新构建项目
mvn clean compile

# 运行测试
mvn test

# 启动应用
mvn spring-boot:run
```

### 2. 测试验证
```bash
# 运行AI集成测试
mvn test -Dtest=GeoOptimizationServiceTest

# 查看Spring AI配置
curl -X GET http://localhost:8095/api/geo/health
```

### 3. 生产部署
- **环境变量：** 支持通过环境变量配置API密钥
- **配置中心：** 集成Spring Cloud Config或Nacos
- **监控告警：** 集成Prometheus和Grafana监控

## 性能优化

### 1. 连接池优化
- Spring AI自动管理HTTP连接池
- 支持连接复用和超时配置

### 2. 缓存支持
- 可集成Spring Cache进行响应缓存
- 减少重复的API调用

### 3. 异步支持
- 支持Reactive编程模型
- 可与WebFlux集成使用

## 监控和调试

### 1. 日志级别
```yaml
logging:
  level:
    org.springframework.ai: DEBUG
    com.geo.platform.service.GeoOptimizationService: DEBUG
```

### 2. 关键指标
- API调用次数和成功率
- 响应时间和Token使用
- 重试次数和失败率

### 3. 健康检查
- 集成Spring Boot Actuator
- 支持AI服务的健康状态检查

## 故障排除

### 常见问题

1. **依赖冲突：**
   - 确保Spring AI版本与Spring Boot版本兼容
   - 检查是否有冲突的Jackson或OkHttp版本

2. **配置错误：**
   - 验证API密钥和端点URL
   - 检查网络连接和代理设置

3. **认证失败：**
   - 确认SiliconFlow API密钥有效性
   - 检查API配额和使用限制

### 调试步骤

1. **检查配置：**
   ```bash
   curl -X GET http://localhost:8095/actuator/health
   ```

2. **查看日志：**
   ```bash
   tail -f logs/application.log | grep "GeoOptimizationService"
   ```

3. **测试连接：**
   ```bash
   curl -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"model":"deepseek-ai/DeepSeek-V3","messages":[{"role":"user","content":"test"}]}' \
        https://api.siliconflow.cn/v1/chat/completions
   ```

## 未来规划

### 1. 功能扩展
- 支持Function Calling
- 集成向量数据库
- 支持流式响应

### 2. 性能优化
- 实现智能缓存策略
- 支持异步批量处理
- 集成负载均衡

### 3. 监控增强
- 详细的性能指标
- 智能告警机制
- 成本优化建议

---

**迁移完成时间：** 2025年11月24日
**Spring AI版本：** 1.0.0-M1
**兼容性：** ✅ 向后兼容，无破坏性变更