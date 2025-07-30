import { useEffect, useState } from 'react';

export interface PlatformStats {
  total_revenue: number;
  estimated_dividends_distributed: number;
  total_contest_entries: number;
  total_contests: number;
  paid_contests: number;
  free_contests: number;
  total_users: number;
  active_tokens: number;
  global_high_score: {
    portfolio_value_usd: number;
    portfolio_value_sol: number;
    initial_balance_usd: number;
    initial_balance_sol: number;
    percentage_gain: number;
    contest_id: number;
    contest_name: string;
    contest_image_url: string;
    contest_start_time: string;
    historical_sol_price: {
      price: number;
      timestamp: string;
    };
    user_id: number;
    nickname: string;
    profile_image_url: string;
    experience_points: number;
    user_level_id: number;
    level: number;
    level_title: string;
  };
  recent_contest_winner: {
    portfolio_value_usd: number;
    portfolio_value_sol: number;
    initial_balance_usd: number;
    initial_balance_sol: number;
    percentage_gain: number;
    contest_id: number;
    contest_name: string;
    contest_image_url: string;
    contest_start_time: string;
    historical_sol_price: {
      price: number;
      timestamp: string;
    };
    user_id: number;
    nickname: string;
    profile_image_url: string;
    experience_points: number;
    user_level_id: number;
    level: number;
    level_title: string;
  };
  token_discovery: {
    discovered_today: number;
    discovered_this_week: number;
    by_source: {
      dual_detection: number;
      legacy: number;
    };
    recent_tokens: Array<{
      id: number;
      address: string;
      symbol: string;
      name: string;
      source: string;
      created_at: string;
      is_active: boolean;
      manually_activated: boolean;
      image_url: string | null;
    }>;
  };
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