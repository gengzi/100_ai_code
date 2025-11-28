# Excalidraw API 文档

## 服务概述

Excalidraw API 是一个高性能的服务，可以将 Excalidraw JSON 数据渲染为图片。

**基础URL**: `http://localhost:3000`

## 目录

- [快速开始](#快速开始)
- [API 端点](#api-端点)
- [数据格式](#数据格式)
- [错误处理](#错误处理)
- [性能优化](#性能优化)

## 快速开始

### 1. 健康检查

```bash
curl http://localhost:3000/health
```

### 2. 基本渲染

```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -d @your-excalidraw.json \
  --output output.png
```

## API 端点

### 1. 系统状态

#### `GET /health`
检查服务健康状态

**响应示例:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "pool": { ... },
  "stats": { ... }
}
```

#### `GET /stats`
获取性能统计信息

**响应示例:**
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "uptime": 3600,
  "memory": { ... },
  "pool": { ... },
  "requests": { ... }
}
```

#### `GET /api`
获取 API 文档

### 2. 渲染接口

#### `POST /api/render`
JSON 数据渲染

**请求头:**
```
Content-Type: application/json
```

**查询参数:**
- `format`: 输出格式 (`png`|`jpeg`|`webp`)，默认 `png`
- `quality`: 图片质量 (1-100)，默认 `90`
- `width`: 画布宽度
- `height`: 画布高度
- `backgroundColor`: 背景颜色

**请求体:**
```json
{
  "type": "excalidraw",
  "version": 2,
  "elements": [...],
  "appState": {...},
  "files": {...}
}
```

**响应:**
- 直接返回图片二进制数据
- 响应头包含性能信息：
  - `X-Render-Time`: 渲染时间(ms)
  - `X-Elements-Count`: 元素数量
  - `X-Cache`: 缓存状态

#### `POST /api/render/file`
文件上传渲染

**请求参数 (multipart/form-data):**
- `file`: JSON 文件 (必填)
- `format`: 输出格式 (可选)
- `quality`: 图片质量 (可选)
- `backgroundColor`: 背景颜色 (可选)
- `width`: 画布宽度 (可选)
- `height`: 画布高度 (可选)

**文件要求:**
- 格式: JSON
- 大小: 最大 10MB

## 数据格式

### 基本结构

```json
{
  "type": "excalidraw",
  "version": 2,
  "elements": [...],
  "appState": {...},
  "files": {...}
}
```

### 支持的元素类型

#### 矩形 (rectangle)
```json
{
  "id": "unique-id",
  "type": "rectangle",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 100,
  "strokeColor": "#000000",
  "backgroundColor": "#ffffff",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 0,
  "opacity": 100
}
```

#### 文本 (text)
```json
{
  "id": "unique-id",
  "type": "text",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 40,
  "text": "你好世界",
  "fontSize": 20,
  "fontFamily": 1,
  "textAlign": "left",
  "verticalAlign": "top",
  "strokeColor": "#000000",
  "opacity": 100
}
```

#### 箭头 (arrow)
```json
{
  "id": "unique-id",
  "type": "arrow",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 0,
  "points": [[0, 0], [200, 0]],
  "strokeColor": "#000000",
  "strokeWidth": 2,
  "endArrowhead": "arrow",
  "opacity": 100
}
```

### 应用状态 (appState)
```json
{
  "viewBackgroundColor": "#ffffff",
  "gridSize": null,
  "scrollX": 0,
  "scrollY": 0,
  "zoom": { "x": 1, "y": 1 }
}
```

## 使用示例

### 示例 1: 简单矩形和文字

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
        "y": 80,
        "width": 300,
        "height": 200,
        "strokeColor": "#2f9e44",
        "backgroundColor": "#ebfbee",
        "fillStyle": "solid",
        "strokeWidth": 3,
        "opacity": 100
      },
      {
        "id": "text-1",
        "type": "text",
        "x": 200,
        "y": 160,
        "width": 100,
        "height": 40,
        "text": "你好",
        "fontSize": 32,
        "textAlign": "center",
        "strokeColor": "#1c7ed6",
        "opacity": 100
      }
    ],
    "appState": {
      "viewBackgroundColor": "#ffffff"
    }
  }' \
  --output hello.png
```

### 示例 2: 自定义尺寸和格式

```bash
curl -X POST "http://localhost:3000/api/render?width=800&height=600&format=jpeg&quality=85" \
  -H "Content-Type: application/json" \
  -d @your-diagram.json \
  --output diagram.jpg
```

### 示例 3: 文件上传

```bash
curl -X POST http://localhost:3000/api/render/file \
  -F "file=@diagram.json" \
  -F "format=png" \
  -F "quality=90" \
  --output diagram.png
```

## 错误处理

### 错误响应格式

```json
{
  "error": "错误类型",
  "message": "详细描述",
  "details": [ ... ],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 常见错误

| 状态码 | 错误类型 | 描述 |
|--------|----------|------|
| 400 | Invalid data | JSON 数据格式错误或缺少必要字段 |
| 400 | Invalid options | 查询参数无效 |
| 400 | No file uploaded | 文件上传时未提供文件 |
| 408 | Request timeout | 请求超时 |
| 500 | Internal server error | 服务器内部错误 |
| 503 | Service unavailable | 服务不可用 |

### 数据验证错误示例

```json
{
  "error": "Invalid data",
  "details": [
    {
      "field": "elements",
      "message": "至少需要一个图形元素",
      "value": 0
    }
  ]
}
```

## 性能优化

### 缓存机制

- 自动缓存渲染结果
- 基于内容哈希的缓存键
- 默认缓存时间：1小时

### 渲染器池

- 默认池大小：5个渲染器
- 自动扩容和收缩
- 内存优化管理

### 最佳实践

1. **优化数据结构**
   - 移除不必要的元素
   - 合理设置图片尺寸
   - 避免过多的复杂元素

2. **使用合适的格式**
   - PNG：需要透明度时
   - JPEG：照片类图片，文件更小
   - WebP：现代浏览器支持

3. **批量处理**
   - 对于大量图表，使用异步处理
   - 避免同时发送大量请求

## Postman 集合

我已经为你创建了完整的 Postman 集合 (`postman-collection.json`)，包含：

- 🏥 系统状态监控
- 🎨 渲染接口测试
- 📁 文件上传功能
- ❌ 错误场景测试

### 导入步骤

1. 打开 Postman
2. 点击 "Import"
3. 选择 "File" 标签
4. 上传 `postman-collection.json`
5. 设置环境变量 `baseUrl` 为你的服务地址
6. 开始测试！

### 环境变量

```json
{
  "baseUrl": "http://localhost:3000"
}
```

## 故障排除

### 常见问题

1. **Canvas 依赖错误**
   - 确保 Docker 容器正常启动
   - 检查系统依赖是否完整

2. **内存不足**
   - 减少渲染器池大小
   - 优化数据结构

3. **网络超时**
   - 增加请求超时时间
   - 检查服务器负载

### 日志查看

```bash
# Docker 日志
docker-compose logs -f excalidraw-api

# 应用日志（如果有）
tail -f logs/app.log
```

---

## 技术支持

如有问题，请检查：
1. 服务健康状态：`GET /health`
2. 性能统计：`GET /stats`
3. 错误日志：查看服务器日志

祝你使用愉快！🎉