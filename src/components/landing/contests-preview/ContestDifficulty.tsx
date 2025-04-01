/**
 * IMPORTANT: This component was originally named "ContestDifficulty", but has been 
 * completely repurposed to display prize distribution information. The name remains 
 * for backward compatibility only.
 * 
 * This component displays the prize distribution for contests:
 * - 1st place: 69% of prize pool
 * - 2nd place: 20% of prize pool
 * - 3rd place: 11% of prize pool
 * 
 * It visualizes this information in a graphical bar with segments proportional to
 * the percentage allocation, and shows both percentages and actual prize amounts.
 * 
 * A GitHub issue has been created to properly rename this component to "PrizeDistribution"
 * across the entire codebase in a future cleanup.
 */
import React from "react";
import { formatCurrency } from "../../../lib/utils";

interface PrizeDistributionProps {
  prize_pool: string; // Total prize pool
  participant_count: number; // Current number of participants
  max_participants: number; // Maximum participants allowed
  isCancelled?: boolean; // Whether the contest is cancelled
}

// Colors for prize distribution visualization
const prizeColors = {
  first: {
    text: "text-yellow-400",
    bg: "bg-yellow-400/30",
    border: "border-yellow-400/30",
    icon: "🏆",
  },
  second: {
    text: "text-gray-300",
    bg: "bg-gray-300/20",
    border: "border-gray-300/30",
    icon: "🥈",
  },
  third: {
    text: "text-amber-600",
    bg: "bg-amber-600/20",
    border: "border-amber-600/30",
    icon: "🥉",
  },
  cancelled: {
    text: "text-red-400",
    bg: "bg-red-400/20",
    border: "border-red-400/30",
    icon: "⚠️",
  },
};

export const PrizeDistribution: React.FC<PrizeDistributionProps> = ({
  prize_pool,
  participant_count,
  max_participants,
  isCancelled = false,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  // Convert prize pool to a number
  const prizePoolNum = Number(prize_pool);
  
  // Actual prize distribution percentages
  const distribution = {
    first: 0.69, // 69% of prize pool to first place
    second: 0.20, // 20% to second
    third: 0.11, // 11% to third
  };
  
  // Calculate actual prize amounts
  const prizes = {
    first: prizePoolNum * distribution.first,
    second: prizePoolNum * distribution.second,
    third: prizePoolNum * distribution.third,
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10">
      {/* Expandable drawer - redesigned for prize distribution */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${isExpanded ? "max-h-[180px]" : "max-h-0"}
        `}
      >
        <div
          className={`
          bg-dark-300/95 backdrop-blur-md 
          border-t border-l border-r border-dark-200/70
          p-4 transform transition-all duration-300 rounded-t-lg shadow-lg
          ${isExpanded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
        `}
        >
          {isCancelled ? (
            /* Cancelled Contest View */
            <div className="flex items-start">
              <div className={`
                flex items-center justify-center w-9 h-9 flex-shrink-0
                rounded-full bg-dark-200/60 border ${prizeColors.cancelled.border}
                shadow-sm overflow-hidden mr-3
              `}>
                <span className="text-xl leading-none">{prizeColors.cancelled.icon}</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-400 mb-1">Contest Cancelled</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  This contest has been cancelled and is no longer available.
                  All entry fees have been refunded to participants.
                </p>
              </div>
            </div>
          ) : (
            /* Prize Distribution View */
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-9 h-9 
                    rounded-full bg-dark-200/60 border ${prizeColors.first.border}
                    shadow-sm overflow-hidden mr-3
                  `}>
                    <span className="text-xl leading-none">💰</span>
                    
                    {/* Subtle shine effect on the icon */}
                    <div className="absolute inset-0 overflow-hidden opacity-40">
                      <div className="absolute w-10 h-10 bg-gradient-to-r from-transparent via-white/40 to-transparent -rotate-45 -translate-x-10 animate-slow-shine"></div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-bold text-brand-400">
                      Prize Distribution
                    </h4>
                    <div className="flex items-center mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mr-1.5"></div>
                      <p className="text-xs text-gray-400">
                        {participant_count} of {max_participants} players
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs font-medium text-brand-300">Total Prize Pool</div>
                  <div className="text-base font-bold text-brand-400">{formatCurrency(prizePoolNum)}</div>
                </div>
              </div>
              
              {/* Simple Prize Distribution Bar */}
              <div className="flex h-20 bg-dark-200/60 rounded-md overflow-hidden mb-6 mt-3">
                {/* First place section */}
                <div 
                  className="relative bg-yellow-500/20 border-r border-dark-200/80"
                  style={{ width: `${distribution.first * 100}%` }}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-lg mb-0.5">{prizeColors.first.icon}</span>
                    <span className="text-xs font-medium text-yellow-400">{Math.round(distribution.first * 100)}%</span>
                    <span className="text-xs font-bold text-yellow-400">{formatCurrency(prizes.first)}</span>
                  </div>
                </div>
                
                {/* Second place section */}
                <div 
                  className="relative bg-gray-400/15 border-r border-dark-200/80"
                  style={{ width: `${distribution.second * 100}%` }}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-lg mb-0.5">{prizeColors.second.icon}</span>
                    <span className="text-xs font-medium text-gray-300">{Math.round(distribution.second * 100)}%</span>
                    <span className="text-xs font-bold text-gray-300">{formatCurrency(prizes.second)}</span>
                  </div>
                </div>
                
                {/* Third place section */}
                <div 
                  className="relative bg-amber-600/15"
                  style={{ width: `${distribution.third * 100}%` }}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-lg mb-0.5">{prizeColors.third.icon}</span>
                    <span className="text-xs font-medium text-amber-500">{Math.round(distribution.third * 100)}%</span>
                    <span className="text-xs font-bold text-amber-500">{formatCurrency(prizes.third)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab indicator - redesigned for prize info */}
      <div
        onClick={toggleExpand}
        className="relative cursor-pointer group"
      >
        <div className="absolute bottom-0 inset-x-0 h-[1px] bg-dark-200/50"></div>
        
        {/* Small colored indicator dot in the center */}
        {!isCancelled ? (
          <div 
            className="absolute bottom-[14px] left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-400"
            style={{
              boxShadow: "0 0 6px 0 rgba(127, 0, 255, 0.3)"
            }}
          ></div>
        ) : (
          <div 
            className="absolute bottom-[14px] left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-400"
            style={{
              boxShadow: "0 0 6px 0 rgba(239, 68, 68, 0.3)"
            }}
          ></div>
        )}
        
        <div className={`
          flex items-center justify-center h-7
          backdrop-blur-md
          transition-all duration-300 ease-in-out
          bg-dark-300/80 hover:bg-dark-200/50
          border-t border-l border-r rounded-t-md
          ${isExpanded ? 'border-dark-200' : 'border-dark-200/50'}
          ${isExpanded ? 'w-36' : 'w-12'}
          ${isCancelled ? 'opacity-70 hover:opacity-80' : 'hover:border-gray-500/50'}
          mx-auto shadow-sm
        `}>
          <div className="flex items-center space-x-1.5 overflow-hidden px-1">
            {/* Custom arrow icon that's more elegant */}
            <svg 
              className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""} ${isCancelled ? 'text-red-400' : (!isExpanded ? 'text-gray-400' : 'text-brand-400')} group-hover:text-gray-300`}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            
            <div className={`
              flex items-center overflow-hidden whitespace-nowrap
              transition-all duration-300
              ${isExpanded ? "opacity-100 max-w-[100px]" : "opacity-0 max-w-0"}
            `}>
              <span className={`text-xs font-medium ${isCancelled ? 'text-red-400' : 'text-brand-400'}`}>
                {isCancelled ? "Contest Info" : "Prize Details"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Subtle hover animation hint */}
        {!isExpanded && (
          <div 
            className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-16 h-[2px] rounded-full overflow-hidden opacity-0 group-hover:opacity-60 transition-opacity duration-300"
          >
            <div className={`h-full w-full ${isCancelled ? 'bg-red-500/30' : 'bg-brand-500/30'}`}></div>
          </div>
        )}
      </div>
    </div>
  );
};

// IMPORTANT: This alias is only for backward compatibility.
// This component is actually a PrizeDistribution component, not a difficulty indicator.
// The component has been completely repurposed but the name is kept for compatibility.
// A GitHub issue has been created to properly rename this across the codebase.
export const ContestDifficulty = PrizeDistribution;