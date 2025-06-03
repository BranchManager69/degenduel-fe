// src/pages/authenticated/TokenSelection.tsx

import { Buffer } from "buffer";

import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
} from "@solana/web3.js";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import PortfolioPreviewModal from "../../components/portfolio-selection/PortfolioPreviewModal";
import { PortfolioSummary } from "../../components/portfolio-selection/PortfolioSummary";
import { TokenFilters } from "../../components/portfolio-selection/TokenFilters";
import { TokenGrid } from "../../components/portfolio-selection/TokenGrid";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import { Contest, Token, SearchToken } from "../../types/index";

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
  
  // Jupiter filter state - declared early to avoid "used before declaration" errors
  const [jupiterFilters, setJupiterFilters] = useState({
    strictOnly: false,
    verifiedOnly: false,
    showAll: true
  });
  
  // Use the SAME working WebSocket approach as TokensPage (bypass broken standardized hook)
  console.log("🔌 PortfolioTokenSelectionPage: Using direct WebSocket like TokensPage");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokenListLoading, setTokenListLoading] = useState(true);
  const [tokensError, setTokensError] = useState<string | null>(null);
  const [isTokenDataConnected, setIsTokenDataConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Helper function to transform WebSocket token data (same as TokensPage)
  const transformTokenData = useCallback((tokenData: any): Token => {
    return {
      // Core identification
      id: tokenData.id || 0,
      address: tokenData.address || "",
      contractAddress: tokenData.address || "",
      symbol: tokenData.symbol || "",
      name: tokenData.name || "",
      
      // Numbers not strings
      price: tokenData.price || 0,
      market_cap: tokenData.market_cap || 0,
      marketCap: String(tokenData.market_cap || 0), // backward compat
      volume_24h: tokenData.volume_24h || 0,
      volume24h: String(tokenData.volume_24h || 0), // backward compat
      change_24h: tokenData.change_24h || 0,
      change24h: String(tokenData.change_24h || 0), // backward compat
      liquidity: tokenData.liquidity || 0,
      fdv: tokenData.fdv || 0,
      decimals: tokenData.decimals || 9,
      
      // Visual/metadata
      image_url: tokenData.image_url || "",
      header_image_url: tokenData.header_image_url || "",
      color: tokenData.color || "#888888",
      description: tokenData.description || "",
      tags: tokenData.tags || [],
      
      // Supply & ranking
      total_supply: tokenData.total_supply || 0,
      totalSupply: String(tokenData.total_supply || 0), // backward compat
      priority_score: tokenData.priority_score || 0,
      priorityScore: tokenData.priority_score || 0, // backward compat
      first_seen_on_jupiter_at: tokenData.first_seen_on_jupiter_at || null,
      firstSeenAt: tokenData.first_seen_on_jupiter_at || null, // backward compat
      pairCreatedAt: tokenData.pairCreatedAt || null,
      
      // Legacy images for backward compatibility
      images: {
        imageUrl: tokenData.image_url || "",
        headerImage: tokenData.header_image_url || "",
        openGraphImage: tokenData.open_graph_image_url || ""
      },
      
      // Social links (now strings)
      socials: {
        twitter: tokenData.socials?.twitter,
        telegram: tokenData.socials?.telegram,
        discord: tokenData.socials?.discord,
        website: tokenData.socials?.website
      },
      
      status: "active",
      websites: tokenData.websites || [],
      priceChanges: tokenData.priceChanges || {
        "5m": "0",
        "1h": "0", 
        "6h": "0",
        "24h": tokenData.change_24h?.toString() || "0"
      },
      volumes: tokenData.volumes || {
        "5m": "0",
        "1h": "0",
        "6h": "0", 
        "24h": tokenData.volume_24h?.toString() || "0"
      },
      transactions: tokenData.transactions || {
        "5m": { buys: 0, sells: 0 },
        "1h": { buys: 0, sells: 0 },
        "6h": { buys: 0, sells: 0 },
        "24h": { buys: 0, sells: 0 }
      }
    };
  }, []);
  
  // Connect to WebSocket for real-time token data (same as TokensPage)
  const connectWebSocket = useCallback((filters = jupiterFilters) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }
    
    setIsTokenDataConnected(false);
    const socket = new WebSocket('wss://degenduel.me/api/v69/ws');
    socketRef.current = socket;
    
    socket.onopen = () => {
      setIsTokenDataConnected(true);
      
      // Subscribe to market data
      socket.send(JSON.stringify({
        type: 'SUBSCRIBE',
        topics: ['market-data']
      }));
      
      // Request tokens with user-configurable Jupiter filters
      const requestData: { 
        limit: number;
        filters: {
          strictOnly?: boolean;
          verifiedOnly?: boolean;
        };
      } = { 
        limit: 1000,
        filters: {}
      };
      
      // Apply Jupiter filters based on user selection
      if (filters.strictOnly) {
        requestData.filters.strictOnly = true;
      } else if (filters.verifiedOnly) {
        requestData.filters.verifiedOnly = true;
      }
      // If showAll is true, no filters are applied
      
      socket.send(JSON.stringify({
        type: 'REQUEST',
        topic: 'market-data',
        action: 'getTokens',
        data: requestData
      }));
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.topic === 'market-data' && data.action === 'getTokens' && Array.isArray(data.data)) {
          console.log(`Processing ${data.data.length} tokens from WebSocket`);
          
          const newTokenMap: Record<string, Token> = {};
          const tokensList: Token[] = [];
          
          data.data.forEach((tokenData: any) => {
            const token = transformTokenData(tokenData);
            if (token.contractAddress) {
              newTokenMap[token.contractAddress] = token;
              tokensList.push(token);
            }
          });
          
          // setTokenMap(newTokenMap); // tokenMap not used
          setTokens(tokensList);
          setTokenListLoading(false);
          setTokensError(null);
        }
      } catch (err) {
        console.error("Failed to process WebSocket message:", err);
        setTokensError("Failed to process token data");
      }
    };
    
    socket.onerror = () => {
      setTokensError("WebSocket connection error");
      setIsTokenDataConnected(false);
    };
    
    socket.onclose = () => {
      setIsTokenDataConnected(false);
    };
  }, [transformTokenData, jupiterFilters]);
  
  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);
  
  // Refresh token data when Jupiter filters change
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const requestData: { 
        limit: number;
        filters: {
          strictOnly?: boolean;
          verifiedOnly?: boolean;
        };
      } = { 
        limit: 1000,
        filters: {}
      };
      
      // Apply Jupiter filters based on current user selection
      if (jupiterFilters.strictOnly) {
        requestData.filters.strictOnly = true;
      } else if (jupiterFilters.verifiedOnly) {
        requestData.filters.verifiedOnly = true;
      }
      
      socketRef.current.send(JSON.stringify({
        type: 'REQUEST',
        topic: 'market-data',
        action: 'getTokens',
        data: requestData
      }));
    }
  }, [jupiterFilters]);
  
  // Add refresh function to match the old interface
  const refreshTokens = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const requestData: { 
        limit: number;
        filters: {
          strictOnly?: boolean;
          verifiedOnly?: boolean;
        };
      } = { 
        limit: 1000,
        filters: {}
      };
      
      // Apply Jupiter filters based on current user selection
      if (jupiterFilters.strictOnly) {
        requestData.filters.strictOnly = true;
      } else if (jupiterFilters.verifiedOnly) {
        requestData.filters.verifiedOnly = true;
      }
      
      socketRef.current.send(JSON.stringify({
        type: 'REQUEST',
        topic: 'market-data',
        action: 'getTokens',
        data: requestData
      }));
    }
  }, [jupiterFilters]);

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
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  
  // Keep debouncedSearchQuery as empty for TokenGrid compatibility
  const debouncedSearchQuery = "";
  const [contest, setContest] = useState<Contest | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
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

  const handlePreviewPortfolio = () => {
    setShowPreviewModal(true);
  };

  // Handle token search selection
  const handleTokenSearchSelect = useCallback((token: SearchToken) => {
    // Find if this token exists in our current token list
    const existingToken = memoizedTokens.find(t => t.contractAddress === token.address);
    if (existingToken) {
      // If found, select it with 10% weight as default
      handleTokenSelect(token.address, 10);
    } else {
      // If not found in current list, show a message
      console.log('Token not found in current token list:', token);
    }
  }, [memoizedTokens, handleTokenSelect]);

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

  // Grace period for WebSocket disconnections (like UnifiedTicker)
  const [wsDisconnectTime, setWsDisconnectTime] = useState<number | null>(null);
  const [isInWsGracePeriod, setIsInWsGracePeriod] = useState(false);
  
  useEffect(() => {
    const GRACE_PERIOD_MS = 8000; // 8 seconds grace period
    
    if (!isTokenDataConnected) {
      // Just disconnected
      if (wsDisconnectTime === null) {
        const now = Date.now();
        setWsDisconnectTime(now);
        setIsInWsGracePeriod(true);
        
        // Set timeout to end grace period
        const timeout = setTimeout(() => {
          setIsInWsGracePeriod(false);
        }, GRACE_PERIOD_MS);
        
        return () => clearTimeout(timeout);
      }
    } else if (isTokenDataConnected) {
      // Reconnected - clear grace period
      setWsDisconnectTime(null);
      setIsInWsGracePeriod(false);
    }
  }, [isTokenDataConnected, wsDisconnectTime]);

  // Only show error for actual data errors, not connection issues during grace period
  const displayError = tokensError || (!isTokenDataConnected && !isInWsGracePeriod && !tokenListLoading && memoizedTokens.length === 0 ? "Unable to load token data. Please check your connection." : null);

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
        {/* Connection Status Banner */}
        {!isTokenDataConnected && !isInWsGracePeriod && (
          <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2">
            <div className="flex items-center justify-center gap-2 text-yellow-400 text-sm">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              <span>Connection lost - showing cached data</span>
              <button
                onClick={refreshTokens}
                className="ml-4 px-2 py-1 bg-yellow-500/20 rounded text-xs hover:bg-yellow-500/30 transition-colors"
              >
                Retry
              </button>
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
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        onTokenSearchSelect={handleTokenSearchSelect}
                      />
                      
                      {/* Jupiter Filter Controls */}
                      <div className="mt-4 flex flex-wrap gap-4 items-center p-3 bg-dark-300/30 border border-emerald-500/30 rounded-lg">
                        <span className="text-sm font-medium text-emerald-400 font-mono">JUPITER.FILTERS:</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={jupiterFilters.strictOnly}
                            onChange={(e) => setJupiterFilters({
                              strictOnly: e.target.checked,
                              verifiedOnly: false, // Strict overrides verified
                              showAll: !e.target.checked && !jupiterFilters.verifiedOnly
                            })}
                            className="w-4 h-4 text-emerald-400 bg-dark-300 border-dark-400 rounded focus:ring-emerald-400 focus:ring-2"
                          />
                          <span className="text-sm text-gray-300 font-mono">STRICT.ONLY</span>
                          <span className="text-xs text-gray-500 font-mono">[MAX.QUALITY]</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={jupiterFilters.verifiedOnly && !jupiterFilters.strictOnly}
                            disabled={jupiterFilters.strictOnly}
                            onChange={(e) => setJupiterFilters({
                              strictOnly: false,
                              verifiedOnly: e.target.checked,
                              showAll: !e.target.checked && !jupiterFilters.strictOnly
                            })}
                            className="w-4 h-4 text-emerald-400 bg-dark-300 border-dark-400 rounded focus:ring-emerald-400 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className={`text-sm font-mono ${jupiterFilters.strictOnly ? 'text-gray-500' : 'text-gray-300'}`}>VERIFIED.ONLY</span>
                          <span className="text-xs text-gray-500 font-mono">[CURATED]</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={!jupiterFilters.strictOnly && !jupiterFilters.verifiedOnly}
                            onChange={(e) => setJupiterFilters({
                              strictOnly: false,
                              verifiedOnly: false,
                              showAll: e.target.checked
                            })}
                            className="w-4 h-4 text-emerald-400 bg-dark-300 border-dark-400 rounded focus:ring-emerald-400 focus:ring-2"
                          />
                          <span className="text-sm text-gray-300 font-mono">SHOW.ALL</span>
                          <span className="text-xs text-gray-500 font-mono">[UNFILTERED]</span>
                        </label>
                      </div>
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
