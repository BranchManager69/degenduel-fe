import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Token } from '../../types';

interface PortfolioSummaryProps {
  selectedTokens: Map<string, number>;
  tokens: Token[];
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  selectedTokens,
  tokens,
}) => {
  const totalWeight = Array.from(selectedTokens.values()).reduce((sum, weight) => sum + weight, 0);

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-100">Portfolio Summary</h3>
          <span className={`text-sm font-medium ${
            totalWeight === 100 ? 'text-green-400' : 'text-gray-400'
          }`}>
            {totalWeight}% Allocated
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from(selectedTokens.entries()).map(([symbol, weight]) => {
            const token = tokens.find((t) => t.symbol === symbol);
            return (
              <div key={symbol} className="flex justify-between items-center p-2 rounded bg-dark-300/50">
                <div>
                  <span className="font-medium text-gray-200">{symbol}</span>
                  <span className="text-sm text-gray-400 ml-2">{token?.name}</span>
                </div>
                <span className="text-sm font-medium text-brand-400">{weight}%</span>
              </div>
            );
          })}
          {selectedTokens.size === 0 && (
            <p className="text-sm text-gray-400 text-center">
              No tokens selected. Click tokens to add them to your portfolio.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};