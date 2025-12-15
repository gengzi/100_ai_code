import { buildRecommendations } from "../lib/recommendations";
import type { Metrics } from "../lib/gcTypes";

interface Props {
  metrics: Metrics;
}

const severityClass: Record<string, string> = {
  critical: "pill critical",
  warn: "pill warn",
  info: "pill"
};

export default function Recommendations({ metrics }: Props) {
  const recs = buildRecommendations(metrics);
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="eyebrow">优化建议</p>
          <h2>自动洞察</h2>
        </div>
      </div>
      {recs.length === 0 ? <p>未发现明显问题，继续观察即可。</p> : null}
      <div className="recommendations">
        {recs.map((r) => (
          <div className="recommendation" key={r.title}>
            <div className="recommendation-head">
              <span className={severityClass[r.severity]}>{r.severity}</span>
              <h3>{r.title}</h3>
            </div>
            <p className="rec-detail">{r.detail}</p>
            <p className="rec-action">{r.action}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
