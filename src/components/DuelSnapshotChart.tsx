// src/components/DuelSnapshotChart.tsx

/**
 * DUEL Snapshot Chart Component
 * 
 * @description Chart component for DUEL token snapshots
 * Based on DuelBalanceChart but with different functionality
 * 
 * @author BranchManager69
 * @created 2025-07-24
 */

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import NanoLogo from './logo/NanoLogo';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
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
  total_registered_supply?: number; // Only in snapshot view
  dividend_percentage?: number;     // Only in snapshot view
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
  dividend_percentage?: number;
  dividend_percentage_display?: number;
  total_registered_supply?: number;
  isExtrapolated?: boolean;
}

interface DuelSnapshotChartProps {
  height?: number;
  className?: string;
  demoMode?: boolean;
}

export const DuelSnapshotChart: React.FC<DuelSnapshotChartProps> = ({
  height = 400,
  className = '',
  demoMode = false,
}) => {
  const [timeRange] = useState<TimeRange>('all');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get time range parameters for API
  const getTimeRangeParams = () => {
    // Use the timeframe parameter as specified in the API docs
    return {
      timeframe: 'all', // Always show all data for daily snapshots
      view: 'snapshot', // Request daily snapshot data
      limit: 1000 // Request max data points
    };
  };

  // Format data for chart
  const formatChartData = (balances: BalanceDataPoint[], range: TimeRange, currentBalance?: number): ChartDataPoint[] => {
    // Reverse the array so oldest is on the left, newest on the right
    const sortedData = balances.reverse().map(point => ({
      timestamp: point.timestamp,
      balance: point.balance_duel,
      dividend_percentage: point.dividend_percentage,
      dividend_percentage_display: point.dividend_percentage, // Add this for label positioning
      total_registered_supply: point.total_registered_supply,
      isExtrapolated: false, // Default to false for real data points
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
        } else {
          // For 30d/all, show month and day
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          });
        }
      })()
    }));

    // If we have data and the last data point is not today, fill in missing days
    if (sortedData.length > 0) {
      const lastDataPoint = sortedData[sortedData.length - 1];
      const lastDate = new Date(lastDataPoint.timestamp);
      const today = new Date();
      
      // Set both dates to midnight for day comparison
      lastDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      // Calculate days between last data and today
      const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Add a data point for each missing day
      for (let i = 1; i <= daysDiff; i++) {
        const missingDate = new Date(lastDate);
        missingDate.setDate(lastDate.getDate() + i);
        
        sortedData.push({
          ...lastDataPoint,
          balance: currentBalance !== undefined ? currentBalance : lastDataPoint.balance, // Use current balance if available
          timestamp: missingDate.toISOString(),
          formattedTime: missingDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          formattedDate: missingDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }),
          dividend_percentage_display: lastDataPoint.dividend_percentage, // Keep for display position
          dividend_percentage: demoMode ? lastDataPoint.dividend_percentage : undefined, // For demo mode, connect the line
          isExtrapolated: true
        });
      }
    }

    return sortedData;
  };

  // Fetch balance history data
  const fetchBalanceHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If in demo mode, use example snapshot data
      if (demoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate demo snapshot data (6 days of real data, today will be extrapolated)
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const demoBalances: BalanceDataPoint[] = [];
        
        // Generate 6 days of data ending YESTERDAY (newest first, oldest last)
        for (let i = 1; i <= 6; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i); // Days ago
          date.setHours(0, 0, 0, 0);
          
          // Balance should decrease as we go back in time
          const balance = 31800000 - ((i - 1) * 50000) + Math.random() * 30000;
          const totalSupply = 150000000 + Math.random() * 5000000;
          const percentage = (balance / totalSupply) * 100;
          
          demoBalances.push({
            id: 1000 + i,
            balance_lamports: (balance * 1000000).toString(),
            balance_duel: balance,
            timestamp: date.toISOString(),
            total_registered_supply: totalSupply,
            dividend_percentage: parseFloat(percentage.toFixed(2))
          });
        }
        
        const formattedData = formatChartData(demoBalances, timeRange);
        setChartData(formattedData);
        
        return;
      }
      
      const params = getTimeRangeParams();
      const response = await axios.get('/api/user/duel-balance-history', { params });
      
      if (response.data && response.data.success) {
        const data: ApiResponse = response.data;
        
        // Format data for chart
        const formattedData = formatChartData(data.balances, timeRange, data.trends?.current);
        setChartData(formattedData);
        setUserData(data.wallet);
      } else {
        throw new Error('Failed to fetch balance history');
      }
    } catch (err) {
      console.error('Error fetching DUEL balance history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load balance history');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data when component mounts or time range changes
  useEffect(() => {
    fetchBalanceHistory();
  }, [timeRange]);

  // Calculate nice round ticks for Y-axis
  const calculateYAxisTicks = () => {
    if (!chartData || chartData.length === 0) return [];
    
    const values = chartData.map(d => d.balance);
    const maxValue = Math.max(...values);
    
    // Add 5% padding to max
    const paddedMax = maxValue * 1.05;
    
    // Always start from 0 for better readability
    const range = paddedMax;
    const targetTicks = 5; // Aim for about 5 ticks
    const roughInterval = range / targetTicks;
    
    // Round to nice numbers
    let niceInterval;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughInterval)));
    const normalized = roughInterval / magnitude;
    
    if (normalized <= 1) niceInterval = magnitude;
    else if (normalized <= 2) niceInterval = 2 * magnitude;
    else if (normalized <= 5) niceInterval = 5 * magnitude;
    else niceInterval = 10 * magnitude;
    
    // Generate ticks
    const ticks = [];
    const startTick = 0; // Always start from 0
    
    for (let tick = startTick; tick <= paddedMax; tick += niceInterval) {
      if (tick >= 0) ticks.push(tick);
    }
    
    return ticks;
  };

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
          {data.isExtrapolated && (
            <p className="text-cyan-400 text-xs mb-1 italic">
              Projected
            </p>
          )}
          <p className="text-gray-400 text-xs mb-1">
            {data.formattedDate}
          </p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">
                {formattedValue}
              </span>
              <div className="w-4 h-4">
                <NanoLogo />
              </div>
              <span className="text-gray-300 text-sm ml-1">held</span>
            </div>
            {data.dividend_percentage && (
              <>
                <div className="text-amber-400 text-sm">
                  {data.dividend_percentage.toFixed(2)}% dividend share
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-white font-medium">
                    {demoMode ? "0" : "0"}
                  </span>
                  <img 
                    src="/assets/media/logos/solana.svg" 
                    alt="SOL" 
                    className="w-4 h-4"
                  />
                  <span className="text-gray-300">earned</span>
                </div>
              </>
            )}
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
      return <span className="text-blue-400">New Holder</span>;
    }
    
    // Convert to number if it's a string that looks like a number
    const numericChange = typeof change === 'string' ? parseFloat(change) : change;
    
    const color = numericChange >= 0 ? 'text-green-400' : 'text-red-400';
    const sign = numericChange >= 0 ? '+' : '';
    const suffix = isPercent ? '%' : ' DUEL';
    
    // For DUEL amounts, show integers only (no decimals)
    const formattedValue = isPercent 
      ? numericChange.toFixed(2) 
      : Math.floor(numericChange).toLocaleString();
    
    return (
      <span className={color}>
        {sign}{formattedValue}{suffix}
      </span>
    );
  }; */

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center h-64 text-red-400">
          <div className="text-center">
            <p className="text-lg mb-2">Error loading balance history</p>
            <p className="text-sm text-gray-500">{error}</p>
            <button 
              onClick={fetchBalanceHistory}
              className="mt-4 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
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
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Daily Snapshots</h3>
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
            <div className="text-gray-400">No daily snapshot data available</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <ComposedChart data={chartData} margin={{ left: 60, right: 60 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#374151" 
                strokeOpacity={0.3}
              />
              <XAxis 
                dataKey="formattedDate"
                stroke="#6B7280"
                fontSize={11}
                tick={{ fill: '#9CA3AF' }}
                interval={Math.floor(chartData.length / 30)} // Show ~30 labels max
                type="category"
                domain={['dataMin', 'dataMax']}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(value) => {
                  // Format large numbers with K, M, B suffixes
                  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
                  if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toLocaleString();
                }}
                domain={[0, 'dataMax * 1.05']}
                allowDataOverflow={false}
                ticks={calculateYAxisTicks()}
                label={{ 
                  value: 'DUEL Held', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { fill: '#9CA3AF', fontSize: 14 }
                }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                domain={[0, (() => {
                  if (!chartData || chartData.length === 0) return 10;
                  const percentageValues = chartData
                    .map(d => d.dividend_percentage)
                    .filter(val => val !== undefined && val !== null) as number[];
                  
                  if (percentageValues.length === 0) return 10;
                  const maxValue = Math.max(...percentageValues);
                  return maxValue > 10 ? 30 : 10;
                })()]}
                stroke="#6B7280"
                fontSize={12}
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(value) => `${value}%`}
                ticks={(() => {
                  if (!chartData || chartData.length === 0) return [0, 2.5, 5, 7.5, 10];
                  const percentageValues = chartData
                    .map(d => d.dividend_percentage)
                    .filter(val => val !== undefined && val !== null) as number[];
                  
                  if (percentageValues.length === 0) return [0, 2.5, 5, 7.5, 10];
                  const maxValue = Math.max(...percentageValues);
                  
                  if (maxValue > 10) {
                    return [0, 10, 20, 30];
                  } else {
                    return [0, 2.5, 5, 7.5, 10];
                  }
                })()}
                label={{ 
                  value: 'Your % of Total Rev Share', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { fill: '#9CA3AF', fontSize: 14, textAnchor: 'middle' }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="balance"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
                shape={(props: any) => {
                  const { fill, x, y, width, height, payload } = props;
                  const isExtrapolated = payload.isExtrapolated;
                  
                  return (
                    <g>
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={fill}
                        fillOpacity={isExtrapolated ? 0.25 : 0.8}
                        stroke={fill}
                        strokeWidth={isExtrapolated ? 1 : 2}
                        strokeDasharray={isExtrapolated ? '5,5' : 'none'}
                        rx={4}
                        ry={4}
                      />
                    </g>
                  );
                }}
              />
              {/* Separate line for all labels */}
              <Line
                type="monotone"
                dataKey="dividend_percentage_display"
                stroke="none"
                strokeWidth={0}
                connectNulls={false}
                dot={false}
                yAxisId="right"
                isAnimationActive={false}
              >
                <LabelList 
                  dataKey="dividend_percentage_display" 
                  position="top" 
                  content={function(props: any) {
                    const { x, y, value, index } = props;
                    
                    // Check if this data point is extrapolated by looking at the chart data
                    const dataPoint = chartData[index];
                    const isExtrapolated = dataPoint?.isExtrapolated || false;
                    
                    // For extrapolated data in demo mode, show the percentage value
                    if (isExtrapolated) {
                      // In demo mode, show the percentage value like other points
                      if (demoMode && value) {
                        return (
                          <text
                            x={x}
                            y={y - 5}
                            textAnchor="middle"
                            fill="#000000"
                            fontSize="14"
                            fontWeight="700"
                          >
                            {`${value.toFixed(1)}%`}
                          </text>
                        );
                      }
                      
                      // For non-demo mode, determine if this is the latest extrapolated bar
                      const isLatestExtrapolated = (() => {
                        // Find all extrapolated points
                        const extrapolatedIndices = chartData
                          .map((point, idx) => point.isExtrapolated ? idx : -1)
                          .filter(idx => idx !== -1);
                        
                        // Check if this is the rightmost (latest) extrapolated point
                        return extrapolatedIndices.length > 0 && index === Math.max(...extrapolatedIndices);
                      })();
                      
                      const isToday = isLatestExtrapolated;
                      const bgColor = isToday ? "#dcfce7" : "#fed7aa"; // Light green for today, light orange for pending
                      
                      return (
                        <g>
                          {/* Background rectangle */}
                          <rect
                            x={x - 25}
                            y={y - 18}
                            width={50}
                            height={24}
                            fill={bgColor}
                            fillOpacity={0.9}
                            rx={3}
                            ry={3}
                          />
                          {isToday ? (
                            <text
                              x={x}
                              y={y - 3}
                              textAnchor="middle"
                              fill="#000000"
                              fontSize="11"
                              fontWeight="600"
                            >
                              Today
                            </text>
                          ) : (
                            <>
                              <text
                                x={x}
                                y={y - 8}
                                textAnchor="middle"
                                fill="#000000"
                                fontSize="10"
                                fontWeight="600"
                              >
                                Snapshot
                              </text>
                              <text
                                x={x}
                                y={y + 1}
                                textAnchor="middle"
                                fill="#000000"
                                fontSize="10"
                                fontWeight="600"
                              >
                                Pending
                              </text>
                            </>
                          )}
                        </g>
                      );
                    }
                    
                    if (!value) return null;
                    return (
                      <text
                        x={x}
                        y={y - 5}
                        textAnchor="middle"
                        fill="#000000"
                        fontSize="14"
                        fontWeight="700"
                      >
                        {`${value.toFixed(1)}%`}
                      </text>
                    );
                  }}
                />
              </Line>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Explanation text */}
      <div className="mt-6 text-center space-y-1">
        <p className="text-gray-400 text-sm">
          Each bar represents your average balance from 50 snapshots randomly taken during the day
        </p>
        <p className="text-gray-400 text-sm flex items-center justify-center gap-1">
          Higher percentage = bigger <span className="text-brand-400 font-semibold">Degen Dividends</span> share, DegenDuel's revenue (<img src="/assets/media/logos/solana.svg" alt="SOL" className="w-4 h-4 inline" />) sharing program
        </p>
      </div>
    </div>
  );
};