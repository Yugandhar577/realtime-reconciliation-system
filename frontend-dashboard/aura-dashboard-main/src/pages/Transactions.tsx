import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

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

const mockTransactions: Transaction[] = [
  { id: "TXN-2026-001", status: "MATCHED", summary: "Wire transfer completed successfully", bankAmount: 1250.00, gatewayAmount: 1250.00, delta: 0, timeDiff: 45, bankTimestamp: "14:32:15.234", gatewayTimestamp: "14:32:15.279", isDelayed: false },
  { id: "TXN-2026-002", status: "WARNING", summary: "Delayed gateway response detected", bankAmount: 5420.50, gatewayAmount: 5420.50, delta: 0, timeDiff: 2150, bankTimestamp: "14:32:18.102", gatewayTimestamp: "14:32:20.252", isDelayed: true },
  { id: "TXN-2026-003", status: "CRITICAL", summary: "Amount mismatch detected", bankAmount: 890.00, gatewayAmount: 885.00, delta: 5.00, timeDiff: 89, bankTimestamp: "14:32:22.445", gatewayTimestamp: "14:32:22.534", isDelayed: false },
  { id: "TXN-2026-004", status: "MATCHED", summary: "Payment reconciled", bankAmount: 3200.00, gatewayAmount: 3200.00, delta: 0, timeDiff: 52, bankTimestamp: "14:32:25.112", gatewayTimestamp: "14:32:25.164", isDelayed: false },
  { id: "TXN-2026-005", status: "CRITICAL", summary: "Missing gateway response", bankAmount: 15750.00, gatewayAmount: 0, delta: 15750.00, timeDiff: -1, bankTimestamp: "14:32:28.889", gatewayTimestamp: "—", isDelayed: false },
  { id: "TXN-2026-006", status: "WARNING", summary: "High latency warning", bankAmount: 445.25, gatewayAmount: 445.25, delta: 0, timeDiff: 1850, bankTimestamp: "14:32:31.223", gatewayTimestamp: "14:32:33.073", isDelayed: true },
];

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
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const getStatusBadge = (status: Transaction["status"]) => {
    const styles = {
      MATCHED: "bg-success/10 text-success",
      WARNING: "bg-warning/10 text-warning",
      CRITICAL: "bg-destructive/10 text-destructive",
    };
    return styles[status];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card-gradient rounded-lg border border-border overflow-hidden">
        <div className="border-b border-border p-5">
          <h2 className="text-lg font-semibold text-foreground">Transactions</h2>
          <p className="text-sm text-muted-foreground">Click a row to view details</p>
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
              {mockTransactions.map((transaction) => (
                <>
                  <tr
                    key={transaction.id}
                    onClick={() => setExpandedRow(expandedRow === transaction.id ? null : transaction.id)}
                    className="cursor-pointer transition-colors duration-200 hover:bg-muted/30"
                  >
                    <td className="px-5 py-4">
                      {expandedRow === transaction.id ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-medium text-foreground">{transaction.id}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-muted-foreground">{transaction.summary}</span>
                    </td>
                  </tr>
                  {expandedRow === transaction.id && (
                    <tr key={`${transaction.id}-expanded`}>
                      <td colSpan={4} className="p-0">
                        <TimelineView transaction={transaction} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
