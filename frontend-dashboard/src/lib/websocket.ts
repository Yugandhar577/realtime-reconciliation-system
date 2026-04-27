// WebSocket service for real-time reconciliation updates
export interface ReconciliationEvent {
  type: 'reconciliation-event';
  transactionId: string;
  classification: 'MATCHED' | 'MISMATCHED' | 'MISSING_CBS' | 'MISSING_GATEWAY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  cbsEventId?: string;
  gatewayEventId?: string;
  timeline: {
    processedAt?: string;
    receivedAt?: string;
    respondedAt?: string;
    firstSeenAt: string;
    lastUpdatedAt: string;
  };
  createdAt: string;
  anomalies: string[];
  recommendedAction: string;
}

export interface StatsEvent {
  type: 'stats';
  data: {
    activeConnections: number;
    timestamp: string;
  };
}

type WebSocketEvent = ReconciliationEvent | StatsEvent;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000; // 3 seconds
  private listeners: Map<string, ((event: WebSocketEvent) => void)[]> = new Map();

  constructor(private url?: string) { }

  private resolveWebSocketUrl(): string {
    if (!this.url) {
      return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
    }

    // Keep explicit WS(S) URLs untouched.
    if (this.url.startsWith('ws://') || this.url.startsWith('wss://')) {
      return this.url;
    }

    // Convert HTTP(S) endpoints to WS(S).
    if (this.url.startsWith('http://') || this.url.startsWith('https://')) {
      return this.url.replace(/^http/, 'ws');
    }

    // Support relative websocket paths such as "/ws" from env vars.
    if (this.url.startsWith('/')) {
      return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${this.url}`;
    }

    // Fallback for host:port style values.
    return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${this.url}`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        const wsUrl = this.resolveWebSocketUrl();
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected to reconciliation engine');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            // If backend wraps reconciliation event in { type, data }, unwrap it
            if (parsed && parsed.type === 'reconciliation-event' && parsed.data) {
              const payload = Object.assign({}, parsed.data, { type: parsed.type });
              console.log('WebSocket received reconciliation-event (unwrapped):', payload);
              this.notifyListeners(parsed.type, payload as WebSocketEvent);
            } else {
              const data: WebSocketEvent = parsed;
              console.log('WebSocket received message:', data);
              this.notifyListeners(data.type || 'reconciliation-event', data);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket connection closed');
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(() => {
        this.attemptReconnect();
      });
    }, this.reconnectInterval);
  }

  // Event listener management
  on(eventType: string, callback: (event: WebSocketEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  off(eventType: string, callback: (event: WebSocketEvent) => void): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(eventType: string, event: WebSocketEvent): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  // Connection status
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionState(): string {
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService(import.meta.env.VITE_WS_URL);

// Helper hook for React components
export const useWebSocket = () => {
  return websocketService;
};