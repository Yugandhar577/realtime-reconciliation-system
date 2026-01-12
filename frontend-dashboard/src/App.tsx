import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { WebSocketProvider } from "@/components/WebSocketProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Overview from "./pages/Overview";
import Transactions from "./pages/Transactions";
import TransactionDetails from "./pages/TransactionDetails";
import Analytics from "./pages/Analytics";
import Simulation from "./pages/Simulation";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <WebSocketProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Overview />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/transaction/:id" element={<TransactionDetails />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/simulation" element={<Simulation />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </WebSocketProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
