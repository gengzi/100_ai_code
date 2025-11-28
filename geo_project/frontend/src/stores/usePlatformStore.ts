import { create } from 'zustand';
import { PlatformConfig, PlatformType } from '@/types';
import { checkPlatformStatus } from '@/services/api';

interface PlatformState {
  platforms: PlatformConfig[];
  isLoading: boolean;

  // Actions
  updatePlatformStatus: (platformType: PlatformType, loggedIn: boolean, username?: string) => void;
  setIsLoading: (loading: boolean) => void;
  resetPlatforms: () => void;
  refreshAllPlatformStatus: () => Promise<void>;
  refreshPlatformStatus: (platformType: PlatformType) => Promise<void>;
}

// 默认平台配置
const defaultPlatforms: PlatformConfig[] = [
  {
    type: 'weibo',
    name: '微博',
    icon: '🌐',
    loggedIn: false
  },
  {
    type: 'xiaohongshu',
    name: '小红书',
    icon: '📖',
    loggedIn: false
  },
  {
    type: 'zhihu',
    name: '知乎',
    icon: '💡',
    loggedIn: false
  },
  {
    type: 'douyin',
    name: '抖音',
    icon: '🎵',
    loggedIn: false
  },
  // 新增国内内容平台
  {
    type: 'csdn',
    name: 'CSDN',
    icon: '💻',
    loggedIn: false
  },
  {
    type: 'juejin',
    name: '掘金',
    icon: '⛏️',
    loggedIn: false
  },
  {
    type: 'jianshu',
    name: '简书',
    icon: '📝',
    loggedIn: false
  },
  {
    type: 'cnblogs',
    name: '博客园',
    icon: '🏡',
    loggedIn: false
  },
  {
    type: 'oschina',
    name: '开源中国',
    icon: '🔧',
    loggedIn: false
  },
  {
    type: 'segmentfault',
    name: 'SegmentFault',
    icon: '🐞',
    loggedIn: false
  }
];

export const usePlatformStore = create<PlatformState>((set, get) => ({
  platforms: defaultPlatforms,
  isLoading: false,

  updatePlatformStatus: (platformType, loggedIn, username) =>
    set((state) => ({
      platforms: state.platforms.map((platform) =>
        platform.type === platformType
          ? { ...platform, loggedIn, username }
          : platform
      )
    })),

  setIsLoading: (loading) => set({ isLoading: loading }),

  resetPlatforms: () => set({
    platforms: defaultPlatforms,
    isLoading: false
  }),

  refreshAllPlatformStatus: async () => {
    const { platforms } = get();
    set({ isLoading: true });

    try {
      const statusPromises = platforms.map(async (platform) => {
        try {
          const response = await checkPlatformStatus(platform.type);
          const loggedIn = response.success ? response.loggedIn || false : false;
          return { type: platform.type, loggedIn };
        } catch (error) {
          console.warn(`检查 ${platform.type} 状态失败:`, error);
          return { type: platform.type, loggedIn: false };
        }
      });

      const results = await Promise.all(statusPromises);

      set((state) => ({
        platforms: state.platforms.map((platform) => {
          const result = results.find(r => r.type === platform.type);
          return result ? { ...platform, loggedIn: result.loggedIn } : platform;
        })
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  refreshPlatformStatus: async (platformType) => {
    try {
      const response = await checkPlatformStatus(platformType);
      const loggedIn = response.success ? response.loggedIn || false : false;

      get().updatePlatformStatus(platformType, loggedIn);
    } catch (error) {
      console.warn(`检查 ${platformType} 状态失败:`, error);
      get().updatePlatformStatus(platformType, false);
    }
  }
}));