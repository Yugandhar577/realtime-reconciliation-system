import { useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useTransaction } from "@/hooks/use-api";
import { TransactionSummary } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

// ─── look-up tables ────────────────────────────────────────────────────────

const ANOMALY_LABELS: Record<string, string> = {
  AMOUNT_MISMATCH: 'Amount mismatch',
  CURRENCY_MISMATCH: 'Currency mismatch',
  STATUS_MISMATCH: 'Status mismatch',
  TIME_DRIFT: 'Time drift',
  DUPLICATE: 'Duplicate event',
};

const ACTION_BADGE: Record<string, string> = {
  NONE: 'text-green-700 bg-green-50 border-green-200',
  MONITOR: 'text-blue-700 bg-blue-50 border-blue-200',
  REVIEW_AND_CORRECT: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  BLOCK_AND_INVESTIGATE: 'text-orange-700 bg-orange-50 border-orange-200',
  IMMEDIATE_INVESTIGATION: 'text-red-700 bg-red-50 border-red-200',
};

const STATUS_COLOR: Record<string, string> = {
  MATCHED: 'text-green-600',
  MISMATCHED: 'text-yellow-600',
  MISSING_CBS: 'text-red-600',
  MISSING_GATEWAY: 'text-red-600',
};

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtTimestamp(ts?: string | null): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
}

function fmtAmount(amt?: number | null, currency?: string | null): string {
  if (amt == null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(amt);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimelineSection({ tx }: { tx: TransactionSummary }) {
  const { processedAt, receivedAt, respondedAt } = tx.timeline;

  const nodes = [
    {
      label: 'CBS Processed',
      ts: processedAt,
      active: !!processedAt,
      activeStyle: 'bg-green-100 border-green-500',
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    },
    {
      label: 'Gateway Received',
      ts: receivedAt,
      active: !!receivedAt,
      activeStyle: 'bg-blue-100 border-blue-500',
      icon: <Clock className="h-5 w-5 text-blue-600" />,
    },
    {
      label: 'Gateway Responded',
      ts: respondedAt,
      active: !!respondedAt,
      activeStyle: 'bg-purple-100 border-purple-500',
      icon: <CheckCircle className="h-5 w-5 text-purple-600" />,
    },
  ];

  return (
    <div className="card-gradient rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold text-foreground mb-6">Event Timeline</h2>
      <div className="relative">
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-border" />
        <div className="flex justify-between">
          {nodes.map((n) => (
            <div key={n.label} className="flex flex-col items-center relative z-10">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${n.active ? n.activeStyle : 'bg-muted border-border'}`}>
                {n.active ? n.icon : <Clock className="h-5 w-5 text-muted-foreground" />}
              </div>
              <p className="mt-3 text-sm font-medium text-foreground text-center max-w-[110px]">{n.label}</p>
              <p className="text-xs text-muted-foreground font-mono text-center mt-0.5">{fmtTimestamp(n.ts)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComparisonSection({ tx }: { tx: TransactionSummary }) {
  if (tx.amountCBS == null && tx.amountGateway == null && tx.cbsStatus == null) return null;

  const amountDelta =
    tx.amountCBS != null && tx.amountGateway != null
      ? tx.amountCBS - tx.amountGateway
      : null;

  return (
    <div className="card-gradient rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Field Comparison</h2>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Field</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">CBS</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Gateway</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tx.amountCBS != null && tx.amountGateway != null && (
              <tr className={amountDelta !== null && Math.abs(amountDelta) > 0.001 ? 'bg-yellow-50/40' : ''}>
                <td className="px-4 py-3 font-medium text-foreground">Amount</td>
                <td className="px-4 py-3 font-mono">{fmtAmount(tx.amountCBS, tx.currency)}</td>
                <td className="px-4 py-3 font-mono">{fmtAmount(tx.amountGateway, tx.currency)}</td>
                <td className="px-4 py-3 text-xs font-semibold">
                  {amountDelta !== null && Math.abs(amountDelta) <= 0.001
                    ? <span className="text-green-600">✓ Match</span>
                    : <span className="text-red-600">✗ Δ {fmtAmount(Math.abs(amountDelta!), tx.currency)}</span>}
                </td>
              </tr>
            )}
            {tx.cbsStatus != null && tx.gatewayStatus != null && (
              <tr className={tx.cbsStatus !== tx.gatewayStatus ? 'bg-yellow-50/40' : ''}>
                <td className="px-4 py-3 font-medium text-foreground">Status</td>
                <td className="px-4 py-3 font-mono">{tx.cbsStatus}</td>
                <td className="px-4 py-3 font-mono">{tx.gatewayStatus}</td>
                <td className="px-4 py-3 text-xs font-semibold">
                  {tx.cbsStatus === tx.gatewayStatus
                    ? <span className="text-green-600">✓ Match</span>
                    : <span className="text-red-600">✗ Mismatch</span>}
                </td>
              </tr>
            )}
            {tx.currency != null && (
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">Currency</td>
                <td colSpan={2} className="px-4 py-3 font-mono">{tx.currency}</td>
                <td className="px-4 py-3 text-xs font-semibold text-green-600">
                  {tx.anomalies.includes('CURRENCY_MISMATCH') ? (
                    <span className="text-red-600">✗ Mismatch</span>
                  ) : '✓ Match'}
                </td>
              </tr>
            )}
            {tx.timeDeltaMs != null && (
              <tr>
                <td className="px-4 py-3 font-medium text-foreground">Time Delta</td>
                <td colSpan={2} className="px-4 py-3 font-mono">{tx.timeDeltaMs} ms</td>
                <td className={`px-4 py-3 text-xs font-semibold ${tx.timeDeltaMs > 500 ? 'text-red-600' : tx.timeDeltaMs > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {tx.timeDeltaMs > 500 ? '✗ High' : tx.timeDeltaMs > 50 ? '⚠ Elevated' : '✓ Normal'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TransactionDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: tx, isLoading, error } = useTransaction(id ?? '');

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link to="/transactions" className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link to="/transactions" className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Transaction not found</h1>
        </div>
        <div className="card-gradient rounded-lg border border-destructive/30 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <p className="text-muted-foreground">
            No transaction found for ID <span className="font-mono text-foreground">{id}</span>.
            It may have expired from the in-memory store.
          </p>
          <Link to="/transactions" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Transactions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/transactions"
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-mono">{tx.transactionId}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-sm font-medium ${STATUS_COLOR[tx.status] ?? 'text-muted-foreground'}`}>
              {tx.status.replace(/_/g, ' ')}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{fmtTimestamp(tx.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Event Timeline */}
      <TimelineSection tx={tx} />

      {/* Field comparison */}
      <ComparisonSection tx={tx} />

      {/* Anomaly summary */}
      {tx.anomalies.length > 0 && (
        <div className="card-gradient rounded-lg border border-destructive/30 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-destructive mb-2">
                {tx.anomalies.length} anomal{tx.anomalies.length === 1 ? 'y' : 'ies'} detected
              </h3>
              <div className="flex flex-wrap gap-2">
                {tx.anomalies.map((a) => (
                  <span
                    key={a}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
                  >
                    {ANOMALY_LABELS[a] ?? a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommended action */}
      {tx.recommendedAction && tx.recommendedAction !== 'NONE' && (
        <div className={`card-gradient rounded-lg border p-5 flex items-center gap-3 ${ACTION_BADGE[tx.recommendedAction] ?? 'border-border'}`}>
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Recommended Action</p>
            <p className="text-sm capitalize">{tx.recommendedAction.replace(/_/g, ' ').toLowerCase()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
