import { create } from 'zustand';
import { PlatformType, ContentRecord } from '@/types';

interface ContentState {
  // 当前编辑的内容
  rawContent: string;
  targetQuery: string;
  optimizedContent: string;

  // 发布状态
  selectedPlatforms: PlatformType[];
  publishResults: Record<PlatformType, any>;

  // 历史记录
  contentHistory: ContentRecord[];

  // UI状态
  isOptimizing: boolean;
  isPublishing: boolean;

  // Actions
  setRawContent: (content: string) => void;
  setTargetQuery: (query: string) => void;
  setOptimizedContent: (content: string) => void;
  setSelectedPlatforms: (platforms: PlatformType[]) => void;
  setPublishResult: (platform: PlatformType, result: any) => void;
  setPublishResults: (results: Record<PlatformType, any>) => void;
  setContentHistory: (history: ContentRecord[]) => void;
  addToHistory: (record: ContentRecord) => void;
  setIsOptimizing: (loading: boolean) => void;
  setIsPublishing: (loading: boolean) => void;
  resetContent: () => void;
}

export const useContentStore = create<ContentState>((set, get) => ({
  // 初始状态
  rawContent: '',
  targetQuery: '',
  optimizedContent: '',
  selectedPlatforms: [],
  publishResults: {},
  contentHistory: [],
  isOptimizing: false,
  isPublishing: false,

  // Actions
  setRawContent: (content) => set({ rawContent: content }),

  setTargetQuery: (query) => set({ targetQuery: query }),

  setOptimizedContent: (content) => set({ optimizedContent: content }),

  setSelectedPlatforms: (platforms) => set({ selectedPlatforms: platforms }),

  setPublishResult: (platform, result) =>
    set((state) => ({
      publishResults: {
        ...state.publishResults,
        [platform]: result
      }
    })),

  setPublishResults: (results) => set({ publishResults: results }),

  setContentHistory: (history) => set({ contentHistory: history }),

  addToHistory: (record) =>
    set((state) => ({
      contentHistory: [record, ...state.contentHistory]
    })),

  setIsOptimizing: (loading) => set({ isOptimizing: loading }),

  setIsPublishing: (loading) => set({ isPublishing: loading }),

  resetContent: () => set({
    rawContent: '',
    targetQuery: '',
    optimizedContent: '',
    selectedPlatforms: [],
    publishResults: {},
    isOptimizing: false,
    isPublishing: false
  })
}));