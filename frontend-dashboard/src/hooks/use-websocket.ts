import { useEffect, useState, useCallback } from 'react';
import { websocketService, ReconciliationEvent, StatsEvent } from '@/lib/websocket';

export interface UseReconciliationEventsOptions {
  autoConnect?: boolean;
  onEvent?: (event: ReconciliationEvent) => void;
}

export function useReconciliationEvents(options: UseReconciliationEventsOptions = {}) {
  const { autoConnect = true, onEvent } = options;
  const [events, setEvents] = useState<ReconciliationEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  useEffect(() => {
    if (!autoConnect) return;

    // Connect to WebSocket
    websocketService.connect().catch(console.error);

    // Listen for reconciliation events
    const handleReconciliationEvent = (event: ReconciliationEvent) => {
      setEvents(prev => [event, ...prev.slice(0, 99)]); // Keep last 100 events
      onEvent?.(event);
    };

    websocketService.on('reconciliation-event', handleReconciliationEvent);

    // Monitor connection state
    const checkConnection = () => {
      setIsConnected(websocketService.isConnected);
      setConnectionState(websocketService.connectionState);
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection();

    return () => {
      websocketService.off('reconciliation-event', handleReconciliationEvent);
      clearInterval(interval);
    };
  }, [autoConnect, onEvent]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    isConnected,
    connectionState,
    clearEvents,
  };
}

export function useSystemStats() {
  const [stats, setStats] = useState<StatsEvent['data'] | null>(null);

  useEffect(() => {
    const handleStatsEvent = (event: StatsEvent) => {
      setStats(event.data);
    };

    websocketService.on('stats', handleStatsEvent);

    return () => {
      websocketService.off('stats', handleStatsEvent);
    };
  }, []);

  return stats;
}

export function useWebSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(websocketService.isConnected);
      setConnectionState(websocketService.connectionState);
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection();

    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(() => {
    websocketService.connect().catch(console.error);
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  return {
    isConnected,
    connectionState,
    connect,
    disconnect,
  };
}