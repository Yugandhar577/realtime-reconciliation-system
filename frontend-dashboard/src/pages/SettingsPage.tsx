import { Sun, Moon, RotateCcw, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const handleResetData = () => {
    toast({
      title: "Demo Data Reset",
      description: "All mock data has been restored to default values",
      duration: 3000,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Theme Toggle */}
      <div className="card-gradient rounded-lg border border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-primary/10" : "bg-warning/10"}`}>
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-warning" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Theme</h3>
              <p className="text-sm text-muted-foreground">
                {theme === "dark" ? "Dark mode is active" : "Light mode is active"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
            <Moon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Reset Demo Data
      <div className="card-gradient rounded-lg border border-border p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-lg bg-warning/10">
            <RotateCcw className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Reset Demo Data</h3>
            <p className="text-sm text-muted-foreground">Restore all mock data to default values</p>
          </div>
        </div>
        <button
          onClick={handleResetData}
          className="w-full rounded-lg border border-border bg-muted/50 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted"
        >
          Reset All Data
        </button>
      </div> */}

      {/* System Info */}
      <div className="card-gradient rounded-lg border border-border p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">System Information</h3>
            <p className="text-sm text-muted-foreground">Application details and version</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">App Version</span>
            <span className="font-mono text-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Build</span>
            <span className="font-mono text-foreground">2026.01.10</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border">
            <span className="text-muted-foreground">Environment</span>
            <span className="font-mono text-foreground">Demo</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">API Status</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="font-mono text-success">Connected</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
