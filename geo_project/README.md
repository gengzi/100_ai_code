# GEO内容生成平台

基于Java和Playwright的生成式引擎优化(GEO)内容生成和多平台发布系统。

## 功能特性

### 🤖 GEO内容生成
- AI驱动的内容优化，专为生成式搜索引擎设计
- 自动生成可验证的、结构化的内容
- 避免主观描述，侧重客观事实

### 🚀 多平台发布
- 支持微博、小红书、知乎、抖音等主流平台
- 自动登录状态管理
- 批量发布功能

### 🔧 平台管理
- 自动保存storageState，避免重复登录
- 可配置的平台参数
- 健壮的错误处理机制

## 快速开始

### 环境要求
- Java 17+
- Maven 3.6+
- Node.js 16+ (用于Playwright浏览器)

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd geo_project
```

2. **编译项目**
```bash
mvn clean compile
```

3. **安装Playwright浏览器**
```bash
mvn exec:java -Dexec.mainClass="com.microsoft.playwright.CLI" -Dexec.args="install"
```

4. **配置AI API密钥**
```bash
export AI_API_KEY="your-openai-api-key"
```

5. **启动应用**
```bash
mvn spring-boot:run
```

### API使用示例

#### 1. GEO内容优化
```bash
curl -X POST http://localhost:8080/api/geo/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "rawContent": "今天去了杭州一家很棒的咖啡馆，环境很好，咖啡也很香。",
    "targetQuery": "杭州咖啡馆推荐"
  }'
```

**响应示例:**
```json
{
  "success": true,
  "optimizedContent": "杭州推荐的咖啡馆包括多家优质选择。\n• 星巴克臻选（杭州大厦店）：位于杭州市下城区武林广场21号\n• 独立咖啡工作室：营业时间9:00-22:00，单品咖啡价格35-45元\n• [需补充：具体地址和联系方式]\n• 咖啡豆产地包括埃塞俄比亚、哥伦比亚等地区",
  "targetQuery": "杭州咖啡馆推荐",
  "timestamp": 1698123456789
}
```

#### 2. 初始化平台
```bash
curl -X POST http://localhost:8080/api/geo/platform/weibo/initialize
```

#### 3. 平台登录（首次使用）
```bash
curl -X POST http://localhost:8080/api/geo/platform/weibo/login \
  -H "Content-Type: application/json" \
  -d '{
    "loginUrl": "https://weibo.com/login"
  }'
```

#### 4. 发布内容到单个平台
```bash
curl -X POST http://localhost:8080/api/geo/platform/weibo/publish \
  -H "Content-Type: application/json" \
  -d '{
    "geoContent": "杭州推荐的咖啡馆包括多家优质选择。\n• 星巴克臻选（杭州大厦店）：位于杭州市下城区武林广场21号",
    "targetQuery": "杭州咖啡馆推荐"
  }'
```

#### 5. 批量发布到多平台
```bash
curl -X POST http://localhost:8080/api/geo/batch-publish \
  -H "Content-Type: application/json" \
  -d '{
    "platformTypes": ["weibo", "xiaohongshu", "zhihu"],
    "geoContent": "杭州推荐的咖啡馆包括多家优质选择...",
    "targetQuery": "杭州咖啡馆推荐"
  }'
```

## 配置说明

### application.yml主要配置项

```yaml
geo:
  platform:
    ai:
      url: "https://api.openai.com/v1/chat/completions"
      key: "${AI_API_KEY:}"  # 环境变量中设置API密钥
      model: "gpt-3.5-turbo"

    publish:
      storage-state-path: "./storage-states"  # 登录状态存储路径
      headless: false  # 是否无头模式运行
      publish-interval: 2000  # 发布间隔(毫秒)
```

### 支持的平台

| 平台 | 标识符 | 状态 |
|------|--------|------|
| 微博 | `weibo` | ✅ 已支持 |
| 小红书 | `xiaohongshu` | ✅ 已支持 |
| 知乎 | `zhihu` | ✅ 已支持 |
| 抖音 | `douyin` | ✅ 已支持 |

## 安全注意事项

1. **API密钥安全**: 请通过环境变量设置AI_API_KEY，不要在代码中硬编码
2. **平台合规**: 确保发布内容符合各平台规则
3. **频率控制**: 批量发布时注意间隔，避免被限制

## 开发说明

### 项目结构
```
src/main/java/com/geo/platform/
├── GeoPlatformApplication.java    # 启动类
├── config/
│   └── GEOPlatformConfig.java     # 配置类
├── controller/
│   └── GEOController.java         # REST API控制器
└── service/
    ├── GeoOptimizationService.java  # GEO优化服务
    └── PlatformPublishService.java # 平台发布服务
```

### 扩展新平台

1. 在`PlatformPublishService`中添加新的发布方法
2. 在`GEOPlatformConfig`中添加平台配置
3. 更新控制器中的平台类型映射

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！