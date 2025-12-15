import type { Metrics, ParseResult } from "./gcTypes";

const percentile = (values: number[], p: number) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
};

export function computeMetrics(
  parseResult: ParseResult,
  range?: { startSec?: number; endSec?: number }
): Metrics {
  const startBase = range?.startSec ?? parseResult.startTimeSec;
  const endBase = range?.endSec ?? parseResult.uptimeSec;
  const eventsInRange = parseResult.events.filter(
    (e) => e.timestampSec >= startBase && e.timestampSec <= endBase
  );

  const pausesMs = eventsInRange.map((e) => e.pauseSec * 1000);
  const totalPauseSec = eventsInRange.reduce((acc, e) => acc + e.pauseSec, 0);
  const maxPauseMs = pausesMs.length ? Math.max(...pausesMs) : 0;
  const avgPauseMs = pausesMs.length
    ? pausesMs.reduce((a, b) => a + b, 0) / pausesMs.length
    : 0;
  const p95PauseMs = percentile(pausesMs, 95);
  const p99PauseMs = percentile(pausesMs, 99);
  const uptimeSpan = Math.max(0, endBase - startBase);
  const throughput = uptimeSpan > 0 ? Math.max(0, 1 - totalPauseSec / uptimeSpan) : null;

  let peakHeapUsage: number | null = null;
  let averageHeapUsage: number | null = null;
  let liveSetMb: number | null = null;
  const heapSeries: Array<{ time: number; usedMb: number; capacityMb: number }> = [];
  let youngCount = 0;
  let fullCount = 0;

  eventsInRange.forEach((e) => {
    if (e.type === "Young") youngCount += 1;
    if (e.type === "Full") fullCount += 1;
    if (e.heapAfterMb !== undefined && e.heapCapacityMb !== undefined) {
      const ratio = e.heapAfterMb / e.heapCapacityMb;
      peakHeapUsage = peakHeapUsage ? Math.max(peakHeapUsage, ratio) : ratio;
      if (averageHeapUsage === null) {
        averageHeapUsage = ratio;
      } else {
        averageHeapUsage = (averageHeapUsage * heapSeries.length + ratio) / (heapSeries.length + 1);
      }
      liveSetMb = liveSetMb ? Math.max(liveSetMb, e.heapAfterMb) : e.heapAfterMb;
      heapSeries.push({
        time: e.timestampSec - startBase,
        usedMb: e.heapAfterMb,
        capacityMb: e.heapCapacityMb
      });
    }
  });

  const collectorDistribution = eventsInRange.reduce<Record<string, number>>((acc, e) => {
    acc[e.collector] = (acc[e.collector] ?? 0) + 1;
    return acc;
  }, {});

  const causeDistribution = eventsInRange.reduce<Record<string, number>>((acc, e) => {
    acc[e.cause] = (acc[e.cause] ?? 0) + 1;
    return acc;
  }, {});

  const pauseBuckets = [
    { label: "<10ms", min: 0, max: 10 },
    { label: "10-50ms", min: 10, max: 50 },
    { label: "50-100ms", min: 50, max: 100 },
    { label: "100-200ms", min: 100, max: 200 },
    { label: "200-500ms", min: 200, max: 500 },
    { label: "500-1000ms", min: 500, max: 1000 },
    { label: ">=1s", min: 1000, max: Number.POSITIVE_INFINITY }
  ];

  const pauseHistogram = pauseBuckets.map((b) => ({
    bucket: b.label,
    count: pausesMs.filter((v) => v >= b.min && v < b.max).length
  }));

  const topCauses = Object.entries(causeDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cause, count]) => ({ cause, count }));

  const pauseSeries = eventsInRange.map((e) => ({
    time: e.timestampSec - startBase,
    pauseMs: Math.round(e.pauseSec * 1000)
  }));

  return {
    totalPauseSec,
    avgPauseMs,
    p95PauseMs,
    p99PauseMs,
    maxPauseMs,
    eventCount: eventsInRange.length,
    youngCount,
    fullCount,
    throughput,
    uptimeSpanSec: uptimeSpan,
    peakHeapUsage,
    averageHeapUsage,
    liveSetMb,
    collectorDistribution,
    causeDistribution,
    topCauses,
    pauseHistogram,
    pauseSeries,
    heapSeries
  };
}
