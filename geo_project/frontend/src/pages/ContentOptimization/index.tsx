import React, { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Alert,
  Spin,
  message
} from 'antd';
import { SendOutlined, RobotOutlined, CopyOutlined } from '@ant-design/icons';
import { useContentStore } from '@/stores/useContentStore';
import { optimizeContent, optimizeAndSave } from '@/services/api';
import type { OptimizationRequest, OptimizeAndSaveRequest } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ContentOptimization: React.FC = () => {
  const {
    rawContent,
    targetQuery,
    optimizedContent,
    isOptimizing,
    setRawContent,
    setTargetQuery,
    setOptimizedContent,
    setIsOptimizing
  } = useContentStore();

  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [currentOptimizationId, setCurrentOptimizationId] = useState<string | null>(null);
  const [saveAfterOptimize, setSaveAfterOptimize] = useState(false);

  const handleOptimize = async (saveRecord: boolean = false) => {
    if (!rawContent.trim()) {
      message.warning('请输入要优化的内容');
      return;
    }

    if (!targetQuery.trim()) {
      message.warning('请输入目标查询');
      return;
    }

    setError(null);
    setIsOptimizing(true);
    setSaveAfterOptimize(saveRecord);

    try {
      if (saveRecord) {
        // 使用优化并保存接口
        const request: OptimizeAndSaveRequest = {
          rawContent: rawContent.trim(),
          targetQuery: targetQuery.trim(),
          title: title.trim() || undefined
        };

        const response = await optimizeAndSave(request);

        if (response.success && response.data?.optimizedContent) {
          setOptimizedContent(response.data.optimizedContent);
          setCurrentOptimizationId(response.data.optimizationId);
          message.success('内容优化并保存成功！');
        } else {
          const errorMsg = response.error || response.message || '优化失败，请重试';
          setError(errorMsg);
          message.error(errorMsg);
        }
      } else {
        // 使用常规优化接口
        const request: OptimizationRequest = {
          rawContent: rawContent.trim(),
          targetQuery: targetQuery.trim()
        };

        const response = await optimizeContent(request);

        if (response.success && response.data?.optimizedContent) {
          setOptimizedContent(response.data.optimizedContent);
          setCurrentOptimizationId(null);
          message.success('内容优化成功！');
        } else {
          const errorMsg = response.error || response.message || '优化失败，请重试';
          setError(errorMsg);
          message.error(errorMsg);
        }
      }
    } catch (err: any) {
      const errorMsg = err.error || '网络错误，请检查后端服务是否正常运行';
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsOptimizing(false);
    }
  };

  // 保存当前优化结果
  const handleSaveRecord = async () => {
    if (!optimizedContent) {
      message.warning('请先进行内容优化');
      return;
    }

    if (!currentOptimizationId) {
      try {
        const request: OptimizeAndSaveRequest = {
          rawContent: rawContent.trim(),
          targetQuery: targetQuery.trim(),
          title: title.trim() || targetQuery.trim()
        };

        const response = await optimizeAndSave(request);

        if (response.success && response.data?.optimizationId) {
          setCurrentOptimizationId(response.data.optimizationId);
          message.success('优化记录保存成功！');
        } else {
          const errorMsg = response.error || response.message || '保存失败，请重试';
          message.error(errorMsg);
        }
      } catch (err: any) {
        const errorMsg = err.error || '网络错误';
        message.error(errorMsg);
      }
    } else {
      message.info('当前优化结果已保存');
    }
  };

  const handleCopy = async () => {
    if (!optimizedContent) return;

    try {
      await navigator.clipboard.writeText(optimizedContent);
      message.success('已复制到剪贴板');
    } catch (err) {
      message.error('复制失败');
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={2}>
          <RobotOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          GEO内容优化
        </Title>
        <Text type="secondary">
          使用AI技术将您的普通内容优化为生成式搜索引擎友好的格式
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title="原始内容输入"
            extra={
              <Space>
                <Button
                  icon={<SendOutlined />}
                  onClick={() => handleOptimize(false)}
                  loading={isOptimizing}
                  disabled={!rawContent.trim() || !targetQuery.trim()}
                >
                  开始优化
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => handleOptimize(true)}
                  loading={isOptimizing}
                  disabled={!rawContent.trim() || !targetQuery.trim()}
                >
                  优化并保存
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text strong>标题（可选）</Text>
                <Input
                  placeholder="为这次优化起一个标题（如：旅游行业分析）"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ marginTop: '8px' }}
                  maxLength={100}
                  showCount
                />
              </div>

              <div>
                <Text strong>目标查询</Text>
                <Input
                  placeholder="请输入目标查询关键词（如：2024年旅游趋势）"
                  value={targetQuery}
                  onChange={(e) => setTargetQuery(e.target.value)}
                  style={{ marginTop: '8px' }}
                  maxLength={100}
                  showCount
                />
              </div>

              <div>
                <Text strong>原始内容</Text>
                <TextArea
                  placeholder="请输入要优化的原始内容..."
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  style={{ marginTop: '8px' }}
                  rows={10}
                  maxLength={5000}
                  showCount
                />
              </div>

              <div>
                <Text type="secondary">
                  💡 提示：输入您要发布的内容，AI将根据目标查询为您优化为适合生成式搜索引擎的格式
                </Text>
                <br />
                <Text type="secondary">
                  📝 保存功能：点击"优化并保存"按钮，优化结果将自动保存到历史记录中
                </Text>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="优化后内容"
            extra={
              optimizedContent && (
                <Space>
                  {currentOptimizationId && (
                    <Text type="success" style={{ fontSize: '12px' }}>
                      ✓ 已保存
                    </Text>
                  )}
                  <Button
                    icon={<CopyOutlined />}
                    onClick={handleCopy}
                  >
                    复制内容
                  </Button>
                  {!currentOptimizationId && (
                    <Button
                      type="default"
                      onClick={handleSaveRecord}
                    >
                      保存记录
                    </Button>
                  )}
                </Space>
              )
            }
          >
            {error && (
              <Alert
                message="优化失败"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError(null)}
                style={{ marginBottom: '16px' }}
              />
            )}

            {isOptimizing ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>
                  <Text>
                    AI正在优化您的内容...
                    {saveAfterOptimize && ' 并保存记录'}
                  </Text>
                </div>
              </div>
            ) : optimizedContent ? (
              <div>
                {currentOptimizationId && (
                  <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
                    <Text type="success" style={{ fontSize: '12px' }}>
                      记录ID: {currentOptimizationId}
                    </Text>
                  </div>
                )}
                <TextArea
                  value={optimizedContent}
                  readOnly
                  style={{ marginBottom: '16px' }}
                  rows={10}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text type="secondary">
                      ✅ 优化完成，内容已适配生成式搜索引擎
                    </Text>
                    {currentOptimizationId && (
                      <Text type="success" style={{ marginLeft: '8px' }}>
                        ✓ 已保存到历史记录
                      </Text>
                    )}
                  </div>
                  <Space>
                    <Button type="link" href="/optimization-history">
                      查看历史
                    </Button>
                    <Button type="link" href="/publish-management">
                      去发布 →
                    </Button>
                  </Space>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <Text>请在左侧输入内容并点击"开始优化"或"优化并保存"</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ContentOptimization;