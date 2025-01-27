import React from "react";
import {
  FaCoins,
  FaDiscord,
  FaGlobe,
  FaTelegram,
  FaTwitter,
} from "react-icons/fa";
import { formatCurrency, formatMarketCap } from "../../lib/utils";
import { Token } from "../../types/index";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { TokenSparkline } from "./TokenSparkline";

interface TokenGridProps {
  tokens: Token[];
  selectedTokens: Map<string, number>;
  onTokenSelect: (contractAddress: string, weight: number) => void;
  marketCapFilter: string;
}

// Helper function for dynamic price formatting
const formatTokenPrice = (price: string | number): string => {
  const numPrice = Number(price);
  if (numPrice >= 1) {
    ////return `${numPrice.toFixed(2)} SOL`; // Show cents for prices >= 1
    return `$${numPrice.toFixed(2)}`; // Show cents for prices >= 1
  } else if (numPrice >= 0.01) {
    ////return `${numPrice.toFixed(3)} SOL`; // Show 3 decimals for prices >= 0.01
    return `$${numPrice.toFixed(3)}`; // Show 3 decimals for prices >= 0.01
  } else {
    // For very small prices, show significant digits
    ////return `${numPrice.toPrecision(2)} SOL`;
    return `$${numPrice.toPrecision(3)}`;
  }
};

export const TokenGrid: React.FC<TokenGridProps> = ({
  tokens,
  selectedTokens,
  onTokenSelect,
  marketCapFilter,
}) => {
  const filteredTokens = tokens.filter((token) => {
    if (!marketCapFilter) return true;

    const marketCap = Number(token.marketCap);

    switch (marketCapFilter) {
      case "high-cap":
        return marketCap ? marketCap >= 50_000_000 : false;
      case "mid-cap":
        return marketCap
          ? marketCap >= 10_000_000 && marketCap < 50_000_000
          : false;
      case "low-cap":
        return marketCap < 10_000_000;
      default:
        return true;
    }
  });

  // Handle card click
  const handleCardClick = (token: Token) => {
    if (selectedTokens.has(token.contractAddress)) {
      onTokenSelect(token.contractAddress, 0); // Remove token
    } else {
      onTokenSelect(token.contractAddress, 50); // Add token with default weight
    }
  };

  // Handle weight change
  const handleWeightChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    token: Token
  ) => {
    e.stopPropagation();
    onTokenSelect(token.contractAddress, Number(e.target.value));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredTokens.map((token) => (
        <Card
          key={token.contractAddress}
          onClick={() => handleCardClick(token)}
          className={`cursor-pointer transition-all relative overflow-hidden backdrop-blur-sm border-dark-300 
            ${
              selectedTokens.has(token.contractAddress)
                ? "ring-2 ring-brand-500 bg-dark-200/80"
                : "hover:bg-dark-300/80 bg-dark-200/50"
            }
            hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-0.5
            `}
        >
          {/* Background Pattern + Animated Logo */}
          <div className="absolute inset-0 bg-gradient-to-br from-dark-400/20 via-transparent to-transparent" />
          {token.imageUrl && (
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-[-10%] flex items-center justify-center">
                <div className="relative w-64 h-64 opacity-[0.06] hover:opacity-[0.09] transition-opacity duration-700">
                  {/* Blur gradient behind the logo */}
                  <div className="absolute inset-[-20%] blur-3xl bg-gradient-to-br from-dark-300/40 via-transparent to-dark-300/40" />

                  {/* Animated logo */}
                  <div className="animate-float">
                    <img
                      src={token.imageUrl}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Overlay gradient for smoother edges */}
                  <div className="absolute inset-0 bg-gradient-to-br from-dark-200/80 via-transparent to-dark-200/80" />
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="relative z-10">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                {/* Token Info */}
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-2xl font-bold text-gray-100 tracking-tight">
                    {token.symbol}
                  </h3>
                  <span className="text-sm text-gray-400 block truncate max-w-[320px] font-medium">
                    {token.name}
                  </span>
                </div>

                {/* Social Links - Moved to right side */}
                {(token.websites?.length || token.socials?.length) && (
                  <div className="flex gap-2 flex-shrink-0">
                    {token.websites?.[0] && (
                      <a
                        href={token.websites[0].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-brand-400 transition-colors"
                        title={token.websites[0].label}
                      >
                        <FaGlobe size={14} />
                      </a>
                    )}
                    {token.socials?.map((social) => {
                      const Icon = {
                        discord: FaDiscord,
                        twitter: FaTwitter,
                        telegram: FaTelegram,
                      }[social.platform];
                      return Icon ? (
                        <a
                          key={social.platform}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-400 hover:text-brand-400 transition-colors"
                        >
                          <Icon size={14} />
                        </a>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* 24h Change - Moved below name */}
              <div className="mt-2">
                <TokenSparkline
                  tokenAddress={token.contractAddress}
                  change24h={token.change_24h ?? null}
                />
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              {/* Stats Grid with Gradient Borders */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {/* Price */}
                <div>
                  <span className="text-gray-400">Price</span>
                  <div className="font-medium text-gray-200">
                    {token.price ? formatTokenPrice(token.price) : "N/A"}
                  </div>
                </div>

                {/* 24h Change */}
                <div>
                  <span className="text-gray-400">24h</span>
                  <div
                    className={`font-medium ${
                      (token.change_24h || 0) >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {token.change_24h != null
                      ? `${(token.change_24h * 100).toFixed(1)}%`
                      : "N/A"}
                  </div>
                </div>

                {/* Market Cap */}
                <div>
                  <span className="text-gray-400">Market Cap</span>
                  <div className="font-medium text-gray-200">
                    {token.marketCap
                      ? formatMarketCap(Number(token.marketCap))
                      : "N/A"}
                  </div>
                </div>

                {/* Liquidity */}
                <div>
                  <span className="text-gray-400">Liquidity</span>
                  <div className="font-medium text-gray-200">
                    {token.liquidity?.usd
                      ? formatCurrency(token.liquidity.usd)
                      : "N/A"}
                  </div>
                </div>

                {/* 24h Volume */}
                <div>
                  <span className="text-gray-400">24h Volume</span>
                  <div className="font-medium text-gray-200">
                    {token.volume24h
                      ? formatCurrency(Number(token.volume24h))
                      : "N/A"}
                  </div>
                </div>

                {/* 24h Trades */}
                <div>
                  <span className="text-gray-400">24h Trades</span>
                  <div className="font-medium text-gray-200">
                    {token.transactionsJson?.h24
                      ? `${(
                          token.transactionsJson.h24.buys +
                          token.transactionsJson.h24.sells
                        ).toLocaleString()}`
                      : "N/A"}
                  </div>
                </div>
              </div>

              {/* Enhanced Sword Slider */}
              <div
                className={`transform transition-all duration-200 ease-out overflow-hidden ${
                  selectedTokens.has(token.contractAddress)
                    ? "h-[72px] opacity-100 mt-4 scale-100"
                    : "h-0 opacity-0 mt-0 scale-95"
                }`}
              >
                <div
                  className="bg-gradient-to-r from-dark-300/50 via-dark-300/30 to-dark-300/50 rounded-lg p-3 border border-dark-300/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-2">
                    {/* Portfolio Weight */}
                    <label className="text-sm font-medium text-gray-400 flex items-center gap-1">
                      <FaCoins size={12} className="text-brand-400" />
                      Portfolio Weight
                    </label>
                    <span className="text-sm font-bold text-brand-400 tabular-nums">
                      {selectedTokens.get(token.contractAddress)}%
                    </span>
                  </div>

                  {/* Slider */}
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedTokens.get(token.contractAddress) || 0}
                      onChange={(e) => handleWeightChange(e, token)}
                      className="w-full h-1.5 bg-gradient-to-r from-dark-300 via-brand-500/20 to-dark-300 rounded-full appearance-none cursor-pointer
                        focus:outline-none focus:ring-2 focus:ring-brand-500/50
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-sm
                        [&::-webkit-slider-thumb]:rotate-45
                        [&::-webkit-slider-thumb]:bg-brand-400
                        [&::-webkit-slider-thumb]:hover:bg-brand-300
                        [&::-webkit-slider-thumb]:transition-colors
                        [&::-webkit-slider-thumb]:cursor-pointer
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-dark-200
                        [&::-webkit-slider-thumb]:shadow-lg
                        [&::-moz-range-thumb]:w-4
                        [&::-moz-range-thumb]:h-4
                        [&::-moz-range-thumb]:rotate-45
                        [&::-moz-range-thumb]:rounded-sm
                        [&::-moz-range-thumb]:bg-brand-400
                        [&::-moz-range-thumb]:hover:bg-brand-300
                        [&::-moz-range-thumb]:transition-colors
                        [&::-moz-range-thumb]:cursor-pointer
                        [&::-moz-range-thumb]:border-2
                        [&::-moz-range-thumb]:border-dark-200
                        [&::-moz-range-thumb]:shadow-lg"
                    />
                    {/* Glowing progress bar */}
                    <div
                      className="absolute top-[7px] left-0 h-1.5 bg-gradient-to-r from-brand-500 to-brand-400 rounded-full pointer-events-none shadow-[0_0_8px_rgba(var(--brand-500-rgb),0.5)]"
                      style={{
                        width: `${
                          selectedTokens.get(token.contractAddress) || 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      ))}
    </div>
  );
};
