import React, { useEffect } from 'react';
import { Row, Col, Card, Typography, Alert, Spin, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useModelStore } from '@/stores/modelStore';

// 组件占位符 - 后续会实现
import ModelSelector from '@/components/ModelSelector';
import ParameterConfig from '@/components/ParameterConfig';
import ResultDisplay from '@/components/ResultDisplay';
import GPUSuggestion from '@/components/GPUSuggestion';

const { Title, Paragraph } = Typography;

const Estimator: React.FC = () => {
  const navigate = useNavigate();
  const {
    calculationResult,
    isCalculating,
    error,
    calculateRequirements,
    addToHistory
  } = useModelStore();

  // 页面标题
  useEffect(() => {
    document.title = 'AI模型评估 - GPU显存评估工具';
  }, []);

  const handleCalculate = async () => {
    await calculateRequirements(false); // 推理模式
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ marginBottom: '8px' }}>
            AI模型GPU需求评估
          </Title>
          <Paragraph style={{ color: '#666', marginBottom: 0 }}>
            选择模型类型并配置参数，系统将为您计算显存需求和推荐GPU配置
          </Paragraph>
        </div>
        <Button onClick={handleBack}>
          返回首页
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="计算错误"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '20px' }}
        />
      )}

      {/* 主要内容区域 */}
      <Row gutter={[24, 24]}>
        {/* 左侧配置区域 */}
        <Col xs={24} lg={10}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 模型选择 */}
            <Card title="模型选择" size="small">
              <ModelSelector />
            </Card>

            {/* 参数配置 */}
            <Card title="参数配置" size="small">
              <ParameterConfig />
            </Card>

            {/* 计算按钮 */}
            <Card size="small">
              <Button
                type="primary"
                onClick={handleCalculate}
                loading={isCalculating}
                block
                size="large"
              >
                {isCalculating ? '计算中...' : '开始计算'}
              </Button>
            </Card>
          </div>
        </Col>

        {/* 右侧结果区域 */}
        <Col xs={24} lg={14}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {calculationResult ? (
              <>
                {/* 计算结果展示 */}
                <ResultDisplay result={calculationResult} />

                {/* GPU推荐 */}
                <GPUSuggestion
                  recommendations={calculationResult.recommendedGPUs}
                  memoryUsage={calculationResult.memoryUsage.total}
                />
              </>
            ) : (
              /* 空状态 */
              <Card style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Title level={4} style={{ color: '#999', marginBottom: '16px' }}>
                  还没有计算结果
                </Title>
                <Paragraph style={{ color: '#999' }}>
                  请在左侧选择模型并配置参数，然后点击"开始计算"按钮
                </Paragraph>
              </Card>
            )}
          </div>
        </Col>
      </Row>

      {/* 使用说明 */}
      <Card
        title="💡 使用说明"
        style={{ marginTop: '30px', backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
        size="small"
      >
        <div style={{ color: '#52c41a' }}>
          <div>1. <strong>选择模型类型</strong>：支持大语言模型、计算机视觉、音频处理和多模态模型</div>
          <div>2. <strong>配置模型参数</strong>：设置模型大小、批次大小、推理精度等关键参数</div>
          <div>3. <strong>计算内存需求</strong>：系统将自动计算模型权重、激活值、缓存等内存使用</div>
          <div>4. <strong>查看GPU推荐</strong>：根据性能需求和预算获得最佳GPU配置建议</div>
        </div>
      </Card>
    </div>
  );
};

export default Estimator;