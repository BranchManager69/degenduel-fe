import React, { useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { PortfolioSummary } from "../components/tokens/PortfolioSummary";
import { TokenFilters } from "../components/tokens/TokenFilters";
import { TokenGrid } from "../components/tokens/TokenGrid";
import { Button } from "../components/ui/Button";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const portfolio = Array.from(selectedTokens.entries()).map(
      ([symbol, weight]) => ({
        symbol,
        weight,
      })
    );

    try {
      await ddApi.contests.enterContest(contestId || "", portfolio);

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
