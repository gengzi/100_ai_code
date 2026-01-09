# PPT 演示系统

一个基于 React + TypeScript + Vite 构建的现代化 PPT 演示系统。

## 功能特性

- ✨ 流畅的幻灯片切换动画
- ⌨️ 键盘快捷键支持（左右箭头、空格键）
- 📱 响应式设计，支持移动端
- 🎨 多种布局样式：标题页、内容页、代码页、两列布局
- 📊 进度条和页码指示器
- 🎯 底部缩略图快速导航

## 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 快速的开发构建工具
- **CSS3** - 动画和样式

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 键盘快捷键

- `←` 或 `→` - 切换幻灯片
- `空格键` - 下一张幻灯片
- `Home` - 跳转到第一张
- `End` - 跳转到最后一张

## 项目结构

```
ppt-frontend/
├── src/
│   ├── components/      # React 组件
│   │   ├── Presentation.tsx  # 主演示组件
│   │   └── Slide.tsx         # 单个幻灯片组件
│   ├── types/           # TypeScript 类型定义
│   │   └── slide.ts
│   ├── data/            # 演示文稿数据
│   │   └── presentation.ts
│   ├── styles/          # CSS 样式
│   │   └── presentation.css
│   ├── App.tsx          # 应用入口
│   └── main.tsx         # 主入口文件
├── public/              # 静态资源
├── index.html           # HTML 模板
└── package.json         # 项目配置
```

## 自定义演示内容

编辑 `src/data/presentation.ts` 文件来自定义你的演示内容：

```typescript
export const samplePresentation: Presentation = {
  title: '你的演示标题',
  slides: [
    {
      id: '1',
      title: '幻灯片标题',
      content: '幻灯片内容（支持HTML）',
      layout: 'title', // 或 'content', 'two-column', 'code', 'image'
      background: 'linear-gradient(...)' // 可选背景
    },
    // 更多幻灯片...
  ]
};
```

## 支持的布局类型

- `title` - 标题页，适合封面和结尾
- `content` - 内容页，支持 HTML 内容
- `two-column` - 两列布局，使用 `||` 分隔内容
- `code` - 代码展示页
- `image` - 图片展示页

## 开发建议

1. 修改演示内容：编辑 `src/data/presentation.ts`
2. 自定义样式：修改 `src/styles/presentation.css`
3. 扩展布局：在 `src/components/Slide.tsx` 添加新的布局类型

## 许可证

MIT

