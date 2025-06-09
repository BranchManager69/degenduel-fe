import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TokenHolding {
  token_address: string;
  token_symbol: string;
  token_name: string;
  token_image_url?: string;
  weight_percentage: number;
  quantity: string;
  entry_price: string;
  current_price: string;
  pnl_amount: string;
  pnl_percentage: string;
}

interface PortfolioData {
  wallet_address: string;
  portfolio_value: string;
  initial_portfolio_value: string;
  total_pnl: string;
  total_pnl_percentage: string;
  holdings: TokenHolding[];
  last_updated: string;
}

interface EnhancedPortfolioDisplayProps {
  contestId: string;
  walletAddress: string;
  nickname: string;
  showDetailed?: boolean;
}

export const EnhancedPortfolioDisplay: React.FC<EnhancedPortfolioDisplayProps> = ({
  contestId,
  walletAddress,
  nickname,
  showDetailed = false
}) => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/contests/${contestId}/portfolio/${walletAddress}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio: ${response.status}`);
        }

        const data = await response.json();
        setPortfolioData(data.portfolio);
      } catch (err) {
        console.error('[EnhancedPortfolioDisplay] Failed to fetch portfolio:', err);
        setError(err instanceof Error ? err.message : 'Failed to load portfolio');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioData();
  }, [contestId, walletAddress]);

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatPercentage = (value: string) => {
    const num = parseFloat(value);
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-dark-300 rounded w-1/2"></div>
          <div className="h-6 bg-dark-300 rounded w-3/4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-dark-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4">
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4">
        <div className="text-gray-400 text-sm">No portfolio data available</div>
      </div>
    );
  }

  const totalPnl = parseFloat(portfolioData.total_pnl_percentage);

  return (
    <motion.div
      className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300/30"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Portfolio Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-100">{nickname}</h3>
          <div className="text-xs text-gray-400">
            Updated {new Date(portfolioData.last_updated).toLocaleTimeString()}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400">Portfolio Value</div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(portfolioData.portfolio_value)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Total P&L</div>
            <div className={`text-xl font-bold ${
              totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatPercentage(portfolioData.total_pnl_percentage)}
            </div>
          </div>
        </div>
      </div>

      {/* Holdings */}
      {showDetailed && portfolioData.holdings.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-300 border-b border-dark-300 pb-2">
            Holdings ({portfolioData.holdings.length})
          </div>
          
          {portfolioData.holdings.map((holding, index) => {
            const holdingPnl = parseFloat(holding.pnl_percentage);
            
            return (
              <motion.div
                key={holding.token_address}
                className="flex items-center justify-between p-2 bg-dark-300/20 rounded-lg"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  {holding.token_image_url && (
                    <img
                      src={holding.token_image_url}
                      alt={holding.token_symbol}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-200">
                      {holding.token_symbol}
                    </div>
                    <div className="text-xs text-gray-400">
                      {holding.weight_percentage.toFixed(1)}% of portfolio
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-bold ${
                    holdingPnl >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercentage(holding.pnl_percentage)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatCurrency(holding.current_price)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Summary Bar */}
      {!showDetailed && portfolioData.holdings.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-gray-400 mb-2">Token Allocation</div>
          <div className="flex h-2 bg-dark-400 rounded-full overflow-hidden">
            {portfolioData.holdings.slice(0, 5).map((holding, index) => {
              const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
              return (
                <div
                  key={holding.token_address}
                  className="h-full"
                  style={{
                    width: `${holding.weight_percentage}%`,
                    backgroundColor: colors[index % colors.length]
                  }}
                  title={`${holding.token_symbol}: ${holding.weight_percentage.toFixed(1)}%`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            {portfolioData.holdings.slice(0, 3).map(holding => (
              <span key={holding.token_address}>
                {holding.token_symbol} {holding.weight_percentage.toFixed(0)}%
              </span>
            ))}
            {portfolioData.holdings.length > 3 && (
              <span>+{portfolioData.holdings.length - 3} more</span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};