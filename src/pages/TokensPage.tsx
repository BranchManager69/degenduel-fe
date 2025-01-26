import React, { useEffect, useState } from "react";
import { Card, CardContent } from "../components/ui/Card";
import { ddApi } from "../services/dd-api";

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

export const TokensPage: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Token>("marketCap");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
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
        setError("Failed to load tokens");
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
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
              className="bg-dark-200/50 backdrop-blur-sm animate-pulse"
            >
              <CardContent className="p-6 h-24" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Available Tokens</h1>
        <p className="text-gray-400 mt-2">
          Explore all tokens available for trading in DegenDuel contests
        </p>
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
        <input
          type="text"
          placeholder="Search tokens..."
          className="w-full sm:max-w-md px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center space-x-4">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as keyof Token)}
            className="px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
            className="px-4 py-2 bg-dark-300 border border-dark-400 rounded-lg text-gray-100 hover:bg-dark-400 focus:outline-none focus:ring-2 focus:ring-brand-500 flex items-center space-x-2"
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
      <div className="grid grid-cols-1 gap-4">
        {filteredAndSortedTokens.map((token) => (
          <Card
            key={token.contractAddress}
            className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-500/50 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  {token.images?.imageUrl && (
                    <img
                      src={token.images.imageUrl}
                      alt={token.name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100">
                      {token.name}
                    </h3>
                    <p className="text-gray-400">{token.symbol}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:space-x-8">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Price</p>
                    <p className="text-lg font-medium text-gray-100">
                      ${formatNumber(token.price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">24h Change</p>
                    <p
                      className={`text-lg font-medium ${
                        Number(token.change24h) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatNumber(token.change24h)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Market Cap</p>
                    <p className="text-lg font-medium text-gray-100">
                      ${formatNumber(token.marketCap)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Volume (24h)</p>
                    <p className="text-lg font-medium text-gray-100">
                      ${formatNumber(token.volume24h)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {token.socials && (
                <div className="mt-4 flex items-center space-x-4">
                  {token.socials.twitter?.url && (
                    <a
                      href={token.socials.twitter.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-brand-400"
                    >
                      Twitter
                    </a>
                  )}
                  {token.socials.telegram?.url && (
                    <a
                      href={token.socials.telegram.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-brand-400"
                    >
                      Telegram
                    </a>
                  )}
                  {token.socials.discord?.url && (
                    <a
                      href={token.socials.discord.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-brand-400"
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
