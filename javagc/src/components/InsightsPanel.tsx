import { useMemo } from "react";
import type { GCEvent, Metrics } from "../lib/gcTypes";

interface Props {
  metrics: Metrics;
  events: GCEvent[];
  range: { startSec: number; endSec: number };
}

export default function InsightsPanel({ metrics, events, range }: Props) {
  const throughputText = useMemo(() => {
    if (metrics.throughput === null) return "无法计算吞吐率（时间窗口过小）。";
    const percent = (metrics.throughput * 100).toFixed(2);
    if (metrics.throughput >= 0.99) return `吞吐率 ${percent}%，表现良好。`;
    if (metrics.throughput >= 0.97)
      return `吞吐率 ${percent}%，略偏低，可关注 Full GC 和频繁 Young GC。`;
    return `吞吐率 ${percent}%，GC 占用时间偏多，建议排查 Full GC 触发原因或提高堆配置。`;
  }, [metrics.throughput]);

  const heapUsageText = useMemo(() => {
    if (metrics.peakHeapUsage === null) return "未获取到堆容量信息。";
    const avg = metrics.averageHeapUsage !== null ? (metrics.averageHeapUsage * 100).toFixed(1) : "N/A";
    const peak = (metrics.peakHeapUsage * 100).toFixed(1);
    return `平均占用 ${avg}% ，峰值 ${peak}%；请关注是否接近 80% 以上。`;
  }, [metrics.averageHeapUsage, metrics.peakHeapUsage]);

  const downloadReport = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            range,
            metrics,
            events
          },
          null,
          2
        )
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gc-analysis.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="eyebrow">进一步对标 gceasy</p>
          <h2>深入诊断</h2>
          <p className="sub">吞吐率解释、堆占用解读、Top N 原因与导出报告。</p>
        </div>
        <button className="primary" type="button" onClick={downloadReport}>
          下载 JSON 报告
        </button>
      </div>

      <div className="grid">
        <InsightBlock title="吞吐率解析" value={throughputText} />
        <InsightBlock
          title="堆占用解读"
          value={
            metrics.peakHeapUsage !== null
              ? heapUsageText
              : "日志中未包含堆容量字段，无法计算占用率。"
          }
        />
        <InsightBlock
          title="最大活跃集"
          value={
            metrics.liveSetMb !== null
              ? `${metrics.liveSetMb.toFixed(0)} MB`
              : "日志缺少堆后大小，无法推断。"
          }
        />
        <InsightBlock
          title="Top GC 原因"
          value={
            metrics.topCauses.length
              ? metrics.topCauses
                  .map((c, idx) => `${idx + 1}. ${c.cause} (${c.count})`)
                  .join(" / ")
              : "暂无原因统计"
          }
        />
        <InsightBlock
          title="事件窗口"
          value={`起始 ${(range.startSec ?? 0).toFixed(3)}s - ${(range.endSec ?? 0).toFixed(3)}s，共 ${events.length} 条`}
        />
        <InsightBlock
          title="总停顿时间"
          value={`${metrics.totalPauseSec.toFixed(3)} s（窗口 ${metrics.uptimeSpanSec.toFixed(3)} s）`}
        />
      </div>
    </section>
  );
}

function InsightBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="insight-block">
      <p className="metric-label">{title}</p>
      <p className="metric-value">{value}</p>
    </div>
  );
}
