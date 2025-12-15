import { useMemo, useState } from "react";
import UploadPanel from "./components/UploadPanel";
import MetricsSummary from "./components/MetricsSummary";
import ChartsPanel from "./components/ChartsPanel";
import Recommendations from "./components/Recommendations";
import EventTable from "./components/EventTable";
import { parseGcLog } from "./lib/gcParser";
import { computeMetrics } from "./lib/metrics";
import type { ParseResult } from "./lib/gcTypes";
import TimeRangeControls from "./components/TimeRangeControls";
import InsightsPanel from "./components/InsightsPanel";

export default function App() {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<{ startSec?: number; endSec?: number }>({});

  const metrics = useMemo(() => {
    if (!parseResult) return null;
    return computeMetrics(parseResult, range);
  }, [parseResult, range]);

  const filteredEvents = useMemo(() => {
    if (!parseResult) return [];
    const startSec = range.startSec ?? parseResult.startTimeSec;
    const endSec = range.endSec ?? parseResult.uptimeSec;
    return parseResult.events.filter((e) => e.timestampSec >= startSec && e.timestampSec <= endSec);
  }, [parseResult, range]);

  const startSec = parseResult?.startTimeSec ?? 0;
  const endSec = range.endSec ?? parseResult?.uptimeSec ?? 0;

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Java GC 洞察</p>
          <h1>GC 日志分析器</h1>
          <p className="sub">
            导入 GC 日志，快速洞察堆使用、停顿时间、吞吐率，并生成可操作的优化建议。所有分析均在本地完成。
          </p>
          <div className="actions">
            <a href="/sample-gc.log" download className="ghost">
              下载示例日志
            </a>
            <span className="note">纯前端运行，无需上传到服务器。</span>
          </div>
        </div>
      </header>

      <UploadPanel
        onParse={(content) => {
          try {
            const result = parseGcLog(content);
            setParseResult(result);
            setRange({});
            setError(null);
          } catch (e) {
            setError((e as Error).message);
            setParseResult(null);
          }
        }}
      />

      {error ? <div className="error">解析失败：{error}</div> : null}

      {parseResult && metrics ? (
        <>
          <TimeRangeControls
            start={range.startSec ?? parseResult.startTimeSec}
            end={range.endSec ?? parseResult.uptimeSec}
            min={parseResult.startTimeSec}
            max={parseResult.uptimeSec}
            onChange={(startVal, endVal) => setRange({ startSec: startVal, endSec: endVal })}
            onReset={() => setRange({})}
          />
          <MetricsSummary metrics={metrics} warnings={parseResult.warnings} />
          <ChartsPanel metrics={metrics} />
          <InsightsPanel
            metrics={metrics}
            events={filteredEvents}
            range={{ startSec: range.startSec ?? startSec, endSec }}
          />
          <EventTable
            events={filteredEvents}
            baseTime={range.startSec ?? parseResult.startTimeSec}
          />
          <Recommendations metrics={metrics} />
        </>
      ) : (
        <section className="placeholder">
          <p>上传一个 GC 日志开始分析，或使用示例日志试试。</p>
        </section>
      )}
    </div>
  );
}
