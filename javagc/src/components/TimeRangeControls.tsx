interface Props {
  start: number;
  end: number;
  min: number;
  max: number;
  onChange: (startSec: number, endSec: number) => void;
  onReset: () => void;
}

export default function TimeRangeControls({ start, end, min, max, onChange, onReset }: Props) {
  const clamp = (v: number, minVal: number, maxVal: number) =>
    Math.max(minVal, Math.min(maxVal, v));

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="eyebrow">时间范围</p>
          <h2>按时间过滤</h2>
          <p className="sub">适用于长日志，裁剪时间窗以聚焦异常区间。</p>
        </div>
        <button className="ghost-btn" onClick={onReset} type="button">
          重置
        </button>
      </div>
      <div className="range-grid">
        <label className="range-field">
          <span>开始时间 (s)</span>
          <input
            type="number"
            value={start.toFixed(3)}
            min={min}
            max={end}
            step={0.1}
            onChange={(e) => onChange(clamp(parseFloat(e.target.value), min, end), end)}
          />
        </label>
        <label className="range-field">
          <span>结束时间 (s)</span>
          <input
            type="number"
            value={end.toFixed(3)}
            min={start}
            max={max}
            step={0.1}
            onChange={(e) => onChange(start, clamp(parseFloat(e.target.value), start, max))}
          />
        </label>
        <div className="range-help">
          <p className="note">
            全量范围：{(min ?? 0).toFixed(3)}s - {(max ?? 0).toFixed(3)}s
          </p>
          <p className="note">建议先定位异常时间段，再聚焦查看表格与图表。</p>
        </div>
      </div>
    </section>
  );
}
