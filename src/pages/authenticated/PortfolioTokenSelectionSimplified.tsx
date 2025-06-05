import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { SimpleTokenGrid } from "../../components/portfolio-selection/SimpleTokenGrid";
import { PortfolioSummary } from "../../components/portfolio-selection/PortfolioSummary";
import { TokenSearchFixed } from "../../components/common/TokenSearchFixed";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import { Contest, SearchToken } from "../../types/index";
import { useStandardizedTokenData } from "../../hooks/data/useStandardizedTokenData";

/**
 * Simplified Portfolio Token Selection Page
 * - Mobile-first design
 * - Clear selection UI
 * - No conflicting handlers
 * - Simplified state management
 */
export const PortfolioTokenSelectionSimplified: React.FC = () => {
  const { id: contestId } = useParams();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  
  // Token data
  const {
    tokens,
    isLoading: tokenListLoading,
    error: tokensError,
    isConnected: isTokenDataConnected,
    loadMore,
    pagination
  } = useStandardizedTokenData();
  
  // Core state
  const [selectedTokens, setSelectedTokens] = useState<Map<string, number>>(new Map());
  const [contest, setContest] = useState<Contest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch contest details
  useEffect(() => {
    const fetchContest = async () => {
      if (!contestId || contestId === 'undefined') {
        toast.error("Invalid contest ID");
        navigate('/contests');
        return;
      }
      
      try {
        const data = await ddApi.contests.getById(contestId);
        setContest(data);
      } catch (err) {
        console.error("Error fetching contest:", err);
        toast.error("Failed to load contest details");
        navigate('/contests');
      }
    };
    
    fetchContest();
  }, [contestId, navigate]);
  
  // Fetch existing portfolio
  useEffect(() => {
    const fetchExistingPortfolio = async () => {
      if (!contestId || !user?.wallet_address) return;
      
      try {
        const portfolioData = await ddApi.portfolio.get(Number(contestId));
        
        if (portfolioData.tokens?.length > 0) {
          const existingPortfolio = new Map<string, number>(
            portfolioData.tokens.map((token: any) => [
              token.contractAddress,
              token.weight
            ])
          );
          setSelectedTokens(existingPortfolio);
        }
      } catch (error) {
        // User might not have a portfolio yet
        console.log("No existing portfolio found");
      }
    };
    
    fetchExistingPortfolio();
  }, [contestId, user?.wallet_address]);
  
  // Calculate total weight
  const totalWeight = Array.from(selectedTokens.values()).reduce((sum, weight) => sum + weight, 0);
  
  // Validation
  const isValidPortfolio = totalWeight === 100 && selectedTokens.size >= 2;
  const validationMessage = !isValidPortfolio ? (
    totalWeight !== 100 ? `Total weight must equal 100% (currently ${totalWeight}%)` :
    selectedTokens.size < 2 ? "Select at least 2 tokens" : ""
  ) : "";
  
  // Handle token selection
  const handleTokenSelect = useCallback((contractAddress: string, weight: number) => {
    setSelectedTokens(prev => {
      const newMap = new Map(prev);
      if (weight === 0) {
        newMap.delete(contractAddress);
      } else {
        newMap.set(contractAddress, weight);
      }
      return newMap;
    });
  }, []);
  
  // Handle search token selection
  const handleSearchTokenSelect = useCallback((token: SearchToken) => {
    // Check if already selected
    if (selectedTokens.has(token.address)) {
      toast.error(`${token.symbol} is already in your portfolio`);
      return;
    }
    
    // Calculate smart weight
    const remainingWeight = 100 - totalWeight;
    let defaultWeight = Math.min(remainingWeight, 20);
    
    if (remainingWeight === 0) {
      toast.error("Portfolio is full. Remove tokens first.");
      return;
    }
    
    handleTokenSelect(token.address, defaultWeight);
    setSearchQuery(""); // Clear search
    
    toast.success(`Added ${token.symbol} with ${defaultWeight}% weight`);
  }, [selectedTokens, totalWeight, handleTokenSelect]);
  
  // Submit portfolio
  const handleSubmit = async () => {
    if (!isValidPortfolio || !contest || !contestId) return;
    
    setIsSubmitting(true);
    
    try {
      const portfolioData = {
        tokens: Array.from(selectedTokens.entries()).map(([contractAddress, weight]) => ({
          contractAddress,
          weight,
        })),
      };
      
      // Check if free or paid contest
      const isFreeContest = Number(contest.entry_fee) === 0;
      
      if (isFreeContest) {
        await ddApi.contests.enterFreeContestWithPortfolio(contestId, portfolioData);
        toast.success("Successfully entered free contest!");
      } else {
        // For paid contests, redirect to a separate payment flow
        // Store portfolio in session storage for after payment
        sessionStorage.setItem(`portfolio_${contestId}`, JSON.stringify(portfolioData));
        navigate(`/contests/${contestId}/payment`);
        return;
      }
      
      navigate(`/contests/${contestId}`);
    } catch (error: any) {
      const errorMsg = error.message || "Failed to submit portfolio";
      
      if (errorMsg.toLowerCase().includes("already participating")) {
        toast.success("You're already in this contest!");
        navigate(`/contests/${contestId}`);
        return;
      }
      
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Loading state
  if (tokenListLoading && tokens.length === 0) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tokens...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (tokensError && tokens.length === 0) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center">
        <Card className="max-w-md p-6 bg-dark-200/50">
          <h2 className="text-red-400 font-bold mb-2">Error Loading Tokens</h2>
          <p className="text-gray-400 mb-4">{tokensError}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-dark-100">
      {/* Header */}
      <div className="bg-dark-200/50 border-b border-dark-300/50 sticky top-0 z-40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                Build Your Portfolio
              </h1>
              {contest && (
                <p className="text-sm text-gray-400 mt-1">
                  {contest.name}
                </p>
              )}
            </div>
            
            {/* Connection indicator */}
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isTokenDataConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="text-gray-400">
                {tokens.length} tokens
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Token Selection (Left) */}
          <div className="lg:col-span-2">
            <Card className="bg-dark-200/30 backdrop-blur-sm p-4">
              {/* Search */}
              <div className="mb-4">
                <TokenSearchFixed
                  onSelectToken={handleSearchTokenSelect}
                  placeholder="Search tokens..."
                  showPriceData={true}
                />
              </div>
              
              {/* Token Grid */}
              <SimpleTokenGrid
                tokens={tokens}
                selectedTokens={selectedTokens}
                onTokenSelect={handleTokenSelect}
                searchQuery={searchQuery}
              />
              
              {/* Load More */}
              {pagination?.hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={loadMore}
                    variant="secondary"
                    disabled={tokenListLoading}
                  >
                    {tokenListLoading ? "Loading..." : "Load More Tokens"}
                  </Button>
                </div>
              )}
            </Card>
          </div>
          
          {/* Portfolio Summary (Right) */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <Card className="bg-dark-200/30 backdrop-blur-sm p-4">
                <h2 className="text-lg font-bold text-white mb-4">
                  Portfolio Summary
                </h2>
                
                <PortfolioSummary
                  selectedTokens={selectedTokens}
                  tokens={tokens}
                />
                
                {/* Validation Message */}
                {validationMessage && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded">
                    <p className="text-sm text-red-400">{validationMessage}</p>
                  </div>
                )}
                
                {/* Weight Progress */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Total Weight</span>
                    <span className={totalWeight === 100 ? 'text-emerald-400' : 'text-yellow-400'}>
                      {totalWeight}%
                    </span>
                  </div>
                  <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        totalWeight === 100 ? 'bg-emerald-500' : 
                        totalWeight > 100 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(totalWeight, 100)}%` }}
                    />
                  </div>
                </div>
                
                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!isValidPortfolio || isSubmitting}
                  className="w-full mt-6"
                >
                  {isSubmitting ? "Submitting..." : 
                   contest && Number(contest.entry_fee) > 0 ? "Continue to Payment" : 
                   "Submit Portfolio"}
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Submit Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-100 to-transparent">
        <Button
          onClick={handleSubmit}
          disabled={!isValidPortfolio || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? "Submitting..." : 
           contest && Number(contest.entry_fee) > 0 ? "Continue to Payment" : 
           "Submit Portfolio"}
        </Button>
      </div>
    </div>
  );
};