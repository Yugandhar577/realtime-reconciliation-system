import { AlertTriangle, CheckCircle, Clock, Bell, ArrowRight } from "lucide-react";

interface Alert {
  id: string;
  title: string;
  message: string;
  type: "warning" | "success" | "info";
  time: string;
}

const mockAlerts: Alert[] = [
  { id: "1", title: "Large Transaction", message: "Wire transfer of $45,000 requires approval", type: "warning", time: "2 min ago" },
  { id: "2", title: "Payment Received", message: "Invoice #INV-2026-001 has been paid", type: "success", time: "15 min ago" },
  { id: "3", title: "Scheduled Transfer", message: "Payroll processing starts in 2 hours", type: "info", time: "1 hr ago" },
  { id: "4", title: "Security Alert", message: "New device login detected from NYC", type: "warning", time: "3 hr ago" },
];

export function AlertsPanel() {
  return (
    <div className="card-gradient rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Alerts</h2>
          <p className="text-sm text-muted-foreground">4 new notifications</p>
        </div>
        <div className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
            4
          </span>
        </div>
      </div>
      <div className="divide-y divide-border">
        {mockAlerts.map((alert, index) => (
          <div 
            key={alert.id} 
            className="flex items-start gap-3 p-4 transition-colors duration-200 hover:bg-card-elevated/50"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div
              className={`mt-0.5 rounded-lg p-2 ${
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
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-foreground">{alert.title}</p>
              <p className="text-xs text-muted-foreground">{alert.message}</p>
              <p className="text-xs text-muted-foreground">{alert.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border p-4">
        <button className="flex w-full items-center justify-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80">
          View all alerts
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
