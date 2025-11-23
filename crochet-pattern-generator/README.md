# 钩针图解生成器

一个可以将图片转换为钩针编织图解的Web应用，支持自定义尺寸、颜色选择和详细的编织说明。

## 🌟 功能特点

- 📸 **图片上传**: 支持 JPG、PNG、GIF、WebP 等多种图片格式
- 🎨 **智能提取**: 自动提取图片中的主要颜色并映射到标准毛线颜色
- 📏 **自定义尺寸**: 可调节图解的宽度、高度和每行钩针数
- 🧵 **颜色简化**: 支持不同级别的颜色简化，适应复杂度不同的图片
- 📝 **详细说明**: 自动生成包含短针、长针等针法的详细编织教程
- 📊 **可视化**: 清晰的网格显示和颜色图例
- 📤 **多种导出**: 支持 PDF、PNG、JPG 格式导出
- 🖨️ **打印支持**: 优化的打印布局
- 📱 **响应式设计**: 完美适配桌面和移动设备

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式框架**: Tailwind CSS
- **UI组件**: Headless UI + Lucide Icons
- **图片处理**: Canvas API
- **文件上传**: React Dropzone
- **导出功能**: html2canvas + jsPDF

## 📁 项目结构

```
crochet-pattern-generator/
├── src/
│   ├── components/          # React 组件
│   │   ├── ImageUpload.tsx     # 图片上传组件
│   │   ├── PatternGrid.tsx     # 图解网格显示
│   │   ├── CrochetInstructions.tsx  # 编织说明
│   │   └── ExportPanel.tsx     # 导出面板
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts           # 主要类型定义
│   ├── utils/              # 工具函数
│   │   ├── imageProcessor.ts  # 图片处理
│   │   ├── crochetGenerator.ts # 钩针指令生成
│   │   └── exportUtils.ts     # 导出工具
│   ├── hooks/              # React Hooks
│   ├── styles/             # 样式文件
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── public/                 # 静态资源
├── package.json            # 项目配置
├── tailwind.config.js      # Tailwind 配置
├── tsconfig.json          # TypeScript 配置
└── vite.config.ts         # Vite 配置
```

## 🧶 使用说明

1. **上传图片**: 点击或拖拽图片到上传区域
2. **设置参数**: 调整图解尺寸、颜色数量、简化程度等
3. **生成图解**: 系统自动处理图片并生成钩针图解
4. **查看结果**: 在"图解网格"标签页查看生成的图解
5. **编织说明**: 在"编织说明"标签页查看详细教程
6. **导出分享**: 在"导出分享"标签页导出或分享图解

## 🎯 核心功能

### 图片处理算法

- **颜色量化**: 使用 K-means 聚类算法提取主要颜色
- **颜色映射**: 将图片颜色映射到标准毛线颜色调色板
- **网格化**: 将图片转换为指定尺寸的像素网格
- **简化算法**: 支持不同程度的颜色简化

### 编织指令生成

- **多种针法**: 支持短针(X)、长针(V)、中长针(H)、特长针(T)
- **颜色变化**: 自动检测和标记颜色变化位置
- **行号管理**: 完整的行号和计数信息
- **时间估算**: 根据技能水平估算编织时间

### 导出功能

- **PDF导出**: 包含图解和完整说明的PDF文档
- **图片导出**: 高质量的PNG/JPG图片
- **文本说明**: 可下载的文本格式说明
- **打印优化**: 专门优化的打印布局

## 🔧 自定义配置

### 颜色调色板

可以在 `src/utils/imageProcessor.ts` 中修改 `YARN_COLOR_PALETTE` 来自定义毛线颜色：

```typescript
export const YARN_COLOR_PALETTE: YarnColor[] = [
  { id: 'custom-red', name: '自定义红色', hexCode: '#FF0000', rgb: { r: 255, g: 0, b: 0 } },
  // 添加更多颜色...
];
```

### 默认设置

可以在 `src/App.tsx` 中修改 `defaultSettings` 来调整默认参数：

```typescript
const defaultSettings: PatternSettings = {
  width: 50,           // 默认宽度
  height: 50,          // 默认高度
  stitchesPerRow: 20,  // 默认每行针数
  maxColors: 8,        // 默认最大颜色数
  // ...更多设置
};
```

## 🤝 贡献指南

1. Fork 这个项目
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📝 许可证

这个项目使用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙋‍♀️ 常见问题

### Q: 支持哪些图片格式？
A: 支持 JPG、PNG、GIF、BMP、WebP 等常见图片格式，建议文件大小不超过 10MB。

### Q: 如何获得最佳效果？
A: 建议使用对比度高、颜色简洁的图片。复杂图片可以增加颜色简化程度。

### Q: 可以自定义针法吗？
A: 目前支持短针、长针、中长针、特长针等常用针法，可以在设置中选择。

### Q: 导出的PDF可以打印吗？
A: 是的，PDF格式专门为打印优化，支持高DPI输出。

## 📞 联系我们

如果你有任何问题或建议，欢迎：

- 提交 Issue
- 发送邮件
- 参与讨论

---

🧶 让编织变得更简单、更有趣！