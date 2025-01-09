import React from "react";
import { FaDiscord, FaGlobe, FaTelegram, FaTwitter } from "react-icons/fa";
import { formatCurrency, formatMarketCap } from "../../lib/utils";
import { Token } from "../../types";
import { Card, CardContent, CardHeader } from "../ui/Card";

interface TokenGridProps {
  tokens: Token[];
  selectedTokens: Map<string, number>;
  onTokenSelect: (symbol: string, weight: number) => void;
  marketCapFilter: string;
}

// Helper function for dynamic price formatting
const formatTokenPrice = (price: string | number): string => {
  const numPrice = Number(price);
  if (numPrice >= 1) {
    return formatCurrency(numPrice, 2); // Show cents for prices >= $1
  } else if (numPrice >= 0.01) {
    return formatCurrency(numPrice, 3); // Show 3 decimals for prices >= $0.01
  } else {
    // For very small prices, show significant digits
    return `$${numPrice.toPrecision(2)}`;
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
        return marketCap ? marketCap >= 100_000_000 : false;
      case "mid-cap":
        return marketCap
          ? marketCap >= 25_000_000 && marketCap < 100_000_000
          : false;
      case "low-cap":
        return marketCap < 25_000_000;
      default:
        return true;
    }
  });

  const handleCardClick = (symbol: string) => {
    if (selectedTokens.has(symbol)) {
      onTokenSelect(symbol, 0); // Remove token
    } else {
      onTokenSelect(symbol, 20); // Add token with default weight
    }
  };

  const handleWeightChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    symbol: string
  ) => {
    e.stopPropagation();
    onTokenSelect(symbol, Number(e.target.value));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredTokens.map((token) => (
        <Card
          key={token.symbol}
          onClick={() => handleCardClick(token.symbol)}
          className={`cursor-pointer transition-colors bg-dark-200/50 backdrop-blur-sm border-dark-300 ${
            selectedTokens.has(token.symbol)
              ? "ring-2 ring-brand-500"
              : "hover:bg-dark-300/50"
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  {token.imageUrl && (
                    <img
                      src={token.imageUrl}
                      alt={token.symbol}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <h3 className="text-lg font-semibold text-gray-100">
                    {token.symbol}
                  </h3>
                </div>
                <span className="text-sm text-gray-400">{token.name}</span>
              </div>
              <div className="flex gap-1">
                {token.websites && token.websites.length > 0 && (
                  <a
                    href={token.websites[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-400 hover:text-gray-200"
                    title={token.websites[0].label}
                  >
                    <FaGlobe size={16} />
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
                      className="text-gray-400 hover:text-gray-200"
                    >
                      <Icon size={16} />
                    </a>
                  ) : null;
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Price</span>
                <div className="font-medium text-gray-200">
                  {token.price ? formatTokenPrice(token.price) : "N/A"}
                </div>
              </div>
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
              <div>
                <span className="text-gray-400">Market Cap</span>
                <div className="font-medium text-gray-200">
                  {token.marketCap
                    ? formatMarketCap(Number(token.marketCap))
                    : "N/A"}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Liquidity</span>
                <div className="font-medium text-gray-200">
                  {token.liquidity?.usd
                    ? formatCurrency(token.liquidity.usd)
                    : "N/A"}
                </div>
              </div>
              <div>
                <span className="text-gray-400">24h Volume</span>
                <div className="font-medium text-gray-200">
                  {token.volume24h
                    ? formatCurrency(Number(token.volume24h))
                    : "N/A"}
                </div>
              </div>
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

            {/* Token Weight Slider */}
            {selectedTokens.has(token.symbol) && (
              <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm text-gray-400 mb-1">
                  Portfolio Weight
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedTokens.get(token.symbol) || 0}
                    onChange={(e) => handleWeightChange(e, token.symbol)}
                    className="w-full h-2 bg-dark-300 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-200 w-12">
                    {selectedTokens.get(token.symbol)}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
