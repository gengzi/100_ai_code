// 精度对应的字节数
export const PRECISION_BYTES = {
  fp32: 4,
  fp16: 2,
  int8: 1,
  int4: 0.5,
} as const;

// 模型类型的基础开销系数
export const MODEL_OVERHEAD_FACTORS = {
  llm: 1.2, // LLM有KV缓存等额外开销
  cv: 1.1,
  audio: 1.05,
  multimodal: 1.3, // 多模态模型开销较大
} as const;

// 训练时的额外开销
export const TRAINING_OVERHEAD_FACTORS = {
  gradients: 1.0, // 梯度内存 ≈ 模型权重
  optimizer: {
    adam: 2.0, // Adam优化器需要2倍模型权重的内存
    sgd: 1.0, // SGD需要1倍模型权重的内存
    adamw: 2.0,
  },
} as const;

// GPU性能估算系数
export const PERFORMANCE_FACTORS = {
  efficiency: 0.8, // 实际效率通常为理论峰值的80%
  memoryBandwidthUtilization: 0.7, // 内存带宽利用率
  computeUtilization: 0.75, // 计算单元利用率
} as const;

// 常用模型默认参数
export const DEFAULT_MODEL_PARAMS = {
  'gpt-3.5-turbo': {
    modelSize: 175, // B
    hiddenLayers: 96,
    hiddenSize: 12288,
    intermediateSize: 49152,
    vocabSize: 50257,
    maxPositionEmbeddings: 2048,
    sequenceLength: 2048,
  },
  'gpt-4': {
    modelSize: 820, // B (估算)
    hiddenLayers: 80,
    hiddenSize: 8192,
    intermediateSize: 32768,
    vocabSize: 100000,
    maxPositionEmbeddings: 8192,
    sequenceLength: 8192,
  },
  'llama-2-7b': {
    modelSize: 7,
    hiddenLayers: 32,
    hiddenSize: 4096,
    intermediateSize: 11008,
    vocabSize: 32000,
    maxPositionEmbeddings: 4096,
    sequenceLength: 4096,
  },
  'llama-2-13b': {
    modelSize: 13,
    hiddenLayers: 40,
    hiddenSize: 5120,
    intermediateSize: 13824,
    vocabSize: 32000,
    maxPositionEmbeddings: 4096,
    sequenceLength: 4096,
  },
  'stable-diffusion-xl': {
    modelSize: 2.6,
    imageWidth: 1024,
    imageHeight: 1024,
    channels: 3,
  },
} as const;

// GPU推荐的阈值
export const GPU_RECOMMENDATION_THRESHOLDS = {
  memorySufficiency: 0.8, // 内存使用率不超过80%
  performanceTarget: 0.9, // 性能达到目标的90%
  costEfficiency: 1000, // 性价比阈值
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
  batchSize: 1,
  precision: 'fp16' as const,
  sequenceLength: 2048,
  contextLength: 4096,
  imageWidth: 512,
  imageHeight: 512,
  channels: 3,
  sampleRate: 16000,
  duration: 10,
} as const;