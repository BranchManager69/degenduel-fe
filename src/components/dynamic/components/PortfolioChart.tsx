// src/components/dynamic/components/PortfolioChart.tsx

/**
 * Dynamic Portfolio Chart Component
 * 
 * @description AI-generated portfolio visualization component
 * @author BranchManager69 + Claude Code
 * @version 1.0.0
 * @created 2025-05-25
 */

import React, { useMemo } from 'react';
import { DynamicComponentProps, PortfolioChartData } from '../types';
import { Button } from '../../ui/Button';

const PortfolioChart: React.FC<DynamicComponentProps> = ({
  id,
  data,
  onClose: _onClose,
  onUpdate,
  className = ''
}) => {
  const portfolioData = data as PortfolioChartData;

  // Generate colors for tokens if not provided
  const tokensWithColors = useMemo(() => {
    const colors = [
      '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
      '#EC4899', '#84CC16', '#F97316', '#6366F1', '#14B8A6'
    ];
    
    return portfolioData?.tokens?.map((token, index) => ({
      ...token,
      color: token.color || colors[index % colors.length]
    })) || [];
  }, [portfolioData?.tokens]);

  const totalValue = useMemo(() => {
    return tokensWithColors.reduce((sum, token) => sum + token.value, 0);
  }, [tokensWithColors]);

  if (!portfolioData?.tokens?.length) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-gray-400 text-sm font-mono">
          No portfolio data available
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      {/* Chart Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-mono text-white font-semibold">Portfolio Overview</h3>
          <p className="text-sm text-gray-400 font-mono">
            Total Value: ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdate?.({ ...portfolioData, chart_type: 'pie' })}
            className="text-xs"
          >
            Pie
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdate?.({ ...portfolioData, chart_type: 'bar' })}
            className="text-xs"
          >
            Bar
          </Button>
        </div>
      </div>

      {/* Simple Pie Chart Visualization */}
      <div className="flex items-center gap-6">
        {/* Pie Chart */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {(() => {
              let currentAngle = 0;
              const radius = 80;
              const centerX = 100;
              const centerY = 100;

              return tokensWithColors.map((token, index) => {
                const percentage = (token.value / totalValue) * 100;
                const angle = (percentage / 100) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;

                // Convert to radians
                const startAngleRad = (startAngle * Math.PI) / 180;
                const endAngleRad = (endAngle * Math.PI) / 180;

                // Calculate path
                const x1 = centerX + radius * Math.cos(startAngleRad);
                const y1 = centerY + radius * Math.sin(startAngleRad);
                const x2 = centerX + radius * Math.cos(endAngleRad);
                const y2 = centerY + radius * Math.sin(endAngleRad);

                const largeArcFlag = angle > 180 ? 1 : 0;

                const pathData = [
                  `M ${centerX} ${centerY}`,
                  `L ${x1} ${y1}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ');

                currentAngle += angle;

                return (
                  <path
                    key={`${id}-${token.symbol}-${index}`}
                    d={pathData}
                    fill={token.color}
                    stroke="#1a1a1a"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <title>{token.symbol}: {percentage.toFixed(1)}%</title>
                  </path>
                );
              });
            })()}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {tokensWithColors.map((token, index) => {
            const percentage = (token.value / totalValue) * 100;
            return (
              <div 
                key={`${id}-legend-${token.symbol}-${index}`}
                className="flex items-center gap-3 p-2 rounded hover:bg-darkGrey-dark/30 transition-colors"
              >
                <div 
                  className="w-4 h-4 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: token.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono text-white font-medium">
                      {token.symbol}
                    </span>
                    <span className="text-sm font-mono text-gray-300">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>${token.value.toLocaleString()}</span>
                    <span className={`${token.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {token.change_24h >= 0 ? '+' : ''}{token.change_24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-mauve/20 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdate?.({ ...portfolioData, timeframe: '24H' })}
          className="text-xs"
        >
          24H View
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdate?.({ ...portfolioData, timeframe: '7D' })}
          className="text-xs"
        >
          7D View
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            // Export as image functionality could go here
            console.log('Export portfolio chart');
          }}
          className="text-xs"
        >
          Export
        </Button>
      </div>
    </div>
  );
};

export default PortfolioChart;