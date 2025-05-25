// src/pages/authenticated/TokenSelection.tsx

import { Buffer } from "buffer";

import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { PortfolioSummary } from "../../components/portfolio-selection/PortfolioSummary";
import { TokenFilters } from "../../components/portfolio-selection/TokenFilters";
import { TokenGrid } from "../../components/portfolio-selection/TokenGrid";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { useStandardizedTokenData } from "../../hooks/data/useStandardizedTokenData";
import { useDebounce } from "../../hooks/utilities/useDebounce";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import { Contest } from "../../types/index";

// Declare Buffer on window type
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

// Add Buffer to window object
if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

// New interface for portfolio data
interface PortfolioToken {
  symbol: string;
  contractAddress: string;
  weight: number;
}

// Token Card Skeleton Component
function TokenCardSkeleton() {
  return (
    <Card className="bg-dark-200/30 backdrop-blur-sm border-emerald-500/20 p-3 sm:p-6">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-6 w-20 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
          </div>
        </div>
        
        {/* Sparkline area */}
        <Skeleton className="h-8 w-full" />
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div>
            <Skeleton className="h-3 w-8 mb-1" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div>
            <Skeleton className="h-3 w-16 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div>
            <Skeleton className="h-3 w-14 mb-1" />
            <Skeleton className="h-4 w-18" />
          </div>
        </div>
      </div>
    </Card>
  );
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
  console.log("🏗️ PortfolioTokenSelectionPage: Component rendering");
  
  const { id: contestId } = useParams();
  const navigate = useNavigate();
  
  // NEW: Use standardized WebSocket token data instead of REST API
  console.log("🔌 PortfolioTokenSelectionPage: Initializing useStandardizedTokenData hook");
  const {
    tokens,
    isLoading: tokenListLoading,
    error: tokensError,
    isConnected: isTokenDataConnected,
    refresh: refreshTokens
  } = useStandardizedTokenData("all", "marketCap", { status: "active" });
  
  console.log("📊 PortfolioTokenSelectionPage: Token data state:", {
    tokenCount: tokens.length,
    tokenListLoading,
    tokensError,
    isTokenDataConnected
  });
  
  const [selectedTokens, setSelectedTokens] = useState<Map<string, number>>(
    new Map(),
  );
  const [marketCapFilter, setMarketCapFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  
  // Debounce search query to reduce filtering operations
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms delay
  const [contest, setContest] = useState<Contest | null>(null);
  const user = useStore((state) => state.user);
  const [loadingEntryStatus, setLoadingEntryStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionState, setTransactionState] = useState<{
    status:
      | "idle"
      | "preparing"
      | "signing"
      | "sending"
      | "confirming"
      | "submitting"
      | "success"
      | "error";
    message: string;
    error?: string;
    signature?: string;
  }>({
    status: "idle",
    message: "",
  });

  // Remove the old REST API fetchTokens function - now using WebSocket data!
  console.log("🚀 PortfolioTokenSelectionPage: Using WebSocket-based token data");
  
  useEffect(() => {
    const fetchContest = async () => {
      if (!contestId) return;
      try {
        console.log("🏆 PortfolioTokenSelectionPage: Fetching contest:", contestId);
        const data = await ddApi.contests.getById(contestId);
        console.log("Contest data from API:", {
          data,
          isParticipating: data.is_participating,
          id: data.id,
        });
        setContest(data);
      } catch (err) {
        console.error("Error fetching contest:", err);
        toast.error("Failed to load contest details", { duration: 5000 });
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
            (token: PortfolioToken) => [token.contractAddress, token.weight],
          ) || [],
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

  // NEW: Simplified token processing with 1000 token limit
  const memoizedTokens = useMemo(() => {
    console.log("🔄 PortfolioTokenSelectionPage: Processing tokens, count:", tokens.length);
    // Limit to 1000 tokens for performance and apply to already sorted tokens
    const limitedTokens = tokens.slice(0, 1000);
    console.log("🔄 PortfolioTokenSelectionPage: Limited to:", limitedTokens.length, "tokens");
    return limitedTokens;
  }, [tokens]);

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
          contractAddress,
        );
        const token = memoizedTokens.find((t) => t.symbol === contractAddress);
        if (token) {
          contractAddress = token.contractAddress;
          console.log(
            "Found matching token, using contract address:",
            contractAddress,
          );
        }
      }

      const token = memoizedTokens.find(
        (t) => t.contractAddress === contractAddress,
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
    [memoizedTokens],
  );

  const totalWeight = Array.from(selectedTokens.values()).reduce(
    (sum, weight) => sum + weight,
    0,
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
    if (!contest || !contestId) {
      console.error("Submit failed: Missing contest data:", {
        contest,
        contestId,
      });
      toast.error("Contest information not available");
      return;
    }

    if (!user?.wallet_address) {
      console.error("Submit failed: No wallet address");
      toast.error("Please connect your wallet first");
      return;
    }

    // Capture signature in local variable to avoid React state race condition
    let confirmedSignature: string | undefined;
    
    try {
      setIsLoading(true);

      // Get contest details to ensure we have the wallet address
      const contestDetails = await ddApi.contests.getById(contestId);
      if (!contestDetails.wallet_address) {
        throw new Error("Contest wallet address not found");
      }

      // 1. Create and send Solana transaction
      console.log("Initializing Solana transaction...");
      const { solana } = window as any;
      if (!solana?.isPhantom) {
        console.error("Phantom wallet not found in window.solana");
        throw new Error("Phantom wallet not found");
      }

      console.log("Creating Solana connection...");
      const connection = new Connection(
        '/api/solana-rpc', // UPDATED: Using server-side Solana proxy instead of direct RPC endpoint
        "confirmed",
      );

      // Get minimum rent exemption
      const minRentExemption =
        await connection.getMinimumBalanceForRentExemption(0);
      const lamports = Math.floor(parseFloat(contest.entry_fee) * 1e9);

      console.log("Transaction details:", {
        from: user.wallet_address,
        to: contestDetails.wallet_address,
        amount: contest.entry_fee,
        lamports,
        minRentExemption,
        estimatedFee: "~0.00016 SOL",
        totalRequired: Number(contest.entry_fee) + 0.00016,
        timestamp: new Date().toISOString(),
      });

      // Get latest blockhash
      console.log("Getting recent blockhash...");
      setTransactionState({
        status: "preparing",
        message: "Preparing transaction...",
      });

      // Create transaction
      const transaction = new Transaction();

      // Check if destination account exists
      const destAccount = await connection.getAccountInfo(
        new PublicKey(contestDetails.wallet_address),
      );
      const finalLamports =
        destAccount === null ? lamports + minRentExemption : lamports;

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(user.wallet_address),
          toPubkey: new PublicKey(contestDetails.wallet_address),
          lamports: finalLamports,
        }),
      );

      // Get the latest blockhash for transaction freshness
      console.log("Getting latest blockhash...");
      const latestBlockhash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = latestBlockhash.blockhash;
      transaction.feePayer = new PublicKey(user.wallet_address);

      // COMPLIANT WITH PHANTOM'S RECOMMENDATIONS:
      // Use Phantom's unified signAndSendTransaction method instead of separate sign + send calls
      setTransactionState({
        status: "signing",
        message: "Please confirm the transaction in your wallet...",
      });

      console.log(
        "Requesting transaction signature and submission from Phantom using recommended signAndSendTransaction method...",
      );
      
      try {
        // Use signAndSendTransaction in a single call with the transaction object as a property
        // This is the correct approach according to Phantom's documentation
        const { signature } = await solana.signAndSendTransaction({
          transaction, // Must be passed as a property of an options object
        });
        console.log("Transaction sent, signature:", signature);
        confirmedSignature = signature; // Store locally to avoid race condition

        setTransactionState({
          status: "sending",
          message: "Transaction sent, waiting for confirmation...",
          signature,
        });

        toast.success(
          <div>
            <div>Transaction sent!</div>
            <div className="text-xs mt-1">
              <a
                href={`https://solscan.io/tx/${signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                View on Solscan
              </a>
            </div>
          </div>,
        );

        console.log("Waiting for transaction confirmation...");
        setTransactionState({
          status: "confirming",
          message: "Waiting for blockchain confirmation...",
          signature,
        });

        // COMPLIANT WITH PHANTOM'S RECOMMENDATIONS:
        // Use the modern confirmation pattern with signature, blockhash and lastValidBlockHeight
        await connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        });

        setTransactionState({
          status: "submitting",
          message: "Transaction confirmed! Submitting contest entry...",
          signature,
        });

        console.log("Transaction confirmed!");
      } catch (err) {
        console.error("Transaction error:", err);
        setTransactionState({
          status: "error",
          message: "Transaction failed",
          error:
            err instanceof Error
              ? err.message
              : "Unknown error during transaction",
        });
        throw err;
      }

      // 2. Submit contest entry and portfolio in one atomic operation
      console.log("Submitting contest entry and portfolio...");
      const portfolioData = {
        tokens: Array.from(selectedTokens.entries()).map(
          ([contractAddress, weight]) => ({
            contractAddress,
            weight,
          }),
        ),
      };

      // Ensure we have a valid signature before proceeding
      if (!confirmedSignature) {
        throw new Error("Transaction signature not available");
      }

      await ddApi.contests.enterContestWithPortfolio(
        contestId,
        confirmedSignature, // Use local variable instead of potentially stale state
        portfolioData,
      );

      // Set success state
      setTransactionState({
        status: "success",
        message: "Success! You have entered the contest.",
        signature: confirmedSignature,
      });

      toast.success(
        <div>
          <div>Successfully entered contest!</div>
          <div className="text-xs mt-1">
            <a
              href={`https://solscan.io/tx/${confirmedSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300"
            >
              View transaction on Solscan
            </a>
          </div>
        </div>,
        { duration: 5000 },
      );

      navigate(`/contests/${contestId}`);
    } catch (error: any) {
      const errorMsg = error.message || "Failed to enter contest";

      // Update transaction state
      setTransactionState({
        status: "error",
        message: "Error entering contest",
        error: errorMsg,
        signature: confirmedSignature || transactionState.signature,
      });

      console.error("Contest entry failed:", {
        error,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      toast.error(errorMsg, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Handle WebSocket connection issues and errors
  const displayError = tokensError || (!isTokenDataConnected && !tokenListLoading ? "WebSocket connection lost" : null);

  console.log("🎯 PortfolioTokenSelectionPage: Render logic state:", {
    tokenListLoading,
    displayError,
    tokenCount: memoizedTokens.length,
    isTokenDataConnected
  });

  if (tokenListLoading) {
    console.log("⏳ PortfolioTokenSelectionPage: Rendering skeleton loading state");
    return (
      <div className="flex flex-col min-h-screen">
        {/* Background effects */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-dark-100"></div>
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(34, 197, 94, 0.3) 0px, transparent 1px, transparent 20px, rgba(34, 197, 94, 0.3) 21px)',
              backgroundSize: '20px 40px'
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 relative">
            {/* Header */}
            <div className="mb-4 sm:mb-8 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-2 font-mono">
                <span className="text-emerald-400">[</span>
                BUILD PORTFOLIO
                <span className="text-emerald-400">]</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto font-mono">
                LOADING.TOKENS → PREPARING.SELECTION
              </p>
              
              {/* Loading indicator */}
              <div className="mt-2 flex justify-center items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-emerald-400">
                  LOADING.DATA.STREAM ({tokens.length}/1000)
                </span>
              </div>
            </div>

            {/* Skeleton Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 pb-24 lg:pb-0">
              <div className="lg:col-span-2">
                <Card className="bg-dark-200/30 backdrop-blur-sm border-emerald-500/20">
                  <div className="p-3 sm:p-6">
                    <div className="mb-4 flex justify-between items-center">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    
                    {/* Filters skeleton */}
                    <div className="mb-6 space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-8 w-32" />
                      </div>
                    </div>
                    
                    {/* Token grid skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <TokenCardSkeleton key={i} />
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
              
              {/* Portfolio summary skeleton */}
              <div className="hidden lg:block">
                <div className="sticky top-4">
                  <Card className="bg-dark-200/30 backdrop-blur-sm border-emerald-500/20">
                    <div className="p-4 sm:p-6">
                      <Skeleton className="h-6 w-40 mb-4" />
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (displayError) {
    console.log("❌ PortfolioTokenSelectionPage: Rendering error state:", displayError);
    return (
      <div className="p-6 bg-dark-300/20 rounded-lg border border-red-500/30 backdrop-blur-sm max-w-2xl mx-auto mt-8">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-red-400 animate-glitch">{displayError}</p>
            <button
              onClick={() => {
                console.log("🔄 PortfolioTokenSelectionPage: Manual refresh triggered");
                refreshTokens();
              }}
              className="mt-2 px-4 py-2 bg-dark-400/50 hover:bg-dark-400 rounded text-emerald-400 text-sm transition-all duration-300 hover:scale-105"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log("✅ PortfolioTokenSelectionPage: Rendering main content with", memoizedTokens.length, "tokens");
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="flex flex-col min-h-screen">
        {/* DIFFERENT BACKGROUND: Matrix-style instead of cyber grid */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-dark-100"></div>
          {/* Matrix rain effect */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(34, 197, 94, 0.3) 0px, transparent 1px, transparent 20px, rgba(34, 197, 94, 0.3) 21px)',
              backgroundSize: '20px 40px',
              animation: 'matrix-rain 20s linear infinite'
            }}
          />
          
          {/* Floating hexagons instead of particles */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 15 }).map((_, i) => {
              const left = `${Math.random() * 100}%`;
              const top = `${Math.random() * 100}%`;
              const duration = `${Math.random() * 10 + 15}s`;
              const delay = `${Math.random() * 3}s`;
              
              return (
                <div
                  key={i}
                  className="absolute w-3 h-3 border border-emerald-500/20 transform rotate-45 animate-pulse"
                  style={{
                    left,
                    top,
                    animationDuration: duration,
                    animationDelay: delay
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-10">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 relative">
            {/* Header Section - Different styling */}
            <div className="mb-4 sm:mb-8 text-center relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-emerald-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-2 font-mono">
                <span className="text-emerald-400">[</span>
                BUILD PORTFOLIO
                <span className="text-emerald-400">]</span>
              </h1>
              <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto font-mono">
                SELECT.TOKENS → ALLOCATE.WEIGHTS → DEPLOY.STRATEGY
              </p>
              
              {/* Connection status indicator */}
              <div className="mt-2 flex justify-center items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${isTokenDataConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className={`font-mono ${isTokenDataConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isTokenDataConnected ? 'LIVE.DATA.STREAM' : 'CONNECTION.LOST'}
                </span>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 pb-24 lg:pb-0">
              {/* Token Selection Area - Different card styling */}
              <div className="lg:col-span-2">
                <Card className="bg-dark-200/30 backdrop-blur-sm border-emerald-500/20 hover:border-emerald-400/30 transition-colors group relative overflow-hidden">
                  {/* Different gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 via-transparent to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-emerald-500/5 to-dark-300/0 opacity-0 group-hover:opacity-100" />
                  
                  <div className="p-3 sm:p-6 relative">
                    {/* Header with token count */}
                    <div className="mb-4 flex justify-between items-center">
                      <h2 className="text-lg font-bold text-emerald-400 font-mono">
                        TOKEN.SELECTION
                      </h2>
                      <div className="text-xs font-mono text-gray-400">
                        AVAILABLE: <span className="text-emerald-400">{memoizedTokens.length}</span>
                      </div>
                    </div>
                    
                    {/* Filters */}
                    <div className="mb-4 sm:mb-6">
                      <TokenFilters
                        marketCapFilter={marketCapFilter}
                        onMarketCapFilterChange={setMarketCapFilter}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                      />
                    </div>

                    {/* Token Grid */}
                    <div className="relative">
                      {tokenListLoading ? (
                        <div className="flex justify-center items-center h-48 sm:h-64">
                          <div className="text-emerald-400 font-mono">
                            LOADING.TOKENS...
                          </div>
                        </div>
                      ) : displayError ? (
                        <div className="text-red-400 text-center font-mono">
                          ERROR: {displayError}
                        </div>
                      ) : (
                        <TokenGrid
                          tokens={memoizedTokens}
                          selectedTokens={selectedTokens}
                          onTokenSelect={handleTokenSelect}
                          marketCapFilter={marketCapFilter}
                          searchQuery={debouncedSearchQuery}
                          viewMode={viewMode}
                        />
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Portfolio Summary - Different styling */}
              <div className="hidden lg:block">
                <div className="sticky top-4">
                  <Card className="bg-dark-200/30 backdrop-blur-sm border-emerald-500/20 hover:border-emerald-400/30 transition-colors group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 via-transparent to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="p-4 sm:p-6 relative">
                      <h2 className="text-lg sm:text-xl font-bold text-emerald-400 mb-4 font-mono">
                        PORTFOLIO.DEPLOY
                      </h2>
                      <PortfolioSummary
                        selectedTokens={selectedTokens}
                        tokens={memoizedTokens}
                      />

                      <div className="mt-4 sm:mt-6">
                        {/* Transaction Status Indicator - Different styling */}
                        {transactionState.status !== "idle" && (
                          <div
                            className={`mb-4 p-3 rounded-lg border font-mono text-xs ${
                              transactionState.status === "error"
                                ? "border-red-500/30 bg-red-500/10"
                                : transactionState.status === "success"
                                  ? "border-emerald-500/30 bg-emerald-500/10"
                                  : "border-emerald-500/30 bg-emerald-500/10"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {transactionState.status === "preparing" && (
                                <div className="animate-pulse text-emerald-400">
                                  [PREP]
                                </div>
                              )}
                              {transactionState.status === "signing" && (
                                <div className="animate-bounce text-emerald-400">
                                  [SIGN]
                                </div>
                              )}
                              {transactionState.status === "sending" && (
                                <div className="animate-spin text-emerald-400">
                                  [SEND]
                                </div>
                              )}
                              {transactionState.status === "confirming" && (
                                <div className="animate-pulse text-emerald-400">
                                  [WAIT]
                                </div>
                              )}
                              {transactionState.status === "submitting" && (
                                <div className="animate-pulse text-emerald-400">
                                  [SUBMIT]
                                </div>
                              )}
                              {transactionState.status === "success" && (
                                <div className="text-emerald-400">[SUCCESS]</div>
                              )}
                              {transactionState.status === "error" && (
                                <div className="text-red-400">[ERROR]</div>
                              )}
                              <div>
                                <p
                                  className={`font-medium ${
                                    transactionState.status === "error"
                                      ? "text-red-400"
                                      : transactionState.status === "success"
                                        ? "text-emerald-400"
                                        : "text-emerald-400"
                                  }`}
                                >
                                  {transactionState.message}
                                </p>
                                {transactionState.error && (
                                  <p className="text-xs text-red-400 mt-1">
                                    {transactionState.error}
                                  </p>
                                )}
                                {transactionState.signature && (
                                  <a
                                    href={`https://solscan.io/tx/${transactionState.signature}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 inline-block"
                                  >
                                    VIEW.ON.SOLSCAN
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={handleSubmit}
                          disabled={
                            loadingEntryStatus ||
                            portfolioValidation !== null ||
                            isLoading ||
                            transactionState.status !== "idle"
                          }
                          className="w-full relative group overflow-hidden text-sm sm:text-base py-3 bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-emerald-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          <span className="relative flex items-center justify-center font-medium font-mono">
                            {isLoading ? (
                              <div>
                                [DEPLOYING...]
                              </div>
                            ) : (
                              "[DEPLOY.PORTFOLIO]"
                            )}
                          </span>
                        </Button>

                        {portfolioValidation && (
                          <p className="mt-2 text-xs sm:text-sm text-red-400 text-center font-mono">
                            ERROR: {portfolioValidation}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* Floating Submit Button for Mobile - Different styling */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-100 to-transparent">
              <div className="max-w-md mx-auto">
                <Button
                  onClick={handleSubmit}
                  disabled={
                    loadingEntryStatus ||
                    portfolioValidation !== null ||
                    isLoading ||
                    transactionState.status !== "idle"
                  }
                  className="w-full relative group overflow-hidden text-sm py-4 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-emerald-500/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative flex items-center justify-center gap-2 font-mono">
                    {isLoading ? (
                      <div>[DEPLOYING...]</div>
                    ) : (
                      <>
                        <span className="font-medium">[DEPLOY]</span>
                        <span className="text-emerald-400">{totalWeight}%</span>
                      </>
                    )}
                  </span>
                </Button>
                {portfolioValidation && (
                  <p className="mt-2 text-xs text-red-400 text-center font-mono bg-dark-100/95 rounded-lg py-2">
                    ERROR: {portfolioValidation}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Custom CSS for matrix rain effect */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes matrix-rain {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
          }
        `
      }} />
    </ErrorBoundary>
  );
};
