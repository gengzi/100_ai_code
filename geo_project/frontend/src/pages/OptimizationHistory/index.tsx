import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Input,
  Row,
  Col,
  Tag,
  Modal,
  message,
  Spin,
  Empty
} from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  EyeOutlined,
  CopyOutlined,
  EditOutlined,
  RocketOutlined
} from '@ant-design/icons';
import {
  getOptimizationRecords,
  searchOptimizationRecords,
  getOptimizationRecord
} from '@/services/api';
import type { OptimizationRecord } from '@/types';

const { Title, Text } = Typography;
const { Search } = Input;

const OptimizationHistory: React.FC = () => {
  const [records, setRecords] = useState<OptimizationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OptimizationRecord | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 加载优化记录
  const loadRecords = async () => {
    setLoading(true);
    try {
      const response = searchKeyword
        ? await searchOptimizationRecords(searchKeyword)
        : await getOptimizationRecords();

      if (response.success && response.data) {
        setRecords(response.data);
      } else {
        message.error(response.error || '获取优化记录失败');
      }
    } catch (err: any) {
      message.error(err.error || '网络错误');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [searchKeyword]);

  // 查看记录详情
  const handleViewDetail = async (record: OptimizationRecord) => {
    try {
      const response = await getOptimizationRecord(record.optimizationId);
      if (response.success && response.data) {
        setSelectedRecord(response.data);
        setDetailModalVisible(true);
      } else {
        message.error(response.error || '获取记录详情失败');
      }
    } catch (err: any) {
      message.error(err.error || '网络错误');
    }
  };

  // 复制优化内容
  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      message.success('内容已复制到剪贴板');
    } catch (err) {
      message.error('复制失败');
    }
  };

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchKeyword(value.trim());
  };

  // 格式化时间
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: OptimizationRecord) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {title || record.targetQuery}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.optimizationId}
          </Text>
        </div>
      ),
    },
    {
      title: '目标查询',
      dataIndex: 'targetQuery',
      key: 'targetQuery',
      width: 200,
      render: (targetQuery: string) => (
        <Text ellipsis style={{ maxWidth: '180px' }} title={targetQuery}>
          {targetQuery}
        </Text>
      ),
    },
    {
      title: '内容长度',
      key: 'contentLength',
      width: 120,
      render: (record: OptimizationRecord) => (
        <div>
          <div>原文: {record.rawContent.length}</div>
          <div>优化: {record.optimizedContent.length}</div>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (createdAt: string) => formatDateTime(createdAt),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (record: OptimizationRecord) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyContent(record.optimizedContent)}
          >
            复制
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<RocketOutlined />}
            onClick={() => {
              // 将优化内容保存到全局状态并跳转到发布页面
              localStorage.setItem('selectedOptimizationContent', record.optimizedContent);
              localStorage.setItem('selectedOptimizationId', record.optimizationId);
              window.location.href = '/publish-management';
            }}
          >
            发布
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={2}>
          <HistoryOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          优化历史记录
        </Title>
        <Text type="secondary">
          查看和管理您的GEO内容优化历史记录
        </Text>
      </div>

      <Card>
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} md={8}>
            <Search
              placeholder="搜索标题或目标查询"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={16} style={{ textAlign: 'right' }}>
            <Space>
              <Text type="secondary">
                共 {records.length} 条记录
              </Text>
              <Button icon={<EditOutlined />} href="/content-optimization">
                创建新优化
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={records}
          rowKey="optimizationId"
          loading={loading}
          locale={{
            emptyText: loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>
                  <Text>正在加载优化记录...</Text>
                </div>
              </div>
            ) : (
              <Empty
                description="暂无优化记录"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" href="/content-optimization">
                  立即创建优化
                </Button>
              </Empty>
            )
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
          }}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal
        title={
          <div>
            <HistoryOutlined style={{ marginRight: '8px' }} />
            优化记录详情
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="copy"
            icon={<CopyOutlined />}
            onClick={() => selectedRecord && handleCopyContent(selectedRecord.optimizedContent)}
          >
            复制优化内容
          </Button>,
          <Button
            key="publish"
            type="primary"
            icon={<RocketOutlined />}
            onClick={() => {
              if (selectedRecord) {
                localStorage.setItem('selectedOptimizationContent', selectedRecord.optimizedContent);
                localStorage.setItem('selectedOptimizationId', selectedRecord.optimizationId);
                window.location.href = '/publish-management';
              }
            }}
          >
            立即发布
          </Button>
        ]}
        width={800}
      >
        {selectedRecord && (
          <div>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ marginBottom: '4px', display: 'block' }}>
                    标题
                  </Text>
                  <Text>{selectedRecord.title || selectedRecord.targetQuery}</Text>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ marginBottom: '4px', display: 'block' }}>
                    优化ID
                  </Text>
                  <Text code>{selectedRecord.optimizationId}</Text>
                </div>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ marginBottom: '4px', display: 'block' }}>
                    目标查询
                  </Text>
                  <Text>{selectedRecord.targetQuery}</Text>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ marginBottom: '4px', display: 'block' }}>
                    创建时间
                  </Text>
                  <Text>{formatDateTime(selectedRecord.createdAt)}</Text>
                </div>
              </Col>
            </Row>

            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                原始内容
              </Text>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '6px',
                  maxHeight: '200px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap'
                }}
              >
                <Text>{selectedRecord.rawContent}</Text>
              </div>
            </div>

            <div>
              <Text strong style={{ marginBottom: '8px', display: 'block' }}>
                优化后内容
                <Tag color="success" style={{ marginLeft: '8px' }}>
                  G E O 格式
                </Tag>
              </Text>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#f6ffed',
                  borderRadius: '6px',
                  border: '1px solid #b7eb8f',
                  maxHeight: '200px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap'
                }}
              >
                <Text>{selectedRecord.optimizedContent}</Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OptimizationHistory;