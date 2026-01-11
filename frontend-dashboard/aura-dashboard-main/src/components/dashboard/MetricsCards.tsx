import { useState, useEffect } from "react";
import { AlertTriangle, Activity, Server, Zap } from "lucide-react";

// Unreconciled Count Card
export function UnreconciledCard() {
  const [count] = useState(247);
  const isZero = count === 0;

  return (
    <div className={`card-gradient rounded-lg border p-5 transition-all duration-300 ${isZero ? 'border-success/30 glow-success' : 'border-destructive/30'}`}
         style={{ boxShadow: !isZero ? '0 0 40px hsl(0 72% 51% / 0.2)' : undefined }}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Live Unreconciled</p>
          <p className={`text-4xl font-bold tracking-tight ${isZero ? 'text-success' : 'text-destructive'}`}>
            {count.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">transactions pending</p>
        </div>
        <div className={`rounded-lg p-2.5 ${isZero ? 'bg-success/10' : 'bg-destructive/10'}`}>
          <Activity className={`h-5 w-5 ${isZero ? 'text-success' : 'text-destructive'}`} />
        </div>
      </div>
    </div>
  );
}

// Mismatch Rate Card
export function MismatchRateCard() {
  const [rate] = useState(2.4);
  const isWarning = rate > 1;

  return (
    <div className={`card-gradient rounded-lg border p-5 transition-all duration-300 ${isWarning ? 'border-warning/30 glow-warning' : 'border-success/30 glow-success'}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Mismatch Rate</p>
          <div className="flex items-center gap-2">
            <p className={`text-4xl font-bold tracking-tight ${isWarning ? 'text-warning' : 'text-success'}`}>
              {rate}%
            </p>
            {isWarning && (
              <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
                <AlertTriangle className="h-3 w-3" />
                High
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">threshold: 1.0%</p>
        </div>
        <div className={`rounded-lg p-2.5 ${isWarning ? 'bg-warning/10' : 'bg-success/10'}`}>
          <AlertTriangle className={`h-5 w-5 ${isWarning ? 'text-warning' : 'text-success'}`} />
        </div>
      </div>
    </div>
  );
}

// Average Latency Card (updates every second)
export function LatencyCard() {
  const [latency, setLatency] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate latency fluctuation between 35-65ms
      setLatency(Math.floor(35 + Math.random() * 30));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getLatencyStatus = () => {
    if (latency < 50) return { color: 'text-success', bg: 'bg-success/10', status: 'Excellent' };
    if (latency < 80) return { color: 'text-warning', bg: 'bg-warning/10', status: 'Good' };
    return { color: 'text-destructive', bg: 'bg-destructive/10', status: 'Slow' };
  };

  const status = getLatencyStatus();

  return (
    <div className="card-gradient rounded-lg border border-border p-5 transition-all duration-300 hover:glow-primary hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Avg Latency</p>
          <div className="flex items-baseline gap-1">
            <p className={`text-4xl font-bold tracking-tight transition-all duration-300 ${status.color}`}>
              {latency}
            </p>
            <span className="text-lg font-medium text-muted-foreground">ms</span>
          </div>
          <p className={`text-xs font-medium ${status.color}`}>{status.status}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${status.bg}`}>
          <Zap className={`h-5 w-5 ${status.color}`} />
        </div>
      </div>
    </div>
  );
}

// System Health Card
interface HealthIndicator {
  name: string;
  status: "healthy" | "degraded" | "down";
}

export function SystemHealthCard() {
  const [systems] = useState<HealthIndicator[]>([
    { name: "Kafka", status: "healthy" },
    { name: "Redis", status: "healthy" },
    { name: "API", status: "healthy" },
  ]);

  const allHealthy = systems.every(s => s.status === "healthy");

  return (
    <div className={`card-gradient rounded-lg border p-5 transition-all duration-300 ${allHealthy ? 'border-success/30 glow-success' : 'border-destructive/30'}`}
         style={{ boxShadow: !allHealthy ? '0 0 40px hsl(0 72% 51% / 0.2)' : undefined }}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">System Health</p>
          <div className="flex items-center gap-4">
            {systems.map((system) => (
              <div key={system.name} className="flex items-center gap-2">
                <div className="relative">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      system.status === "healthy"
                        ? "bg-success"
                        : system.status === "degraded"
                        ? "bg-warning"
                        : "bg-destructive"
                    }`}
                  />
                  {system.status === "healthy" && (
                    <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-success opacity-40" />
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">{system.name}</span>
              </div>
            ))}
          </div>
          <p className={`text-xs font-medium ${allHealthy ? 'text-success' : 'text-destructive'}`}>
            {allHealthy ? 'All systems operational' : 'Issues detected'}
          </p>
        </div>
        <div className={`rounded-lg p-2.5 ${allHealthy ? 'bg-success/10' : 'bg-destructive/10'}`}>
          <Server className={`h-5 w-5 ${allHealthy ? 'text-success' : 'text-destructive'}`} />
        </div>
      </div>
    </div>
  );
}
