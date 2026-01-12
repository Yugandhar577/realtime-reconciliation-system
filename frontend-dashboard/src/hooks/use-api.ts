import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService, TransactionSummary, SystemMetrics } from '@/lib/api';

export function useRecentTransactions(limit: number = 50) {
  return useQuery({
    queryKey: ['transactions', 'recent', limit],
    queryFn: () => apiService.getRecentTransactions(limit),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transactions', id],
    queryFn: () => apiService.getTransaction(id),
    enabled: !!id,
  });
}

export function useSystemMetrics() {
  return useQuery({
    queryKey: ['metrics'],
    queryFn: () => apiService.getSystemMetrics(),
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

export function useTransactionStats() {
  return useQuery({
    queryKey: ['transactions', 'stats'],
    queryFn: () => apiService.getTransactionStats(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useSearchTransactions() {
  const queryClient = useQueryClient();

  const searchMutation = useMutation({
    mutationFn: (query: Parameters<typeof apiService.searchTransactions>[0]) =>
      apiService.searchTransactions(query),
    onSuccess: (data) => {
      // Cache the search results
      queryClient.setQueryData(['transactions', 'search', JSON.stringify(searchMutation.variables)], data);
    },
  });

  return {
    search: searchMutation.mutate,
    isSearching: searchMutation.isPending,
    searchResults: searchMutation.data,
    error: searchMutation.error,
  };
}

// Prefetch hook for better UX
export function usePrefetchTransaction(id: string) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ['transactions', id],
      queryFn: () => apiService.getTransaction(id),
      staleTime: 60000, // Keep in cache for 1 minute
    });
  }, [queryClient, id]);
}