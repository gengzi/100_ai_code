import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart
} from "recharts";
import type { Metrics } from "../lib/gcTypes";

interface Props {
  metrics: Metrics;
}

export default function ChartsPanel({ metrics }: Props) {
  const collectorData = Object.entries(metrics.collectorDistribution).map(([k, v]) => ({
    name: k,
    count: v
  }));

  const causeData = Object.entries(metrics.causeDistribution).map(([k, v]) => ({
    name: k,
    count: v
  }));

  const pauseHistogram = metrics.pauseHistogram;

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <p className="eyebrow">可视化</p>
          <h2>停顿与堆使用</h2>
        </div>
      </div>
      <div className="chart-grid">
        <ChartBlock title="停顿时间 (ms)">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={metrics.pauseSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={(v) => `${v.toFixed ? v.toFixed(1) : v}s`} />
              <YAxis />
              <Tooltip labelFormatter={(v) => `${v}s`} />
              <Line
                type="monotone"
                dataKey="pauseMs"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartBlock>

        <ChartBlock title="堆使用 (MB)">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={metrics.heapSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={(v) => `${v.toFixed ? v.toFixed(1) : v}s`} />
              <YAxis />
              <Tooltip labelFormatter={(v) => `${v}s`} />
              <Legend />
              <Area
                type="monotone"
                dataKey="usedMb"
                name="已用"
                stroke="#22c55e"
                fill="#22c55e55"
              />
              <Area
                type="monotone"
                dataKey="capacityMb"
                name="容量"
                stroke="#4b5563"
                fill="#9ca3af55"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartBlock>
      </div>

      <div className="chart-grid">
        <ChartBlock title="Collector 分布">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={collectorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>

        <ChartBlock title="触发原因分布">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={causeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ea580c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>
      </div>

      <div className="chart-grid">
        <ChartBlock title="停顿时间分布">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pauseHistogram}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBlock>
        <ChartBlock title="Top GC 原因">
          <div className="top-causes">
            {metrics.topCauses.length === 0 ? (
              <p className="note">暂无数据</p>
            ) : (
              metrics.topCauses.map((c, idx) => (
                <div className="cause-row" key={c.cause}>
                  <span className="pill">{idx + 1}</span>
                  <span className="cause-name">{c.cause}</span>
                  <span className="cause-count">{c.count}</span>
                </div>
              ))
            )}
          </div>
        </ChartBlock>
      </div>
    </section>
  );
}

function ChartBlock({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="chart-block">
      <div className="chart-title">{title}</div>
      {children}
    </div>
  );
}
