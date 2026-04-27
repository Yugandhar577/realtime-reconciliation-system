import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { websocketService } from '@/lib/websocket';
import { useToast } from '@/hooks/use-toast';

interface WebSocketContextType {
  isConnected: boolean;
  connectionState: string;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  useEffect(() => {
    // Connect to WebSocket on app startup (non-blocking)
    const connectWebSocket = async () => {
      try {
        await websocketService.connect();
        toast({
          title: "Connected",
          description: "Real-time updates enabled",
        });
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        // Don't show error toast on initial load, just log it
      }
    };

    connectWebSocket();

    const syncConnectionState = () => {
      setIsConnected(websocketService.isConnected);
      setConnectionState(websocketService.connectionState);
    };

    const interval = setInterval(syncConnectionState, 500);
    syncConnectionState();

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      try {
        websocketService.disconnect();
      } catch (error) {
        console.error('Error disconnecting WebSocket:', error);
      }
    };
  }, [toast]);

  const contextValue: WebSocketContextType = {
    isConnected,
    connectionState,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}