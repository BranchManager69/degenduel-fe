import { useEffect } from 'react';
import { useStore } from '../store/useStore';

interface WebSocketMetrics {
  totalConnections: number;
  activeSubscriptions: number;
  messageCount: number;
  errorCount: number;
  cacheHitRate: number;
  averageLatency: number;
  lastUpdate: string;
}

interface WebSocketPerformance {
  messageRate: number;
  errorRate: number;
  latencyTrend: number[];
}

interface WebSocketService {
  name: string;
  status: 'operational' | 'degraded' | 'error';
  metrics: WebSocketMetrics;
  performance: WebSocketPerformance;
  config?: {
    maxMessageSize: number;
    rateLimit: number;
    requireAuth: boolean;
  };
}

interface WebSocketSystemHealth {
  status: 'operational' | 'degraded' | 'error';
  activeConnections: number;
  messageRate: number;
  activeIncidents: number;
  lastUpdate: string;
}

interface WebSocketState {
  systemHealth: WebSocketSystemHealth;
  services: WebSocketService[];
}

export const useWebSocketMonitor = () => {
  const { setWebSocketState, addWebSocketAlert } = useStore();

  useEffect(() => {
    let ws: WebSocket | null = null;

    const connect = () => {
      ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/superadmin/ws/monitor`);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'system:health':
              setWebSocketState((prev) => ({
                ...prev,
                systemHealth: data.data
              }));
              break;

            case 'service:metrics':
              setWebSocketState((prev) => ({
                ...prev,
                services: prev.services.map((service) =>
                  service.name === data.service
                    ? {
                        ...service,
                        metrics: data.data.metrics,
                        performance: data.data.performance,
                        status: data.data.status
                      }
                    : service
                )
              }));
              break;

            case 'service:alert':
              addWebSocketAlert({
                type: data.data.severity,
                title: `${data.service} Alert`,
                message: data.data.message
              });
              break;

            default:
              console.warn('Unknown WebSocket message type:', data.type);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        // Attempt to reconnect after 5 seconds
        setTimeout(connect, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        addWebSocketAlert({
          type: 'error',
          title: 'WebSocket Error',
          message: 'Connection error occurred'
        });
      };
    };

    connect();

    // Cleanup
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);
};

export type {
  WebSocketMetrics,
  WebSocketPerformance,
  WebSocketService,
  WebSocketSystemHealth,
  WebSocketState
}; 