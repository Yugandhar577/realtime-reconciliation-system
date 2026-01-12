import { useState } from "react";
import { ChevronDown, AlertTriangle, Clock, CheckCircle } from "lucide-react";

interface Transaction {
  id: string;
  bankAmount: number;
  gatewayAmount: number;
  delta: number;
  timeDiff: number;
  status: "MATCHED" | "WARNING" | "CRITICAL";
  bankTimestamp: string;
  gatewayTimestamp: string;
  isDelayed: boolean;
}

const mockTransactions: Transaction[] = [
  { id: "TXN-2026-001", bankAmount: 1250.00, gatewayAmount: 1250.00, delta: 0, timeDiff: 45, status: "MATCHED", bankTimestamp: "14:32:15.234", gatewayTimestamp: "14:32:15.279", isDelayed: false },
  { id: "TXN-2026-002", bankAmount: 5420.50, gatewayAmount: 5420.50, delta: 0, timeDiff: 2150, status: "WARNING", bankTimestamp: "14:32:18.102", gatewayTimestamp: "14:32:20.252", isDelayed: true },
  { id: "TXN-2026-003", bankAmount: 890.00, gatewayAmount: 885.00, delta: 5.00, timeDiff: 89, status: "CRITICAL", bankTimestamp: "14:32:22.445", gatewayTimestamp: "14:32:22.534", isDelayed: false },
  { id: "TXN-2026-004", bankAmount: 3200.00, gatewayAmount: 3200.00, delta: 0, timeDiff: 52, status: "MATCHED", bankTimestamp: "14:32:25.112", gatewayTimestamp: "14:32:25.164", isDelayed: false },
  { id: "TXN-2026-005", bankAmount: 15750.00, gatewayAmount: 0, delta: 15750.00, timeDiff: -1, status: "CRITICAL", bankTimestamp: "14:32:28.889", gatewayTimestamp: "—", isDelayed: false },
  { id: "TXN-2026-006", bankAmount: 445.25, gatewayAmount: 445.25, delta: 0, timeDiff: 1850, status: "WARNING", bankTimestamp: "14:32:31.223", gatewayTimestamp: "14:32:33.073", isDelayed: true },
  { id: "TXN-2026-007", bankAmount: 2100.00, gatewayAmount: 2100.00, delta: 0, timeDiff: 38, status: "MATCHED", bankTimestamp: "14:32:35.567", gatewayTimestamp: "14:32:35.605", isDelayed: false },
  { id: "TXN-2026-008", bankAmount: 780.00, gatewayAmount: 778.50, delta: 1.50, timeDiff: 67, status: "WARNING", bankTimestamp: "14:32:38.901", gatewayTimestamp: "14:32:38.968", isDelayed: false },
];

interface FilterButtonsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

function FilterButtons({ activeFilter, onFilterChange }: FilterButtonsProps) {
  const filters = [
    { id: "all", label: "Show All", count: mockTransactions.length },
    { id: "errors", label: "Show Errors Only", count: mockTransactions.filter(t => t.status === "CRITICAL").length },
    { id: "missing", label: "Show Missing", count: mockTransactions.filter(t => t.gatewayTimestamp === "—").length },
  ];

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            activeFilter === filter.id
              ? "bg-primary text-primary-foreground"
              : "bg-card-elevated border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
          }`}
        >
          {filter.label}
          <span className={`rounded-full px-2 py-0.5 text-xs ${
            activeFilter === filter.id ? "bg-primary-foreground/20" : "bg-muted"
          }`}>
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
}

interface TimelineViewProps {
  transaction: Transaction;
}

function TimelineView({ transaction }: TimelineViewProps) {
  const isMissing = transaction.gatewayTimestamp === "—";

  return (
    <div className="bg-card-elevated/50 p-6 border-t border-border">
      <div className="relative">
        {/* Timeline line */}
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
              <p className="mt-1 text-xs text-primary">${transaction.bankAmount.toLocaleString()}</p>
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
            {transaction.isDelayed && (
              <p className="text-xs text-warning">Delayed Response</p>
            )}
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
              {!isMissing && (
                <p className="mt-1 text-xs text-primary">${transaction.gatewayAmount.toLocaleString()}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReconciliationTable() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredTransactions = mockTransactions.filter((t) => {
    if (activeFilter === "errors") return t.status === "CRITICAL";
    if (activeFilter === "missing") return t.gatewayTimestamp === "—";
    return true;
  });

  const getStatusBadge = (status: Transaction["status"]) => {
    const styles = {
      MATCHED: "bg-success/10 text-success",
      WARNING: "bg-warning/10 text-warning",
      CRITICAL: "bg-destructive/10 text-destructive",
    };
    return styles[status];
  };

  return (
    <div className="card-gradient rounded-lg border border-border">
      <div className="border-b border-border p-5">
        <h2 className="text-lg font-semibold text-foreground">Transaction Reconciliation</h2>
        <p className="text-sm text-muted-foreground">Real-time transaction monitoring</p>
      </div>
      <div className="p-5">
        <FilterButtons activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-card-elevated/30">
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Transaction ID</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Bank Amount</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Gateway Amount</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Delta ($)</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Time Diff (ms)</th>
              <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-5 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredTransactions.map((transaction) => (
              <>
                <tr
                  key={transaction.id}
                  onClick={() => setExpandedRow(expandedRow === transaction.id ? null : transaction.id)}
                  className="cursor-pointer transition-colors duration-200 hover:bg-card-elevated/50"
                >
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm font-medium text-foreground">{transaction.id}</span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-foreground">
                    ${transaction.bankAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm text-foreground">
                    {transaction.gatewayTimestamp === "—" ? "—" : `$${transaction.gatewayAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  </td>
                  <td className={`px-5 py-4 text-right font-mono text-sm ${transaction.delta > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {transaction.delta > 0 ? `$${transaction.delta.toFixed(2)}` : "—"}
                  </td>
                  <td className={`px-5 py-4 text-right font-mono text-sm ${
                    transaction.timeDiff === -1 ? "text-destructive" : transaction.timeDiff > 1000 ? "text-warning" : "text-muted-foreground"
                  }`}>
                    {transaction.timeDiff === -1 ? "N/A" : `${transaction.timeDiff}ms`}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expandedRow === transaction.id ? "rotate-180" : ""}`} />
                  </td>
                </tr>
                {expandedRow === transaction.id && (
                  <tr key={`${transaction.id}-timeline`}>
                    <td colSpan={7} className="p-0">
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
  );
}
