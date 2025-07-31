import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Contest } from "../../types";
import { PortfolioTransactions } from "../../types/transactions";
import { CountdownTimer } from "../ui/CountdownTimer";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ShareContestButton } from "../contest-lobby/ShareContestButton";
import { SilentErrorBoundary } from "../common/ErrorBoundary";
import { getContestImageUrl } from "../../lib/imageUtils";

interface ContestDetailHeaderNewProps {
  contest: Contest;
  displayStatus: "active" | "pending" | "completed" | "cancelled";
  isAuthenticated: boolean;
  hasPortfolio: boolean;
  isParticipating: boolean;
  portfolioTransactions: PortfolioTransactions | null;
  onActionButtonClick: () => void;
  getActionButtonLabel: () => string;
  handleCountdownComplete?: () => void;
  error?: string | null;
}

// Utility function to format contest duration
const formatContestDuration = (startTime: string, endTime: string): string => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end.getTime() - start.getTime();
  
  const minutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
};

export const ContestDetailHeaderNew: React.FC<ContestDetailHeaderNewProps> = ({
  contest,
  displayStatus,
  isAuthenticated,
  hasPortfolio,
  isParticipating,
  portfolioTransactions,
  onActionButtonClick,
  getActionButtonLabel,
  handleCountdownComplete,
  error,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!headerRef.current) return;
    const rect = headerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div>
      {/* Contest Banner with Image */}
      <div 
        ref={headerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative rounded-lg mb-8"
      >
        {/* Contest Image with Parallax Effect */}
        {getContestImageUrl(contest.image_url) && (
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            {/* Loading state */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-dark-300/70 z-10">
                <LoadingSpinner size="lg" />
              </div>
            )}
            
            {/* Background image with parallax */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <motion.div
                style={{
                  width: "100%",
                  height: "100%",
                  transform: isHovering ? 
                    `scale(1.08) translateX(${mousePosition.x * 15}px) translateY(${mousePosition.y * 10}px)` : 
                    "scale(1.02)",
                  transition: "transform 0.3s ease-out"
                }}
              >
                <img
                  src={getContestImageUrl(contest.image_url)}
                  alt={contest.name}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              
              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-dark-200/90 to-dark-200/60" />
            </motion.div>
          </div>
        )}
        
        {/* If no image or image error, show gradient background */}
        {(!getContestImageUrl(contest.image_url) || imageError) && (
          <div className="absolute inset-0 bg-gradient-to-br from-dark-200/80 to-dark-300/80" />
        )}
        
        {/* Banner Content */}
        <div className="relative z-10 p-4 sm:p-6 md:p-8 min-h-[380px] flex flex-col justify-between">
          {/* Status Badge - Top Right */}
          <div className="absolute top-4 right-4">
            {/* Different badge styles based on contest status */}
            {displayStatus === "active" && (
              <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-green-500/30 group">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-brand-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-green-500/30 via-brand-500/30 to-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
                    <span className="relative rounded-full w-2 h-2 bg-green-400"></span>
                  </span>
                  <span className="text-xs font-bold text-green-400 uppercase tracking-wide font-cyber">LIVE</span>
                </div>
              </div>
            )}
            
            {displayStatus === "pending" && (
              <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-blue-500/30 group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-brand-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-blue-500/30 via-brand-500/30 to-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                  <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wide font-cyber">SOON</span>
                </div>
              </div>
            )}
            
            {displayStatus === "completed" && (
              <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-gray-500/30 group">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-500/20 via-brand-500/20 to-gray-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-gray-500/30 via-brand-500/30 to-gray-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide font-cyber">ENDED</span>
                </div>
              </div>
            )}
            
            {displayStatus === "cancelled" && (
              <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-red-500/30 group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-brand-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-red-500/30 via-brand-500/30 to-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                  <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wide font-cyber">CANCELLED</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Contest Header Content - Better Layout */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12 max-w-full h-full">
            {/* Left Section - Title, Description, Timer */}
            <div className="flex-1 flex flex-col justify-between h-full min-h-[300px]">
              {/* Title and Description */}
              <div>
                <h1 className="text-5xl font-bold text-white mb-3 uppercase" style={{
                  textShadow: '2px 2px 0px #000, -2px -2px 0px #000, 2px -2px 0px #000, -2px 2px 0px #000, 0px 2px 0px #000, 2px 0px 0px #000, 0px -2px 0px #000, -2px 0px 0px #000'
                }}>
                  {contest.name}
                </h1>
                <p className="text-gray-200 text-sm" style={{
                  textShadow: '1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000'
                }}>
                  {contest.description}
                </p>
              </div>
              
              <>
              {/* Contest Economics - Unified Equation */}
              <div className="p-3 sm:p-6 mb-3">
                {displayStatus !== "cancelled" && (
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  {/* Entry Fee */}
                  <div className="flex flex-col items-center p-3 border border-purple-500/20 bg-purple-500/10 rounded-lg backdrop-blur-sm">
                    <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide mb-1">Entry</div>
                    {Number(contest.entry_fee) === 0 ? (
                      <div className="text-lg sm:text-2xl font-bold uppercase tracking-wide text-green-400">
                        FREE
                      </div>
                    ) : (
                      <div className="text-lg sm:text-2xl font-bold flex items-center gap-1 sm:gap-2 text-white">
                        <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3 sm:w-5 sm:h-5" />
                        <span>{Number(contest.entry_fee).toFixed(4).replace(/\.?0+$/, '')}</span>
                      </div>
                    )}
                  </div>

                  {/* Multiplication Symbol */}
                  <div className="text-lg sm:text-2xl font-bold text-gray-400/50">×</div>

                  {/* Participants with Progress */}
                  <div className="flex flex-col items-center">
                    <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide mb-1">Players</div>
                    <div className="text-lg sm:text-2xl font-bold text-white whitespace-nowrap">
                      {displayStatus === "pending" && contest.participant_count < contest.max_participants ? (
                        <span>{contest.participant_count}<span className="text-xs sm:text-sm text-gray-500">/{contest.min_participants || 2}-{contest.max_participants}</span></span>
                      ) : (
                        <span>{contest.participant_count}<span className="text-xs sm:text-sm text-gray-500">/{contest.max_participants}</span></span>
                      )}
                    </div>
                    <div className="mt-1 w-16 sm:w-20 h-1.5 bg-dark-400 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-500"
                        style={{
                          width: `${Math.min((contest.participant_count / contest.max_participants) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Only show equals and pool if pool value > 0 */}
                  {(() => {
                    const poolValue = Number(contest.entry_fee) > 0
                      ? Number(contest.entry_fee) * contest.participant_count
                      : Number(contest.total_prize_pool || contest.prize_pool || "0");
                    
                    if (poolValue === 0) return null;
                    
                    return (
                      <>
                        {/* Equals Symbol */}
                        <div className="text-lg sm:text-2xl font-bold text-gray-400/50">=</div>

                        {/* Total Pool */}
                        <div className="flex flex-col items-center min-w-0 flex-shrink-0">
                          <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide mb-1">
                            {displayStatus === "pending" ? "Pool" : "Pool"}
                          </div>
                          <div className="text-lg sm:text-2xl font-bold flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
                            <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3 sm:w-5 sm:h-5 flex-shrink-0" />
                            <span>{poolValue}</span>
                          </div>
                          {Number(contest.entry_fee) > 0 && contest.participant_count < contest.max_participants && displayStatus === "pending" && (
                            <div className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
                              Max: {Number(contest.entry_fee) * contest.max_participants}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}

                  {Number(contest.entry_fee) > 0 && (
                    <div className="flex items-center gap-1 sm:gap-2">
                      {/* Fork visualization */}
                      <svg width="30" height="80" viewBox="0 0 30 80" className="fill-none sm:w-10 sm:h-20">
                        {/* Horizontal line from pool */}
                        <line x1="0" y1="40" x2="9" y2="40" stroke="rgb(156 163 175 / 0.5)" strokeWidth="2"/>
                        
                        {/* Upper fork to winners - more horizontal */}
                        <line x1="9" y1="40" x2="24" y2="28" stroke="rgb(156 163 175 / 0.5)" strokeWidth="2"/>
                        <polygon points="24,24 24,32 30,28" fill="rgb(156 163 175 / 0.5)" transform="rotate(-35 24 28)"/>
                        
                        {/* Lower fork to holders - more horizontal */}
                        <line x1="9" y1="40" x2="24" y2="52" stroke="rgb(156 163 175 / 0.5)" strokeWidth="2"/>
                        <polygon points="24,48 24,56 30,52" fill="rgb(156 163 175 / 0.5)" transform="rotate(35 24 52)"/>
                      </svg>

                      {/* Winners and Holders stacked - properly centered */}
                      <div className="flex flex-col gap-3 sm:gap-6">
                        {/* Winners */}
                        <div className="flex flex-col items-center">
                          <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide mb-1">Payout</div>
                          <div className="text-sm sm:text-xl font-bold text-green-400 flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                            <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{(() => {
                              // Use the higher of current participants or minimum required
                              const effectiveMinParticipants = Math.max(contest.participant_count, contest.min_participants || 2);
                              const minAmount = Number(contest.entry_fee) * effectiveMinParticipants * 0.9;
                              const currentAmount = Number(contest.entry_fee) * contest.participant_count * 0.9;
                              const maxAmount = Number(contest.entry_fee) * contest.max_participants * 0.9;
                              const formatAmount = (amt: number) => {
                                if (amt >= 0.1) return amt.toFixed(2);
                                const threeDecimals = amt.toFixed(3);
                                return threeDecimals.endsWith('0') ? threeDecimals.slice(0, -1) : threeDecimals;
                              };
                              
                              if (contest.participant_count < contest.max_participants && displayStatus === "pending") {
                                return `${formatAmount(minAmount)}-${formatAmount(maxAmount)}`;
                              }
                              return formatAmount(currentAmount);
                            })()}</span>
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-500">90% to winners</div>
                        </div>
                        {/* Holders */}
                        <div className="flex flex-col items-center">
                          <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide mb-1">Airdrop</div>
                          <div className="text-sm sm:text-xl font-bold text-brand-400 flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                            <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{(() => {
                              // Use the higher of current participants or minimum required
                              const effectiveMinParticipants = Math.max(contest.participant_count, contest.min_participants || 2);
                              const minAmount = Number(contest.entry_fee) * effectiveMinParticipants * 0.1;
                              const currentAmount = Number(contest.entry_fee) * contest.participant_count * 0.1;
                              const maxAmount = Number(contest.entry_fee) * contest.max_participants * 0.1;
                              const formatAmount = (amt: number) => {
                                if (amt >= 0.1) return amt.toFixed(2);
                                const threeDecimals = amt.toFixed(3);
                                return threeDecimals.endsWith('0') ? threeDecimals.slice(0, -1) : threeDecimals;
                              };
                              
                              if (contest.participant_count < contest.max_participants && displayStatus === "pending") {
                                return `${formatAmount(minAmount)}-${formatAmount(maxAmount)}`;
                              }
                              return formatAmount(currentAmount);
                            })()}</span>
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">10% to DUEL holders</div>
                          <Link 
                            to="/wallet"
                            className="relative inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-700/50 hover:bg-brand-500/20 hover:border-brand-400/50 border border-transparent rounded-full text-[8px] text-gray-400 hover:text-brand-300 cursor-pointer transition-all duration-200 group mt-1"
                          >
                            <span>What's this?</span>
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-64">
                              Click to learn more about the <strong>Degen Dividends</strong> revenue sharing program for <strong>DUEL</strong> holders
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                            </div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
              
              {/* Timer Section with Share Button */}
              <div className="p-4 w-full">
                <div className="flex items-start justify-between gap-4">
                  <div className="text-left flex-1 min-w-0">
                  {/* Transaction Badges - Show based on contest status and participation */}
                  {isAuthenticated && hasPortfolio && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {/* Entry Badge - Show for all statuses if user participated */}
                      {portfolioTransactions?.entry ? (
                        <a 
                          href={`https://solscan.io/tx/${portfolioTransactions.entry.signature}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-md text-xs font-medium text-blue-300 hover:text-blue-200 transition-all duration-200 backdrop-blur-sm"
                        >
                          <span className="border-b border-dashed border-white inline-flex items-center gap-1">Entered {parseFloat(portfolioTransactions.entry.amount || "0").toFixed(3)}<img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" /></span>
                          <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 20 20" strokeWidth="3">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </a>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/20 border border-gray-500/40 rounded-md text-xs font-medium text-gray-400 backdrop-blur-sm">
                          Entered
                          <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3 opacity-50" />
                        </div>
                      )}
                      
                      {/* Payout Badge - Only show for completed status */}
                      {displayStatus === "completed" && (
                        portfolioTransactions?.prize ? (
                          <a 
                            href={`https://solscan.io/tx/${portfolioTransactions.prize.signature}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 rounded-md text-xs font-medium text-green-300 hover:text-green-200 transition-all duration-200 backdrop-blur-sm"
                          >
                            <span className="border-b border-dashed border-white inline-flex items-center gap-1">Won {parseFloat(portfolioTransactions.prize.amount || "0").toFixed(3)}<img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" /></span>
                            <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 20 20" strokeWidth="3">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </a>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/20 border border-gray-500/40 rounded-md text-xs font-medium text-gray-400 backdrop-blur-sm">
                            Won
                            <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3 opacity-50" />
                          </div>
                        )
                      )}
                      
                      {/* Refund Badge - Only show for cancelled status */}
                      {displayStatus === "cancelled" && (
                        portfolioTransactions?.refund ? (
                          <a 
                            href={`https://solscan.io/tx/${portfolioTransactions.refund.signature}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-md text-xs font-medium text-red-300 hover:text-red-200 transition-all duration-200 backdrop-blur-sm"
                          >
                            <span className="border-b border-dashed border-white inline-flex items-center gap-1">Refunded {parseFloat(portfolioTransactions.refund.amount || "0").toFixed(3)}<img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" /></span>
                            <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 20 20" strokeWidth="3">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </a>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/20 border border-gray-500/40 rounded-md text-xs font-medium text-gray-400 backdrop-blur-sm">
                            Refunded
                            <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3 opacity-50" />
                          </div>
                        )
                      )}
                    </div>
                  )}
                  
                  {displayStatus === "cancelled" ? (
                    <div className="text-xl font-semibold text-red-400">
                      Contest was cancelled before it started
                    </div>
                  ) : displayStatus === "completed" ? (
                    <div>
                      <div className="text-xl font-semibold text-gray-300 mb-1">
                        {(() => {
                          const now = new Date();
                          const endTime = new Date(contest.end_time);
                          const diffMs = now.getTime() - endTime.getTime();
                          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                          
                          if (days > 0) return `Ended ${days} day${days > 1 ? 's' : ''} ago`;
                          if (hours > 0) return `Ended ${hours} hour${hours > 1 ? 's' : ''} ago`;
                          return 'Ended recently';
                        })()}
                      </div>
                      <div className="text-sm text-gray-500 whitespace-nowrap">
                        {(() => {
                          const startTime = new Date(contest.start_time);
                          const endTime = new Date(contest.end_time);
                          const startDate = startTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                          const endDate = endTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                          const startTimeStr = startTime.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'});
                          const endTimeStr = endTime.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'});
                          
                          const durationText = `• ${formatContestDuration(contest.start_time, contest.end_time)}`;
                          
                          if (startDate === endDate) {
                            return (
                              <>
                                {startDate}
                                <span style={{marginLeft: '16px'}}>{startTimeStr} - {endTimeStr}</span>
                                <span style={{marginLeft: '8px'}}>{durationText}</span>
                              </>
                            );
                          } else {
                            return `${startDate} ${startTimeStr} - ${endDate} ${endTimeStr} ${durationText}`;
                          }
                        })()}
                      </div>
                    </div>
                  ) : displayStatus === "pending" ? (
                    <div>
                      <div className="text-2xl font-bold text-gray-100 mb-1">
                        <CountdownTimer
                          targetDate={contest.start_time}
                          onComplete={handleCountdownComplete}
                          showSeconds={false}
                        />
                      </div>
                      <div className="text-sm text-gray-500 whitespace-nowrap">
                        Opens {new Date(contest.start_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date(contest.start_time).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})} • {formatContestDuration(contest.start_time, contest.end_time)}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl font-bold text-gray-100 mb-1">
                        <CountdownTimer
                          targetDate={contest.end_time}
                          onComplete={handleCountdownComplete}
                          showSeconds={false}
                        />
                      </div>
                      <div className="text-sm text-gray-500">
                        Started {new Date(contest.start_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date(contest.start_time).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                      </div>
                    </div>
                  )}
                  </div>
                  
                  {/* Share Contest Button */}
                  <div className="flex-shrink-0">
                    {contest && (
                      <SilentErrorBoundary>
                        <ShareContestButton
                          contestId={contest.id.toString()}
                          contestName={contest.name}
                          prizePool={contest.total_prize_pool || contest.prize_pool || "0"}
                        />
                      </SilentErrorBoundary>
                    )}
                  </div>
                </div>
              </div>
              </>
            </div>
            
            {/* Right Section - Error message only */}
            <div className="flex flex-col items-start lg:items-end gap-3">
              {/* Error message if any */}
              {error && (
                <div className="text-sm text-red-400 text-center animate-glitch bg-dark-100/90 rounded-lg py-2 px-3 border border-red-500/30 backdrop-blur-sm max-w-xs">
                  {error}
                </div>
              )}
            </div>
          </div>
          
          {/* Cancellation Overlay */}
          {displayStatus === "cancelled" && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center z-10"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative bg-red-900/30 border-2 border-red-500/40 rounded py-2 px-4 backdrop-blur-sm shadow-lg max-w-[95%]">
                <div className="flex flex-col items-center gap-1 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <motion.svg 
                      className="w-4 h-4 text-red-400" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </motion.svg>
                    <span className="text-sm font-bold text-red-400 uppercase">Contest Cancelled</span>
                  </div>
                  <motion.div 
                    className="text-xs text-red-300 italic"
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  >
                    <span className="font-semibold mr-1 uppercase">REASON:</span>
                    {contest.cancellation_reason || "Unexpected issues with the contest"}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Edge-to-Edge Action Button */}
          <button
            onClick={onActionButtonClick}
            disabled={displayStatus === "cancelled"}
            className={`absolute bottom-0 left-0 right-0 h-12 font-medium transition-all text-center relative overflow-hidden ${
              displayStatus === "cancelled"
                ? "bg-dark-400 text-gray-500 cursor-not-allowed"
                : displayStatus === "active"
                ? "bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 hover:from-green-500 hover:via-green-400 hover:to-emerald-400 text-white font-bold shadow-lg shadow-green-500/25 border-t-2 border-green-400/50"
                : displayStatus === "completed"
                ? "bg-gradient-to-r from-blue-800 via-blue-600 to-indigo-600 hover:from-blue-700 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/20 border-t border-blue-400/30"
                : isParticipating
                ? "bg-gradient-to-r from-purple-800 via-purple-600 to-violet-600 hover:from-purple-700 hover:via-purple-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-purple-500/20"
                : "bg-gradient-to-r from-brand-800 via-brand-600 to-indigo-600 hover:from-brand-700 hover:via-brand-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-brand-500/20"
            }`}
            style={displayStatus === "active" ? {
              animation: "subtle-pulse 2s ease-in-out infinite alternate"
            } : {}}
          >
            {displayStatus === "active" && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                <div className="flex items-center justify-center gap-3 relative z-10">
                  <div className="relative">
                    <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                    <div className="absolute inset-0 bg-white rounded-full animate-ping"></div>
                  </div>
                  <span className="text-lg font-bold drop-shadow-lg">
                    {getActionButtonLabel()}
                  </span>
                </div>
              </>
            )}
            {displayStatus !== "active" && (
              <span className="relative z-10">
                {getActionButtonLabel()}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};