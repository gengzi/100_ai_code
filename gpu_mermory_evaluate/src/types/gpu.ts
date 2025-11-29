export interface GPUSpec {
  id: string;
  name: string;
  manufacturer: 'nvidia' | 'amd' | 'intel';
  memoryGB: number;
  memoryBandwidth: number; // GB/s
  computeUnits: number;
  tflops: {
    fp32: number;
    fp16: number;
    int8: number;
    int4?: number;
  };
  architecture: string;
  tdp: number; // 热设计功耗 (W)
  price?: number; // 参考价格 (USD)
  releaseYear?: number;
  memoryType: 'GDDR6' | 'GDDR6X' | 'HBM2' | 'HBM2e' | 'HBM3';
  pcieVersion: 3 | 4 | 5;
  nvlink?: boolean;
}

export interface GPUCompatibility {
  gpuId: string;
  supported: boolean;
  memorySufficient: boolean;
  performanceAdequate: boolean;
  recommendedBatchSize?: number;
  maxSequenceLength?: number;
  estimatedUtilization?: number; // GPU利用率估计 (%)
}

export interface GPUSuggestion {
  gpu: GPUSpec;
  compatibility: GPUCompatibility;
  reason: string;
  estimatedPerformance: {
    tokensPerSecond?: number;
    fps?: number;
    latency: number;
  };
  costEfficiency?: number; // 性价比分数
}

export interface ComparisonResult {
  models: CalculationResult[];
  gpuRecommendations: GPUSuggestion[];
  summary: {
    mostMemoryEfficient: string;
    bestPerformance: string;
    mostCostEffective: string;
  };
}