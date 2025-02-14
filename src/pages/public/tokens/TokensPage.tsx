// src/pages/public/tokens/TokensPage.tsx

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
// TODO: Move this to another file! Useful!!
// Shared utility function
const formatNumber = (value: string | number, decimals = 2) => {
  const num = Number(value);
  if (isNaN(num)) return "0";

  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(decimals) + "K";
  return num.toFixed(decimals);
};

// Add new interface for token response metadata
interface TokenResponseMetadata {
  timestamp: string;
  _cached?: boolean;
  _stale?: boolean;
  _cachedAt?: string;
}

// DataStatus component for showing data freshness
const DataStatus: React.FC<{ metadata: TokenResponseMetadata }> = ({
  metadata,
}) => {
  const [, forceUpdate] = React.useState({});

  // Force update every second to keep the "ago" text current
  React.useEffect(() => {
    const interval = setInterval(() => forceUpdate({}), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!metadata._cached) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        Live Data
      </div>
    );
  }

  const cachedAt = new Date(metadata._cachedAt || metadata.timestamp);
  const ageSeconds = Math.floor(
    (new Date().getTime() - cachedAt.getTime()) / 1000
  );
  const ageText =
    ageSeconds < 60
      ? `${ageSeconds}s ago`
      : `${Math.floor(ageSeconds / 60)}m ago`;

  if (metadata._stale) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-sm">
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        Stale Cache ({ageText})
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-sm">
      <span className="w-2 h-2 rounded-full bg-brand-400" />
      Cached ({ageText})
    </div>
  );
};

// TokenCard component for better organization
const TokenCard: React.FC<{ token: Token }> = ({ token }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className="h-[300px] w-full perspective-1000 cursor-pointer"
      onClick={handleClick}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front of card */}
        <div className="absolute w-full h-full backface-hidden">
          <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 h-full">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-start space-x-4 mb-6">
                {token.images?.imageUrl && (
                  <img
                    src={token.images.imageUrl}
                    alt={token.name}
                    className="w-12 h-12 rounded-full flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-gray-100 truncate">
                    {token.name}
                  </h3>
                  <p className="text-gray-400">{token.symbol}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 flex-1">
                <div>
                  <p className="text-sm text-gray-400">Price</p>
                  <p className="text-base font-medium text-gray-100">
                    ${formatNumber(token.price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">24h Change</p>
                  <p
                    className={`text-base font-medium ${
                      Number(token.change24h) >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatNumber(token.change24h)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Market Cap</p>
                  <p className="text-base font-medium text-gray-100">
                    ${formatNumber(token.marketCap)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Volume (24h)</p>
                  <p className="text-base font-medium text-gray-100">
                    ${formatNumber(token.volume24h)}
                  </p>
                </div>
              </div>

              {token.socials &&
                Object.values(token.socials).some((s) => s?.url) && (
                  <div className="mt-6 pt-4 border-t border-dark-300 flex items-center space-x-4">
                    {token.socials.twitter?.url && (
                      <a
                        href={token.socials.twitter.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-brand-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Twitter
                      </a>
                    )}
                    {token.socials.telegram?.url && (
                      <a
                        href={token.socials.telegram.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-brand-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Telegram
                      </a>
                    )}
                    {token.socials.discord?.url && (
                      <a
                        href={token.socials.discord.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-brand-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Discord
                      </a>
                    )}
                  </div>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Back of card */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 h-full">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-100">
                  {token.name} Details
                </h3>
                <button
                  onClick={() => setIsFlipped(false)}
                  className="text-gray-400 hover:text-brand-400 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4 flex-1">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Contract Address</p>
                  <p className="text-sm font-mono text-gray-100 break-all">
                    {token.contractAddress}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">Liquidity</p>
                  <p className="text-base font-medium text-gray-100">
                    ${formatNumber(token.liquidity?.usd || "0")}
                  </p>
                </div>

                {token.websites && token.websites.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Links</p>
                    <div className="flex flex-wrap gap-2">
                      {token.websites.map((website, index) => (
                        <a
                          key={index}
                          href={website.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
                        >
                          {website.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-dark-300">
                <p className="text-xs text-gray-400 text-center">
                  Tap to flip again
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Tokens page
export const TokensPage: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [metadata, setMetadata] = useState<TokenResponseMetadata>({
    timestamp: new Date().toISOString(),
  });
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
            "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later."
          );
          setLoading(false);
          return;
        }

        // Get all tokens in one request
        const response = await ddApi.fetch("/dd-serv/tokens");
        const responseData = await response.json();

        // Extract metadata
        const metadata: TokenResponseMetadata = {
          timestamp: responseData.timestamp,
          _cached: responseData._cached,
          _stale: responseData._stale,
          _cachedAt: responseData._cachedAt,
        };
        setMetadata(metadata);

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
            "DegenDuel is undergoing scheduled maintenance ⚙️ Try again later."
          );
        } else {
          setError("Failed to load tokens");
        }
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceAndFetchTokens();

    // Set up auto-refresh interval - 30s for fresh data, 5s for stale
    const refreshInterval = setInterval(
      checkMaintenanceAndFetchTokens,
      metadata._stale ? 5000 : 30000
    );

    return () => clearInterval(refreshInterval);
  }, [metadata._stale]); // Add dependency on stale status

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
            <Card key={i} className="bg-dark-200/50 backdrop-blur-sm">
              <CardContent className="p-6 h-24">
                <div className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-dark-300 h-12 w-12"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-4 bg-dark-300 rounded w-3/4"></div>
                    <div className="h-4 bg-dark-300 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
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
            <span>⚠</span>
            <span>
              DegenDuel is undergoing scheduled maintenance ⚙️ Try again later.
            </span>
            <span>⚠</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-500 p-8 bg-dark-200/50 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-3xl font-bold text-gray-100">Tokens Supported</h1>
          <DataStatus metadata={metadata} />
        </div>
        <p className="text-gray-400">
          Due to the nature of our game, portfolios must consist of tokens on
          the DegenDuel Whitelist. Read about our Whitelist selection criteria{" "}
          <a
            href="https://degenduel.me/whitelist"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:text-brand-300"
          >
            here
          </a>
          .
        </p>
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
        <div className="w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search tokens..."
            className="w-full px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as keyof Token)}
            className="px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
          >
            <option value="marketCap">Mkt. Cap.</option>
            <option value="volume24h">Volume</option>
            <option value="change24h">24h Chg.</option>
            <option value="liquidity">Liquidity</option>
            {/* <option value="price">Price</option> */}
          </select>
          <button
            onClick={() =>
              setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 hover:bg-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 flex items-center space-x-2 transition-colors"
          >
            <span>{sortDirection === "asc" ? "Ascending" : "Descending"}</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${
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

      {/* Token Grid */}
      <div className="grid grid-cols-4 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredAndSortedTokens.map((token) => (
          <TokenCard key={token.contractAddress} token={token} />
        ))}
      </div>
    </div>
  );
};
