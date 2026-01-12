import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useReconciliationEvents } from "@/hooks/use-websocket";
import { useRecentTransactions } from "@/hooks/use-api";
import { ReconciliationEvent } from "@/lib/websocket";

interface Transaction {
  id: string;
  status: "MATCHED" | "WARNING" | "CRITICAL";
  summary: string;
  bankAmount: number;
  gatewayAmount: number;
  delta: number;
  timeDiff: number;
  bankTimestamp: string;
  gatewayTimestamp: string;
  isDelayed: boolean;
}

// Convert reconciliation events to transaction format
function convertReconciliationEventToTransaction(event: ReconciliationEvent): Transaction {
  const cbsAmount = event.timeline.processedAt ? 1000 : 0; // Mock amount - would come from event data
  const gatewayAmount = event.timeline.respondedAt ? 1000 : 0; // Mock amount - would come from event data

  let status: "MATCHED" | "WARNING" | "CRITICAL";
  if (event.classification === 'MATCHED') status = 'MATCHED';
  else if (event.severity === 'HIGH') status = 'CRITICAL';
  else status = 'WARNING';

  const timeDiff = event.timeline.processedAt && event.timeline.respondedAt
    ? Math.abs(new Date(event.timeline.respondedAt).getTime() - new Date(event.timeline.processedAt).getTime())
    : -1;

  return {
    id: event.transactionId,
    status,
    summary: event.summary,
    bankAmount: cbsAmount,
    gatewayAmount: gatewayAmount,
    delta: Math.abs(cbsAmount - gatewayAmount),
    timeDiff,
    bankTimestamp: event.timeline.processedAt ? new Date(event.timeline.processedAt).toLocaleTimeString() : "—",
    gatewayTimestamp: event.timeline.respondedAt ? new Date(event.timeline.respondedAt).toLocaleTimeString() : "—",
    isDelayed: timeDiff > 1000,
  };
}

interface TimelineViewProps {
  transaction: Transaction;
}

function TimelineView({ transaction }: TimelineViewProps) {
  const isMissing = transaction.gatewayTimestamp === "—";

  return (
    <div className="bg-muted/30 p-6 border-t border-border">
      {/* Details Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Bank Amount</p>
          <p className="text-sm font-medium text-foreground">${transaction.bankAmount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Gateway Amount</p>
          <p className="text-sm font-medium text-foreground">
            {isMissing ? "—" : `$${transaction.gatewayAmount.toLocaleString()}`}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Delta</p>
          <p className={`text-sm font-medium ${transaction.delta > 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {transaction.delta > 0 ? `$${transaction.delta.toFixed(2)}` : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Time Difference</p>
          <p className={`text-sm font-medium ${
            transaction.timeDiff === -1 ? "text-destructive" : transaction.timeDiff > 1000 ? "text-warning" : "text-muted-foreground"
          }`}>
            {transaction.timeDiff === -1 ? "N/A" : `${transaction.timeDiff}ms`}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-border" />
        <div className="relative flex justify-between items-start">
          {/* Bank Event */}
          <div className="flex flex-col items-center">
            <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 border-2 border-primary">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-foreground">Bank Event</p>
              <p className="text-xs text-muted-foreground font-mono">{transaction.bankTimestamp}</p>
            </div>
          </div>

          {/* Time Difference */}
          <div className="flex flex-col items-center pt-14">
            {transaction.isDelayed && (
              <AlertTriangle className="h-4 w-4 text-warning mb-1" />
            )}
            <p className={`text-sm font-medium ${
              isMissing ? "text-destructive" : transaction.isDelayed ? "text-warning" : "text-muted-foreground"
            }`}>
              {isMissing ? "MISSING" : `${transaction.timeDiff}ms`}
            </p>
          </div>

          {/* Gateway Event */}
          <div className="flex flex-col items-center">
            <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${
              isMissing
                ? "bg-destructive/20 border-destructive"
                : transaction.isDelayed
                ? "bg-warning/20 border-warning"
                : "bg-success/20 border-success"
            }`}>
              {isMissing ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : transaction.isDelayed ? (
                <Clock className="h-5 w-5 text-warning" />
              ) : (
                <CheckCircle className="h-5 w-5 text-success" />
              )}
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-foreground">Gateway Event</p>
              <p className="text-xs text-muted-foreground font-mono">{transaction.gatewayTimestamp}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          to={`/transaction/${transaction.id}`}
          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          View full details
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function Transactions() {
  const { events } = useReconciliationEvents();
  const { data: recentTransactions } = useRecentTransactions(50);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Combine real-time events with recent transactions
  const allTransactions = [
    ...events.map(convertReconciliationEventToTransaction),
    ...(recentTransactions?.map(tx => ({
      id: tx.transactionId,
      status: tx.status === 'MATCHED' ? 'MATCHED' as const :
              tx.severity === 'HIGH' ? 'CRITICAL' as const : 'WARNING' as const,
      summary: tx.summary,
      bankAmount: 1000, // Mock - would need actual amount data
      gatewayAmount: 1000, // Mock - would need actual amount data
      delta: 0, // Mock - would need actual delta calculation
      timeDiff: tx.timeline.processedAt && tx.timeline.respondedAt
        ? Math.abs(new Date(tx.timeline.respondedAt).getTime() - new Date(tx.timeline.processedAt).getTime())
        : -1,
      bankTimestamp: tx.timeline.processedAt ? new Date(tx.timeline.processedAt).toLocaleTimeString() : "—",
      gatewayTimestamp: tx.timeline.respondedAt ? new Date(tx.timeline.respondedAt).toLocaleTimeString() : "—",
      isDelayed: false, // Mock - would need delay calculation
    })) || [])
  ];

  // Remove duplicates based on transaction ID
  const uniqueTransactions = allTransactions.filter((tx, index, self) =>
    index === self.findIndex(t => t.id === tx.id)
  );

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "MATCHED":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "CRITICAL":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "MATCHED":
        return "text-success bg-success/10";
      case "WARNING":
        return "text-warning bg-warning/10";
      case "CRITICAL":
        return "text-destructive bg-destructive/10";
      default:
        return "text-muted-foreground bg-muted/10";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card-gradient rounded-lg border border-border overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-lg font-semibold text-foreground">Transactions</h2>
          <p className="text-sm text-muted-foreground">Real-time reconciliation events</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground w-12"></th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Transaction ID</th>
                <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {uniqueTransactions.length > 0 ? uniqueTransactions.map((transaction) => (
                <>
                  <tr
                    key={transaction.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => toggleRow(transaction.id)}
                  >
                    <td className="px-5 py-4">
                      {expandedRows.has(transaction.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-mono text-sm text-foreground">{transaction.id}</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-foreground">{transaction.summary}</div>
                    </td>
                  </tr>
                  {expandedRows.has(transaction.id) && (
                    <tr>
                      <td colSpan={4} className="px-5 py-4 bg-muted/20">
                        <TimelineView transaction={transaction} />
                      </td>
                    </tr>
                  )}
                </>
              )) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No transactions found</p>
                    <p className="text-sm">Transactions will appear here as they are processed</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
