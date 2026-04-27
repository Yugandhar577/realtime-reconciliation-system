import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { WebSocketProvider } from "@/components/WebSocketProvider";
import { Skeleton } from "@/components/ui/skeleton";

// Eager-load the landing page so first paint is instant
import Overview from "./pages/Overview";

// All other pages are lazy-loaded — split into separate chunks by Vite
const Transactions      = lazy(() => import("./pages/Transactions"));
const TransactionDetails = lazy(() => import("./pages/TransactionDetails"));
const Analytics         = lazy(() => import("./pages/Analytics"));
const Simulation        = lazy(() => import("./pages/Simulation"));
const SettingsPage      = lazy(() => import("./pages/SettingsPage"));
const NotFound          = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function PageSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-4 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}

const App = () => {
  return (
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
                  <Route path="/transactions" element={
                    <Suspense fallback={<PageSkeleton />}><Transactions /></Suspense>
                  } />
                  <Route path="/transaction/:id" element={
                    <Suspense fallback={<PageSkeleton />}><TransactionDetails /></Suspense>
                  } />
                  <Route path="/analytics" element={
                    <Suspense fallback={<PageSkeleton />}><Analytics /></Suspense>
                  } />
                  <Route path="/simulation" element={
                    <Suspense fallback={<PageSkeleton />}><Simulation /></Suspense>
                  } />
                  <Route path="/settings" element={
                    <Suspense fallback={<PageSkeleton />}><SettingsPage /></Suspense>
                  } />
                </Route>
                <Route path="*" element={
                  <Suspense fallback={<PageSkeleton />}><NotFound /></Suspense>
                } />
              </Routes>
            </BrowserRouter>
          </WebSocketProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
