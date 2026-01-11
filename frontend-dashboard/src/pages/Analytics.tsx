import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";

const mismatchData = [
  { time: "14:28", count: 2 },
  { time: "14:29", count: 5 },
  { time: "14:30", count: 3 },
  { time: "14:31", count: 8 },
  { time: "14:32", count: 12 },
  { time: "14:33", count: 7 },
  { time: "14:34", count: 4 },
  { time: "14:35", count: 9 },
  { time: "14:36", count: 6 },
  { time: "14:37", count: 11 },
];

const anomalyData = [
  { name: "Missing", value: 23 },
  { name: "Amount Drift", value: 45 },
  { name: "Time Drift", value: 32 },
];

const latencyDistribution = [
  { range: "0-25ms", count: 245 },
  { range: "25-50ms", count: 412 },
  { range: "50-100ms", count: 287 },
  { range: "100-250ms", count: 156 },
  { range: "250-500ms", count: 78 },
  { range: "500ms+", count: 34 },
];

const DONUT_COLORS = ["hsl(0, 72%, 51%)", "hsl(38, 92%, 50%)", "hsl(187, 85%, 53%)"];

export default function Analytics() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Area Chart - Mismatches per Minute */}
      <div className="card-gradient rounded-lg border border-border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Mismatches per Minute</h2>
          <p className="text-sm text-muted-foreground">Real-time mismatch detection rate</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mismatchData}>
              <defs>
                <linearGradient id="colorMismatch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis 
                dataKey="time" 
                className="text-muted-foreground"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                className="text-muted-foreground"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--foreground))",
                }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(187, 85%, 53%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMismatch)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart - Anomaly Breakdown */}
        <div className="card-gradient rounded-lg border border-border p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Anomaly Breakdown</h2>
            <p className="text-sm text-muted-foreground">Distribution of detected anomalies</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={anomalyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {anomalyData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Histogram - Latency Distribution */}
        <div className="card-gradient rounded-lg border border-border p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Latency Distribution</h2>
            <p className="text-sm text-muted-foreground">Response time breakdown</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latencyDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="range" 
                  className="text-muted-foreground"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  className="text-muted-foreground"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(187, 85%, 53%)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
