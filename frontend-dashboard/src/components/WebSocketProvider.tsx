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
    // Connect to WebSocket on app startup
    websocketService.connect()
      .then(() => {
        toast({
          title: "Connected",
          description: "Real-time updates enabled",
        });
      })
      .catch((error) => {
        console.error('Failed to connect to WebSocket:', error);
        toast({
          title: "Connection Failed",
          description: "Real-time updates unavailable. Retrying...",
          variant: "destructive",
        });
      });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
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