import type { Dispatch, SetStateAction } from "react";
import { Flow, FlowNode } from "../../types/flow";
import FlowInfoPanel from "./FlowInfoPanel";
import NodeConfigPanel from "./NodeConfigPanel";
import { useFlowEditor } from "./useFlowEditor";

interface PropertyPanelProps {
  flow: Flow;
  selectedNode: FlowNode | null;
  onUpdateFlow: Dispatch<SetStateAction<Flow>>;
  onRemoveNode: (nodeId: string) => void;
  availableFlows: Flow[];
}

const PropertyPanel = ({
  flow,
  selectedNode,
  onUpdateFlow,
  onRemoveNode,
  availableFlows
}: PropertyPanelProps) => {
  const {
    updateFlowMeta,
    updateVariables,
    updateGlobalHeaders,
    updateGlobalParams,
    updateNode,
    updateEdges
  } = useFlowEditor(onUpdateFlow);

  return (
    <div className="stack">
      <FlowInfoPanel
        flow={flow}
        onUpdateMeta={updateFlowMeta}
        onUpdateVariables={updateVariables}
        onUpdateGlobalHeaders={updateGlobalHeaders}
        onUpdateGlobalParams={updateGlobalParams}
      />
      <NodeConfigPanel
        flow={flow}
        selectedNode={selectedNode}
        availableFlows={availableFlows}
        onUpdateNode={updateNode}
        onUpdateEdges={updateEdges}
        onRemoveNode={onRemoveNode}
      />
    </div>
  );
};

export default PropertyPanel;
