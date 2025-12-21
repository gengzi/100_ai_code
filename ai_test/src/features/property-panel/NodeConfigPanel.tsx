import { Flow, FlowNode } from "../../types/flow";
import SectionCard from "../../components/SectionCard";
import HttpNodeConfig from "./HttpNodeConfig";
import ConditionNodeConfig from "./ConditionNodeConfig";
import {
  ParallelNodeConfig,
  MergeNodeConfig,
  SubflowNodeConfig,
  GroupNodeConfig,
  LaneNodeConfig,
} from "./ContainerNodeConfig";

interface NodeConfigPanelProps {
  flow: Flow;
  selectedNode: FlowNode | null;
  availableFlows: Flow[];
  onUpdateNode: (node: FlowNode) => void;
  onUpdateEdges: (sourceId: string, condition: "success" | "failure", target: string | null) => void;
  onRemoveNode: (nodeId: string) => void;
}

const parentCandidates = (flow: Flow) =>
  flow.nodes.filter((node) => node.type === "group" || node.type === "lane");

const NodeConfigPanel = ({
  flow,
  selectedNode,
  availableFlows,
  onUpdateNode,
  onUpdateEdges,
  onRemoveNode,
}: NodeConfigPanelProps) => {
  const updateNodeName = (value: string) => {
    if (!selectedNode) {
      return;
    }
    onUpdateNode({ ...selectedNode, name: value });
  };

  const renderParentPicker = (node: FlowNode) => {
    const candidates = parentCandidates(flow);
    if (!candidates.length || node.type === "group" || node.type === "lane") {
      return null;
    }
    return (
      <div className="row">
        <label style={{ minWidth: "60px" }}>父容器</label>
        <select
          className="select"
          value={node.parentId ?? ""}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              parentId: event.target.value || undefined,
            })
          }
        >
          <option value="">未设置</option>
          {candidates.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <SectionCard title="节点配置" badge={selectedNode ? selectedNode.type : "未选择"}>
      {selectedNode ? (
        <div className="stack">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row" style={{ flex: 1 }}>
              <label style={{ minWidth: "60px" }}>名称</label>
              <input
                className="input"
                value={selectedNode.name}
                onChange={(event) => updateNodeName(event.target.value)}
              />
            </div>
            <button className="button ghost" type="button" onClick={() => onRemoveNode(selectedNode.id)}>
              删除节点
            </button>
          </div>
          {renderParentPicker(selectedNode)}
          <HttpNodeConfig node={selectedNode} flow={flow} onUpdateNode={onUpdateNode} onUpdateEdges={onUpdateEdges} />
          <ConditionNodeConfig
            node={selectedNode}
            flow={flow}
            onUpdateNode={onUpdateNode}
            onUpdateEdges={onUpdateEdges}
          />
          <ParallelNodeConfig node={selectedNode} flow={flow} onUpdateNode={onUpdateNode} onUpdateEdges={onUpdateEdges} />
          <MergeNodeConfig node={selectedNode} flow={flow} onUpdateNode={onUpdateNode} onUpdateEdges={onUpdateEdges} />
          <SubflowNodeConfig
            node={selectedNode}
            flow={flow}
            availableFlows={availableFlows}
            onUpdateNode={onUpdateNode}
            onUpdateEdges={onUpdateEdges}
          />
          <GroupNodeConfig node={selectedNode} onUpdateNode={onUpdateNode} />
          <LaneNodeConfig node={selectedNode} onUpdateNode={onUpdateNode} />
        </div>
      ) : (
        <div className="helper">请在画布中选中节点以编辑配置。</div>
      )}
    </SectionCard>
  );
};

export default NodeConfigPanel;
