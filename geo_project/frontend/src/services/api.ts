import axios from 'axios';
import type {
  ApiResponse,
  OptimizationRequest,
  OptimizationResponse,
  OptimizeAndSaveRequest,
  OptimizeAndSaveResponse,
  PublishRequest,
  PublishResponse,
  BatchPublishRequest,
  BatchPublishResponse,
  ContentRecord,
  OptimizationRecord,
  HealthResponse,
  PlatformType
} from '@/types';

// 创建axios实例
const api = axios.create({
  baseURL: '/api/geo',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error.response?.data || { error: 'Network error' });
  }
);

// GEO内容优化
export const optimizeContent = async (request: OptimizationRequest): Promise<ApiResponse<OptimizationResponse>> => {
  return await api.post('/optimize', request);
};

// 优化并保存记录
export const optimizeAndSave = async (request: OptimizeAndSaveRequest): Promise<ApiResponse<OptimizeAndSaveResponse>> => {
  return await api.post('/optimize-and-save', request);
};

// 平台初始化
export const initializePlatform = async (platformType: PlatformType): Promise<ApiResponse> => {
  return await api.post(`/platform/${platformType}/initialize`);
};

// 平台登录
export const loginToPlatform = async (platformType: PlatformType): Promise<ApiResponse> => {
  return await api.post(`/platform/${platformType}/login`);
};

// 检查平台登录状态
export const checkPlatformStatus = async (platformType: PlatformType): Promise<ApiResponse> => {
  return await api.get(`/platform/${platformType}/status`);
};

// 确认登录完成并保存状态
export const confirmLogin = async (platformType: PlatformType): Promise<ApiResponse> => {
  return await api.post(`/platform/${platformType}/confirm-login`);
};

// 发布到平台
export const publishToPlatform = async (platformType: PlatformType, request: PublishRequest): Promise<ApiResponse<PublishResponse>> => {
  return await api.post(`/platform/${platformType}/publish`, request);
};

// 批量发布
export const batchPublish = async (request: BatchPublishRequest): Promise<ApiResponse<BatchPublishResponse>> => {
  return await api.post('/batch-publish', request);
};

// 测试批量发布（无需登录状态）
export const testBatchPublish = async (request: BatchPublishRequest): Promise<ApiResponse<BatchPublishResponse>> => {
  return await api.post('/test-batch-publish', request);
};

// 健康检查
export const healthCheck = async (): Promise<ApiResponse<HealthResponse>> => {
  return await api.get('/health');
};

// 获取内容历史记录（假设后端有这个接口）
export const getContentHistory = async (): Promise<ApiResponse<ContentRecord[]>> => {
  // 注意：这个接口在后端可能不存在，需要后端支持
  return await api.get('/content/history');
};

// 获取优化历史记录列表
export const getOptimizationRecords = async (): Promise<ApiResponse<OptimizationRecord[]>> => {
  return await api.get('/optimization-records');
};

// 根据ID获取优化记录详情
export const getOptimizationRecord = async (optimizationId: string): Promise<ApiResponse<OptimizationRecord>> => {
  return await api.get(`/optimization/${optimizationId}`);
};

// 搜索优化记录
export const searchOptimizationRecords = async (keyword: string): Promise<ApiResponse<OptimizationRecord[]>> => {
  return await api.get('/optimization-search', {
    params: { keyword }
  });
};

// 根据ID获取内容记录（假设后端有这个接口）
export const getContentById = async (id: number): Promise<ApiResponse<ContentRecord>> => {
  // 注意：这个接口在后端可能不存在，需要后端支持
  return await api.get(`/content/${id}`);
};

export default api;