// src/pages/authenticated/MyPortfoliosPage.tsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChartPie, FaSearch, FaSortAmountDown, FaSortAmountUp, FaFilter } from "react-icons/fa";
import { BackgroundEffects } from "../../components/animated-background/BackgroundEffects";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { SelectItem, Select, SelectContent, SelectTrigger, SelectValue } from "../../components/ui/SelectAdvanced";
import { useUserContests } from "../../hooks/useUserContests";
import { useStore } from "../../store/useStore";
import { ddApi } from "../../services/dd-api";
import { formatCurrency } from "../../lib/utils";

// Interface for portfolio data
interface Portfolio {
  contestId: string;
  contestName: string;
  status: "active" | "upcoming" | "completed" | "cancelled";
  startTime: string;
  endTime: string;
  tokens: {
    contractAddress: string;
    weight: number;
    name?: string;
    symbol?: string;
    price?: number;
    priceChange?: number;
    logoUrl?: string;
  }[];
  performance?: {
    value: number;
    change: number;
    ranking?: number;
  };
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
  
  // This check is redundant since we're already inside AuthenticatedRoute
  // But keep a simpler version just in case
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Fetch portfolios for each contest the user is participating in
  useEffect(() => {
    const fetchPortfolios = async () => {
      if (!user?.wallet_address || contestsLoading) return;
      
      try {
        setLoading(true);
        
        const portfolioPromises = contests.map(async (contest) => {
          try {
            // Get the portfolio for this contest
            const portfolioResponse = await ddApi.portfolio.get(Number(contest.contestId));
            
            // Get token metadata for display
            const allTokens = await ddApi.tokens.getAll();
            
            // Map the tokens with additional info where available
            const tokensWithInfo = portfolioResponse.tokens.map(token => {
              const tokenInfo = allTokens.find(t => 
                t.contractAddress?.toLowerCase() === token.contractAddress?.toLowerCase()
              );
              
              return {
                contractAddress: token.contractAddress,
                weight: token.weight,
                name: tokenInfo?.name || "Unknown Token",
                symbol: tokenInfo?.symbol || "???",
                price: tokenInfo?.price ? parseFloat(tokenInfo.price) : 0,
                priceChange: tokenInfo?.change24h ? parseFloat(tokenInfo.change24h) : 0,
                logoUrl: tokenInfo?.images?.imageUrl || "/images/tokens/default.png"
              };
            });
            
            // For completed contests, we could fetch performance data
            let performance;
            if (contest.status === "completed") {
              try {
                // This is a placeholder - you'd need to implement this API endpoint
                const performanceData = await ddApi.contests.getPerformanceDetails(
                  contest.contestId, 
                  user.wallet_address
                ).catch(() => null);
                
                if (performanceData) {
                  performance = {
                    value: performanceData.value || 0,
                    change: performanceData.change || 0,
                    ranking: performanceData.ranking
                  };
                }
              } catch (err) {
                console.warn(`Could not fetch performance for contest ${contest.contestId}:`, err);
                // Non-critical error, continue without performance data
              }
            }
            
            return {
              contestId: contest.contestId,
              contestName: contest.name,
              status: contest.status,
              startTime: contest.startTime,
              endTime: contest.endTime,
              tokens: tokensWithInfo,
              performance
            } as Portfolio;
          } catch (err) {
            console.warn(`Could not fetch portfolio for contest ${contest.contestId}:`, err);
            // Return null for contests without portfolios - likely contests where the user registered but didn't create a portfolio
            return null;
          }
        });
        
        const results = await Promise.all(portfolioPromises);
        const validPortfolios = results.filter(p => p !== null && p.tokens.length > 0) as Portfolio[];
        setPortfolios(validPortfolios);
        setError(null);
      } catch (err) {
        console.error("Error fetching portfolios:", err);
        setError("Failed to load your portfolios");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortfolios();
  }, [contests, contestsLoading, user?.wallet_address]);
  
  // Filter and sort portfolios
  const filteredAndSortedPortfolios = React.useMemo(() => {
    // First filter by search term and status
    let filtered = portfolios.filter(portfolio => {
      const matchesSearch = searchTerm === "" || 
        portfolio.contestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        portfolio.tokens.some(t => 
          t.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          t.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
      const matchesStatus = statusFilter === "all" || portfolio.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    // Then sort
    return filtered.sort((a, b) => {
      if (sortBy === "date") {
        const aDate = new Date(a.startTime).getTime();
        const bDate = new Date(b.startTime).getTime();
        return sortDirection === "asc" ? aDate - bDate : bDate - aDate;
      } else if (sortBy === "performance" && a.performance && b.performance) {
        return sortDirection === "asc" 
          ? a.performance.change - b.performance.change
          : b.performance.change - a.performance.change;
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
  }, [portfolios, searchTerm, sortBy, sortDirection, statusFilter]);
  
  // Helper function to get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20";
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
      year: "numeric"
    });
  };

  return (
    <div className="min-h-screen">
      <BackgroundEffects />
      
      <div className="relative z-10 py-8 container mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <FaChartPie className="text-brand-400" /> My Portfolios
          </h1>
          <p className="text-gray-400 mt-2">
            Manage and track all your contest portfolios
          </p>
        </header>
        
        {/* Filters & Search */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <Input
              type="search"
              placeholder="Search portfolios by contest or token..."
              className="pl-10 bg-dark-200/80 border-dark-300 text-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400" />
              <div className="relative w-40">
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
                  <SelectTrigger className="bg-dark-200/80 border-dark-300 text-gray-200 w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-100 border-dark-300 text-gray-200">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <FaSortAmountDown className="text-gray-400" />
              <div className="relative w-40">
                <Select value={sortBy} onValueChange={(val) => setSortBy(val)}>
                  <SelectTrigger className="bg-dark-200/80 border-dark-300 text-gray-200 w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-dark-100 border-dark-300 text-gray-200">
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Contest Name</SelectItem>
                    <SelectItem value="tokens">Number of Tokens</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
              className="bg-dark-200/80 border-dark-300 text-gray-200 hover:bg-dark-300/80"
            >
              {sortDirection === "asc" ? (
                <FaSortAmountUp className="h-4 w-4" />
              ) : (
                <FaSortAmountDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-dark-200/80 backdrop-blur-sm border-dark-300">
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
                onClick={() => window.location.reload()}
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
              <h3 className="text-xl font-bold text-gray-200 mb-2">No Portfolios Found</h3>
              <p className="text-gray-400 mb-6 max-w-md">
                You haven't created any portfolios yet. Join a contest and create your first portfolio.
              </p>
              <Button onClick={() => navigate('/contests')} className="bg-brand-500 hover:bg-brand-600">
                Browse Contests
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* No results after filtering */}
        {!loading && !error && portfolios.length > 0 && filteredAndSortedPortfolios.length === 0 && (
          <Card className="bg-dark-200/80 backdrop-blur-sm border-dark-300 mb-8">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium text-gray-200 mb-2">No Matching Portfolios</h3>
              <p className="text-gray-400">
                Try adjusting your filters or search term.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Portfolio cards grid */}
        {!loading && filteredAndSortedPortfolios.length > 0 && (
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
                    {formatDate(portfolio.startTime)} - {formatDate(portfolio.endTime)}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4 relative">
                  {/* Portfolio performance summary for completed contests */}
                  {portfolio.status === 'completed' && portfolio.performance && (
                    <div className={`p-4 rounded-lg ${
                      portfolio.performance.change >= 0 
                        ? 'bg-green-500/10 border border-green-500/20' 
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">
                            Final Value
                          </p>
                          <p className="text-lg font-bold text-white">
                            {formatCurrency(portfolio.performance.value)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-1">
                            Performance
                          </p>
                          <p className={`text-lg font-bold ${
                            portfolio.performance.change >= 0 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}>
                            {portfolio.performance.change >= 0 ? '+' : ''}
                            {portfolio.performance.change.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      {portfolio.performance.ranking && (
                        <div className="mt-2 text-center">
                          <span className="text-sm text-gray-400">
                            Final Ranking: 
                          </span>
                          <span className="text-white font-bold ml-1">
                            #{portfolio.performance.ranking}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Token list */}
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
                                (e.target as HTMLImageElement).src = "/images/tokens/default.png";
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-300 truncate">{token.symbol}</p>
                            <p className="text-xs text-gray-400 truncate">{token.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-200">{token.weight}%</p>
                            {token.priceChange !== undefined && (
                              <p className={`text-xs ${
                                token.priceChange >= 0 
                                  ? 'text-green-400' 
                                  : 'text-red-400'
                              }`}>
                                {token.priceChange >= 0 ? '+' : ''}
                                {token.priceChange.toFixed(2)}%
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
                      if (portfolio.status === 'completed') {
                        navigate(`/contests/${portfolio.contestId}/results`);
                      } else if (portfolio.status === 'active') {
                        navigate(`/contests/${portfolio.contestId}/lobby`);
                      } else {
                        navigate(`/contests/${portfolio.contestId}/select-tokens`);
                      }
                    }}
                    className="w-full bg-dark-300 hover:bg-dark-400 group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-all"
                  >
                    {portfolio.status === 'completed' ? 'View Results' : 
                     portfolio.status === 'active' ? 'View Live Contest' : 
                     'Edit Portfolio'}
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