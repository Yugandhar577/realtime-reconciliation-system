// API service for REST endpoints
export interface TransactionSummary {
  id: string;
  transactionId: string;
  status: 'MATCHED' | 'MISMATCHED' | 'MISSING_CBS' | 'MISSING_GATEWAY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  createdAt: string;
  anomalies: string[];
  timeline: {
    processedAt?: string;
    receivedAt?: string;
    respondedAt?: string;
    firstSeenAt: string;
    lastUpdatedAt: string;
  };
}

export interface SystemMetrics {
  totalTransactions: number;
  matchedTransactions: number;
  mismatchedTransactions: number;
  missingTransactions: number;
  averageLatency: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface FaultStatus {
  activeFaults: Array<{
    type: string;
    target: string;
    enabled: boolean;
    expiresAt?: number;
  }>;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log('API request to:', url);

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        console.error(`API request failed: ${response.status} ${response.statusText}`);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      return data;
    } catch (error) {
      console.error('API request error:', error);
      // Return empty array for list endpoints, empty object for single items
      if (endpoint.includes('/recent') || endpoint.includes('/search')) {
        return [] as T;
      }
      throw error;
    }
  }

  // Validate and sanitize transaction data
  private validateTransaction(tx: any): tx is TransactionSummary {
    try {
      // Filter out invalid transactions
      if (!tx || tx.id === 'unknown' || tx.transactionId === 'unknown') {
        return false;
      }

      // Validate required fields
      if (!tx.transactionId || !tx.status) {
        return false;
      }

      // Validate dates
      if (tx.createdAt && isNaN(new Date(tx.createdAt).getTime())) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  // Get recent transactions
  async getRecentTransactions(limit: number = 50): Promise<TransactionSummary[]> {
    try {
      const data = await this.request<any[]>(`/transactions/recent?limit=${limit}`);
      // Filter out invalid transactions
      return data.filter(tx => this.validateTransaction(tx));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      return [];
    }
  }

  // Get transaction by ID
  async getTransaction(id: string): Promise<TransactionSummary> {
    try {
      const data = await this.request<any>(`/transactions/${id}`);
      if (!this.validateTransaction(data)) {
        throw new Error('Invalid transaction data');
      }
      return data;
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      throw error;
    }
  }

  // Get system metrics
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      return await this.request('/metrics');
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      // Return safe default metrics
      return {
        totalTransactions: 0,
        matchedTransactions: 0,
        mismatchedTransactions: 0,
        missingTransactions: 0,
        averageLatency: 0,
        systemHealth: 'warning' as const,
      };
    }
  }

  // Search transactions
  async searchTransactions(query: {
    status?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<TransactionSummary[]> {
    try {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const data = await this.request<any[]>(`/transactions/search?${params.toString()}`);
      return data.filter(tx => this.validateTransaction(tx));
    } catch (error) {
      console.error('Failed to search transactions:', error);
      return [];
    }
  }

  // Get transaction statistics
  async getTransactionStats(): Promise<{
    total: number;
    matched: number;
    mismatched: number;
    missing: number;
    bySeverity: Record<string, number>;
    recentActivity: Array<{ timestamp: string; count: number }>;
  }> {
    try {
      return await this.request('/transactions/stats');
    } catch (error) {
      console.error('Failed to fetch transaction stats:', error);
      // Return safe defaults
      return {
        total: 0,
        matched: 0,
        mismatched: 0,
        missing: 0,
        bySeverity: {},
        recentActivity: [],
      };
    }
  }

  // Analytics endpoints
  async getAnalyticsMismatches(): Promise<Array<{ time: string; count: number }>> {
    try {
      return await this.request('/analytics/mismatches');
    } catch (error) {
      console.error('Failed to fetch analytics mismatches:', error);
      return [];
    }
  }

  async getAnalyticsAnomalies(): Promise<Array<{ name: string; value: number }>> {
    try {
      return await this.request('/analytics/anomalies');
    } catch (error) {
      console.error('Failed to fetch analytics anomalies:', error);
      return [];
    }
  }

  async getAnalyticsLatency(): Promise<Array<{ range: string; count: number }>> {
    try {
      return await this.request('/analytics/latency');
    } catch (error) {
      console.error('Failed to fetch analytics latency:', error);
      return [];
    }
  }

  // Fault injection endpoints
  async getFaultStatus(): Promise<FaultStatus> {
    try {
      return await this.request('/faults/status');
    } catch (error) {
      console.error('Failed to fetch fault status:', error);
      return { activeFaults: [] };
    }
  }

  async injectFault(type: string, target: string, duration?: number): Promise<{ success: boolean; message: string }> {
    try {
      return await this.request('/faults/inject', {
        method: 'POST',
        body: JSON.stringify({ type, target, duration }),
      });
    } catch (error) {
      console.error('Failed to inject fault:', error);
      throw error;
    }
  }

  async clearFaults(): Promise<{ success: boolean; message: string }> {
    try {
      return await this.request('/faults/clear', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to clear faults:', error);
      throw error;
    }
  }
}

// Singleton instance
export const apiService = new ApiService('/api');

// Helper hook for React Query
export const useApi = () => {
  return apiService;
};