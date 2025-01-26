import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { PortfolioSummary } from "../components/tokens/PortfolioSummary";
import { TokenFilters } from "../components/tokens/TokenFilters";
import { TokenGrid } from "../components/tokens/TokenGrid";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ddApi } from "../services/dd-api";
import { useStore } from "../store/useStore";
import { Contest, PortfolioResponse, Token, TokensResponse } from "../types";

// New interface for portfolio data
interface PortfolioToken {
  symbol: string;
  contractAddress: string;
  weight: number;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="text-center p-4 relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 animate-data-stream opacity-0 group-hover:opacity-100" />
      <h2 className="text-xl font-bold text-red-400 mb-2 group-hover:animate-glitch">
        Something went wrong:
      </h2>
      <pre className="text-gray-400 bg-dark-300/50 p-4 rounded-lg border border-red-500/20 group-hover:border-red-500/40 transition-colors">
        {error.message}
      </pre>
    </div>
  );
}

export const TokenSelection: React.FC = () => {
  const { id: contestId } = useParams();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<Map<string, number>>(
    new Map()
  );
  const [marketCapFilter, setMarketCapFilter] = useState("");
  const [contest, setContest] = useState<Contest | null>(null);
  const user = useStore((state) => state.user);
  const [tokenListLoading, setTokenListLoading] = useState(true);
  const [loadingEntryStatus, setLoadingEntryStatus] = useState(false);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        ////console.log("Fetching tokens A...");
        setTokenListLoading(true);
        ////console.log("Fetching tokens B...");
        const response = await ddApi.tokens.getAll();
        const tokenData = Array.isArray(response)
          ? response
          : (response as TokensResponse).data;
        ////console.log("Raw token data:", tokenData);

        // Enhanced validation and transformation
        const validatedTokens = tokenData.map((token: Token) => ({
          ...token,
          // Use changesJson for price changes
          change_24h: token.changesJson?.h24 ?? 0,

          // Market data with proper formatting
          price: token.price,
          volume24h: token.volume24h,
          marketCap: token.marketCap,

          // Additional market metrics
          liquidity: {
            usd: token.liquidity?.usd ?? 0,
            base: token.liquidity?.base ?? 0,
            quote: token.liquidity?.quote ?? 0,
          },

          // Transaction metrics for the last 24h
          transactions24h: token.transactionsJson?.h24 ?? {
            buys: 0,
            sells: 0,
          },

          // Base and quote token info
          baseToken: token.baseToken ?? {
            name: token.name,
            symbol: token.symbol,
            address: token.contractAddress,
          },
          quoteToken: token.quoteToken,
        }));

        setTokens(validatedTokens);
      } catch (err) {
        console.error("Failed to fetch tokens:", err);
        setError("Failed to load tokens");
      } finally {
        setTokenListLoading(false);
      }
    };

    fetchTokens();
  }, []);

  useEffect(() => {
    const fetchContest = async () => {
      if (!contestId) return;
      try {
        const data = await ddApi.contests.getById(contestId);
        console.log("Contest data from API:", {
          data,
          isParticipating: data.is_participating,
          id: data.id,
        });
        setContest(data);
      } catch (err) {
        console.error("Error fetching contest:", err);
        toast.error("Failed to load contest details", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    };

    fetchContest();
  }, [contestId]);

  useEffect(() => {
    const fetchExistingPortfolio = async () => {
      if (!contestId || !user?.wallet_address) return;

      try {
        setLoadingEntryStatus(true);
        const portfolioData = await ddApi.portfolio.get(Number(contestId));

        // Create map using contract addresses instead of symbols
        const existingPortfolio = new Map<string, number>(
          (portfolioData.tokens as PortfolioToken[])?.map(
            (token: PortfolioToken) => [token.contractAddress, token.weight]
          ) || []
        );

        setSelectedTokens(existingPortfolio);
      } catch (error) {
        console.error("Failed to fetch existing portfolio:", error);
      } finally {
        setLoadingEntryStatus(false);
      }
    };

    fetchExistingPortfolio();
  }, [contestId, user?.wallet_address]);

  useEffect(() => {
    console.log("Current contest state:", {
      contestId,
      contest,
      isParticipating: contest?.is_participating,
    });
  }, [contestId, contest]);

  // Memoize the transformed tokens
  const memoizedTokens = useMemo(
    () =>
      tokens.map((token: Token) => ({
        ...token,
        change_24h: token.changesJson?.h24 ?? 0,
        price: token.price,
        volume24h: token.volume24h,
        marketCap: token.marketCap,
        liquidity: {
          usd: token.liquidity?.usd ?? 0,
          base: token.liquidity?.base ?? 0,
          quote: token.liquidity?.quote ?? 0,
        },
        transactions24h: token.transactionsJson?.h24 ?? {
          buys: 0,
          sells: 0,
        },
        baseToken: token.baseToken ?? {
          name: token.name,
          symbol: token.symbol,
          address: token.contractAddress,
        },
        quoteToken: token.quoteToken,
      })),
    [tokens]
  );

  // Memoize the token selection handler
  const handleTokenSelect = useCallback(
    (contractAddress: string, weight: number) => {
      console.log("handleTokenSelect called with:", {
        contractAddress,
        weight,
      });

      if (
        !contractAddress.includes("pump") &&
        !contractAddress.includes("111")
      ) {
        console.warn(
          "Received possible symbol instead of contract address:",
          contractAddress
        );
        const token = memoizedTokens.find((t) => t.symbol === contractAddress);
        if (token) {
          contractAddress = token.contractAddress;
          console.log(
            "Found matching token, using contract address:",
            contractAddress
          );
        }
      }

      const token = memoizedTokens.find(
        (t) => t.contractAddress === contractAddress
      );
      console.log("Token being selected:", token);

      setSelectedTokens((prev) => {
        const newSelectedTokens = new Map(prev);
        if (weight === 0) {
          newSelectedTokens.delete(contractAddress);
        } else {
          newSelectedTokens.set(contractAddress, weight);
        }
        return newSelectedTokens;
      });
    },
    [memoizedTokens]
  );

  const totalWeight = Array.from(selectedTokens.values()).reduce(
    (sum, weight) => sum + weight,
    0
  );

  // Portfolio validation
  const portfolioValidation = useMemo(() => {
    if (totalWeight !== 100) {
      return "Total weight must equal 100%";
    }
    if (selectedTokens.size < 2) {
      return "Select at least 2 tokens";
    }
    return null;
  }, [totalWeight, selectedTokens.size]);

  const handleSubmit = async () => {
    try {
      // First, verify our tokens array is populated
      console.log("Current tokens array:", {
        length: tokens.length,
        sample: tokens.slice(0, 3).map((t) => ({
          symbol: t.symbol,
          contractAddress: t.contractAddress,
        })),
      });

      // Log the selected tokens Map
      console.log("Raw selectedTokens Map:", {
        size: selectedTokens.size,
        entries: Array.from(selectedTokens.entries()),
      });

      // Check each selected token individually
      Array.from(selectedTokens.entries()).forEach(([ca, weight]) => {
        const found = tokens.find((t) => t.contractAddress === ca);
        console.log("Checking token:", {
          contractAddress: ca,
          weight,
          foundInTokens: !!found,
          matchDetails: found
            ? {
                symbol: found.symbol,
                exactMatch: found.contractAddress === ca,
                lowerCaseMatch:
                  found.contractAddress.toLowerCase() === ca.toLowerCase(),
              }
            : null,
        });
      });

      const portfolioData: PortfolioResponse = {
        tokens: Array.from(selectedTokens.entries()).map(
          ([contractAddress, weight]) => {
            const token =
              tokens.find(
                (t) => t.contractAddress === contractAddress // Try exact match first
              ) ||
              tokens.find(
                (t) =>
                  t.contractAddress.toLowerCase() ===
                  contractAddress.toLowerCase()
              );

            if (!token) {
              console.error("Token lookup failed:", {
                searchingFor: contractAddress,
                availableTokens: tokens.map((t) => ({
                  contractAddress: t.contractAddress,
                  symbol: t.symbol,
                  matches: {
                    exact: t.contractAddress === contractAddress,
                    lowercase:
                      t.contractAddress.toLowerCase() ===
                      contractAddress.toLowerCase(),
                  },
                })),
              });
              throw new Error(
                `Token not found: ${contractAddress} (please try refreshing)`
              );
            }

            return {
              symbol: token.symbol,
              contractAddress: token.contractAddress,
              weight,
            };
          }
        ),
      };

      console.log("Final portfolio data:", portfolioData);

      await ddApi.contests.enterContest(contestId || "", portfolioData);

      toast.success("Successfully entered contest!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      navigate(`/contests/${contestId}`);
    } catch (error: any) {
      // Show error toast with the detailed error message
      toast.error(error.message, {
        position: "top-right",
        autoClose: 10000, // Longer display time for error messages
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          maxWidth: "500px", // Wider toast for multi-line errors
          whiteSpace: "pre-line", // Preserve line breaks in the message
        },
      });

      // Optional: Update UI based on specific error types
      if (
        error.status === 409 &&
        error.responseData?.error === "CONTEST_FULL"
      ) {
        // Maybe show alternative contests
      } else if (error.status === 401) {
        // Maybe show wallet connection dialog
      }
    }
  };

  if (tokenListLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-brand-400 border-t-transparent" />
            <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-brand-400 opacity-20" />
          </div>
          <p className="mt-4 text-brand-400 animate-pulse">Loading tokens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-dark-300/20 rounded-lg border border-red-500/30 backdrop-blur-sm max-w-2xl mx-auto mt-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-red-400 animate-glitch">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-dark-400/50 hover:bg-dark-400 rounded text-brand-400 text-sm transition-all duration-300 hover:scale-105"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* console.log("Render state:", {
    totalWeight,
    isButtonDisabled: totalWeight !== 100,
    selectedTokensCount: selectedTokens.size,
  }); */

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8 text-center relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
          <h1 className="text-3xl font-bold text-gray-100 mb-2 group-hover:animate-glitch">
            Select Your Portfolio
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto group-hover:animate-cyber-pulse">
            Choose tokens and allocate weights to build your winning strategy
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token Selection Area */}
          <div className="lg:col-span-2">
            <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100" />
              <div className="p-6 relative">
                {/* Filters */}
                <div className="mb-6">
                  <TokenFilters
                    marketCapFilter={marketCapFilter}
                    onMarketCapFilterChange={setMarketCapFilter}
                  />
                </div>

                {/* Token Grid */}
                <div className="relative">
                  {tokenListLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-cyber-pulse text-brand-400">
                        Loading tokens...
                      </div>
                    </div>
                  ) : error ? (
                    <div className="text-red-400 text-center animate-glitch">
                      {error}
                    </div>
                  ) : (
                    <TokenGrid
                      tokens={tokens}
                      selectedTokens={selectedTokens}
                      onTokenSelect={handleTokenSelect}
                      marketCapFilter={marketCapFilter}
                    />
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Portfolio Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group relative overflow-hidden sticky top-4">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100" />
              <div className="p-6 relative">
                <h2 className="text-xl font-bold text-gray-100 mb-4 group-hover:animate-glitch">
                  Portfolio Summary
                </h2>
                <PortfolioSummary
                  selectedTokens={selectedTokens}
                  tokens={tokens}
                />

                <div className="mt-6">
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      loadingEntryStatus || portfolioValidation !== null
                    }
                    className="w-full relative group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
                    <span className="relative flex items-center justify-center font-medium group-hover:animate-glitch">
                      {loadingEntryStatus ? (
                        <div className="animate-cyber-pulse">Submitting...</div>
                      ) : (
                        "Submit Portfolio"
                      )}
                    </span>
                  </Button>

                  {portfolioValidation && (
                    <p className="mt-2 text-red-400 text-sm text-center animate-glitch">
                      {portfolioValidation}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
