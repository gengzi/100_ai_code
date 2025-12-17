import React from 'react';

function App() {
  return (
    <div className="page">
      <header className="hero">
        <div className="hero__badge">SFTP → S3</div>
        <h1>管理控制台</h1>
        <p>配置 S3 存储，管理 SFTP 用户，并查看会话与审计日志。</p>
      </header>

      <section className="grid">
        <div className="card">
          <h2>快速开始</h2>
          <ol>
            <li>在“存储连接”中添加 S3/OSS/MinIO Endpoint 与凭证。</li>
            <li>创建 SFTP 用户并绑定可访问的 bucket/prefix 及权限。</li>
            <li>启动 SFTP 服务，用任意 SFTP 客户端测试连接。</li>
          </ol>
        </div>
        <div className="card">
          <h2>功能模块</h2>
          <ul>
            <li>用户与密钥管理</li>
            <li>S3 连接与前缀绑定</li>
            <li>会话 / 传输监控</li>
            <li>审计日志查询与导出</li>
          </ul>
        </div>
        <div className="card">
          <h2>状态</h2>
          <p>后端 API 与 SFTP 服务对接进行中。</p>
        </div>
      </section>
    </div>
  );
}

export default App;
