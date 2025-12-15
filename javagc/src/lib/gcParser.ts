import type { GCEvent, ParseResult } from "./gcTypes";

// Covers legacy GC lines like "0.123: [GC (Allocation Failure) ... 0.01 secs]"
const legacyEventRegex =
  /([0-9]+(?:\.[0-9]+)?):\s+\[(GC|Full GC)[^\]]*?(?:\(([^)]+)\))?[^\]]*?([0-9]+(?:\.[0-9]+)?)\s+secs/i;

// Covers unified logs with uptime like "[1.234s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 4.1ms"
const unifiedEventRegex =
  /\[([0-9]+(?:\.[0-9]+)?)s\][^\]]*\]\s*GC\(\d+\)\s+(.+?)\s+([0-9]+(?:\.[0-9]+)?)(ms|s)\b/i;

const heapLineRegex =
  /([\d.]+)([KMG])\s*\(([\d.]+)([KMG])\)->([\d.]+)([KMG])\(([\d.]+)([KMG])\)/i;

const arrowHeapRegex = /([\d.]+)([KMG])->([\d.]+)([KMG])\(([\d.]+)([KMG])\)/i;

const unitToMb = (value: number, unit?: string) => {
  if (!unit) return value;
  const upper = unit.toUpperCase();
  if (upper === "G") return value * 1024;
  if (upper === "M") return value;
  if (upper === "K") return value / 1024;
  return value;
};

const parseDurationToSeconds = (line: string): number | null => {
  const match = line.match(/([0-9]+(?:\.[0-9]+)?)\s*(ms|s|sec|secs?)(?![a-zA-Z])/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (unit.startsWith("ms")) return value / 1000;
  return value;
};

const parseDateMs = (line: string): number | null => {
  const match = line.match(
    /\[?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?)([+-]\d{2}):?(\d{2})\]?/
  );
  if (!match) return null;
  const iso = `${match[1]}${match[2]}:${match[3]}`;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
};

const parseTimestampWithBase = (line: string, baseDateMs: { value: number | null }) => {
  const uptime = (() => {
    const unified = line.match(/\[([0-9]+(?:\.[0-9]+)?)s\]/);
    if (unified) return parseFloat(unified[1]);
    const legacy = line.match(/(^|\s)([0-9]+(?:\.[0-9]+)?):\s+\[/);
    if (legacy) return parseFloat(legacy[2]);
    return null;
  })();
  if (uptime !== null) return uptime;

  const dateMs = parseDateMs(line);
  if (dateMs !== null) {
    if (baseDateMs.value === null) baseDateMs.value = dateMs;
    return (dateMs - baseDateMs.value) / 1000;
  }

  // Prefer number immediately before GC tokens
  const beforeGc = line.match(
    /([0-9]+(?:\.[0-9]+)?)(?=[^\d](?:GC|Full GC|Pause|G1|ZGC|Shenandoah|ParNew|PSYoung|CMS))/i
  );
  if (beforeGc) return parseFloat(beforeGc[1]);

  const candidates = Array.from(line.matchAll(/([0-9]+(?:\.[0-9]+)?)/g)).map((m) =>
    parseFloat(m[1])
  );
  const plausible = candidates.filter((n) => n < 1_000_000);
  if (!plausible.length) return null;
  const decimals = plausible.filter((n) => n % 1 !== 0);
  if (decimals.length) return decimals[decimals.length - 1];
  return plausible[plausible.length - 1];
};

const parseHeapFromLine = (line: string) => {
  const matchFull = heapLineRegex.exec(line);
  if (matchFull) {
    const before = unitToMb(parseFloat(matchFull[1]), matchFull[2]);
    const capacityBefore = unitToMb(parseFloat(matchFull[3]), matchFull[4]);
    const after = unitToMb(parseFloat(matchFull[5]), matchFull[6]);
    const capacityAfter = unitToMb(parseFloat(matchFull[7]), matchFull[8]);
    return {
      before,
      after,
      capacity: Math.max(capacityBefore, capacityAfter)
    };
  }

  const matchArrow = arrowHeapRegex.exec(line);
  if (matchArrow) {
    const before = unitToMb(parseFloat(matchArrow[1]), matchArrow[2]);
    const after = unitToMb(parseFloat(matchArrow[3]), matchArrow[4]);
    const capacity = unitToMb(parseFloat(matchArrow[5]), matchArrow[6]);
    return { before, after, capacity };
  }

  return null;
};

const detectCollector = (line: string) => {
  if (/ZGC/i.test(line)) return "ZGC";
  if (/Shenandoah/i.test(line)) return "Shenandoah";
  if (/G1/i.test(line)) return "G1";
  if (/Parallel|PSYoung|ParNew/i.test(line)) return "Parallel";
  if (/CMS|ConcurrentMarkSweep/i.test(line)) return "CMS";
  if (/Full GC/i.test(line)) return "Full GC";
  return "GC";
};

const detectCause = (line: string) => {
  const causes = Array.from(line.matchAll(/\(([^()]+)\)/g))
    .map((m) => m[1])
    .filter(Boolean);
  if (causes.length) return causes[causes.length - 1];
  if (/Full GC/i.test(line)) return "Full GC";
  if (/Evacuation Pause/i.test(line)) return "Evacuation Pause";
  if (/Pause Young/i.test(line)) return "Pause Young";
  return "Unknown";
};

const detectType = (line: string, collector: string, cause: string): GCEvent["type"] => {
  if (/Full GC|Metadata GC Threshold|Allocation Failure \(Full\)/i.test(line) || /Full GC/i.test(cause)) {
    return "Full";
  }
  if (/mixed/i.test(line)) return "Mixed";
  if (/young|pause young|evacuation/i.test(line)) return "Young";
  if (/G1/i.test(collector) && /evacuation/i.test(cause)) return "Young";
  return "Other";
};

export function parseGcLog(content: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const events: GCEvent[] = [];
  const warnings: string[] = [];
  let maxTime = 0;
  let minTime: number | null = null;
  const baseDateMs = { value: null as number | null };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Only consider lines that look like GC pauses to avoid counting phase lines
    const looksLikePause = /(Pause|Full GC|Allocation Failure|G1 Evacuation)/i.test(line);

    // Unified JDK9+ format first
    const unifiedMatch = unifiedEventRegex.exec(line);
    if (unifiedMatch) {
      const timestampSec = parseFloat(unifiedMatch[1]);
      const causeText = unifiedMatch[2].trim();
      const pauseValue = parseFloat(unifiedMatch[3]);
      const pauseUnit = unifiedMatch[4].toLowerCase();
      const pauseSec = pauseUnit.startsWith("ms") ? pauseValue / 1000 : pauseValue;

      const event: GCEvent = {
        timestampSec,
        collector: detectCollector(line + causeText),
        cause: detectCause(line + causeText),
        pauseSec,
        type: detectType(line + causeText, detectCollector(line + causeText), detectCause(line + causeText))
      };

      const heap =
        parseHeapFromLine(line) ||
        parseHeapFromLine(lines[i + 1] ?? "") ||
        parseHeapFromLine(lines[i + 2] ?? "");
      if (heap) {
        event.heapBeforeMb = heap.before;
        event.heapAfterMb = heap.after;
        event.heapCapacityMb = heap.capacity;
      }

      maxTime = Math.max(maxTime, timestampSec);
      minTime = minTime === null ? timestampSec : Math.min(minTime, timestampSec);
      events.push(event);
      continue;
    }

    // Legacy pre-JDK9 format
    const legacyMatchLine = legacyEventRegex.exec(line);
    if (legacyMatchLine) {
      const timestampSec = parseFloat(legacyMatchLine[1]);
      const collector = legacyMatchLine[2] ?? "GC";
      const cause = legacyMatchLine[3]?.trim() || "Unknown";
      const pauseSec = parseFloat(legacyMatchLine[4]);

      const event: GCEvent = {
        timestampSec,
        collector,
        cause,
        pauseSec,
        type: detectType(line, collector, cause)
      };

      const lookahead = lines[i + 1] ?? "";
      const heap = parseHeapFromLine(lookahead) || parseHeapFromLine(line);
      if (heap) {
        event.heapBeforeMb = heap.before;
        event.heapAfterMb = heap.after;
        event.heapCapacityMb = heap.capacity;
      }

      maxTime = Math.max(maxTime, timestampSec);
      minTime = minTime === null ? timestampSec : Math.min(minTime, timestampSec);
      events.push(event);
      continue;
    }

    // Fallback heuristic: parse duration and timestamp even if format differs
    const pauseSec = parseDurationToSeconds(line);
    if (pauseSec === null || !looksLikePause) continue;
    const timestampSec = parseTimestampWithBase(line, baseDateMs);
    if (timestampSec === null) continue;

    const event: GCEvent = {
      timestampSec,
      collector: detectCollector(line),
      cause: detectCause(line),
      pauseSec,
      type: detectType(line, detectCollector(line), detectCause(line))
    };

    const heap =
      parseHeapFromLine(line) ||
      parseHeapFromLine(lines[i + 1] ?? "") ||
      parseHeapFromLine(lines[i + 2] ?? "");
    if (heap) {
      event.heapBeforeMb = heap.before;
      event.heapAfterMb = heap.after;
      event.heapCapacityMb = heap.capacity;
    }

    maxTime = Math.max(maxTime, timestampSec);
    minTime = minTime === null ? timestampSec : Math.min(minTime, timestampSec);
    events.push(event);
  }

  if (!events.length) {
    warnings.push("未检测到 GC 事件，请确认日志格式或开启 GC 日志输出。");
  }

  events.sort((a, b) => a.timestampSec - b.timestampSec);
  if (minTime === null && events.length) {
    minTime = events[0].timestampSec;
  }

  return {
    events,
    warnings,
    uptimeSec: maxTime,
    startTimeSec: minTime ?? 0
  };
}
