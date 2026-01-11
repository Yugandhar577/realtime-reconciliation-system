import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

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
  { name: "Missing", value: 23, color: "hsl(0, 72%, 51%)" },
  { name: "Amount Drift", value: 45, color: "hsl(38, 92%, 50%)" },
  { name: "Time Drift", value: 32, color: "hsl(187, 85%, 53%)" },
];

export function ChartsSection() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Area Chart - Mismatches per Minute */}
      <div className="card-gradient rounded-lg border border-border p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Mismatches per Minute</h3>
          <p className="text-sm text-muted-foreground">Real-time mismatch detection rate</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mismatchData}>
              <defs>
                <linearGradient id="colorMismatch" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(187, 85%, 53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(215, 20%, 55%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215, 20%, 55%)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 9%)",
                  border: "1px solid hsl(222, 30%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(210, 40%, 98%)",
                }}
                labelStyle={{ color: "hsl(215, 20%, 55%)" }}
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

      {/* Donut Chart - Anomaly Breakdown */}
      <div className="card-gradient rounded-lg border border-border p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Anomaly Breakdown</h3>
          <p className="text-sm text-muted-foreground">Distribution of detected anomalies</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={anomalyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {anomalyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 9%)",
                  border: "1px solid hsl(222, 30%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(210, 40%, 98%)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span style={{ color: "hsl(210, 40%, 98%)" }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
