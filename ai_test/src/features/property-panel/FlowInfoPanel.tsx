import { Flow, HttpHeader, KeyValue } from "../../types/flow";
import SectionCard from "../../components/SectionCard";

interface FlowInfoPanelProps {
  flow: Flow;
  onUpdateMeta: (key: "name" | "description", value: string) => void;
  onUpdateVariables: (variables: Flow["variables"]) => void;
  onUpdateGlobalHeaders: (headers: HttpHeader[]) => void;
  onUpdateGlobalParams: (params: KeyValue[]) => void;
}

const FlowInfoPanel = ({
  flow,
  onUpdateMeta,
  onUpdateVariables,
  onUpdateGlobalHeaders,
  onUpdateGlobalParams,
}: FlowInfoPanelProps) => {
  return (
    <SectionCard title="流程信息" badge="Flow">
      <div className="stack">
        <div className="row">
          <label style={{ minWidth: "60px" }}>名称</label>
          <input
            className="input"
            value={flow.name}
            onChange={(event) => onUpdateMeta("name", event.target.value)}
          />
        </div>
        <div className="row">
          <label style={{ minWidth: "60px" }}>描述</label>
          <input
            className="input"
            value={flow.description}
            onChange={(event) => onUpdateMeta("description", event.target.value)}
          />
        </div>
        <div className="helper">变量格式：{"{{variable_key}}"}</div>
        <div className="stack">
          {flow.variables.map((item, index) => (
            <div key={`${item.key}-${index}`} className="row">
              <input
                className="input"
                placeholder="变量名"
                value={item.key}
                onChange={(event) =>
                  onUpdateVariables(
                    flow.variables.map((variable, idx) =>
                      idx === index ? { ...variable, key: event.target.value } : variable
                    )
                  )
                }
              />
              <input
                className="input"
                placeholder="变量值"
                value={item.value}
                onChange={(event) =>
                  onUpdateVariables(
                    flow.variables.map((variable, idx) =>
                      idx === index ? { ...variable, value: event.target.value } : variable
                    )
                  )
                }
              />
              <button
                className="button ghost"
                type="button"
                onClick={() => onUpdateVariables(flow.variables.filter((_variable, idx) => idx !== index))}
              >
                删除
              </button>
            </div>
          ))}
          <button
            className="button"
            type="button"
            onClick={() => onUpdateVariables([...flow.variables, { key: "", value: "" }])}
          >
            添加变量
          </button>
        </div>
        <div className="stack">
          <label>全局 Headers</label>
          {flow.globalHeaders.map((header) => (
            <div key={header.id} className="row">
              <input
                className="input"
                placeholder="Header"
                value={header.key}
                onChange={(event) =>
                  onUpdateGlobalHeaders(
                    flow.globalHeaders.map((item) =>
                      item.id === header.id ? { ...item, key: event.target.value } : item
                    )
                  )
                }
              />
              <input
                className="input"
                placeholder="Value"
                value={header.value}
                onChange={(event) =>
                  onUpdateGlobalHeaders(
                    flow.globalHeaders.map((item) =>
                      item.id === header.id ? { ...item, value: event.target.value } : item
                    )
                  )
                }
              />
              <button
                className="button ghost"
                type="button"
                onClick={() =>
                  onUpdateGlobalHeaders(flow.globalHeaders.filter((item) => item.id !== header.id))
                }
              >
                删除
              </button>
            </div>
          ))}
          <button
            className="button"
            type="button"
            onClick={() =>
              onUpdateGlobalHeaders([
                ...flow.globalHeaders,
                { id: crypto.randomUUID(), key: "", value: "" },
              ])
            }
          >
            添加 Header
          </button>
        </div>
        <div className="stack">
          <label>全局请求参数</label>
          {flow.globalParams.map((param) => (
            <div key={param.id} className="row">
              <input
                className="input"
                placeholder="参数名"
                value={param.key}
                onChange={(event) =>
                  onUpdateGlobalParams(
                    flow.globalParams.map((item) =>
                      item.id === param.id ? { ...item, key: event.target.value } : item
                    )
                  )
                }
              />
              <input
                className="input"
                placeholder="参数值"
                value={param.value}
                onChange={(event) =>
                  onUpdateGlobalParams(
                    flow.globalParams.map((item) =>
                      item.id === param.id ? { ...item, value: event.target.value } : item
                    )
                  )
                }
              />
              <button
                className="button ghost"
                type="button"
                onClick={() =>
                  onUpdateGlobalParams(flow.globalParams.filter((item) => item.id !== param.id))
                }
              >
                删除
              </button>
            </div>
          ))}
          <button
            className="button"
            type="button"
            onClick={() =>
              onUpdateGlobalParams([
                ...flow.globalParams,
                { id: crypto.randomUUID(), key: "", value: "" },
              ])
            }
          >
            添加参数
          </button>
        </div>
      </div>
    </SectionCard>
  );
};

export default FlowInfoPanel;
