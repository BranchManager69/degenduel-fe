/**
 * useDatabaseStats Hook
 * 
 * Public hook for accessing database statistics via SYSTEM WebSocket topic
 * NO AUTHENTICATION REQUIRED - public data
 */

import { useCallback, useEffect, useState } from 'react';
import { DDExtendedMessageType, SOCKET_TYPES } from '../types';
import { useUnifiedWebSocket } from '../useUnifiedWebSocket';

export interface DatabaseStats {
  active_tokens: number;
  total_tokens: number;
  active_percentage: string;
  timestamp: string;
}

/**
 * Hook for accessing database statistics via public SYSTEM WebSocket
 * 
 * @returns Database stats, loading state, and refresh function
 */
export function useDatabaseStats() {
  const [data, setData] = useState<DatabaseStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Process incoming messages
  const handleMessage = useCallback((message: any) => {
    if (message.type === 'RESPONSE' &&
      message.action === 'getDatabaseStats' &&
      message.data) {
      console.log('[Database Stats] Received data:', message.data);
      setData(message.data);
      setIsLoading(false);
      setLastUpdate(new Date(message.data.timestamp));
    }

    if (message.type === 'ERROR') {
      console.error('[Database Stats] WebSocket error:', message);
      setIsLoading(false);
    }
  }, []);

  // Set up WebSocket connection (NO AUTH REQUIRED - SYSTEM topic)
  const ws = useUnifiedWebSocket(
    'database-stats-hook',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.ERROR, DDExtendedMessageType.ACKNOWLEDGMENT],
    handleMessage,
    [SOCKET_TYPES.SYSTEM] // Public topic - no auth needed!
  );

  // Fetch latest database stats
  const fetchDatabaseStats = useCallback(() => {
    if (!ws.isConnected) {
      return false;
    }

    setIsLoading(true);
    return ws.request(SOCKET_TYPES.SYSTEM, 'getDatabaseStats');
  }, [ws]);

  // Request initial data when connected
  useEffect(() => {
    if (!ws.isConnected) return;

    // Subscribe to SYSTEM topic (public)
    ws.subscribe(['system']);

    // Fetch initial data
    fetchDatabaseStats();

    return () => {
      if (ws.isConnected) {
        ws.unsubscribe(['system']);
      }
    };
  }, [ws.isConnected]); // Removed fetchDatabaseStats dependency

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!data) return;

    const interval = setInterval(() => {
      fetchDatabaseStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [data]); // Removed fetchDatabaseStats dependency

  return {
    data,
    isLoading,
    isConnected: ws.isConnected,
    error: ws.error,
    lastUpdate,
    refreshData: fetchDatabaseStats
  };
} 