import { useState } from "react";
import { Zap, Wifi, AlertTriangle, Activity, RotateCcw, Play, Pause } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export function SimulationControls() {
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
      onClick: () => handleAction("Inject Latency", "Adding 500ms delay to all transactions")
    },
    { 
      label: "Drop Packets", 
      icon: Wifi, 
      color: "destructive",
      onClick: () => handleAction("Drop Packets", "Simulating 10% packet loss on gateway connection")
    },
    { 
      label: "Corrupt Amounts", 
      icon: AlertTriangle, 
      color: "destructive",
      onClick: () => handleAction("Corrupt Amounts", "Introducing random amount discrepancies")
    },
    { 
      label: "Traffic Burst", 
      icon: Activity, 
      color: "primary",
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
    <div className="card-gradient rounded-lg border border-border p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Simulation Controls</h3>
          <p className="text-sm text-muted-foreground">Test system resilience</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Simulation Mode</span>
          <div className="flex items-center gap-2">
            {simulationMode ? (
              <Play className="h-4 w-4 text-success" />
            ) : (
              <Pause className="h-4 w-4 text-muted-foreground" />
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            disabled={!simulationMode}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${getButtonStyles(action.color)}`}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs font-medium text-center">{action.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => handleAction("Auto-Resolve", "Attempting to automatically reconcile 247 pending transactions")}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-success/10 border border-success/30 py-3 text-sm font-medium text-success transition-all duration-200 hover:bg-success/20"
      >
        <RotateCcw className="h-4 w-4" />
        Auto-Resolve All Pending
      </button>
    </div>
  );
}
