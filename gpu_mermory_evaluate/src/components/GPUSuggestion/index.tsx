import React, { useState } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Tag,
  Button,
  Table,
  Progress,
  Space,
  Tooltip,
  Badge,
  Select
} from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  StarOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { GPUSpec } from '@/types/gpu';
import {
  formatGB,
  formatPrice,
  formatGPUSpecs,
  formatCostEfficiency
} from '@/utils/formatters';
import { estimatePerformance } from '@/utils/modelCalculations';
import { useModelStore } from '@/stores/modelStore';

const { Title, Text } = Typography;

interface GPUSuggestionProps {
  recommendations: GPUSpec[];
  memoryUsage: number;
}

const GPUSuggestion: React.FC<GPUSuggestionProps> = ({ recommendations, memoryUsage }) => {
  const { currentConfig } = useModelStore();
  const [sortBy, setSortBy] = useState<'performance' | 'price' | 'efficiency'>('performance');

  // 为每个GPU计算兼容性和性能
  const gpuAnalysis = recommendations.map(gpu => {
    const isCompatible = gpu.memoryGB >= memoryUsage;
    const memoryUtilization = isCompatible ? (memoryUsage / gpu.memoryGB) * 100 : 100;

    let compatibilityStatus: 'excellent' | 'good' | 'tight' | 'insufficient';
    let statusColor: string;
    let statusText: string;
    let statusIcon: React.ReactNode;

    if (!isCompatible) {
      compatibilityStatus = 'insufficient';
      statusColor = '#ff4d4f';
      statusText = '内存不足';
      statusIcon = <CloseCircleOutlined />;
    } else if (memoryUtilization > 90) {
      compatibilityStatus = 'tight';
      statusColor = '#faad14';
      statusText = '内存紧张';
      statusIcon = <WarningOutlined />;
    } else if (memoryUtilization > 70) {
      compatibilityStatus = 'good';
      statusColor = '#52c41a';
      statusText = '内存充足';
      statusIcon = <CheckCircleOutlined />;
    } else {
      compatibilityStatus = 'excellent';
      statusColor = '#52c41a';
      statusText = '内存宽裕';
      statusIcon = <CheckCircleOutlined />;
    }

    // 计算性价比
    const costEfficiency = gpu.price ? gpu.tflops.fp16 / gpu.price : 0;

    return {
      gpu,
      isCompatible,
      memoryUtilization,
      compatibilityStatus,
      statusColor,
      statusText,
      statusIcon,
      costEfficiency,
      estimatedPerformance: isCompatible ? estimatePerformance(currentConfig, gpu, {
        total: memoryUsage,
        modelWeights: memoryUsage * 0.7, // 估算
        activations: memoryUsage * 0.2,
        gradients: 0,
        optimizer: 0,
      }) : null,
    };
  });

  // 根据选择的排序方式排序
  const sortedGPUAnalysis = [...gpuAnalysis].sort((a, b) => {
    switch (sortBy) {
      case 'performance':
        if (!a.estimatedPerformance || !b.estimatedPerformance) return 0;
        const aPerf = a.estimatedPerformance.tokensPerSecond || a.estimatedPerformance.fps || 0;
        const bPerf = b.estimatedPerformance.tokensPerSecond || b.estimatedPerformance.fps || 0;
        return bPerf - aPerf;

      case 'price':
        if (!a.gpu.price || !b.gpu.price) return 0;
        return a.gpu.price - b.gpu.price;

      case 'efficiency':
        return b.costEfficiency - a.costEfficiency;

      default:
        return 0;
    }
  });

  // 推荐列表顶部GPU
  const topRecommendations = sortedGPUAnalysis.slice(0, 3);

  // 表格列定义
  const columns = [
    {
      title: '推荐排序',
      key: 'rank',
      width: 80,
      render: (_: any, record: typeof gpuAnalysis[0], index: number) => (
        <div className="text-center">
          {index < 3 ? (
            <Badge
              count={index + 1}
              style={{
                backgroundColor: index === 0 ? '#f50' : index === 1 ? '#2db7f5' : '#87d068',
                fontSize: '12px',
                padding: '0 6px',
              }}
            />
          ) : (
            <span className="text-gray-500">{index + 1}</span>
          )}
        </div>
      ),
    },
    {
      title: 'GPU型号',
      dataIndex: ['gpu', 'name'],
      key: 'name',
      render: (name: string, record: typeof gpuAnalysis[0]) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500">
            {record.gpu.manufacturer === 'nvidia' ? 'NVIDIA' :
             record.gpu.manufacturer === 'amd' ? 'AMD' : 'Intel'} • {record.gpu.architecture}
          </div>
        </div>
      ),
    },
    {
      title: '内存',
      dataIndex: ['gpu', 'memoryGB'],
      key: 'memory',
      render: (memoryGB: number, record: typeof gpuAnalysis[0]) => (
        <div>
          <div className="font-medium">{memoryGB}GB</div>
          <Progress
            percent={record.memoryUtilization}
            size="small"
            strokeColor={record.statusColor}
            showInfo={false}
          />
          <div className="text-xs text-gray-500">
            使用率: {record.memoryUtilization.toFixed(1)}%
          </div>
        </div>
      ),
    },
    {
      title: '性能',
      key: 'performance',
      render: (_: any, record: typeof gpuAnalysis[0]) => (
        <div>
          {record.estimatedPerformance ? (
            <>
              <div className="font-medium text-green-600">
                {record.estimatedPerformance.tokensPerSecond
                  ? `${record.estimatedPerformance.tokensPerSecond.toFixed(1)} tokens/s`
                  : record.estimatedPerformance.fps
                  ? `${record.estimatedPerformance.fps.toFixed(1)} FPS`
                  : 'N/A'
                }
              </div>
              <div className="text-xs text-gray-500">
                {record.gpu.tflops.fp16.toFixed(1)} TFLOPS (FP16)
              </div>
            </>
          ) : (
            <Text type="danger">不兼容</Text>
          )}
        </div>
      ),
    },
    {
      title: '价格',
      key: 'price',
      render: (_: any, record: typeof gpuAnalysis[0]) => (
        <div>
          {record.gpu.price ? (
            <>
              <div className="font-medium">{formatPrice(record.gpu.price)}</div>
              <div className="text-xs text-blue-600">
                性价比: {record.costEfficiency.toFixed(3)}
              </div>
            </>
          ) : (
            <Text type="secondary">价格待定</Text>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: typeof gpuAnalysis[0]) => (
        <div className="flex items-center">
          {record.statusIcon}
          <span style={{ color: record.statusColor }} className="ml-1">
            {record.statusText}
          </span>
        </div>
      ),
    },
  ];

  const sortingOptions = [
    { label: '按性能排序', value: 'performance' },
    { label: '按价格排序', value: 'price' },
    { label: '按性价比排序', value: 'efficiency' },
  ];

  return (
    <Card
      title={
        <div className="flex items-center">
          <StarOutlined className="mr-2 text-primary-600" />
          GPU推荐配置
        </div>
      }
      extra={
        <Select
          value={sortBy}
          onChange={setSortBy}
          options={sortingOptions}
          style={{ width: 150 }}
        />
      }
    >
      {/* 推荐说明 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-700">
          <strong>推荐原则：</strong>
        </div>
        <ul className="text-xs text-blue-600 mt-2 space-y-1">
          <li>• 优先选择内存充足的GPU，确保至少保留20%的余量</li>
          <li>• 考虑性能需求和预算平衡，推荐性价比最高的配置</li>
          <li>• 不同型号GPU的实际性能可能因驱动和优化程度而有所差异</li>
        </ul>
      </div>

      {/* Top 3 推荐卡片 */}
      <div className="mb-8">
        <Title level={5} className="mb-4">
          🏆 最佳推荐
        </Title>
        <Row gutter={[16, 16]}>
          {topRecommendations.map((record, index) => (
            <Col xs={24} md={8} key={record.gpu.id}>
              <Card
                className={`h-full ${index === 0 ? 'border-primary-500 border-2' : ''}`}
                size="small"
                title={
                  <div className="flex items-center justify-between">
                    <span>{record.gpu.name}</span>
                    {index === 0 && (
                      <Tag color="gold">最佳推荐</Tag>
                    )}
                  </div>
                }
                extra={
                  <div className={`flex items-center`} style={{ color: record.statusColor }}>
                    {record.statusIcon}
                    <span className="ml-1 text-sm">{record.statusText}</span>
                  </div>
                }
              >
                <div className="space-y-3">
                  {/* 基本信息 */}
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">显存:</span>
                      <span className="font-medium">{record.gpu.memoryGB}GB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">算力:</span>
                      <span className="font-medium">{record.gpu.tflops.fp16} TFLOPS</span>
                    </div>
                    {record.gpu.price && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">价格:</span>
                        <span className="font-medium">{formatPrice(record.gpu.price)}</span>
                      </div>
                    )}
                  </div>

                  {/* 内存利用率 */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>内存利用率</span>
                      <span>{record.memoryUtilization.toFixed(1)}%</span>
                    </div>
                    <Progress
                      percent={record.memoryUtilization}
                      size="small"
                      strokeColor={record.statusColor}
                    />
                  </div>

                  {/* 预估性能 */}
                  {record.estimatedPerformance && (
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-green-600 font-medium">
                        {record.estimatedPerformance.tokensPerSecond
                          ? `${record.estimatedPerformance.tokensPerSecond.toFixed(1)} tokens/s`
                          : record.estimatedPerformance.fps
                          ? `${record.estimatedPerformance.fps.toFixed(1)} FPS`
                          : 'N/A'
                        }
                      </div>
                      <div className="text-xs text-gray-500">预估性能</div>
                    </div>
                  )}

                  {/* 推荐标签 */}
                  <div className="flex flex-wrap gap-1">
                    {index === 0 && <Tag color="gold">性能最佳</Tag>}
                    {index === 1 && <Tag color="blue">性价比高</Tag>}
                    {index === 2 && <Tag color="green">预算友好</Tag>}
                    {record.gpu.memoryGB >= memoryUsage * 2 && <Tag color="purple">内存充裕</Tag>}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 完整对比表格 */}
      <div>
        <Title level={5} className="mb-4">
          📊 完整对比列表
        </Title>
        <Table
          dataSource={sortedGPUAnalysis}
          columns={columns}
          rowKey="gpu.id"
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
          rowClassName={(record) =>
            !record.isCompatible ? 'bg-red-50' : record.memoryUtilization > 90 ? 'bg-yellow-50' : ''
          }
        />
      </div>

      {/* 购买建议 */}
      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <div className="text-sm text-green-700">
          <strong>💡 购买建议：</strong>
        </div>
        <div className="text-xs text-green-600 mt-2 space-y-1">
          <div>• <strong>入门级</strong>：推荐 RTX 3060/4060 系列，适合小模型开发和测试</div>
          <div>• <strong>专业级</strong>：推荐 RTX 4070/4080 系列，适合中等规模模型</div>
          <div>• <strong>企业级</strong>：推荐 RTX 4090/A5000 系列，适合大规模模型部署</div>
          <div>• <strong>数据中心</strong>：推荐 A100/H100 系列，适合超大规模训练和推理</div>
        </div>
      </div>
    </Card>
  );
};

export default GPUSuggestion;