# Excalidraw API 服务

一个高性能的 Excalidraw JSON 数据转图片 API 服务，基于 Canvas 技术实现，无需浏览器环境。

## 功能特性

- ✅ **完整支持 Excalidraw 图形元素**
  - 矩形、椭圆、菱形
  - 线条、箭头
  - 文本（支持多行、自动换行）
  - 图片（支持缩放、裁剪）
  - 自由绘制

- ✅ **多种输出格式**
  - PNG（默认）
  - JPEG（可调质量）
  - WebP（可调质量）
  - SVG（矢量格式）

- ✅ **高性能设计**
  - 渲染器池管理
  - 内存优化
  - Redis 缓存
  - 并发处理

- ✅ **易于部署**
  - Docker 容器化
  - 环境配置简单
  - 健康检查
  - 性能监控

## 快速开始

### 使用 Docker Compose（推荐）

```bash
# 克隆项目
git clone <repository-url>
cd excalidraw-api

# 启动服务（包含 Redis 缓存）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f excalidraw-api
```

### 使用 Docker（单服务）

```bash
# 构建镜像
docker build -t excalidraw-api .

# 运行容器
docker run -p 3000:3000 \
  -e RENDERER_POOL_SIZE=5 \
  -e REDIS_URL=redis://your-redis-host:6379 \
  excalidraw-api
```

### 本地开发

```bash
# 安装依赖
npm install

# 复制环境配置
cp .env.example .env

# 启动开发服务器
npm run dev

# 运行测试
npm test
```

## API 使用

### 基本渲染

```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -d '{
    "type": "excalidraw",
    "version": 2,
    "elements": [
      {
        "id": "rect-1",
        "type": "rectangle",
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 100,
        "strokeColor": "#e67700",
        "backgroundColor": "#fff3bf",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "roughness": 0,
        "opacity": 100
      }
    ],
    "appState": {
      "viewBackgroundColor": "#ffffff"
    }
  }' \
  --output diagram.png
```

### 文件上传渲染

```bash
curl -X POST http://localhost:3000/api/render/file \
  -F "file=@examples/simple-rectangle.json" \
  -F "format=png" \
  -F "quality=90" \
  --output diagram.png
```

### 高级选项

```bash
# 指定输出格式和质量
curl -X POST http://localhost:3000/api/render?format=jpeg&quality=85 \
  -H "Content-Type: application/json" \
  -d @your-excalidraw.json \
  --output diagram.jpg

# 指定画布尺寸
curl -X POST http://localhost:3000/api/render?width=1200&height=800 \
  -H "Content-Type: application/json" \
  -d @your-excalidraw.json \
  --output diagram.png
```

## API 文档

### 主要端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/render` | POST | JSON 数据渲染 |
| `/api/render/file` | POST | 文件上传渲染 |
| `/health` | GET | 健康检查 |
| `/stats` | GET | 性能统计 |
| `/api` | GET | API 文档 |

### 查询参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `format` | string | png | 输出格式：png, jpeg, webp, svg |
| `quality` | number | 90 | 图片质量 (1-100) |
| `width` | number | auto | 画布宽度 |
| `height` | number | auto | 画布高度 |
| `backgroundColor` | string | - | 背景颜色（十六进制） |

### 请求体格式

```javascript
{
  "type": "excalidraw",
  "version": 2,
  "elements": [
    {
      "id": "unique-id",
      "type": "rectangle|ellipse|diamond|line|arrow|text|image|freedraw",
      "x": number,
      "y": number,
      "width": number,
      "height": number,
      "angle": number,
      "strokeColor": "#RRGGBB",
      "backgroundColor": "#RRGGBB",
      "fillStyle": "solid|hachure|cross-hatch|transparent",
      "strokeWidth": number,
      "strokeStyle": "solid|dashed|dotted",
      "roughness": number,
      "opacity": number,
      "points": [[x, y], ...], // 用于线条
      "text": "string",         // 文本内容
      "fontSize": number,
      "fontFamily": number,
      "textAlign": "left|center|right",
      "verticalAlign": "top|middle|bottom",
      "fileId": "string"        // 图片元素
    }
  ],
  "appState": {
    "viewBackgroundColor": "#RRGGBB",
    "gridSize": number|null
  },
  "files": {
    "file-id": {
      "id": "string",
      "mimeType": "image/...",
      "dataURL": "data:image/...;base64,..."
    }
  }
}
```

## 环境配置

| 变量名 | 默认值 | 描述 |
|--------|--------|------|
| `PORT` | 3000 | 服务端口 |
| `HOST` | 0.0.0.0 | 监听地址 |
| `NODE_ENV` | development | 运行环境 |
| `RENDERER_POOL_SIZE` | 5 | 渲染器池最大大小 |
| `RENDERER_POOL_MIN_SIZE` | 1 | 渲染器池最小大小 |
| `MAX_REQUEST_SIZE` | 50mb | 最大请求体大小 |
| `MAX_FILE_SIZE` | 10485760 | 最大文件大小（10MB） |
| `REDIS_URL` | - | Redis 连接字符串 |
| `CACHE_TTL` | 3600 | 缓存过期时间（秒） |
| `ALLOWED_ORIGINS` | * | CORS 允许的源 |

## 性能优化

### 渲染器池

服务使用渲染器池来管理并发请求：
- 池大小可根据服务器配置调整
- 自动扩容和收缩
- 内存使用优化

### 缓存机制

- Redis 缓存渲染结果
- 基于内容哈希的缓存键
- 可配置缓存过期时间

### 监控指标

```bash
# 获取性能统计
curl http://localhost:3000/stats

# 健康检查
curl http://localhost:3000/health
```

## 部署指南

### Docker 部署

```bash
# 构建镜像
docker build -t your-registry/excalidraw-api:latest .

# 推送镜像
docker push your-registry/excalidraw-api:latest
```

### Kubernetes 部署

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: excalidraw-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: excalidraw-api
  template:
    spec:
      containers:
      - name: excalidraw-api
        image: your-registry/excalidraw-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_URL
          value: "redis://redis-service:6379"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 故障排除

### 常见问题

1. **Canvas 依赖错误**
   ```bash
   # 确保安装了必要的系统依赖
   apk add cairo-dev jpeg-dev pango-dev
   ```

2. **内存不足**
   ```bash
   # 减少渲染器池大小
   export RENDERER_POOL_SIZE=2
   ```

3. **Redis 连接失败**
   ```bash
   # 检查 Redis 服务状态
   docker-compose logs redis
   ```

### 日志查看

```bash
# Docker 日志
docker-compose logs -f excalidraw-api

# 应用日志
tail -f logs/app.log
```

## 开发指南

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 监视模式运行测试
npm run test:watch
```

### 代码风格

```bash
# 检查代码风格
npm run lint

# 自动修复代码风格问题
npm run lint:fix
```

### 添加新功能

1. 在 `src/excalidraw-renderer.js` 中添加新的绘制方法
2. 在 `src/validator.js` 中添加相应的验证规则
3. 添加单元测试
4. 更新 API 文档

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本 Excalidraw 元素渲染
- 多格式输出支持
- Docker 容器化部署