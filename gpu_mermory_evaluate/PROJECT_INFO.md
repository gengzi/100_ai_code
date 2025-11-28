# AI模型显存评估工具 - 项目信息

## 项目描述

**项目名称**: AI Model GPU Memory Estimator
**项目类型**: 纯前端Web应用 - AI模型显存需求评估工具
**主要功能**: 根据选择的AI模型和参数，评估所需显存大小和部署性能要求

### 核心功能
- **模型选择**: 支持主流AI模型选择 (LLM, CV, Speech等)
- **参数配置**: 可调整模型参数 (batch size, sequence length, precision等)
- **显存估算**: 实时计算模型推理所需显存
- **性能评估**: 评估不同GPU配置下的输出速度
- **企业级建议**: 提供企业级部署的硬件配置建议
- **结果可视化**: 图表展示显存使用和性能对比

### 业务流程
1. 用户选择AI模型类型 (GPT, LLaMA, Stable Diffusion等)
2. 配置模型参数 (模型大小、输入尺寸、batch size等)
3. 选择推理精度 (FP32, FP16, INT8等)
4. 系统计算显存需求和性能指标
5. 提供GPU配置建议和预期输出速度

## 技术栈

### 前端框架
- **React**: 18.0+ (主要UI框架)
- **TypeScript**: 5.0+ (类型安全)
- **Vite**: 4.0+ (构建工具)

### UI组件库
- **Ant Design**: 5.0+ (UI组件库)
- **Recharts**: 2.0+ (图表可视化)
- **React Router**: 6.0+ (路由管理)

### 状态管理
- **Zustand**: 轻量级状态管理
- **React Query**: 数据获取和缓存

### 样式方案
- **Tailwind CSS**: 3.0+ (原子化CSS)
- **CSS Modules**: 组件级样式隔离

### 数据处理
- **Axios**: HTTP请求
- **Day.js**: 时间处理
- **Lodash**: 工具函数库

### 开发工具
- **Git**: 版本控制
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **Husky**: Git hooks
- **TypeScript**: 类型检查

## 项目结构

```
ai-model-gpu-estimator/
├── PROJECT_INFO.md              # 项目信息文档 (本文件)
├── README.md                    # 用户说明文档
├── package.json                 # 依赖配置
├── tsconfig.json               # TypeScript配置
├── vite.config.ts              # Vite构建配置
├── tailwind.config.js          # Tailwind配置
├── .eslintrc.js                # ESLint配置
├── .prettierrc                 # Prettier配置
├── .gitignore                  # Git忽略文件
├── public/                     # 静态资源
│   ├── index.html
│   ├── favicon.ico
│   └── models/                 # 模型数据文件
├── src/                        # 源代码目录
│   ├── main.tsx                # 应用入口
│   ├── App.tsx                 # 根组件
│   ├── vite-env.d.ts          # Vite类型声明
│   ├── components/            # 通用组件
│   │   ├── ModelSelector/     # 模型选择组件
│   │   ├── ParameterConfig/   # 参数配置组件
│   │   ├── ResultDisplay/     # 结果显示组件
│   │   ├── PerformanceChart/  # 性能图表组件
│   │   └── GPUSuggestion/     # GPU建议组件
│   ├── pages/                 # 页面组件
│   │   ├── Home/              # 首页
│   │   ├── Estimator/         # 估算器主页面
│   │   └── Compare/           # 对比页面
│   ├── hooks/                 # 自定义Hooks
│   │   ├── useModelCalculation.ts
│   │   ├── useGPUData.ts
│   │   └── useLocalStorage.ts
│   ├── stores/                # 状态管理
│   │   ├── modelStore.ts      # 模型配置状态
│   │   └── resultStore.ts     # 计算结果状态
│   ├── utils/                 # 工具函数
│   │   ├── modelCalculations.ts # 模型计算逻辑
│   │   ├── gpuDatabase.ts      # GPU数据库
│   │   ├── constants.ts        # 常量定义
│   │   └── formatters.ts       # 数据格式化
│   ├── types/                 # TypeScript类型定义
│   │   ├── model.ts           # 模型相关类型
│   │   ├── gpu.ts             # GPU相关类型
│   │   └── common.ts          # 通用类型
│   └── styles/                # 样式文件
│       ├── globals.css        # 全局样式
│       └── components/        # 组件样式
├── tests/                     # 测试目录
│   ├── __tests__/             # 单元测试
│   ├── components/            # 组件测试
│   └── utils/                 # 工具函数测试
└── docs/                      # 文档目录
    ├── api.md                 # API文档
    └── development.md         # 开发文档
```

## 开发规范

### 代码规范

#### 1. TypeScript/React代码风格
- **ESLint + Prettier**: 自动化代码格式化和检查
- **缩进**: 2个空格，使用Tab会被转换为空格
- **行长限制**: 每行最多100字符
- **命名规范**:
  - 组件名: `PascalCase` (例: `ModelSelector`)
  - 函数/变量名: `camelCase` (例: `getGPUInfo`)
  - 常量: `UPPER_SNAKE_CASE` (例: `DEFAULT_BATCH_SIZE`)
  - 接口/类型: `PascalCase` (例: `ModelConfig`)

#### 2. 组件规范
- **函数组件**: 优先使用函数组件 + Hooks
- **Props接口**: 每个组件都要定义Props接口
- **默认导出**: 组件使用默认导出

```typescript
interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  disabled = false
}) => {
  return (
    <Select
      value={selectedModel}
      onChange={onModelChange}
      disabled={disabled}
    >
      {/* options */}
    </Select>
  );
};

export default ModelSelector;
```

#### 3. 错误处理
- **边界处理**: 使用Error Boundary捕获组件错误
- **异步错误**: 使用try-catch处理异步操作
- **用户提示**: 友好的错误信息展示

```typescript
const handleCalculation = async () => {
  try {
    const result = await calculateModelMemory(config);
    setResult(result);
  } catch (error) {
    console.error('Calculation failed:', error);
    message.error('模型计算失败，请检查参数配置');
  }
};
```

### 文件规范

#### 1. 文件命名
- **组件文件**: `PascalCase.tsx` (例: `ModelSelector.tsx`)
- **Hook文件**: `use*.ts` (例: `useModelCalculation.ts`)
- **工具文件**: `camelCase.ts` (例: `modelCalculations.ts`)
- **类型文件**: `camelCase.ts` (例: `modelTypes.ts`)
- **样式文件**: `camelCase.module.css` (例: `ModelSelector.module.css`)
- **配置文件**: `kebab-case.config.js` (例: `vite.config.ts`)

#### 2. 文件组织
- **单一职责**: 每个文件专注单一功能
- **组件模块化**: 组件、样式、类型、逻辑分离
- **导入顺序**: React → 第三方库 → 本地组件 → 工具函数 → 类型

```typescript
// React相关
import React, { useState, useEffect } from 'react';
import { Button, Select, Input } from 'antd';

// 本地组件
import ModelSelector from '../ModelSelector';
import ResultDisplay from '../ResultDisplay';

// 工具函数
import { calculateModelMemory } from '../../utils/modelCalculations';
import { formatGB } from '../../utils/formatters';

// 类型定义
import { ModelConfig, GPUSpec } from '../../types/model';
```

### 测试规范

#### 1. 测试结构
- **组件测试**: 使用React Testing Library测试组件渲染和交互
- **单元测试**: 测试工具函数和业务逻辑
- **集成测试**: 测试组件间协作和数据流

#### 2. 测试命名和文件
- **测试文件**: `*.test.tsx` 或 `*.test.ts`
- **测试命名**: `describe` + `it` 结构
- **Mock数据**: 统一在`__mocks__`目录管理

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ModelSelector from './ModelSelector';

describe('ModelSelector', () => {
  it('renders model selection options', () => {
    render(<ModelSelector selectedModel="" onModelChange={jest.fn()} />);
    expect(screen.getByText('选择模型')).toBeInTheDocument();
  });

  it('calls onModelChange when model is selected', () => {
    const mockOnChange = jest.fn();
    render(<ModelSelector selectedModel="" onModelChange={mockOnChange} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'gpt-3.5' } });
    expect(mockOnChange).toHaveBeenCalledWith('gpt-3.5');
  });
});
```

### Git规范

#### 1. 分支策略
- **main**: 主分支，稳定版本
- **develop**: 开发分支，集成新功能
- **feature/***: 功能分支
- **bugfix/***: 修复分支

#### 2. 提交信息格式
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建工具、依赖更新

**示例**:
```
feat(model-selector): add LLM model support

- Add GPT, LLaMA, Claude model options
- Support custom parameter configuration
- Update model database

Closes #1
```

### 性能要求

#### 1. 前端性能
- **首屏加载**: < 2秒
- **交互响应**: < 100ms
- **内存使用**: 合理控制，避免内存泄漏
- **打包体积**: 生产环境 < 1MB

#### 2. 计算性能
- **实时计算**: 参数变化时立即更新结果
- **批量计算**: 支持多模型对比计算
- **缓存策略**: 缓存计算结果，避免重复计算

### 用户体验规范

#### 1. 界面设计
- **响应式设计**: 支持桌面和移动端
- **无障碍访问**: 遵循WCAG 2.1标准
- **暗色模式**: 支持明暗主题切换
- **国际化**: 支持中英文切换

#### 2. 交互设计
- **即时反馈**: 参数调整时实时显示结果
- **加载状态**: 计算过程中显示加载动画
- **错误提示**: 友好的错误信息和建议
- **键盘导航**: 支持键盘操作

## 数据模型

### 模型配置类型
```typescript
interface ModelConfig {
  id: string;
  name: string;
  type: 'llm' | 'cv' | 'audio' | 'multimodal';
  parameters: {
    modelSize: number;        // 模型参数量 (B)
    sequenceLength?: number;  // 序列长度
    batchSize: number;        // 批次大小
    precision: 'fp32' | 'fp16' | 'int8' | 'int4';
  };
}
```

### GPU规格类型
```typescript
interface GPUSpec {
  id: string;
  name: string;
  memoryGB: number;
  memoryBandwidth: number;
  computeUnits: number;
  tflops: number;
  price?: number;
}
```

### 计算结果类型
```typescript
interface CalculationResult {
  modelConfig: ModelConfig;
  memoryUsage: {
    modelWeights: number;     // 模型权重内存
    activations: number;      // 激活值内存
    gradients: number;        // 梯度内存
    optimizer: number;        // 优化器内存
    total: number;            // 总内存
  };
  performance: {
    tokensPerSecond?: number;  // tokens/秒 (LLM)
    fps?: number;             // 帧/秒 (CV)
    latency: number;          // 延迟 (ms)
  };
  recommendedGPUs: GPUSpec[];
}
```

## 部署要求

### 1. 构建要求
- **静态部署**: 纯静态文件，支持CDN
- **环境变量**: 支持不同环境配置
- **压缩优化**: Gzip/Brotli压缩
- **缓存策略**: 合理的浏览器缓存配置

### 2. 浏览器兼容性
- **现代浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **移动端**: iOS Safari 14+, Chrome Mobile 90+
- **渐进增强**: 核心功能支持，高级特性降级

---

**项目维护**: 请在开发过程中遵循以上规范，确保代码质量、性能和用户体验。

### 文档规范

#### 1. README.md结构
- 项目简介
- 安装说明
- 使用方法
- API文档
- 示例代码
- 贡献指南

#### 2. 代码文档
- **公共API**: 必须有完整docstring
- **复杂逻辑**: 添加详细注释
- **配置参数**: 说明参数含义和取值范围

## 性能要求

### 1. 内存效率
- 避免内存泄漏
- 及时释放GPU内存
- 监控内存使用峰值

### 2. 执行效率
- 合理的监控间隔
- 异步处理支持
- 批量操作优化

## 兼容性要求

### 1. Python版本
- **最低**: Python 3.7
- **推荐**: Python 3.8+
- **测试**: 3.7, 3.8, 3.9, 3.10, 3.11

### 2. GPU支持
- **NVIDIA**: CUDA 11.0+
- **PyTorch**: 支持对应CUDA版本
- **多GPU**: 支持多GPU环境

## 安全考虑

### 1. 输入验证
- 参数类型检查
- 数值范围验证
- 防止注入攻击

### 2. 权限管理
- 最小权限原则
- GPU资源访问控制

## 部署要求

### 1. 环境依赖
- NVIDIA驱动程序
- CUDA Toolkit
- Python环境

### 2. 配置管理
- 支持配置文件
- 环境变量支持
- 命令行参数

---

**项目维护**: 请在修改代码时遵循以上规范，确保代码质量和可维护性。