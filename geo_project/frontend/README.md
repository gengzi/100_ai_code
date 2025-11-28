# GEO内容生成平台 - 前端

基于React + TypeScript + Ant Design构建的现代化前端应用，用于与GEO内容生成平台后端服务交互。

## 功能特性

- 🤖 **AI内容优化** - 使用智能AI技术优化内容，适配生成式搜索引擎
- 📱 **多平台发布** - 一键发布到微博、小红书、知乎、抖音等平台
- 📊 **数据统计** - 实时查看发布状态和统计数据
- 📝 **历史记录** - 完整的内容管理和历史追踪
- 🎨 **现代化UI** - 基于Ant Design的专业界面设计

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件**: Ant Design 5
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **路由**: React Router 6

## 开始使用

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
cd frontend
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 http://localhost:3055 启动，并自动代理API请求到后端服务 (http://localhost:8095)。

### 生产构建

```bash
npm run build
```

构建后的文件将生成在 `dist/` 目录中。

### 代码检查

```bash
npm run lint
```

### 预览构建结果

```bash
npm run preview
```

## 项目结构

```
src/
├── components/          # 通用组件
├── pages/              # 页面组件
│   ├── Dashboard/      # 仪表板页面
│   ├── ContentOptimization/ # 内容优化页面
│   ├── PublishManagement/   # 发布管理页面
│   └── History/        # 历史记录页面
├── services/           # API服务层
│   └── api.ts         # API调用封装
├── stores/            # 状态管理
│   ├── useContentStore.ts # 内容状态
│   └── usePlatformStore.ts # 平台状态
├── types/             # TypeScript类型定义
│   └── index.ts       # 通用类型
├── App.tsx            # 主应用组件
├── main.tsx           # 应用入口
└── index.css          # 全局样式
```

## API集成

前端应用会自动代理API请求到后端服务：

- `GET /api/geo/health` - 健康检查
- `POST /api/geo/optimize` - 内容优化
- `POST /api/geo/platform/{type}/initialize` - 平台初始化
- `POST /api/geo/platform/{type}/login` - 平台登录
- `POST /api/geo/platform/{type}/publish` - 平台发布
- `POST /api/geo/batch-publish` - 批量发布

## 使用说明

### 1. 内容优化流程

1. 访问"内容优化"页面
2. 输入目标查询关键词
3. 输入原始内容
4. 点击"开始优化"按钮
5. 等待AI优化完成
6. 复制优化后的内容或直接跳转到发布页面

### 2. 发布管理流程

1. 在"发布管理"页面选择要发布的平台
2. 确保相关平台已登录（未登录需要先登录）
3. 点击"批量发布"按钮
4. 等待发布完成，查看发布结果

### 3. 历史记录

1. 在"历史记录"页面查看所有内容处理记录
2. 支持搜索和筛选功能
3. 可以查看详细信息和复制内容

## 环境变量

可以通过环境变量配置后端API地址：

```bash
VITE_API_BASE_URL=http://localhost:8095/api/geo
```

## 故障排除

### 常见问题

1. **API请求失败**
   - 确保后端服务正在运行 (http://localhost:8080)
   - 检查后端API接口是否正常

2. **内容优化失败**
   - 检查AI API密钥配置
   - 确认网络连接正常

3. **平台登录失败**
   - 确保浏览器自动化服务正常运行
   - 检查相关平台账号状态

### 开发工具

项目配置了完整的开发工具链：

- **ESLint** - 代码质量检查
- **TypeScript** - 类型安全
- **Vite** - 快速构建工具
- **Ant Design** - UI组件库

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。