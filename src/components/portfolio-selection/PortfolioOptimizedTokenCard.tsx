import React, { useMemo, useState, useCallback } from "react";
import { Token, TokenHelpers } from "../../types";
import { formatNumber, formatTokenPrice, formatPercentage } from "../../utils/format";
import { CopyToClipboard } from "../common/CopyToClipboard";
import { FaCoins } from "react-icons/fa";

// Helper function to get a color based on token symbol
const getTokenColor = (symbol: string): string => {
  const colors: Record<string, string> = {
    SOL: '#14F195',
    BTC: '#F7931A',
    ETH: '#627EEA',
    DOGE: '#C3A634',
    ADA: '#0033AD',
    WIF: '#9945FF',
    PEPE: '#479F53',
    BONK: '#F2A900',
    SHIB: '#FFA409'
  };
  return colors[symbol] || '#7F00FF'; // Default to brand purple
};

interface PortfolioOptimizedTokenCardProps {
  token: Token;
  isSelected: boolean;
  weight: number;
  onSelect: () => void;
  onWeightChange: (weight: number) => void;
}

/**
 * PortfolioOptimizedTokenCard - Enhanced version of OptimizedTokenCard
 * specifically designed for portfolio selection with weight management
 * 
 * Key Features:
 * - Stunning visual design from OptimizedTokenCard
 * - Portfolio weight selection functionality
 * - Smart interaction: click to select, expandable weight slider
 * - Multi-timeframe data display
 * - Banner backgrounds with smart overlays
 */
export const PortfolioOptimizedTokenCard: React.FC<PortfolioOptimizedTokenCardProps> = React.memo(({ 
  token, 
  isSelected,
  weight,
  onSelect,
  onWeightChange
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [tempWeight, setTempWeight] = useState(weight.toString());

  // Handle card click - select/deselect token
  const handleCardClick = useCallback(() => {
    onSelect();
  }, [onSelect]);

  // Sync tempWeight with weight prop
  React.useEffect(() => {
    setTempWeight(weight.toString());
  }, [weight]);

  // Handle weight slider change
  const handleWeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onWeightChange(Number(e.target.value));
  }, [onWeightChange]);

  // Handle in-line weight editing
  const handleWeightEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSelected) {
      setIsEditingWeight(true);
      setTempWeight(weight.toString());
    }
  }, [isSelected, weight]);

  const handleWeightSubmit = useCallback(() => {
    const newWeight = Math.max(0, Math.min(100, parseInt(tempWeight) || 0));
    onWeightChange(newWeight);
    setIsEditingWeight(false);
  }, [tempWeight, onWeightChange]);

  const handleWeightCancel = useCallback(() => {
    setTempWeight(weight.toString());
    setIsEditingWeight(false);
  }, [weight]);

  // Toggle details view
  const handleDetailsToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  }, [showDetails]);

  // Prioritize high-res banner image for background
  const bannerUrl = useMemo(() => {
    return token.header_image_url || token.images?.headerImage || null;
  }, [token.header_image_url, token.images]);
  
  // Fallback logo for overlay
  const logoUrl = useMemo(() => {
    return token.image_url || token.images?.imageUrl || null;
  }, [token.image_url, token.images]);
  
  // Calculate intelligent metrics using TokenHelpers
  const metrics = useMemo(() => {
    const priceChanges = TokenHelpers.getPriceChanges(token);
    const transactions = TokenHelpers.getTransactions(token);
    const change24h = TokenHelpers.getPriceChange(token);
    
    const change5m = priceChanges?.m5 || 0;
    const change1h = priceChanges?.h1 || 0;
    const buys5m = transactions?.m5?.buys || 0;
    const sells5m = transactions?.m5?.sells || 0;
    const priorityScore = token.priority_score || token.priorityScore || 0;
    
    return {
      momentum: change5m !== 0 ? change5m : change1h,
      velocity: Math.abs(change5m) + Math.abs(change1h),
      activity: buys5m + sells5m,
      priority: priorityScore,
      trend: change24h >= 0 ? 'up' : 'down'
    };
  }, [token]);

  return (
    <div className="aspect-[3/4] w-full perspective-1000">
      <div className="relative w-full h-full">
        {/* Main Card */}
        <div 
          className={`relative w-full h-full rounded-xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 ${
            isSelected 
              ? 'ring-2 ring-brand-500 shadow-brand-500/20 scale-105 z-20' 
              : 'hover:scale-[1.02] hover:shadow-xl z-10'
          }`}
          onClick={handleCardClick}
        >
          <div className="relative w-full h-full bg-dark-200/70 backdrop-blur-sm hover:bg-dark-200/80 transition-all duration-300 group">
            
            {/* HIGH-RES BANNER BACKGROUND with Parallax */}
            <div className="absolute inset-0 overflow-hidden">
              {bannerUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  style={{
                    backgroundImage: `url(${bannerUrl})`,
                    backgroundPosition: 'center 30%',
                    backgroundSize: 'cover'
                  }}
                />
              ) : (
                <div 
                  className="absolute inset-0 transform group-hover:scale-105 transition-transform duration-700" 
                  style={{
                    background: `linear-gradient(135deg, ${token.color || getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.8) 100%)`,
                  }}
                />
              )}
              
              {/* Smart gradient overlay - adapts to trend and selection */}
              <div className={`absolute inset-0 transition-all duration-500 ${
                isSelected
                  ? 'bg-gradient-to-t from-brand-900/90 via-black/60 to-black/20'
                  : metrics.trend === 'up' 
                    ? 'bg-gradient-to-t from-green-900/80 via-black/60 to-black/20'
                    : 'bg-gradient-to-t from-red-900/80 via-black/60 to-black/20'
              }`} />
              
              {/* Selection pulse effect */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-t from-brand-500/20 to-transparent animate-pulse" />
              )}
              
              {/* Data pulse overlay based on activity */}
              {metrics.activity > 10 && (
                <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/10 to-transparent animate-pulse" />
              )}
            </div>

            {/* COMPACT DATA OVERLAY */}
            <div className="absolute inset-0 p-3 flex flex-col justify-between">
              
              {/* TOP ROW - Selection Status & Momentum */}
              <div className="flex justify-between items-start">
                {/* Enhanced Selection Indicator with In-line Editing */}
                <div className={`
                  bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 border transition-all duration-300
                  ${isSelected 
                    ? 'border-emerald-500/50 ring-1 ring-emerald-500/30' 
                    : 'border-gray-500/30'
                  }
                `}>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      isSelected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                    }`} />
                    {isSelected ? (
                      isEditingWeight ? (
                        <div className="flex items-center gap-1 bg-emerald-500/30 rounded border border-emerald-400/40 px-1">
                          <input
                            type="number"
                            value={tempWeight}
                            onChange={(e) => setTempWeight(e.target.value)}
                            className="w-8 bg-transparent text-emerald-200 text-xs font-bold text-center focus:outline-none"
                            min="0"
                            max="100"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-emerald-200 text-xs">%</span>
                          <button
                            onClick={handleWeightSubmit}
                            className="text-emerald-200 hover:text-emerald-100 text-xs"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleWeightCancel}
                            className="text-emerald-300 hover:text-emerald-200 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleWeightEdit}
                          className="text-xs font-mono text-emerald-300 hover:text-emerald-200 transition-colors"
                        >
                          {weight}%
                        </button>
                      )
                    ) : (
                      <span className="text-xs font-mono text-gray-400">
                        SELECT
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Details Toggle Button */}
                <button
                  onClick={handleDetailsToggle}
                  className="bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 border border-gray-500/30 hover:border-white/50 transition-colors"
                >
                  <span className="text-white text-xs">
                    {showDetails ? '📊' : 'ℹ️'}
                  </span>
                </button>
              </div>
              
              {/* MIDDLE ROW - Logo + Symbol */}
              <div className="flex items-center space-x-3">
                {logoUrl && (
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-black/40 backdrop-blur-sm border border-white/20">
                    <img src={logoUrl} alt={token.symbol} className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <h3 className="text-2xl font-bold text-white drop-shadow-lg">{token.symbol}</h3>
                  {token.tags && token.tags.length > 0 && (
                    <div className="flex space-x-1 mt-1">
                      {token.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-xs bg-brand-500/30 text-brand-200 px-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* BOTTOM ROW - Price & Performance */}
              <div className="space-y-2">
                {/* Price with trend arrow */}
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-white">{formatTokenPrice(TokenHelpers.getPrice(token))}</div>
                  <div className={`flex items-center ${metrics.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    <div className={`text-sm font-mono ${TokenHelpers.getPriceChange(token) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {TokenHelpers.getPriceChange(token) >= 0 ? '↗' : '↘'} {formatPercentage(TokenHelpers.getPriceChange(token), false)}
                    </div>
                  </div>
                </div>
                
                {/* Market Cap */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-300">MCap: ${formatNumber(TokenHelpers.getMarketCap(token), 'short')}</div>
                  <div className="flex items-center space-x-1">
                    {/* Activity indicators */}
                    {(() => {
                      const transactions = TokenHelpers.getTransactions(token);
                      const tx5m = transactions?.m5;
                      return tx5m && (
                        <div className="flex items-center space-x-1">
                          <div className={`w-1 h-3 rounded-full ${
                            tx5m.buys > tx5m.sells ? 'bg-green-400' : 'bg-gray-600'
                          }`}></div>
                          <div className={`w-1 h-3 rounded-full ${
                            tx5m.sells > tx5m.buys ? 'bg-red-400' : 'bg-gray-600'
                          }`}></div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* PORTFOLIO WEIGHT SLIDER - Enhanced Design */}
            <div
              className={`absolute bottom-0 left-0 right-0 transform transition-all duration-300 ease-out overflow-hidden ${
                isSelected
                  ? "h-16 opacity-100 translate-y-0"
                  : "h-0 opacity-0 translate-y-2"
              }`}
            >
              <div
                className="bg-black/70 backdrop-blur-sm p-3 border-t border-brand-500/30"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-medium text-brand-300 flex items-center gap-1">
                    <FaCoins size={10} className="text-brand-400" />
                    Portfolio Weight
                  </label>
                  <span className="text-sm font-bold text-brand-400 tabular-nums">
                    {weight}%
                  </span>
                </div>

                {/* Enhanced Slider */}
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={weight}
                    onChange={handleWeightChange}
                    className="w-full h-2 bg-gradient-to-r from-dark-400 via-brand-500/30 to-dark-400 rounded-full appearance-none cursor-pointer
                      focus:outline-none focus:ring-2 focus:ring-brand-500/50
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-4
                      [&::-webkit-slider-thumb]:h-4
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-gradient-to-r
                      [&::-webkit-slider-thumb]:from-brand-400
                      [&::-webkit-slider-thumb]:to-brand-500
                      [&::-webkit-slider-thumb]:hover:from-brand-300
                      [&::-webkit-slider-thumb]:hover:to-brand-400
                      [&::-webkit-slider-thumb]:transition-colors
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:border-2
                      [&::-webkit-slider-thumb]:border-white/30
                      [&::-webkit-slider-thumb]:shadow-lg
                      [&::-webkit-slider-thumb]:shadow-brand-500/50
                      [&::-moz-range-thumb]:w-4
                      [&::-moz-range-thumb]:h-4
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-gradient-to-r
                      [&::-moz-range-thumb]:from-brand-400
                      [&::-moz-range-thumb]:to-brand-500
                      [&::-moz-range-thumb]:hover:from-brand-300
                      [&::-moz-range-thumb]:hover:to-brand-400
                      [&::-moz-range-thumb]:transition-colors
                      [&::-moz-range-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:border-2
                      [&::-moz-range-thumb]:border-white/30
                      [&::-moz-range-thumb]:shadow-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS OVERLAY - Slides down from top */}
        <div
          className={`absolute top-0 left-0 right-0 transform transition-all duration-300 ease-out overflow-hidden z-30 ${
            showDetails
              ? "h-full opacity-100 translate-y-0"
              : "h-0 opacity-0 -translate-y-2"
          }`}
        >
          <div className="w-full h-full bg-dark-200/95 backdrop-blur-md rounded-xl border border-dark-400 p-3">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-white truncate">{token.name}</h3>
              <button
                onClick={handleDetailsToggle}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* MULTI-TIMEFRAME GRID */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {/* 5m Change */}
              <div className="bg-dark-300/60 rounded p-2">
                <div className="text-xs text-gray-400">5m</div>
                <div className={`text-sm font-bold ${
                  (TokenHelpers.getPriceChanges(token)?.m5 || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercentage(TokenHelpers.getPriceChanges(token)?.m5)}
                </div>
              </div>
              
              {/* 1h Change */}
              <div className="bg-dark-300/60 rounded p-2">
                <div className="text-xs text-gray-400">1h</div>
                <div className={`text-sm font-bold ${
                  (TokenHelpers.getPriceChanges(token)?.h1 || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatPercentage(TokenHelpers.getPriceChanges(token)?.h1)}
                </div>
              </div>
              
              {/* FDV */}
              <div className="bg-dark-300/60 rounded p-2">
                <div className="text-xs text-gray-400">FDV</div>
                <div className="text-sm font-bold text-white">
                  ${formatNumber(TokenHelpers.getFDV(token), 'short')}
                </div>
              </div>
              
              {/* Liquidity */}
              <div className="bg-dark-300/60 rounded p-2">
                <div className="text-xs text-gray-400">Liquidity</div>
                <div className="text-sm font-bold text-white">
                  ${formatNumber(TokenHelpers.getLiquidity(token), 'short')}
                </div>
              </div>
            </div>
            
            {/* TRANSACTION ACTIVITY */}
            {(() => {
              const transactions = TokenHelpers.getTransactions(token);
              return transactions && (
                <div className="mb-3">
                  <div className="text-xs text-gray-400 mb-1">Activity (5m)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-500/20 rounded p-2 text-center">
                      <div className="text-xs text-green-400">Buys</div>
                      <div className="text-sm font-bold text-green-300">
                        {transactions.m5?.buys || 0}
                      </div>
                    </div>
                    <div className="bg-red-500/20 rounded p-2 text-center">
                      <div className="text-xs text-red-400">Sells</div>
                      <div className="text-sm font-bold text-red-300">
                        {transactions.m5?.sells || 0}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* CONTRACT ADDRESS */}
            <div className="mt-auto">
              <CopyToClipboard text={TokenHelpers.getAddress(token)}>
                <div className="bg-dark-300/60 rounded p-2 cursor-pointer hover:bg-dark-300/80 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Contract</span>
                    <span className="text-white/30">📋</span>
                  </div>
                  <p className="font-mono text-xs text-white/70 truncate">
                    {`${TokenHelpers.getAddress(token).slice(0, 8)}...${TokenHelpers.getAddress(token).slice(-6)}`}
                  </p>
                </div>
              </CopyToClipboard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PortfolioOptimizedTokenCard.displayName = 'PortfolioOptimizedTokenCard';