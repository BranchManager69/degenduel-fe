// src/components/WalletBalanceChart.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useUnifiedWebSocket } from '../hooks/websocket/useUnifiedWebSocket';
import axios from 'axios';

type TimeRange = '24h' | '7d' | '30d' | 'all';

interface DataPoint {
  timestamp: string; 
  [key: string]: string | number;
}

interface ChartSeries {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

interface WalletBalanceChartProps {
  title?: string;
  description?: string;
  walletAddress?: string;
  viewType?: 'single' | 'compare' | 'total' | 'average' | 'top';
  showControls?: boolean;
  height?: number | string;
  className?: string;
  onDataLoaded?: (data: any) => void;
  onError?: (error: string) => void;
}

const COLORS = [
  '#FF6384', // Pink
  '#36A2EB', // Blue
  '#FFCE56', // Yellow
  '#4BC0C0', // Teal
  '#9966FF', // Purple
  '#FF9F40', // Orange
  '#C9CBCF', // Grey
  '#7CFC00', // Lawn Green
  '#8A2BE2', // Blue Violet
  '#00CED1', // Dark Turquoise
];

export const WalletBalanceChart: React.FC<WalletBalanceChartProps> = ({
  title,
  description,
  walletAddress,
  viewType = 'single',
  showControls = true,
  height = 300,
  className = '',
  onDataLoaded,
  onError,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [series, setSeries] = useState<ChartSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Provide the required parameters to useUnifiedWebSocket
  const { isConnected, isAuthenticated, request } = useUnifiedWebSocket(
    'wallet-balance-chart', // Unique ID for this component
    ['DATA'], // Message types to listen for
    () => {} // Empty callback since we're not using the subscription directly
  );
  
  // Determine the appropriate action based on view type
  const getAction = () => {
    switch (viewType) {
      case 'single': return 'wallet-balance/history';
      case 'compare': return 'wallet-balance/compare';
      case 'total': return 'wallet-balance/total';
      case 'average': return 'wallet-balance/average';
      case 'top': return 'wallet-balance/top';
      default: return 'wallet-balance/history';
    }
  };
  
  // Convert time range to REST API parameters
  const getTimeRangeForRestApi = () => {
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case '24h':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all':
        // Don't set a start date for "all" time range
        return {};
    }
    
    if (startDate) {
      return { 
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      };
    }
    
    return {};
  };
  
  // Fetch data from REST API as a fallback
  const fetchFromRestApi = async () => {
    try {
      if (!walletAddress && viewType === 'single') {
        throw new Error('Wallet address is required for single wallet view');
      }
      
      const timeParams = getTimeRangeForRestApi();
      let url = '';
      let params = { ...timeParams };
      
      if (viewType === 'single' && walletAddress) {
        // Use the specific wallet balance endpoint
        url = `/api/admin/wallet-monitoring/balances/${walletAddress}`;
      } else {
        // Use the general balances endpoint
        url = '/api/admin/wallet-monitoring/balances';
        
        // Apply additional filters - ensuring type compatibility
        if (viewType === 'top') {
          // Create a temporary variable of the right type
          const topParams: typeof params & {
            limit: number;
            nonZeroOnly: boolean;
            sortBy: string;
            sortOrder: string;
          } = {
            ...params,
            limit: 10,
            nonZeroOnly: true,
            sortBy: 'balance',
            sortOrder: 'desc'
          };
          // Type assertion to handle the incompatible types
          params = topParams as typeof params;
        }
      }
      
      const response = await axios.get(url, { params });
      
      if (response.data && response.data.success) {
        let formattedData;
        let seriesData: ChartSeries[] = [];
        
        if (viewType === 'single' && response.data.balances) {
          // For single wallet view, format the data points
          formattedData = response.data.balances.map((point: any) => ({
            timestamp: point.timestamp,
            balance: point.balance_sol
          }));
          
          // Add a single series for this wallet
          seriesData = [{
            id: 'balance',
            name: walletAddress 
              ? `Wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : 'Balance',
            color: COLORS[0],
            visible: true
          }];
        } else {
          // For other views, handle multiple wallets or aggregated data
          // This would need to be adjusted based on the actual API response structure
          if (response.data.balances) {
            // Group data by wallet and format for chart
            const walletSeries: Record<string, ChartSeries> = {};
            const timeMap: Record<string, DataPoint> = {};
            
            // Process each balance record
            response.data.balances.forEach((balance: any) => {
              const walletId = balance.wallet_address || 'total';
              const name = balance.nickname || `Wallet ${walletId.slice(0, 6)}...`;
              
              // Create series if it doesn't exist
              if (!walletSeries[walletId]) {
                walletSeries[walletId] = {
                  id: walletId,
                  name: name,
                  color: COLORS[Object.keys(walletSeries).length % COLORS.length],
                  visible: true
                };
              }
              
              // Add data point
              const timestamp = new Date(balance.timestamp || balance.last_updated).toISOString();
              if (!timeMap[timestamp]) {
                timeMap[timestamp] = { timestamp };
              }
              
              timeMap[timestamp][walletId] = balance.balance_sol;
            });
            
            // Convert timeMap to array for chart
            formattedData = Object.values(timeMap);
            seriesData = Object.values(walletSeries);
          }
        }
        
        // Handle callback and state updates
        if (formattedData) {
          setChartData(formattedData);
          setSeries(seriesData);
          
          if (onDataLoaded) {
            onDataLoaded({
              history: formattedData,
              series: seriesData,
              wallet: response.data.wallet,
              summary: response.data.summary,
              trends: response.data.trends
            });
          }
          return true;
        }
      }
      
      throw new Error('Could not process API response');
    } catch (err) {
      console.error('REST API fallback error:', err);
      throw err;
    }
  };
  
  // Fetch historical data when component mounts or params change
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // Try WebSocket first if authenticated and connected
    if (isConnected && isAuthenticated) {
      let timeRangeParam;
      switch (timeRange) {
        case '24h': timeRangeParam = 'last_24_hours'; break;
        case '7d': timeRangeParam = 'last_7_days'; break;
        case '30d': timeRangeParam = 'last_30_days'; break;
        case 'all': timeRangeParam = 'all'; break;
      }
      
      const params: any = { 
        range: timeRangeParam 
      };
      
      // Add wallet address if provided
      if (walletAddress && (viewType === 'single' || viewType === 'compare')) {
        params.wallet = walletAddress;
      }
      
      // Type assertion to make TypeScript happy with promise return
      (request('admin', getAction(), params) as unknown as Promise<{
        success: boolean;
        data: any;
        message?: string;
      }>).then(response => {
        if (response.success && response.data) {
          setChartData(formatChartData(response.data));
          
          // Extract series from the data
          if (response.data.series) {
            const seriesData = response.data.series.map((s: any, index: number) => ({
              id: s.id,
              name: s.name,
              color: s.color || COLORS[index % COLORS.length],
              visible: true
            }));
            setSeries(seriesData);
          }
          
          // Callback with data if provided
          if (onDataLoaded) {
            onDataLoaded(response.data);
          }
        } else {
          throw new Error(response.message || 'Failed to fetch balance history');
        }
      }).catch(err => {
        console.warn('WebSocket fetch failed, trying REST API fallback:', err);
        
        // Try REST API as fallback
        fetchFromRestApi()
          .catch(restErr => {
            console.error('REST API fallback also failed:', restErr);
            const errorMessage = restErr instanceof Error ? restErr.message : 'Failed to fetch balance history';
            setError(errorMessage);
            if (onError) onError(errorMessage);
          })
          .finally(() => {
            setIsLoading(false);
          });
      });
    } else {
      // No WebSocket connection, use REST API directly
      fetchFromRestApi()
        .catch(err => {
          console.error('Error fetching balance history:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance history';
          setError(errorMessage);
          if (onError) onError(errorMessage);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isConnected, isAuthenticated, timeRange, walletAddress, viewType, request, onDataLoaded]);
  
  // Make sure the loading state is properly reset when the WebSocket request succeeds
  useEffect(() => {
    if (chartData.length > 0) {
      setIsLoading(false);
    }
  }, [chartData]);
  
  // Format the raw API data into chart-friendly format
  const formatChartData = (data: any): DataPoint[] => {
    return data.history || [];
  };
  
  // Toggle visibility of a series
  const toggleSeries = (seriesId: string) => {
    setSeries(prevSeries => 
      prevSeries.map(s => 
        s.id === seriesId ? { ...s, visible: !s.visible } : s
      )
    );
  };
  
  // Filter data based on visible series
  const visibleData = useMemo(() => {
    if (!chartData.length || !series.length) return chartData;
    
    // Create a deep copy to avoid mutating the original data
    return chartData.map(point => {
      const newPoint: DataPoint = { timestamp: point.timestamp };
      
      // Only include values for visible series
      series.forEach(s => {
        if (s.visible && point[s.id] !== undefined) {
          newPoint[s.id] = point[s.id];
        }
      });
      
      return newPoint;
    });
  }, [chartData, series]);
  
  // Format date for display on chart
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '7d' || timeRange === '30d') {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
    }
  };
  
  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-200/95 border border-dark-400 p-3 rounded shadow-lg">
          <p className="text-gray-300 text-sm mb-1">
            {new Date(label).toLocaleDateString([], { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div 
                key={`item-${index}`} 
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-300 text-sm">
                    {entry.name}:
                  </span>
                </div>
                <span className="text-brand-300 font-medium text-sm">
                  {entry.value.toLocaleString()} SOL
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  
  if (isLoading) {
    return (
      <div className={`flex justify-center items-center ${typeof height === 'number' ? `h-[${height}px]` : `h-${height}`} ${className}`}>
        <div className="w-10 h-10 rounded-full border-4 border-brand-500/30 border-t-brand-500 animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/20 rounded-lg p-4 ${className}`}>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }
  
  if (!chartData.length) {
    return (
      <div className={`bg-dark-200/50 border border-dark-400 rounded-lg p-4 ${className}`}>
        <p className="text-gray-400">No balance history available.</p>
      </div>
    );
  }
  
  return (
    <div className={`bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4 ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-200">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          
          {showControls && (
            <div className="flex space-x-1 bg-dark-300/50 rounded-lg overflow-hidden">
              {(['24h', '7d', '30d', 'all'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm ${
                    timeRange === range
                      ? 'bg-brand-500/20 text-brand-300'
                      : 'hover:bg-dark-400/50 text-gray-400'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div style={{ height: typeof height === 'number' ? `${height}px` : height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={visibleData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3D" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatDate}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={{ stroke: '#374151' }}
            />
            <YAxis 
              tickFormatter={(value) => `${value.toFixed(2)}`}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={{ stroke: '#374151' }}
              label={{ 
                value: 'Balance (SOL)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#9CA3AF', fontSize: 12 }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={(value) => {
                const s = series.find(s => s.name === value);
                return (
                  <span 
                    style={{ color: s?.visible ? '#D1D5DB' : '#6B7280', cursor: 'pointer' }}
                    onClick={() => s && toggleSeries(s.id)}
                  >
                    {value}
                  </span>
                );
              }}
            />
            {series.map(s => (
              s.visible && (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: s.color, strokeWidth: 0 }}
                  activeDot={{ r: 5, stroke: s.color, strokeWidth: 1, fill: s.color }}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {showControls && series.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {series.map(s => (
            <button
              key={s.id}
              onClick={() => toggleSeries(s.id)}
              className={`px-2 py-1 rounded text-xs flex items-center ${
                s.visible
                  ? 'bg-dark-300/80 text-gray-200'
                  : 'bg-dark-300/30 text-gray-500'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full mr-1" 
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletBalanceChart;