// src/components/WalletBalanceChart.tsx

/**
 * @author BranchManager69
 * @description A component that displays a chart of the balance of a wallet over time
 * @version 1.9.0
 * @created 2025-04-28
 * @updated 2025-04-30
 */

import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useUnifiedWebSocket } from '../hooks/websocket/useUnifiedWebSocket';

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

interface WalletApiParams {
  startDate?: string;
  endDate?: string;
  wallets?: string[];
  limit?: number;
  nonZeroOnly?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface WalletBalanceChartProps {
  title?: string;
  description?: string;
  walletAddress?: string;
  viewType?: 'single' | 'compare' | 'total' | 'average' | 'top';
  showControls?: boolean;
  showWalletSelector?: boolean;
  compareMode?: boolean;
  height?: number | string;
  className?: string;
  onDataLoaded?: (data: any) => void;
  onError?: (error: string) => void;
  onWalletChange?: (walletAddress: string) => void;
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
  showWalletSelector = false,
  compareMode = false,
  height = 300,
  className = '',
  onDataLoaded,
  onError,
  onWalletChange,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [series, setSeries] = useState<ChartSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchWallet, setSearchWallet] = useState<string>(walletAddress || '');
  const [selectedWallets, setSelectedWallets] = useState<string[]>(walletAddress ? [walletAddress] : []);
  const [isSearching, setIsSearching] = useState(false);
  
  // Update search wallet when walletAddress prop changes
  useEffect(() => {
    if (walletAddress && walletAddress !== searchWallet) {
      setSearchWallet(walletAddress);
      
      // Only replace the selected wallets array if we're not in compare mode
      if (!compareMode) {
        setSelectedWallets([walletAddress]);
      } else if (!selectedWallets.includes(walletAddress)) {
        // In compare mode, add the wallet if it's not already there
        setSelectedWallets(prev => [...prev, walletAddress]);
      }
    }
  }, [walletAddress]);
  
  // Provide the required parameters to useUnifiedWebSocket
  const { isConnected, isAuthenticated, request } = useUnifiedWebSocket(
    'wallet-balance-chart', // Unique ID for this component
    ['DATA'], // Message types to listen for
    () => {} // Empty callback since we're not using the subscription directly
  );
  
  // Determine the REST API endpoint based on view type
  const getApiEndpoint = (wallet?: string, type = viewType) => {
    switch (type) {
      case 'single': return wallet ? `/api/admin/wallet-monitoring/balances/${wallet}` : '/api/admin/wallet-monitoring/balances';
      case 'compare': return '/api/admin/wallet-monitoring/balances/compare';
      case 'total': return '/api/admin/wallet-monitoring/balances/total';
      case 'average': return '/api/admin/wallet-monitoring/balances/average';
      case 'top': return '/api/admin/wallet-monitoring/balances/top';
      default: return '/api/admin/wallet-monitoring/balances';
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
      if (!walletAddress && viewType === 'single' && !compareMode) {
        throw new Error('Wallet address is required for single wallet view');
      }
      
      const timeParams = getTimeRangeForRestApi();
      let url = getApiEndpoint(walletAddress);
      let params: WalletApiParams = { ...timeParams };
      
      // For compare mode, we need to include all selected wallets
      if (compareMode && selectedWallets.length > 0) {
        params.wallets = selectedWallets;
      }
      
      // Apply additional filters for top wallets view
      if (viewType === 'top') {
        params = {
          ...params,
          limit: 10,
          nonZeroOnly: true,
          sortBy: 'balance',
          sortOrder: 'desc'
        };
      }
      
      const response = await axios.get(url, { params });
      
      if (response.data && response.data.success) {
        // Process API response using our helper function
        const { chartData: formattedData, seriesData } = processApiResponse(response.data);
        
        // Update state with processed data
        if (formattedData && formattedData.length > 0) {
          setChartData(formattedData);
          
          if (seriesData && seriesData.length > 0) {
            setSeries(seriesData);
          } else if (viewType === 'single' && walletAddress) {
            // Create a default series for single wallet view
            setSeries([{
              id: 'balance',
              name: walletAddress 
                ? `Wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : 'Balance',
              color: COLORS[0],
              visible: true
            }]);
          }
          
          // Handle callback if provided
          if (onDataLoaded) {
            onDataLoaded({
              history: formattedData,
              series: seriesData || [],
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
    
    // Use REST API to get initial data
    fetchFromRestApi()
      .then(success => {
        // If REST API succeeded, and we have WebSocket connection 
        // we can also subscribe to real-time updates
        if (success && isConnected && isAuthenticated) {
          // Subscribe to real-time wallet balance updates for selected wallets
          const wallets = compareMode ? selectedWallets : (walletAddress ? [walletAddress] : []);
          
          if (wallets.length > 0) {
            // Properly formatted subscribe command for v69 WS system
            const subscribeData = {
              type: 'SUBSCRIBE',
              topics: ['wallet'],
              data: {
                wallets: wallets,
                type: 'balance',
              }
            };
            
            // Send actual WebSocket subscription
            request('wallet', 'subscribe', subscribeData);
          }
        }
      })
      .catch(err => {
        console.error('Error fetching balance history:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance history';
        setError(errorMessage);
        if (onError) onError(errorMessage);
      })
      .finally(() => {
        setIsLoading(false);
      });
      
    // Cleanup subscription on unmount
    return () => {
      if (isConnected) {
        const wallets = compareMode ? selectedWallets : (walletAddress ? [walletAddress] : []);
        if (wallets.length > 0) {
          // Unsubscribe to clean up
          request('wallet', 'unsubscribe', {
            type: 'balance',
            wallets: wallets
          });
        }
      }
    };
  }, [isConnected, isAuthenticated, timeRange, walletAddress, selectedWallets, compareMode, viewType, request, onDataLoaded]);
  
  // Make sure the loading state is properly reset when the WebSocket request succeeds
  useEffect(() => {
    if (chartData.length > 0) {
      setIsLoading(false);
    }
  }, [chartData]);
  
  // Add a wallet to the comparison
  const addWalletToComparison = async () => {
    if (!searchWallet || selectedWallets.includes(searchWallet)) return;
    
    setIsSearching(true);
    
    try {
      // First try WebSocket if connected to validate wallet exists
      if (isConnected && isAuthenticated) {
        try {
          // Check if wallet exists via WebSocket
          const walletExists = await request('admin', 'wallet-balance/exists', { 
            wallet: searchWallet 
          }) as unknown as { 
            success: boolean; 
            data: { exists: boolean } 
          };
          
          if (walletExists && walletExists.success === true && 
              walletExists.data && walletExists.data.exists === true) {
            
            // Add to selected wallets
            setSelectedWallets(prev => [...prev, searchWallet]);
            
            // If this is the first wallet, update the view type to compare
            if (viewType === 'single' && onWalletChange) {
              onWalletChange(searchWallet);
            }
            
            // Clear search field
            setSearchWallet('');
            return;
          }
        } catch (wsError) {
          console.warn('WebSocket wallet check failed, trying REST API fallback:', wsError);
        }
      }
      
      // Fallback to REST API
      try {
        const response = await fetch(`/api/admin/wallet-monitoring/balances/${searchWallet}?limit=1`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Add to selected wallets
          setSelectedWallets(prev => [...prev, searchWallet]);
          
          // If onWalletChange is provided, call it
          if (onWalletChange) {
            onWalletChange(searchWallet);
          }
          
          // Clear search field
          setSearchWallet('');
        } else {
          throw new Error('Wallet not found or has no balance history');
        }
      } catch (restError) {
        console.error('Error checking wallet via REST API:', restError);
        throw restError;
      }
    } catch (error) {
      console.error('Error adding wallet to comparison:', error);
      // You could add toast notification here
    } finally {
      setIsSearching(false);
    }
  };
  
  // Remove a wallet from the comparison
  const removeWalletFromComparison = (wallet: string) => {
    setSelectedWallets(prev => prev.filter(w => w !== wallet));
    
    // If removing the last or only wallet, notify parent
    if (selectedWallets.length <= 1 && onWalletChange) {
      onWalletChange('');
    } else if (onWalletChange && walletAddress === wallet) {
      // If removing the primary wallet, switch to the first remaining one
      const remaining = selectedWallets.filter(w => w !== wallet);
      if (remaining.length > 0) {
        onWalletChange(remaining[0]);
      }
    }
  };
  
  // Process the API response data and format for chart display
  const processApiResponse = (response: any): { 
    chartData: DataPoint[],
    seriesData?: ChartSeries[]
  } => {
    if (!response || !response.success) {
      return { chartData: [] };
    }
    
    const chartData = response.balances || response.history || [];
    let seriesData: ChartSeries[] = [];

    // Extract series data if available
    if (response.series) {
      seriesData = response.series.map((s: any, index: number) => ({
        id: s.id,
        name: s.name,
        color: s.color || COLORS[index % COLORS.length],
        visible: true
      }));
    } else if (compareMode && response.wallets) {
      // Create series from wallet data
      seriesData = response.wallets.map((wallet: any, index: number) => ({
        id: wallet.address,
        name: wallet.nickname || `Wallet ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
        color: COLORS[index % COLORS.length],
        visible: true
      }));
    }

    return { chartData, seriesData: seriesData.length > 0 ? seriesData : undefined };
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
  
  // If the chart is loading, render a loading spinner
  if (isLoading) {
    return (
      <div className={`flex justify-center items-center ${typeof height === 'number' ? `h-[${height}px]` : `h-${height}`} ${className}`}>
        <div className="w-10 h-10 rounded-full border-4 border-brand-500/30 border-t-brand-500 animate-spin"></div>
      </div>
    );
  }
  
  // If there is an error, render a message
  if (error) {
    return (
      <div className={`bg-red-500/10 border border-red-500/20 rounded-lg p-4 ${className}`}>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }
  
  // If there is no chart data, render a message
  if (!chartData.length) {
    return (
      <div className={`bg-dark-200/50 border border-dark-400 rounded-lg p-4 ${className}`}>
        <p className="text-gray-400">No balance history available.</p>
      </div>
    );
  }
  
  // Render the wallet balance chart
  return (
    <div className={`bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4 ${className}`}>
      {/* Title and description */}
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
      
      {/* Wallet Selector */}
      {showWalletSelector && (
        <div className="mb-4">
          <div className="flex flex-col space-y-2">
            {/* Search and add wallet */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchWallet}
                onChange={(e) => setSearchWallet(e.target.value)}
                placeholder="Enter wallet address..."
                className="flex-1 bg-dark-300/50 border border-dark-400/50 rounded-lg px-3 py-2 text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500/30"
              />
              <button
                onClick={addWalletToComparison}
                disabled={!searchWallet || isSearching || selectedWallets.includes(searchWallet)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  !searchWallet || isSearching || selectedWallets.includes(searchWallet)
                    ? 'bg-brand-500/20 text-brand-400/50 cursor-not-allowed'
                    : 'bg-brand-500/30 hover:bg-brand-500/40 text-brand-300'
                }`}
              >
                {isSearching ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin mr-2"></div>
                    Add
                  </div>
                ) : (
                  compareMode ? 'Add to Compare' : 'Set Wallet'
                )}
              </button>
            </div>
            
            {/* Selected wallets */}
            {(compareMode || selectedWallets.length > 1) && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedWallets.map(wallet => (
                  <div key={wallet} 
                    className="bg-dark-300/30 border border-dark-400/50 rounded-full px-2 py-1 text-xs flex items-center gap-1"
                  >
                    <span className="text-gray-300 truncate max-w-[120px]">
                      {wallet.length > 8 ? `${wallet.slice(0, 4)}...${wallet.slice(-4)}` : wallet}
                    </span>
                    <button 
                      onClick={() => removeWalletFromComparison(wallet)}
                      className="text-gray-400 hover:text-gray-200 h-4 w-4 flex items-center justify-center rounded-full"
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L7 7M1 7L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Chart */}
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
      
      {/* Series toggle */}
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