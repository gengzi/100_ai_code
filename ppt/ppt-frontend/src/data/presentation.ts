import { Presentation } from '../types/slide';

export const samplePresentation: Presentation = {
  title: 'React + TypeScript PPT 演示',
  slides: [
    {
      id: '1',
      title: '欢迎使用PPT演示系统',
      content: '基于 React + TypeScript + Vite 构建<br/>支持多种布局和动画效果',
      layout: 'title',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: '2',
      title: '主要功能特性',
      content: `
        <ul>
          <li>✨ 流畅的幻灯片切换动画</li>
          <li>⌨️ 键盘快捷键支持（左右箭头、空格键）</li>
          <li>📱 响应式设计，支持移动端</li>
          <li>🎨 多种布局样式：标题页、内容页、代码页等</li>
          <li>📊 进度条和页码指示器</li>
        </ul>
      `,
      layout: 'content',
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: '3',
      title: '技术栈对比',
      content: 'React || Vue + TypeScript<br/><br/>React: 组件化开发，生态系统完善<br/>Vue: 渐进式框架，学习曲线平缓<br/><br/>TypeScript: 类型安全，提升代码质量',
      layout: 'two-column',
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      id: '4',
      title: '代码示例',
      content: `function Welcome() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Hello, World!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  );
}`,
      layout: 'code',
      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      id: '5',
      title: '项目结构',
      content: `
        <ul>
          <li><strong>src/components/</strong> - React组件</li>
          <li><strong>src/types/</strong> - TypeScript类型定义</li>
          <li><strong>src/styles/</strong> - CSS样式文件</li>
          <li><strong>src/data/</strong> - 演示文稿数据</li>
        </ul>
      `,
      layout: 'content',
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      id: '6',
      title: '键盘快捷键',
      content: `
        <ul style="list-style: none; padding: 0;">
          <li>⬅️ <strong>左箭头</strong> - 上一张幻灯片</li>
          <li>➡️ <strong>右箭头</strong> - 下一张幻灯片</li>
          <li><strong>空格键</strong> - 下一张幻灯片</li>
          <li><strong>Home</strong> - 跳转到第一张</li>
          <li><strong>End</strong> - 跳转到最后一张</li>
        </ul>
      `,
      layout: 'content',
      background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    },
    {
      id: '7',
      title: '使用方法',
      content: `
        <div style="font-size: 1.8rem; line-height: 2;">
          <p>1️⃣ 安装依赖：<code>npm install</code></p>
          <p>2️⃣ 启动开发服务器：<code>npm run dev</code></p>
          <p>3️⃣ 构建生产版本：<code>npm run build</code></p>
        </div>
      `,
      layout: 'content',
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    },
    {
      id: '8',
      title: '谢谢观看！',
      content: '如有问题，请联系开发者<br/><br/>Made with ❤️ using React + TypeScript',
      layout: 'title',
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    }
  ]
};
