// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 内容优化相关类型
export interface OptimizationRequest {
  rawContent: string;
  targetQuery: string;
}

export interface OptimizationResponse {
  id?: number;
  rawContent: string;
  targetQuery: string;
  optimizedContent: string;
}

export interface OptimizeAndSaveRequest {
  rawContent: string;
  targetQuery: string;
  title?: string;
}

export interface OptimizeAndSaveResponse {
  optimizedContent: string;
  optimizationId: string;
  originalContent: string;
  targetQuery: string;
  title: string;
}

// 平台相关类型
export type PlatformType = 'weibo' | 'xiaohongshu' | 'zhihu' | 'douyin' |
  'csdn' | 'juejin' | 'jianshu' | 'cnblogs' | 'oschina' | 'segmentfault';

export interface PlatformConfig {
  type: PlatformType;
  name: string;
  icon: string;
  loggedIn: boolean;
  username?: string;
}

// 发布相关类型
export interface PublishRequest {
  optimizedContent: string;
  platformType: PlatformType;
}

export interface PublishResponse {
  success: boolean;
  publishedUrl?: string;
  message?: string;
  error?: string;
}

// 批量发布相关类型
export interface BatchPublishRequest {
  optimizedContent: string;
  platforms: PlatformType[];
}

export interface BatchPublishResponse {
  results: Array<{
    platform: PlatformType;
    success: boolean;
    publishedUrl?: string;
    message?: string;
    error?: string;
  }>;
}

// 内容记录类型
export interface ContentRecord {
  id: number;
  rawContent: string;
  targetQuery: string;
  optimizedContent: string;
  platformType?: PlatformType;
  publishedUrl?: string;
  createdAt: string;
  publishedAt?: string;
  status: 'PENDING' | 'OPTIMIZED' | 'PUBLISHED' | 'FAILED';
  errorMessage?: string;
}

// 优化记录类型
export interface OptimizationRecord {
  id: number;
  optimizationId: string;
  title?: string;
  rawContent: string;
  targetQuery: string;
  optimizedContent: string;
  createdAt: string;
}

// 健康检查类型
export interface HealthResponse {
  status: string;
  timestamp: string;
  services: {
    database: 'UP' | 'DOWN';
    ai: 'UP' | 'DOWN';
    platforms: Record<PlatformType, 'UP' | 'DOWN'>;
  };
}