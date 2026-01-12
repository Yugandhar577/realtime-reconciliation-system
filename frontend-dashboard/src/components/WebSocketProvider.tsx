import { createContext, useContext, useEffect, ReactNode } from 'react';
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

    // Cleanup on unmount
    return () => {
      try {
        websocketService.disconnect();
      } catch (error) {
        console.error('Error disconnecting WebSocket:', error);
      }
    };
  }, [toast]);

  const contextValue: WebSocketContextType = {
    isConnected: websocketService.isConnected,
    connectionState: websocketService.connectionState,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}