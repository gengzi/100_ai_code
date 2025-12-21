import { Flow, FlowNode, HttpHeader, OutputMapping } from "../../types/flow";
import { getEdgeTarget } from "../../utils/flow";

interface HttpNodeConfigProps {
  node: FlowNode;
  flow: Flow;
  onUpdateNode: (node: FlowNode) => void;
  onUpdateEdges: (sourceId: string, condition: "success" | "failure", target: string | null) => void;
}

const parseStatusList = (value: string): number[] => {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
};

const updateMappingList = (
  mappings: OutputMapping[],
  id: string,
  next: Partial<OutputMapping>
): OutputMapping[] => {
  return mappings.map((mapping) => (mapping.id === id ? { ...mapping, ...next } : mapping));
};

const HttpNodeConfig = ({ node, flow, onUpdateNode, onUpdateEdges }: HttpNodeConfigProps) => {
  if (node.type !== "http") {
    return null;
  }

  const handleHeaderChange = (headers: HttpHeader[]) => {
    onUpdateNode({ ...node, config: { ...node.config, headers } });
  };

  return (
    <>
      <div className="row">
        <label style={{ minWidth: "60px" }}>方法</label>
        <select
          className="select"
          value={node.config.method}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...node.config, method: event.target.value as typeof node.config.method },
            })
          }
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>
      <div className="row">
        <label style={{ minWidth: "60px" }}>地址</label>
        <input
          className="input"
          value={node.config.url}
          placeholder="https://api.example.com"
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...node.config, url: event.target.value },
            })
          }
        />
      </div>
      <div className="row">
        <label style={{ minWidth: "60px" }}>鉴权</label>
        <input
          className="input"
          value={node.config.authToken}
          placeholder="Bearer Token"
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...node.config, authToken: event.target.value },
            })
          }
        />
      </div>
      <div>
        <label>请求体</label>
        <textarea
          className="textarea"
          value={node.config.body}
          placeholder='{ "key": "value" }'
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: { ...node.config, body: event.target.value },
            })
          }
        />
      </div>
      <div className="stack">
        <label>Headers</label>
        {node.config.headers.map((header) => (
          <div key={header.id} className="row">
            <input
              className="input"
              placeholder="Header"
              value={header.key}
              onChange={(event) =>
                handleHeaderChange(
                  node.config.headers.map((item) =>
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
                handleHeaderChange(
                  node.config.headers.map((item) =>
                    item.id === header.id ? { ...item, value: event.target.value } : item
                  )
                )
              }
            />
            <button
              className="button ghost"
              type="button"
              onClick={() => handleHeaderChange(node.config.headers.filter((item) => item.id !== header.id))}
            >
              删除
            </button>
          </div>
        ))}
        <button
          className="button"
          type="button"
          onClick={() =>
            handleHeaderChange([
              ...node.config.headers,
              { id: crypto.randomUUID(), key: "", value: "" },
            ])
          }
        >
          添加 Header
        </button>
      </div>
      <div>
        <label>断言状态码</label>
        <input
          className="input"
          value={node.config.assertStatus.join(",")}
          onChange={(event) =>
            onUpdateNode({
              ...node,
              config: {
                ...node.config,
                assertStatus: parseStatusList(event.target.value),
              },
            })
          }
        />
        <div className="helper">使用逗号分隔，例如 200,201。</div>
      </div>
      <div className="stack">
        <label>输出映射</label>
        {node.config.outputMappings.map((mapping) => (
          <div key={mapping.id} className="row">
            <input
              className="input"
              placeholder="JSONPath"
              value={mapping.sourcePath}
              onChange={(event) =>
                onUpdateNode({
                  ...node,
                  config: {
                    ...node.config,
                    outputMappings: updateMappingList(node.config.outputMappings, mapping.id, {
                      sourcePath: event.target.value,
                    }),
                  },
                })
              }
            />
            <input
              className="input"
              placeholder="变量名"
              value={mapping.targetKey}
              onChange={(event) =>
                onUpdateNode({
                  ...node,
                  config: {
                    ...node.config,
                    outputMappings: updateMappingList(node.config.outputMappings, mapping.id, {
                      targetKey: event.target.value,
                    }),
                  },
                })
              }
            />
            <button
              className="button ghost"
              type="button"
              onClick={() =>
                onUpdateNode({
                  ...node,
                  config: {
                    ...node.config,
                    outputMappings: node.config.outputMappings.filter((item) => item.id !== mapping.id),
                  },
                })
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
            onUpdateNode({
              ...node,
              config: {
                ...node.config,
                outputMappings: [
                  ...node.config.outputMappings,
                  { id: crypto.randomUUID(), sourcePath: "", targetKey: "" },
                ],
              },
            })
          }
        >
          添加映射
        </button>
      </div>
      <div className="stack">
        <label>分支配置</label>
        <div className="row">
          <span style={{ minWidth: "70px" }}>成功</span>
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
          <span style={{ minWidth: "70px" }}>失败</span>
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

export default HttpNodeConfig;
