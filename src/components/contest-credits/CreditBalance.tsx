import { useState, useEffect } from 'react';
import { User } from '../../types/user';

interface CreditBalance {
  available_credits: number;
  total_lifetime_credits: number;
  recent_usage: Array<{
    id: string;
    used_at: string;
    contest?: {
      name: string;
    };
  }>;
}

interface CreditConfig {
  tokens_per_credit: number;
  token_symbol: string;
  purchase_enabled: boolean;
}

interface CreditBalanceProps {
  user: User;
  config: CreditConfig;
}

export default function CreditBalance({ user }: CreditBalanceProps) {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
  }, [user]);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/contests/credits/balance', {
        headers: {
          'Authorization': `Bearer ${(user as any).ddJwt}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBalance(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-600 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-600 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200">
      <h2 className="text-2xl font-bold text-white mb-6">Your Credits</h2>
      
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-indigo-400 mb-2">
          {balance?.available_credits || 0}
        </div>
        <div className="text-gray-400">Available Credits</div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-3 md:p-4 text-center hover:bg-gray-700/70 transition-colors">
          <div className="text-xl font-semibold text-white">
            {balance?.total_lifetime_credits || 0}
          </div>
          <div className="text-sm text-gray-400">Total Lifetime</div>
        </div>
        <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-3 md:p-4 text-center hover:bg-gray-700/70 transition-colors">
          <div className="text-xl font-semibold text-white">
            {balance?.recent_usage?.length || 0}
          </div>
          <div className="text-sm text-gray-400">Recently Used</div>
        </div>
      </div>

      {balance?.recent_usage && balance.recent_usage.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Recent Usage</h3>
          <div className="space-y-2">
            {balance.recent_usage.slice(0, 3).map(usage => (
              <div key={usage.id} className="flex justify-between items-center bg-gray-700/30 backdrop-blur-sm rounded-lg p-3 hover:bg-gray-700/50 transition-colors">
                <span className="text-gray-300">
                  {usage.contest?.name || 'Contest'}
                </span>
                <span className="text-sm text-gray-400">
                  {new Date(usage.used_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}