// src/components/DuelSnapshotTable.tsx

/**
 * DUEL Snapshot Table Component
 * 
 * @description Table component for displaying DUEL token daily snapshots
 * Shows Date, DUEL Balance, Dividend %, and Total Supply in a clean table format
 * 
 * @author BranchManager69
 * @created 2025-07-24
 */

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import NanoLogo from './logo/NanoLogo';

interface BalanceDataPoint {
  id: number;
  balance_lamports: string;
  balance_duel: number;
  timestamp: string;
  total_registered_supply?: number;
  dividend_percentage?: number;
}

interface UserData {
  nickname: string;
  username: string;
  role: string;
  experience_points: number;
  profile_image_url?: string;
  user_level?: {
    level_number: number;
    title: string;
  } | null;
}

interface ApiResponse {
  success: boolean;
  balances: BalanceDataPoint[];
  wallet: UserData;
}

interface DuelSnapshotTableProps {
  className?: string;
}

export const DuelSnapshotTable: React.FC<DuelSnapshotTableProps> = ({
  className = '',
}) => {
  const [tableData, setTableData] = useState<BalanceDataPoint[]>([]);
  const [, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format date nicely (e.g., "Jul 23, 2025")
  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format large numbers (e.g., 31.7M for balance)
  const formatNumber = (value: number): string => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    } else {
      return value.toLocaleString();
    }
  };

  // Format percentage (e.g., 20.67%)
  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  // Fetch snapshot data
  const fetchSnapshotData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = {
        view: 'snapshot',
        timeframe: 'all',
        limit: 1000
      };
      
      const response = await axios.get('/api/user/duel-balance-history', { params });
      
      if (response.data && response.data.success) {
        const data: ApiResponse = response.data;
        
        // Sort by timestamp descending (newest first)
        const sortedData = [...data.balances].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setTableData(sortedData);
        setUserData(data.wallet);
      } else {
        throw new Error('Failed to fetch snapshot data');
      }
    } catch (err) {
      console.error('Error fetching DUEL snapshot data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load snapshot data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchSnapshotData();
  }, []);

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <p className="text-red-400 text-center mb-4">{error}</p>
          <div className="text-center">
            <button 
              onClick={fetchSnapshotData}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>

      {/* Table */}
      <div className="bg-dark-300/30 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent mb-4"></div>
              <p className="text-gray-400">Loading snapshot data...</p>
            </div>
          </div>
        ) : tableData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400">No snapshot data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-600">
              <thead className="bg-dark-300/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-r border-gray-600">
                    Community<br/>Rev Share
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    DUEL Balance
                  </th>
                  <th className="px-1 py-3 text-center text-xs font-medium text-gray-500">
                    ÷
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total Supply
                  </th>
                  <th className="px-1 py-3 text-center text-xs font-medium text-gray-500">
                    =
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Dividend %
                  </th>
                  <th className="px-1 py-3 text-center text-xs font-medium text-gray-500">
                    ×
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    My Dividend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-200/30 divide-y divide-gray-600">
                {tableData.map((snapshot) => (
                  <tr
                    key={snapshot.id}
                    className="hover:bg-dark-300/20 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(snapshot.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center border-r border-gray-600">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-white">0</span>
                        <img 
                          src="/assets/media/logos/solana.svg" 
                          alt="SOL" 
                          className="w-4 h-4"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">
                          {formatNumber(snapshot.balance_duel)}
                        </span>
                        <div className="w-4 h-4">
                          <NanoLogo />
                        </div>
                      </div>
                    </td>
                    <td className="px-1 py-4 text-center text-xs text-gray-500">
                      ÷
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-300">
                      {snapshot.total_registered_supply 
                        ? formatNumber(snapshot.total_registered_supply)
                        : 'N/A'
                      }
                    </td>
                    <td className="px-1 py-4 text-center text-xs text-gray-500">
                      =
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="text-amber-400 font-medium">
                        {formatPercentage(snapshot.dividend_percentage)}
                      </span>
                    </td>
                    <td className="px-1 py-4 text-center text-xs text-gray-500">
                      ×
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-white font-medium">0</span>
                        <img 
                          src="/assets/media/logos/solana.svg" 
                          alt="SOL" 
                          className="w-4 h-4"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuelSnapshotTable;