import { FlowRunConfig, RunLogEntry } from "../../types/flow";
import SectionCard from "../../components/SectionCard";

interface RunnerPanelProps {
  runConfig: FlowRunConfig;
  logs: RunLogEntry[];
  isRunning: boolean;
  onRun: () => void;
  onUpdateRunConfig: (next: FlowRunConfig) => void;
}

const RunnerPanel = ({
  runConfig,
  logs,
  isRunning,
  onRun,
  onUpdateRunConfig
}: RunnerPanelProps) => {
  return (
    <SectionCard
      title="测试与联调"
      badge={isRunning ? "执行中" : "待执行"}
      actions={
        <button className="button primary" onClick={onRun} type="button" disabled={isRunning}>
          {isRunning ? "执行中..." : "一键联调"}
        </button>
      }
    >
      <div className="stack">
        <div className="row">
          <label style={{ minWidth: "80px" }}>场景</label>
          <select
            className="select"
            value={runConfig.scenario}
            onChange={(event) =>
              onUpdateRunConfig({ ...runConfig, scenario: event.target.value as FlowRunConfig["scenario"] })
            }
          >
            <option value="all">全部路径</option>
            <option value="success">成功场景</option>
            <option value="failure">失败场景</option>
          </select>
        </div>
        <div className="row">
          <label style={{ minWidth: "80px" }}>超时(ms)</label>
          <input
            className="input"
            type="number"
            min={100}
            value={runConfig.timeoutMs}
            onChange={(event) =>
              onUpdateRunConfig({ ...runConfig, timeoutMs: Number(event.target.value) })
            }
          />
        </div>
        <div className="row">
          <label style={{ minWidth: "80px" }}>重试</label>
          <input
            className="input"
            type="number"
            min={0}
            value={runConfig.retries}
            onChange={(event) =>
              onUpdateRunConfig({ ...runConfig, retries: Number(event.target.value) })
            }
          />
        </div>
        <div className="helper">执行场景用于记录联调意图，默认按真实响应结果走分支。</div>
        <div className="log-list">
          {logs.length === 0 ? <div className="helper">暂无执行日志。</div> : null}
          {logs.map((log) => (
            <div key={log.id} className={`log-item ${log.status}`}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{log.nodeName}</strong>
                <span className="helper">{log.durationMs ?? 0}ms</span>
              </div>
              <div className="helper">
                状态: {log.status} {log.httpStatus ? `(${log.httpStatus})` : ""}
              </div>
              {log.error ? <div className="helper">{log.error}</div> : null}
              {log.responsePreview ? (
                <div>
                  <div className="helper">响应预览:</div>
                  <pre className="log-preview">{log.responsePreview}</pre>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
};

export default RunnerPanel;
