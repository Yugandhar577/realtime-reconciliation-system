import { useState } from "react";
import {
  ChevronRight, AlertTriangle, Clock, CheckCircle,
  Search, Copy, Check, Download,
} from "lucide-react";
import { useRecentTransactions } from "@/hooks/use-api";
import { useReconciliationEvents } from "@/hooks/use-websocket";
import { useQueryClient } from "@tanstack/react-query";
import { TransactionSummary } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

type Status = 'MATCHED' | 'MISMATCHED' | 'MISSING_CBS' | 'MISSING_GATEWAY';
type Severity = 'LOW' | 'MEDIUM' | 'HIGH';
type Transaction = TransactionSummary;

// ─── look-up tables ────────────────────────────────────────────────────────

const ANOMALY_LABELS: Record<string, string> = {
  AMOUNT_MISMATCH: 'Amount mismatch',
  CURRENCY_MISMATCH: 'Currency mismatch',
  STATUS_MISMATCH: 'Status mismatch',
  TIME_DRIFT: 'Time drift',
  DUPLICATE: 'Duplicate event',
};

const STATUS_BADGE: Record<string, string> = {
  MATCHED: 'text-green-700 bg-green-50 border-green-200',
  MISMATCHED: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  MISSING_CBS: 'text-red-700 bg-red-50 border-red-200',
  MISSING_GATEWAY: 'text-red-700 bg-red-50 border-red-200',
};

const SEVERITY_BADGE: Record<string, string> = {
  LOW: 'text-blue-700 bg-blue-50 border-blue-200',
  MEDIUM: 'text-orange-700 bg-orange-50 border-orange-200',
  HIGH: 'text-red-700 bg-red-50 border-red-200',
};

const ACTION_BADGE: Record<string, string> = {
  NONE: 'text-green-700 bg-green-50',
  MONITOR: 'text-blue-700 bg-blue-50',
  REVIEW_AND_CORRECT: 'text-yellow-700 bg-yellow-50',
  BLOCK_AND_INVESTIGATE: 'text-orange-700 bg-orange-50',
  IMMEDIATE_INVESTIGATION: 'text-red-700 bg-red-50',
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

function timeDeltaColor(ms: number): string {
  if (ms > 500) return 'text-red-600';
  if (ms > 50) return 'text-yellow-600';
  return 'text-green-600';
}

function statusIcon(status: string) {
  if (status === 'MATCHED') return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === 'MISMATCHED') return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  return <AlertTriangle className="h-4 w-4 text-red-600" />;
}

// ─── CopyButton ─────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-1 p-0.5 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
      title="Copy transaction ID"
    >
      {copied
        ? <Check className="h-3.5 w-3.5 text-green-500" />
        : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ─── TimelineView ────────────────────────────────────────────────────────────

function TimelineView({ tx }: { tx: Transaction }) {
  const { processedAt, receivedAt, respondedAt } = tx.timeline;
  const amountDelta =
    tx.amountCBS != null && tx.amountGateway != null
      ? tx.amountCBS - tx.amountGateway
      : null;

  const nodes = [
    {
      label: 'CBS Processed',
      ts: processedAt,
      active: !!processedAt,
      colorActive: 'bg-green-100 border-green-500',
      iconActive: <CheckCircle className="h-5 w-5 text-green-600" />,
    },
    {
      label: 'Gateway Received',
      ts: receivedAt,
      active: !!receivedAt,
      colorActive: 'bg-blue-100 border-blue-500',
      iconActive: <Clock className="h-5 w-5 text-blue-600" />,
    },
    {
      label: 'Gateway Responded',
      ts: respondedAt,
      active: !!respondedAt,
      colorActive: 'bg-purple-100 border-purple-500',
      iconActive: <CheckCircle className="h-5 w-5 text-purple-600" />,
    },
  ];

  return (
    <div className="bg-muted/30 p-6 border-t border-border space-y-6">

      {/* Timeline nodes */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Event Timeline</p>
        <div className="relative">
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-border" />
          <div className="relative grid grid-cols-3 gap-4">
            {nodes.map((n) => (
              <div key={n.label} className="flex flex-col items-center">
                <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${n.active ? n.colorActive : 'bg-muted border-border'}`}>
                  {n.active ? n.iconActive : <Clock className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs font-semibold text-foreground">{n.label}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5 break-all">{fmtTimestamp(n.ts)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Field comparison table */}
      {(tx.amountCBS != null || tx.amountGateway != null || tx.cbsStatus != null) && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Field Comparison</p>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Field</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">CBS</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Gateway</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tx.amountCBS != null && tx.amountGateway != null && (
                  <tr className={amountDelta !== null && Math.abs(amountDelta) > 0.001 ? 'bg-yellow-50/40' : ''}>
                    <td className="px-4 py-2 font-medium text-foreground">Amount</td>
                    <td className="px-4 py-2 font-mono">{fmtAmount(tx.amountCBS, tx.currency)}</td>
                    <td className="px-4 py-2 font-mono">{fmtAmount(tx.amountGateway, tx.currency)}</td>
                    <td className="px-4 py-2 text-xs font-medium">
                      {amountDelta !== null && Math.abs(amountDelta) <= 0.001
                        ? <span className="text-green-600">✓ Match</span>
                        : <span className="text-red-600">✗ Δ {fmtAmount(Math.abs(amountDelta!), tx.currency)}</span>}
                    </td>
                  </tr>
                )}
                {tx.cbsStatus != null && tx.gatewayStatus != null && (
                  <tr className={tx.cbsStatus !== tx.gatewayStatus ? 'bg-yellow-50/40' : ''}>
                    <td className="px-4 py-2 font-medium text-foreground">Status</td>
                    <td className="px-4 py-2 font-mono">{tx.cbsStatus}</td>
                    <td className="px-4 py-2 font-mono">{tx.gatewayStatus}</td>
                    <td className="px-4 py-2 text-xs font-medium">
                      {tx.cbsStatus === tx.gatewayStatus
                        ? <span className="text-green-600">✓ Match</span>
                        : <span className="text-red-600">✗ Mismatch</span>}
                    </td>
                  </tr>
                )}
                {tx.timeDeltaMs != null && (
                  <tr>
                    <td className="px-4 py-2 font-medium text-foreground">Time Delta</td>
                    <td colSpan={2} className="px-4 py-2 font-mono">{tx.timeDeltaMs} ms</td>
                    <td className={`px-4 py-2 text-xs font-medium ${timeDeltaColor(tx.timeDeltaMs)}`}>
                      {tx.timeDeltaMs > 500 ? '✗ High' : tx.timeDeltaMs > 50 ? '⚠ Elevated' : '✓ Normal'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Anomalies */}
      {tx.anomalies.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Anomalies</p>
          <div className="flex flex-wrap gap-2">
            {tx.anomalies.map((a) => (
              <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                {ANOMALY_LABELS[a] ?? a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommended action */}
      {tx.recommendedAction && tx.recommendedAction !== 'NONE' && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${ACTION_BADGE[tx.recommendedAction] ?? 'bg-muted text-foreground'}`}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Action required:{' '}
          <span className="capitalize">{tx.recommendedAction.replace(/_/g, ' ').toLowerCase()}</span>
        </div>
      )}
    </div>
  );
}

// ─── DownloadReportButton ─────────────────────────────────────────────────────

interface DownloadProps {
  filterStatus: Status | 'ALL';
  filterSeverity: Severity | 'ALL';
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
}

function DownloadReportButton({ filterStatus, filterSeverity, searchQuery, dateFrom, dateTo }: DownloadProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '500' });
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (filterSeverity !== 'ALL') params.set('severity', filterSeverity);
      if (dateFrom) params.set('startDate', dateFrom);
      if (dateTo) params.set('endDate', dateTo);

      const res = await fetch(`/api/transactions/report?${params}`);
      if (!res.ok) throw new Error('Failed to fetch report');

      const blob = await res.blob();
      const disp = res.headers.get('Content-Disposition');
      const match = disp && /filename\*?=(?:UTF-8'')?"?([^";]+)"?/.exec(disp);
      let filename = match ? decodeURIComponent(match[1]) : '';
      if (!filename) {
        const now = new Date();
        const p = (n: number) => String(n).padStart(2, '0');
        filename = `reconciliation_report_${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}_${p(now.getHours())}-${p(now.getMinutes())}.csv`;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-background text-sm font-medium hover:bg-muted/60 transition-colors disabled:opacity-50"
      onClick={handleDownload}
      disabled={loading}
    >
      <Download className="h-4 w-4" />
      {loading ? 'Preparing…' : 'Download CSV'}
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const STATUS_FILTERS: Array<Status | 'ALL'> = ['ALL', 'MATCHED', 'MISMATCHED', 'MISSING_CBS', 'MISSING_GATEWAY'];
const SEVERITY_FILTERS: Array<Severity | 'ALL'> = ['ALL', 'LOW', 'MEDIUM', 'HIGH'];

export default function Transactions() {
  const { data: recentTransactions } = useRecentTransactions(100);
  // Inject live WS events into the query cache so the list updates in real-time
  const queryClient = useQueryClient();
  useReconciliationEvents({
    onEvent: (event) => {
      queryClient.setQueryData<Transaction[]>(
        ['transactions', 'recent', 100],
        (prev) => {
          const asTx: Transaction = {
            id: event.transactionId,
            transactionId: event.transactionId,
            // backend sends both `status` and `classification`; prefer `status`
            status: (event.status ?? event.classification) as Status,
            severity: event.severity,
            summary: event.summary,
            createdAt: event.createdAt,
            anomalies: event.anomalies,
            timeline: event.timeline,
            recommendedAction: event.recommendedAction,
            // financial fields — present in the WS payload from buildResult()
            amountCBS: event.amountCBS ?? null,
            amountGateway: event.amountGateway ?? null,
            currency: event.currency ?? null,
            cbsStatus: event.cbsStatus ?? null,
            gatewayStatus: event.gatewayStatus ?? null,
            timeDeltaMs: event.timeDeltaMs ?? null,
          };
          if (!prev) return [asTx];
          const withoutDupe = prev.filter((t) => t.transactionId !== asTx.transactionId);
          return [asTx, ...withoutDupe].slice(0, 100);
        }
      );
    },
  });

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<Status | 'ALL'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const transactions: Transaction[] = recentTransactions ?? [];

  const filtered = transactions.filter((tx) => {
    if (filterStatus !== 'ALL' && tx.status !== filterStatus) return false;
    if (filterSeverity !== 'ALL' && tx.severity !== filterSeverity) return false;
    if (searchQuery && !tx.transactionId.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      if (new Date(tx.createdAt).getTime() < from) return false;
    }
    if (dateTo) {
      // include the full selected day
      const to = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1;
      if (new Date(tx.createdAt).getTime() > to) return false;
    }
    return true;
  });

  const hasActiveFilters = filterStatus !== 'ALL' || filterSeverity !== 'ALL' || searchQuery || dateFrom || dateTo;

  const clearFilters = () => {
    setFilterStatus('ALL');
    setFilterSeverity('ALL');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Monitor and analyze transaction reconciliation results</p>
        </div>
        <DownloadReportButton
          filterStatus={filterStatus}
          filterSeverity={filterSeverity}
          searchQuery={searchQuery}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring w-52"
          />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            title="From date"
            className="px-2 py-1.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            title="To date"
            min={dateFrom || undefined}
            className="px-2 py-1.5 text-sm rounded-md border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterStatus === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted/60'
              }`}
            >
              {s === 'ALL' ? 'All Status' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Severity filter */}
        <div className="flex gap-1 flex-wrap">
          {SEVERITY_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                filterSeverity === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted/60'
              }`}
            >
              {s === 'ALL' ? 'All Severity' : s}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-2.5 py-1 rounded-full text-xs font-medium border border-border text-muted-foreground hover:bg-muted/60 transition-colors"
          >
            Clear filters
          </button>
        )}

        <span className="text-xs text-muted-foreground sm:ml-auto">
          {filtered.length} of {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* List */}
      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {transactions.length === 0 ? (
                  <>
                    <h3 className="text-lg font-medium text-foreground mb-2">No transactions yet</h3>
                    <p className="text-muted-foreground">
                      Transactions will appear here as they are processed by the reconciliation engine.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium text-foreground mb-2">No matches</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                  </>
                )}
              </div>
            ) : (
              filtered.map((tx) => {
                const isExpanded = expandedRows.has(tx.transactionId);
                const amountDelta =
                  tx.amountCBS != null && tx.amountGateway != null
                    ? Math.abs(tx.amountCBS - tx.amountGateway)
                    : null;

                return (
                  <div key={tx.transactionId} className="border border-border rounded-lg overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-muted/40 transition-colors group"
                      onClick={() => toggleRow(tx.transactionId)}
                    >
                      <div className="flex items-center gap-3 flex-wrap">
                        {/* Status + severity badges */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {statusIcon(tx.status)}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[tx.status] ?? ''}`}>
                            {tx.status.replace(/_/g, ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_BADGE[tx.severity] ?? ''}`}>
                            {tx.severity}
                          </span>
                        </div>

                        {/* ID + summary */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center">
                            <p className="font-mono font-medium text-foreground text-sm">{tx.transactionId}</p>
                            <CopyButton value={tx.transactionId} />
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{tx.summary}</p>
                        </div>

                        {/* Amounts */}
                        {(tx.amountCBS != null || tx.amountGateway != null) && (
                          <div className="text-right shrink-0 hidden sm:block">
                            <p className="text-xs text-muted-foreground">CBS → Gateway</p>
                            <p className="font-mono text-sm">
                              {fmtAmount(tx.amountCBS, tx.currency)} → {fmtAmount(tx.amountGateway, tx.currency)}
                            </p>
                            {amountDelta !== null && amountDelta > 0.001 && (
                              <p className="text-xs text-red-600 font-medium">Δ {fmtAmount(amountDelta, tx.currency)}</p>
                            )}
                          </div>
                        )}

                        {/* Time delta */}
                        {tx.timeDeltaMs != null && (
                          <div className="text-right shrink-0 hidden md:block">
                            <p className="text-xs text-muted-foreground">Δt</p>
                            <p className={`text-sm font-mono font-medium ${timeDeltaColor(tx.timeDeltaMs)}`}>
                              {tx.timeDeltaMs} ms
                            </p>
                          </div>
                        )}

                        {/* Recommended action */}
                        {tx.recommendedAction && tx.recommendedAction !== 'NONE' && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 hidden lg:inline ${ACTION_BADGE[tx.recommendedAction] ?? 'bg-muted'}`}>
                            {tx.recommendedAction.replace(/_/g, ' ')}
                          </span>
                        )}

                        {/* Time + anomaly count + chevron */}
                        <div className="flex items-center gap-3 shrink-0 ml-auto">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleString()}</p>
                            {tx.anomalies.length > 0 && (
                              <p className="text-xs text-red-600 font-medium">
                                {tx.anomalies.length} anomal{tx.anomalies.length === 1 ? 'y' : 'ies'}
                              </p>
                            )}
                          </div>
                          <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    </div>

                    {isExpanded && <TimelineView tx={tx} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
