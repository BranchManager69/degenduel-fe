import { formatDistanceToNow } from "date-fns";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserPortfolio } from "../../../types/profile";
import { getContestImageUrl } from "../../../lib/imageUtils";
import { motion, AnimatePresence } from "framer-motion";

interface ContestHistoryListProps {
  portfolios: UserPortfolio[];
}

const getStatusBorderColor = (status: string) => {
  switch (status) {
    case "active":
      return "border-green-500";
    case "pending":
      return "border-blue-500";
    case "completed":
      return "border-green-500";
    case "cancelled":
      return "border-red-500";
    default:
      return "border-gray-500";
  }
};

const formatValue = (value: number | string): string => {
  if (typeof value === "string") {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return "0";
    return Math.round(numValue).toLocaleString();
  }
  return Math.round(value).toLocaleString();
};

export const ContestHistoryList: React.FC<ContestHistoryListProps> = ({
  portfolios,
}) => {
  const [expandedContests, setExpandedContests] = useState<Set<number>>(new Set());
  const [displayMode] = useState<'sol' | 'usd'>('sol');
  const [hoveredToken, setHoveredToken] = useState<number | null>(null);

  const toggleExpanded = (contestId: number) => {
    const newExpanded = new Set(expandedContests);
    if (newExpanded.has(contestId)) {
      newExpanded.delete(contestId);
    } else {
      newExpanded.add(contestId);
    }
    setExpandedContests(newExpanded);
  };

  if (portfolios.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-dark-300/20 backdrop-blur-sm relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-gray-400 text-center group-hover:animate-cyber-pulse">
          No contest history yet. Join a contest to get started!
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes scanUpDown {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-30%); }
          60% { transform: translateY(-30%); }
        }
      `}</style>
      <div className="space-y-1">
        {portfolios.map((portfolio) => {
        const isExpanded = expandedContests.has(portfolio.contest_id);
        const hasValue = portfolio.portfolio_value_usd > 0;
        const STARTING_SOL = 100;
        const portfolioReturn = hasValue && portfolio.contest.status === "completed" 
          ? displayMode === 'sol'
            ? ((portfolio.portfolio_value_sol - STARTING_SOL) / STARTING_SOL) * 100
            : ((portfolio.portfolio_value_usd - (STARTING_SOL * portfolio.sol_price_used)) / (STARTING_SOL * portfolio.sol_price_used)) * 100
          : 0;

        return (
          <div key={portfolio.contest_id} className="relative group">
            {/* Main Contest Row */}
            <div
              className={`relative transition-all cursor-pointer border-l-4 ${getStatusBorderColor(portfolio.contest.status)} ${
                portfolio.contest.status === "cancelled" ? "opacity-50" : ""
              } ${
                isExpanded 
                  ? "bg-dark-300/30 shadow-lg z-10 rounded-tl-lg rounded-tr-lg overflow-hidden border-t border-r border-dark-300/20" 
                  : "hover:bg-dark-300/20 overflow-hidden"
              }`}
              style={{
                boxShadow: !isExpanded ? `
                  inset 0 1px 0 0 ${portfolio.contest.status === "completed" || portfolio.contest.status === "active" ? "rgba(34, 197, 94, 0.1)" : 
                    portfolio.contest.status === "cancelled" ? "rgba(239, 68, 68, 0.1)" : 
                    portfolio.contest.status === "pending" ? "rgba(59, 130, 246, 0.1)" : "rgba(107, 114, 128, 0.1)"},
                  inset -1px 0 0 0 ${portfolio.contest.status === "completed" || portfolio.contest.status === "active" ? "rgba(34, 197, 94, 0.1)" : 
                    portfolio.contest.status === "cancelled" ? "rgba(239, 68, 68, 0.1)" : 
                    portfolio.contest.status === "pending" ? "rgba(59, 130, 246, 0.1)" : "rgba(107, 114, 128, 0.1)"},
                  inset 0 -1px 0 0 ${portfolio.contest.status === "completed" || portfolio.contest.status === "active" ? "rgba(34, 197, 94, 0.1)" : 
                    portfolio.contest.status === "cancelled" ? "rgba(239, 68, 68, 0.1)" : 
                    portfolio.contest.status === "pending" ? "rgba(59, 130, 246, 0.1)" : "rgba(107, 114, 128, 0.1)"}
                ` : ''
              }}
              onClick={() => toggleExpanded(portfolio.contest_id)}
            >
              {/* Contest Banner Image */}
              {portfolio.contest.image_url && (
                <div 
                  className={`absolute inset-x-0 z-0 ${isExpanded ? 'rounded-t-lg' : ''}`}
                  style={{
                    top: '-3rem', // Start 3rem above the top
                    height: 'clamp(16rem, 20vw, 24rem)', // Much taller to allow scanning without cropping
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 45%, transparent 70%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 45%, transparent 70%)'
                  }}
                >
                  <img 
                    src={getContestImageUrl(portfolio.contest.image_url) || ""} 
                    alt={portfolio.contest.name}
                    className="w-full h-full object-cover object-top group-hover:scale-110"
                    style={{
                      animation: 'scanUpDown 24s ease-in-out infinite',
                      transition: 'transform 0.7s ease-out'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className={`absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 transition-opacity duration-300 pointer-events-none -z-10 ${
                isExpanded ? "opacity-100 rounded-tl-lg rounded-tr-lg" : "opacity-0 group-hover:opacity-100"
              }`} />
              
              
              <div className={`relative flex items-center justify-between z-20 p-4 ${portfolio.contest.image_url ? 'pt-32' : ''}`}>
                {/* Left side - Contest info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 
                      className="text-gray-200 font-bold group-hover:text-brand-400 transition-colors truncate flex-shrink min-w-0 text-xl md:text-2xl lg:text-3xl xl:text-4xl max-w-[70%]" 
                      style={{
                        textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                      }}
                      title={portfolio.contest.name}>
                      {portfolio.contest.name.length > 24 ? `${portfolio.contest.name.slice(0, 24)}...` : portfolio.contest.name}
                    </h3>
                    {portfolio.final_rank && portfolio.contest.status === "completed" && (
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        portfolio.final_rank === 1 ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30" :
                        portfolio.final_rank === 2 ? "bg-gray-300/20 text-gray-300 border border-gray-300/30" :
                        portfolio.final_rank === 3 ? "bg-orange-400/20 text-orange-400 border border-orange-400/30" :
                        "bg-gray-400/10 text-gray-400 border border-gray-400/20"
                      }`}>
                        #{portfolio.final_rank}{portfolio.contest.participant_count ? ` of ${portfolio.contest.participant_count}` : ''}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm md:text-base lg:text-lg text-gray-400 whitespace-nowrap">
                      {portfolio.contest.status === "cancelled" ? (
                        <span className="text-red-400">
                          {portfolio.contest.cancellation_reason || "Contest cancelled"}
                        </span>
                      ) : (
                        <>
                          {portfolio.contest.status === "pending" ? "Starts" : 
                           portfolio.contest.status === "active" ? "Ends" : "Ended"}{" "}
                          {formatDistanceToNow(
                            new Date(
                              portfolio.contest.status === "pending" ? portfolio.contest.start_time : 
                              portfolio.contest.status === "active" ? portfolio.contest.end_time : 
                              portfolio.contest.end_time
                            ), 
                            { addSuffix: true }
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm md:text-base lg:text-lg text-gray-400">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="text-xs md:text-sm lg:text-base text-gray-500">Entry</span>
                        {parseFloat(portfolio.contest.entry_fee || '0') > 0 ? (
                          portfolio.transactions?.entry ? (
                            <a
                              href={portfolio.transactions.entry.solscan_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-gray-300 hover:text-white underline decoration-dotted hover:decoration-solid transition-colors cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3 md:w-4 md:h-4" />
                              <span>{portfolio.contest.entry_fee}</span>
                              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ) : (
                            <>
                              <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3 md:w-4 md:h-4" />
                              <span>{portfolio.contest.entry_fee}</span>
                            </>
                          )
                        ) : (
                          <span className={portfolio.contest.status === 'cancelled' ? "text-green-400/30" : "text-green-400"}>FREE</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <span className="text-xs md:text-sm lg:text-base text-gray-500">Prize</span>
                        {parseFloat(portfolio.contest.prize_pool || '0') > 0 ? (
                          portfolio.transactions?.prize ? (
                            <a
                              href={portfolio.transactions.prize.solscan_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-gray-300 hover:text-white underline decoration-dotted hover:decoration-solid transition-colors cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3 md:w-4 md:h-4" />
                              <span>{portfolio.contest.prize_pool}</span>
                              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ) : (
                            <>
                              <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3 md:w-4 md:h-4" />
                              <span>{portfolio.contest.prize_pool}</span>
                            </>
                          )
                        ) : (
                          <span className="text-xs md:text-sm lg:text-base">
                            {portfolio.contest.status === 'completed' && portfolio.final_rank && portfolio.final_rank <= 3
                              ? <span className="text-green-400/70">HAD FUN</span>
                              : portfolio.contest.status === 'completed' 
                              ? <span className="text-red-400/70">AT LEAST YOU TRIED</span>
                              : <span className="text-gray-400">N/A</span>}
                          </span>
                        )}
                      </div>
                      
                      {/* Refund amount for cancelled contests */}
                      {portfolio.contest.status === 'cancelled' && portfolio.transactions?.refund && (
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <span className="text-xs md:text-sm lg:text-base text-gray-500">Refund</span>
                          <a
                            href={portfolio.transactions.refund.solscan_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 underline decoration-dotted hover:decoration-solid transition-colors cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                            <span>{portfolio.transactions.refund.amount}</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side - Performance */}
                <div className="text-right flex items-center gap-3">
                  {portfolio.contest.status === "completed" && hasValue ? (
                    <div>
                      <div className={`text-lg font-bold ${portfolioReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {portfolioReturn >= 0 ? "+" : ""}{portfolioReturn.toFixed(1)}%
                      </div>
                      <div className="text-sm font-medium text-gray-300 flex items-center gap-1 justify-end">
                        {displayMode === 'sol' ? (
                          <>
                            <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-4 h-4" />
                            <span>{portfolio.portfolio_value_sol.toFixed(2)}</span>
                          </>
                        ) : (
                          <span>${formatValue(portfolio.portfolio_value_usd)}</span>
                        )}
                      </div>
                    </div>
                  ) : portfolio.contest.status !== "cancelled" ? (
                    <div className="text-gray-400">
                      {portfolio.contest.status === "pending" ? "Not Started" : "In Progress"}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Expanded Portfolio Details */}
            <AnimatePresence>
              {isExpanded && portfolio.portfolio.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className={`relative overflow-hidden`}
                >
                  <div className={`px-4 pb-4 pt-0 bg-dark-300/30 border-l-4 border-b border-r rounded-b-lg ${getStatusBorderColor(portfolio.contest.status)} ${
                    portfolio.contest.status === "cancelled" ? "opacity-50" : ""
                  }`}>
                    <div className="pt-4 space-y-3">
                  
                  {/* Contest Links */}
                  <div className="text-center flex justify-center items-center gap-8 flex-wrap">
                    <div>
                      <Link
                        to={`/contests/${portfolio.contest_id}`}
                        className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Details
                      </Link>
                    </div>
                    
                    {/* Live Contest Link - Only show for active contests */}
                    {portfolio.contest.status === 'active' && (
                      <div>
                        <Link
                          to={`/contests/${portfolio.contest_id}/live`}
                          className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Live
                        </Link>
                      </div>
                    )}

                    {/* Results Link - Only show for completed contests */}
                    {portfolio.contest.status === 'completed' && (
                      <div>
                        <Link
                          to={`/contests/${portfolio.contest_id}/results`}
                          className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Results
                        </Link>
                      </div>
                    )}
                  </div>

                  <h4 className="text-sm font-medium text-gray-300">Portfolio Holdings</h4>
                  
                  {/* Portfolio composition visualization and token list */}
                  <div className={`flex ${portfolio.contest.status === 'cancelled' ? '' : 'gap-4'}`}>
                    {/* Weight visualization bar - only show for non-cancelled contests */}
                    {portfolio.contest.status !== 'cancelled' && (
                      <div className="w-12 relative">
                        <div className="absolute top-0 bottom-0 left-2 w-8 bg-dark-400/50 rounded-full overflow-hidden">
                          {(() => {
                            let cumulativePercent = 0;
                            return portfolio.portfolio
                              .sort((a, b) => {
                                const aChange = parseFloat(a.token.change_24h || '0');
                                const bChange = parseFloat(b.token.change_24h || '0');
                                return bChange - aChange;
                              })
                              .map((holding) => {
                                const currentWeight = displayMode === 'sol' 
                                  ? ((holding.value_sol || 0) / portfolio.portfolio_value_sol) * 100
                                  : (holding.value_usd / portfolio.portfolio_value_usd) * 100;
                                const segmentStart = cumulativePercent;
                                cumulativePercent += currentWeight;
                                
                                return (
                                  <div
                                    key={holding.token_id}
                                    className="absolute left-0 right-0"
                                    style={{
                                      top: `${segmentStart}%`,
                                      height: `${currentWeight}%`,
                                      backgroundColor: holding.token.color || '#666'
                                    }}
                                  />
                                );
                              });
                          })()}
                        </div>
                      </div>
                    )}
                    
                    {/* Token list */}
                    <div className="flex-1 space-y-2">
                      {portfolio.portfolio
                        .sort((a, b) => {
                          const aChange = parseFloat(a.token.change_24h || '0');
                          const bChange = parseFloat(b.token.change_24h || '0');
                          return bChange - aChange; // Sort descending (highest gains first)
                        })
                        .map((holding, index) => {
                          const currentWeight = displayMode === 'sol' 
                            ? ((holding.value_sol || 0) / portfolio.portfolio_value_sol) * 100
                            : (holding.value_usd / portfolio.portfolio_value_usd) * 100;
                          
                          // Calculate cumulative weight up to this token to find segment position
                          const sortedPortfolio = [...portfolio.portfolio].sort((a, b) => {
                            const aChange = parseFloat(a.token.change_24h || '0');
                            const bChange = parseFloat(b.token.change_24h || '0');
                            return bChange - aChange;
                          });
                          
                          let cumulativeWeight = 0;
                          for (let i = 0; i < index; i++) {
                            const weight = displayMode === 'sol'
                              ? ((sortedPortfolio[i].value_sol || 0) / portfolio.portfolio_value_sol) * 100
                              : (sortedPortfolio[i].value_usd / portfolio.portfolio_value_usd) * 100;
                            cumulativeWeight += weight;
                          }
                          const segmentMidpoint = cumulativeWeight + (currentWeight / 2);
                          
                          return (
                      <div key={holding.token_id} className="relative">
                        {/* Connecting line from weight bar to token - only for non-cancelled contests */}
                        {portfolio.contest.status !== 'cancelled' && (
                          <div 
                            className="absolute -left-4 w-4 h-0.5 bg-gray-600"
                            style={{ 
                              backgroundColor: holding.token.color || '#666',
                              top: `${segmentMidpoint}%`,
                              transform: 'translateY(-50%)'
                            }}
                          />
                        )}
                        
                        <div className="bg-dark-300/30 rounded-lg overflow-hidden border border-dark-300/20 relative">
                        {/* Token Image/Icon - Edge to edge with fade - Absolutely positioned */}
                        <Link 
                          to={`/tokens/${holding.token.address}`}
                          className="absolute top-0 bottom-0 transition-all duration-300 z-0"
                          style={{ 
                            left: hoveredToken === holding.token_id ? '0' : '-8px', 
                            width: '88px',
                            transform: hoveredToken === holding.token_id ? 'scale(1.05)' : 'scale(1)'
                          }}
                          onMouseEnter={() => setHoveredToken(holding.token_id)}
                          onMouseLeave={() => setHoveredToken(null)}
                          onClick={(e) => e.stopPropagation()}
                        >
                              <div className="relative h-full w-full">
                                {holding.token.image_url ? (
                                  <img 
                                    src={holding.token.image_url} 
                                    alt={holding.token.symbol}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    style={{ 
                                      WebkitMaskImage: 'linear-gradient(90deg, black 0%, black 50%, transparent 100%)',
                                      maskImage: 'linear-gradient(90deg, black 0%, black 50%, transparent 100%)'
                                    }}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div 
                                    className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm"
                                    style={{ 
                                      backgroundColor: holding.token.color || '#333',
                                      WebkitMaskImage: 'linear-gradient(90deg, black 0%, black 50%, transparent 100%)',
                                      maskImage: 'linear-gradient(90deg, black 0%, black 50%, transparent 100%)'
                                    }}
                                  >
                                    {holding.token.symbol.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </Link>
                        
                        <div className="flex items-center justify-between relative min-h-[60px]">
                          {/* Left: Token info */}
                          <div className="flex items-center gap-3 flex-1 pl-16 py-3 relative z-10 overflow-visible">
                            
                            {/* Token Symbol and Weight */}
                            <div className="flex-1 overflow-visible">
                              <div className="flex items-center gap-2">
                                <div>
                                  <Link 
                                    to={`/tokens/${holding.token.address}`}
                                    className="font-bold text-white text-lg hover:text-brand-400 transition-colors relative z-20 inline-block px-1 truncate max-w-[200px]"
                                    style={{
                                      textShadow: `
                                        1px 1px 0 black, -1px -1px 0 black, 
                                        1px -1px 0 black, -1px 1px 0 black,
                                        2px 0 0 black, -2px 0 0 black,
                                        0 2px 0 black, 0 -2px 0 black,
                                        1px 2px 0 black, -1px 2px 0 black,
                                        2px 1px 0 black, 2px -1px 0 black,
                                        -2px 1px 0 black, -2px -1px 0 black,
                                        1px -2px 0 black, -1px -2px 0 black,
                                        0 0 2px black, 0 0 4px black,
                                        3px 3px 6px rgba(0,0,0,0.8)
                                      `
                                    }}
                                    title={holding.token.name}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {holding.token.name.length > 16 ? `${holding.token.name.slice(0, 16)}...` : holding.token.name}
                                  </Link>
                                  <div className="text-xs text-gray-500 mt-0.5 pl-2 whitespace-nowrap">
                                    {holding.token.address === "So11111111111111111111111111111111111111112" 
                                      ? holding.quantity.toFixed(2)
                                      : Math.floor(holding.quantity).toLocaleString()
                                    } {holding.token.symbol}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right: Value and performance */}
                          <div className="text-right pr-3 py-3 z-10">
                            {hasValue && holding.value_usd > 0 ? (
                              <>
                                <div className="text-right">
                                  {holding.token.change_24h && (
                                    <div className={`text-base font-bold ${
                                      parseFloat(holding.token.change_24h) >= 0 ? "text-green-400" : "text-red-400"
                                    }`}>
                                      {parseFloat(holding.token.change_24h) >= 0 ? "+" : ""}
                                      {parseFloat(holding.token.change_24h).toFixed(1)}%
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 justify-end">
                                    {displayMode === 'sol' ? (
                                      <>
                                        <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-2.5 h-2.5" />
                                        <span>{(holding.value_sol || 0).toFixed(2)}</span>
                                      </>
                                    ) : (
                                      <span>${formatValue(holding.value_usd)}</span>
                                    )}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-500">
                                No value
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Transaction Links */}
                  {portfolio.transactions && (portfolio.transactions.entry || portfolio.transactions.prize || portfolio.transactions.refund) && (
                    <div className="mt-4 space-y-2">
                      <h5 className="text-xs font-medium text-gray-400 uppercase">Transactions</h5>
                      <div className="flex flex-wrap gap-2">
                        {portfolio.transactions.entry && (
                          <a
                            href={portfolio.transactions.entry.solscan_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-dark-400/50 hover:bg-dark-400 rounded text-xs text-gray-300 hover:text-white transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Entry Fee
                          </a>
                        )}
                        {portfolio.transactions.prize && (
                          <a
                            href={portfolio.transactions.prize.solscan_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded text-xs text-green-400 hover:text-green-300 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Prize: {portfolio.transactions.prize.amount} SOL
                          </a>
                        )}
                        {portfolio.transactions.refund && (
                          <a
                            href={portfolio.transactions.refund.solscan_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                            Refund: {portfolio.transactions.refund.amount} SOL
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Spacer when expanded */}
        {isExpanded && <div className="h-4" />}
          </div>
        );
      })}
      </div>
    </>
  );
};