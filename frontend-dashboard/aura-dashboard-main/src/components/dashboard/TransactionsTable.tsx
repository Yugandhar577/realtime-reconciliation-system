import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  status: "completed" | "pending" | "failed";
  date: string;
  recipient: string;
}

const mockTransactions: Transaction[] = [
  { id: "TXN001", description: "Wire Transfer", amount: 12500.00, type: "credit", status: "completed", date: "Jan 8, 2026", recipient: "Acme Corp" },
  { id: "TXN002", description: "Subscription", amount: 299.00, type: "debit", status: "completed", date: "Jan 8, 2026", recipient: "AWS Services" },
  { id: "TXN003", description: "Invoice Payment", amount: 8750.00, type: "credit", status: "pending", date: "Jan 7, 2026", recipient: "TechStart Inc" },
  { id: "TXN004", description: "Refund", amount: 450.00, type: "credit", status: "completed", date: "Jan 7, 2026", recipient: "Customer Refund" },
  { id: "TXN005", description: "Payroll", amount: 45000.00, type: "debit", status: "completed", date: "Jan 6, 2026", recipient: "Employee Payroll" },
  { id: "TXN006", description: "Investment Return", amount: 3200.00, type: "credit", status: "completed", date: "Jan 6, 2026", recipient: "Investment Fund" },
  { id: "TXN007", description: "Software License", amount: 1200.00, type: "debit", status: "failed", date: "Jan 5, 2026", recipient: "Figma Enterprise" },
  { id: "TXN008", description: "Client Payment", amount: 15800.00, type: "credit", status: "completed", date: "Jan 5, 2026", recipient: "Global Solutions" },
];

export function TransactionsTable() {
  return (
    <div className="card-gradient rounded-lg border border-border">
      <div className="border-b border-border p-5">
        <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
        <p className="text-sm text-muted-foreground">Your latest financial activity</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Transaction</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Recipient</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</th>
              <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockTransactions.map((transaction, index) => (
              <tr 
                key={transaction.id} 
                className="transition-colors duration-200 hover:bg-card-elevated/50"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${transaction.type === "credit" ? "bg-success/10" : "bg-muted"}`}>
                      {transaction.type === "credit" ? (
                        <ArrowDownLeft className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{transaction.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{transaction.recipient}</td>
                <td className="px-5 py-4 text-sm text-muted-foreground">{transaction.date}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      transaction.status === "completed"
                        ? "bg-success/10 text-success"
                        : transaction.status === "pending"
                        ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {transaction.status}
                  </span>
                </td>
                <td className={`px-5 py-4 text-right text-sm font-medium ${transaction.type === "credit" ? "text-success" : "text-foreground"}`}>
                  {transaction.type === "credit" ? "+" : "-"}${transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
