import { AlertTriangle } from "lucide-react";

interface Alert {
  id: string;
  transactionId: string;
  errorType: string;
  timestamp: string;
}

const mockAlerts: Alert[] = [
  { id: "1", transactionId: "TXN-2026-003", errorType: "Amount Mismatch: $5.00 delta", timestamp: "14:32:22" },
  { id: "2", transactionId: "TXN-2026-005", errorType: "Missing Gateway Response", timestamp: "14:32:28" },
  { id: "3", transactionId: "TXN-2026-002", errorType: "High Latency: 2150ms", timestamp: "14:32:18" },
  { id: "4", transactionId: "TXN-2026-008", errorType: "Amount Drift: $1.50", timestamp: "14:32:38" },
  { id: "5", transactionId: "TXN-2026-006", errorType: "Response Delay: 1850ms", timestamp: "14:32:31" },
  { id: "6", transactionId: "TXN-2026-009", errorType: "Duplicate Transaction Detected", timestamp: "14:33:02" },
  { id: "7", transactionId: "TXN-2026-010", errorType: "Timeout: No Response", timestamp: "14:33:15" },
  { id: "8", transactionId: "TXN-2026-011", errorType: "Currency Mismatch", timestamp: "14:33:22" },
];

export function AlertsTicker() {
  // Double the alerts for seamless loop
  const doubledAlerts = [...mockAlerts, ...mockAlerts];

  return (
    <div className="relative mb-6 overflow-hidden rounded-lg border border-destructive/30 bg-destructive/5">
      <div className="absolute left-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      
      <div className="flex animate-scroll py-3">
        {doubledAlerts.map((alert, index) => (
          <div
            key={`${alert.id}-${index}`}
            className="flex shrink-0 items-center gap-3 px-6 border-r border-destructive/20 last:border-r-0"
          >
            <div className="flex items-center gap-2 rounded-full bg-destructive/20 px-2.5 py-1">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              <span className="text-xs font-semibold text-destructive">ALERT</span>
            </div>
            <span className="font-mono text-sm font-medium text-foreground">{alert.transactionId}</span>
            <span className="text-sm text-muted-foreground">{alert.errorType}</span>
            <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
