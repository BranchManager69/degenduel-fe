// src/components/admin/HistoricalPerformanceChart.tsx

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
import { useUnifiedWebSocket } from '../../hooks/websocket/useUnifiedWebSocket';
import { DDExtendedMessageType } from '../../hooks/websocket/types';

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

interface HistoricalPerformanceChartProps {
  title: string;
  description?: string;
  dataType: 'rpc-benchmarks' | 'wallet-balances';
  yAxisLabel?: string;
  yAxisValueFormatter?: (value: number) => string;
  className?: string;
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

export const HistoricalPerformanceChart: React.FC<HistoricalPerformanceChartProps> = ({
  title,
  description,
  dataType,
  yAxisLabel = 'Value',
  yAxisValueFormatter = (value) => `${value}`,
  className = '',
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [series, setSeries] = useState<ChartSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Provide required parameters to useUnifiedWebSocket hook
  const { isConnected, isAuthenticated, request } = useUnifiedWebSocket(
    'historical-performance-chart', // Unique ID for this component
    [DDExtendedMessageType.DATA], // Message types to listen for using proper enum
    () => {} // Empty callback since we're not using the subscription directly
  );
  
  // Determine the appropriate topic based on data type
  const topic = dataType === 'rpc-benchmarks' ? 'admin' : 'admin';
  const action = dataType === 'rpc-benchmarks' ? 'rpc-benchmarks/history' : 'wallet-balances/history';
  
  // Fetch historical data when component mounts or time range changes
  useEffect(() => {
    if (!isConnected || !isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    let timeRangeParam;
    switch (timeRange) {
      case '24h': timeRangeParam = 'last_24_hours'; break;
      case '7d': timeRangeParam = 'last_7_days'; break;
      case '30d': timeRangeParam = 'last_30_days'; break;
      case 'all': timeRangeParam = 'all'; break;
    }
    
    // Type assertion to make TypeScript happy
    (request(topic, action, { 
      range: timeRangeParam 
    }) as unknown as Promise<{
      success: boolean;
      data: any;
      message?: string;
    }>).then(response => {
      // Add type check to validate response format before accessing properties
      if (response && typeof response === 'object' && 'success' in response && 'data' in response && response.success) {
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
      } else {
        let errorMessage = 'Failed to fetch historical data';
        if (response && typeof response === 'object' && 'message' in response) {
          errorMessage = response.message as string || errorMessage;
        }
        throw new Error(errorMessage);
      }
    }).catch(err => {
      console.error('Error fetching historical data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
    }).finally(() => {
      setIsLoading(false);
    });
  }, [isConnected, isAuthenticated, timeRange, topic, action, request]);
  
  // Format the raw API data into chart-friendly format
  const formatChartData = (data: any): DataPoint[] => {
    // The data should already come in a format with timestamps and values by provider
    if (dataType === 'rpc-benchmarks') {
      return data.dataPoints || [];
    } else {
      // Handle wallet balance history format
      return data.history || [];
    }
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
    if (!chartData.length || !series.length) return [];
    
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
                  {dataType === 'rpc-benchmarks' 
                    ? `${entry.value.toFixed(1)} ms`
                    : entry.value.toLocaleString() + ' SOL'}
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
      <div className={`flex justify-center items-center h-64 ${className}`}>
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
        <p className="text-gray-400">No historical data available.</p>
      </div>
    );
  }
  
  return (
    <div className={`bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-4 ${className}`}>
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
      </div>
      
      <div className="h-64 mt-2">
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
              tickFormatter={yAxisValueFormatter}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={{ stroke: '#374151' }}
              label={{ 
                value: yAxisLabel, 
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
    </div>
  );
};

export default HistoricalPerformanceChart;