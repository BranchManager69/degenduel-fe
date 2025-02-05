// src/pages/public/TokensPage.tsx

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../../../components/ui/Card";
import { ddApi } from "../../../services/dd-api";

// Token interface (matches DegenDuel market data API)
// TODO: Move this to another file
interface Token {
  contractAddress: string;
  name: string;
  symbol: string;
  price: string;
  marketCap: string;
  volume24h: string;
  change24h: string;
  liquidity?: {
    usd: string;
    base: string;
    quote: string;
  };
  images?: {
    imageUrl: string;
    headerImage: string;
    openGraphImage: string;
  };
  socials?: {
    twitter?: { url: string; count: number | null };
    telegram?: { url: string; count: number | null };
    discord?: { url: string; count: number | null };
  };
  websites?: Array<{
    url: string;
    label: string;
  }>;
}

// Tokens page
export const TokensPage: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Token>("marketCap");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    const checkMaintenanceAndFetchTokens = async () => {
      try {
        // First check maintenance mode
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);

        // If in maintenance mode, don't fetch tokens
        if (isInMaintenance) {
          setError(
            "⚙️ DegenDuel is currently undergoing scheduled maintenance. Please try again later."
          );
          setLoading(false);
          return;
        }

        // Get all tokens in one request
        const response = await ddApi.fetch("/dd-serv/tokens");
        const responseData = await response.json();

        // Check if the data is in a 'data' property or is the response itself
        const tokensData = Array.isArray(responseData)
          ? responseData
          : responseData.data;

        if (!Array.isArray(tokensData)) {
          console.error("Unexpected API response format:", responseData);
          setError("Invalid data format received from server");
          return;
        }

        // Transform the data to match our Token interface
        const transformedTokens = tokensData.map((token: any) => ({
          contractAddress: token.contractAddress || token.address,
          name: token.name,
          symbol: token.symbol,
          price: token.price?.toString() || "0",
          marketCap: token.marketCap?.toString() || "0",
          volume24h: token.volume24h?.toString() || "0",
          change24h: token.change24h?.toString() || "0",
          liquidity: {
            usd: token.liquidity?.usd?.toString() || "0",
            base: token.liquidity?.base?.toString() || "0",
            quote: token.liquidity?.quote?.toString() || "0",
          },
          images: {
            imageUrl: token.imageUrl || token.image,
            headerImage: token.headerImage,
            openGraphImage: token.openGraphImage,
          },
          socials: {
            twitter: token.socials?.twitter || null,
            telegram: token.socials?.telegram || null,
            discord: token.socials?.discord || null,
          },
          websites: token.websites || [],
        }));

        setTokens(transformedTokens);
      } catch (err) {
        console.error("Failed to fetch tokens:", err);

        // Check if the error is a 503 (maintenance mode)
        if (err instanceof Error && err.message.includes("503")) {
          setIsMaintenanceMode(true);
          setError(
            "⚙️ DegenDuel is currently undergoing scheduled maintenance. Please try again later. ⚙️"
          );
        } else {
          setError("Failed to load tokens");
        }
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceAndFetchTokens();

    // Set up periodic maintenance check
    const maintenanceCheckInterval = setInterval(async () => {
      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setIsMaintenanceMode(isInMaintenance);
      } catch (err) {
        console.error("Failed to check maintenance status:", err);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(maintenanceCheckInterval);
  }, []);

  const formatNumber = (value: string | number, decimals = 2) => {
    const num = Number(value);
    if (isNaN(num)) return "0";

    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + "K";
    return num.toFixed(decimals);
  };

  const filteredAndSortedTokens = tokens
    .filter(
      (token) =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = Number(a[sortField]) || 0;
      const bValue = Number(b[sortField]) || 0;
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card
              key={i}
              className="bg-dark-200/50 backdrop-blur-sm relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream" />
              <CardContent className="p-6 h-24 animate-pulse" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isMaintenanceMode) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center p-8 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
          <div className="flex items-center justify-center gap-2 text-yellow-400">
            <span className="animate-pulse">⚠</span>
            <span>
              ⚙️ DegenDuel is currently undergoing scheduled maintenance. Please
              try again later.
            </span>
            <span className="animate-pulse">⚠</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-500 animate-glitch p-8 bg-dark-200/50 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Enhanced Header */}
      <div className="mb-8 relative group">
        <h1 className="text-3xl font-bold text-gray-100 mb-4 relative">
          <span className="relative z-10 group-hover:animate-glitch">
            Available Tokens
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        </h1>
        <p className="text-gray-400 group-hover:animate-cyber-pulse">
          Explore all tokens available for trading in DegenDuel contests
        </p>
      </div>

      {/* Enhanced Search and Sort Controls */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative group w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search tokens..."
            className="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 group-hover:border-brand-400/50 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as keyof Token)}
            className="px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-brand-400/50 transition-colors"
          >
            <option value="marketCap">Market Cap</option>
            <option value="volume24h">Volume</option>
            <option value="price">Price</option>
            <option value="change24h">24h Change</option>
          </select>
          <button
            onClick={() =>
              setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 hover:bg-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 flex items-center space-x-2 relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
            <span className="relative z-10 group-hover:animate-glitch">
              {sortDirection === "asc" ? "Ascending" : "Descending"}
            </span>
            <svg
              className={`w-4 h-4 transform transition-transform relative z-10 ${
                sortDirection === "asc" ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Enhanced Token Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAndSortedTokens.map((token) => (
          <Card
            key={token.contractAddress}
            className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4 group-hover:animate-cyber-scan">
                  {token.images?.imageUrl && (
                    <img
                      src={token.images.imageUrl}
                      alt={token.name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 group-hover:animate-glitch">
                      {token.name}
                    </h3>
                    <p className="text-gray-400 group-hover:text-brand-400 transition-colors">
                      {token.symbol}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:space-x-8">
                  <div className="text-right">
                    <p className="text-sm text-gray-400 group-hover:text-brand-400 transition-colors">
                      Price
                    </p>
                    <p className="text-lg font-medium text-gray-100 group-hover:animate-neon-flicker">
                      ${formatNumber(token.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 group-hover:text-brand-400 transition-colors">
                      24h Change
                    </p>
                    <p
                      className={`text-lg font-medium group-hover:animate-neon-flicker ${
                        Number(token.change24h) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatNumber(token.change24h)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 group-hover:text-brand-400 transition-colors">
                      Market Cap
                    </p>
                    <p className="text-lg font-medium text-gray-100 group-hover:animate-neon-flicker">
                      ${formatNumber(token.marketCap)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 group-hover:text-brand-400 transition-colors">
                      Volume (24h)
                    </p>
                    <p className="text-lg font-medium text-gray-100 group-hover:animate-neon-flicker">
                      ${formatNumber(token.volume24h)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Social Links */}
              {token.socials && (
                <div className="mt-4 flex items-center space-x-4">
                  {token.socials.twitter?.url && (
                    <a
                      href={token.socials.twitter.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-brand-400 transition-colors group-hover:animate-cyber-pulse"
                    >
                      Twitter
                    </a>
                  )}
                  {token.socials.telegram?.url && (
                    <a
                      href={token.socials.telegram.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-brand-400 transition-colors group-hover:animate-cyber-pulse"
                    >
                      Telegram
                    </a>
                  )}
                  {token.socials.discord?.url && (
                    <a
                      href={token.socials.discord.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-brand-400 transition-colors group-hover:animate-cyber-pulse"
                    >
                      Discord
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
