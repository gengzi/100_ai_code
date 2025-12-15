import type { Metrics } from "../lib/gcTypes";

interface Props {
  metrics: Metrics;
  warnings: string[];
}

const formatMs = (value: number) => `${value.toFixed(1)} ms`;

export default function MetricsSummary({ metrics, warnings }: Props) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="eyebrow">核心指标</p>
          <h2>关键表现</h2>
        </div>
        {warnings.length ? (
          <div className="pill warn" role="alert">
            {warnings.join("；")}
          </div>
        ) : null}
      </div>
      <div className="grid">
        <Metric label="事件数" value={metrics.eventCount.toString()} />
        <Metric label="Young 次数" value={metrics.youngCount.toString()} />
        <Metric label="Full GC 次数" value={metrics.fullCount.toString()} />
        <Metric label="平均停顿" value={formatMs(metrics.avgPauseMs)} />
        <Metric label="P95 停顿" value={formatMs(metrics.p95PauseMs)} />
        <Metric label="P99 停顿" value={formatMs(metrics.p99PauseMs)} />
        <Metric label="最长停顿" value={formatMs(metrics.maxPauseMs)} />
        <Metric
          label="吞吐率"
          value={
            metrics.throughput !== null ? `${(metrics.throughput * 100).toFixed(2)} %` : "N/A"
          }
        />
        <Metric
          label="峰值堆占用"
          value={
            metrics.peakHeapUsage !== null
              ? `${(metrics.peakHeapUsage * 100).toFixed(1)} %`
              : "N/A"
          }
        />
        <Metric
          label="最大存活集"
          value={metrics.liveSetMb !== null ? `${metrics.liveSetMb.toFixed(0)} MB` : "N/A"}
        />
        <Metric
          label="总停顿时间"
          value={`${metrics.totalPauseSec.toFixed(3)} s`}
          emphasize
        />
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  emphasize
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className={`metric ${emphasize ? "metric-strong" : ""}`}>
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
    </div>
  );
}
