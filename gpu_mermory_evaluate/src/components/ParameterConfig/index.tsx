import React from 'react';
import { Form, InputNumber, Select, Slider, Typography, Divider, Space } from 'antd';
import { ModelType, Precision } from '@/types/model';
import { useModelStore } from '@/stores/modelStore';
import { formatPrecision } from '@/utils/formatters';

const { Title, Text } = Typography;

const ParameterConfig: React.FC = () => {
  const { currentConfig, setParameters } = useModelStore();
  const [form] = Form.useForm();

  // 精度选项
  const precisionOptions: { label: string; value: Precision }[] = [
    { label: formatPrecision('fp32'), value: 'fp32' },
    { label: formatPrecision('fp16'), value: 'fp16' },
    { label: formatPrecision('int8'), value: 'int8' },
    { label: formatPrecision('int4'), value: 'int4' },
  ];

  // 通用参数
  const renderCommonParameters = () => (
    <>
      <Form.Item label="模型大小 (参数量)" name="modelSize">
        <InputNumber
          min={0.001}
          max={2000}
          step={0.1}
          precision={1}
          style={{ width: '100%' }}
          addonAfter="B"
          placeholder="模型参数量，如：7 表示7B模型"
        />
      </Form.Item>

      <Form.Item label="批次大小" name="batchSize">
        <InputNumber
          min={1}
          max={256}
          step={1}
          style={{ width: '100%' }}
          placeholder="推理批次大小"
        />
      </Form.Item>

      <Form.Item label="推理精度" name="precision">
        <Select
          options={precisionOptions}
          placeholder="选择推理精度"
        />
      </Form.Item>
    </>
  );

  // LLM特定参数
  const renderLLMParameters = () => (
    <>
      <Form.Item label="序列长度" name="sequenceLength">
        <div className="space-y-2">
          <Slider
            min={512}
            max={32768}
            step={512}
            marks={{
              512: '512',
              2048: '2K',
              4096: '4K',
              8192: '8K',
              16384: '16K',
              32768: '32K',
            }}
          />
          <InputNumber
            min={512}
            max={32768}
            step={512}
            style={{ width: '100%' }}
            addonAfter="tokens"
          />
        </div>
      </Form.Item>

      <Form.Item label="上下文长度" name="contextLength">
        <InputNumber
          min={1024}
          max={200000}
          step={1024}
          style={{ width: '100%' }}
          addonAfter="tokens"
          placeholder="最大上下文长度"
        />
      </Form.Item>

      <Divider>模型架构参数 (可选)</Divider>

      <Form.Item label="隐藏层数" name="hiddenLayers">
        <InputNumber
          min={1}
          max={200}
          step={1}
          style={{ width: '100%' }}
          placeholder="Transformer层数"
        />
      </Form.Item>

      <Form.Item label="隐藏层大小" name="hiddenSize">
        <InputNumber
          min={128}
          max={16384}
          step={128}
          style={{ width: '100%' }}
          placeholder="隐藏层维度"
        />
      </Form.Item>

      <Form.Item label="词汇表大小" name="vocabSize">
        <InputNumber
          min={1000}
          max={200000}
          step={1000}
          style={{ width: '100%' }}
          placeholder="词汇表大小"
        />
      </Form.Item>
    </>
  );

  // CV特定参数
  const renderCVParameters = () => (
    <>
      <Form.Item label="图像宽度" name="imageWidth">
        <Select
          options={[
            { label: '224px', value: 224 },
            { label: '512px', value: 512 },
            { label: '1024px', value: 1024 },
            { label: '2048px', value: 2048 },
            { label: '自定义', value: 'custom' },
          ]}
          placeholder="选择图像宽度"
        />
      </Form.Item>

      <Form.Item label="图像高度" name="imageHeight">
        <Select
          options={[
            { label: '224px', value: 224 },
            { label: '512px', value: 512 },
            { label: '1024px', value: 1024 },
            { label: '2048px', value: 2048 },
            { label: '自定义', value: 'custom' },
          ]}
          placeholder="选择图像高度"
        />
      </Form.Item>

      <Form.Item label="通道数" name="channels">
        <Select
          options={[
            { label: '1 (灰度图)', value: 1 },
            { label: '3 (RGB)', value: 3 },
            { label: '4 (RGBA)', value: 4 },
          ]}
          placeholder="选择通道数"
        />
      </Form.Item>
    </>
  );

  // Audio特定参数
  const renderAudioParameters = () => (
    <>
      <Form.Item label="采样率" name="sampleRate">
        <Select
          options={[
            { label: '8kHz', value: 8000 },
            { label: '16kHz', value: 16000 },
            { label: '22kHz', value: 22050 },
            { label: '44.1kHz', value: 44100 },
            { label: '48kHz', value: 48000 },
          ]}
          placeholder="选择采样率"
        />
      </Form.Item>

      <Form.Item label="音频时长" name="duration">
        <div className="space-y-2">
          <Slider
            min={1}
            max={300}
            step={1}
            marks={{
              10: '10s',
              30: '30s',
              60: '1m',
              180: '3m',
              300: '5m',
            }}
          />
          <InputNumber
            min={1}
            max={300}
            step={1}
            style={{ width: '100%' }}
            addonAfter="秒"
          />
        </div>
      </Form.Item>
    </>
  );

  // 多模态参数 (LLM + CV的组合)
  const renderMultimodalParameters = () => (
    <div className="space-y-4">
      <Text type="secondary" className="text-sm">
        多模态模型需要同时配置语言和视觉参数
      </Text>

      <Divider>语言模型参数</Divider>
      {renderLLMParameters()}

      <Divider>视觉模型参数</Divider>
      {renderCVParameters()}
    </div>
  );

  // 根据模型类型渲染不同参数
  const renderTypeSpecificParameters = () => {
    switch (currentConfig.type) {
      case 'llm':
        return renderLLMParameters();
      case 'cv':
        return renderCVParameters();
      case 'audio':
        return renderAudioParameters();
      case 'multimodal':
        return renderMultimodalParameters();
      default:
        return null;
    }
  };

  return (
    <div>
      <Title level={4} className="mb-4">参数配置</Title>

      <Form
        form={form}
        layout="vertical"
        initialValues={currentConfig.parameters}
        onValuesChange={(_, allValues) => {
          setParameters(allValues);
        }}
      >
        {/* 通用参数 */}
        {renderCommonParameters()}

        {/* 类型特定参数 */}
        {renderTypeSpecificParameters()}
      </Form>

      {/* 参数说明 */}
      <div className="mt-6 p-3 bg-blue-50 rounded-md">
        <Text className="text-sm text-blue-700">
          <strong>参数说明：</strong>
        </Text>
        <div className="text-xs text-blue-600 mt-2 space-y-1">
          <div>• <strong>模型大小</strong>：模型的总参数量，直接影响内存需求</div>
          <div>• <strong>批次大小</strong>：同时处理的样本数量，影响吞吐量和内存使用</div>
          <div>• <strong>推理精度</strong>：FP32精度最高但内存需求大，FP16/INT8可显著减少内存</div>
          {currentConfig.type === 'llm' && (
            <>
              <div>• <strong>序列长度</strong>：输入文本的最大长度，影响激活值和KV缓存大小</div>
              <div>• <strong>上下文长度</strong>：模型支持的最大上下文窗口大小</div>
            </>
          )}
          {currentConfig.type === 'cv' && (
            <div>• <strong>图像尺寸</strong>：输入图像的分辨率，越大则内存需求越高</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParameterConfig;