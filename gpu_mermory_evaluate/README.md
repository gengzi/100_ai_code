# AI模型GPU显存评估工具

专业的AI模型硬件需求评估平台，帮助您精准计算模型显存需求，获得最优GPU配置建议。

## 🚀 功能特性

- **多模型支持**: 支持大语言模型(LLM)、计算机视觉(CV)、音频处理(Audio)、多模态(Multimodal)模型
- **精准计算**: 基于模型参数和精度，准确计算显存需求和性能指标
- **实时评估**: 参数调整后立即显示结果，支持多种模型类型的快速评估
- **GPU推荐**: 内置全面的GPU规格数据库，提供专业的硬件配置建议
- **性能分析**: 详细的性能分析和GPU硬件配置对比
- **企业级建议**: 针对企业部署场景提供专业的硬件配置方案

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件**: Ant Design
- **图表库**: Recharts
- **状态管理**: Zustand
- **样式方案**: Tailwind CSS
- **开发工具**: ESLint + Prettier

## 📋 系统要求

- Node.js 18.0+
- npm 9.0+ 或 yarn 1.22+

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

或使用 yarn:

```bash
yarn install
```

### 2. 启动开发服务器

```bash
npm run dev
```

或使用 yarn:

```bash
yarn dev
```

应用将在 http://localhost:3000 启动

### 3. 构建生产版本

```bash
npm run build
```

或使用 yarn:

```bash
yarn build
```

构建文件将输出到 `dist/` 目录

### 4. 预览生产版本

```bash
npm run preview
```

或使用 yarn:

```bash
yarn preview
```

## 📖 使用说明

### 基本使用流程

1. **选择模型类型**: 支持LLM、CV、Audio、多模态四种模型类型
2. **配置模型参数**:
   - 设置模型大小（参数量）
   - 选择推理精度（FP32/FP16/INT8/INT4）
   - 配置批次大小
   - 根据模型类型设置特定参数（序列长度、图像尺寸等）
3. **开始计算**: 点击"开始计算"按钮，系统将自动计算内存需求
4. **查看结果**:
   - 查看详细的内存使用分析
   - 了解预估性能指标
   - 获得GPU配置推荐

### 支持的预定义模型

- **大语言模型**: GPT-3.5 Turbo, GPT-4, LLaMA 2, Claude 3
- **计算机视觉**: ResNet-50, Stable Diffusion XL
- **音频处理**: Whisper Large
- **多模态**: GPT-4 Vision

## 🏗️ 项目结构

```
src/
├── components/          # React组件
│   ├── ModelSelector/   # 模型选择器
│   ├── ParameterConfig/ # 参数配置
│   ├── ResultDisplay/   # 结果展示
│   └── GPUSuggestion/   # GPU推荐
├── pages/               # 页面组件
│   ├── Home/           # 首页
│   └── Estimator/      # 评估器页面
├── stores/             # 状态管理
│   └── modelStore.ts   # 模型配置状态
├── utils/              # 工具函数
│   ├── modelCalculations.ts  # 模型计算逻辑
│   ├── gpuDatabase.ts         # GPU数据库
│   ├── constants.ts           # 常量定义
│   └── formatters.ts          # 格式化工具
├── types/              # TypeScript类型定义
│   ├── model.ts        # 模型相关类型
│   ├── gpu.ts          # GPU相关类型
│   └── common.ts       # 通用类型
└── styles/             # 样式文件
    └── globals.css     # 全局样式
```

## 🔧 开发命令

```bash
# 开发模式
npm run dev

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 代码格式化
npm run format

# 运行测试
npm run test

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 📊 GPU数据库

项目内置了主流GPU的规格数据，包括：

- **NVIDIA**: RTX 20/30/40系列、A系列、H系列
- **AMD**: RX 7000系列
- **Intel**: Arc系列

每款GPU包含：
- 显存容量和带宽
- 不同精度下的算力
- 价格和功耗信息
- 架构和特性

## 🧮 计算原理

### 内存计算
- **模型权重**: 模型参数量 × 每个参数字节数 × 开销系数
- **激活值**: 基于模型架构和输入尺寸计算
- **KV缓存**: LLM模型特有的缓存开销
- **梯度/优化器**: 训练模式的额外开销

### 性能估算
- 基于GPU理论算力和效率系数
- 考虑内存带宽利用率
- 针对不同模型类型的特性优化

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 支持

如果您遇到问题或有建议，请：

1. 查看 [项目文档](docs/)
2. 搜索现有的 [Issues](../../issues)
3. 创建新的 Issue 描述您的问题

## 🙏 致谢

- [React](https://reactjs.org/) - UI框架
- [Ant Design](https://ant.design/) - UI组件库
- [Vite](https://vitejs.dev/) - 构建工具
- [TypeScript](https://www.typescriptlang.org/) - 类型支持

---

**AI模型GPU显存评估工具** - 让AI部署更简单 🚀