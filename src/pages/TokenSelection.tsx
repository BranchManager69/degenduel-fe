import React, { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useNavigate, useParams } from "react-router-dom";
import { PortfolioSummary } from "../components/tokens/PortfolioSummary";
import { TokenFilters } from "../components/tokens/TokenFilters";
import { TokenGrid } from "../components/tokens/TokenGrid";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { ddApi } from "../services/dd-api";
import { useStore } from "../store/useStore";
import { Contest, Token, TokensResponse } from "../types";

// New interface for portfolio data
interface PortfolioToken {
  symbol: string;
  weight: number;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="text-center p-4">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

export const TokenSelection: React.FC = () => {
  const { id: contestId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
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
        console.log("Fetching tokens A...");
        setTokenListLoading(true);
        console.log("Fetching tokens B...");
        const response = await ddApi.tokens.getAll();
        const tokenData = Array.isArray(response)
          ? response
          : (response as TokensResponse).data;
        console.log("Raw token data:", tokenData);

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
        toast({
          title: "Error",
          description: "Failed to load contest details",
          variant: "error",
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

        // Explicitly type the portfolio data and add type checking
        const existingPortfolio = new Map<string, number>(
          (portfolioData.tokens as PortfolioToken[])?.map(
            (token: PortfolioToken) => [token.symbol, token.weight]
          ) || []
        );

        setSelectedTokens(existingPortfolio);
      } catch (error) {
        console.error("Failed to fetch existing portfolio:", error);
        // Don't show error toast as this might be a new entry
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

  const handleTokenSelect = (symbol: string, weight: number) => {
    const newSelectedTokens = new Map(selectedTokens);

    if (weight === 0) {
      newSelectedTokens.delete(symbol);
    } else {
      newSelectedTokens.set(symbol, weight);
    }

    setSelectedTokens(newSelectedTokens);
  };

  const totalWeight = Array.from(selectedTokens.values()).reduce(
    (sum, weight) => sum + weight,
    0
  );

  const handleSubmit = async () => {
    console.log("[handleSubmit] Starting submission with:", {
      user,
      contestId,
      contest,
      totalWeight,
      selectedTokens: Array.from(selectedTokens.entries()),
    });

    if (!contestId) {
      toast({
        title: "Error",
        description: "Contest ID is missing",
        variant: "error",
      });
      return;
    }

    if (!user || !user.wallet_address) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to enter the contest",
        variant: "error",
      });
      return;
    }

    if (totalWeight !== 100) {
      toast({
        title: "Invalid Portfolio",
        description: "Total weight must equal 100%",
        variant: "error",
      });
      return;
    }

    // Convert selected tokens to the required format
    const portfolio = Array.from(selectedTokens.entries()).map(
      ([symbol, weight]) => ({
        symbol,
        weight,
      })
    );

    // Validate portfolio requirements
    if (portfolio.length === 0) {
      toast({
        title: "Empty Portfolio",
        description: "Please select at least one token",
        variant: "error",
      });
      return;
    }

    if (portfolio.length > 5) {
      toast({
        title: "Too Many Tokens",
        description: "Maximum 5 tokens allowed per portfolio",
        variant: "error",
      });
      return;
    }

    try {
      setLoadingEntryStatus(true);

      if (contest?.is_participating) {
        // Was already in the contest, so update the portfolio
        console.log("Updating portfolio for contest:", contestId);
        try {
          await ddApi.contests.updatePortfolio(contestId, portfolio);
          toast({
            title: "Success",
            description: "Your portfolio has been updated",
            variant: "success",
          });
        } catch (error) {
          console.error("Failed to update portfolio:", error);
          try {
            await ddApi.contests.enterContest(contestId, portfolio);
            toast({
              title: "Success",
              description: "Your portfolio has been updated",
              variant: "success",
            });
          } catch (error) {
            console.error("Failed to enter contest:", error);
            toast({
              title: "Error",
              description: "Failed to update portfolio",
              variant: "error",
            });
          }
        }
      } else {
        // Was not previously entered in the contest, so enter it and create a new portfolio
        try {
          await ddApi.contests.enterContest(contestId, portfolio);
          toast({
            title: "Success",
            description: "You have successfully entered the contest",
            variant: "success",
          });
        } catch (error) {
          console.error("Failed to enter contest:", error);
          toast({
            title: "Error",
            description: "Failed to enter contest",
            variant: "error",
          });
        }
      }

      // Navigate to the contest live view
      try {
        navigate(`/contests/${contestId}/live`);
      } catch (error) {
        console.error("Failed to navigate to contest live view:", error);
        toast({
          title: "Error",
          description: "Failed to navigate to contest live view",
          variant: "error",
        });
      }
    } catch (error: any) {
      console.error("Failed to submit portfolio:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit portfolio",
        variant: "error",
      });
    } finally {
      setLoadingEntryStatus(false);
    }
  };

  const getButtonProps = () => {
    if (totalWeight !== 100) {
      return {
        text: `Total Weight: ${totalWeight}%`,
        variant: "default",
        disabled: true,
      };
    }

    return contest?.is_participating
      ? {
          text: "Submit Changes",
          variant: "warning" as const,
          disabled: false,
        }
      : {
          text: "Submit Portfolio",
          variant: "gradient" as const,
          disabled: false,
        };
  };

  if (tokenListLoading) {
    return <div>Loading tokens...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  console.log("Render state:", {
    totalWeight,
    isButtonDisabled: totalWeight !== 100,
    selectedTokensCount: selectedTokens.size,
  });

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">
              {contest?.is_participating
                ? "Update Your Portfolio"
                : "Select Your Tokens"}
            </h1>
            <p className="text-gray-400 mt-2">
              {contest?.is_participating
                ? "Modify your allocations before the contest starts"
                : "Choose tokens and allocate your budget to build the best portfolio"}
            </p>
          </div>
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={getButtonProps().disabled || loadingEntryStatus}
            variant={
              getButtonProps().variant as
                | "gradient"
                | "primary"
                | "secondary"
                | "outline"
                | undefined
            }
            className="relative group"
          >
            {loadingEntryStatus ? (
              <span className="flex items-center">
                <span className="mr-2">Loading...</span>
                {/* Add your loadingEntryStatus spinner component here if you have one */}
              </span>
            ) : (
              getButtonProps().text
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="mb-6">
              <TokenFilters
                marketCapFilter={marketCapFilter}
                onMarketCapFilterChange={setMarketCapFilter}
              />
            </div>
            <TokenGrid
              tokens={tokens}
              selectedTokens={selectedTokens}
              onTokenSelect={handleTokenSelect}
              marketCapFilter={marketCapFilter}
            />
          </div>
          <div>
            <PortfolioSummary tokens={tokens} selectedTokens={selectedTokens} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
