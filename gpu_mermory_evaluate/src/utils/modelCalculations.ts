import { ModelConfig, MemoryUsage, PerformanceMetrics, CalculationResult } from '@/types/model';
import { GPUSpec } from '@/types/gpu';
import {
  PRECISION_BYTES,
  MODEL_OVERHEAD_FACTORS,
  TRAINING_OVERHEAD_FACTORS,
  PERFORMANCE_FACTORS,
  DEFAULT_CONFIG,
} from './constants';

/**
 * 计算模型权重内存需求
 */
export function calculateModelWeightsMemory(config: ModelConfig): number {
  const { modelSize, precision } = config.parameters;
  const bytesPerParam = PRECISION_BYTES[precision];

  // 基础权重内存 = 参数量 × 每个参数字节数
  const baseMemory = (modelSize * 1e9) * bytesPerParam;

  // 转换为GB
  const baseMemoryGB = baseMemory / (1024 ** 3);

  // 应用模型类型开销系数
  const overheadFactor = MODEL_OVERHEAD_FACTORS[config.type];

  return baseMemoryGB * overheadFactor;
}

/**
 * 计算激活值内存需求
 */
export function calculateActivationsMemory(config: ModelConfig): number {
  const { batchSize, precision } = config.parameters;
  const bytesPerParam = PRECISION_BYTES[precision];

  let activationsGB = 0;

  switch (config.type) {
    case 'llm': {
      // LLM激活值内存估算
      const { hiddenLayers = 32, hiddenSize = 4096, sequenceLength = 2048 } = config.parameters;

      // 每层的激活值 ≈ batch_size × sequence_length × hidden_size × bytes_per_param
      const activationPerLayer = batchSize * sequenceLength * hiddenSize * bytesPerParam;
      const totalActivations = activationPerLayer * hiddenLayers;

      activationsGB = totalActivations / (1024 ** 3);
      break;
    }

    case 'cv': {
      // CV模型激活值内存估算 (简化计算)
      const { imageWidth = 512, imageHeight = 512, channels = 3 } = config.parameters;

      // 假设激活值是输入大小的10倍 (经验值)
      const inputSize = batchSize * imageWidth * imageHeight * channels * bytesPerParam;
      activationsGB = (inputSize * 10) / (1024 ** 3);
      break;
    }

    case 'audio': {
      // Audio模型激活值内存估算
      const { sampleRate = 16000, duration = 10 } = config.parameters;
      const sequenceLength = (sampleRate * duration) / 16000; // 假设16ms为一帧

      // 简化计算
      const activationSize = batchSize * sequenceLength * 512 * bytesPerParam; // 512为特征维度
      activationsGB = (activationSize * 5) / (1024 ** 3); // 假设5层
      break;
    }

    case 'multimodal': {
      // 多模态模型取各类型激活值的加权平均
      const llmActivations = calculateActivationsMemory({
        ...config,
        type: 'llm',
      });
      const cvActivations = calculateActivationsMemory({
        ...config,
        type: 'cv',
      });

      activationsGB = (llmActivations * 0.6 + cvActivations * 0.4);
      break;
    }

    default:
      // 默认估算
      activationsGB = 1.0;
  }

  return activationsGB;
}

/**
 * 计算KV缓存内存 (仅适用于LLM)
 */
export function calculateKVCacheMemory(config: ModelConfig): number {
  if (config.type !== 'llm') {
    return 0;
  }

  const {
    batchSize,
    sequenceLength = 2048,
    hiddenLayers = 32,
    hiddenSize = 4096,
    precision
  } = config.parameters;

  const bytesPerParam = PRECISION_BYTES[precision];

  // KV缓存大小 = 2 (K和V) × 层数 × 序列长度 × 隐藏层维度 × 字节数 × 批次大小
  const kvCacheSize = 2 * hiddenLayers * sequenceLength * hiddenSize * bytesPerParam * batchSize;

  return kvCacheSize / (1024 ** 3);
}

/**
 * 计算训练时的额外内存需求
 */
export function calculateTrainingMemory(config: ModelConfig, modelWeightsMemory: number): {
  gradients: number;
  optimizer: number;
} {
  const { precision } = config.parameters;

  // 梯度内存通常等于模型权重内存 (FP32)
  const gradients = modelWeightsMemory;

  // 优化器内存取决于优化器类型和精度
  let optimizerMultiplier = 2; // 默认Adam优化器

  if (precision === 'fp16' || precision === 'int8') {
    // 混合精度训练需要额外的FP32权重副本
    optimizerMultiplier = 3;
  }

  const optimizer = modelWeightsMemory * optimizerMultiplier;

  return { gradients, optimizer };
}

/**
 * 计算总内存使用
 */
export function calculateTotalMemoryUsage(config: ModelConfig, isTraining: boolean = false): MemoryUsage {
  const modelWeights = calculateModelWeightsMemory(config);
  const activations = calculateActivationsMemory(config);
  const kvCache = calculateKVCacheMemory(config);

  // 基础总内存
  let total = modelWeights + activations + kvCache;

  // 训练时需要额外的梯度和优化器内存
  let gradients = 0;
  let optimizer = 0;

  if (isTraining) {
    const trainingMemory = calculateTrainingMemory(config, modelWeights);
    gradients = trainingMemory.gradients;
    optimizer = trainingMemory.optimizer;
    total += gradients + optimizer;
  }

  return {
    modelWeights,
    activations,
    gradients,
    optimizer,
    kvCache,
    total,
  };
}

/**
 * 估算性能指标
 */
export function estimatePerformance(
  config: ModelConfig,
  gpu: GPUSpec,
  memoryUsage: MemoryUsage
): PerformanceMetrics {
  const { batchSize, precision } = config.parameters;
  const { tflops } = gpu;

  // 获取对应精度的理论算力
  const theoreticalTflops = tflops[precision === 'fp32' ? 'fp32' : precision === 'fp16' ? 'fp16' : 'int8'];

  // 应用效率系数
  const effectiveTflops = theoreticalTflops * PERFORMANCE_FACTORS.efficiency;

  let latency = 1000; // 默认1秒延迟
  let tokensPerSecond: number | undefined;
  let fps: number | undefined;

  switch (config.type) {
    case 'llm': {
      // LLM性能估算 (简化计算)
      const { modelSize } = config.parameters;
      const opsPerToken = modelSize * 2; // 每个token大约需要2倍参数量的运算

      // 估算tokens/秒
      tokensPerSecond = (effectiveTflops * 1e12) / (opsPerToken * 1e9) * batchSize;

      // 延迟估算
      const tokensPerRequest = config.parameters.sequenceLength || 2048;
      latency = (tokensPerRequest / (tokensPerSecond || 1)) * 1000;

      break;
    }

    case 'cv': {
      // CV性能估算 (图像/秒)
      const { imageWidth = 512, imageHeight = 512, channels = 3 } = config.parameters;
      const inputPixels = imageWidth * imageHeight * channels;
      const opsPerImage = inputPixels * 1000; // 简化的每像素操作数

      const imagesPerSecond = (effectiveTflops * 1e12) / (opsPerImage * batchSize);
      fps = imagesPerSecond / batchSize;

      latency = (1 / (fps || 1)) * 1000;
      break;
    }

    case 'audio': {
      // Audio性能估算 (简化)
      latency = 500; // 假设500ms延迟
      break;
    }

    default:
      latency = 1000;
  }

  return {
    tokensPerSecond,
    fps,
    throughput: tokensPerSecond || fps || 1,
    latency,
    memoryBandwidthUtilization: (memoryUsage.total / gpu.memoryGB) * 100,
  };
}

/**
 * 完整的模型评估计算
 */
export function calculateModelEvaluation(
  config: ModelConfig,
  availableGPUs: GPUSpec[],
  isTraining: boolean = false
): CalculationResult {
  // 计算内存使用
  const memoryUsage = calculateTotalMemoryUsage(config, isTraining);

  // 筛选兼容的GPU
  const compatibleGPUs = availableGPUs.filter(gpu =>
    gpu.memoryGB >= memoryUsage.total
  );

  // 为每个兼容GPU计算性能并排序
  const gpuRecommendations = compatibleGPUs.map(gpu => ({
    gpu,
    estimatedPerformance: estimatePerformance(config, gpu, memoryUsage),
  })).sort((a, b) => {
    // 按性能排序 (tokens/秒 或 FPS)
    const aPerf = a.estimatedPerformance.tokensPerSecond || a.estimatedPerformance.fps || 0;
    const bPerf = b.estimatedPerformance.tokensPerSecond || b.estimatedPerformance.fps || 0;
    return bPerf - aPerf;
  });

  // 生成警告信息
  const warnings: string[] = [];
  if (memoryUsage.total > 24) {
    warnings.push('内存需求较大，建议使用专业级GPU');
  }
  if (config.parameters.precision === 'fp32' && config.type === 'llm') {
    warnings.push('FP32精度会显著增加内存使用，建议使用FP16或INT8');
  }

  return {
    id: `${config.id}-${Date.now()}`,
    timestamp: new Date(),
    modelConfig: config,
    memoryUsage,
    performance: estimatePerformance(config, gpuRecommendations[0]?.gpu || availableGPUs[0], memoryUsage),
    recommendedGPUs: gpuRecommendations.slice(0, 5).map(item => item.gpu), // 推荐5个最佳GPU
    warnings,
    notes: isTraining ? ['计算结果包含训练模式的内存需求'] : ['仅计算推理模式内存需求'],
  };
}