import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useReconciliationEvents } from "@/hooks/use-websocket";
import { useRecentTransactions } from "@/hooks/use-api";
import { ReconciliationEvent } from "@/lib/websocket";
import { TransactionSummary } from "@/lib/api";

interface Transaction {
  id: string;
  transactionId: string;
  status: "MATCHED" | "MISMATCHED" | "MISSING_CBS" | "MISSING_GATEWAY";
  severity: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
  createdAt: string;
  anomalies: string[];
  timeline: {
    processedAt?: string;
    receivedAt?: string;
    respondedAt?: string;
    firstSeenAt: string;
    lastUpdatedAt: string;
  };
}

// Convert API transaction summary to component format
function convertTransactionSummary(transaction: TransactionSummary): Transaction {
  return {
    id: transaction.id,
    transactionId: transaction.transactionId,
    status: transaction.status,
    severity: transaction.severity,
    summary: transaction.summary,
    createdAt: transaction.createdAt,
    anomalies: transaction.anomalies,
    timeline: transaction.timeline,
  };
}

interface TimelineViewProps {
  transaction: Transaction;
}

function TimelineView({ transaction }: TimelineViewProps) {
  const hasCBS = !!transaction.timeline.processedAt;
  const hasGateway = !!transaction.timeline.receivedAt;
  const hasResponse = !!transaction.timeline.respondedAt;

  return (
    <div className="bg-muted/30 p-6 border-t border-border">
      {/* Status and Anomalies */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            transaction.status === 'MATCHED' ? 'bg-green-100 text-green-800' :
            transaction.status === 'MISMATCHED' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {transaction.status}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            transaction.severity === 'LOW' ? 'bg-blue-100 text-blue-800' :
            transaction.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
            'bg-red-100 text-red-800'
          }`}>
            {transaction.severity}
          </span>
        </div>
        {transaction.anomalies.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {transaction.anomalies.map((anomaly, index) => (
              <span key={index} className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">
                {anomaly}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-border" />
        <div className="relative flex justify-between items-start">
          {/* CBS Event */}
          <div className="flex flex-col items-center">
            <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${
              hasCBS ? 'bg-green-100 border-green-500' : 'bg-gray-100 border-gray-300'
            }`}>
              <CheckCircle className={`h-5 w-5 ${hasCBS ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-foreground">CBS Event</p>
              <p className="text-xs text-muted-foreground font-mono">
                {transaction.timeline.processedAt ? (() => {
                  try {
                    return new Date(transaction.timeline.processedAt!).toLocaleTimeString();
                  } catch (e) {
                    console.error('Invalid date for processedAt:', transaction.timeline.processedAt);
                    return "Invalid Date";
                  }
                })() : "—"}
              </p>
            </div>
          </div>

          {/* Gateway Event */}
          <div className="flex flex-col items-center">
            <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${
              hasGateway ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-300'
            }`}>
              <Clock className={`h-5 w-5 ${hasGateway ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-foreground">Gateway Event</p>
              <p className="text-xs text-muted-foreground font-mono">
                {transaction.timeline.receivedAt ? (() => {
                  try {
                    return new Date(transaction.timeline.receivedAt!).toLocaleTimeString();
                  } catch (e) {
                    console.error('Invalid date for receivedAt:', transaction.timeline.receivedAt);
                    return "Invalid Date";
                  }
                })() : "—"}
              </p>
            </div>
          </div>

          {/* Response Event */}
          <div className="flex flex-col items-center">
            <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${
              hasResponse ? 'bg-purple-100 border-purple-500' : 'bg-gray-100 border-gray-300'
            }`}>
              <ExternalLink className={`h-5 w-5 ${hasResponse ? 'text-purple-600' : 'text-gray-400'}`} />
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm font-medium text-foreground">Response</p>
              <p className="text-xs text-muted-foreground font-mono">
                {transaction.timeline.respondedAt ? (() => {
                  try {
                    return new Date(transaction.timeline.respondedAt!).toLocaleTimeString();
                  } catch (e) {
                    console.error('Invalid date for respondedAt:', transaction.timeline.respondedAt);
                    return "Invalid Date";
                  }
                })() : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  console.log('Transactions component rendering at', new Date().toISOString());
  const { events } = useReconciliationEvents();
  const { data: recentTransactions } = useRecentTransactions(50);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Use API transactions as primary data source, supplemented by real-time events
  const transactions = recentTransactions?.map(convertTransactionSummary) || [];

  console.log('Transactions component - recentTransactions:', recentTransactions);
  console.log('Transactions component - transactions:', transactions);

  const toggleRow = (transactionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'MATCHED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'MISMATCHED':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'MISSING_CBS':
      case 'MISSING_GATEWAY':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'MATCHED':
        return 'text-green-600 bg-green-50';
      case 'MISMATCHED':
        return 'text-yellow-600 bg-yellow-50';
      case 'MISSING_CBS':
      case 'MISSING_GATEWAY':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Monitor and analyze transaction reconciliation results
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-6">
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No transactions yet</h3>
                <p className="text-muted-foreground">
                  Transactions will appear here as they are processed by the reconciliation engine.
                </p>
              </div>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.transactionId} className="border border-border rounded-lg overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleRow(transaction.transactionId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{transaction.transactionId}</p>
                          <p className="text-sm text-muted-foreground">{transaction.summary}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              try {
                                return new Date(transaction.createdAt).toLocaleString();
                              } catch (e) {
                                console.error('Invalid date for createdAt:', transaction.createdAt);
                                return "Invalid Date";
                              }
                            })()}
                          </p>
                          {transaction.anomalies.length > 0 && (
                            <p className="text-xs text-red-600">
                              {transaction.anomalies.length} anomal{transaction.anomalies.length === 1 ? 'y' : 'ies'}
                            </p>
                          )}
                        </div>
                        <ChevronRight
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            expandedRows.has(transaction.transactionId) ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {expandedRows.has(transaction.transactionId) && (
                    <TimelineView transaction={transaction} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
