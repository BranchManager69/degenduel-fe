// src/pages/authenticated/MyPortfoliosPage.tsx

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  FaChartPie,
  FaCoins,
  FaDollarSign,
  FaFilter,
  FaSortAmountDown,
  FaSortAmountUp,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import NanoLogo from "../../components/logo/NanoLogo";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
import { SearchInput } from "../../components/ui/SearchInput";
import { Select } from "../../components/ui/Select";
import { useUserContests } from "../../hooks/data/legacy/useUserContests";
import { formatPercentage, formatPortfolioValue, formatSOL, formatUSD } from "../../lib/utils";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import { ContestHistoryList } from "../../components/profile/contest-history/ContestHistoryList";
import { UserPortfolio } from "../../types/profile";

// Updated interfaces to match new API structure
interface TokenHolding {
  contractAddress: string;
  weight: number;
  quantity: number | null;
  valueUSD: number;
  valueSOL: number | null;
  name?: string;
  symbol?: string;
  price?: number;
  priceChange?: number;
  logoUrl?: string;
}

interface PerformanceMetrics {
  initialBalanceUSD: number;
  finalBalanceUSD: number;
  initialBalanceSOL: number | null;
  finalBalanceSOL: number | null;
  pnlUSD: number;
  pnlSOL: number | null;
  pnlPercent: number;
  prizeAmount: string | null;
  roi: string;
  ranking?: number;
}

interface Portfolio {
  contestId: string;
  contestName: string;
  status: "active" | "pending" | "completed" | "cancelled";
  startTime: string;
  endTime: string;
  portfolioValueUSD: number;
  portfolioValueSOL: number | null;
  tokens: TokenHolding[];
  performance?: PerformanceMetrics;
  hasPortfolio: boolean;
}

interface APIResponse {
  portfolios: any[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  sol_price_used: number | null;
  timestamp: string;
}

export const MyPortfoliosPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const { contests, loading: contestsLoading } = useUserContests();

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [preferSOL, setPreferSOL] = useState(true); // Currency display preference
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list'); // Default to list view
  const [apiPortfolios, setApiPortfolios] = useState<UserPortfolio[]>([]); // Store raw API response for list view
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // This check is redundant since we're already inside AuthenticatedRoute
  // But keep a simpler version just in case
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Transform API response to Portfolio interface
  const transformAPIResponse = (apiData: APIResponse): Portfolio[] => {
    return apiData.portfolios
      .filter((p: any) => p.has_portfolio && p.portfolio?.length > 0)
      .map((p: any) => {
        // Map tokens with enhanced data
        const tokensWithInfo: TokenHolding[] = p.portfolio.map((item: any) => ({
          contractAddress: item.token?.address || item.token_id,
          weight: item.weight,
          quantity: item.quantity || null,
          valueUSD: item.value_usd || 0,
          valueSOL: item.value_sol || null,
          name: item.token?.name || "Unknown Token",
          symbol: item.token?.symbol || "???",
          price: parseFloat(item.token?.price || "0"),
          priceChange: parseFloat(item.token?.change_24h || "0"),
          logoUrl: item.token?.image_url || "/images/tokens/default.png",
        }));

        // Build enhanced performance object if available
        let performance: PerformanceMetrics | undefined;
        if (p.contest.status === "completed" && p.performance) {
          performance = {
            initialBalanceUSD: p.performance.initial_balance_usd || parseFloat(p.performance.initial_balance || "0"),
            finalBalanceUSD: p.performance.final_balance_usd || parseFloat(p.performance.final_balance || "0"),
            initialBalanceSOL: p.performance.initial_balance_sol || null,
            finalBalanceSOL: p.performance.final_balance_sol || null,
            pnlUSD: p.performance.pnl_usd || 0,
            pnlSOL: p.performance.pnl_sol || null,
            pnlPercent: p.performance.pnl_percent || parseFloat(p.performance.roi?.replace("%", "") || "0"),
            prizeAmount: p.performance.prize_amount || null,
            roi: p.performance.roi || "0%",
            ranking: p.final_rank || p.rank,
          };
        }

        return {
          contestId: String(p.contest_id),
          contestName: p.contest.name,
          status: p.contest.status as "active" | "pending" | "completed" | "cancelled",
          startTime: p.contest.start_time,
          endTime: p.contest.end_time,
          portfolioValueUSD: p.portfolio_value_usd || parseFloat(p.portfolio_value || "0"),
          portfolioValueSOL: p.portfolio_value_sol || null,
          tokens: tokensWithInfo,
          performance,
          hasPortfolio: p.has_portfolio,
        } as Portfolio;
      });
  };

  // Fetch all portfolios in a single efficient API call
  const fetchPortfolios = useCallback(async () => {
      if (!user?.wallet_address || contestsLoading) return;

      try {
        setLoading(true);

        // Clear any existing retry timeout to prevent race conditions
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }

        // Use the enhanced batch API to get all portfolios in one request
        const response: APIResponse = await ddApi.portfolio.getAllUserPortfolios(
          user.wallet_address,
          {
            limit: 100, // Get up to 100 portfolios at once
            includeTokens: true,
            includePerformance: true, // Include performance for completed contests
          }
        );

        // Store SOL price for reference
        setSolPrice(response.sol_price_used);

        // Store raw API response for list view
        setApiPortfolios(response.portfolios);

        // Transform the backend response to our Portfolio interface for card view
        const validPortfolios = transformAPIResponse(response);

        setPortfolios(validPortfolios);
        setError(null);
        setRetryCount(0); // Reset retry count on success

        // Handle pagination if needed
        if (response.pagination?.has_more) {
          console.info(
            `User has more than ${response.pagination.limit} portfolios. ` +
            `Showing first ${response.pagination.limit}.`
          );
        }
      } catch (err) {
        console.error("Error fetching portfolios:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        
        // Check for 502 errors with better error structure handling
        const is502Error = (
          (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'status' in err.response && err.response.status === 502) ||
          (err && typeof err === 'object' && 'status' in err && err.status === 502) ||
          errorMessage.includes('502') ||
          errorMessage.toLowerCase().includes('bad gateway')
        );
        
        // Auto-retry for 502 errors silently
        if (is502Error) {
          const currentRetryCount = retryCount;
          setRetryCount(prev => prev + 1);
          retryTimeoutRef.current = setTimeout(() => {
            fetchPortfolios();
          }, 5000);
          // Don't set error for 502s - just keep loading
          return;
        } else {
          setError("Failed to load your portfolios");
        }
      } finally {
        // Only set loading false if not retrying a 502
        if (!is502Error) {
          setLoading(false);
        }
      }
    }, [contests, contestsLoading, user?.wallet_address]); // Removed retryCount from dependencies

  useEffect(() => {
    fetchPortfolios();
    
    // Cleanup timeout on unmount
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [fetchPortfolios]);

  // Enhanced filter and sort portfolios
  const filteredAndSortedPortfolios = React.useMemo(() => {
    // First filter by search term and status
    const filtered = portfolios.filter((portfolio) => {
      const matchesSearch =
        searchTerm === "" ||
        portfolio.contestName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        portfolio.tokens.some(
          (t) =>
            t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.symbol?.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "upcoming" && portfolio.status === "pending") ||
        (statusFilter === "active" && portfolio.status === "active") ||
        (statusFilter === "completed" && portfolio.status === "completed") ||
        (statusFilter === "cancelled" && portfolio.status === "cancelled");

      return matchesSearch && matchesStatus;
    });

    // Enhanced sorting with new data
    return filtered.sort((a, b) => {
      if (sortBy === "date") {
        const aDate = new Date(a.startTime).getTime();
        const bDate = new Date(b.startTime).getTime();
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      } else if (sortBy === "performance" && a.performance && b.performance) {
        return sortDirection === "asc"
          ? a.performance.pnlPercent - b.performance.pnlPercent
          : b.performance.pnlPercent - a.performance.pnlPercent;
      } else if (sortBy === "value") {
        // Sort by portfolio value (use SOL if available and preferred, otherwise USD)
        const aValue = (preferSOL && a.portfolioValueSOL) ? a.portfolioValueSOL : a.portfolioValueUSD;
        const bValue = (preferSOL && b.portfolioValueSOL) ? b.portfolioValueSOL : b.portfolioValueUSD;
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      } else if (sortBy === "name") {
        return sortDirection === "asc"
          ? a.contestName.localeCompare(b.contestName)
          : b.contestName.localeCompare(a.contestName);
      } else if (sortBy === "tokens") {
        return sortDirection === "asc"
          ? a.tokens.length - b.tokens.length
          : b.tokens.length - a.tokens.length;
      }
      return 0;
    });
  }, [portfolios, searchTerm, sortBy, sortDirection, statusFilter, preferSOL]);

  // Helper function to get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "pending":
      case "upcoming":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "completed":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen">
      <div className="relative z-10 py-8 container mx-auto px-4">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-6">
                <div className="scale-150">
                  <NanoLogo />
                </div>
                <span className="flex items-center gap-2">
                  <FaChartPie className="text-brand-400" /> My Portfolios
                </span>
              </h1>
              <p className="text-gray-400 mt-2">
                Manage and track all your contest portfolios
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-dark-200/50 rounded-lg p-2">
                <Button
                  variant={viewMode === 'list' ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 ${
                    viewMode === 'list' 
                      ? "bg-brand-500 text-white" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <FaList className="h-4 w-4" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'cards' ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-2 ${
                    viewMode === 'cards' 
                      ? "bg-brand-500 text-white" 
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <FaThLarge className="h-4 w-4" />
                  Cards
                </Button>
              </div>

              {/* Currency Toggle - Only show in card view */}
              {viewMode === 'cards' && (
                <div className="flex items-center gap-2 bg-dark-200/50 rounded-lg p-2">
                  <Button
                    variant={preferSOL ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setPreferSOL(true)}
                    className={`flex items-center gap-2 ${
                      preferSOL 
                        ? "bg-brand-500 text-white" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <FaCoins className="h-4 w-4" />
                    SOL
                  </Button>
                  <Button
                    variant={!preferSOL ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setPreferSOL(false)}
                    className={`flex items-center gap-2 ${
                      !preferSOL 
                        ? "bg-brand-500 text-white" 
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <FaDollarSign className="h-4 w-4" />
                    USD
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* SOL Price Display */}
          {solPrice && (
            <div className="mt-2 text-sm text-gray-500">
              SOL Price: {formatUSD(solPrice)}
            </div>
          )}
        </header>

        {/* Enhanced Filters & Search - Only show search in list view */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <SearchInput
              placeholder="Search portfolios by contest or token..."
              value={searchTerm}
              onChange={setSearchTerm}
              className="flex-grow"
            />
          </div>

          {/* Only show filters and sort in card view */}
          {viewMode === 'cards' && (
            <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "active", label: "Active" },
                  { value: "upcoming", label: "Upcoming" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" }
                ]}
                className="w-40"
              />
            </div>

            <div className="flex items-center gap-2">
              <FaSortAmountDown className="text-gray-400" />
              <Select
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: "date", label: "Date" },
                  { value: "name", label: "Contest Name" },
                  { value: "value", label: "Portfolio Value" },
                  { value: "tokens", label: "Number of Tokens" },
                  { value: "performance", label: "Performance" }
                ]}
                className="w-40"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
              }
              className="bg-dark-200/80 border-dark-300 text-gray-200 hover:bg-dark-300/80"
            >
              {sortDirection === "asc" ? (
                <FaSortAmountUp className="h-4 w-4" />
              ) : (
                <FaSortAmountDown className="h-4 w-4" />
              )}
            </Button>
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card
                key={i}
                className="bg-dark-200/80 backdrop-blur-sm border-dark-300"
              >
                <CardHeader>
                  <div className="h-6 w-3/4 bg-dark-300 mb-2 animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-dark-300 animate-pulse rounded" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-full bg-dark-300 animate-pulse" />
                      <div className="space-y-1 flex-1">
                        <div className="h-4 w-1/3 bg-dark-300 animate-pulse rounded" />
                        <div className="h-3 w-1/2 bg-dark-300 animate-pulse rounded" />
                      </div>
                      <div className="h-6 w-16 bg-dark-300 animate-pulse rounded" />
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <div className="h-10 w-full bg-dark-300 animate-pulse rounded" />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <Card className="bg-red-900/20 border-red-900/50 mb-8">
            <CardContent className="p-6">
              <p className="text-red-400">{error}</p>
              <Button
                onClick={() => {
                  setError(null);
                  setRetryCount(0);
                  fetchPortfolios();
                }}
                variant="outline"
                className="mt-4 bg-red-500/20 border-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && portfolios.length === 0 && (
          <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300 mb-8">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center mb-4">
                <FaChartPie className="text-3xl text-brand-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-200 mb-2">
                No Portfolios Found
              </h3>
              <p className="text-gray-400 mb-6 max-w-md">
                You haven't created any portfolios yet. Join a contest and
                create your first portfolio.
              </p>
              <Button
                onClick={() => navigate("/contests")}
                className="bg-brand-500 hover:bg-brand-600"
              >
                Browse Contests
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No results after filtering */}
        {!loading &&
          !error &&
          portfolios.length > 0 &&
          filteredAndSortedPortfolios.length === 0 && (
            <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300 mb-8">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-medium text-gray-200 mb-2">
                  No Matching Portfolios
                </h3>
                <p className="text-gray-400">
                  Try adjusting your filters or search term.
                </p>
              </CardContent>
            </Card>
          )}

        {/* Portfolio Display - List or Card View */}
        {!loading && viewMode === 'list' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Contest History List */}
            <div className="lg:col-span-2">
              {apiPortfolios.length > 0 ? (
                <div className="bg-dark-200/80 backdrop-blur-sm border border-dark-300 rounded-lg">
                  <ContestHistoryList 
                    portfolios={apiPortfolios.filter(p => {
                      // Apply the same filters as card view
                      const matchesSearch = searchTerm === "" ||
                        p.contest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.portfolio.some(t => 
                          t.token?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.token?.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
                        );
                      
                      const matchesStatus = statusFilter === "all" || 
                        (statusFilter === "upcoming" && p.contest.status === "pending") ||
                        (statusFilter === "active" && p.contest.status === "active") ||
                        (statusFilter === "completed" && p.contest.status === "completed") ||
                        (statusFilter === "cancelled" && p.contest.status === "cancelled");
                      
                      return matchesSearch && matchesStatus;
                    })} 
                  />
                </div>
              ) : (
                <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-lg font-medium text-gray-200 mb-2">
                      No Matching Portfolios
                    </h3>
                    <p className="text-gray-400">
                      Try adjusting your filters or search term.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Portfolio Stats and Info */}
            <div className="space-y-6">
              {/* Portfolio Summary Stats */}
              <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white">Portfolio Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-brand-400">{apiPortfolios.length}</div>
                      <div className="text-xs text-gray-400">Total Contests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {apiPortfolios.filter(p => p.contest.status === 'completed' && p.final_rank && p.final_rank <= 3).length}
                      </div>
                      <div className="text-xs text-gray-400">Wins</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {apiPortfolios.filter(p => p.contest.status === 'active').length}
                      </div>
                      <div className="text-xs text-gray-400">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {apiPortfolios.filter(p => p.contest.status === 'pending').length}
                      </div>
                      <div className="text-xs text-gray-400">Upcoming</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => navigate("/contests")}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white"
                  >
                    Browse New Contests
                  </Button>
                  <Button
                    onClick={() => setViewMode('cards')}
                    variant="outline"
                    className="w-full bg-dark-300 border-dark-400 text-gray-300 hover:bg-dark-400"
                  >
                    Switch to Card View
                  </Button>
                </CardContent>
              </Card>

              {/* Contest Status Legend */}
              <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white">Status Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-300">Pending - Contest hasn't started</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-300">Active - Contest is live</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-gray-300">Completed - Contest finished</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-gray-300">Cancelled - Contest cancelled</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Enhanced Portfolio cards grid */}
        {!loading && filteredAndSortedPortfolios.length > 0 && viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedPortfolios.map((portfolio) => (
              <Card
                key={portfolio.contestId}
                className="group bg-dark-200/80 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-all duration-300 relative overflow-hidden"
              >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardHeader className="relative">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl font-bold text-gray-100 group-hover:text-brand-300 transition-colors truncate">
                      {portfolio.contestName}
                    </CardTitle>
                    <Badge
                      className={`${getStatusStyle(portfolio.status)} capitalize`}
                    >
                      {portfolio.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-400">
                    {formatDate(portfolio.startTime)} -{" "}
                    {formatDate(portfolio.endTime)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 relative">
                  {/* Enhanced Portfolio performance summary for completed contests */}
                  {portfolio.status === "completed" && portfolio.performance && (
                    <div
                      className={`p-4 rounded-lg ${
                        portfolio.performance.pnlPercent >= 0
                          ? "bg-green-500/10 border border-green-500/20"
                          : "bg-red-500/10 border border-red-500/20"
                      }`}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">
                            Final Value
                          </p>
                          <p className="text-lg font-bold text-white">
                            {formatPortfolioValue(
                              portfolio.performance.finalBalanceUSD,
                              portfolio.performance.finalBalanceSOL,
                              preferSOL
                            )}
                          </p>
                          {/* Show both currencies if available */}
                          {portfolio.performance.finalBalanceSOL && (
                            <p className="text-xs text-gray-500">
                              {preferSOL 
                                ? formatUSD(portfolio.performance.finalBalanceUSD)
                                : formatSOL(portfolio.performance.finalBalanceSOL)
                              }
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">
                            Performance
                          </p>
                          <p
                            className={`text-lg font-bold ${
                              portfolio.performance.pnlPercent >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {formatPercentage(portfolio.performance.pnlPercent)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatPortfolioValue(
                              portfolio.performance.pnlUSD,
                              portfolio.performance.pnlSOL,
                              preferSOL
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {/* Prize and Ranking */}
                      <div className="mt-3 flex justify-between items-center">
                        {portfolio.performance.ranking && (
                          <span className="text-sm text-gray-400">
                            Rank: <span className="text-white font-bold">#{portfolio.performance.ranking}</span>
                          </span>
                        )}
                        {portfolio.performance.prizeAmount && parseFloat(portfolio.performance.prizeAmount) > 0 && (
                          <span className="text-sm text-yellow-400 font-medium">
                            🏆 Prize: {formatSOL(portfolio.performance.prizeAmount)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Current Portfolio Value for Active/Pending contests */}
                  {(portfolio.status === "active" || portfolio.status === "pending") && (
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="text-center">
                        <p className="text-sm text-gray-400 mb-1">Portfolio Value</p>
                        <p className="text-xl font-bold text-white">
                          {formatPortfolioValue(
                            portfolio.portfolioValueUSD,
                            portfolio.portfolioValueSOL,
                            preferSOL
                          )}
                        </p>
                        {portfolio.portfolioValueSOL && (
                          <p className="text-xs text-gray-500">
                            {preferSOL 
                              ? formatUSD(portfolio.portfolioValueUSD)
                              : formatSOL(portfolio.portfolioValueSOL)
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Token list */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">
                      Portfolio Allocation ({portfolio.tokens.length} tokens)
                    </h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                      {portfolio.tokens.map((token, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-8 h-8 relative rounded-full bg-dark-300 overflow-hidden flex-shrink-0">
                            <img
                              src={token.logoUrl || "/images/tokens/default.png"}
                              alt={token.symbol}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/images/tokens/default.png";
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-300 truncate">
                              {token.symbol}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {token.name}
                            </p>
                            {/* Show quantity if available */}
                            {token.quantity && (
                              <p className="text-xs text-gray-500">
                                {token.quantity.toLocaleString()} tokens
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-200">
                              {token.weight}%
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatPortfolioValue(token.valueUSD, token.valueSOL, preferSOL)}
                            </p>
                            {token.priceChange !== undefined && (
                              <p
                                className={`text-xs ${
                                  token.priceChange >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {formatPercentage(token.priceChange)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="relative">
                  <Button
                    onClick={() => {
                      // Navigate based on contest status
                      if (portfolio.status === "completed") {
                        navigate(`/contests/${portfolio.contestId}/results`);
                      } else if (portfolio.status === "active") {
                        navigate(`/contests/${portfolio.contestId}/live`);
                      } else {
                        navigate(
                          `/contests/${portfolio.contestId}/select-tokens`,
                        );
                      }
                    }}
                    className="w-full bg-dark-300 hover:bg-dark-400 group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-all"
                  >
                    {portfolio.status === "completed"
                      ? "View Results"
                      : portfolio.status === "active"
                        ? "View Live Contest"
                        : "Edit Portfolio"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination would go here if needed */}
      </div>
    </div>
  );
};

export default MyPortfoliosPage;
