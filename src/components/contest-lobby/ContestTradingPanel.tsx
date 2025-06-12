import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';

interface ChartDataResponse {
  success: boolean;
  contest: {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    status: string;
  };
  participant: {
    wallet_address: string;
    nickname: string;
    rank: number;
    entry_time: string;
  };
  performance: {
    initial_balance: number;
    current_value: number;
    total_pnl: number;
    total_pnl_percentage: number;
    portfolio_tokens: number;
  };
  chart_data: {
    interval: string;
    period_days: number;
    data_points: number;
    time_series: Array<{
      timestamp: string;
      value: number;
      min_value: number;
      max_value: number;
      data_points: number;
    }>;
  };
  portfolio_composition: Array<{
    token_id: number;
    address: string;
    symbol: string;
    name: string;
    image_url: string;
    weight: number;
    quantity: number;
    current_price: number;
    current_value: number;
    change_24h: number;
  }>;
  rank_history: Array<{
    timestamp: string;
    rank: number;
    portfolio_value: number;
  }>;
  metadata: {
    generated_at: string;
    effective_start_time: string;
    query_end_time: string;
  };
}

interface ContestTradingPanelProps {
  contestId: string;
  walletAddress?: string;
}

export const ContestTradingPanel: React.FC<ContestTradingPanelProps> = ({
  contestId,
  walletAddress
}) => {
  const { user } = useMigratedAuth();
  const targetWallet = walletAddress || user?.wallet_address;
  
  const [chartData, setChartData] = useState<ChartDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<'5m' | '15m' | '1h' | '4h' | '24h'>('1h');
  const [days, setDays] = useState(7);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!targetWallet) {
        setError('No wallet address available');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          throw new Error('Authentication required');
        }

        const response = await fetch(
          `/api/contests/${contestId}/chart-data/${targetWallet}?interval=${interval}&days=${days}`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch chart data: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to load chart data');
        }

        setChartData(data);
      } catch (err) {
        console.error('Failed to fetch trading panel data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [contestId, targetWallet, interval, days]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    
    if (interval === '5m' || interval === '15m') {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (interval === '1h' || interval === '4h') {
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        hour12: false
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const formatValue = (value: number) => {
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark-300/95 backdrop-blur-sm border border-dark-200 rounded-lg p-3">
          <p className="text-gray-300 text-sm mb-2">{formatTimestamp(label)}</p>
          <p className="text-white font-bold">{formatValue(data.value)}</p>
          {data.min_value !== data.max_value && (
            <div className="text-xs text-gray-400 mt-1">
              <p>High: {formatValue(data.max_value)}</p>
              <p>Low: {formatValue(data.min_value)}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-dark-300 rounded w-1/3"></div>
          <div className="h-64 bg-dark-300 rounded"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-dark-300 rounded"></div>
            <div className="h-32 bg-dark-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !chartData) {
    return (
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6">
        <div className="text-center text-red-400">
          {error || 'No data available'}
        </div>
      </div>
    );
  }

  const { participant, performance, chart_data, portfolio_composition, rank_history } = chartData;

  return (
    <motion.div
      className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {participant.nickname}'s Trading Performance
          </h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
            <span>Rank: #{participant.rank}</span>
            <span>Tokens: {performance.portfolio_tokens}</span>
            <span>Joined: {new Date(participant.entry_time).toLocaleDateString()}</span>
          </div>
        </div>
        
        {/* Time Controls */}
        <div className="flex items-center gap-2">
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as any)}
            className="bg-dark-300 text-white rounded px-3 py-1 text-sm border border-dark-200"
          >
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="24h">24h</option>
          </select>
          
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-dark-300 text-white rounded px-3 py-1 text-sm border border-dark-200"
          >
            <option value="1">1 day</option>
            <option value="3">3 days</option>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-dark-300/50 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Portfolio Value</div>
          <div className="text-xl font-bold text-white">
            {formatValue(performance.current_value)}
          </div>
        </div>
        
        <div className="bg-dark-300/50 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Total P&L</div>
          <div className={`text-xl font-bold ${
            performance.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatPercentage(performance.total_pnl_percentage)}
          </div>
        </div>
        
        <div className="bg-dark-300/50 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Initial Balance</div>
          <div className="text-xl font-bold text-white">
            {formatValue(performance.initial_balance)}
          </div>
        </div>
        
        <div className="bg-dark-300/50 rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-1">Profit</div>
          <div className={`text-xl font-bold ${
            performance.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatValue(performance.total_pnl)}
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-dark-300/20 rounded-lg p-4">
        <h3 className="text-lg font-bold text-white mb-4">Portfolio Value Over Time</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart_data.time_series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTimestamp}
                stroke="#9CA3AF"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tickFormatter={formatValue}
                stroke="#9CA3AF"
                fontSize={12}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-xs text-gray-400 mt-2 text-center">
          {chart_data.data_points} data points over {chart_data.period_days} days
        </div>
      </div>

      {/* Portfolio Composition */}
      {portfolio_composition.length > 0 && (
        <div className="bg-dark-300/20 rounded-lg p-4">
          <h3 className="text-lg font-bold text-white mb-4">Portfolio Composition</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Token List */}
            <div className="space-y-2">
              {portfolio_composition.slice(0, 5).map((token) => (
                <div
                  key={token.address}
                  className="flex items-center justify-between p-3 bg-dark-400/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {token.image_url && (
                      <img
                        src={token.image_url}
                        alt={token.symbol}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <div className="font-medium text-white">{token.symbol}</div>
                      <div className="text-xs text-gray-400">{token.weight}% of portfolio</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">
                      {formatValue(token.current_value)}
                    </div>
                    <div className={`text-xs ${
                      token.change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPercentage(token.change_24h)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Weight Distribution Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portfolio_composition.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                  <XAxis dataKey="symbol" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    formatter={(value: any) => `${value}%`}
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="weight" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Rank History */}
      {rank_history.length > 0 && (
        <div className="bg-dark-300/20 rounded-lg p-4">
          <h3 className="text-lg font-bold text-white mb-4">Rank History</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rank_history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={12}
                  reversed
                  domain={[1, 'dataMax']}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'rank') return `#${value}`;
                    return formatValue(value);
                  }}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="stepAfter"
                  dataKey="rank"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
};