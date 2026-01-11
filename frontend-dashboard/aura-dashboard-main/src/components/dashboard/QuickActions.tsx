import { Send, Download, CreditCard, Users, Plus } from "lucide-react";

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "primary" | "success" | "warning";
}

const actions: QuickAction[] = [
  { label: "Send Money", icon: Send, color: "primary" },
  { label: "Request", icon: Download, color: "success" },
  { label: "Cards", icon: CreditCard, color: "warning" },
  { label: "Recipients", icon: Users, color: "primary" },
];

export function QuickActions() {
  return (
    <div className="card-gradient rounded-lg border border-border p-5">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-card-elevated/50 p-4 transition-all duration-200 hover:border-primary/30 hover:glow-primary"
          >
            <div
              className={`rounded-lg p-2.5 transition-colors duration-200 ${
                action.color === "primary"
                  ? "bg-primary/10 group-hover:bg-primary/20"
                  : action.color === "success"
                  ? "bg-success/10 group-hover:bg-success/20"
                  : "bg-warning/10 group-hover:bg-warning/20"
              }`}
            >
              <action.icon
                className={`h-5 w-5 ${
                  action.color === "primary"
                    ? "text-primary"
                    : action.color === "success"
                    ? "text-success"
                    : "text-warning"
                }`}
              />
            </div>
            <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
              {action.label}
            </span>
          </button>
        ))}
      </div>
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-primary/50 hover:text-primary">
        <Plus className="h-4 w-4" />
        Add Action
      </button>
    </div>
  );
}
