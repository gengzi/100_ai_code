import { create } from 'zustand';
import { ModelConfig, CalculationResult } from '@/types/model';
import { GPU_DATABASE } from '@/utils/gpuDatabase';
import { DEFAULT_CONFIG } from '@/utils/constants';
import { calculateModelEvaluation } from '@/utils/modelCalculations';

interface ModelState {
  // 当前模型配置
  currentConfig: ModelConfig;

  // 计算结果
  calculationResult: CalculationResult | null;
  isCalculating: boolean;
  error: string | null;

  // 历史记录
  history: CalculationResult[];

  // 可用GPU列表
  availableGPUs: typeof GPU_DATABASE;

  // Actions
  updateModelConfig: (config: Partial<ModelConfig>) => void;
  setModelType: (type: ModelConfig['type']) => void;
  setParameters: (parameters: Partial<ModelConfig['parameters']>) => void;
  calculateRequirements: (isTraining?: boolean) => Promise<void>;
  addToHistory: (result: CalculationResult) => void;
  clearHistory: () => void;
  setAvailableGPUs: (gpus: typeof GPU_DATABASE) => void;
  clearError: () => void;
  resetConfig: () => void;
}

const defaultModelConfig: ModelConfig = {
  id: 'custom-model',
  name: '自定义模型',
  type: 'llm',
  description: '用户自定义的模型配置',
  parameters: {
    modelSize: 7, // 7B参数
    sequenceLength: DEFAULT_CONFIG.sequenceLength,
    contextLength: DEFAULT_CONFIG.contextLength,
    batchSize: DEFAULT_CONFIG.batchSize,
    precision: DEFAULT_CONFIG.precision,
  },
};

export const useModelStore = create<ModelState>((set, get) => ({
  // Initial state
  currentConfig: defaultModelConfig,
  calculationResult: null,
  isCalculating: false,
  error: null,
  history: [],
  availableGPUs: GPU_DATABASE,

  // Actions
  updateModelConfig: (configUpdate) => {
    set((state) => ({
      currentConfig: { ...state.currentConfig, ...configUpdate },
      error: null,
    }));
  },

  setModelType: (type) => {
    set((state) => ({
      currentConfig: {
        ...state.currentConfig,
        type,
        id: `${type}-model-${Date.now()}`,
      },
    }));
  },

  setParameters: (parameters) => {
    set((state) => ({
      currentConfig: {
        ...state.currentConfig,
        parameters: {
          ...state.currentConfig.parameters,
          ...parameters,
        },
      },
    }));
  },

  calculateRequirements: async (isTraining = false) => {
    try {
      set({ isCalculating: true, error: null });

      const { currentConfig, availableGPUs } = get();

      // 模拟异步计算过程
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = calculateModelEvaluation(currentConfig, availableGPUs, isTraining);

      set({
        calculationResult: result,
        isCalculating: false,
      });

      // 自动添加到历史记录
      get().addToHistory(result);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '计算失败',
        isCalculating: false,
      });
    }
  },

  addToHistory: (result) => {
    set((state) => ({
      history: [result, ...state.history].slice(0, 50), // 保留最近50条记录
    }));
  },

  clearHistory: () => {
    set({ history: [] });
  },

  setAvailableGPUs: (gpus) => {
    set({ availableGPUs: gpus });
  },

  clearError: () => {
    set({ error: null });
  },

  resetConfig: () => {
    set({
      currentConfig: defaultModelConfig,
      calculationResult: null,
      error: null,
    });
  },
}));