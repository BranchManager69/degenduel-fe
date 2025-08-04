import React from "react";
// import { formatCurrency } from "../../lib/utils"; // Not used after removing Degen Dividends
import { useIndividualToken } from "../../hooks/websocket/topic-hooks/useIndividualToken";

interface PrizeStructureProps {
  prizePool: number;
  entryFee?: number;
  maxParticipants?: number;
  currentParticipants?: number;
  platformFeePercentage?: number;
  contestType?: string;
  payoutStructure?: Record<string, number>; // e.g., {"place_1": 0.5, "place_2": 0.3, "place_3": 0.2}
  contestStatus?: string; // Add status to determine if pending/live/completed
  minParticipants?: number; // Add min participants for range calculation
}

export const PrizeStructure: React.FC<PrizeStructureProps> = ({
  prizePool,
  entryFee = 0,
  maxParticipants = 0,
  currentParticipants = 0,
  contestType = "",
  payoutStructure,
  contestStatus = "",
  minParticipants = 0
}) => {
  // Get SOL price for USD conversion
  const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
  const { token: solToken } = useIndividualToken(SOL_ADDRESS);
  const solPrice = solToken?.price || 0;
  // Platform fee is 10% for all contests except CHALLENGE (1v1) contests
  const PLATFORM_FEE = contestType === "CHALLENGE" ? 0 : 10;
  
  // Calculate totals - use actual participants for non-pending, range for pending
  // Only show ranges for pending/upcoming contests. Active/live, completed, and cancelled show exact amounts
  const isPending = contestStatus === "pending" || contestStatus === "upcoming";
  
  // For pending contests, calculate min and max pools
  const minPoolParticipants = isPending ? Math.max(currentParticipants, minParticipants) : currentParticipants;
  const maxPoolParticipants = isPending ? maxParticipants : currentParticipants;
  
  const minTotalCollected = entryFee > 0 ? entryFee * minPoolParticipants : prizePool;
  const maxTotalCollected = entryFee > 0 ? entryFee * maxPoolParticipants : prizePool;
  
  const minPlatformFee = (minTotalCollected * PLATFORM_FEE) / 100;
  const maxPlatformFee = (maxTotalCollected * PLATFORM_FEE) / 100;
  
  const minWinnerPool = minTotalCollected - minPlatformFee;
  const maxWinnerPool = maxTotalCollected - maxPlatformFee;
  
  // For display purposes, use the max pool for pending (optimistic view)
  // const platformFee = isPending ? maxPlatformFee : minPlatformFee; // Not used after removing Degen Dividends
  
  // Prize distribution calculation is now done inline in the visual payout distribution section

  return (
    <>
      <style>{`
        .payout-bar:hover .payout-tooltip {
          opacity: 1;
        }
      `}</style>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Payout Structure</h3>
      </div>

      {/* Visual Payout Distribution */}
      <div className="mt-6">
        {(() => {
          // For pending contests, use max participants; for active/completed, use actual participants
          const totalPositions = (contestStatus === "pending" || contestStatus === "upcoming") 
            ? maxParticipants || 10 
            : currentParticipants || 10;
          
          // For pending contests, limit to 20 for display; for active/completed, show all participants
          const maxDisplayPositions = (contestStatus === "pending" || contestStatus === "upcoming") 
            ? Math.min(totalPositions, 20)
            : totalPositions;

          return (
            <>
              <div className="h-40 flex items-end gap-1 relative">
                {(() => {
            const maxPercent = payoutStructure && Object.keys(payoutStructure).length > 0
              ? Math.round((Object.values(payoutStructure)[0] as number) * 100)
              : 69; // Fallback to default first place percentage
            
                  // Create array for all positions
                  const positions = [];
                  let lastPayingPosition = 0;
                  
                  for (let i = 1; i <= maxDisplayPositions; i++) {
              const payout = payoutStructure ? payoutStructure[`place_${i}`] : 
                            (i === 1 ? 0.69 : i === 2 ? 0.20 : i === 3 ? 0.11 : 0);
              const isPaying = payout > 0;
              if (isPaying) lastPayingPosition = i;
              
              positions.push({
                place: i,
                percentage: payout ? Math.round(payout * 100) : 0,
                isPaying
              });
            }
            
            return (
              <>
                {positions.map((pos) => {
                  const minPrize = pos.percentage > 0 ? (pos.percentage / 100) * minWinnerPool : 0;
                  const maxPrize = pos.percentage > 0 ? (pos.percentage / 100) * maxWinnerPool : 0;
                  const prize = isPending ? maxPrize : minPrize; // Show max for pending
                  
                  return (
                    <div key={pos.place} className="flex-1 flex flex-col items-center">
                      <div className="w-full relative">
                        <div 
                          className={`payout-bar w-full rounded-t transition-all relative cursor-pointer ${
                            pos.isPaying 
                              ? 'bg-gradient-to-t from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400' 
                              : 'bg-gray-600/30'
                          }`}
                          style={{ 
                            height: pos.percentage > 0 
                              ? `${(pos.percentage / maxPercent) * 128}px` 
                              : '2px',
                            minHeight: pos.isPaying ? '24px' : '2px'
                          }}
                        >
                          {pos.percentage > 0 && (
                            <>
                              <div className="absolute left-1/2 -top-4 text-[10px] text-white font-medium whitespace-nowrap flex items-center gap-0.5" style={{ transform: 'translateX(-75%)' }}>
                                <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-2.5 h-2.5" />
                                {isPending && minPrize !== maxPrize ? (
                                  <>
                                    {(Math.floor(minPrize * 1000) / 1000).toFixed(3)}-{(Math.floor(maxPrize * 1000) / 1000).toFixed(3)}
                                  </>
                                ) : (
                                  (Math.floor(prize * 1000) / 1000).toFixed(3)
                                )}
                              </div>
                              
                              {/* Percentage label */}
                              <div className="absolute left-1/2 -translate-x-1/2 -top-8 text-[9px] text-gray-400 font-medium">
                                {pos.percentage}%
                              </div>
                            </>
                          )}
                          
                          {/* USD equivalent inside bar */}
                          {pos.percentage > 0 && solPrice > 0 && (
                            <div className="absolute left-1/2 -translate-x-1/2 top-1 text-[11px] text-gray-900 font-bold whitespace-nowrap">
                              ${Math.round(prize * solPrice)}
                            </div>
                          )}
                          
                          {/* Hover Tooltip */}
                          {pos.isPaying && (
                            <div className="payout-tooltip absolute -top-20 left-1/2 -translate-x-1/2 opacity-0 transition-opacity pointer-events-none z-10">
                              <div className="bg-dark-400 text-gray-200 text-xs rounded px-2 py-1 whitespace-nowrap border border-dark-300">
                                <div className="font-medium">Place #{pos.place}</div>
                                <div className="text-brand-400 flex items-center gap-1">
                                  {isPending && minPrize !== maxPrize ? (
                                    <>
                                      {(Math.floor(minPrize * 1000) / 1000).toFixed(3)}-{(Math.floor(maxPrize * 1000) / 1000).toFixed(3)}
                                    </>
                                  ) : (
                                    (Math.floor(prize * 1000) / 1000).toFixed(3)
                                  )}
                                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                                </div>
                                {solPrice > 0 && (
                                  <div className="text-gray-400 text-xs">
                                    ${(prize * solPrice).toFixed(2)}
                                  </div>
                                )}
                              </div>
                              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-dark-400 border-r border-b border-dark-300 transform rotate-45"></div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {pos.place}
                      </div>
                    </div>
                  );
                })}
                
                {/* Money Line - Vertical divider between winners and losers */}
                {lastPayingPosition > 0 && lastPayingPosition < positions.length && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
                    style={{
                      left: `${(lastPayingPosition / positions.length) * 100}%`,
                      height: 'calc(100% + 24px)',
                      marginTop: '-12px'
                    }}
                  />
                )}
              </>
            );
          })()}
          
          {totalPositions > maxDisplayPositions && (
            <div className="flex-1 flex flex-col items-center justify-end">
              <div className="text-xs text-gray-500">...</div>
            </div>
          )}
        </div>
        </>
      );
    })()}
      </div>

      {/* Pool Details */}
      <div className="pt-4 border-t border-dark-300/50 space-y-3">


        {/* Challenge Contest Badge */}
        {contestType === "CHALLENGE" && (
          <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h2a1 1 0 100 2H6a4 4 0 01-4-4V5a4 4 0 014-4h3a1 1 0 000-2H6a2 2 0 00-2 2z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-medium text-red-300">
                1v1 Challenge - No Platform Fee!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};