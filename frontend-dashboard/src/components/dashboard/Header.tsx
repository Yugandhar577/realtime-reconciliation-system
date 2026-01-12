import { Search, Settings, Bell, ChevronDown } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">F</span>
          </div>
          <span className="text-xl font-semibold text-gradient-primary">FinFlow</span>
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#" className="text-sm font-medium text-foreground">Dashboard</a>
          <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Transactions</a>
          <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Analytics</a>
          <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Cards</a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-48 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
        </div>
        <button className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-card-elevated hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
        </button>
        <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-card-elevated hover:text-foreground">
          <Settings className="h-5 w-5" />
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:bg-card-elevated">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
            JD
          </div>
          <span className="hidden text-sm font-medium text-foreground md:block">Yugandhar Paulbudhe</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
