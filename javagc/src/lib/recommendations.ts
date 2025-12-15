import type { Metrics } from "./gcTypes";

interface Recommendation {
  title: string;
  detail: string;
  action: string;
  severity: "info" | "warn" | "critical";
}

export function buildRecommendations(metrics: Metrics): Recommendation[] {
  const recs: Recommendation[] = [];

  if (metrics.maxPauseMs > 500) {
    recs.push({
      title: "停顿时间偏高",
      detail: `最大停顿 ${metrics.maxPauseMs.toFixed(0)} ms，可能影响吞吐或延迟。`,
      action: "检查 GC 日志中的 Full GC 触发原因，评估提升堆大小或降低晋升速率。",
      severity: "critical"
    });
  }

  if (metrics.p99PauseMs > 200) {
    recs.push({
      title: "P99 停顿超标",
      detail: `P99 已达 ${metrics.p99PauseMs.toFixed(0)} ms，尾部延迟突出。`,
      action:
        "针对 G1：降低晋升速率、调低 `-XX:InitiatingHeapOccupancyPercent`，或微调 `-XX:MaxGCPauseMillis`；确认是否存在批量分配尖刺。",
      severity: "warn"
    });
  }

  if (metrics.throughput !== null && metrics.throughput < 0.98) {
    recs.push({
      title: "吞吐率低于 98%",
      detail: `当前吞吐率 ${(metrics.throughput * 100).toFixed(1)}%，GC 占用过多时间。`,
      action:
        "减少 Full GC 频率，优化对象生命周期；对 G1 可适当提高 `-XX:MaxGCPauseMillis` 以平衡吞吐。",
      severity: "warn"
    });
  }

  if (metrics.peakHeapUsage !== null && metrics.peakHeapUsage > 0.8) {
    recs.push({
      title: "堆使用接近容量",
      detail: `峰值使用率 ${(metrics.peakHeapUsage * 100).toFixed(1)}%，可能导致频繁 GC。`,
      action:
        "评估提升 `-Xmx/-Xms`，或审计对象缓存与集合膨胀；观察 Survivor 利用率以减少晋升失败。",
      severity: "warn"
    });
  }

  if (metrics.eventCount > 30 && metrics.avgPauseMs < 50) {
    recs.push({
      title: "年轻代回收频繁",
      detail: `检测到较多 Young GC，平均停顿 ${metrics.avgPauseMs.toFixed(0)} ms。`,
      action:
        "调高新生代大小或降低对象分配速率；排查突发分配点（缓存加载、批量解析等）。",
      severity: "info"
    });
  }

  if (metrics.liveSetMb !== null && metrics.liveSetMb < 128) {
    recs.push({
      title: "存活集较小",
      detail: `最大存活集约 ${metrics.liveSetMb.toFixed(0)} MB，可优化为低延迟配置。`,
      action: "可尝试降低堆或调紧 Pause 目标以提升延迟表现，监控 Full GC 是否减少。",
      severity: "info"
    });
  }

  return recs;
}

export type { Recommendation };
