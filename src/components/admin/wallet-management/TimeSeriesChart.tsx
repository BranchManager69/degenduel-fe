import { useMemo } from 'react';
import { TrendingUp, Activity } from 'lucide-react';
import type { TimeSeriesDataPoint } from './types';
import { formatUsd, formatSol } from './config';

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  title: string;
  valueKey: keyof TimeSeriesDataPoint | string[];
  formatValue?: (value: number) => string;
}

export function TimeSeriesChart({ data, title, valueKey, formatValue = (v) => v.toString() }: TimeSeriesChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return { points: [], min: 0, max: 0 };

    const getValue = (point: TimeSeriesDataPoint, key: string | string[]): number => {
      if (typeof key === 'string') {
        return point[key as keyof TimeSeriesDataPoint] as number;
      }
      return key.reduce((obj: any, k) => obj[k], point);
    };

    const values = data.map(point => 
      typeof valueKey === 'string' 
        ? getValue(point, valueKey)
        : getValue(point, valueKey)
    );

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    const points = values.map((value, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: ((value - min) / (range || 1)) * 100
    }));

    return { points, min, max };
  }, [data, valueKey]);

  const latestValue = useMemo(() => {
    if (!data.length) return null;
    const getValue = (point: TimeSeriesDataPoint, key: string | string[]): number => {
      if (typeof key === 'string') {
        return point[key as keyof TimeSeriesDataPoint] as number;
      }
      return key.reduce((obj: any, k) => obj[k], point);
    };

    return getValue(data[data.length - 1], valueKey);
  }, [data, valueKey]);

  const previousValue = useMemo(() => {
    if (data.length < 2) return null;
    const getValue = (point: TimeSeriesDataPoint, key: string | string[]): number => {
      if (typeof key === 'string') {
        return point[key as keyof TimeSeriesDataPoint] as number;
      }
      return key.reduce((obj: any, k) => obj[k], point);
    };

    return getValue(data[data.length - 2], valueKey);
  }, [data, valueKey]);

  const percentageChange = useMemo(() => {
    if (!previousValue || !latestValue) return null;
    return ((latestValue - previousValue) / previousValue) * 100;
  }, [latestValue, previousValue]);

  if (!data.length) return null;

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6 w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl shadow-lg">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-200">{title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-3xl font-bold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              {formatValue(latestValue!)}
            </span>
            {percentageChange !== null && (
              <div className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-full ${
                percentageChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <TrendingUp className={`w-4 h-4 ${
                  percentageChange >= 0 ? '' : 'transform rotate-180'
                }`} />
                {Math.abs(percentageChange).toFixed(2)}% {percentageChange >= 0 ? 'increase' : 'decrease'}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative h-64 mt-8">
        {/* Y-axis labels container */}
        <div className="absolute -left-16 top-0 h-full flex flex-col justify-between text-sm text-gray-500">
          {[100, 75, 50, 25, 0].map((y) => {
            const value = chartData.min + ((y / 100) * (chartData.max - chartData.min));
            // For USD values, use formatUsd, for SOL values use formatSol, otherwise use the provided formatter
            let displayValue = formatValue(value);
            if (title.toLowerCase().includes('usd')) {
              displayValue = formatUsd(value.toString());
            } else if (title.toLowerCase().includes('sol') && !title.toLowerCase().includes('token')) {
              displayValue = formatSol(value.toString());
            }
            return (
              <div key={y} className="flex items-center gap-2">
                <span>{displayValue}</span>
              </div>
            );
          })}
        </div>

        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[20, 40, 60, 80].map((y) => (
            <g key={y}>
              <line
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="rgba(99, 102, 241, 0.1)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            </g>
          ))}
          
          {/* Chart line */}
          <path
            d={`M ${chartData.points.length ? chartData.points.map(p => `${p.x},${100 - p.y}`).join(' L ') : '0,0'}`}
            fill="none"
            stroke="url(#line-gradient)"
            strokeWidth="3"
            className="drop-shadow-lg"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="line-gradient" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(79, 70, 229, 0.2)" />
              <stop offset="100%" stopColor="rgba(79, 70, 229, 0)" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path
            d={`M ${chartData.points.length ? `${chartData.points[0].x},100 L ${chartData.points.map(p => `${p.x},${100 - p.y}`).join(' L ')} L ${chartData.points[chartData.points.length - 1].x},100` : '0,100'} Z`}
            fill="url(#area-gradient)"
          />
          
          {/* Data points */}
          {chartData.points.map((point, i) => (
            <g
              key={i}
              transform={`translate(${point.x},${100 - point.y})`}
              className="transition-transform duration-300"
            >
              <circle
                r="4"
                className="fill-brand-500"
              />
              <circle
                r="8"
                className="fill-brand-500 opacity-10"
              />
            </g>
          ))}
        </svg>

        {/* X-axis time labels */}
        <div className="flex justify-between mt-4 text-sm text-gray-500">
          {data.length > 1 && [0, Math.floor(data.length / 2), data.length - 1].map((i) => (
            <div key={i}>
              {new Date(data[i].timestamp).toLocaleTimeString()}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}