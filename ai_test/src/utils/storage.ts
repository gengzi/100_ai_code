import { Flow } from "../types/flow";

const STORAGE_KEY = "flow-workbench-state";

export interface FlowListState {
  flows: Flow[];
  activeFlowId: string | null;
}

export const saveFlowState = (state: FlowListState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadFlowState = (): FlowListState | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as FlowListState | Flow;
    if ("flows" in parsed) {
      return parsed as FlowListState;
    }
    return { flows: [parsed as Flow], activeFlowId: (parsed as Flow).id };
  } catch {
    return null;
  }
};