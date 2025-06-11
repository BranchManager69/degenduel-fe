import React from "react";

import { Token, TokenHelpers } from "../../types/index";
import { Card, CardContent, CardHeader } from "../ui/Card";

interface PortfolioSummaryProps {
  selectedTokens: Map<string, number>;
  tokens: Token[];
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  selectedTokens,
  tokens,
}) => {
  const totalWeight = Array.from(selectedTokens.values()).reduce(
    (sum, weight) => sum + weight,
    0,
  );

  return (
    <div>
      <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors">
        <CardHeader className="py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-100">
              Portfolio
            </h3>
            <span
              className={`text-xs sm:text-sm font-medium ${
                totalWeight === 100 ? "text-green-400" : 
                totalWeight > 100 ? "text-red-300 font-bold" : "text-gray-400"
              }`}
            >
              {totalWeight}% Allocated
            </span>
          </div>
        </CardHeader>
        <CardContent className="py-2 sm:py-3">
          {/* Weight Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-dark-400 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  totalWeight === 100 ? 'bg-green-500' : 
                  totalWeight > 100 ? 'bg-red-700' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(totalWeight, 100)}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            {Array.from(selectedTokens.entries()).map(
              ([contractAddress, weight]) => {
                const token = tokens.find(
                  (t) => TokenHelpers.getAddress(t) === contractAddress,
                );
                return (
                  <div
                    key={contractAddress}
                    className="flex justify-between items-center p-2 rounded bg-dark-300/50 hover:bg-dark-300/70 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {token?.images?.imageUrl && (
                          <img
                            src={token.images.imageUrl}
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                        <div className="min-w-0">
                          <span className="font-medium text-sm sm:text-base text-gray-200">
                            {token?.symbol || "Unknown"}
                          </span>
                          <span className="text-xs sm:text-sm text-gray-400 ml-2 truncate">
                            {token?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-brand-400 ml-2 flex-shrink-0">
                      {weight}%
                    </span>
                  </div>
                );
              },
            )}
            {selectedTokens.size === 0 && (
              <div className="text-center py-6 px-4">
                <p className="text-xs sm:text-sm text-gray-400">
                  No tokens selected
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Click tokens to add them to your portfolio
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
