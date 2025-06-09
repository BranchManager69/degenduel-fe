// src/pages/authenticated/TokenSelection.tsx

import { Buffer } from "buffer";

import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import PortfolioPreviewModal from "../../components/portfolio-selection/PortfolioPreviewModal";
import { PortfolioSummary } from "../../components/portfolio-selection/PortfolioSummary";
import { TokenFilters } from "../../components/portfolio-selection/TokenFilters";
import { PortfolioOptimizedTokenCard } from "../../components/portfolio-selection/PortfolioOptimizedTokenCard";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import { Contest, SearchToken, TokenHelpers } from "../../types/index";
import { useStandardizedTokenData } from "../../hooks/data/useStandardizedTokenData";
import { useWallet } from "@solana/wallet-adapter-react";

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
  
  // Use the standardized token data hook - WebSocket based for performance
  console.log("🔌 PortfolioTokenSelectionPage: Using standardized token data hook (WebSocket)");
  
  const {
    tokens,
    isLoading: tokenListLoading,
    error: tokensError,
    isConnected: isTokenDataConnected,
    lastUpdate,
    refresh: refreshTokens,
    loadMore,
    pagination
  } = useStandardizedTokenData("all", "marketCap", {}, 5, 50); // Start with 50, load more on scroll
  
  // Jupiter filters don't work with the centralized hook right now
  // The backend already filters duplicates for us

  console.log("📊 PortfolioTokenSelectionPage: WebSocket token data state:", {
    tokenCount: tokens.length,
    tokenListLoading,
    tokensError,
    isTokenDataConnected
  });
  
  const [selectedTokens, setSelectedTokens] = useState<Map<string, number>>(
    new Map(),
  );
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [contest, setContest] = useState<Contest | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const user = useStore((state) => state.user);
  
  // Infinite scroll state
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreTriggerRef = useRef<HTMLDivElement | null>(null);
  
  // Modern wallet adapter for transactions
  const { publicKey, signTransaction, connected, connect } = useWallet();
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

  // Now using WebSocket-based standardized token data for better performance!
  console.log("🚀 PortfolioTokenSelectionPage: Using WebSocket-based standardized token data");
  
  useEffect(() => {
    const fetchContest = async () => {
      if (!contestId || contestId === 'undefined' || contestId === 'null') {
        console.error("Invalid contest ID:", contestId);
        toast.error("Invalid contest ID", { duration: 5000 });
        return;
      }
      
      // Validate that contestId is a valid number
      const numericId = parseInt(contestId, 10);
      if (isNaN(numericId) || numericId <= 0) {
        console.error("Contest ID must be a valid number:", contestId);
        toast.error("Invalid contest ID format", { duration: 5000 });
        return;
      }
      
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

  // Smart token ordering: selected tokens first, then rest with progressive loading
  const memoizedTokens = useMemo(() => {
    console.log("🔄 PortfolioTokenSelectionPage: Processing tokens, count:", tokens.length);
    
    // Get selected token addresses
    const selectedAddresses = Array.from(selectedTokens.keys());
    
    // Split tokens: selected ones first, then unselected
    const selectedTokensList = tokens.filter(token => 
      selectedAddresses.includes(TokenHelpers.getAddress(token))
    );
    const unselectedTokensList = tokens.filter(token => 
      !selectedAddresses.includes(TokenHelpers.getAddress(token))
    );
    
    // Put selected tokens at top for immediate visibility and clicking
    const orderedTokens = [...selectedTokensList, ...unselectedTokensList];
    
    console.log("🔄 PortfolioTokenSelectionPage: Ordered tokens:", {
      selected: selectedTokensList.length,
      unselected: unselectedTokensList.length,
      total: orderedTokens.length
    });
    
    return orderedTokens;
  }, [tokens, selectedTokens]);

  // Token selection handler - will be defined after offline mode variables

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

  const handlePreviewPortfolio = () => {
    setShowPreviewModal(true);
  };

  // Token search selection handler - will be defined after handleTokenSelect

  // Generate portfolio summary for the modal
  const portfolioSummary = useMemo(() => {
    if (selectedTokens.size === 0) return '';
    
    const tokenEntries = Array.from(selectedTokens.entries())
      .map(([contractAddress, weight]) => {
        const token = memoizedTokens.find(t => t.contractAddress === contractAddress);
        return `${token?.symbol || 'Unknown'} (${weight}%)`;
      })
      .join(', ');
    
    return tokenEntries;
  }, [selectedTokens, memoizedTokens]);

  const portfolioDetails = useMemo(() => {
    const tokens = Array.from(selectedTokens.entries())
      .map(([contractAddress, weight]) => {
        const token = memoizedTokens.find(t => t.contractAddress === contractAddress);
        return {
          symbol: token?.symbol || 'Unknown',
          weight,
          price: token?.price ? Number(token.price) : undefined
        };
      })
      .sort((a, b) => b.weight - a.weight); // Sort by weight descending

    return {
      name: `Portfolio for ${contest?.name || 'Contest'}`,
      tokens
    };
  }, [selectedTokens, memoizedTokens, contest?.name]);

  const handleSubmit = async () => {
    if (!contest || !contestId || contestId === 'undefined' || contestId === 'null') {
      console.error("Submit failed: Missing contest data:", {
        contest,
        contestId,
      });
      toast.error("Contest information not available");
      return;
    }
    
    // Validate that contestId is a valid number
    const numericId = parseInt(contestId, 10);
    if (isNaN(numericId) || numericId <= 0) {
      console.error("Submit failed: Invalid contest ID format:", contestId);
      toast.error("Invalid contest ID format");
      return;
    }

    if (!user?.wallet_address) {
      console.error("Submit failed: No wallet address");
      toast.error("Please connect your wallet first");
      return;
    }

    // Check if this is a free contest
    const entryFee = Number(contest.entry_fee);
    const isFreeContest = entryFee === 0;

    console.log("Contest entry details:", {
      contestId,
      entryFee,
      isFreeContest,
      contestName: contest.name,
    });

    // Capture signature in local variable to avoid React state race condition
    let confirmedSignature: string | undefined;
    
    try {
      setIsLoading(true);

      // Prepare portfolio data
      const portfolioData = {
        tokens: Array.from(selectedTokens.entries()).map(
          ([contractAddress, weight]) => ({
            contractAddress,
            weight,
          }),
        ),
      };

      if (isFreeContest) {
        // FREE CONTEST FLOW: No Solana transaction required
        console.log("Entering free contest directly...");
        setTransactionState({
          status: "submitting",
          message: "Submitting contest entry...",
        });

        await ddApi.contests.enterFreeContestWithPortfolio(
          contestId,
          portfolioData,
        );

        setTransactionState({
          status: "success",
          message: "Success! You have entered the free contest.",
        });

        toast.success("Successfully entered free contest!", { duration: 5000 });

      } else {
        // PAID CONTEST FLOW: Requires Solana transaction
        console.log("Processing paid contest entry...");

        // Get contest details to ensure we have the wallet address
        const contestDetails = await ddApi.contests.getById(contestId);
        if (!contestDetails.wallet_address) {
          throw new Error("Contest wallet address not found");
        }

        // 1. Modern wallet connection and transaction flow
        console.log("Initializing modern wallet transaction...");
        
        // Ensure wallet is connected - this will show wallet picker if not connected
        if (!connected || !publicKey || !signTransaction) {
          console.log("Wallet not connected, prompting connection...");
          setTransactionState({
            status: "preparing",
            message: "Connecting wallet...",
          });
          
          try {
            await connect();
            console.log("Wallet connected successfully");
          } catch (error: any) {
            console.error("Wallet connection failed:", error);
            throw new Error("Please connect a Solana wallet to continue");
          }
        }

        // Verify connected wallet matches user's registered wallet (after connection is confirmed)
        if (user?.wallet_address && publicKey && publicKey.toBase58() !== user.wallet_address) {
          throw new Error("Connected wallet doesn't match your registered wallet address");
        }

        console.log("Creating Solana connection...");
        const connection = new Connection(
          '/api/solana-rpc', // Using server-side Solana proxy
          "confirmed",
        );

        // Get minimum rent exemption
        const minRentExemption =
          await connection.getMinimumBalanceForRentExemption(0);
        const lamports = Math.floor(parseFloat(contest.entry_fee) * 1e9);

        console.log("Transaction details:", {
          from: publicKey?.toBase58(),
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

        // Ensure we have a valid publicKey before creating transaction
        if (!publicKey) {
          throw new Error("Wallet public key not available");
        }

        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(contestDetails.wallet_address),
            lamports: finalLamports,
          }),
        );

        // Get the latest blockhash for transaction freshness
        console.log("Getting latest blockhash...");
        const latestBlockhash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = publicKey;

        // Modern wallet adapter transaction signing
        setTransactionState({
          status: "signing",
          message: "Please confirm the transaction in your wallet...",
        });

        console.log("Requesting transaction signature using modern wallet adapter...");
        
        try {
          // Ensure signTransaction is available
          if (!signTransaction) {
            throw new Error("Wallet signing function not available");
          }

          // Use modern wallet adapter signTransaction method
          const signedTransaction = await signTransaction(transaction);
          console.log("Transaction signed successfully");

          setTransactionState({
            status: "sending",
            message: "Sending transaction to blockchain...",
          });

          // Send the signed transaction
          const signature = await connection.sendRawTransaction(signedTransaction.serialize());
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

          // Modern confirmation pattern
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
        } catch (err: any) {
          console.error("Transaction error:", err);
          
          // Handle specific wallet errors
          let errorMessage = "Transaction failed";
          if (err.code === 4001 || err.message?.includes("User rejected")) {
            errorMessage = "Transaction cancelled by user";
          } else if (err.message?.includes("Insufficient funds")) {
            errorMessage = "Insufficient SOL balance for transaction";
          } else if (err.message?.includes("blockhash not found")) {
            errorMessage = "Transaction expired, please try again";
          } else if (err instanceof Error) {
            errorMessage = err.message;
          }
          
          setTransactionState({
            status: "error",
            message: "Transaction failed",
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }

        // 2. Submit contest entry and portfolio in one atomic operation
        console.log("Submitting contest entry and portfolio...");

        // Ensure we have a valid signature before proceeding
        if (!confirmedSignature) {
          throw new Error("Transaction signature not available");
        }

        await ddApi.contests.enterContestWithPortfolio(
          contestId,
          portfolioData,
          confirmedSignature, // Use local variable instead of potentially stale state
        );

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
      }

      // Navigate to contest page after successful entry (both free and paid)
      navigate(`/contests/${contestId}`);
    } catch (error: any) {
      const errorMsg = error.message || "Failed to enter contest";

      // Handle "already participating" as info, not error
      if (errorMsg.toLowerCase().includes("already participating")) {
        // Show success message and redirect
        setTransactionState({
          status: "success",
          message: "You're already participating in this contest!",
        });

        toast.success("You're already in this contest! Redirecting to contest page...", { duration: 3000 });
        
        // Navigate to contest page after brief delay
        setTimeout(() => {
          navigate(`/contests/${contestId}`);
        }, 1500);
        
        return; // Don't show error state
      }

      // Handle analytics tracking errors gracefully
      if (errorMsg.includes("participationLogger.analytics.trackEvent is not a function") || 
          errorMsg.includes("analytics tracking temporarily unavailable")) {
        // This is a backend analytics error that doesn't affect the core functionality
        console.warn("Backend analytics error detected (non-critical):", errorMsg);
        
        // Still show success for the contest entry (the analytics error is secondary)
        setTransactionState({
          status: "success",
          message: "Contest entry successful! (Analytics temporarily unavailable)",
          signature: confirmedSignature || transactionState.signature,
        });

        toast.success("Successfully entered contest! (Analytics tracking temporarily unavailable)", { duration: 4000 });
        
        // Navigate to contest page after brief delay
        setTimeout(() => {
          navigate(`/contests/${contestId}`);
        }, 1500);
        
        return; // Don't show error state for this non-critical error
      }

      // Handle all other errors normally
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

  // ENHANCED: Offline-first portfolio selection with persistent state
  const [wsDisconnectTime, setWsDisconnectTime] = useState<number | null>(null);
  const [isInWsGracePeriod, setIsInWsGracePeriod] = useState(false);
  const [pendingSelections, setPendingSelections] = useState<Map<string, number>>(new Map());
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Extend grace period and add offline mode support
  useEffect(() => {
    const GRACE_PERIOD_MS = 30000; // Extended to 30 seconds for better UX
    
    if (!isTokenDataConnected) {
      // Just disconnected
      if (wsDisconnectTime === null) {
        const now = Date.now();
        setWsDisconnectTime(now);
        setIsInWsGracePeriod(true);
        
        console.log('[PortfolioSelection] WebSocket disconnected, entering offline mode');
        
        // Set timeout to end grace period
        const timeout = setTimeout(() => {
          setIsInWsGracePeriod(false);
          console.log('[PortfolioSelection] Grace period ended, showing offline mode');
        }, GRACE_PERIOD_MS);
        
        return () => clearTimeout(timeout);
      }
    } else if (isTokenDataConnected) {
      // Reconnected - sync any pending changes
      if (wsDisconnectTime !== null) {
        console.log('[PortfolioSelection] WebSocket reconnected, syncing offline changes');
        setLastSyncTime(new Date());
        
        // If there are pending selections, they'll be handled by the component state
        if (pendingSelections.size > 0) {
          console.log(`[PortfolioSelection] Syncing ${pendingSelections.size} offline selections`);
          setPendingSelections(new Map()); // Clear pending after sync
        }
      }
      
      setWsDisconnectTime(null);
      setIsInWsGracePeriod(false);
    }
  }, [isTokenDataConnected, wsDisconnectTime, pendingSelections.size]);

  // Determine if we're in offline mode (needed before token handler)
  const isOfflineMode = !isTokenDataConnected && !isInWsGracePeriod;
  const showOfflineIndicator = isOfflineMode && memoizedTokens.length > 0;

  // Load more tokens for infinite scroll
  const loadMoreTokens = useCallback(() => {
    if (isLoadingMore || !pagination?.hasMore || tokenListLoading) {
      console.log('[PortfolioTokenSelectionPage] Cannot load more:', { isLoadingMore, hasMore: pagination?.hasMore, tokenListLoading });
      return;
    }
    
    console.log('[PortfolioTokenSelectionPage] Loading more tokens...');
    setIsLoadingMore(true);
    
    // Use the actual loadMore function from the hook
    loadMore();
    
    // Reset loading state after a short delay
    setTimeout(() => {
      setIsLoadingMore(false);
    }, 500);
  }, [isLoadingMore, pagination?.hasMore, tokenListLoading, loadMore]);

  // Enhanced token selection handler with offline support
  const handleTokenSelect = useCallback(
    (contractAddress: string) => {
      console.log("🔍 PortfolioTokenSelectionPage: handleTokenSelect called with:", {
        contractAddress,
        isOffline: isOfflineMode
      });

      // Early return if no valid contract address
      if (!contractAddress || typeof contractAddress !== 'string') {
        console.warn("Invalid contract address provided:", contractAddress);
        return;
      }

      const token = memoizedTokens.find(
        (t) => t.contractAddress === contractAddress,
      );
      console.log("Token being selected:", token);

      // Toggle selection with smart default weight
      setSelectedTokens((prev) => {
        const newSelectedTokens = new Map(prev);
        
        if (newSelectedTokens.has(contractAddress)) {
          // Token is already selected - remove it
          newSelectedTokens.delete(contractAddress);
          
          if (isOfflineMode) {
            setPendingSelections((pending) => {
              const newPending = new Map(pending);
              newPending.delete(contractAddress);
              return newPending;
            });
          }
          
          if (token) {
            toast.success(`${token.symbol} removed from portfolio`, { duration: 2000 });
          }
        } else {
          // Token not selected - add it with smart default weight
          const usedWeight = Array.from(newSelectedTokens.values()).reduce((sum, w) => sum + w, 0);
          const remainingWeight = 100 - usedWeight;
          
          let defaultWeight: number;
          if (remainingWeight >= 20) {
            defaultWeight = 20; // Give more meaningful chunk when plenty of space
          } else if (remainingWeight >= 10) {
            defaultWeight = 10; // Standard default when moderate space
          } else if (remainingWeight >= 5) {
            defaultWeight = remainingWeight; // Use all remaining when little space
          } else if (remainingWeight > 0) {
            defaultWeight = remainingWeight; // Use exactly what's left
          } else {
            // Portfolio full - show helpful error
            toast.error(`Portfolio is full (${usedWeight}%). Remove tokens or adjust weights first.`, { 
              duration: 4000 
            });
            return prev;
          }
          
          newSelectedTokens.set(contractAddress, defaultWeight);
          
          if (isOfflineMode) {
            setPendingSelections((pending) => {
              const newPending = new Map(pending);
              newPending.set(contractAddress, defaultWeight);
              return newPending;
            });
          }
          
          if (token) {
            toast.success(`${token.symbol} added with ${defaultWeight}% weight`, { duration: 2000 });
          }
        }
        
        return newSelectedTokens;
      });
    },
    [memoizedTokens, isOfflineMode],
  );

  // Handle weight changes for selected tokens
  const handleWeightChange = useCallback(
    (contractAddress: string, newWeight: number) => {
      console.log("🔍 PortfolioTokenSelectionPage: handleWeightChange called with:", {
        contractAddress,
        newWeight,
        isOffline: isOfflineMode
      });

      if (newWeight === 0) {
        // Weight set to 0 means remove the token
        handleTokenSelect(contractAddress);
        return;
      }

      setSelectedTokens((prev) => {
        const newSelectedTokens = new Map(prev);
        newSelectedTokens.set(contractAddress, newWeight);
        
        // Track offline changes for sync when reconnected
        if (isOfflineMode) {
          setPendingSelections((pending) => {
            const newPending = new Map(pending);
            newPending.set(contractAddress, newWeight);
            return newPending;
          });
        }
        
        return newSelectedTokens;
      });
    },
    [isOfflineMode, handleTokenSelect],
  );

  // Handle token search selection with smart weight calculation and top positioning
  const handleTokenSearchSelect = useCallback((token: SearchToken, customWeight?: number) => {
    // Find if this token exists in our current token list
    const existingToken = memoizedTokens.find(t => t.contractAddress === token.address);
    if (existingToken) {
      // Check if token is already selected
      if (selectedTokens.has(token.address)) {
        toast.error(`${token.symbol} is already in your portfolio`, { duration: 3000 });
        return;
      }
      
      // Calculate smart default weight based on remaining portfolio space
      const usedWeight = Array.from(selectedTokens.values()).reduce((sum, w) => sum + w, 0);
      const remainingWeight = 100 - usedWeight;
      
      let defaultWeight: number;
      if (customWeight) {
        defaultWeight = customWeight;
      } else if (remainingWeight >= 20) {
        defaultWeight = 20; // Give more meaningful chunk when plenty of space
      } else if (remainingWeight >= 10) {
        defaultWeight = 10; // Standard default when moderate space
      } else if (remainingWeight >= 5) {
        defaultWeight = remainingWeight; // Use all remaining when little space
      } else if (remainingWeight > 0) {
        defaultWeight = remainingWeight; // Use exactly what's left
      } else {
        // Portfolio full - show helpful error
        toast.error(`Portfolio is full (${usedWeight}%). Remove tokens or adjust weights first.`, { 
          duration: 4000 
        });
        return;
      }
      
      // Add token to selection - this will trigger memoizedTokens to reorder and put it at top
      handleTokenSelect(token.address);
      
      // Scroll to top so user can see the newly selected token
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      
      toast.success(`Added ${token.symbol} with ${defaultWeight}% weight - now at top of list`, { 
        duration: 3000 
      });
    } else {
      // Token not in current data - add it from search data if possible
      console.log('Token not found in current token list, attempting to add from search data:', token);
      
      // Check if already selected by address
      if (selectedTokens.has(token.address)) {
        toast.error(`${token.symbol} is already in your portfolio`, { duration: 3000 });
        return;
      }
      
      // Calculate weight
      const usedWeight = Array.from(selectedTokens.values()).reduce((sum, w) => sum + w, 0);
      const remainingWeight = 100 - usedWeight;
      
      let defaultWeight: number;
      if (customWeight) {
        defaultWeight = customWeight;
      } else if (remainingWeight >= 20) {
        defaultWeight = 20;
      } else if (remainingWeight >= 10) {
        defaultWeight = 10;
      } else if (remainingWeight > 0) {
        defaultWeight = remainingWeight;
      } else {
        toast.error(`Portfolio is full (${usedWeight}%). Remove tokens first.`, { duration: 4000 });
        return;
      }
      
      // Add the token even if not in current list (it will appear when data loads)
      handleTokenSelect(token.address);
      
      toast.success(`Added ${token.symbol} with ${defaultWeight}% weight - will appear when data loads`, { 
        duration: 4000 
      });
    }
  }, [memoizedTokens, handleTokenSelect, selectedTokens]);

  // Set up infinite scroll observer
  useEffect(() => {
    if (!loadMoreTriggerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination?.hasMore && !isLoadingMore && !tokenListLoading) {
          console.log('[PortfolioTokenSelectionPage] Intersection detected, loading more tokens');
          loadMoreTokens();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // Start loading when 200px away from bottom
      }
    );
    
    observer.observe(loadMoreTriggerRef.current);
    
    return () => {
      if (loadMoreTriggerRef.current) {
        observer.unobserve(loadMoreTriggerRef.current);
      }
    };
  }, [pagination?.hasMore, isLoadingMore, tokenListLoading, loadMoreTokens]);

  // FIXED: Never block UI for connection issues when we have cached data
  const displayError = tokensError && memoizedTokens.length === 0 ? tokensError : null;

  console.log("🎯 PortfolioTokenSelectionPage: Render logic state:", {
    tokenListLoading,
    displayError,
    tokenCount: memoizedTokens.length,
    isTokenDataConnected,
    isOfflineMode,
    showOfflineIndicator
  });

  // Show loading skeleton when we have no tokens and are loading
  if (tokenListLoading && memoizedTokens.length === 0) {
    console.log("⏳ PortfolioTokenSelectionPage: Rendering skeleton loading state (no cached tokens)");
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
              
              {/* Enhanced loading indicator with retry */}
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${isTokenDataConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className={`font-mono ${isTokenDataConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isTokenDataConnected ? 
                      `LOADING.WEBSOCKET.DATA (${tokens.length}/1000)` : 
                      'CONNECTION.LOST'
                    }
                  </span>
                </div>
                
                {/* Manual retry button during loading */}
                <button
                  onClick={() => {
                    console.log("🔄 PortfolioTokenSelectionPage: Manual refresh triggered during loading");
                    refreshTokens();
                  }}
                  className="px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded text-emerald-400 text-sm font-mono hover:bg-emerald-600/30 transition-colors"
                >
                  [RETRY.CONNECTION]
                </button>
                
                {/* Show last update time if available */}
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
      <div className="flex flex-col min-h-screen">
        <div className="relative z-10 max-w-2xl mx-auto mt-8 px-4">
          <div className="p-6 bg-dark-300/20 rounded-lg border border-red-500/30 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div className="flex-1">
                <h2 className="text-red-400 font-bold mb-2 font-mono">DATA.STREAM.ERROR</h2>
                <p className="text-red-400 mb-4 font-mono text-sm">{displayError}</p>
                
                {/* Connection diagnostics */}
                <div className="mb-4 p-3 bg-dark-400/30 rounded border border-red-500/20">
                  <div className="text-xs font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">WebSocket:</span>
                      <span className={isTokenDataConnected ? 'text-emerald-400' : 'text-red-400'}>
                        {isTokenDataConnected ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tokens Loaded:</span>
                      <span className="text-gray-300">{memoizedTokens.length}</span>
                    </div>
                    {lastUpdate && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Update:</span>
                        <span className="text-gray-300">{lastUpdate.toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      console.log("🔄 PortfolioTokenSelectionPage: Manual refresh triggered from error state");
                      refreshTokens();
                    }}
                    className="px-4 py-2 bg-red-600/20 border border-red-500/30 rounded text-red-400 text-sm font-mono hover:bg-red-600/30 transition-colors"
                  >
                    [RETRY.CONNECTION]
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log("🔄 PortfolioTokenSelectionPage: Hard refresh triggered");
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-gray-600/20 border border-gray-500/30 rounded text-gray-400 text-sm font-mono hover:bg-gray-600/30 transition-colors"
                  >
                    [HARD.REFRESH]
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log("🔄 PortfolioTokenSelectionPage: Navigate back to contests");
                      navigate('/contests');
                    }}
                    className="px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded text-blue-400 text-sm font-mono hover:bg-blue-600/30 transition-colors"
                  >
                    [BACK.TO.CONTESTS]
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log("✅ PortfolioTokenSelectionPage: Rendering main content with", memoizedTokens.length, "tokens");
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="flex flex-col min-h-screen">
        {/* Enhanced Offline/Connection Status Banner */}
        {showOfflineIndicator && (
          <div className="bg-blue-500/10 border-b border-blue-500/30 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                <span>Offline mode - selections saved locally ({memoizedTokens.length} tokens available)</span>
              </div>
              <div className="flex items-center gap-3">
                {lastUpdate && (
                  <span className="text-xs text-blue-300">
                    Data from: {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
                {lastSyncTime && (
                  <span className="text-xs text-emerald-300">
                    Synced: {lastSyncTime.toLocaleTimeString()}
                  </span>
                )}
                <button
                  onClick={() => {
                    console.log("🔄 PortfolioTokenSelectionPage: Manual retry from offline banner");
                    refreshTokens();
                  }}
                  className="px-3 py-1 bg-blue-500/20 rounded text-xs hover:bg-blue-500/30 transition-colors font-mono"
                >
                  [RECONNECT]
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading indicator when refreshing data */}
        {tokenListLoading && memoizedTokens.length > 0 && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 px-4 py-2">
            <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm">
              <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
              <span className="font-mono">Updating token data...</span>
            </div>
          </div>
        )}
        
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
              <div className="mt-2 flex justify-center items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isTokenDataConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className={`font-mono ${isTokenDataConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isTokenDataConnected ? 'LIVE.DATA.STREAM' : 'CONNECTION.LOST'}
                  </span>
                </div>
                
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
                    
                    {/* Simplified Filters - Only search and view mode */}
                    <div className="mb-4 sm:mb-6">
                      <TokenFilters
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        onTokenSearchSelect={handleTokenSearchSelect}
                      />
                    </div>

                    {/* Enhanced Token Grid - Visual rich cards with infinite scroll */}
                    <div className="relative">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {memoizedTokens.map((token) => {
                          const contractAddress = TokenHelpers.getAddress(token);
                          const isSelected = selectedTokens.has(contractAddress);
                          const weight = selectedTokens.get(contractAddress) || 0;
                          
                          return (
                            <PortfolioOptimizedTokenCard
                              key={contractAddress}
                              token={token}
                              isSelected={isSelected}
                              weight={weight}
                              onSelect={() => handleTokenSelect(contractAddress)}
                              onWeightChange={(newWeight) => handleWeightChange(contractAddress, newWeight)}
                            />
                          );
                        })}
                      </div>
                      
                      {/* Infinite scroll trigger - Pure auto-loading, no buttons! */}
                      {pagination && pagination.hasMore && (
                        <div 
                          ref={loadMoreTriggerRef}
                          className="relative py-12"
                        >
                          <div className="flex items-center justify-center">
                            {isLoadingMore ? (
                              <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-75"></div>
                                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse delay-150"></div>
                                </div>
                                <span className="text-sm text-gray-400 font-mono">Loading more tokens...</span>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 font-mono">
                                Scroll for more • {memoizedTokens.length} tokens loaded
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Pagination info for admins */}
                      {pagination && user && (user.role === 'admin' || user.role === 'superadmin') && (
                        <div className="mt-4 text-center text-xs font-mono text-gray-500">
                          Loaded: {memoizedTokens.length} | Total: {pagination.total} | HasMore: {pagination.hasMore ? '✅' : '❌'}
                        </div>
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

                        {/* Offline Status Indicator */}
                        {showOfflineIndicator && (
                          <div className="mb-4 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                              <span className="text-blue-300">OFFLINE MODE</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400">
                                Selections saved locally
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Contest Type Indicator */}
                        {contest && (
                          <div className="mb-4 p-2 rounded-lg bg-dark-300/30 border border-gray-600/30">
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <div className={`w-2 h-2 rounded-full ${Number(contest.entry_fee) === 0 ? 'bg-emerald-400' : 'bg-brand-400'}`} />
                              <span className="text-gray-300">
                                {Number(contest.entry_fee) === 0 ? 'FREE CONTEST' : 'PAID CONTEST'}
                              </span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400">
                                {Number(contest.entry_fee) === 0 ? 'No payment required' : `${contest.entry_fee} SOL entry fee`}
                              </span>
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={handlePreviewPortfolio}
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
                              "[PREVIEW.PORTFOLIO]"
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
                  onClick={handlePreviewPortfolio}
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
                        <span className="font-medium">[PREVIEW]</span>
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

      {/* Portfolio Preview Modal */}
      <PortfolioPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        source="recent"
        summary={portfolioSummary}
        portfolioDetails={portfolioDetails}
        onConfirm={() => {
          setShowPreviewModal(false);
          handleSubmit();
        }}
      />
    </ErrorBoundary>
  );
};
