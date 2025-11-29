export type ModelType = 'llm' | 'cv' | 'audio' | 'multimodal';

export type Precision = 'fp32' | 'fp16' | 'int8' | 'int4';

export interface ModelConfig {
  id: string;
  name: string;
  type: ModelType;
  description?: string;
  parameters: {
    modelSize: number; // 模型参数量 (B)
    sequenceLength?: number; // 序列长度 (LLM)
    contextLength?: number; // 上下文长度 (LLM)
    batchSize: number; // 批次大小
    precision: Precision;
    hiddenLayers?: number; // 隐藏层数 (LLM)
    hiddenSize?: number; // 隐藏层大小 (LLM)
    intermediateSize?: number; // 中间层大小 (LLM)
    vocabSize?: number; // 词汇表大小 (LLM)
    maxPositionEmbeddings?: number; // 最大位置嵌入 (LLM)
    imageWidth?: number; // 图像宽度 (CV)
    imageHeight?: number; // 图像高度 (CV)
    channels?: number; // 通道数 (CV)
    sampleRate?: number; // 采样率 (Audio)
    duration?: number; // 音频时长 (Audio)
  };
}

export interface MemoryUsage {
  modelWeights: number; // 模型权重内存 (GB)
  activations: number; // 激活值内存 (GB)
  gradients: number; // 梯度内存 (GB) - 训练时使用
  optimizer: number; // 优化器内存 (GB) - 训练时使用
  kvCache?: number; // KV缓存内存 (GB) - LLM推理时使用
  total: number; // 总内存 (GB)
}

export interface PerformanceMetrics {
  tokensPerSecond?: number; // tokens/秒 (LLM)
  fps?: number; // 帧/秒 (CV)
  throughput?: number; // 样本/秒 (通用)
  latency: number; // 延迟 (ms)
  memoryBandwidthUtilization?: number; // 内存带宽利用率 (%)
}

export interface CalculationResult {
  id: string;
  timestamp: Date;
  modelConfig: ModelConfig;
  memoryUsage: MemoryUsage;
  performance: PerformanceMetrics;
  recommendedGPUs: GPUSpec[];
  warnings?: string[];
  notes?: string[];
}

export interface ModelTemplate {
  id: string;
  name: string;
  type: ModelType;
  category: string;
  defaultParameters: Partial<ModelConfig['parameters']>;
  description: string;
  paperUrl?: string;
  modelUrl?: string;
}