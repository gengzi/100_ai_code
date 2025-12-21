import { FlowNodeType } from "../../types/flow";
import SectionCard from "../../components/SectionCard";

interface NodeLibraryProps {
  onAddNode: (type: FlowNodeType) => void;
}

const NodeLibrary = ({ onAddNode }: NodeLibraryProps) => {
  return (
    <SectionCard title="节点库" badge="点击添加">
      <div className="stack">
        <button className="button" onClick={() => onAddNode("http")} type="button">
          HTTP 请求节点
        </button>
        <button className="button" onClick={() => onAddNode("condition")} type="button">
          条件判断节点
        </button>
        <button className="button" onClick={() => onAddNode("parallel")} type="button">
          并行网关
        </button>
        <button className="button" onClick={() => onAddNode("merge")} type="button">
          汇聚网关
        </button>
        <button className="button" onClick={() => onAddNode("subflow")} type="button">
          子流程节点
        </button>
        <button className="button" onClick={() => onAddNode("group")} type="button">
          分组容器
        </button>
        <button className="button" onClick={() => onAddNode("lane")} type="button">
          泳道容器
        </button>
        <p className="helper">后续可扩展脚本、断言、延迟等节点。</p>
      </div>
    </SectionCard>
  );
};

export default NodeLibrary;
