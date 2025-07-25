import { useEffect, useState } from 'react';

export interface PlatformStats {
  total_revenue: number;
  estimated_dividends_distributed: number;
  total_contest_entries: number;
  total_contests: number;
  paid_contests: number;
  free_contests: number;
}

export interface PlatformStatsResponse {
  success: boolean;
  stats: PlatformStats;
  metadata: {
    generated_at: string;
    note: string;
  };
}

export const usePlatformStats = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/platform-stats');
        if (!response.ok) {
          throw new Error(`Failed to fetch platform stats: ${response.statusText}`);
        }
        
        const data: PlatformStatsResponse = await response.json();
        
        if (data.success && data.stats) {
          setStats(data.stats);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        console.error('[usePlatformStats] Error fetching platform stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
};