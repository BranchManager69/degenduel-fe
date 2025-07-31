import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

import { getContestImageUrl } from "../../lib/imageUtils";
import { formatCurrency } from "../../lib/utils";
import { Contest, ContestStatus } from "../../types/index";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ContestButton } from "../landing/contests-preview/ContestButton";
import { CountdownTimer } from "../ui/CountdownTimer";

// Global cache to prevent repeated 404 warnings for the same URLs
const warned404URLs = new Set<string>();

// Clear cache on page unload to prevent memory buildup
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    warned404URLs.clear();
  });
}

interface ContestCardProps {
  contest: Contest;
  onClick?: () => void;
}

export const ContestCard: React.FC<ContestCardProps> = ({
  contest,
  onClick,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageBlurhash, setImageBlurhash] = useState(false);
  
  // Mouse position tracking for parallax effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  // Ref to the card element for tracking relative mouse position
  const cardRef = useRef<HTMLDivElement>(null);

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

  // Debug logging for free cancelled contests with "0"
  if (Number(contest.entry_fee) === 0 && displayStatus === "cancelled") {
    console.log('[CONTEST CARD DEBUG] Free cancelled contest data:', {
      id: contest.id,
      name: contest.name,
      prize_pool: contest.prize_pool,
      current_prize_pool: contest.current_prize_pool,
      total_prize_pool: contest.total_prize_pool,
      entry_fee: contest.entry_fee,
      displayStatus,
      all_fields: contest
    });
  }

  // Set up image animation - now handled directly in the parallax effect
  useEffect(() => {
    // No longer need to set animateImage since we use the parallax effect
  }, [imageLoaded]);
  
  // Mouse move handler for parallax effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    // Get card dimensions and position
    const rect = cardRef.current.getBoundingClientRect();
    
    // Calculate mouse position relative to card center (values from -0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    // Update mouse position state
    setMousePosition({ x, y });
  };
  
  // Mouse enter/leave handlers
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    // Reset to center position when not hovering
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick ? onClick : undefined}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative bg-dark-200/80 backdrop-blur-sm border-2 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl rounded-lg overflow-hidden w-full max-w-full ${
        displayStatus === "active" 
          ? "border-green-500/60 hover:border-green-400/80 hover:shadow-green-500/10" 
          : displayStatus === "pending" 
          ? "border-blue-500/60 hover:border-blue-400/80 hover:shadow-blue-500/10"
          : displayStatus === "completed"
          ? "border-gray-500/60 hover:border-gray-400/80 hover:shadow-gray-500/10"
          : "border-red-500/60 hover:border-red-400/80 hover:shadow-red-500/10"
      }`}
    >
      {/* Contest Image - Show More of Image */}
      {getContestImageUrl(contest.image_url) && (
        <div 
          className="absolute inset-x-0 z-10"
          style={{
            top: '-6rem', // Start much higher to show more
            height: 'clamp(20rem, 25vw, 30rem)', // Much taller container
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 60%, transparent 85%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 60%, transparent 85%)'
          }}
        >
          {/* Initial loading state - show spinner */}
          {!imageLoaded && !imageError && !imageBlurhash && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-300/50 z-10">
              <LoadingSpinner size="lg" />
            </div>
          )}
          
          {/* Progressive loading effect - low quality image placeholder */}
          {!imageLoaded && !imageError && (
            <motion.div
              initial={{ opacity: 0, filter: "blur(20px)" }}
              animate={{ opacity: 0.15, filter: "blur(10px)" }}
              transition={{ duration: 1.6 }}
              className="absolute inset-0 bg-gradient-to-br from-dark-300 to-dark-400"
              onAnimationComplete={() => setImageBlurhash(true)}
            />
          )}
          
          {/* Actual image */}
          {!imageError && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={imageLoaded ? { opacity: 0.6 } : { opacity: 0 }}
              transition={{ duration: 1.6 }}
              className="absolute inset-0"
            >
              <motion.div
                style={{
                  width: "100%",
                  height: "100%",
                  // Subtle transform based on mouse position for parallax effect
                  transform: isHovering ? 
                    `scale(1.1) translateX(${mousePosition.x * 10}px) translateY(${mousePosition.y * 10}px)` : 
                    "scale(1.05)",
                  transition: "transform 0.3s ease-out"
                }}
              >
                <img
                  src={getContestImageUrl(contest.image_url)}
                  alt={contest.name}
                  onLoad={() => {
                    // Small delay for smoother transition from placeholder
                    setTimeout(() => setImageLoaded(true), 100);
                  }}
                  onError={(e) => {
                    const url = getContestImageUrl(contest.image_url);
                    // Only warn once per URL to prevent spam
                    if (url && !warned404URLs.has(url)) {
                      console.warn(`Contest image not found: ${url}`);
                      warned404URLs.add(url);
                    }
                    // Set fallback image source
                    const target = e.target as HTMLImageElement;
                    target.src = '/assets/media/banners/concepts/concept0_cybergrid.png';
                    setImageError(true);
                  }}
                  className="w-full h-full object-cover object-center group-hover:scale-110"
                  style={{ 
                    transition: 'transform 0.7s ease-out'
                  }}
                />
              </motion.div>
              
              {/* Gradient overlay - lighter to show more image */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-200/90 via-dark-200/40 to-transparent" />
            </motion.div>
          )}
        </div>
      )}
      
      {/* Fallback background for cards without images */}
      {!getContestImageUrl(contest.image_url) && (
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="/assets/media/banners/concepts/concept0_cybergrid.png"
            alt={contest.name}
            className="w-full h-full object-cover opacity-40"
          />
          {/* Stronger gradient that shows more image at top */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark-200/60 via-dark-200/85 to-dark-200/98" />
          {/* Extra dark overlay at bottom for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-dark-200/80 to-transparent" />
        </div>
      )}

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 via-white/0 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream-responsive" />

      {/* Glow effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Enhanced Header with Banner Style - Mobile Responsive */}
      <div className={`relative px-4 pb-14 sm:px-6 sm:pb-14 space-y-2 ${getContestImageUrl(contest.image_url) ? 'pt-32' : 'pt-4 sm:pt-6'}`}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
          
          {/* Contest Name and Status */}
          <div className="space-y-0.5 flex-1 min-w-0 mb-2 sm:mb-0">

            {/* Contest Name */}
            <h3 
              className={`font-black text-white pr-2 group-hover:text-brand-300 transition-colors hover:text-brand-400 cursor-pointer text-left font-sans tracking-tight leading-tight ${
                contest.name.length > 50 ? 'text-sm sm:text-base lg:text-lg' :
                contest.name.length > 35 ? 'text-base sm:text-lg lg:text-xl' :
                contest.name.length > 25 ? 'text-lg sm:text-xl lg:text-2xl' :
                'text-xl sm:text-2xl lg:text-3xl'
              }`}
              style={{textShadow: '2px 0 0 black, -2px 0 0 black, 0 2px 0 black, 0 -2px 0 black', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}
            >
              {contest.name}
            </h3>
            
            {/* Contest Status */}
            <p className="text-sm font-medium text-brand-300 text-left">
              {hasEnded && displayStatus === "cancelled" ? (
                "Contest Cancelled"
              ) : hasEnded ? (
                "Contest Ended"
              ) : displayStatus === "cancelled" ? (
                <span className="line-through text-gray-500 italic">
                  {hasStarted ? "Ends in " : "Starts in "}
                  <CountdownTimer
                    targetDate={
                      hasStarted ? contest.end_time : contest.start_time
                    }
                    onComplete={() => {
                      console.log("Timer completed");
                    }}
                    showSeconds={true}
                  />
                </span>
              ) : (
                <>
                  {hasStarted ? "Ends in " : "Starts in "}
                  <CountdownTimer
                    targetDate={
                      hasStarted ? contest.end_time : contest.start_time
                    }
                    onComplete={() => {
                      console.log("Timer completed");
                    }}
                    showSeconds={true}
                  />
                </>
              )}
            </p>

          </div>

          {/* Share ("Shill") button - top right but below status indicator */}
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

          {/* Edge-to-Edge Corner Status Indicators - Clipped to card rounded corners */}
          <div className="absolute top-0 right-0 z-20 overflow-hidden rounded-tr-lg">
            {/* Live Indicator - Edge corner effect */}
            {displayStatus === "active" && (
              <div className="relative overflow-hidden">
                
                {/* Corner triangle background */}
                <div className="w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-green-500/50"></div>
                
                {/* Animated glow effect */}
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-green-400/30 group-hover:border-t-green-400/60 transition-all duration-500"></div>
                
                {/* Pulse animation */}
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-green-300/20 animate-pulse"></div>
                
                {/* Status text positioned in corner */}
                <div className="absolute top-2 right-2 transform rotate-45 origin-center">
                  <span className="text-[13px] font-black text-green-300 uppercase tracking-wider drop-shadow-[0_2px_6px_rgba(34,197,94,0.8)]">LIVE</span>
                </div>

              </div>
            )}
            
            {/* Upcoming Indicator - Edge corner effect */}
            {displayStatus === "pending" && (
              <div className="relative overflow-hidden">

                {/* Corner triangle background */}
                <div className="w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-blue-500/50"></div>
                
                {/* Animated glow effect */}
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-blue-400/30 group-hover:border-t-blue-400/60 transition-all duration-500"></div>
                
                
                {/* Status text positioned in corner */}
                <div className="absolute top-2 right-2 transform rotate-45 origin-center">
                  <span className="text-[13px] font-black text-blue-300 uppercase tracking-wider drop-shadow-[0_2px_6px_rgba(59,130,246,0.8)]">SOON</span>
                </div>

              </div>
            )}
            
            {/* Completed Indicator - Edge corner effect */}
            {displayStatus === "completed" && (
              <div className="relative overflow-hidden">

                {/* Corner triangle background */}
                <div className="w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-gray-500/50"></div>
                
                {/* Animated glow effect */}
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-gray-400/30 group-hover:border-t-gray-400/60 transition-all duration-500"></div>
                
                {/* Subtle fade animation */}
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-gray-300/20"></div>
                
                {/* Status text positioned in corner */}
                <div className="absolute top-2 right-2 transform rotate-45 origin-center">
                  <span className="text-[13px] font-black text-gray-300 uppercase tracking-wider drop-shadow-[0_2px_6px_rgba(156,163,175,0.8)]">DONE</span>
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Contest Description - aligned to top - Mobile Responsive */}
        <div className="relative py-0 flex flex-col justify-start min-h-[3.5rem] sm:min-h-[4.5rem]">
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
                      <span className="text-xs font-bold text-red-400 uppercase">Contest Cancelled</span>
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
                className="text-xs sm:text-sm text-gray-500/40 line-clamp-3 sm:line-clamp-4 min-h-[3.5rem] sm:min-h-[4.5rem]"
                title={contest.description}
              >
                {contest.description || "No description available"}
              </p>

            </div>
          ) : (
            <p
              className="text-xs sm:text-sm text-gray-300 line-clamp-3 sm:line-clamp-4 italic font-medium tracking-wide text-left border-l-2 border-gray-600/50 pl-3 py-1 bg-gradient-to-r from-gray-900/20 to-transparent min-h-[3.5rem] sm:min-h-[4.5rem]"
              title={contest.description}
              style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
            >
              {contest.description || "No description available"}
            </p>
          )}
        </div>

        {/* Prize Pool Thermometer - All-in-One Visualization */}
        <div className="relative bg-dark-300/30 rounded-lg p-4 mt-2 mb-3 border border-dark-400/50 overflow-hidden">
          {Number(contest.entry_fee) === 0 ? (
            /* For FREE contests - matching paid contest layout */
            <div className="space-y-3">
              {/* Top: Entry fee and Max Prize - matching paid layout */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Entry:</span>
                  <span className="text-gray-300">0</span>
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                  <span className="text-xs font-bold text-green-400 uppercase ml-1">FREE</span>
                </div>
                <div className="flex items-center gap-1">
                  {contest.prize_pool && Number(contest.prize_pool) > 0 ? (
                    <>
                      <span className="text-amber-300/60">Prize Pool:</span>
                      <span className="font-bold text-amber-300">
                        {formatCurrency(Number(contest.prize_pool)).replace(' SOL', '')}
                      </span>
                      <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">Bragging rights only</span>
                  )}
                </div>
              </div>

              {/* Thermometer Container - participant progress */}
              <div className="relative h-12 bg-dark-500/40 rounded-lg overflow-hidden border border-white/10">
                {/* Background gradient */}
                <div className={`absolute inset-0 ${
                  displayStatus === "cancelled"
                    ? "bg-gradient-to-r from-red-900/20 via-red-800/20 to-red-700/20"
                    : "bg-gradient-to-r from-green-900/20 via-green-800/20 to-green-700/20"
                }`}></div>
                
                {/* Filled portion representing participants */}
                <motion.div
                  className={`absolute inset-y-0 left-0 ${
                    displayStatus === "active" 
                      ? "bg-gradient-to-r from-green-500 via-green-400 to-green-500" 
                      : displayStatus === "pending"
                      ? "bg-gradient-to-r from-green-400 via-green-300 to-green-400"
                      : displayStatus === "cancelled"
                      ? "bg-gradient-to-r from-red-500 via-red-400 to-red-500"
                      : "bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500"
                  }`}
                  initial={{ width: "0%" }}
                  animate={{ 
                    width: `${Math.min((contest.participant_count / contest.max_participants) * 100, 100)}%` 
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  {/* Shimmer effect for active contests */}
                  {displayStatus === "active" && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
                    </div>
                  )}
                </motion.div>

                {/* Participant count display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`px-3 py-1 rounded-md ${
                    contest.participant_count > 0 ? 'bg-dark-900/80 backdrop-blur-sm' : ''
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${displayStatus === "cancelled" ? "text-red-400" : "text-gray-100"}`}>
                        {contest.participant_count}/{contest.max_participants} players
                      </span>
                      {contest.participant_count === contest.max_participants && (
                        <span className="text-xs font-bold text-green-400 uppercase ml-2">FULL!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scale markers */}
                <div className="absolute inset-0 flex justify-between px-1">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-px h-full bg-black/10"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* For PAID contests - thermometer visualization */
            <div className="space-y-3">
              {/* Top: Max Prize Pool */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Entry:</span>
                  <span className="text-gray-300">{formatCurrency(Number(contest.entry_fee)).replace(' SOL', '')}</span>
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-300/60">Max Prize:</span>
                  <span className="font-bold text-amber-300">
                    {formatCurrency(Number(contest.entry_fee) * contest.max_participants).replace(' SOL', '')}
                  </span>
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                </div>
              </div>

              {/* Thermometer Container */}
              <div className="relative h-12 bg-dark-500/40 rounded-lg overflow-hidden border border-white/10">
                {/* Background gradient */}
                <div className={`absolute inset-0 ${
                  displayStatus === "cancelled"
                    ? "bg-gradient-to-r from-red-900/20 via-red-800/20 to-red-700/20"
                    : "bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-amber-900/20"
                }`}></div>
                
                {/* Filled portion representing current prize pool */}
                <motion.div
                  className={`absolute inset-y-0 left-0 ${
                    displayStatus === "active" 
                      ? "bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500" 
                      : displayStatus === "pending"
                      ? "bg-gradient-to-r from-blue-400 via-purple-400 to-amber-400"
                      : displayStatus === "cancelled"
                      ? "bg-gradient-to-r from-red-500 via-red-400 to-red-500"
                      : "bg-gradient-to-r from-gray-500 via-gray-400 to-gray-500"
                  }`}
                  initial={{ width: "0%" }}
                  animate={{ 
                    width: `${Math.min((contest.participant_count / contest.max_participants) * 100, 100)}%` 
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  {/* Shimmer effect for active contests */}
                  {displayStatus === "active" && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer"></div>
                    </div>
                  )}
                </motion.div>

                {/* Current prize pool display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`px-3 py-1 rounded-md ${
                    contest.participant_count > 0 ? 'bg-dark-900/80 backdrop-blur-sm' : ''
                  }`}>
                    <div className="flex items-center gap-2">
                      {contest.participant_count > 0 && (
                        <>
                          <div className="flex items-center gap-1">
                            <span className={`text-lg font-bold ${displayStatus === "cancelled" ? "text-red-400" : "text-white"}`}>
                              {formatCurrency(Number(contest.entry_fee) * contest.participant_count).replace(' SOL', '')}
                            </span>
                            <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-4 h-4" />
                          </div>
                          <span className={`text-xs ${displayStatus === "cancelled" ? "text-red-400" : "text-gray-400"}`}>
                            ({contest.participant_count}/{contest.max_participants})
                          </span>
                        </>
                      )}
                      {contest.participant_count === 0 && (
                        <span className={`text-sm ${displayStatus === "cancelled" ? "text-red-400" : "text-gray-500"}`}>
                          {displayStatus === "cancelled" ? 
                            `0/${contest.max_participants} players` : 
                            `${contest.max_participants} spots available`
                          }
                        </span>
                      )}
                      {contest.participant_count === contest.max_participants && (
                        <span className="text-xs font-bold text-green-400 uppercase ml-2">FULL!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scale markers */}
                <div className="absolute inset-0 flex justify-between px-1">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="w-px h-full bg-black/10"></div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Animation for shimmer effect */}
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%) skewX(-12deg); }
            100% { transform: translateX(200%) skewX(-12deg); }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>

      {/* Edge-to-edge button container */}
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
    </div> 
  );
};

export default ContestCard;
