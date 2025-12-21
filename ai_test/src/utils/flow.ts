import {
  Flow,
  FlowEdge,
  FlowNode,
  FlowNodeType,
  FlowRunConfig,
  HttpNodeConfig,
  ConditionNodeConfig,
  MergeNodeConfig,
  ParallelNodeConfig,
  SubflowNodeConfig,
  GroupNodeConfig,
  LaneNodeConfig,
} from "../types/flow";

export const DEFAULT_RUN_CONFIG: FlowRunConfig = {
  scenario: "all",
  timeoutMs: 8000,
  retries: 0,
};

export const createDefaultHttpConfig = (): HttpNodeConfig => ({
  method: "GET",
  url: "",
  headers: [],
  body: "",
  authToken: "",
  assertStatus: [200],
  outputMappings: [],
});

export const createDefaultConditionConfig = (): ConditionNodeConfig => ({
  expression: "",
});

export const createDefaultParallelConfig = (): ParallelNodeConfig => ({
  mode: "all",
});

export const createDefaultMergeConfig = (): MergeNodeConfig => ({
  mode: "all",
});

export const createDefaultSubflowConfig = (): SubflowNodeConfig => ({
  flowId: null,
});

export const createDefaultGroupConfig = (): GroupNodeConfig => ({
  title: "分组",
  width: 360,
  height: 240,
});

export const createDefaultLaneConfig = (): LaneNodeConfig => ({
  title: "泳道",
  width: 540,
  height: 180,
  color: "#f8fafc",
});

export const createDefaultConfigForType = (type: FlowNodeType): FlowNode["config"] => {
  switch (type) {
    case "condition":
      return createDefaultConditionConfig();
    case "parallel":
      return createDefaultParallelConfig();
    case "merge":
      return createDefaultMergeConfig();
    case "subflow":
      return createDefaultSubflowConfig();
    case "group":
      return createDefaultGroupConfig();
    case "lane":
      return createDefaultLaneConfig();
    case "http":
    default:
      return createDefaultHttpConfig();
  }
};

export const createFlowNode = (
  type: FlowNodeType,
  name: string,
  position: FlowNode["position"] = { x: 120, y: 80 }
): FlowNode => ({
  id: crypto.randomUUID(),
  type,
  name,
  position,
  config: createDefaultConfigForType(type),
}) as FlowNode;

export const createEmptyFlow = (): Flow => ({
  id: crypto.randomUUID(),
  name: "未命名流程",
  description: "",
  nodes: [],
  edges: [],
  variables: [],
  globalHeaders: [],
  globalParams: [],
  runConfig: { ...DEFAULT_RUN_CONFIG },
});

export const normalizeFlow = (input: Flow): Flow => {
  return {
    ...createEmptyFlow(),
    ...input,
    variables: input.variables ?? [],
    globalHeaders: input.globalHeaders ?? [],
    globalParams: input.globalParams ?? [],
    runConfig: { ...DEFAULT_RUN_CONFIG, ...(input.runConfig ?? {}) },
    nodes: (input.nodes ?? []).map((node) => {
      const type = node.type ?? "http";
      const base = {
        ...node,
        type,
        position: node.position ?? { x: 120, y: 80 },
      } as FlowNode;

      if (type === "http") {
        return {
          ...base,
          config: { ...createDefaultHttpConfig(), ...(node as FlowNode).config },
        } as FlowNode;
      }

      if (type === "condition") {
        return {
          ...base,
          config: { ...createDefaultConditionConfig(), ...(node as FlowNode).config },
        } as FlowNode;
      }

      if (type === "parallel") {
        return {
          ...base,
          config: { ...createDefaultParallelConfig(), ...(node as FlowNode).config },
        } as FlowNode;
      }

      if (type === "merge") {
        return {
          ...base,
          config: { ...createDefaultMergeConfig(), ...(node as FlowNode).config },
        } as FlowNode;
      }

      if (type === "subflow") {
        return {
          ...base,
          config: { ...createDefaultSubflowConfig(), ...(node as FlowNode).config },
        } as FlowNode;
      }

      if (type === "group") {
        return {
          ...base,
          config: { ...createDefaultGroupConfig(), ...(node as FlowNode).config },
        } as FlowNode;
      }

      if (type === "lane") {
        return {
          ...base,
          config: { ...createDefaultLaneConfig(), ...(node as FlowNode).config },
        } as FlowNode;
      }

      return base;
    }),
    edges: input.edges ?? [],
  };
};

export const upsertEdge = (
  edges: FlowEdge[],
  source: string,
  condition: FlowEdge["condition"],
  target: string | null
): FlowEdge[] => {
  const filtered = edges.filter(
    (edge) => !(edge.source === source && edge.condition === condition && edge.target === target)
  );
  if (!target) {
    return filtered;
  }
  return [
    ...filtered,
    {
      id: crypto.randomUUID(),
      source,
      target,
      condition,
    },
  ];
};

export const getEdgeTarget = (
  edges: FlowEdge[],
  source: string,
  condition: FlowEdge["condition"]
): string | null => {
  const hit = edges.find((edge) => edge.source === source && edge.condition === condition);
  return hit ? hit.target : null;
};

export const replaceVariables = (input: string, variables: Flow["variables"]): string => {
  if (!input) {
    return input;
  }
  return input.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_match, key) => {
    const hit = variables.find((item) => item.key === key);
    return hit ? hit.value : "";
  });
};

export const applyHeaders = (
  headers: Headers,
  items: HttpNodeConfig["headers"],
  variables: Flow["variables"]
): void => {
  items.forEach((item) => {
    if (!item.key) {
      return;
    }
    headers.set(item.key, replaceVariables(item.value, variables));
  });
};

export const appendQueryParams = (
  url: string,
  params: Flow["globalParams"],
  variables: Flow["variables"]
): string => {
  if (!params.length) {
    return url;
  }
  const hasBase = url.includes("?") ? "&" : "?";
  const serialized = params
    .filter((param) => param.key)
    .map(
      (param) =>
        `${encodeURIComponent(param.key)}=${encodeURIComponent(replaceVariables(param.value, variables))}`
    )
    .join("&");
  if (!serialized) {
    return url;
  }
  return `${url}${hasBase}${serialized}`;
};
