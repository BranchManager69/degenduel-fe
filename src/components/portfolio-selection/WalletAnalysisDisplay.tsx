// src/components/portfolio-selection/WalletAnalysisDisplay.tsx

import { ArrowDownIcon, AlertCircleIcon } from "lucide-react";
import { WalletAnalysisResponse } from "../../types/wallet-analysis";
import { Card } from "../ui/Card";

interface WalletAnalysisDisplayProps {
  data: WalletAnalysisResponse;
  onTokenSelect?: (mint: string) => void;
  selectedTokens?: Set<string>;
}

export function WalletAnalysisDisplay({ 
  data, 
  onTokenSelect,
  selectedTokens = new Set()
}: WalletAnalysisDisplayProps) {
  const formatValue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary Card */}
      <Card className="bg-dark-200/80 backdrop-blur-sm border-emerald-500/20 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Portfolio Summary</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Total Value</p>
            <p className="text-xl font-bold text-white">
              {formatValue(data.portfolio.totalValue)}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-400 mb-1">Realizable Value</p>
            <p className="text-xl font-bold text-emerald-400">
              {formatValue(data.portfolio.totalRealizableValue)}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-400 mb-1">Deployment Ratio</p>
            <p className="text-xl font-bold text-blue-400">
              {formatPercentage(data.portfolio.deploymentRatio)}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-gray-400 mb-1">SOL Balance</p>
            <p className="text-xl font-bold text-purple-400">
              {data.summary.solBalance.sol.toFixed(4)} SOL
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 mb-1">Avg Market Cap (Weighted)</p>
            <p className="text-sm font-medium text-white">
              {formatValue(data.portfolio.weightedAvgMarketCap)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Avg Liquidity (Weighted)</p>
            <p className="text-sm font-medium text-white">
              {formatValue(data.portfolio.weightedAvgLiquidity)}
            </p>
          </div>
        </div>
      </Card>

      {/* Token Holdings */}
      <Card className="bg-dark-200/80 backdrop-blur-sm border-emerald-500/20 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Token Holdings</h3>
          <div className="text-xs text-gray-400">
            {data.summary.tokensShown} tokens shown | {data.summary.scamFiltered} filtered
          </div>
        </div>

        <div className="space-y-3">
          {data.tokens.map((token) => (
            <div
              key={token.mint}
              className={`bg-dark-300/50 rounded-lg p-4 cursor-pointer transition-all duration-200 relative overflow-hidden
                ${selectedTokens.has(token.mint) 
                  ? 'ring-2 ring-emerald-500 bg-emerald-500/10' 
                  : 'hover:bg-dark-300/80'}`}
              onClick={() => onTokenSelect?.(token.mint)}
              style={{
                backgroundImage: token.bannerUrl ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url(${token.bannerUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {token.logoUrl && (
                      <img 
                        src={token.logoUrl} 
                        alt={`${token.symbol} logo`}
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <h4 className="font-semibold text-white">{token.symbol}</h4>
                    {token.isSOL && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                        Native
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300">{token.name}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-gray-300">
                      Balance: {token.balance.toLocaleString()}
                    </span>
                    {token.supplyPercentage && (
                      <span className="text-yellow-400">
                        {formatPercentage(token.supplyPercentage)} of supply
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold text-white">
                    {formatValue(token.value)}
                  </p>
                  {token.priceImpact && token.priceImpact > 5 && (
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <AlertCircleIcon className="w-3 h-3 text-orange-400" />
                      <span className="text-xs text-orange-400">
                        {formatPercentage(token.priceImpact)} impact
                      </span>
                    </div>
                  )}
                  {token.realizableValue < token.value && (
                    <div className="flex items-center gap-1 justify-end text-xs text-gray-400">
                      <ArrowDownIcon className="w-3 h-3" />
                      {formatValue(token.realizableValue)}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional metrics */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-700/50">
                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-xs font-medium text-gray-300">
                    ${token.price?.toFixed(8) || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Market Cap</p>
                  <p className="text-xs font-medium text-gray-300">
                    {token.marketCap ? formatValue(token.marketCap) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Liquidity</p>
                  <p className="text-xs font-medium text-gray-300">
                    {token.realQuoteLiquidity ? formatValue(token.realQuoteLiquidity) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}