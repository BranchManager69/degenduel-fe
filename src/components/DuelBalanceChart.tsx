// src/components/DuelBalanceChart.tsx

/**
 * DUEL Balance History Chart Component
 * 
 * @description Chart component specifically for DUEL token balance history
 * Uses the new /api/user/duel-balance-history endpoint
 * 
 * @author BranchManager69
 * @created 2025-07-24
 */

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import NanoLogo from './logo/NanoLogo';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type TimeRange = '24h' | '7d' | '30d' | 'all';

interface BalanceDataPoint {
  id: number;
  balance_lamports: string;
  balance_duel: number;
  timestamp: string;
}

interface TrendsData {
  current: number;
  change24h: number;
  change7d: number;
  change30d: number;
  percentChange24h: number | string;
  percentChange7d: number | string;
  percentChange30d: number | string;
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
  trends: TrendsData;
}

interface ChartDataPoint {
  timestamp: string;
  balance: number;
  formattedTime: string;
  formattedDate: string;
}

interface DuelBalanceChartProps {
  height?: number;
  className?: string;
  demoMode?: boolean;
}

export const DuelBalanceChart: React.FC<DuelBalanceChartProps> = ({
  height = 400,
  className = '',
  demoMode = false,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get time range parameters for API
  const getTimeRangeParams = () => {
    // Use the timeframe parameter as specified in the API docs
    return {
      timeframe: timeRange,
      limit: 1000 // Request max data points for better chart resolution
    };
  };

  // Format data for chart
  const formatChartData = (balances: BalanceDataPoint[], range: TimeRange): ChartDataPoint[] => {
    // Filter out any data before July 23, 2025 8:30 PM ET (July 24, 2025 00:30 UTC)
    const cutoffDate = new Date('2025-07-24T00:30:00.000Z');
    const filteredBalances = balances.filter(point => new Date(point.timestamp) >= cutoffDate);
    
    // Reverse the array so oldest is on the left, newest on the right
    const reversedBalances = [...filteredBalances].reverse();
    
    // For 'all' view with many data points, we might want to reduce data density
    if (range === 'all' && reversedBalances.length > 50) {
      // Group by 6-hour intervals to show ~4 points per day
      const groupedData = new Map<string, BalanceDataPoint>();
      
      reversedBalances.forEach(point => {
        const date = new Date(point.timestamp);
        // Create a key for 6-hour intervals (0, 6, 12, 18)
        const hour = Math.floor(date.getHours() / 6) * 6;
        const dateKey = `${date.toISOString().split('T')[0]}-${hour}`; // YYYY-MM-DD-HH
        
        // Keep the last data point of each 6-hour interval
        groupedData.set(dateKey, point);
      });
      
      // Convert back to array and use those points
      return Array.from(groupedData.values()).map(point => {
        const date = new Date(point.timestamp);
        const now = new Date();
        const showYear = date.getFullYear() !== now.getFullYear();
        
        return {
          timestamp: point.timestamp,
          balance: point.balance_duel,
          formattedTime: new Date(point.timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          formattedDate: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            ...(showYear && { year: '2-digit' })
          })
        };
      });
    }
    
    // For other views or when we have fewer data points, use all data
    return reversedBalances.map(point => ({
      timestamp: point.timestamp,
      balance: point.balance_duel,
      formattedTime: new Date(point.timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      formattedDate: (() => {
        const date = new Date(point.timestamp);
        if (range === '24h') {
          // For 24h view, round to nearest 15 minutes
          const roundedDate = new Date(date);
          const minutes = roundedDate.getMinutes();
          const roundedMinutes = Math.round(minutes / 15) * 15;
          
          // Handle edge case where rounding to 60 minutes
          if (roundedMinutes === 60) {
            roundedDate.setHours(roundedDate.getHours() + 1);
            roundedDate.setMinutes(0);
          } else {
            roundedDate.setMinutes(roundedMinutes);
          }
          
          return roundedDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        } else if (range === '7d') {
          // For 7d view, show day of week only
          return date.toLocaleDateString('en-US', {
            weekday: 'short'
          });
        } else if (range === '30d') {
          // For 30d, show month and day
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
        } else {
          // For 'all' view, add year if needed
          const now = new Date();
          const showYear = date.getFullYear() !== now.getFullYear();
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            ...(showYear && { year: '2-digit' })
          });
        }
      })()
    }));
  };

  // Fetch balance history data
  const fetchBalanceHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If in demo mode, use example data
      if (demoMode) {
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate demo data
        const now = new Date();
        const demoBalances: BalanceDataPoint[] = [];
        const baseBalance = 28500000; // Starting at 28.5M
        
        // Generate 30 days of data with gradual increase to 31.8M
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const growth = (31814255 - baseBalance) / 29;
          const balance = baseBalance + (growth * (29 - i));
          
          // Add some variance to make it more realistic
          const variance = (Math.random() - 0.5) * 100000;
          const finalBalance = Math.max(baseBalance, balance + variance);
          
          demoBalances.push({
            id: 1000 + i,
            balance_lamports: (finalBalance * 1000000).toString(),
            balance_duel: finalBalance,
            timestamp: date.toISOString()
          });
        }
        
        const formattedData = formatChartData(demoBalances, timeRange);
        setChartData(formattedData);
        setTrends({
          current: 31814255,
          change24h: 18968,
          change7d: 3314255,
          change30d: 3314255,
          percentChange24h: 0.06,
          percentChange7d: 11.6,
          percentChange30d: 11.6
        });
        
        return;
      }
      
      const params = getTimeRangeParams();
      const response = await axios.get('/api/user/duel-balance-history', { params });
      
      if (response.data && response.data.success) {
        const data: ApiResponse = response.data;
        
        // Format data for chart
        const formattedData = formatChartData(data.balances, timeRange);
        setChartData(formattedData);
        setTrends(data.trends);
        setUserData(data.wallet);
      } else {
        throw new Error('Failed to fetch balance history');
      }
    } catch (err: any) {
      console.error('Error fetching DUEL balance history:', err);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        setError('Your session has expired.\nPlease <refresh> to log in again.');
      } else if (err.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Request timed out. Please check your connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load balance history');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or time range changes
  useEffect(() => {
    fetchBalanceHistory();
  }, [timeRange]);


  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = Math.floor(payload[0].value);
      const formattedValue = value >= 1000000000 ? `${(value / 1000000000).toFixed(1)}B` :
                            value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` :
                            value >= 1000 ? `${(value / 1000).toFixed(1)}K` :
                            value.toLocaleString();
      
      return (
        <div className="bg-dark-300 rounded p-3">
          <p className="text-gray-400 text-xs mb-1">
            {data.formattedDate} • {data.formattedTime}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-white font-semibold">
              {formattedValue}
            </span>
            <div className="w-4 h-4">
              <NanoLogo />
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Format trend change with color - removed as unused
  /* const formatTrendChange = (change: number | string, isPercent: boolean = false) => {
    // Handle "new holder" case - check if it's the string "New Holder"
    if (change === "New Holder") {
      return <span className="text-blue-400">Newly Tracked</span>;
    }
    
    // Convert to number if it's a string that looks like a number
    const numericChange = typeof change === 'string' ? parseFloat(change) : change;
    
    const color = numericChange >= 0 ? 'text-green-400' : 'text-red-400';
    const sign = numericChange >= 0 ? '+' : '';
    
    // For DUEL amounts, show integers only (no decimals) with NanoLogo
    if (!isPercent) {
      const formattedValue = Math.floor(numericChange).toLocaleString();
      return (
        <span className={`${color} flex items-center`}>
          {sign}{formattedValue}
          <div className="relative flex items-center justify-center w-3 h-3 ml-2">
            <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-20" />
            <div className="relative w-3 h-3 flex items-center justify-center">
              <NanoLogo />
            </div>
          </div>
        </span>
      );
    }
    
    // For percentages, keep the old format
    const formattedValue = numericChange.toFixed(2);
    return (
      <span className={color}>
        {sign}{formattedValue}%
      </span>
    );
  }; */

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-base text-gray-400">
              {error.split('\n').map((line, lineIndex) => (
                <p key={lineIndex} className={lineIndex > 0 ? 'mt-2' : ''}>
                  {line.split('<refresh>').map((part, index) => {
                    if (index === 0) return part;
                    return (
                      <React.Fragment key={index}>
                        <button 
                          className="inline-block px-3 py-1 mx-1 bg-green-400/70 hover:bg-green-400/80 text-black font-bold rounded transition-colors" 
                          onClick={() => window.location.reload()}
                        >
                          refresh the page
                        </button>
                        {part.split('</refresh>')[1] || part}
                      </React.Fragment>
                    );
                  })}
                </p>
              ))}
            </div>
            {!error.includes('<refresh>') && (
              <button 
                onClick={fetchBalanceHistory}
                className="mt-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header with time range controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Balance History</h3>
        
        <div className="flex gap-2 mt-3 sm:mt-0">
          {(['24h', '7d', '30d', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-brand-500 text-white'
                  : 'bg-dark-300 text-gray-300 hover:bg-dark-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>


      {/* Chart */}
      <div className="bg-dark-300/30 rounded-lg p-4 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #10B981 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading balance history...</div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">No balance history data available</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart 
              data={chartData} 
              margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
            >
              <defs>
                <linearGradient id="colorDuel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#374151" 
                strokeOpacity={0.3}
              />
              <XAxis 
                dataKey="formattedDate"
                stroke="#6B7280"
                fontSize={timeRange === '24h' ? 11 : 12}
                tick={{ fill: '#9CA3AF' }}
                ticks={(() => {
                  // Get unique dates only
                  const uniqueDates = new Map<string, number>();
                  chartData.forEach((point, index) => {
                    if (!uniqueDates.has(point.formattedDate)) {
                      uniqueDates.set(point.formattedDate, index);
                    }
                  });
                  
                  // Return the formattedDate values for unique dates
                  return Array.from(uniqueDates.keys());
                })()}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(value) => {
                  // Format large numbers with K, M, B suffixes
                  if (value >= 1000000000) return `${(value / 1000000000).toFixed(0)}B`;
                  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toLocaleString();
                }}
                domain={[0, (dataMax: number) => dataMax * 1.05]}
                ticks={(() => {
                  if (!chartData || chartData.length === 0) return [];
                  
                  const values = chartData.map(d => d.balance);
                  const maxValue = Math.max(...values);
                  const paddedMax = maxValue * 1.05;
                  
                  // For ~32M max, we want ticks at 0, 10M, 20M, 30M, 35M
                  // Calculate appropriate interval based on max value
                  let interval;
                  if (paddedMax <= 10000000) interval = 2000000; // 2M intervals
                  else if (paddedMax <= 50000000) interval = 10000000; // 10M intervals
                  else if (paddedMax <= 100000000) interval = 20000000; // 20M intervals
                  else interval = 50000000; // 50M intervals
                  
                  const ticks = [];
                  for (let i = 0; i <= paddedMax; i += interval) {
                    ticks.push(i);
                  }
                  
                  return ticks;
                })()}
                label={{ 
                  value: 'DUEL Held', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: '#9CA3AF', fontSize: 14 }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#10B981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorDuel)"
                filter="url(#glow)"
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ 
                  fill: '#10B981', 
                  stroke: '#FFFFFF', 
                  strokeWidth: 2, 
                  r: 4 
                }}
                activeDot={{ 
                  r: 7, 
                  stroke: '#10B981', 
                  strokeWidth: 3,
                  fill: '#10B981',
                  filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
        
        {/* Current Balance Annotation - positioned at latest data point */}
        {trends && chartData.length > 0 && (
          <>
            {/* Connection line to latest data point */}
            <div className="absolute top-16 right-12 w-8 h-px bg-brand-500/50 pointer-events-none" 
                 style={{ transform: 'rotate(45deg)', transformOrigin: 'left center' }} />
            
            <div className="absolute top-6 right-6 bg-dark-300/70 backdrop-blur-sm rounded-lg px-3 py-2 pointer-events-none">
              <div>
                <p className="text-xs text-gray-400 mb-1">Current</p>
                <div className="flex items-center">
                  <span className="text-sm font-semibold text-white mr-2">
                    {(() => {
                      const value = Math.floor(trends.current);
                      if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                      return value.toLocaleString();
                    })()}
                  </span>
                  <div className="relative flex items-center justify-center w-4 h-4">
                    <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-20" />
                    <div className="relative w-4 h-4 flex items-center justify-center">
                      <NanoLogo />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Explanation text */}
      <div className="mt-4 text-center">
        <p className="text-gray-400 text-sm">
          Balance tracked every 30 minutes. These snapshots are averaged daily to calculate your dividend percentage.
        </p>
      </div>
    </div>
  );
};