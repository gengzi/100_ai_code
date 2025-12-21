import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Flow, FlowNode } from "../../types/flow";
import { upsertEdge } from "../../utils/flow";

type FlowSetter = Dispatch<SetStateAction<Flow>>;

export const useFlowEditor = (setFlow: FlowSetter) => {
  const updateFlowMeta = useCallback(
    (key: "name" | "description", value: string) => {
      setFlow((prev) => ({ ...prev, [key]: value }));
    },
    [setFlow]
  );

  const updateVariables = useCallback(
    (variables: Flow["variables"]) => {
      setFlow((prev) => ({ ...prev, variables }));
    },
    [setFlow]
  );

  const updateGlobalHeaders = useCallback(
    (globalHeaders: Flow["globalHeaders"]) => {
      setFlow((prev) => ({ ...prev, globalHeaders }));
    },
    [setFlow]
  );

  const updateGlobalParams = useCallback(
    (globalParams: Flow["globalParams"]) => {
      setFlow((prev) => ({ ...prev, globalParams }));
    },
    [setFlow]
  );

  const updateNode = useCallback(
    (next: FlowNode) => {
      setFlow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) => (node.id === next.id ? next : node))
      }));
    },
    [setFlow]
  );

  const updateEdges = useCallback(
    (sourceId: string, condition: "success" | "failure", target: string | null) => {
      setFlow((prev) => ({
        ...prev,
        edges: upsertEdge(prev.edges, sourceId, condition, target)
      }));
    },
    [setFlow]
  );

  const removeNode = useCallback(
    (nodeId: string) => {
      setFlow((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((node) => node.id !== nodeId),
        edges: prev.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      }));
    },
    [setFlow]
  );

  return {
    updateFlowMeta,
    updateVariables,
    updateGlobalHeaders,
    updateGlobalParams,
    updateNode,
    updateEdges,
    removeNode
  };
};
