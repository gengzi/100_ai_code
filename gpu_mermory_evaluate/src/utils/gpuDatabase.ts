import { GPUSpec } from '@/types/gpu';

// GPU数据库 - 按发布时间和性能排序
export const GPU_DATABASE: GPUSpec[] = [
  // NVIDIA RTX 40系列
  {
    id: 'rtx4090',
    name: 'NVIDIA GeForce RTX 4090',
    manufacturer: 'nvidia',
    memoryGB: 24,
    memoryBandwidth: 1008,
    computeUnits: 128,
    tflops: {
      fp32: 82.6,
      fp16: 165.1,
      int8: 330.2,
      int4: 660.4,
    },
    architecture: 'Ada Lovelace',
    tdp: 450,
    price: 1599,
    releaseYear: 2022,
    memoryType: 'GDDR6X',
    pcieVersion: 4,
  },
  {
    id: 'rtx4080',
    name: 'NVIDIA GeForce RTX 4080',
    manufacturer: 'nvidia',
    memoryGB: 16,
    memoryBandwidth: 716.8,
    computeUnits: 76,
    tflops: {
      fp32: 48.7,
      fp16: 97.4,
      int8: 194.8,
      int4: 389.6,
    },
    architecture: 'Ada Lovelace',
    tdp: 320,
    price: 1199,
    releaseYear: 2022,
    memoryType: 'GDDR6X',
    pcieVersion: 4,
  },
  {
    id: 'rtx4070ti',
    name: 'NVIDIA GeForce RTX 4070 Ti',
    manufacturer: 'nvidia',
    memoryGB: 12,
    memoryBandwidth: 504.2,
    computeUnits: 60,
    tflops: {
      fp32: 40.1,
      fp16: 80.2,
      int8: 160.4,
      int4: 320.8,
    },
    architecture: 'Ada Lovelace',
    tdp: 285,
    price: 799,
    releaseYear: 2023,
    memoryType: 'GDDR6X',
    pcieVersion: 4,
  },

  // NVIDIA RTX 30系列
  {
    id: 'rtx3090',
    name: 'NVIDIA GeForce RTX 3090',
    manufacturer: 'nvidia',
    memoryGB: 24,
    memoryBandwidth: 936.2,
    computeUnits: 104,
    tflops: {
      fp32: 35.7,
      fp16: 71.4,
      int8: 142.8,
      int4: 285.6,
    },
    architecture: 'Ampere',
    tdp: 350,
    price: 1499,
    releaseYear: 2020,
    memoryType: 'GDDR6X',
    pcieVersion: 4,
  },
  {
    id: 'rtx3080ti',
    name: 'NVIDIA GeForce RTX 3080 Ti',
    manufacturer: 'nvidia',
    memoryGB: 12,
    memoryBandwidth: 912.4,
    computeUnits: 80,
    tflops: {
      fp32: 34.1,
      fp16: 68.2,
      int8: 136.4,
      int4: 272.8,
    },
    architecture: 'Ampere',
    tdp: 350,
    price: 1199,
    releaseYear: 2021,
    memoryType: 'GDDR6X',
    pcieVersion: 4,
  },
  {
    id: 'rtx3080',
    name: 'NVIDIA GeForce RTX 3080',
    manufacturer: 'nvidia',
    memoryGB: 10,
    memoryBandwidth: 760.3,
    computeUnits: 68,
    tflops: {
      fp32: 29.8,
      fp16: 59.6,
      int8: 119.2,
      int4: 238.4,
    },
    architecture: 'Ampere',
    tdp: 320,
    price: 699,
    releaseYear: 2020,
    memoryType: 'GDDR6X',
    pcieVersion: 4,
  },
  {
    id: 'rtx3070',
    name: 'NVIDIA GeForce RTX 3070',
    manufacturer: 'nvidia',
    memoryGB: 8,
    memoryBandwidth: 448.0,
    computeUnits: 46,
    tflops: {
      fp32: 20.3,
      fp16: 40.6,
      int8: 81.2,
      int4: 162.4,
    },
    architecture: 'Ampere',
    tdp: 220,
    price: 499,
    releaseYear: 2020,
    memoryType: 'GDDR6',
    pcieVersion: 4,
  },

  // NVIDIA RTX 20系列
  {
    id: 'rtx2080ti',
    name: 'NVIDIA GeForce RTX 2080 Ti',
    manufacturer: 'nvidia',
    memoryGB: 11,
    memoryBandwidth: 616.0,
    computeUnits: 68,
    tflops: {
      fp32: 13.4,
      fp16: 26.8,
      int8: 53.6,
      int4: 107.2,
    },
    architecture: 'Turing',
    tdp: 250,
    price: 999,
    releaseYear: 2018,
    memoryType: 'GDDR6',
    pcieVersion: 3,
  },
  {
    id: 'rtx2080',
    name: 'NVIDIA GeForce RTX 2080',
    manufacturer: 'nvidia',
    memoryGB: 8,
    memoryBandwidth: 448.0,
    computeUnits: 46,
    tflops: {
      fp32: 10.1,
      fp16: 20.2,
      int8: 40.4,
      int4: 80.8,
    },
    architecture: 'Turing',
    tdp: 215,
    price: 699,
    releaseYear: 2018,
    memoryType: 'GDDR6',
    pcieVersion: 3,
  },

  // NVIDIA RTX A系列 (专业卡)
  {
    id: 'rtxa6000',
    name: 'NVIDIA RTX A6000',
    manufacturer: 'nvidia',
    memoryGB: 48,
    memoryBandwidth: 768.0,
    computeUnits: 84,
    tflops: {
      fp32: 38.7,
      fp16: 77.4,
      int8: 154.8,
      int4: 309.6,
    },
    architecture: 'Ampere',
    tdp: 300,
    price: 4650,
    releaseYear: 2020,
    memoryType: 'GDDR6',
    pcieVersion: 4,
    nvlink: true,
  },
  {
    id: 'rtxa5000',
    name: 'NVIDIA RTX A5000',
    manufacturer: 'nvidia',
    memoryGB: 24,
    memoryBandwidth: 624.0,
    computeUnits: 64,
    tflops: {
      fp32: 27.8,
      fp16: 55.6,
      int8: 111.2,
      int4: 222.4,
    },
    architecture: 'Ampere',
    tdp: 230,
    price: 2249,
    releaseYear: 2020,
    memoryType: 'GDDR6',
    pcieVersion: 4,
  },

  // NVIDIA H系列 (数据中心)
  {
    id: 'h100',
    name: 'NVIDIA H100',
    manufacturer: 'nvidia',
    memoryGB: 80,
    memoryBandwidth: 2039,
    computeUnits: 132,
    tflops: {
      fp32: 67.0,
      fp16: 2000,
      int8: 4000,
      int4: 8000,
    },
    architecture: 'Hopper',
    tdp: 700,
    price: 35000,
    releaseYear: 2022,
    memoryType: 'HBM3',
    pcieVersion: 5,
    nvlink: true,
  },
  {
    id: 'a100',
    name: 'NVIDIA A100',
    manufacturer: 'nvidia',
    memoryGB: 80,
    memoryBandwidth: 1555,
    computeUnits: 108,
    tflops: {
      fp32: 19.5,
      fp16: 312,
      int8: 624,
      int4: 1248,
    },
    architecture: 'Ampere',
    tdp: 400,
    price: 15000,
    releaseYear: 2020,
    memoryType: 'HBM2e',
    pcieVersion: 4,
    nvlink: true,
  },

  // AMD GPU
  {
    id: 'rx7900xtx',
    name: 'AMD Radeon RX 7900 XTX',
    manufacturer: 'amd',
    memoryGB: 24,
    memoryBandwidth: 960,
    computeUnits: 96,
    tflops: {
      fp32: 61.4,
      fp16: 122.8,
      int8: 245.6,
      int4: 491.2,
    },
    architecture: 'RDNA 3',
    tdp: 355,
    price: 999,
    releaseYear: 2022,
    memoryType: 'GDDR6',
    pcieVersion: 4,
  },
  {
    id: 'rx7900xt',
    name: 'AMD Radeon RX 7900 XT',
    manufacturer: 'amd',
    memoryGB: 20,
    memoryBandwidth: 800,
    computeUnits: 84,
    tflops: {
      fp32: 53.7,
      fp16: 107.4,
      int8: 214.8,
      int4: 429.6,
    },
    architecture: 'RDNA 3',
    tdp: 315,
    price: 899,
    releaseYear: 2022,
    memoryType: 'GDDR6',
    pcieVersion: 4,
  },

  // Intel Arc
  {
    id: 'arc-a770',
    name: 'Intel Arc A770',
    manufacturer: 'intel',
    memoryGB: 16,
    memoryBandwidth: 560,
    computeUnits: 32,
    tflops: {
      fp32: 16.8,
      fp16: 33.6,
      int8: 67.2,
      int4: 134.4,
    },
    architecture: 'Alchemist',
    tdp: 225,
    price: 349,
    releaseYear: 2022,
    memoryType: 'GDDR6',
    pcieVersion: 4,
  },
];

// 按不同条件筛选GPU的函数
export const filterGPUs = {
  // 按内存容量筛选
  byMemory: (minMemoryGB: number) =>
    GPU_DATABASE.filter(gpu => gpu.memoryGB >= minMemoryGB),

  // 按性能筛选
  byPerformance: (minTflops: number, precision: keyof GPUSpec['tflops'] = 'fp32') =>
    GPU_DATABASE.filter(gpu => gpu.tflops[precision] >= minTflops),

  // 按价格筛选
  byPrice: (maxPrice?: number) =>
    maxPrice ? GPU_DATABASE.filter(gpu => !gpu.price || gpu.price <= maxPrice) : GPU_DATABASE,

  // 按制造商筛选
  byManufacturer: (manufacturer: GPUSpec['manufacturer']) =>
    GPU_DATABASE.filter(gpu => gpu.manufacturer === manufacturer),

  // 按架构筛选
  byArchitecture: (architecture: string) =>
    GPU_DATABASE.filter(gpu => gpu.architecture.toLowerCase().includes(architecture.toLowerCase())),

  // 企业级GPU
  enterprise: () => GPU_DATABASE.filter(gpu =>
    gpu.name.includes('A100') ||
    gpu.name.includes('H100') ||
    gpu.name.includes('RTX A')
  ),

  // 消费级GPU
  consumer: () => GPU_DATABASE.filter(gpu =>
    !gpu.name.includes('A100') &&
    !gpu.name.includes('H100') &&
    !gpu.name.includes('RTX A')
  ),

  // 最新GPU
  latest: (yearThreshold = 2022) =>
    GPU_DATABASE.filter(gpu => gpu.releaseYear && gpu.releaseYear >= yearThreshold),
};

// 按性能排序
export const sortGPUsBy = {
  performance: (precision: keyof GPUSpec['tflops'] = 'fp32') =>
    [...GPU_DATABASE].sort((a, b) => b.tflops[precision] - a.tflops[precision]),

  memory: () =>
    [...GPU_DATABASE].sort((a, b) => b.memoryGB - a.memoryGB),

  priceLowToHigh: () =>
    [...GPU_DATABASE].sort((a, b) => (a.price || 0) - (b.price || 0)),

  priceHighToLow: () =>
    [...GPU_DATABASE].sort((a, b) => (b.price || 0) - (a.price || 0)),

 性价比: () => {
    return [...GPU_DATABASE]
      .filter(gpu => gpu.price && gpu.price > 0)
      .map(gpu => ({
        ...gpu,
        costEfficiency: gpu.tflops.fp16 / gpu.price, // 性价比 = 性能/价格
      }))
      .sort((a, b) => b.costEfficiency - a.costEfficiency);
  },
};

// 获取推荐GPU
export const getRecommendedGPUs = (memoryRequirementGB: number, budget?: number) => {
  let candidates = filterGPUs.byMemory(memoryRequirementGB);

  if (budget) {
    candidates = candidates.filter(gpu => !gpu.price || gpu.price <= budget);
  }

  // 按性价比排序
  return candidates
    .map(gpu => ({
      gpu,
      score: (gpu.tflops.fp16 / (gpu.price || 1)) * (1 - Math.max(0, memoryRequirementGB / gpu.memoryGB - 0.7)),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => item.gpu);
};