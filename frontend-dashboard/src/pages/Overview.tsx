import { useReconciliationEvents, useSystemStats } from "@/hooks/use-websocket";
import { useTransactionStats } from "@/hooks/use-api";
import { UnreconciledCard, MismatchRateCard, LatencyCard, SystemHealthCard } from "@/components/dashboard/MetricsCards";
import { AlertTriangle, CheckCircle, Clock, Wifi, WifiOff } from "lucide-react";
import { useWebSocketContext } from "@/components/WebSocketProvider";
import { formatDistanceToNow } from "date-fns";

export default function Overview() {
  const { events } = useReconciliationEvents();
  const systemStats = useSystemStats();
  const { data: transactionStats } = useTransactionStats();
  const { isConnected, connectionState } = useWebSocketContext();

  // Convert reconciliation events to alert format
  const recentAlerts = events.slice(0, 10).map((event, index) => ({
    id: event.transactionId,
    title: `${event.classification} - ${event.transactionId}`,
    message: event.summary,
    type: event.severity === 'HIGH' ? 'warning' as const :
          event.severity === 'MEDIUM' ? 'info' as const : 'success' as const,
    time: formatDistanceToNow(new Date(event.createdAt), { addSuffix: true }),
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className={isConnected ? "text-green-600" : "text-red-600"}>
          {isConnected ? "Connected" : `Disconnected (${connectionState})`}
        </span>
        {systemStats && (
          <span className="text-muted-foreground">
            • {systemStats.activeConnections} active connections
          </span>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="animate-slide-up">
          <UnreconciledCard stats={transactionStats} />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "50ms" }}>
          <MismatchRateCard stats={transactionStats} />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <LatencyCard stats={transactionStats} />
        </div>
        <div className="animate-slide-up" style={{ animationDelay: "150ms" }}>
          <SystemHealthCard isConnected={isConnected} stats={systemStats} />
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="animate-slide-up" style={{ animationDelay: "200ms" }}>
        <div className="card-gradient rounded-lg border border-border">
          <div className="border-b border-border p-5">
            <h2 className="text-lg font-semibold text-foreground">Recent Reconciliation Events</h2>
            <p className="text-sm text-muted-foreground">
              Real-time updates from the reconciliation engine
            </p>
          </div>
          <div className="divide-y divide-border max-h-96 overflow-y-auto">
            {recentAlerts.length > 0 ? recentAlerts.map((alert) => (
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
            )) : (
              <div className="p-8 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Waiting for reconciliation events...</p>
                {!isConnected && (
                  <p className="text-sm mt-1">Connect to the reconciliation engine to see live updates</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
