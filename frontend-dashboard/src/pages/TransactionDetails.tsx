import { useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const mockTransactionDetails = {
  "TXN-2026-001": {
    id: "TXN-2026-001",
    status: "MATCHED" as const,
    bankAmount: 1250.00,
    gatewayAmount: 1250.00,
    delta: 0,
    timeDiff: 45,
    bankTimestamp: "2026-01-10T14:32:15.234Z",
    gatewayTimestamp: "2026-01-10T14:32:15.279Z",
    isDelayed: false,
    bankData: {
      transactionId: "TXN-2026-001",
      amount: 1250.00,
      currency: "USD",
      accountNumber: "****4521",
      routingNumber: "****1234",
      timestamp: "2026-01-10T14:32:15.234Z",
      reference: "WIR-20260110-001",
      status: "COMPLETED"
    },
    gatewayData: {
      transactionId: "TXN-2026-001",
      amount: 1250.00,
      currency: "USD",
      merchantId: "MER-00421",
      paymentMethod: "wire",
      timestamp: "2026-01-10T14:32:15.279Z",
      reference: "WIR-20260110-001",
      status: "SUCCESS"
    }
  },
  "TXN-2026-003": {
    id: "TXN-2026-003",
    status: "CRITICAL" as const,
    bankAmount: 890.00,
    gatewayAmount: 885.00,
    delta: 5.00,
    timeDiff: 89,
    bankTimestamp: "2026-01-10T14:32:22.445Z",
    gatewayTimestamp: "2026-01-10T14:32:22.534Z",
    isDelayed: false,
    bankData: {
      transactionId: "TXN-2026-003",
      amount: 890.00,
      currency: "USD",
      accountNumber: "****8832",
      routingNumber: "****5678",
      timestamp: "2026-01-10T14:32:22.445Z",
      reference: "PAY-20260110-003",
      status: "COMPLETED"
    },
    gatewayData: {
      transactionId: "TXN-2026-003",
      amount: 885.00,
      currency: "USD",
      merchantId: "MER-00421",
      paymentMethod: "ach",
      timestamp: "2026-01-10T14:32:22.534Z",
      reference: "PAY-20260110-003",
      status: "SUCCESS"
    }
  }
};

type TransactionId = keyof typeof mockTransactionDetails;

function getMismatchedFields(bankData: Record<string, any>, gatewayData: Record<string, any>) {
  const mismatched: string[] = [];
  for (const key of Object.keys(bankData)) {
    if (gatewayData[key] !== undefined && bankData[key] !== gatewayData[key]) {
      mismatched.push(key);
    }
  }
  return mismatched;
}

export default function TransactionDetails() {
  const { id } = useParams<{ id: string }>();
  const [bankJsonOpen, setBankJsonOpen] = useState(false);
  const [gatewayJsonOpen, setGatewayJsonOpen] = useState(false);

  const transaction = mockTransactionDetails[id as TransactionId] || mockTransactionDetails["TXN-2026-001"];
  const mismatchedFields = getMismatchedFields(transaction.bankData, transaction.gatewayData);

  const timelineEvents = [
    { label: "Transaction Initiated", time: "14:32:14.000", status: "complete" },
    { label: "Bank Processing", time: transaction.bankTimestamp.split("T")[1].slice(0, 12), status: "complete" },
    { label: "Gateway Received", time: transaction.gatewayTimestamp.split("T")[1].slice(0, 12), status: transaction.status === "CRITICAL" ? "error" : "complete" },
    { label: "Reconciliation", time: "14:32:16.000", status: transaction.status === "MATCHED" ? "complete" : (transaction.status as string) === "WARNING" ? "warning" : "error" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "MATCHED": return "text-success";
      case "WARNING": return "text-warning";
      case "CRITICAL": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

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
          <h1 className="text-2xl font-bold text-foreground font-mono">{transaction.id}</h1>
          <span className={`text-sm font-medium ${getStatusColor(transaction.status)}`}>
            {transaction.status}
          </span>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="card-gradient rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Event Timeline</h2>
        <div className="relative">
          <div className="absolute top-6 left-6 right-6 h-0.5 bg-border" />
          <div className="flex justify-between">
            {timelineEvents.map((event, index) => (
              <div key={index} className="flex flex-col items-center relative z-10">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                  event.status === "complete" 
                    ? "bg-success/20 border-success" 
                    : event.status === "warning"
                    ? "bg-warning/20 border-warning"
                    : "bg-destructive/20 border-destructive"
                }`}>
                  {event.status === "complete" ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : event.status === "warning" ? (
                    <Clock className="h-5 w-5 text-warning" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <p className="mt-3 text-sm font-medium text-foreground text-center max-w-[100px]">{event.label}</p>
                <p className="text-xs text-muted-foreground font-mono">{event.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-side JSON Views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank JSON */}
        <Collapsible open={bankJsonOpen} onOpenChange={setBankJsonOpen}>
          <div className="card-gradient rounded-lg border border-border overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between p-5 border-b border-border hover:bg-muted/30 transition-colors">
              <h3 className="text-lg font-semibold text-foreground">Bank Data</h3>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${bankJsonOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-5">
                <pre className="text-sm font-mono bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  {Object.entries(transaction.bankData).map(([key, value]) => (
                    <div key={key} className={mismatchedFields.includes(key) ? "text-destructive font-bold" : "text-foreground"}>
                      <span className="text-primary">"{key}"</span>: <span className={mismatchedFields.includes(key) ? "text-destructive" : "text-muted-foreground"}>
                        {typeof value === "string" ? `"${value}"` : value}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Gateway JSON */}
        <Collapsible open={gatewayJsonOpen} onOpenChange={setGatewayJsonOpen}>
          <div className="card-gradient rounded-lg border border-border overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between p-5 border-b border-border hover:bg-muted/30 transition-colors">
              <h3 className="text-lg font-semibold text-foreground">Gateway Data</h3>
              <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${gatewayJsonOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-5">
                <pre className="text-sm font-mono bg-muted/30 rounded-lg p-4 overflow-x-auto">
                  {Object.entries(transaction.gatewayData).map(([key, value]) => (
                    <div key={key} className={mismatchedFields.includes(key) ? "text-destructive font-bold" : "text-foreground"}>
                      <span className="text-primary">"{key}"</span>: <span className={mismatchedFields.includes(key) ? "text-destructive" : "text-muted-foreground"}>
                        {typeof value === "string" ? `"${value}"` : value}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Mismatch Summary */}
      {mismatchedFields.length > 0 && (
        <div className="card-gradient rounded-lg border border-destructive/30 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <h3 className="text-sm font-semibold text-destructive">Mismatched Fields Detected</h3>
              <p className="text-sm text-muted-foreground">
                The following fields do not match: <span className="font-mono text-destructive">{mismatchedFields.join(", ")}</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
