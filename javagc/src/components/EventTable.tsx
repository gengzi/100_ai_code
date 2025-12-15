import type { GCEvent } from "../lib/gcTypes";

interface Props {
  events: GCEvent[];
  baseTime: number;
}

const formatHeap = (event: GCEvent) => {
  if (
    event.heapBeforeMb === undefined ||
    event.heapAfterMb === undefined ||
    event.heapCapacityMb === undefined
  ) {
    return "—";
  }
  return `${event.heapBeforeMb.toFixed(0)} → ${event.heapAfterMb.toFixed(0)} / ${event.heapCapacityMb.toFixed(0)} MB`;
};

export default function EventTable({ events, baseTime }: Props) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="eyebrow">事件明细</p>
          <h2>GC 时间线</h2>
          <p className="sub">按当前时间窗展示的事件，便于与图表对照。</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>时间 (s)</th>
              <th>类型</th>
              <th>收集器</th>
              <th>原因</th>
              <th>停顿 (ms)</th>
              <th>堆变化</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} className="note">
                  当前时间范围内没有 GC 事件
                </td>
              </tr>
            ) : (
              events.map((e, idx) => (
                <tr key={`${e.timestampSec}-${e.cause}-${idx}`}>
                  <td>{(e.timestampSec - baseTime).toFixed(3)}</td>
                  <td>{e.type}</td>
                  <td>{e.collector}</td>
                  <td className="cause" title={e.cause}>
                    {e.cause}
                  </td>
                  <td>{(e.pauseSec * 1000).toFixed(1)}</td>
                  <td title={formatHeap(e)}>{formatHeap(e)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
