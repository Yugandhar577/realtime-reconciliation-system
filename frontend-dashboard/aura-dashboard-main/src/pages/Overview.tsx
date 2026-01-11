import { UnreconciledCard, MismatchRateCard, LatencyCard, SystemHealthCard } from "@/components/dashboard/MetricsCards";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

const recentAlerts = [
  { id: "1", title: "Large Transaction", message: "Wire transfer of $45,000 requires approval", type: "warning" as const, time: "2 min ago" },
  { id: "2", title: "Payment Received", message: "Invoice #INV-2026-001 has been paid", type: "success" as const, time: "15 min ago" },
  { id: "3", title: "Scheduled Transfer", message: "Payroll processing starts in 2 hours", type: "info" as const, time: "1 hr ago" },
];

export default function Overview() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="animate-slide-up">
          <UnreconciledCard />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "50ms" }}>
          <MismatchRateCard />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <LatencyCard />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "150ms" }}>
          <SystemHealthCard />
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="card-gradient rounded-lg border border-border">
          <div className="border-b border-border p-5">
            <h2 className="text-lg font-semibold text-foreground">Recent Alerts</h2>
          </div>
          <div className="divide-y divide-border">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30">
                <div
                  className={`rounded-lg p-2 ${
                    alert.type === "warning"
                      ? "bg-warning/10"
                      : alert.type === "success"
                      ? "bg-success/10"
                      : "bg-primary/10"
                  }`}
                >
                  {alert.type === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  ) : alert.type === "success" ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : (
                    <Clock className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{alert.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
