import { Flow, FlowNode } from "../../types/flow";
import { getEdgeTarget } from "../../utils/flow";

interface ContainerNodeConfigProps {
  node: FlowNode;
  flow: Flow;
  availableFlows?: Flow[];
  onUpdateNode: (node: FlowNode) => void;
  onUpdateEdges: (sourceId: string, condition: "success" | "failure", target: string | null) => void;
}

const ParallelNodeConfig = ({ node, flow, onUpdateNode, onUpdateEdges }: ContainerNodeConfigProps) => {
  if (node.type !== "parallel") {
    return null;
  }

  return (
    <>
      <div className="row">
        <label style={{ minWidth: "80px" }}>并行模式</label>
        <select
          className="select"
          value={node.config.mode}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...node.config, mode: event.target.value as "all" | "any" },
            })
          }
        >
          <option value="all">等待所有分支</option>
          <option value="any">任一分支完成</option>
        </select>
      </div>
      <div className="stack">
        <label>分支配置</label>
        <div className="row">
          <span style={{ minWidth: "70px" }}>出口</span>
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
      </div>
    </>
  );
};

const MergeNodeConfig = ({ node, flow, onUpdateNode, onUpdateEdges }: ContainerNodeConfigProps) => {
  if (node.type !== "merge") {
    return null;
  }

  return (
    <>
      <div className="row">
        <label style={{ minWidth: "80px" }}>汇聚模式</label>
        <select
          className="select"
          value={node.config.mode}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...node.config, mode: event.target.value as "all" | "any" },
            })
          }
        >
          <option value="all">等待所有分支</option>
          <option value="any">任一分支到达</option>
        </select>
      </div>
      <div className="stack">
        <label>分支配置</label>
        <div className="row">
          <span style={{ minWidth: "70px" }}>出口</span>
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
      </div>
    </>
  );
};

const SubflowNodeConfig = ({
  node,
  flow,
  availableFlows,
  onUpdateNode,
  onUpdateEdges,
}: ContainerNodeConfigProps) => {
  if (node.type !== "subflow") {
    return null;
  }

  return (
    <>
      <div className="row">
        <label style={{ minWidth: "80px" }}>子流程</label>
        <select
          className="select"
          value={node.config.flowId ?? ""}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...node.config, flowId: event.target.value || null },
            })
          }
        >
          <option value="">未选择</option>
          {(availableFlows || [])
            .filter((item) => item.id !== flow.id)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
      </div>
      <div className="stack">
        <label>分支配置</label>
        <div className="row">
          <span style={{ minWidth: "70px" }}>出口</span>
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
      </div>
    </>
  );
};

const GroupNodeConfig = ({ node, onUpdateNode }: { node: FlowNode; onUpdateNode: (node: FlowNode) => void }) => {
  if (node.type !== "group") {
    return null;
  }

  return (
    <>
      <div className="row">
        <label style={{ minWidth: "60px" }}>标题</label>
        <input
          className="input"
          value={node.config.title}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...node.config, title: event.target.value },
            })
          }
        />
      </div>
      <div className="row">
        <label style={{ minWidth: "60px" }}>宽度</label>
        <input
          className="input"
          type="number"
          value={node.config.width}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...node.config, width: Number(event.target.value) },
            })
          }
        />
      </div>
      <div className="row">
        <label style={{ minWidth: "60px" }}>高度</label>
        <input
          className="input"
          type="number"
          value={node.config.height}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...node.config, height: Number(event.target.value) },
            })
          }
        />
      </div>
    </>
  );
};

const LaneNodeConfig = ({ node, onUpdateNode }: { node: FlowNode; onUpdateNode: (node: FlowNode) => void }) => {
  if (node.type !== "lane") {
    return null;
  }

  const laneConfig = node.config;
  return (
    <>
      <div className="row">
        <label style={{ minWidth: "60px" }}>标题</label>
        <input
          className="input"
          value={laneConfig.title}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...laneConfig, title: event.target.value },
            })
          }
        />
      </div>
      <div className="row">
        <label style={{ minWidth: "60px" }}>宽度</label>
        <input
          className="input"
          type="number"
          value={laneConfig.width}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...laneConfig, width: Number(event.target.value) },
            })
          }
        />
      </div>
      <div className="row">
        <label style={{ minWidth: "60px" }}>高度</label>
        <input
          className="input"
          type="number"
          value={laneConfig.height}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...laneConfig, height: Number(event.target.value) },
            })
          }
        />
      </div>
      <div className="row">
        <label style={{ minWidth: "60px" }}>颜色</label>
        <input
          className="input"
          value={laneConfig.color}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...laneConfig, color: event.target.value },
            })
          }
        />
      </div>
    </>
  );
};

export { ParallelNodeConfig, MergeNodeConfig, SubflowNodeConfig, GroupNodeConfig, LaneNodeConfig };
