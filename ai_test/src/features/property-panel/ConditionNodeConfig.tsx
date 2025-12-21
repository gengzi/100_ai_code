import { Flow, FlowNode } from "../../types/flow";
import { getEdgeTarget } from "../../utils/flow";

interface ConditionNodeConfigProps {
  node: FlowNode;
  flow: Flow;
  onUpdateNode: (node: FlowNode) => void;
  onUpdateEdges: (sourceId: string, condition: "success" | "failure", target: string | null) => void;
}

const ConditionNodeConfig = ({ node, flow, onUpdateNode, onUpdateEdges }: ConditionNodeConfigProps) => {
  if (node.type !== "condition") {
    return null;
  }

  return (
    <>
      <div>
        <label>条件表达式</label>
        <input
          className="input"
          placeholder="{{status}} === 'ok'"
          value={node.config.expression}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...node.config, expression: event.target.value },
            })
          }
        />
        <div className="helper">
          支持变量 + JS 表达式，例如 {"{{status}}"} === "ok"。
        </div>
      </div>
      <div className="stack">
        <label>分支配置</label>
        <div className="row">
          <span style={{ minWidth: "70px" }}>满足</span>
          <select
            className="select"
            value={getEdgeTarget(flow.edges, node.id, "success") ?? ""}
            onChange={(event) => onUpdateEdges(node.id, "success", event.target.value || null)}
          >
            <option value="">结束</option>
            {flow.nodes
              .filter((candidate) => candidate.id !== node.id)
              .map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
          </select>
        </div>
        <div className="row">
          <span style={{ minWidth: "70px" }}>不满足</span>
          <select
            className="select"
            value={getEdgeTarget(flow.edges, node.id, "failure") ?? ""}
            onChange={(event) => onUpdateEdges(node.id, "failure", event.target.value || null)}
          >
            <option value="">结束</option>
            {flow.nodes
              .filter((candidate) => candidate.id !== node.id)
              .map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
          </select>
        </div>
      </div>
    </>
  );
};

export default ConditionNodeConfig;
