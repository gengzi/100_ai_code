import React from 'react';

function App() {
  return (
    <div className="page">
      <header className="hero">
        <div className="hero__badge">SFTP → S3</div>
        <h1>管理控制台</h1>
        <p>配置 S3 存储、管理 SFTP 用户、查看会话和审计。</p>
      </header>

      <section className="grid">
        <div className="card">
          <h2>快速开始</h2>
          <ol>
            <li>在“存储连接”里添加 S3/OSS/MinIO Endpoint 与凭据</li>
            <li>创建 SFTP 用户并绑定可访问的 bucket/prefix</li>
            <li>启动 SFTP 服务，使用任意 SFTP 客户端连接测试</li>
          </ol>
        </div>
        <div className="card">
          <h2>功能板块</h2>
          <ul>
            <li>用户与密钥管理</li>
            <li>S3 连接与前缀绑定</li>
            <li>会话/传输监控</li>
            <li>审计日志查询与导出</li>
          </ul>
        </div>
        <div className="card">
          <h2>状态</h2>
          <p>后端 API / SFTP 服务待接入。</p>
        </div>
      </section>
    </div>
  );
}

export default App;
