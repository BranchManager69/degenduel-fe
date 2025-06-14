import React from "react";
import { formatCurrency } from "../../lib/utils";

interface PrizeStructureProps {
  prizePool: number;
  entryFee?: number;
  maxParticipants?: number;
  currentParticipants?: number;
  platformFeePercentage?: number;
  contestType?: string;
}

export const PrizeStructure: React.FC<PrizeStructureProps> = ({
  prizePool,
  entryFee = 0,
  maxParticipants = 0,
  currentParticipants = 0,
  contestType = ""
}) => {
  // Platform fee is 10% for regular contests, 0% for crown contests
  const PLATFORM_FEE = contestType === "CROWN" ? 0 : 10;
  
  // Calculate totals
  const totalCollected = currentParticipants > 0 && entryFee > 0 
    ? entryFee * currentParticipants 
    : prizePool;
  const platformFee = (totalCollected * PLATFORM_FEE) / 100;
  const winnerPool = totalCollected - platformFee;
  
  // Prize distribution percentages (of winner pool)
  const prizes = [
    { place: "1st", percent: 69, amount: winnerPool * 0.69 },
    { place: "2nd", percent: 20, amount: winnerPool * 0.20 },
    { place: "3rd", percent: 11, amount: winnerPool * 0.11 }
  ];

  // Max potential if contest fills up
  const maxPotential = maxParticipants > 0 && entryFee > 0 
    ? entryFee * maxParticipants 
    : totalCollected;
  const maxPlatformFee = (maxPotential * PLATFORM_FEE) / 100;
  const maxWinnerPool = maxPotential - maxPlatformFee;

  return (
    <div className="space-y-6 bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Prize Structure</h3>
        
        {/* Simple badge showing pool size */}
        <div className="px-3 py-1 rounded-full bg-brand-400/20 border border-brand-400/30">
          <span className="text-sm font-medium text-brand-400">
            {formatCurrency(winnerPool)} Pool
          </span>
        </div>
      </div>

      {/* Visual Prize Distribution - Simple bars */}
      <div className="space-y-3">
        {prizes.map((prize) => (
          <div key={prize.place} className="relative">
            {/* Prize info */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${
                  prize.place === "1st" ? "text-yellow-400" :
                  prize.place === "2nd" ? "text-gray-300" :
                  "text-orange-400"
                }`}>
                  {prize.place}
                </span>
                <span className="text-lg font-semibold text-gray-100">
                  {formatCurrency(prize.amount)}
                </span>
              </div>
              <span className="text-sm text-gray-400">
                {prize.percent}%
              </span>
            </div>
            
            {/* Visual bar */}
            <div className="w-full h-2 bg-dark-300 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  prize.place === "1st" ? "bg-gradient-to-r from-yellow-400 to-yellow-500" :
                  prize.place === "2nd" ? "bg-gradient-to-r from-gray-300 to-gray-400" :
                  "bg-gradient-to-r from-orange-400 to-orange-500"
                }`}
                style={{ width: `${prize.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Pool Details */}
      <div className="pt-4 border-t border-dark-300/50 space-y-3">
        {/* Current vs Max */}
        {maxParticipants > 0 && currentParticipants < maxParticipants && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Participation</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-300 font-mono">
                {currentParticipants}/{maxParticipants}
              </span>
              <span className="text-gray-500">
                (Max: {formatCurrency(maxWinnerPool)})
              </span>
            </div>
          </div>
        )}

        {/* Platform Fee - Only show if not crown contest */}
        {PLATFORM_FEE > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Degen Dividends</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-300">
                {formatCurrency(platformFee)}
              </span>
              <span className="text-gray-500">({PLATFORM_FEE}%)</span>
            </div>
          </div>
        )}

        {/* Crown Contest Badge */}
        {contestType === "CROWN" && (
          <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v4l3 3-3 3v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4l-3-3 3-3V4z" />
              </svg>
              <span className="text-sm font-medium text-purple-300">
                Crown Contest - No Platform Fee!
              </span>
            </div>
          </div>
        )}

        {/* DUEL Holder Info - Only for regular contests */}
        {PLATFORM_FEE > 0 && (
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <span>Daily SOL airdrop to</span>
            <a 
              href="https://jup.ag/tokens/F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-brand-400 hover:text-brand-300 underline"
            >
              DUEL
            </a>
            <span>holders</span>
          </div>
        )}
      </div>
    </div>
  );
};