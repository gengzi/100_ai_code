export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type EdgeCondition = "success" | "failure";

export type FlowNodeType =
  | "http"
  | "condition"
  | "parallel"
  | "merge"
  | "subflow"
  | "group"
  | "lane";

export interface FlowVariable {
  key: string;
  value: string;
}

export interface KeyValue {
  id: string;
  key: string;
  value: string;
}

export interface FlowRunConfig {
  scenario: "success" | "failure" | "all";
  timeoutMs: number;
  retries: number;
}

export interface HttpHeader {
  id: string;
  key: string;
  value: string;
}

export interface OutputMapping {
  id: string;
  sourcePath: string;
  targetKey: string;
}

export interface HttpNodeConfig {
  method: HttpMethod;
  url: string;
  headers: HttpHeader[];
  body: string;
  authToken: string;
  timeoutMs?: number | undefined;
  retries?: number | undefined;
  assertStatus: number[];
  outputMappings: OutputMapping[];
}

export interface ConditionNodeConfig {
  expression: string;
}

export interface ParallelNodeConfig {
  mode: "all" | "any";
}

export interface MergeNodeConfig {
  mode: "all" | "any";
}

export interface SubflowNodeConfig {
  flowId: string | null | undefined;
}

export interface GroupNodeConfig {
  title: string;
  width: number;
  height: number;
}

export interface LaneNodeConfig {
  title: string;
  width: number;
  height: number;
  color: string;
}

export interface BaseFlowNode {
  id: string;
  type: FlowNodeType;
  name: string;
  position: { x: number; y: number };
  parentId?: string | undefined;
}

export type FlowNode =
  | (BaseFlowNode & { type: "http"; config: HttpNodeConfig })
  | (BaseFlowNode & { type: "condition"; config: ConditionNodeConfig })
  | (BaseFlowNode & { type: "parallel"; config: ParallelNodeConfig })
  | (BaseFlowNode & { type: "merge"; config: MergeNodeConfig })
  | (BaseFlowNode & { type: "subflow"; config: SubflowNodeConfig })
  | (BaseFlowNode & { type: "group"; config: GroupNodeConfig })
  | (BaseFlowNode & { type: "lane"; config: LaneNodeConfig });

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  condition: EdgeCondition;
}

export interface Flow {
  id: string;
  name: string;
  description: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  variables: FlowVariable[];
  globalHeaders: HttpHeader[];
  globalParams: KeyValue[];
  runConfig: FlowRunConfig;
}

export interface RunLogEntry {
  id: string;
  nodeId: string;
  nodeName: string;
  status: "success" | "failure" | "skipped";
  httpStatus?: number;
  durationMs?: number;
  error?: string | undefined;
  responsePreview?: string | undefined;
  startedAt: string;
}