/// <reference types="vite/client" />

// Extend Window interface for Terminal data service
interface Window {
  // WebSocketContext global reference for utilities
  // This allows non-React utilities to access the WebSocket connection
  __DD_WEBSOCKET_CONTEXT?: {
    sendMessage: (message: any) => boolean;
    isConnected: boolean;
  };

  // Connectivity testing function for development
  testDegenDuelConnectivity: () => Promise<void>;
}
