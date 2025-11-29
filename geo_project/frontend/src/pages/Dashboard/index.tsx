import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Button,
  Timeline,
  Progress,
  Tag
} from 'antd';
import {
  RobotOutlined,
  SendOutlined,
  HistoryOutlined,
  TrophyOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { healthCheck } from '@/services/api';
import { useContentStore } from '@/stores/useContentStore';
import { usePlatformStore } from '@/stores/usePlatformStore';
import type { HealthResponse } from '@/types';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { contentHistory } = useContentStore();
  const { platforms } = usePlatformStore();

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  const fetchHealthStatus = async () => {
    try {
      const response = await healthCheck();
      if (response.success && response.data) {
        setHealthStatus(response.data);
      }
    } catch (error) {
      console.error('获取健康状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 统计数据
  const stats = {
    totalContent: contentHistory.length,
    publishedContent: contentHistory.filter(item => item.status === 'PUBLISHED').length,
    optimizedContent: contentHistory.filter(item => item.status === 'OPTIMIZED').length,
    failedContent: contentHistory.filter(item => item.status === 'FAILED').length,
    loggedInPlatforms: platforms.filter(p => p.loggedIn).length
  };

  const recentActivities = contentHistory.slice(0, 5).map(item => ({
    content: `${item.targetQuery} - ${getStatusText(item.status)}`,
    timestamp: new Date(item.createdAt).toLocaleString(),
    status: item.status
  }));

  const getStatusText = (status: string) => {
    const statusMap = {
      PENDING: '待处理',
      OPTIMIZED: '已优化',
      PUBLISHED: '已发布',
      FAILED: '处理失败'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      PENDING: 'default',
      OPTIMIZED: 'processing',
      PUBLISHED: 'success',
      FAILED: 'error'
    };
    return colorMap[status as keyof typeof colorMap] || 'default';
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={2}>
          🌟 GEO内容生成平台
        </Title>
        <Text type="secondary" style={{ fontSize: '16px' }}>
          智能优化内容，一键发布到多个平台
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总内容数"
              value={stats.totalContent}
              prefix={<HistoryOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已发布"
              value={stats.publishedContent}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已优化"
              value={stats.optimizedContent}
              prefix={<RobotOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="登录平台"
              value={stats.loggedInPlatforms}
              suffix={`/ ${platforms.length}`}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          {/* 快速操作 */}
          <Card title="快速操作" style={{ marginBottom: '16px' }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    <RobotOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                    内容优化
                  </Title>
                  <Text type="secondary">
                    使用AI技术将内容优化为生成式搜索引擎友好格式
                  </Text>
                </div>
                <Button type="primary" size="large" href="/content-optimization">
                  开始优化 <ArrowRightOutlined />
                </Button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    <SendOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                    发布管理
                  </Title>
                  <Text type="secondary">
                    将优化后的内容发布到多个社交媒体平台
                  </Text>
                </div>
                <Button size="large" href="/publish-management">
                  管理发布 <ArrowRightOutlined />
                </Button>
              </div>
            </Space>
          </Card>

          {/* 最近活动 */}
          <Card title="最近活动">
            {recentActivities.length > 0 ? (
              <Timeline
                items={recentActivities.map((activity, index) => ({
                  children: (
                    <div>
                      <div>{activity.content}</div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {activity.timestamp}
                      </Text>
                    </div>
                  ),
                  color: activity.status === 'PUBLISHED' ? 'green' :
                         activity.status === 'FAILED' ? 'red' :
                         activity.status === 'OPTIMIZED' ? 'blue' : 'gray'
                }))}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <Text>暂无活动记录</Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* 系统状态 */}
          <Card title="系统状态" style={{ marginBottom: '16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                加载中...
              </div>
            ) : healthStatus ? (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong>整体状态: </Text>
                  <Tag color={healthStatus.status === 'UP' ? 'success' : 'error'}>
                    {healthStatus.status === 'UP' ? '正常运行' : '服务异常'}
                  </Tag>
                </div>

                <div>
                  <Text strong>数据库: </Text>
                  <Tag color={healthStatus.services.database === 'UP' ? 'success' : 'error'}>
                    {healthStatus.services.database === 'UP' ? '正常' : '异常'}
                  </Tag>
                </div>

                <div>
                  <Text strong>AI服务: </Text>
                  <Tag color={healthStatus.services.ai === 'UP' ? 'success' : 'error'}>
                    {healthStatus.services.ai === 'UP' ? '正常' : '异常'}
                  </Tag>
                </div>

                <div>
                  <Text strong>平台状态:</Text>
                  <div style={{ marginTop: '8px' }}>
                    {Object.entries(healthStatus.services.platforms).map(([platform, status]) => (
                      <div key={platform} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Text>{platform}: </Text>
                        <Tag color={status === 'UP' ? 'success' : 'error'} size="small">
                          {status === 'UP' ? '可用' : '不可用'}
                        </Tag>
                      </div>
                    ))}
                  </div>
                </div>
              </Space>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                无法获取系统状态
              </div>
            )}
          </Card>

          {/* 平台登录状态 */}
          <Card title="平台登录状态">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {platforms.map((platform) => (
                <div key={platform.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    {platform.icon} {platform.name}
                  </span>
                  <Tag color={platform.loggedIn ? 'success' : 'default'}>
                    {platform.loggedIn ? '已登录' : '未登录'}
                  </Tag>
                </div>
              ))}

              <Progress
                percent={Math.round((stats.loggedInPlatforms / platforms.length) * 100)}
                status="active"
                format={() => `${stats.loggedInPlatforms}/${platforms.length}`}
              />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;