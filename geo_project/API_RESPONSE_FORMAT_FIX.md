# API响应格式修复文档

## 问题描述

前端在调用GEO优化API时收到了后端响应数据，但显示错误。原因是前后端数据结构不匹配。

### 修复前

**后端返回格式：**
```json
{
    "optimizedContent": "主要市场：乍都乍周末市场...",
    "success": true,
    "targetQuery": "2024旅游",
    "originalContent": "2024旅游",
    "timestamp": 1763979726513
}
```

**前端期望格式：**
```json
{
    "success": true,
    "data": {
        "optimizedContent": "...",
        "originalContent": "...",
        "targetQuery": "..."
    }
}
```

## 修复内容

### 后端修改 (GEOController.java)

**修改前：**
```java
Map<String, Object> response = new HashMap<>();
response.put("success", true);
response.put("originalContent", request.getRawContent());
response.put("targetQuery", request.getTargetQuery());
response.put("optimizedContent", optimizedContent);
response.put("timestamp", System.currentTimeMillis());
```

**修改后：**
```java
Map<String, Object> response = new HashMap<>();
response.put("success", true);

// 将优化后的内容包装在data对象中，符合前端期望的结构
Map<String, Object> data = new HashMap<>();
data.put("optimizedContent", optimizedContent);
data.put("originalContent", request.getRawContent());
data.put("targetQuery", request.getTargetQuery());

response.put("data", data);
response.put("timestamp", System.currentTimeMillis());
```

## 修复后的响应格式

**成功响应：**
```json
{
    "success": true,
    "data": {
        "optimizedContent": "主要市场：乍都乍周末市场（开放时间：周六日9:00-18:00）\n\n[需补充：各国具体防疫政策更新、航空公司直飞航线调整]",
        "originalContent": "2024旅游",
        "targetQuery": "2024旅游"
    },
    "timestamp": 1763979726513
}
```

**错误响应（保持不变）：**
```json
{
    "success": false,
    "error": "GEO优化失败: 具体错误信息",
    "timestamp": 1763979726513
}
```

## 前端处理逻辑

### API服务 (api.ts)
```typescript
export const optimizeContent = async (request: OptimizationRequest): Promise<ApiResponse<OptimizationResponse>> => {
  return await api.post('/optimize', request);
};
```

### 前端页面处理 (ContentOptimization/index.tsx)
```typescript
const response = await optimizeContent(request);

if (response.success && response.data?.optimizedContent) {
  setOptimizedContent(response.data.optimizedContent);
  message.success('内容优化成功！');
} else {
  const errorMsg = response.error || response.message || '优化失败，请重试';
  setError(errorMsg);
  message.error(errorMsg);
}
```

## 测试验证

### 1. 手动测试
1. 重启后端服务
2. 在前端页面输入测试内容：
   - 原始内容：`2024旅游`
   - 目标查询：`2024旅游`
3. 点击"优化内容"按钮
4. 验证：
   - ✅ 前端显示优化成功消息
   - ✅ 优化后的内容正确显示在右侧面板
   - ✅ 复制功能正常工作

### 2. API测试
```bash
curl -X POST http://localhost:8095/api/geo/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "rawContent": "2024旅游",
    "targetQuery": "2024旅游"
  }'
```

**期望响应：**
```json
{
  "success": true,
  "data": {
    "optimizedContent": "主要市场：乍都乍周末市场（开放时间：周六日9:00-18:00）\n\n[需补充：各国具体防疫政策更新、航空公司直飞航线调整]",
    "originalContent": "2024旅游",
    "targetQuery": "2024旅游"
  },
  "timestamp": 1763979726513
}
```

### 3. 错误测试
```bash
curl -X POST http://localhost:8095/api/geo/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "rawContent": "",
    "targetQuery": ""
  }'
```

**期望响应：**
```json
{
  "success": false,
  "error": "GEO优化失败: 原始内容不能为空",
  "timestamp": 1763979726513
}
```

## 相关文件

- **后端控制器：** `src/main/java/com/geo/platform/controller/GEOController.java`
- **前端API服务：** `frontend/src/services/api.ts`
- **前端页面组件：** `frontend/src/pages/ContentOptimization/index.tsx`
- **TypeScript类型：** `frontend/src/types/index.ts`

## 验证步骤

1. **重启后端服务**
   ```bash
   mvn spring-boot:run
   ```

2. **重启前端服务**
   ```bash
   cd frontend && npm run dev
   ```

3. **浏览器测试**
   - 访问 `http://localhost:3057`
   - 进入"内容优化"页面
   - 输入测试数据并提交
   - 检查控制台是否有错误信息

4. **开发者工具检查**
   - 打开F12开发者工具
   - 查看Network标签页
   - 检查API请求和响应数据格式

---

**修复完成时间：** 2025年11月24日
**问题状态：** ✅ 已修复
**向后兼容：** ✅ 是