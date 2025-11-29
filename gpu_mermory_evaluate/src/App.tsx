import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';

// 页面组件
import Home from './pages/Home';
import Estimator from './pages/Estimator';

const { Content } = Layout;

const App: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '0' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/estimator" element={<Estimator />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Content>
    </Layout>
  );
};

export default App;