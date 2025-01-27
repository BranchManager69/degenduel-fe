import React from "react";
import { Token } from "../../types/index";
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
    0
  );

  return (
    <div className="sticky top-4">
      <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-100">Portfolio</h3>
            <span
              className={`text-sm font-medium ${
                totalWeight === 100 ? "text-green-400" : "text-gray-400"
              }`}
            >
              {totalWeight}% Allocated
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from(selectedTokens.entries()).map(
              ([contractAddress, weight]) => {
                const token = tokens.find(
                  (t) => t.contractAddress === contractAddress
                );
                return (
                  <div
                    key={contractAddress}
                    className="flex justify-between items-center p-2 rounded bg-dark-300/50 hover:bg-dark-300/70 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {token?.imageUrl && (
                          <img
                            src={token.imageUrl}
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                        <div className="min-w-0">
                          <span className="font-medium text-gray-200">
                            {token?.symbol || "Unknown"}
                          </span>
                          <span className="text-sm text-gray-400 ml-2 truncate">
                            {token?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-brand-400 ml-2 flex-shrink-0">
                      {weight}%
                    </span>
                  </div>
                );
              }
            )}
            {selectedTokens.size === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No tokens selected. Click tokens to add them to your portfolio.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
