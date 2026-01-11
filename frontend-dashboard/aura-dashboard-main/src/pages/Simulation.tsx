import { useState } from "react";
import { Zap, Wifi, AlertTriangle, Activity, RotateCcw, Play, Pause } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function Simulation() {
  const [simulationMode, setSimulationMode] = useState(false);
  const { toast } = useToast();

  const handleAction = (action: string, description: string) => {
    toast({
      title: `${action} Triggered`,
      description: description,
      duration: 3000,
    });
  };

  const actions = [
    { 
      label: "Inject Latency", 
      icon: Zap, 
      color: "warning",
      description: "Adds artificial delay (500ms) to simulate slow network conditions",
      onClick: () => handleAction("Inject Latency", "Adding 500ms delay to all transactions")
    },
    { 
      label: "Drop Packets", 
      icon: Wifi, 
      color: "destructive",
      description: "Simulates 10% packet loss on the gateway connection",
      onClick: () => handleAction("Drop Packets", "Simulating 10% packet loss on gateway connection")
    },
    { 
      label: "Corrupt Amounts", 
      icon: AlertTriangle, 
      color: "destructive",
      description: "Introduces random discrepancies in transaction amounts",
      onClick: () => handleAction("Corrupt Amounts", "Introducing random amount discrepancies")
    },
    { 
      label: "Traffic Burst", 
      icon: Activity, 
      color: "primary",
      description: "Generates high volume traffic (1000 TPS) to stress test",
      onClick: () => handleAction("Traffic Burst", "Generating 1000 transactions per second")
    },
  ];

  const getButtonStyles = (color: string) => {
    const styles = {
      primary: "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20",
      warning: "bg-warning/10 border-warning/30 text-warning hover:bg-warning/20",
      destructive: "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20",
    };
    return styles[color as keyof typeof styles];
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      {/* Simulation Mode Toggle */}
      <div className="card-gradient rounded-lg border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Simulation Mode</h2>
            <p className="text-sm text-muted-foreground">Enable to run test scenarios on the demo environment</p>
          </div>
          <div className="flex items-center gap-3">
            {simulationMode ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/30">
                <Play className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Active</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border">
                <Pause className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Inactive</span>
              </div>
            )}
            <Switch
              checked={simulationMode}
              onCheckedChange={(checked) => {
                setSimulationMode(checked);
                toast({
                  title: checked ? "Simulation Mode Enabled" : "Simulation Mode Disabled",
                  description: checked ? "All actions will now affect the test environment" : "Returning to monitoring mode",
                  duration: 2000,
                });
              }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="card-gradient rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Simulation Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={!simulationMode}
              className={`flex flex-col items-start gap-3 rounded-lg border p-5 text-left transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${getButtonStyles(action.color)}`}
            >
              <action.icon className="h-6 w-6" />
              <div>
                <span className="text-sm font-semibold block">{action.label}</span>
                <span className="text-xs opacity-80 block mt-1">{action.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Auto-Resolve */}
      <div className="card-gradient rounded-lg border border-border p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Auto-Resolve</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Automatically attempt to reconcile all pending transactions. This will match transactions 
              based on reference IDs and timestamps, then flag any remaining discrepancies for manual review.
            </p>
          </div>
        </div>
        <button
          onClick={() => handleAction("Auto-Resolve", "Attempting to automatically reconcile 247 pending transactions")}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-success/10 border border-success/30 py-3 text-sm font-medium text-success transition-all duration-200 hover:bg-success/20"
        >
          <RotateCcw className="h-4 w-4" />
          Auto-Resolve All Pending
        </button>
      </div>
    </div>
  );
}
