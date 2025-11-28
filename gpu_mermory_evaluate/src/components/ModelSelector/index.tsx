import React from 'react';
import { Select, Typography, Space, Divider } from 'antd';
import { ModelConfig, ModelType, ModelTemplate } from '@/types/model';
import { useModelStore } from '@/stores/modelStore';
import { formatModelType } from '@/utils/formatters';

const { Title, Text } = Typography;
const { Option, OptGroup } = Select;

// 预定义模型模板
const MODEL_TEMPLATES: ModelTemplate[] = [
  // LLM Models
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    type: 'llm',
    category: 'OpenAI',
    defaultParameters: {
      modelSize: 175, // B (估算)
      sequenceLength: 4096,
      contextLength: 4096,
      batchSize: 1,
      precision: 'fp16',
      hiddenLayers: 96,
      hiddenSize: 12288,
      intermediateSize: 49152,
      vocabSize: 50257,
    },
    description: '强大的通用大语言模型',
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    type: 'llm',
    category: 'OpenAI',
    defaultParameters: {
      modelSize: 820, // B (估算)
      sequenceLength: 8192,
      contextLength: 8192,
      batchSize: 1,
      precision: 'fp16',
      hiddenLayers: 80,
      hiddenSize: 8192,
      intermediateSize: 32768,
      vocabSize: 100000,
    },
    description: '更先进的多模态大模型',
  },
  {
    id: 'llama-2-7b',
    name: 'LLaMA 2 7B',
    type: 'llm',
    category: 'Meta',
    defaultParameters: {
      modelSize: 7,
      sequenceLength: 4096,
      contextLength: 4096,
      batchSize: 1,
      precision: 'fp16',
      hiddenLayers: 32,
      hiddenSize: 4096,
      intermediateSize: 11008,
      vocabSize: 32000,
    },
    description: '轻量级开源大模型',
  },
  {
    id: 'llama-2-13b',
    name: 'LLaMA 2 13B',
    type: 'llm',
    category: 'Meta',
    defaultParameters: {
      modelSize: 13,
      sequenceLength: 4096,
      contextLength: 4096,
      batchSize: 1,
      precision: 'fp16',
      hiddenLayers: 40,
      hiddenSize: 5120,
      intermediateSize: 13824,
      vocabSize: 32000,
    },
    description: '中等规模开源大模型',
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    type: 'llm',
    category: 'Anthropic',
    defaultParameters: {
      modelSize: 200, // B (估算)
      sequenceLength: 200000,
      contextLength: 200000,
      batchSize: 1,
      precision: 'fp16',
    },
    description: '长上下文AI助手',
  },

  // CV Models
  {
    id: 'resnet-50',
    name: 'ResNet-50',
    type: 'cv',
    category: '图像分类',
    defaultParameters: {
      modelSize: 0.025, // 25M
      batchSize: 32,
      precision: 'fp16',
      imageWidth: 224,
      imageHeight: 224,
      channels: 3,
    },
    description: '经典的图像分类模型',
  },
  {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    type: 'cv',
    category: '图像生成',
    defaultParameters: {
      modelSize: 2.6,
      batchSize: 1,
      precision: 'fp16',
      imageWidth: 1024,
      imageHeight: 1024,
      channels: 3,
    },
    description: '高分辨率图像生成模型',
  },

  // Audio Models
  {
    id: 'whisper-large',
    name: 'Whisper Large',
    type: 'audio',
    category: '语音识别',
    defaultParameters: {
      modelSize: 1.55,
      batchSize: 1,
      precision: 'fp16',
      sampleRate: 16000,
      duration: 30,
    },
    description: '强大的语音识别模型',
  },

  // Multimodal Models
  {
    id: 'gpt-4-vision',
    name: 'GPT-4 Vision',
    type: 'multimodal',
    category: '多模态',
    defaultParameters: {
      modelSize: 1000, // 估算
      sequenceLength: 8192,
      contextLength: 8192,
      batchSize: 1,
      precision: 'fp16',
      imageWidth: 1024,
      imageHeight: 1024,
      channels: 3,
    },
    description: '视觉-语言多模态模型',
  },
];

const ModelSelector: React.FC = () => {
  const { currentConfig, updateModelConfig } = useModelStore();

  // 按类型和类别分组模型模板
  const groupedTemplates = MODEL_TEMPLATES.reduce((acc, template) => {
    if (!acc[template.type]) {
      acc[template.type] = {};
    }
    if (!acc[template.type][template.category]) {
      acc[template.type][template.category] = [];
    }
    acc[template.type][template.category].push(template);
    return acc;
  }, {} as Record<ModelType, Record<string, ModelTemplate[]>>);

  const handleModelChange = (templateId: string) => {
    const template = MODEL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      updateModelConfig({
        id: template.id,
        name: template.name,
        type: template.type,
        description: template.description,
        parameters: {
          ...currentConfig.parameters,
          ...template.defaultParameters,
        },
      });
    }
  };

  const handleTypeChange = (type: ModelType) => {
    updateModelConfig({
      type,
      id: `custom-${type}-${Date.now()}`,
      name: `自定义${formatModelType(type)}`,
    });
  };

  const modelTypeOptions: { label: string; value: ModelType }[] = [
    { label: formatModelType('llm'), value: 'llm' },
    { label: formatModelType('cv'), value: 'cv' },
    { label: formatModelType('audio'), value: 'audio' },
    { label: formatModelType('multimodal'), value: 'multimodal' },
  ];

  return (
    <div className="space-y-4">
      {/* 模型类型选择 */}
      <div>
        <label className="form-label">模型类型</label>
        <Select
          value={currentConfig.type}
          onChange={handleTypeChange}
          className="w-full"
          placeholder="选择模型类型"
        >
          {modelTypeOptions.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </div>

      <Divider className="my-4" />

      {/* 预定义模型选择 */}
      <div>
        <label className="form-label">预定义模型</label>
        <Select
          value={currentConfig.id}
          onChange={handleModelChange}
          className="w-full"
          placeholder="选择预定义模型或自定义"
          allowClear
          showSearch
          filterOption={(input, option) =>
            (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
          }
        >
          {Object.entries(groupedTemplates[currentConfig.type] || {}).map(([category, templates]) => (
            <OptGroup key={category} label={category}>
              {templates.map(template => (
                <Option key={template.id} value={template.id}>
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-gray-500">{template.description}</div>
                  </div>
                </Option>
              ))}
            </OptGroup>
          ))}
        </Select>

        <div className="mt-2">
          <Text type="secondary" className="text-xs">
            选择预定义模型将自动设置推荐参数，也可以手动调整参数
          </Text>
        </div>
      </div>

      {/* 当前配置信息 */}
      {currentConfig && (
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-sm">
            <div className="font-medium text-gray-700 mb-1">当前配置</div>
            <div className="space-y-1 text-xs text-gray-600">
              <div>模型: {currentConfig.name}</div>
              <div>类型: {formatModelType(currentConfig.type)}</div>
              <div>模型大小: {currentConfig.parameters.modelSize}B</div>
              <div>精度: {currentConfig.parameters.precision.toUpperCase()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;