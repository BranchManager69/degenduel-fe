import React from "react";

import { formatCurrency } from "../../lib/utils";
import { Card, CardHeader, CardContent } from "../ui/Card";

interface PortfolioPerformanceProps {
  tokens: {
    token: {
      name: string;
      symbol: string;
      price: number;
    };
    amount: number;
    initialValue: number;
    currentValue: number;
  }[];
  totalValue: number;
  totalChange: number;
}

export const PortfolioPerformance: React.FC<PortfolioPerformanceProps> = ({
  tokens,
  totalValue,
  totalChange,
}) => {
  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-100">
            Your Portfolio
          </h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-100">
              {formatCurrency(totalValue)}
            </div>
            <div
              className={`text-sm ${totalChange >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {totalChange >= 0 ? "+" : ""}
              {totalChange.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tokens.map(({ token, amount, initialValue, currentValue }) => {
            const change = ((currentValue - initialValue) / initialValue) * 100;
            const formattedAmount =
              token.price >= 0.01 ? amount.toFixed(2) : amount.toFixed(0);

            return (
              <div key={token.symbol} className="p-4 rounded-lg bg-dark-300/50">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <div className="text-lg font-medium text-gray-100">
                      {token.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {formattedAmount} {token.symbol}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-100">
                      {formatCurrency(currentValue)}
                    </div>
                    <div
                      className={`text-sm ${change >= 0 ? "text-green-400" : "text-red-400"}`}
                    >
                      {change >= 0 ? "+" : ""}
                      {change.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="relative h-2 bg-dark-400 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                      change >= 0 ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(Math.max((change + 100) / 2, 0), 100)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
