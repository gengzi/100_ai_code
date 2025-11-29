import React from 'react';
import { Button, Card, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { CalculatorOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <Card style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title level={1} style={{ marginBottom: '20px' }}>
          AI模型GPU显存评估工具
        </Title>
        <Paragraph style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
          专业的AI模型硬件需求评估平台，帮助您精准计算模型显存需求，获得最优GPU配置建议。
        </Paragraph>
        <Space size="large">
          <Button
            type="primary"
            size="large"
            icon={<CalculatorOutlined />}
            onClick={() => navigate('/estimator')}
            style={{ padding: '12px 24px', height: 'auto' }}
          >
            开始评估
          </Button>
        </Space>
      </Card>

      <Card title="核心功能" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <Card size="small" title="精准计算">
            基于模型参数和精度，准确计算显存需求和性能指标
          </Card>
          <Card size="small" title="实时评估">
            参数调整后立即显示结果，支持多种模型类型的快速评估
          </Card>
          <Card size="small" title="GPU推荐">
            内置全面的GPU规格数据库，提供专业的硬件配置建议
          </Card>
        </div>
      </Card>
    </div>
  );
};

export default Home;