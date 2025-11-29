import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  RobotOutlined,
  SendOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useLocation, Link } from 'react-router-dom';

// 页面组件
import Dashboard from '@/pages/Dashboard';
import ContentOptimization from '@/pages/ContentOptimization';
import PublishManagement from '@/pages/PublishManagement';
import History from '@/pages/History';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const location = useLocation();

  // 菜单配置
  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link to="/">仪表板</Link>,
    },
    {
      key: '/content-optimization',
      icon: <RobotOutlined />,
      label: <Link to="/content-optimization">内容优化</Link>,
    },
    {
      key: '/publish-management',
      icon: <SendOutlined />,
      label: <Link to="/publish-management">发布管理</Link>,
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: <Link to="/history">历史记录</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        theme="dark"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div className="logo">
          GEO平台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>

      <Layout style={{ marginLeft: 200 }}>
        <Header style={{ padding: 0, background: '#fff', boxShadow: '0 1px 4px rgba(0,21,41,.08)' }}>
          <div style={{ paddingLeft: '24px', fontSize: '18px', fontWeight: 'bold' }}>
            GEO内容生成平台
          </div>
        </Header>

        <Content style={{ margin: 0, overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/content-optimization" element={<ContentOptimization />} />
            <Route path="/publish-management" element={<PublishManagement />} />
            <Route path="/history" element={<History />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;