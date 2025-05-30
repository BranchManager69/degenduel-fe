import { useState, useEffect } from 'react';
import { User } from '../../types/user';

interface CreditHistoryItem {
  id: string;
  source: string;
  status: 'active' | 'used' | 'expired';
  created_at: string;
  used_at?: string;
  receipt_number?: string;
  contest?: {
    name: string;
  };
}

interface CreditHistoryProps {
  user: User;
}

export default function CreditHistory({ user }: CreditHistoryProps) {
  const [history, setHistory] = useState<CreditHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'used'>('all');

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    try {
      const url = filter === 'all'
        ? '/api/contests/credits/history'
        : `/api/contests/credits/history?status=${filter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${(user as any).ddJwt}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setHistory(data.data.credits || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-900/30 text-green-400 border-green-600/30',
      used: 'bg-gray-900/30 text-gray-400 border-gray-600/30',
      expired: 'bg-red-900/30 text-red-400 border-red-600/30'
    };
    return `px-2 py-1 rounded-full text-xs border ${colors[status as keyof typeof colors] || 'bg-gray-900/30 text-gray-400 border-gray-600/30'}`;
  };

  const filterOptions = [
    { key: 'all', label: 'All Credits' },
    { key: 'active', label: 'Active' },
    { key: 'used', label: 'Used' }
  ] as const;

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Credit History</h2>

      <div className="flex space-x-2 mb-6">
        {filterOptions.map(option => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === option.key 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-700/50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="h-4 bg-gray-600 rounded w-1/4"></div>
                <div className="h-6 bg-gray-600 rounded w-16"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-600 rounded w-1/3"></div>
                <div className="h-3 bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">No credits found</div>
          <div className="text-sm text-gray-500">
            {filter === 'all' 
              ? 'You haven\'t purchased any credits yet.' 
              : `No ${filter} credits found.`}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(credit => (
            <div key={credit.id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-white font-medium">{credit.source}</span>
                  <span className={getStatusBadge(credit.status)}>
                    {credit.status.charAt(0).toUpperCase() + credit.status.slice(1)}
                  </span>
                </div>
                {credit.receipt_number && (
                  <span className="text-xs text-gray-400 font-mono">
                    #{credit.receipt_number}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="text-gray-400">
                  <span className="text-gray-500">Created:</span> {new Date(credit.created_at).toLocaleDateString()}
                </div>
                
                {credit.used_at && (
                  <div className="text-gray-400">
                    <span className="text-gray-500">Used:</span> {new Date(credit.used_at).toLocaleDateString()}
                  </div>
                )}
                
                {credit.contest && (
                  <div className="text-gray-400">
                    <span className="text-gray-500">Contest:</span> {credit.contest.name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}