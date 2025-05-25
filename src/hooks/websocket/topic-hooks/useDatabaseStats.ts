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
  const [error, setError] = useState<string | null>(null);

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

      // Handle errors (should be rare since this is public data)
      if (message.code === 4003 || message.error?.includes('Authentication required')) {
        setError('Database stats temporarily unavailable');
      } else if (message.code === 4012 || message.error?.includes('Admin/superadmin role required')) {
        setError('Database stats access issue (this should not happen for public data)');
      } else {
        setError(message.error || 'Database stats unavailable');
      }
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

    console.log('[Database Stats] Attempting to subscribe to system topic...');

    // Subscribe to SYSTEM topic (public)
    ws.subscribe(['system']);

    // Fetch initial data
    fetchDatabaseStats();

    return () => {
      if (ws.isConnected) {
        ws.unsubscribe(['system']);
      }
    };
  }, [ws.isConnected]); // FIXED: Removed fetchDatabaseStats from dependencies

  // Auto-refresh every 30 seconds - FIXED: Remove dependency on data to prevent infinite loops
  useEffect(() => {
    if (!ws.isConnected) return;

    const interval = setInterval(() => {
      // Direct request instead of calling fetchDatabaseStats to avoid circular dependency
      if (ws.isConnected) {
        setIsLoading(true);
        ws.request(SOCKET_TYPES.SYSTEM, 'getDatabaseStats');
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [ws.isConnected]); // FIXED: Removed fetchDatabaseStats dependency

  return {
    data,
    isLoading,
    isConnected: ws.isConnected,
    error: error || ws.error,
    lastUpdate,
    refreshData: fetchDatabaseStats
  };
} 