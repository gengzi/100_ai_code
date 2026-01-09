# 部署指南

## 开发环境部署

### 后端部署

1. **配置环境变量**
```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，填入实际的 API Key
```

2. **编译运行**
```bash
mvn clean install
mvn spring-boot:run
```

或者打包后运行：
```bash
mvn clean package
java -jar target/nostalgia-ai-1.0.0.jar
```

3. **验证启动**
访问 `http://localhost:8080/api/h2-console` 查看数据库控制台

### 前端部署

1. **安装依赖**
```bash
cd frontend
npm install
```

2. **开发模式**
```bash
npm run dev
```

3. **生产构建**
```bash
npm run build
npm run start
```

## 生产环境部署

### Docker部署（推荐）

#### 后端Dockerfile

```dockerfile
# backend/Dockerfile
FROM maven:3.8-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-slim
WORKDIR /app
COPY --from=build /app/target/nostalgia-ai-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### 前端Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SPRING_PROFILES_ACTIVE=prod
    volumes:
      - ./uploads:/root/nostalgia-uploads

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:8080/api
    depends_on:
      - backend
```

### 云服务部署

#### 后端部署选项

1. **AWS EC2**
   - 选择 Ubuntu 20.04 LTS
   - 安装 Java 17 和 Maven
   - 部署 JAR 包
   - 使用 Nginx 作为反向代理

2. **阿里云 ECS**
   - 类似 AWS EC2
   - 推荐使用负载均衡 + 多实例部署

3. **Heroku**
   - 使用 Heroku Maven 插件
   - 配置环境变量
   - 自动部署

#### 前端部署选项

1. **Vercel**（推荐Next.js项目）
   - 连接 GitHub 仓库
   - 自动构建和部署
   - 免费SSL证书

2. **Netlify**
   - 静态站点托管
   - CI/CD支持

3. **阿里云 OSS + CDN**
   - 静态文件托管
   - CDN加速

## 安全配置

### 1. API密钥管理
- 使用环境变量存储敏感信息
- 不要将 .env 文件提交到代码库
- 生产环境使用密钥管理服务（如 AWS Secrets Manager）

### 2. CORS配置
生产环境需要限制允许的域名：

```java
registry.addMapping("/**")
    .allowedOrigins("https://your-domain.com")
    .allowedMethods("GET", "POST", "PUT", "DELETE")
    .allowCredentials(true);
```

### 3. 文件上传安全
- 限制文件大小
- 验证文件类型
- 扫描恶意文件
- 使用安全的文件名

## 性能优化

### 后端优化

1. **数据库优化**
   - 从H2迁移到PostgreSQL
   - 添加数据库索引
   - 使用连接池

2. **缓存策略**
   - 使用 Redis 缓存频繁访问的数据
   - 缓存AI响应

3. **异步处理**
   - 文件上传使用异步处理
   - AI调用使用消息队列

### 前端优化

1. **代码分割**
   - Next.js自动代码分割
   - 动态导入大型组件

2. **图片优化**
   - 使用Next.js Image组件
   - WebP格式
   - 懒加载

3. **CDN加速**
   - 静态资源使用CDN
   - API请求使用负载均衡

## 监控和日志

### 后端监控

1. **Spring Boot Actuator**
   - 健康检查端点
   - 性能指标
   - 应用信息

2. **日志管理**
   - 使用 Logback
   - 日志级别配置
   - 日志聚合（ELK Stack）

### 前端监控

1. **错误追踪**
   - Sentry
   - 错误边界

2. **性能监控**
   - Google Analytics
   - Web Vitals

## 备份策略

1. **数据库备份**
   - 定期自动备份
   - 异地存储

2. **文件备份**
   - 用户上传的照片和语音
   - 使用对象存储（S3、OSS）

## 常见问题

### 1. OpenAI API 调用失败
- 检查 API Key 是否正确
- 确认账户有足够的配额
- 检查网络连接

### 2. 文件上传失败
- 检查文件大小限制
- 确认上传目录有写权限
- 检查磁盘空间

### 3. 前后端连接问题
- 检查 CORS 配置
- 确认API地址正确
- 查看浏览器控制台错误信息

## 更新和升级

1. **备份数据**
2. **测试新版本**
3. **灰度发布**
4. **监控运行状态**
5. **回滚计划**
