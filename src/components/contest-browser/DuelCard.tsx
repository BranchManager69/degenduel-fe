import { motion } from "framer-motion";
import React, { useState } from "react";
import { formatCurrency } from "../../lib/utils";
import { Contest, ContestStatus } from "../../types/index";
import { getFullImageUrl } from "../../utils/profileImageUtils";
import { getNicknameByWalletAddress } from "../../utils/roleColors";
import { ContestButton } from "../landing/contests-preview/ContestButton";
import { CountdownTimer } from "../ui/CountdownTimer";

interface DuelUser {
  wallet_address: string;
  nickname: string;
  profile_image_url?: string;
  total_contests?: number;
  experience_points?: number;
  whale_status?: boolean;
  whale_tier?: string;
}

interface DuelContest extends Contest {
  contest_type?: "CHALLENGE";
  challenger_wallet?: string;
  challenged_wallet?: string;
  challenge_status?: "PENDING_ACCEPTANCE" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  challenger_user?: DuelUser;
  challenged_user?: DuelUser;
}

interface DuelCardProps {
  contest: DuelContest;
  onClick?: () => void;
}

export const DuelCard: React.FC<DuelCardProps> = ({ contest, onClick }) => {
  const [isHovering, setIsHovering] = useState(false);

  console.log('[DUEL DEBUG] DuelCard received contest data:', {
    id: contest.id,
    name: contest.name,
    contest_type: contest.contest_type,
    challenger_user: contest.challenger_user,
    challenged_user: contest.challenged_user,
    participants: contest.participants,
    max_participants: contest.max_participants
  });

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

  // For regular 2-person contests, use participants array if available
  const isChallenge = contest.contest_type === "CHALLENGE";
  const participants = contest.participants || [];
  
  // Get user data with fallbacks
  let challenger: DuelUser;
  let challenged: DuelUser | null = null;
  
  if (isChallenge && contest.challenger_user) {
    // 1v1 challenge duel (=we have user data)
    challenger = contest.challenger_user;
    challenged = contest.challenged_user || null;
  } else if (participants.length > 0) {
    // Regular 2-person contest with participants (=public open-to-all duel)
    challenger = {
      wallet_address: participants[0].address,
      nickname: participants[0].username || participants[0].username || `${participants[0].address.slice(0, 4)}...${participants[0].address.slice(-4)}`,
      profile_image_url: undefined
    };
    
    if (participants.length > 1) {
      challenged = {
        wallet_address: participants[1].address,
        nickname: participants[1].username || participants[1].nickname || `${participants[1].address.slice(0, 4)}...${participants[1].address.slice(-4)}`,
        profile_image_url: undefined
      };
    }
  } else {
    // Fallback - use whatever data we have
    challenger = {
      wallet_address: contest.challenger_wallet || "unknown",
      nickname: getNicknameByWalletAddress(contest.challenger_wallet),
      profile_image_url: undefined
    };
  }

  console.log('[DUEL DEBUG] Determined challenger/challenged:', {
    isChallenge,
    challenger,
    challenged,
    participantsLength: participants.length
  });

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`group relative bg-gradient-to-br from-dark-200/90 via-dark-300/80 to-dark-200/90 backdrop-blur-sm border-2 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl rounded-lg overflow-hidden w-full cursor-pointer ${
        displayStatus === "active" 
          ? "border-green-500/60 hover:border-green-400/80 shadow-green-500/20" 
          : displayStatus === "pending" 
          ? "border-blue-500/60 hover:border-blue-400/80 shadow-blue-500/20"
          : displayStatus === "completed"
          ? "border-gray-500/60 hover:border-gray-400/80 shadow-gray-500/20"
          : "border-red-500/60 hover:border-red-400/80 shadow-red-500/20"
      }`}
    >
      {/* Background with cybergrid fallback */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="/assets/media/banners/concepts/concept0_cybergrid.png"
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-200/60 via-dark-200/85 to-dark-200/98" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-blue-900/20"></div>
        {displayStatus === "active" && (
          <div className="absolute inset-0 bg-gradient-to-r from-green-900/10 via-transparent to-green-900/10 animate-pulse"></div>
        )}
      </div>

      {/* VS Lightning effect background */}
      {isHovering && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.3 }}
              transition={{ duration: 0.5 }}
              className="w-32 h-32 bg-white rounded-full blur-3xl"
            />
          </div>
        </div>
      )}

      {/* Challenge Status Banner */}
      {contest.challenge_status === "PENDING_ACCEPTANCE" && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-500/20 border-b border-yellow-500/40 backdrop-blur-sm z-20">
          <div className="text-center py-1 px-3">
            <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">
              Awaiting Acceptance
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative px-4 pt-4 pb-14 sm:px-6 sm:pt-6 sm:pb-14 space-y-3">
        {/* Contest Name and Timer - matching regular contest card style */}
        <div className="space-y-0.5 flex-1 min-w-0">
          <h3 className={`font-black text-white pr-2 group-hover:text-brand-300 transition-colors hover:text-brand-400 cursor-pointer text-left font-sans tracking-tight leading-tight ${
            contest.name.length > 50 ? 'text-sm sm:text-base lg:text-lg' :
            contest.name.length > 35 ? 'text-base sm:text-lg lg:text-xl' :
            contest.name.length > 25 ? 'text-lg sm:text-xl lg:text-2xl' :
            'text-xl sm:text-2xl lg:text-3xl'
          }`}
          style={{textShadow: '2px 0 0 black, -2px 0 0 black, 0 2px 0 black, 0 -2px 0 black'}}>
            {contest.name}
          </h3>
          <p className="text-sm font-medium text-brand-300 text-left">
            {hasEnded && displayStatus === "cancelled" ? (
              "Duel Cancelled"
            ) : hasEnded ? (
              "Duel Ended"
            ) : displayStatus === "cancelled" ? (
              <span className="line-through text-gray-500 italic">
                {hasStarted ? "Ends in " : "Starts in "}
                <CountdownTimer
                  targetDate={hasStarted ? contest.end_time : contest.start_time}
                  onComplete={() => {}}
                  showSeconds={true}
                />
              </span>
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
          </p>
        </div>

        {/* Contest Description - matching regular contest card style */}
        <div className="relative py-0 flex flex-col justify-start min-h-[2.5rem] sm:min-h-[3rem]">
          {displayStatus === "cancelled" ? (
            <div className="relative h-full w-full overflow-hidden">
              {/* More compact cancellation stamp */}
              <motion.div 
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center z-10"
                whileHover={{ scale: 1.02 }}
              >
                {/* Subtle shadow glow effect */}
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ 
                    boxShadow: ["0 0 15px 0px rgba(185, 28, 28, 0)", "0 0 20px 2px rgba(185, 28, 28, 0.15)", "0 0 15px 0px rgba(185, 28, 28, 0)"] 
                  }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                >
                  <div className="w-[90%] h-[80%] rounded-lg" />
                </motion.div>
                
                {/* Main cancellation stamp - more compact */}
                <motion.div 
                  className="relative bg-red-900/30 border-2 border-red-500/40 rounded py-1 px-3 backdrop-blur-sm shadow-lg max-w-[95%]"
                  whileHover={{ y: -1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Inner highlight */}
                  <div className="absolute inset-0 overflow-hidden rounded">
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-red-400/40 to-transparent transform translate-y-[1px]"></div>
                  </div>
                  
                  {/* Radial background effect */}
                  <div className="absolute inset-0 bg-gradient-radial from-red-800/10 to-red-900/40 rounded"></div>
                  
                  {/* Stamp-like content with clear reason label */}
                  <div className="flex flex-col items-center gap-0.5 relative z-10">
                    <div className="flex items-center gap-1.5">
                      <motion.svg 
                        className="w-3 h-3 text-red-400" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </motion.svg>
                      <span className="text-xs font-bold text-red-400 uppercase">Duel Cancelled</span>
                    </div>
                    <motion.div 
                      className="text-xs text-red-300 italic"
                      initial={{ opacity: 0.8 }}
                      animate={{ opacity: [0.8, 1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    >
                      <span className="font-semibold mr-1 uppercase">REASON:</span>
                      {contest.cancellation_reason 
                        ? contest.cancellation_reason.charAt(0).toUpperCase() + contest.cancellation_reason.slice(1).toLowerCase()
                        : "No reason provided"}
                    </motion.div>
                  </div>
                  
                  {/* Animated pulsing border effect */}
                  <motion.div 
                    className="absolute inset-0 rounded border-2 border-red-500/0"
                    animate={{ borderColor: ["rgba(239, 68, 68, 0)", "rgba(239, 68, 68, 0.3)", "rgba(239, 68, 68, 0)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  {/* Animated shine effect */}
                  <motion.div 
                    className="absolute inset-0 overflow-hidden rounded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div 
                      className="w-[20%] h-full bg-gradient-to-r from-transparent via-red-200/10 to-transparent"
                      animate={{ x: ["30%", "150%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                    />
                  </motion.div>

                </motion.div>

              </motion.div>
              
              {/* Original description more visible behind */}
              <p
                className="text-xs sm:text-sm text-gray-500/40 line-clamp-2 sm:line-clamp-3 min-h-[2.5rem] sm:min-h-[3rem]"
                title={contest.description}
              >
                {contest.description || "No description available"}
              </p>

            </div>
          ) : contest.description ? (
            <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 italic font-medium tracking-wide text-left border-l-2 border-gray-600/50 pl-3 py-1 bg-gradient-to-r from-gray-900/20 to-transparent min-h-[2.5rem] sm:min-h-[3rem]"
              title={contest.description}
              style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>
              {contest.description}
            </p>
          ) : null}
        </div>

        {/* Duel Stakes - Positioned like regular contest cards */}
        <div className="relative bg-dark-300/30 rounded-lg p-2 border border-dark-400/50">
          {Number(contest.entry_fee) === 0 ? (
            <div className="text-center">
              <span className="text-sm font-bold text-green-400 uppercase">FREE DUEL</span>
              <span className="text-xs text-gray-500 ml-2">• Bragging rights only</span>
            </div>
          ) : (
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500 uppercase">Wager</p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg font-bold text-amber-300">
                  {formatCurrency(Number(contest.entry_fee)).replace(' SOL', '')}
                </span>
                <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-4 h-4" />
                <span className="text-sm text-gray-400 ml-1">each</span>
              </div>
              <p className="text-xs text-gray-500">Winner takes all</p>
            </div>
          )}
        </div>

        {/* Face-off Section - UFC Fight Poster Style */}
        <div className="relative h-24 flex overflow-hidden rounded-lg border border-dark-400/50">
          {/* Challenger Section - Left Half */}
          <motion.div 
            className="relative flex-1 bg-dark-400/30 overflow-hidden"
            animate={isHovering ? { x: -3 } : { x: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Edge-to-edge profile picture background */}
            <div className="absolute inset-0 overflow-hidden">
              {challenger.profile_image_url ? (
                <div className="relative w-full h-full">
                  <img
                    src={getFullImageUrl(challenger.profile_image_url)}
                    alt={challenger.nickname}
                    className="absolute inset-0 w-full h-full object-cover scale-125"
                    style={{
                      transform: "scaleX(-1) scale(1.25)", // Mirror and zoom
                      maskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.1) 100%)',
                      WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.1) 100%)'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.opacity = '0.5';
                    }}
                  />
                  <div className="absolute inset-0 bg-dark-400/20" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/60 to-transparent" />
              )}
              
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-purple-900/20" />
            </div>

            {/* Challenger name overlay */}
            <div className="absolute bottom-1 left-2 z-10 max-w-[calc(100%-15px)]">
              <p className="text-xs font-bold text-white whitespace-nowrap"
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                }}>
                {challenger.nickname}
              </p>
              <div className="text-[10px] text-purple-300 font-bold uppercase">CHALLENGER</div>
            </div>
          </motion.div>

          {/* VS Lightning Bolt - Narrower */}
          <motion.div 
            className="relative z-20 flex items-center justify-center w-10 bg-gradient-to-br from-yellow-500 to-orange-600"
            animate={isHovering ? { 
              scale: 1.1,
              boxShadow: "0 0 20px rgba(255, 193, 7, 0.6)"
            } : { 
              scale: 1,
              boxShadow: "0 0 0px rgba(255, 193, 7, 0)"
            }}
            transition={{ duration: 0.3 }}
            style={{
              clipPath: "polygon(30% 0%, 70% 0%, 85% 50%, 70% 100%, 30% 100%, 15% 50%)"
            }}
          >
            <div className="text-dark-900 font-black text-sm tracking-wider">
              VS
            </div>
            
            {/* Lightning effects on hover */}
            {isHovering && (
              <>
                <motion.div
                  className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-yellow-300"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
                />
                <motion.div
                  className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-yellow-300"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
                />
              </>
            )}
          </motion.div>

          {/* Challenged/Mystery Section - Right Half */}
          <motion.div 
            className="relative flex-1 bg-dark-400/30 overflow-hidden"
            animate={isHovering ? { x: 3 } : { x: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Edge-to-edge profile picture background */}
            <div className="absolute inset-0 overflow-hidden">
              {!challenged ? (
                // Mystery opponent with glitch effect
                <div className="absolute inset-0 bg-gradient-to-l from-gray-800 to-gray-900 flex items-center justify-center">
                  <motion.div
                    animate={{ 
                      opacity: [0.3, 0.8, 0.3],
                      scale: [0.9, 1.1, 0.9]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-6xl font-black text-gray-400/60"
                  >
                    ?
                  </motion.div>
                  {/* Glitch effect overlay */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent"
                    animate={{ y: [-30, 30] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                  />
                </div>
              ) : challenged.profile_image_url ? (
                <div className="relative w-full h-full">
                  <img
                    src={getFullImageUrl(challenged.profile_image_url)}
                    alt={challenged.nickname}
                    className="absolute inset-0 w-full h-full object-cover scale-125"
                    style={{
                      maskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.1) 100%)',
                      WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.1) 100%)'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.opacity = '0.5';
                    }}
                  />
                  <div className="absolute inset-0 bg-dark-400/20" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-l from-blue-600/60 to-transparent" />
              )}
              
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-l from-blue-900/40 to-blue-900/20" />
            </div>

            {/* Challenged name overlay */}
            <div className="absolute bottom-1 right-2 z-10 text-right max-w-[calc(100%-15px)]">
              {!challenged ? (
                <>
                  <p className={`text-sm font-bold text-gray-400 whitespace-nowrap ${displayStatus !== "cancelled" ? "animate-pulse" : ""}`}
                    style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                    }}>
                    {displayStatus === "cancelled" ? "No Opponent" : "Awaiting..."}
                  </p>
                  <div className="text-[12px] text-gray-500 font-bold uppercase whitespace-nowrap">
                    {displayStatus === "cancelled" ? "CANCELLED" : (isChallenge ? "RESERVED" : "OPEN SLOT")}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-white whitespace-nowrap"
                    style={{
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      WebkitTextStroke: '0.5px rgba(0,0,0,0.8)'
                    }}>
                    {challenged.nickname}
                  </p>
                  <div className="text-[10px] text-blue-300 font-bold uppercase">CHALLENGED</div>
                </>
              )}
            </div>
          </motion.div>
        </div>


        {/* Share (Shill) button - matching regular contest card */}
        <div className="absolute top-16 right-1 z-30 opacity-70 hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const shareUrl = `${window.location.origin}/contests/${contest.id.toString()}`;
              navigator.clipboard.writeText(shareUrl);
            }}
            className="p-1.5 text-brand-300 hover:text-brand-400 transition-colors"
            title="Shill"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </button>
        </div>

      </div>

      {/* Action Button */}
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

      {/* Corner Status Indicator */}
      <div className="absolute top-0 right-0 z-20 overflow-hidden rounded-tr-lg">
        {displayStatus === "active" && (
          <div className="relative overflow-hidden">
            <div className="w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-green-500/50"></div>
            <div className="absolute top-0 right-0 w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-green-400/30 group-hover:border-t-green-400/60 transition-all duration-500"></div>
            <div className="absolute top-0 right-0 w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-green-300/20 animate-pulse"></div>
            <div className="absolute top-2 right-2 transform rotate-45 origin-center">
              <span className="text-[13px] font-black text-green-300 uppercase tracking-wider drop-shadow-[0_2px_6px_rgba(34,197,94,0.8)]">LIVE</span>
            </div>
          </div>
        )}
        
        {displayStatus === "pending" && (
          <div className="relative overflow-hidden">
            <div className="w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-blue-500/50"></div>
            <div className="absolute top-0 right-0 w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-blue-400/30 group-hover:border-t-blue-400/60 transition-all duration-500"></div>
            <div className="absolute top-2 right-2 transform rotate-45 origin-center">
              <span className="text-[13px] font-black text-blue-300 uppercase tracking-wider drop-shadow-[0_2px_6px_rgba(59,130,246,0.8)]">SOON</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};