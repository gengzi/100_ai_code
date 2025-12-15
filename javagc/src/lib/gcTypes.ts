export interface GCEvent {
  timestampSec: number;
  collector: string;
  cause: string;
  pauseSec: number;
  type: "Young" | "Full" | "Mixed" | "Other";
  heapBeforeMb?: number;
  heapAfterMb?: number;
  heapCapacityMb?: number;
}

export interface ParseResult {
  events: GCEvent[];
  warnings: string[];
  uptimeSec: number;
  startTimeSec: number;
}

export interface Metrics {
  totalPauseSec: number;
  avgPauseMs: number;
  p95PauseMs: number;
  p99PauseMs: number;
  maxPauseMs: number;
  eventCount: number;
  youngCount: number;
  fullCount: number;
  throughput: number | null;
  uptimeSpanSec: number;
  peakHeapUsage: number | null;
  averageHeapUsage: number | null;
  liveSetMb: number | null;
  collectorDistribution: Record<string, number>;
  causeDistribution: Record<string, number>;
  topCauses: Array<{ cause: string; count: number }>;
  pauseHistogram: Array<{ bucket: string; count: number }>;
  pauseSeries: Array<{ time: number; pauseMs: number }>;
  heapSeries: Array<{ time: number; usedMb: number; capacityMb: number }>;
}
