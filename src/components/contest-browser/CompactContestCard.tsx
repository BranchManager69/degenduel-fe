import { motion } from "framer-motion";
import React from "react";

import { formatCurrency } from "../../lib/utils";
import { Contest, ContestStatus } from "../../types/index";
import { ContestButton } from "../landing/contests-preview/ContestButton";
import { CountdownTimer } from "../ui/CountdownTimer";

interface CompactContestCardProps {
  contest: Contest;
  onClick?: () => void;
  variant?: "minimal" | "compact" | "wide";
}

export const CompactContestCard: React.FC<CompactContestCardProps> = ({
  contest,
  onClick,
  variant = "compact"
}) => {

  // Calculate actual status based on timestamps
  const now = new Date();
  const startTime = new Date(contest.start_time);
  const endTime = new Date(contest.end_time);

  const hasStarted = now >= startTime;
  const hasEnded = now >= endTime;

  let displayStatus: ContestStatus = contest.status;
  if (contest.status !== "cancelled") {
    if (hasEnded) {
      displayStatus = "completed";
    } else if (hasStarted) {
      displayStatus = "active";
    } else {
      displayStatus = "pending";
    }
  }

  // Minimal variant - just the essentials
  if (variant === "minimal") {
    return (
      <div
        onClick={onClick}
        className={`group relative bg-dark-200/80 backdrop-blur-sm border-2 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-lg overflow-hidden w-full h-full min-h-[180px] cursor-pointer ${
          displayStatus === "active" 
            ? "border-green-500/60 hover:border-green-400/80" 
            : displayStatus === "pending" 
            ? "border-blue-500/60 hover:border-blue-400/80"
            : displayStatus === "completed"
            ? "border-gray-500/60 hover:border-gray-400/80"
            : "border-red-500/60 hover:border-red-400/80"
        }`}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-300/50 to-dark-400/50" />
        
        {/* Content */}
        <div className="relative p-4 h-full flex flex-col justify-between">
          {/* Title and status */}
          <div>
            <h3 className="font-bold text-white text-sm line-clamp-2 mb-2 group-hover:text-brand-300 transition-colors">
              {contest.name}
            </h3>
            
            {/* Timer or status */}
            <div className="text-xs text-brand-300">
              {hasEnded ? (
                "Ended"
              ) : displayStatus === "cancelled" ? (
                <span className="text-red-400">Cancelled</span>
              ) : (
                <CountdownTimer
                  targetDate={hasStarted ? contest.end_time : contest.start_time}
                  onComplete={() => {}}
                  showSeconds={false}
                />
              )}
            </div>
          </div>
          
          {/* Bottom section with prize */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Prize</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-amber-300">
                  {formatCurrency(
                    Number(contest.entry_fee) > 0 
                      ? Number(contest.entry_fee) * contest.max_participants
                      : Number(contest.prize_pool || "0")
                  ).replace(' SOL', '')}
                </span>
                <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
              </div>
            </div>
            
            {/* Mini progress bar */}
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  displayStatus === "active"
                    ? "bg-green-500"
                    : displayStatus === "pending"
                    ? "bg-blue-500"
                    : "bg-gray-500"
                }`}
                style={{
                  width: `${(contest.participant_count / contest.max_participants) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Corner status indicator */}
        {displayStatus === "active" && (
          <div className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-green-500/50" />
        )}
      </div>
    );
  }

  // Compact variant - medium detail
  if (variant === "compact") {
    return (
      <div
        onClick={onClick}
        className={`group relative bg-dark-200/80 backdrop-blur-sm border-2 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl rounded-lg overflow-hidden w-full h-full min-h-[250px] cursor-pointer ${
          displayStatus === "active" 
            ? "border-green-500/60 hover:border-green-400/80" 
            : displayStatus === "pending" 
            ? "border-blue-500/60 hover:border-blue-400/80"
            : displayStatus === "completed"
            ? "border-gray-500/60 hover:border-gray-400/80"
            : "border-red-500/60 hover:border-red-400/80"
        }`}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-300/50 to-dark-400/50" />
        
        {/* Content */}
        <div className="relative p-4 pb-12 h-full flex flex-col">
          {/* Title and timer */}
          <div className="space-y-2 mb-auto">
            <h3 className="font-bold text-white text-base line-clamp-2 group-hover:text-brand-300 transition-colors">
              {contest.name}
            </h3>
            
            <div className="text-xs text-brand-300">
              {hasEnded ? (
                "Contest Ended"
              ) : displayStatus === "cancelled" ? (
                <span className="text-red-400">Cancelled</span>
              ) : (
                <>
                  {hasStarted ? "Ends " : "Starts "}
                  <CountdownTimer
                    targetDate={hasStarted ? contest.end_time : contest.start_time}
                    onComplete={() => {}}
                    showSeconds={true}
                  />
                </>
              )}
            </div>
          </div>
          
          {/* Stats section */}
          <div className="space-y-3 mt-4">
            {/* Entry fee and prize */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Entry</span>
                <div className="font-bold text-blue-300">
                  {Number(contest.entry_fee) === 0 ? "FREE" : formatCurrency(Number(contest.entry_fee)).replace(' SOL', '')}
                </div>
              </div>
              <div className="text-right">
                <span className="text-gray-400">Prize</span>
                <div className="font-bold text-amber-300">
                  {formatCurrency(
                    Number(contest.entry_fee) > 0 
                      ? Number(contest.entry_fee) * contest.max_participants
                      : Number(contest.prize_pool || "0")
                  ).replace(' SOL', '')}
                </div>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Players</span>
                <span>{contest.participant_count}/{contest.max_participants}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    displayStatus === "active"
                      ? "bg-gradient-to-r from-green-600 to-green-500"
                      : displayStatus === "pending"
                      ? "bg-gradient-to-r from-blue-600 to-blue-500"
                      : "bg-gray-500"
                  }`}
                  style={{
                    width: `${(contest.participant_count / contest.max_participants) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Compact action button */}
        <div className="absolute bottom-0 left-0 right-0" onClick={(e) => e.stopPropagation()}>
          <ContestButton
            id={Number(contest.id)}
            type={
              displayStatus === "active" ? "live" :
              displayStatus === "pending" ? "upcoming" :
              displayStatus === "completed" ? "completed" :
              "cancelled"
            }
            isParticipating={contest.is_participating}
          />
        </div>
        
        {/* Corner status indicator */}
        <div className="absolute top-0 right-0 overflow-hidden rounded-tr-lg">
          {displayStatus === "active" && (
            <motion.div 
              className="relative"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-0 h-0 border-l-[50px] border-l-transparent border-t-[50px] border-t-green-500/50" />
              <div className="absolute top-1 right-1 transform rotate-45">
                <span className="text-[10px] font-black text-green-300 uppercase">LIVE</span>
              </div>
            </motion.div>
          )}
          {displayStatus === "pending" && (
            <div className="relative">
              <div className="w-0 h-0 border-l-[50px] border-l-transparent border-t-[50px] border-t-blue-500/50" />
              <div className="absolute top-1 right-1 transform rotate-45">
                <span className="text-[10px] font-black text-blue-300 uppercase">SOON</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Wide variant - horizontal layout
  return (
    <div
      onClick={onClick}
      className={`group relative bg-dark-200/80 backdrop-blur-sm border-2 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-xl rounded-lg overflow-hidden w-full h-full cursor-pointer ${
        displayStatus === "active" 
          ? "border-green-500/60 hover:border-green-400/80" 
          : displayStatus === "pending" 
          ? "border-blue-500/60 hover:border-blue-400/80"
          : displayStatus === "completed"
          ? "border-gray-500/60 hover:border-gray-400/80"
          : "border-red-500/60 hover:border-red-400/80"
      }`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-300/50 to-dark-400/50" />
      
      {/* Content in horizontal layout */}
      <div className="relative p-4 pr-36 h-full flex items-center gap-4">
        {/* Left section - Title and description */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-lg line-clamp-1 mb-1 group-hover:text-brand-300 transition-colors">
            {contest.name}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2">
            {contest.description || "Join this exciting trading competition"}
          </p>
          <div className="text-xs text-brand-300 mt-2">
            {hasEnded ? (
              "Contest Ended"
            ) : (
              <>
                {hasStarted ? "Ends in " : "Starts in "}
                <CountdownTimer
                  targetDate={hasStarted ? contest.end_time : contest.start_time}
                  onComplete={() => {}}
                  showSeconds={true}
                />
              </>
            )}
          </div>
        </div>
        
        {/* Right section - Stats */}
        <div className="flex items-center gap-6">
          {/* Entry fee */}
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Entry</div>
            <div className="font-bold text-blue-300">
              {Number(contest.entry_fee) === 0 ? "FREE" : (
                <div className="flex items-center gap-1">
                  <span>{formatCurrency(Number(contest.entry_fee)).replace(' SOL', '')}</span>
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
          
          {/* Prize pool */}
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Prize</div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-amber-300">
                {formatCurrency(
                  Number(contest.entry_fee) > 0 
                    ? Number(contest.entry_fee) * contest.max_participants
                    : Number(contest.prize_pool || "0")
                ).replace(' SOL', '')}
              </span>
              <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-4 h-4" />
            </div>
          </div>
          
          {/* Players */}
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Players</div>
            <div className="font-bold text-white">
              {contest.participant_count}/{contest.max_participants}
            </div>
          </div>
        </div>
      </div>
      
      {/* Action button - vertical on the right */}
      <div className="absolute top-0 right-0 bottom-0 w-32" onClick={(e) => e.stopPropagation()}>
        <div className="h-full flex items-center justify-center">
          <div className="transform -rotate-90 origin-center">
            <ContestButton
              id={Number(contest.id)}
              type={
                displayStatus === "active" ? "live" :
                displayStatus === "pending" ? "upcoming" :
                displayStatus === "completed" ? "completed" :
                "cancelled"
              }
              isParticipating={contest.is_participating}
            />
          </div>
        </div>
      </div>
    </div>
  );
};