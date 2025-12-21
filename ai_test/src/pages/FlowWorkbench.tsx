import { useMemo, useState } from "react";
import "reactflow/dist/style.css";
import SectionCard from "../components/SectionCard";
import Canvas from "../features/canvas/Canvas";
import NodeLibrary from "../features/node-library/NodeLibrary";
import ExportPanel from "../features/flow-export/ExportPanel";
import PropertyPanel from "../features/property-panel/PropertyPanel";
import RunnerPanel from "../features/flow-runner/RunnerPanel";
import { runFlow } from "../features/flow-runner/runFlow";
import { createEmptyFlow, createFlowNode, normalizeFlow } from "../utils/flow";
import { FlowNodeType, RunLogEntry } from "../types/flow";

const NODE_NAME_MAP: Record<FlowNodeType, string> = {
  http: "HTTP 请求",
  condition: "条件判断",
  parallel: "并行网关",
  merge: "汇聚网关",
  subflow: "子流程",
  group: "分组",
  lane: "泳道",
};

const FlowWorkbench = () => {
  const [flow, setFlow] = useState(() => createEmptyFlow());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [logs, setLogs] = useState<RunLogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const selectedNode = useMemo(
    () => flow.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [flow.nodes, selectedNodeId]
  );

  const addNode = (type: FlowNodeType) => {
    setFlow((prev) => {
      const offset = prev.nodes.length * 30;
      const position = { x: 120 + offset, y: 120 + offset };
      const name = NODE_NAME_MAP[type] ?? "新节点";
      return {
        ...prev,
        nodes: [...prev.nodes, createFlowNode(type, name, position)],
      };
    });
  };

  const removeNode = (nodeId: string) => {
    setFlow((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((node) => node.id !== nodeId),
      edges: prev.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    }));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleExport = () => {
    const content = JSON.stringify(flow, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${flow.name || "flow"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        const next = normalizeFlow(raw);
        setFlow(next);
        setSelectedNodeId(null);
      } catch {
        window.alert("导入失败：请确认 JSON 格式是否正确。");
      }
    };
    reader.readAsText(file);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setLogs([]);
    try {
      await runFlow(flow, {
        onLog: (entry) => setLogs((prev) => [...prev, entry]),
      });
    } finally {
      setIsRunning(false);
    }
  };

  const availableFlows = [flow];

  return (
    <div className="stack">
      <div className="main-grid">
        <div className="stack">
          <NodeLibrary onAddNode={addNode} />
          <ExportPanel onExport={handleExport} onImport={handleImport} />
        </div>

        <SectionCard
          title="流程画布"
          badge={`${flow.nodes.length} 个节点`}
          actions={
            <span className="helper">
              选中节点后在右侧配置，拖拽连线建立流程
            </span>
          }
        >
          <Canvas
            nodes={flow.nodes}
            edges={flow.edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onUpdateFlow={setFlow}
          />
        </SectionCard>

        <PropertyPanel
          flow={flow}
          selectedNode={selectedNode}
          onUpdateFlow={setFlow}
          onRemoveNode={removeNode}
          availableFlows={availableFlows}
        />
      </div>

      <div className="bottom-grid">
        <RunnerPanel
          runConfig={flow.runConfig}
          logs={logs}
          isRunning={isRunning}
          onRun={handleRun}
          onUpdateRunConfig={(next) => setFlow((prev) => ({ ...prev, runConfig: next }))}
        />
      </div>
    </div>
  );
};

export default FlowWorkbench;
