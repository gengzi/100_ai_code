export const APP_CONFIG = {
  name: 'AI接口联调平台',
  version: '1.0.0',
  description: '可视化接口配置与流程编排平台',
} as const;

export const STORAGE_KEYS = {
  FLOW_LIST_STATE: 'flow-list-state',
  SELECTED_FLOW: 'selected-flow',
  USER_PREFERENCES: 'user-preferences',
} as const;

export const API_CONFIG = {
  timeout: 30000,
  retries: 3,
} as const;

export const CANVAS_CONFIG = {
  gridSize: 20,
  defaultNodeWidth: 180,
  defaultNodeHeight: 80,
  defaultPortRadius: 8,
  defaultArrowSize: 8,
} as const;