import { memo, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Position,
  Handle,
  MarkerType,
  Connection,
  EdgeChange,
  Node,
  NodeChange,
  NodeProps,
  OnNodesChange,
  OnEdgesChange,
} from "reactflow";
import { Flow, FlowEdge, FlowNode } from "../../types/flow";
import { upsertEdge } from "../../utils/flow";

interface CanvasProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onUpdateFlow: React.Dispatch<React.SetStateAction<Flow>>;
}

const NODE_TYPE_LABEL: Record<FlowNode["type"], string> = {
  http: "HTTP",
  condition: "条件",
  parallel: "并行",
  merge: "汇聚",
  subflow: "子流程",
  group: "分组",
  lane: "泳道",
};

const FlowNodeCard = memo(({ data, selected }: NodeProps<{ node: FlowNode }>) => {
  const node = data.node;
  const hasFailure = node.type === "http" || node.type === "condition";

  return (
    <div className={`node-card ${selected ? "selected" : ""}`}>
      <Handle type="target" position={Position.Left} id="input" className="flow-handle" />
      <div className="title">{node.name}</div>
      <div className="meta">类型：{NODE_TYPE_LABEL[node.type]}</div>
      <div className="node-ports">
        <span>{hasFailure ? "成功 / 失败" : "出口"}</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="success"
        className="flow-handle success"
      />
      {hasFailure ? (
        <Handle
          type="source"
          position={Position.Right}
          id="failure"
          className="flow-handle failure"
          style={{ top: "70%" }}
        />
      ) : null}
    </div>
  );
});

const nodeTypes = { flowNode: FlowNodeCard };

const Canvas = ({ nodes, edges, selectedNodeId, onSelectNode, onUpdateFlow }: CanvasProps) => {
  const rfNodes: Node[] = useMemo(
    () =>
      nodes.map((node) => ({
        id: node.id,
        type: "flowNode",
        position: node.position ?? { x: 120, y: 80 },
        data: { node },
        selected: node.id === selectedNodeId,
      })),
    [nodes, selectedNodeId]
  );

  const rfEdges = useMemo(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.condition === "failure" ? "failure" : "success",
        type: "smoothstep",
        label: edge.condition === "failure" ? "失败" : "成功",
        markerEnd: { type: MarkerType.ArrowClosed },
      })),
    [edges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }
      const condition = connection.sourceHandle === "failure" ? "failure" : "success";
      onUpdateFlow((prev) => ({
        ...prev,
        edges: upsertEdge(prev.edges, connection.source!, condition, connection.target),
      }));
    },
    [onUpdateFlow]
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const positionChanges = changes.filter((change) => change.type === "position");
      if (positionChanges.length === 0) {
        return;
      }
      onUpdateFlow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((node) => {
          const hit = positionChanges.find((item) => item.id === node.id);
          if (!hit || !("position" in hit) || !hit.position) {
            return node;
          }
          return { ...node, position: hit.position };
        }),
      }));
    },
    [onUpdateFlow]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const removed = new Set(changes.filter((c) => c.type === "remove").map((c) => c.id));
      if (removed.size === 0) {
        return;
      }
      onUpdateFlow((prev) => ({
        ...prev,
        edges: prev.edges.filter((edge) => !removed.has(edge.id)),
      }));
    },
    [onUpdateFlow]
  );

  return (
    <div className="canvas-wrap">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_event, node) => onSelectNode(node.id)}
        onPaneClick={() => onSelectNode(null)}
        fitView
      >
        <Background gap={18} size={1} color="#e0e0e0" />
        <MiniMap pannable zoomable />
        <Controls position="bottom-right" />
      </ReactFlow>
      {nodes.length === 0 ? (
        <div className="canvas-empty">
          <div className="canvas-empty-title">画布为空</div>
          <div className="helper">点击左侧“HTTP 请求节点”开始搭建流程。</div>
        </div>
      ) : null}
    </div>
  );
};

export default memo(Canvas);
