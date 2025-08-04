// src/components/WalletPortfolioTable.tsx

/**
 * Wallet Portfolio Table Component
 * 
 * @description Table component for displaying complete wallet token holdings
 * Shows all tokens with values, slippage, and images from wallet analysis endpoint
 * 
 * @author BranchManager69
 * @created 2025-07-25
 */

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

interface TokenData {
  mint?: string;
  symbol: string;
  name: string;
  balance: number;
  value: number;
  realizableValue?: number;
  priceImpact?: number | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isSOL?: boolean;
}

interface PortfolioData {
  totalValue: number;
  totalRealizableValue: number;
  deploymentRatio: number;
}

interface WalletAnalysisResponse {
  tokens: TokenData[];
  portfolio: PortfolioData;
}

interface WalletPortfolioTableProps {
  className?: string;
  demoMode?: boolean;
}

export const WalletPortfolioTable: React.FC<WalletPortfolioTableProps> = ({
  className = '',
  demoMode = false,
}) => {
  const { user } = useStore();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format number with appropriate suffix
  const formatValue = (value: number): string => {
    // Guard against null/undefined/NaN
    if (value == null || isNaN(value)) return '$0';
    
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else if (value >= 1) {
      return `$${value.toFixed(2)}`;
    } else if (value >= 0.01) {
      return `$${value.toFixed(3)}`;
    } else {
      return `$${value.toFixed(4)}`;
    }
  };

  // Format token balance
  const formatBalance = (balance: number): string => {
    // Guard against null/undefined/NaN
    if (balance == null || isNaN(balance)) return '0';
    
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(2)}M`;
    } else if (balance >= 1000) {
      return `${(balance / 1000).toFixed(2)}K`;
    } else if (balance >= 1) {
      return balance.toFixed(2);
    } else {
      return balance.toFixed(4);
    }
  };

  // Fetch wallet analysis data
  const fetchWalletData = async () => {
    if (!demoMode && !user?.wallet_address) {
      setError('No wallet address found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // If in demo mode, use example data
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const demoTokens: TokenData[] = [
          { symbol: 'DUEL', name: 'DegenDuel', balance: 31814255, value: 158742, realizableValue: 155000, priceImpact: 2.3 },
          { symbol: 'SOL', name: 'Solana', balance: 1250, value: 87500, realizableValue: 87400, priceImpact: 0.1, isSOL: true },
          { symbol: 'BONK', name: 'Bonk', balance: 5420000000, value: 54200, realizableValue: 52800, priceImpact: 2.6 },
          { symbol: 'WIF', name: 'dogwifhat', balance: 12500, value: 37500, realizableValue: 36200, priceImpact: 3.5 },
          { symbol: 'JUP', name: 'Jupiter', balance: 8900, value: 14240, realizableValue: 14100, priceImpact: 1.0 }
        ];
        
        setTokens(demoTokens);
        setPortfolio({
          totalValue: 352182,
          totalRealizableValue: 345600,
          deploymentRatio: 98.1
        });
        
        return;
      }
      
      if (!user) {
        return;
      }
      
      const response = await axios.get(`/api/wallet-analysis/${user.wallet_address}`);
      
      if (response.data) {
        const data: WalletAnalysisResponse = response.data;
        
        // Sort tokens by value descending
        const sortedTokens = [...data.tokens].sort((a, b) => b.value - a.value);
        
        setTokens(sortedTokens);
        setPortfolio(data.portfolio);
      } else {
        throw new Error('No data received from wallet analysis');
      }
    } catch (err) {
      console.error('Error fetching wallet analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchWalletData();
  }, [user?.wallet_address]);

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <p className="text-red-400 text-center mb-4">{error}</p>
          <div className="text-center">
            <button 
              onClick={fetchWalletData}
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
      {/* Header with portfolio summary */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h3 className="text-lg font-semibold text-white mb-2 sm:mb-0">Token Holdings</h3>
        {portfolio && (
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-400">Total Value:</span>
              <span className="text-white font-semibold ml-2">{formatValue(portfolio.totalValue)}</span>
            </div>
            <div>
              <span className="text-gray-400">Deployed:</span>
              <span className="text-white font-semibold ml-2">{(portfolio.deploymentRatio ?? 0).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-dark-300/30 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent mb-4"></div>
              <p className="text-gray-400">Analyzing wallet holdings...</p>
            </div>
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400">No tokens found in wallet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-600">
              <thead className="bg-dark-300/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Token
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Realizable
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Slippage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-200/30 divide-y divide-gray-600">
                {tokens.map((token) => (
                  <tr
                    key={token.mint || token.symbol}
                    className="hover:bg-dark-300/20 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {/* Token logo */}
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-dark-300 flex items-center justify-center">
                          {token.logoUrl ? (
                            <img 
                              src={token.logoUrl} 
                              alt={token.symbol}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <span className={`text-xs font-medium text-gray-400 ${token.logoUrl ? 'hidden' : ''}`}>
                            {token.symbol.substring(0, 2)}
                          </span>
                        </div>
                        {/* Token info */}
                        <div>
                          <p className="text-white font-medium">{token.symbol}</p>
                          <p className="text-gray-500 text-xs">{token.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-gray-300">{formatBalance(token.balance)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-white font-medium">{formatValue(token.value)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-gray-300">
                        {token.realizableValue ? formatValue(token.realizableValue) : formatValue(token.value)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {token.priceImpact !== null && token.priceImpact !== undefined ? (
                        <span className={`text-sm font-medium ${
                          token.priceImpact > 10 ? 'text-red-400' : 
                          token.priceImpact > 5 ? 'text-amber-400' : 
                          'text-gray-400'
                        }`}>
                          {token.priceImpact.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Total row */}
              <tfoot className="bg-dark-300/70">
                <tr>
                  <td className="px-6 py-3 text-left">
                    <span className="text-gray-300 font-medium">Total</span>
                  </td>
                  <td className="px-6 py-3"></td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-white font-semibold">
                      {portfolio ? formatValue(portfolio.totalValue) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="text-gray-300 font-medium">
                      {portfolio ? formatValue(portfolio.totalRealizableValue) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {portfolio && portfolio.totalValue > 0 ? (
                      <span className="text-gray-400 text-sm">
                        {((1 - portfolio.totalRealizableValue / portfolio.totalValue) * 100).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPortfolioTable;