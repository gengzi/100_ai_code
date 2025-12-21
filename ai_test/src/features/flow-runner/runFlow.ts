import { Flow, FlowNode, RunLogEntry } from "../../types/flow";
import { applyHeaders, appendQueryParams, getEdgeTarget, replaceVariables } from "../../utils/flow";
import { createResponsePreview } from "../../utils/preview";

interface RunFlowOptions {
  onLog?: ((entry: RunLogEntry) => void) | undefined;
  flowResolver?: ((id: string) => Flow | null) | undefined;
  initialVariables?: Flow["variables"] | undefined;
}

const getPathValue = (input: unknown, path: string): unknown => {
  if (!path) {
    return undefined;
  }
  const tokens = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
  let current: unknown = input;
  for (const token of tokens) {
    if (current && typeof current === "object" && token in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[token];
    } else {
      return undefined;
    }
  }
  return current;
};

const upsertVariable = (variables: Flow["variables"], key: string, value: string): Flow["variables"] => {
  if (!key) {
    return variables;
  }
  const index = variables.findIndex((item) => item.key === key);
  if (index >= 0) {
    return variables.map((item, idx) => (idx === index ? { ...item, value } : item));
  }
  return [...variables, { key, value }];
};

const mergeVariables = (
  base: Flow["variables"],
  override: Flow["variables"]
): Flow["variables"] => {
  const map = new Map(base.map((item) => [item.key, item.value]));
  override.forEach((item) => {
    if (!item.key) {
      return;
    }
    map.set(item.key, item.value);
  });
  return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
};

const evaluateExpression = (expression: string, variables: Flow["variables"]): boolean => {
  if (!expression.trim()) {
    return false;
  }
  const interpolated = expression.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_match, key) => {
    const hit = variables.find((item) => item.key === key);
    return hit ? JSON.stringify(hit.value) : "undefined";
  });
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${interpolated});`)();
    return Boolean(result);
  } catch {
    return false;
  }
};

const buildRequestInit = (node: FlowNode, flow: Flow, runtimeVariables: Flow["variables"]): RequestInit => {
  if (node.type !== "http") {
    return { method: "GET" };
  }
  const headers = new Headers();
  applyHeaders(headers, flow.globalHeaders, runtimeVariables);
  applyHeaders(headers, node.config.headers, runtimeVariables);
  if (node.config.authToken) {
    headers.set("Authorization", `Bearer ${replaceVariables(node.config.authToken, runtimeVariables)}`);
  }

  const init: RequestInit = {
    method: node.config.method,
    headers,
  };

  if (node.config.method !== "GET" && node.config.body) {
    const bodyContent = replaceVariables(node.config.body, runtimeVariables);
    try {
      const jsonValue = JSON.stringify(JSON.parse(bodyContent));
      headers.set("Content-Type", "application/json");
      init.body = jsonValue;
    } catch {
      init.body = bodyContent;
    }
  }

  return init;
};

const executeHttpNode = async (
  flow: Flow,
  node: FlowNode,
  runtimeVariables: Flow["variables"]
): Promise<{ log: RunLogEntry; nextVariables: Flow["variables"] }> => {
  if (node.type !== "http") {
    return {
      log: {
        id: crypto.randomUUID(),
        nodeId: node.id,
        nodeName: node.name,
        status: "skipped",
        startedAt: new Date().toISOString(),
      },
      nextVariables: runtimeVariables,
    };
  }

  const startedAt = new Date().toISOString();
  const startTime = performance.now();
  const requestUrl = appendQueryParams(
    replaceVariables(node.config.url, runtimeVariables),
    flow.globalParams,
    runtimeVariables
  );
  const timeoutMs = node.config.timeoutMs ?? flow.runConfig.timeoutMs;
  const retries = node.config.retries ?? flow.runConfig.retries;

  if (!requestUrl) {
    return {
      log: {
        id: crypto.randomUUID(),
        nodeId: node.id,
        nodeName: node.name,
        status: "failure",
        durationMs: 0,
        error: "缺少请求地址",
        startedAt,
      },
      nextVariables: runtimeVariables,
    };
  }

  const runAttempt = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(requestUrl, {
        ...buildRequestInit(node, flow, runtimeVariables),
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  };

  let response: Response | null = null;
  let errorMessage: string | undefined;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      response = await runAttempt();
      errorMessage = undefined;
      break;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "请求失败";
      if (attempt === retries) {
        break;
      }
    }
  }

  const durationMs = Math.round(performance.now() - startTime);

  if (!response) {
    return {
      log: {
        id: crypto.randomUUID(),
        nodeId: node.id,
        nodeName: node.name,
        status: "failure",
        durationMs,
        error: errorMessage ?? "请求失败",
        startedAt,
      },
      nextVariables: runtimeVariables,
    };
  }

  const text = await response.text();
  const preview = createResponsePreview(text);
  let jsonBody: unknown = null;
  try {
    jsonBody = JSON.parse(text);
  } catch {
    jsonBody = null;
  }

  const expected = node.config.assertStatus;
  const statusOk = expected.length === 0 || expected.includes(response.status);
  const success = response.ok && statusOk;

  let nextVariables = runtimeVariables;
  if (jsonBody && node.config.outputMappings.length > 0) {
    node.config.outputMappings.forEach((mapping) => {
      const rawValue = getPathValue(jsonBody, mapping.sourcePath);
      if (rawValue === undefined) {
        return;
      }
      const nextValue = typeof rawValue === "string" ? rawValue : JSON.stringify(rawValue);
      nextVariables = upsertVariable(nextVariables, mapping.targetKey, nextValue);
    });
  }

  return {
    log: {
      id: crypto.randomUUID(),
      nodeId: node.id,
      nodeName: node.name,
      status: success ? "success" : "failure",
      httpStatus: response.status,
      durationMs,
      responsePreview: preview,
      error: success ? undefined : "断言失败或响应异常",
      startedAt,
    },
    nextVariables,
  };
};

export const runFlow = async (
  flow: Flow,
  options: RunFlowOptions = {}
): Promise<{ logs: RunLogEntry[]; variables: Flow["variables"] }> => {
  const logs: RunLogEntry[] = [];

  if (!flow || !flow.nodes || !Array.isArray(flow.nodes)) {
    const errorLog: RunLogEntry = {
      id: crypto.randomUUID(),
      nodeId: "flow",
      nodeName: "流程校验",
      status: "failure",
      startedAt: new Date().toISOString(),
      error: "流程数据无效或节点不存在",
    };
    logs.push(errorLog);
    options.onLog?.(errorLog);
    return { logs, variables: options.initialVariables ?? [] };
  }

  if (flow.nodes.length === 0) {
    const errorLog: RunLogEntry = {
      id: crypto.randomUUID(),
      nodeId: "flow",
      nodeName: "流程校验",
      status: "failure",
      startedAt: new Date().toISOString(),
      error: "流程中没有任何节点",
    };
    logs.push(errorLog);
    options.onLog?.(errorLog);
    return { logs, variables: options.initialVariables ?? [] };
  }

  const nodeMap = new Map(flow.nodes.map((node) => [node.id, node]));
  const maxSteps = flow.nodes.length + flow.edges.length + 12;

  const runFromNode = async (
    nodeId: string | null,
    runtimeVariables: Flow["variables"],
    guard: { count: number }
  ): Promise<Flow["variables"]> => {
    let currentId = nodeId;
    let currentVars = runtimeVariables;

    while (currentId && guard.count < maxSteps) {
      guard.count += 1;
      const node = nodeMap.get(currentId);
      if (!node) {
        break;
      }

      if (node.type === "http") {
        const result = await executeHttpNode(flow, node, currentVars);
        currentVars = result.nextVariables;
        logs.push(result.log);
        options.onLog?.(result.log);

        if (result.log.status === "failure" && flow.runConfig.scenario === "success") {
          break;
        }

        const condition = result.log.status === "success" ? "success" : "failure";
        currentId = getEdgeTarget(flow.edges, node.id, condition);
        continue;
      }

      if (node.type === "condition") {
        const passed = evaluateExpression(node.config.expression, currentVars);
        const log: RunLogEntry = {
          id: crypto.randomUUID(),
          nodeId: node.id,
          nodeName: node.name,
          status: passed ? "success" : "failure",
          startedAt: new Date().toISOString(),
          error: passed ? undefined : "条件不满足",
        };
        logs.push(log);
        options.onLog?.(log);
        currentId = getEdgeTarget(flow.edges, node.id, passed ? "success" : "failure");
        continue;
      }

      if (node.type === "parallel") {
        const targets = flow.edges
          .filter((edge) => edge.source === node.id && edge.condition === "success")
          .map((edge) => edge.target);
        for (const target of targets) {
          currentVars = await runFromNode(target, currentVars, guard);
        }
        currentId = null;
        continue;
      }

      if (node.type === "merge") {
        currentId = getEdgeTarget(flow.edges, node.id, "success");
        continue;
      }

      if (node.type === "subflow") {
        const subflow = node.config.flowId ? options.flowResolver?.(node.config.flowId) : null;
        if (subflow) {
          const result = await runFlow(subflow, {
            onLog: options.onLog,
            flowResolver: options.flowResolver,
            initialVariables: currentVars,
          });
          logs.push(...result.logs);
          currentVars = result.variables;
        } else {
          const log: RunLogEntry = {
            id: crypto.randomUUID(),
            nodeId: node.id,
            nodeName: node.name,
            status: "failure",
            startedAt: new Date().toISOString(),
            error: "子流程未找到",
          };
          logs.push(log);
          options.onLog?.(log);
        }
        currentId = getEdgeTarget(flow.edges, node.id, "success");
        continue;
      }

      if (node.type === "group" || node.type === "lane") {
        currentId = getEdgeTarget(flow.edges, node.id, "success");
        continue;
      }

      currentId = null;
    }

    return currentVars;
  };

  const initialVars = mergeVariables(flow.variables, options.initialVariables ?? []);
  const guard = { count: 0 };
  const finalVars = await runFromNode(flow.nodes[0]?.id ?? null, initialVars, guard);
  return { logs, variables: finalVars };
};
