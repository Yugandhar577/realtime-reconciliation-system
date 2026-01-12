import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { apiService } from "@/lib/api";

const DONUT_COLORS = ["hsl(0, 72%, 51%)", "hsl(38, 92%, 50%)", "hsl(187, 85%, 53%)"];

export default function Analytics() {
  const { data: mismatchData = [] } = useQuery({
    queryKey: ['analytics', 'mismatches'],
    queryFn: () => apiService.getAnalyticsMismatches(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: anomalyData = [] } = useQuery({
    queryKey: ['analytics', 'anomalies'],
    queryFn: () => apiService.getAnalyticsAnomalies(),
    refetchInterval: 30000,
  });

  const { data: latencyDistribution = [] } = useQuery({
    queryKey: ['analytics', 'latency'],
    queryFn: () => apiService.getAnalyticsLatency(),
    refetchInterval: 30000,
  });
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
