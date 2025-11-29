import React from 'react';
import { Card, Typography, Row, Col, Progress, Tag, Alert, Space, Divider } from 'antd';
import {
  DatabaseOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { CalculationResult } from '@/types/model';
import {
  formatGB,
  formatPerformance,
  formatModelSize,
  formatDate,
  formatMemoryUsageRatio
} from '@/utils/formatters';

const { Title, Text } = Typography;

interface ResultDisplayProps {
  result: CalculationResult;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const { modelConfig, memoryUsage, performance, warnings, notes } = result;

  // 格式化性能信息
  const { mainMetric, details } = formatPerformance(performance);

  // 内存使用情况分析
  const getMemoryStatus = () => {
    const total = memoryUsage.total;
    if (total > 48) return { status: 'critical', text: '需要专业级GPU' };
    if (total > 24) return { status: 'warning', text: '需要高端GPU' };
    if (total > 12) return { status: 'normal', text: '中端GPU可运行' };
    return { status: 'success', text: '入门级GPU可运行' };
  };

  const memoryStatus = getMemoryStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#52c41a';
      case 'normal': return '#1890ff';
      case 'warning': return '#faad14';
      case 'critical': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <Title level={4} className="!mb-0">
            {modelConfig.name}
          </Title>
          <Tag color={getStatusColor(memoryStatus.status)}>
            {memoryStatus.text}
          </Tag>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {formatModelSize(modelConfig.parameters.modelSize)}
              </div>
              <div className="text-sm text-gray-600">模型大小</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {modelConfig.parameters.precision.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600">推理精度</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {modelConfig.parameters.batchSize}
              </div>
              <div className="text-sm text-gray-600">批次大小</div>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">
                {modelConfig.type.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600">模型类型</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 内存使用详情 */}
      <Card title={
        <div className="flex items-center">
          <DatabaseOutlined className="mr-2 text-primary-600" />
          内存使用分析
        </div>
      }>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Text>模型权重</Text>
                  <Text strong>{formatGB(memoryUsage.modelWeights)}</Text>
                </div>
                <Progress
                  percent={(memoryUsage.modelWeights / memoryUsage.total) * 100}
                  strokeColor="#1890ff"
                  size="small"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Text>激活值</Text>
                  <Text strong>{formatGB(memoryUsage.activations)}</Text>
                </div>
                <Progress
                  percent={(memoryUsage.activations / memoryUsage.total) * 100}
                  strokeColor="#52c41a"
                  size="small"
                />
              </div>

              {memoryUsage.kvCache && memoryUsage.kvCache > 0 && (
                <div>
                  <div className="flex justify-between mb-2">
                    <Text>KV缓存</Text>
                    <Text strong>{formatGB(memoryUsage.kvCache)}</Text>
                  </div>
                  <Progress
                    percent={(memoryUsage.kvCache / memoryUsage.total) * 100}
                    strokeColor="#722ed1"
                    size="small"
                  />
                </div>
              )}

              {memoryUsage.gradients > 0 && (
                <div>
                  <div className="flex justify-between mb-2">
                    <Text>梯度</Text>
                    <Text strong>{formatGB(memoryUsage.gradients)}</Text>
                  </div>
                  <Progress
                    percent={(memoryUsage.gradients / memoryUsage.total) * 100}
                    strokeColor="#fa8c16"
                    size="small"
                  />
                </div>
              )}

              {memoryUsage.optimizer > 0 && (
                <div>
                  <div className="flex justify-between mb-2">
                    <Text>优化器</Text>
                    <Text strong>{formatGB(memoryUsage.optimizer)}</Text>
                  </div>
                  <Progress
                    percent={(memoryUsage.optimizer / memoryUsage.total) * 100}
                    strokeColor="#eb2f96"
                    size="small"
                  />
                </div>
              )}
            </div>
          </Col>

          <Col xs={24} md={12}>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {formatGB(memoryUsage.total)}
              </div>
              <div className="text-lg text-gray-700 mb-4">总内存需求</div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  基于 {performance.memoryBandwidthUtilization?.toFixed(1) || 'N/A'}% 内存带宽利用率
                </div>
                <div className="text-xs text-gray-500">
                  计算时间: {formatDate(result.timestamp)}
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 性能指标 */}
      <Card title={
        <div className="flex items-center">
          <ThunderboltOutlined className="mr-2 text-primary-600" />
          性能预估
        </div>
      }>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {mainMetric}
              </div>
              <div className="text-sm text-gray-600">主要性能指标</div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 mb-2">
                <ClockCircleOutlined className="mr-1" />
                {performance.latency < 1000
                  ? `${performance.latency.toFixed(0)}ms`
                  : `${(performance.latency / 1000).toFixed(1)}s`
                }
              </div>
              <div className="text-sm text-gray-600">延迟</div>
            </div>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {performance.memoryBandwidthUtilization?.toFixed(1) || 'N/A'}%
              </div>
              <div className="text-sm text-gray-600">内存利用率</div>
            </div>
          </Col>
        </Row>

        <Divider />

        <div className="text-sm text-gray-600">
          {details.map((detail, index) => (
            <div key={index}>• {detail}</div>
          ))}
        </div>
      </Card>

      {/* 警告和提示 */}
      {(warnings && warnings.length > 0) || (notes && notes.length > 0) ? (
        <Card title={
          <div className="flex items-center">
            <ExclamationCircleOutlined className="mr-2 text-warning" />
            提示信息
          </div>
        }>
          {warnings && warnings.length > 0 && (
            <div className="mb-4">
              <Text type="danger" strong>
                ⚠️ 注意事项：
              </Text>
              <ul className="text-sm text-red-600 mt-2 ml-4">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {notes && notes.length > 0 && (
            <div>
              <Text type="secondary" strong>
                💡 说明：
              </Text>
              <ul className="text-sm text-gray-600 mt-2 ml-4">
                {notes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
};

export default ResultDisplay;