/**
 * useWhaleStatus Hook - Server-Side Whale Verification 🐋💎
 * 
 * Interfaces with the backend whale status endpoints for secure token gating
 * Replaces client-side RPC calls with server-side verification
 * 
 * @author DegenDuel Team
 * @created 2025-01-01
 * @updated 2025-01-20
 */

import { useCallback, useEffect, useState } from 'react';
import { ddApi } from '../../services/dd-api';

export interface WhaleTier {
  key: string;
  name: string;
  min: number;
  max: number;
}

export interface WhaleStatusData {
  is_whale: boolean;
  current_balance: number;
  required_balance: number;
  balance_percentage: number;
  whale_tier: string;
  tier_name: string;
  last_updated: string;
  next_refresh?: string;
  refresh_triggered?: boolean; // For POST responses
}

export interface WhaleStatusMetadata {
  threshold: number;
  refresh_interval: number;
  data_source: string;
  tiers: WhaleTier[];
}

export interface WhaleStatusResponse {
  success: boolean;
  data?: WhaleStatusData;
  error?: string;
  message?: string;
  metadata?: WhaleStatusMetadata;
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

// FIXED: Add optional authentication parameter
export interface UseWhaleStatusOptions {
  isAuthenticated?: boolean;
  userId?: string;
}

/**
 * Hook for server-side whale status verification
 * Uses the new backend endpoints for secure, unhackable verification
 * 
 * @param options - Optional configuration including authentication state
 */
export function useWhaleStatus(options: UseWhaleStatusOptions = {}): UseWhaleStatusReturn {
  const { isAuthenticated = false, userId } = options;

  const [whaleStatus, setWhaleStatus] = useState<WhaleStatusData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false); // FIXED: Start as false when not authenticated
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch whale status from server
  const fetchWhaleStatus = useCallback(async () => {
    // FIXED: Only fetch if authenticated
    if (!isAuthenticated) {
      // Set default non-whale status for unauthenticated users
      setWhaleStatus({
        is_whale: false,
        current_balance: 0,
        required_balance: 1000000,
        balance_percentage: 0,
        whale_tier: 'none',
        tier_name: 'Not Connected',
        last_updated: new Date().toISOString()
      });
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use the standardized API client from ddApi
      const data: WhaleStatusResponse = await ddApi.users.getWhaleStatus();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to fetch whale status');
      }

      if (data.data) {
        setWhaleStatus(data.data);
        setLastUpdate(new Date());
      }

      setIsLoading(false);
    } catch (err: any) {
      // Handle authentication errors gracefully for browsing users
      if (err.message?.includes('authentication') || err.message?.includes('unauthorized') || err.message?.includes('401')) {
        console.log('[useWhaleStatus] User not authenticated - setting default non-whale status');
        setWhaleStatus({
          is_whale: false,
          current_balance: 0,
          required_balance: 1000000,
          balance_percentage: 0,
          whale_tier: 'none',
          tier_name: 'Not Connected',
          last_updated: new Date().toISOString()
        });
        setError(null); // Don't show error to browsing users
      } else {
        console.error('[useWhaleStatus] Error fetching whale status:', err);
        setError(err.message || 'Failed to fetch whale status');
      }
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Force refresh via POST endpoint
  const forceRefresh = useCallback(async () => {
    // FIXED: Only refresh if authenticated
    if (!isAuthenticated) {
      console.log('[useWhaleStatus] User not authenticated - cannot refresh whale status');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Use the standardized API client from ddApi
      const data: WhaleStatusResponse = await ddApi.users.refreshWhaleStatus();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Failed to refresh whale status');
      }

      if (data.data) {
        setWhaleStatus(data.data);
        setLastUpdate(new Date());
      }

      setIsLoading(false);
    } catch (err: any) {
      // Handle authentication errors gracefully for browsing users
      if (err.message?.includes('authentication') || err.message?.includes('unauthorized') || err.message?.includes('401')) {
        console.log('[useWhaleStatus] User not authenticated - cannot refresh whale status');
        setError(null); // Don't show any error to browsing users
      } else {
        console.error('[useWhaleStatus] Error forcing refresh:', err);
        setError(err.message || 'Failed to refresh whale status');
      }
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // FIXED: Only fetch on authentication state change, not on mount
  useEffect(() => {
    fetchWhaleStatus();
  }, [isAuthenticated, userId, fetchWhaleStatus]);

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