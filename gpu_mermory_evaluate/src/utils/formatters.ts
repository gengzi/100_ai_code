/**
 * 格式化内存大小为GB显示
 */
export function formatGB(bytes: number, precision: number = 2): string {
  return `${bytes.toFixed(precision)} GB`;
}

/**
 * 格式化数字为易读格式
 */
export function formatNumber(num: number, precision: number = 1): string {
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(precision)}B`;
  } else if (num >= 1e6) {
    return `${(num / 1e6).toFixed(precision)}M`;
  } else if (num >= 1e3) {
    return `${(num / 1e3).toFixed(precision)}K`;
  }
  return num.toString();
}

/**
 * 格式化模型参数量
 */
export function formatModelSize(paramsInBillions: number): string {
  if (paramsInBillions >= 1000) {
    return `${(paramsInBillions / 1000).toFixed(1)}T`;
  }
  return `${paramsInBillions.toFixed(1)}B`;
}

/**
 * 格式化性能指标
 */
export function formatPerformance(
  metrics: {
    tokensPerSecond?: number;
    fps?: number;
    latency: number;
  }
): {
  mainMetric: string;
  details: string[];
} {
  const details: string[] = [];

  let mainMetric = '';

  if (metrics.tokensPerSecond) {
    mainMetric = `${metrics.tokensPerSecond.toFixed(1)} tokens/s`;
    details.push(`吞吐量: ${metrics.tokensPerSecond.toFixed(1)} tokens/秒`);
  }

  if (metrics.fps) {
    mainMetric = `${metrics.fps.toFixed(1)} FPS`;
    details.push(`帧率: ${metrics.fps.toFixed(1)} FPS`);
  }

  // 延迟格式化
  if (metrics.latency < 1000) {
    details.push(`延迟: ${metrics.latency.toFixed(0)}ms`);
  } else {
    details.push(`延迟: ${(metrics.latency / 1000).toFixed(1)}s`);
  }

  return { mainMetric, details };
}

/**
 * 格式化价格
 */
export function formatPrice(priceUSD: number, currency: string = 'USD'): string {
  if (currency === 'USD') {
    return `$${priceUSD.toLocaleString()}`;
  } else if (currency === 'CNY') {
    return `¥${(priceUSD * 7.2).toLocaleString()}`; // 简化汇率
  }
  return priceUSD.toLocaleString();
}

/**
 * 格式化GPU规格信息
 */
export function formatGPUSpecs(gpu: {
  name: string;
  memoryGB: number;
  memoryBandwidth: number;
  tflops: { fp32: number; fp16: number; int8: number };
  tdp: number;
  price?: number;
}): string[] {
  const specs: string[] = [];

  specs.push(`显存: ${gpu.memoryGB}GB`);
  specs.push(`带宽: ${gpu.memoryBandwidth}GB/s`);
  specs.push(`算力: ${gpu.tflops.fp16.toFixed(1)} TFLOPS (FP16)`);
  specs.push(`功耗: ${gpu.tdp}W`);

  if (gpu.price) {
    specs.push(`价格: $${gpu.price.toLocaleString()}`);
  }

  return specs;
}

/**
 * 格式化日期
 */
export function formatDate(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化时间差
 */
export function formatTimeDiff(startTime: Date, endTime: Date = new Date()): string {
  const diff = endTime.getTime() - startTime.getTime();

  if (diff < 1000) {
    return `${diff}ms`;
  } else if (diff < 60000) {
    return `${(diff / 1000).toFixed(1)}s`;
  } else if (diff < 3600000) {
    return `${(diff / 60000).toFixed(1)}min`;
  }
  return `${(diff / 3600000).toFixed(1)}h`;
}

/**
 * 格式化精度显示
 */
export function formatPrecision(precision: string): string {
  const precisionMap: Record<string, string> = {
    'fp32': 'FP32 (32位浮点)',
    'fp16': 'FP16 (16位浮点)',
    'int8': 'INT8 (8位整型)',
    'int4': 'INT4 (4位整型)',
  };
  return precisionMap[precision] || precision.toUpperCase();
}

/**
 * 格式化模型类型显示
 */
export function formatModelType(type: string): string {
  const typeMap: Record<string, string> = {
    'llm': '大语言模型 (LLM)',
    'cv': '计算机视觉 (CV)',
    'audio': '音频处理',
    'multimodal': '多模态模型',
  };
  return typeMap[type] || type.toUpperCase();
}

/**
 * 格式化内存使用率
 */
export function formatMemoryUsageRatio(used: number, total: number): {
  ratio: number;
  percentage: string;
  status: 'normal' | 'warning' | 'critical';
  color: string;
} {
  const ratio = used / total;
  const percentage = `${(ratio * 100).toFixed(1)}%`;

  let status: 'normal' | 'warning' | 'critical' = 'normal';
  let color = '#52c41a'; // 绿色

  if (ratio > 0.9) {
    status = 'critical';
    color = '#ff4d4f'; // 红色
  } else if (ratio > 0.75) {
    status = 'warning';
    color = '#faad14'; // 橙色
  }

  return { ratio, percentage, status, color };
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * 格式化TDP功耗
 */
export function formatTDP(tdp: number): string {
  if (tdp < 75) {
    return `${tdp}W (低功耗)`;
  } else if (tdp < 300) {
    return `${tdp}W (中等功耗)`;
  } else {
    return `${tdp}W (高功耗)`;
  }
}

/**
 * 格式化性价比分数
 */
export function formatCostEfficiency(score: number): {
  value: string;
  level: 'low' | 'medium' | 'high' | 'excellent';
  color: string;
} {
  let level: 'low' | 'medium' | 'high' | 'excellent' = 'low';
  let color = '#ff4d4f';

  if (score > 0.1) {
    level = 'excellent';
    color = '#52c41a';
  } else if (score > 0.05) {
    level = 'high';
    color = '#13c2c2';
  } else if (score > 0.02) {
    level = 'medium';
    color = '#faad14';
  }

  return {
    value: score.toFixed(3),
    level,
    color,
  };
}