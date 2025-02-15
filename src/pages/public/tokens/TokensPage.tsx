// src/pages/public/tokens/TokensPage.tsx

import React, { useEffect, useState } from "react";
import { AddTokenModal } from "../../../components/tokens-list/AddTokenModal";
import { TokensControls } from "../../../components/tokens-list/TokensControls";
import { TokensGrid } from "../../../components/tokens-list/TokensGrid";
import { TokensHeader } from "../../../components/tokens-list/TokensHeader";
import { Button } from "../../../components/ui/Button";
import { Card, CardContent } from "../../../components/ui/Card";
import { ddApi } from "../../../services/dd-api";
import { useStore } from "../../../store/useStore";
import { Token, TokenResponseMetadata } from "../../../types";

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
  const [isAddTokenModalOpen, setIsAddTokenModalOpen] = useState(false);
  const [imageSource, setImageSource] = useState<
    "default" | "header" | "openGraph"
  >("default");
  const user = useStore((state) => state.user);

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
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="flex justify-between items-start mb-4 sm:mb-8">
        <TokensHeader metadata={metadata} />
        {user?.is_admin && (
          <Button
            onClick={() => setIsAddTokenModalOpen(true)}
            className="ml-4 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <span className="hidden sm:inline">Add Token</span>
            <span className="sm:hidden">+</span>
          </Button>
        )}
      </div>

      <TokensControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortDirection={sortDirection}
        onSortDirectionChange={() =>
          setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
        }
        imageSource={imageSource}
        onImageSourceChange={setImageSource}
      />

      <TokensGrid tokens={filteredAndSortedTokens} imageSource={imageSource} />

      <AddTokenModal
        isOpen={isAddTokenModalOpen}
        onClose={() => setIsAddTokenModalOpen(false)}
      />
    </div>
  );
};
