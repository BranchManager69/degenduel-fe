import React from 'react';
import { formatCurrency } from '../../lib/utils';

interface PerformanceData {
  timestamp: string;
  value: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  return (
    <div className="h-64 relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-400">
        <span>{formatCurrency(maxValue)}</span>
        <span>{formatCurrency(minValue)}</span>
      </div>

      {/* Chart area */}
      <div className="absolute left-16 right-0 top-0 bottom-0">
        <svg className="w-full h-full">
          {/* Grid lines */}
          {[...Array(5)].map((_, i) => (
            <line
              key={i}
              x1="0"
              y1={i * (100 / 4) + '%'}
              x2="100%"
              y2={i * (100 / 4) + '%'}
              stroke="currentColor"
              className="text-dark-300"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ))}

          {/* Line chart */}
          <path
            d={data.map((point, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = ((point.value - minValue) / range) * 100;
              return `${i === 0 ? 'M' : 'L'} ${x}% ${100 - y}%`;
            }).join(' ')}
            fill="none"
            stroke="currentColor"
            className="text-brand-500"
            strokeWidth="2"
          />

          {/* Area under the line */}
          <path
            d={`
              ${data.map((point, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = ((point.value - minValue) / range) * 100;
                return `${i === 0 ? 'M' : 'L'} ${x}% ${100 - y}%`;
              }).join(' ')}
              L 100% 100%
              L 0% 100%
              Z
            `}
            className="fill-brand-500/10"
          />

          {/* Data points */}
          {data.map((point, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = ((point.value - minValue) / range) * 100;
            return (
              <circle
                key={i}
                cx={`${x}%`}
                cy={`${100 - y}%`}
                r="3"
                className="fill-brand-500"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};