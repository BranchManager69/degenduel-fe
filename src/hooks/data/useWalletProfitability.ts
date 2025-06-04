/**
 * useWalletProfitability Hook - Portfolio Performance Tracking
 * 
 * Simple hook to fetch wallet performance metrics for display enhancement
 * This is purely for showing additional info - doesn't affect access control
 * 
 * @author DegenDuel Team
 * @created 2025-01-01
 */

import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '../../config/config';

export interface WalletPerformanceData {
  totalPortfolioValue: number;
  pnl24h: number;
  volume24h: number;
  trades24h: number;
  winRate: number;
  lastUpdated: string;
}

export interface UseWalletProfitabilityReturn {
  // Data
  performanceData: WalletPerformanceData | null;

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching wallet performance metrics to enhance whale room display
 * This is purely additive - doesn't change any access rules
 */
export function useWalletProfitability(walletAddress?: string): UseWalletProfitabilityReturn {
  const [performanceData, setPerformanceData] = useState<WalletPerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch wallet performance data
  const fetchPerformanceData = useCallback(async () => {
    if (!walletAddress) {
      setPerformanceData(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/wallet-profitability/${walletAddress}/ongoing`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        // If endpoint doesn't exist yet, fail gracefully without errors
        if (response.status === 404) {
          setPerformanceData(null);
          setIsLoading(false);
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setPerformanceData({
          totalPortfolioValue: data.data.totalPortfolioValue || 0,
          pnl24h: data.data.last24h?.pnl || 0,
          volume24h: data.data.last24h?.volume || 0,
          trades24h: data.data.last24h?.trades || 0,
          winRate: data.data.winRate || 0,
          lastUpdated: data.data.timestamp || new Date().toISOString(),
        });
      }

      setIsLoading(false);
    } catch (err: any) {
      console.log('[useWalletProfitability] Info: Performance data not available yet');
      // Fail silently - this is an enhancement, not critical functionality
      setPerformanceData(null);
      setError(null); // Don't show errors for optional enhancement
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Initial load
  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  return {
    // Data
    performanceData,

    // State
    isLoading,
    error,

    // Actions
    refresh: fetchPerformanceData,
  };
}

export default useWalletProfitability; 