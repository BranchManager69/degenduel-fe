// src/hooks/data/useWalletAnalysis.ts

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { WalletAnalysisResponse, WalletAnalysisError } from "../../types/wallet-analysis";

interface UseWalletAnalysisOptions {
  enabled?: boolean;
  onSuccess?: (data: WalletAnalysisResponse) => void;
  onError?: (error: Error) => void;
}

export function useWalletAnalysis(
  walletAddress: string | null | undefined,
  options: UseWalletAnalysisOptions = {}
) {
  const { enabled = true, onSuccess, onError } = options;
  
  const [data, setData] = useState<WalletAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWalletAnalysis = useCallback(async () => {
    if (!walletAddress || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://degenduel.me/api/wallet-analysis/${walletAddress}`,
        {
          headers: {
            "Accept": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
        }
        
        const errorData = await response.json() as WalletAnalysisError;
        throw new Error(errorData.message || `Failed to fetch wallet analysis: ${response.statusText}`);
      }

      const result = await response.json() as WalletAnalysisResponse;
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch wallet analysis");
      setError(error);
      onError?.(error);
      
      // Only show toast for non-rate-limit errors
      if (!error.message.includes("Rate limit")) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, enabled, onSuccess, onError]);

  useEffect(() => {
    fetchWalletAnalysis();
  }, [fetchWalletAnalysis]);

  const refetch = useCallback(() => {
    return fetchWalletAnalysis();
  }, [fetchWalletAnalysis]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}