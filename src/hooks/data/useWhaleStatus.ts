/**
 * useWhaleStatus Hook - Server-Side Whale Verification 🐋💎
 * 
 * Interfaces with the backend whale status endpoints for secure token gating
 * Replaces client-side RPC calls with server-side verification
 * 
 * @author DegenDuel Team
 * @created 2025-01-01
 */

import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '../../config/config';

export interface WhaleStatusData {
  is_whale: boolean;
  current_balance: number;
  required_balance: number;
  balance_percentage: number;
  whale_tier?: string;
  last_updated: string;
  next_refresh?: string;
}

export interface WhaleStatusResponse {
  success: boolean;
  data?: WhaleStatusData;
  error?: string;
  message?: string;
  metadata?: {
    threshold: number;
    refresh_interval: number;
  };
}

export interface UseWhaleStatusReturn {
  // Data
  whaleStatus: WhaleStatusData | null;
  isWhale: boolean;
  currentBalance: number;
  requiredBalance: number;
  progressPercentage: number;

  // State
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;

  // Actions
  refreshStatus: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

/**
 * Hook for server-side whale status verification
 * Uses the new backend endpoints for secure, unhackable verification
 */
export function useWhaleStatus(): UseWhaleStatusReturn {
  const [whaleStatus, setWhaleStatus] = useState<WhaleStatusData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch whale status from server
  const fetchWhaleStatus = useCallback(async () => {
    try {
      setError(null);

      const response = await fetch(`${API_URL}/user/whale-status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include auth cookies/tokens
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required');
        }
        if (response.status === 403) {
          throw new Error('Access denied');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: WhaleStatusResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to fetch whale status');
      }

      if (data.data) {
        setWhaleStatus(data.data);
        setLastUpdate(new Date());
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('[useWhaleStatus] Error fetching whale status:', err);
      setError(err.message || 'Failed to fetch whale status');
      setIsLoading(false);
    }
  }, []);

  // Force refresh via POST endpoint
  const forceRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/user/whale-status/refresh`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: WhaleStatusResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to refresh whale status');
      }

      if (data.data) {
        setWhaleStatus(data.data);
        setLastUpdate(new Date());
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('[useWhaleStatus] Error forcing refresh:', err);
      setError(err.message || 'Failed to refresh whale status');
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchWhaleStatus();
  }, [fetchWhaleStatus]);

  // Computed values
  const isWhale = whaleStatus?.is_whale || false;
  const currentBalance = whaleStatus?.current_balance || 0;
  const requiredBalance = whaleStatus?.required_balance || 1000000;
  const progressPercentage = whaleStatus?.balance_percentage || 0;

  return {
    // Data
    whaleStatus,
    isWhale,
    currentBalance,
    requiredBalance,
    progressPercentage,

    // State
    isLoading,
    error,
    lastUpdate,

    // Actions
    refreshStatus: fetchWhaleStatus,
    forceRefresh,
  };
}

export default useWhaleStatus; 