import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Input,
  message,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  HistoryOutlined,
  EyeOutlined,
  CopyOutlined,
  SearchOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useContentStore } from '@/stores/useContentStore';
import { getContentHistory } from '@/services/api';
import type { ContentRecord } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { TextArea } = Input;

const History: React.FC = () => {
  const { contentHistory, setContentHistory } = useContentStore();
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ContentRecord | null>(null);
  const [searchText, setSearchText] = useState('');

  // 模拟数据，因为后端可能还没有历史记录接口
  const mockData: ContentRecord[] = [
    {
      id: 1,
      rawContent: "2024年旅游趋势分析，包含最新的旅游热点和推荐目的地。",
      targetQuery: "2024年旅游趋势",
      optimizedContent: "## 2024年旅游趋势分析\n\n### 主要趋势\n1. **可持续旅游**：环保意识增强，绿色出行成为主流\n2. **文化体验**：深度文化游受到年轻游客青睐\n3. **数字旅游**：虚拟现实技术改变旅游体验方式\n\n### 热门目的地推荐\n- 国内：云南大理、四川阿坝、新疆伊犁\n- 国外：日本北海道、韩国济州岛、泰国清迈\n\n**数据来源**：中国旅游研究院2024年报告",
      platformType: 'weibo',
      publishedUrl: 'https://weibo.com/123456789',
      createdAt: '2024-01-15T10:30:00',
      publishedAt: '2024-01-15T10:35:00',
      status: 'PUBLISHED'
    },
    {
      id: 2,
      rawContent: "前端开发最佳实践，包括React、Vue和Angular框架对比。",
      targetQuery: "前端开发最佳实践",
      optimizedContent: "## 前端开发最佳实践指南\n\n### 主流框架对比\n\n#### React\n- **优势**：生态丰富、社区活跃、灵活性高\n- **适用场景**：大型单页应用、移动端开发\n\n#### Vue\n- **优势**：学习曲线平缓、文档完善、渐进式架构\n- **适用场景**：中小型项目、快速原型开发\n\n#### Angular\n- **优势**：企业级解决方案、TypeScript支持\n- **适用场景**：大型企业应用、复杂系统\n\n**技术选型建议**：根据团队技能和项目需求选择合适框架",
      platformType: 'xiaohongshu',
      publishedUrl: '',
      createdAt: '2024-01-14T14:20:00',
      status: 'OPTIMIZED'
    },
    {
      id: 3,
      rawContent: "健康饮食指南，包括营养搭配和食谱推荐。",
      targetQuery: "健康饮食指南",
      optimizedContent: "",
      platformType: undefined,
      createdAt: '2024-01-13T09:15:00',
      status: 'FAILED',
      errorMessage: 'AI服务暂时不可用'
    }
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // 尝试从后端获取数据
      const response = await getContentHistory();
      if (response.success && response.data) {
        setContentHistory(response.data);
      } else {
        // 如果后端接口不可用，使用模拟数据
        setContentHistory(mockData);
      }
    } catch (error) {
      // 使用模拟数据
      setContentHistory(mockData);
      console.warn('使用模拟数据，后端历史记录接口可能不存在');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (record: ContentRecord) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      message.success('内容已复制到剪贴板');
    } catch (err) {
      message.error('复制失败');
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'default', text: '待处理' },
      OPTIMIZED: { color: 'processing', text: '已优化' },
      PUBLISHED: { color: 'success', text: '已发布' },
      FAILED: { color: 'error', text: '失败' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getPlatformName = (platformType?: string) => {
    if (!platformType) return '-';

    const platformNames = {
      weibo: '微博',
      xiaohongshu: '小红书',
      zhihu: '知乎',
      douyin: '抖音'
    };

    return platformNames[platformType as keyof typeof platformNames] || platformType;
  };

  const filteredData = contentHistory.filter(record =>
    record.targetQuery.toLowerCase().includes(searchText.toLowerCase()) ||
    record.rawContent.toLowerCase().includes(searchText.toLowerCase()) ||
    record.optimizedContent.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<ContentRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '目标查询',
      dataIndex: 'targetQuery',
      key: 'targetQuery',
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: '发布平台',
      dataIndex: 'platformType',
      key: 'platformType',
      width: 100,
      render: (platformType) => getPlatformName(platformType)
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          {record.optimizedContent && (
            <Button
              type="link"
              icon={<CopyOutlined />}
              onClick={() => handleCopyContent(record.optimizedContent)}
            >
              复制
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>
          <HistoryOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          历史记录
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchHistory}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Input
            placeholder="搜索目标查询或内容..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredData.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title="内容详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedRecord?.optimizedContent && (
            <Button
              key="copy"
              type="primary"
              icon={<CopyOutlined />}
              onClick={() => handleCopyContent(selectedRecord.optimizedContent)}
            >
              复制优化内容
            </Button>
          )
        ]}
        width={800}
      >
        {selectedRecord && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong>ID: </Text>
              <Text>{selectedRecord.id}</Text>
            </div>

            <div>
              <Text strong>目标查询: </Text>
              <Text>{selectedRecord.targetQuery}</Text>
            </div>

            <div>
              <Text strong>状态: </Text>
              {getStatusTag(selectedRecord.status)}
              {selectedRecord.publishedUrl && (
                <Button
                  type="link"
                  href={selectedRecord.publishedUrl}
                  target="_blank"
                  style={{ marginLeft: '8px' }}
                >
                  查看发布
                </Button>
              )}
            </div>

            <div>
              <Text strong>原始内容:</Text>
              <TextArea
                value={selectedRecord.rawContent}
                readOnly
                rows={4}
                style={{ marginTop: '8px' }}
              />
            </div>

            {selectedRecord.optimizedContent && (
              <div>
                <Text strong>优化后内容:</Text>
                <TextArea
                  value={selectedRecord.optimizedContent}
                  readOnly
                  rows={8}
                  style={{ marginTop: '8px' }}
                />
              </div>
            )}

            {selectedRecord.errorMessage && (
              <div>
                <Text strong>错误信息:</Text>
                <div style={{ marginTop: '8px', color: '#ff4d4f' }}>
                  {selectedRecord.errorMessage}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '24px' }}>
              <div>
                <Text strong>创建时间: </Text>
                <Text>{new Date(selectedRecord.createdAt).toLocaleString()}</Text>
              </div>
              {selectedRecord.publishedAt && (
                <div>
                  <Text strong>发布时间: </Text>
                  <Text>{new Date(selectedRecord.publishedAt).toLocaleString()}</Text>
                </div>
              )}
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default History;