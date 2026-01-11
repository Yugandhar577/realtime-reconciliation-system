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

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get recent transactions
  async getRecentTransactions(limit: number = 50): Promise<TransactionSummary[]> {
    return this.request(`/transactions/recent?limit=${limit}`);
  }

  // Get transaction by ID
  async getTransaction(id: string): Promise<TransactionSummary> {
    return this.request(`/transactions/${id}`);
  }

  // Get system metrics
  async getSystemMetrics(): Promise<SystemMetrics> {
    return this.request('/metrics');
  }

  // Search transactions
  async searchTransactions(query: {
    status?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<TransactionSummary[]> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.request(`/transactions/search?${params.toString()}`);
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
    return this.request('/transactions/stats');
  }
}

// Singleton instance
export const apiService = new ApiService();

// Helper hook for React Query
export const useApi = () => {
  return apiService;
};