export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface PerformanceChartPoint {
  gpuName: string;
  memoryUsage: number;
  performance: number;
  cost?: number;
}

export type SortDirection = 'asc' | 'desc';
export type FilterOption = {
  label: string;
  value: string;
};

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

// 环境变量类型
export interface EnvConfig {
  VITE_API_BASE_URL?: string;
  VITE_ENABLE_ANALYTICS?: string;
  VITE_DEFAULT_LANGUAGE?: string;
}