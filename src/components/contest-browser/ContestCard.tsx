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

  // Determine if dual buttons will be shown
  // const isUpcomingNotEntered = displayStatus === "pending" && !contest.is_participating;
  // const showDualButtons = isUpcomingNotEntered || displayStatus === "completed";

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
      {/* Contest Image with Parallax Effect */}
      {getContestImageUrl(contest.image_url) && (
        <div className="absolute inset-0 overflow-hidden">
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
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-gradient-to-br from-dark-300 to-dark-400"
              onAnimationComplete={() => setImageBlurhash(true)}
            />
          )}
          
          {/* Actual image with parallax effect */}
          {!imageError && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={imageLoaded ? { opacity: 0.15 } : { opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
              style={{ 
                // Subtle 3D rotation based on mouse position
                perspective: "1000px",
                perspectiveOrigin: "center"
              }}
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
                <motion.img
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
                    target.src = '/images/contests/placeholder.png';
                    setImageError(true);
                  }}
                  initial={{ scale: 1.2, filter: "blur(8px)" }}
                  animate={{ filter: "blur(0px)" }}
                  transition={{ filter: { duration: 1.2 } }}
                  className="w-full h-full"
                  style={{ 
                    objectFit: 'cover',
                    objectPosition: 'center center',
                    minWidth: '100%',
                    width: '100%',
                    height: 'auto'
                  }}
                />
              </motion.div>
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-dark-200/95 to-transparent" />
            </motion.div>
          )}
        </div>
      )}
      
      {/* Fallback background for cards without images */}
      {!getContestImageUrl(contest.image_url) && (
        <div className="absolute inset-0 bg-gradient-to-br from-dark-300/50 to-dark-400/50" />
      )}

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 via-white/0 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream-responsive" />

      {/* Glow effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Enhanced Header with Banner Style - Mobile Responsive */}
      <div className="relative px-4 pt-4 pb-14 sm:px-6 sm:pt-6 sm:pb-14 space-y-2">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
          <div className="space-y-0.5 flex-1 min-w-0 mb-2 sm:mb-0">
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
            <p className="text-sm font-medium text-brand-300 text-left">
              {hasEnded ? (
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

          {/* No separate badge needed - now integrated into button */}

          {/* Share button - top right but below status indicator */}
          <div className="absolute top-16 right-1 z-30 opacity-70 hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const shareUrl = `${window.location.origin}/contests/${contest.id.toString()}`;
                navigator.clipboard.writeText(shareUrl);
              }}
              className="p-1.5 text-brand-300 hover:text-brand-400 transition-colors"
              title="Share contest"
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
                
                {/* Shimmer animation */}
                <div className="absolute top-0 right-0 w-0 h-0 border-l-[70px] border-l-transparent border-t-[70px] border-t-blue-300/20 animate-shimmer"></div>
                
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
        <div className="relative py-0 flex flex-col justify-start min-h-[2.5rem] sm:min-h-[3rem]">
          {displayStatus === "cancelled" && contest.cancellation_reason ? (
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
                      {contest.cancellation_reason.charAt(0).toUpperCase() + 
                       contest.cancellation_reason.slice(1).toLowerCase()}
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
          ) : (
            <p
              className="text-xs sm:text-sm text-gray-300 line-clamp-2 italic font-medium tracking-wide text-left border-l-2 border-gray-600/50 pl-3 py-1 bg-gradient-to-r from-gray-900/20 to-transparent min-h-[2.5rem] sm:min-h-[3rem]"
              title={contest.description}
              style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
            >
              {contest.description || "No description available"}
            </p>
          )}
        </div>

        {/* Entry Fee and Prize Pool - Clean Typography Layout */}
        <div className="space-y-4 mt-2 mb-3">
          {/* Entry Fee */}
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium text-blue-300 uppercase tracking-wider">Entry Fee</span>
            <div className="flex items-center gap-2">
              {Number(contest.entry_fee) === 0 ? (
                <span className="text-xl font-bold text-green-400 uppercase tracking-wide">FREE</span>
              ) : (
                <>
                  <span className={`text-xl font-bold ${displayStatus === "cancelled" ? "text-gray-500" : "text-blue-300"} tracking-tight`}>
                    {formatCurrency(Number(contest.entry_fee)).replace(' SOL', '')}
                  </span>
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-5 h-5" />
                </>
              )}
            </div>
          </div>
          
          {/* Prize Pool */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-amber-300 uppercase tracking-wider">Prize Pool</span>
              {/* Info icon with hover trigger */}
              {Number(contest.entry_fee) > 0 && (
                <div className="relative group/tooltip" style={{isolation: 'isolate'}}>
                  <svg className="w-3 h-3 text-purple-400/70 hover:text-purple-300/90 transition-colors cursor-help" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  
                  {/* Tooltip - uses transform to break out of card stacking context */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none" style={{zIndex: 9999, position: 'absolute', transform: 'translateX(-50%) translateY(-100%) translateZ(0)'}}>
                    <div className="bg-dark-200/95 backdrop-blur-sm border border-brand-500/20 rounded-lg px-3 py-2 text-xs text-gray-300 whitespace-nowrap shadow-2xl">
                      <div className="relative">
                        <span className="block font-medium text-brand-300 mb-1">Maximum Prize Pool</span>
                        <span className="block">with a full roster of competitors.</span>
                        <span className="block">The more players, the bigger the rewards!</span>
                      </div>
                      {/* Arrow pointing down */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-dark-200/95"></div>
                        <div className="absolute -top-[7px] -left-[6px] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-brand-500/20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Visual multiplier - now on the left and subtle */}
              {displayStatus !== "cancelled" && Number(contest.entry_fee) > 0 && (
                <span className="text-sm text-amber-500/60 mr-1">
                  ({contest.max_participants}x)
                </span>
              )}
              <span className={`text-2xl font-bold ${displayStatus === "cancelled" ? "text-gray-500" : "text-amber-300"} tracking-tight`}>
                {formatCurrency(
                  Number(contest.entry_fee) > 0 
                    ? Number(contest.entry_fee) * contest.max_participants
                    : Number(contest.prize_pool || "0")
                ).replace(' SOL', '')}
              </span>
              <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Players Progress with enhanced styling */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Competition</span>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-400/30 to-transparent"></div>
          </div>
          
          {/* Enhanced Progress Bar with Text Inside */}
          <div className={`relative h-7 rounded-full overflow-hidden group border backdrop-blur-sm ${
            displayStatus === "cancelled" 
              ? "bg-gray-900/40 border-gray-500/30" 
              : displayStatus === "active"
              ? "bg-gray-900/40 border-green-500/30"
              : displayStatus === "pending"
              ? "bg-gray-900/40 border-blue-500/30"
              : displayStatus === "completed"
              ? "bg-gray-900/40 border-gray-500/30"
              : "bg-gray-900/40 border-gray-500/30"
          }`}>
            {/* Background with inner shadow */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-gray-900/80 to-black/60 rounded-full">
              <div className="absolute inset-0 shadow-inner rounded-full"></div>
            </div>
            
            {/* Progress fill */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-500 ease-out ${
                displayStatus === "cancelled" 
                  ? "bg-gray-500/60" 
                  : displayStatus === "active"
                  ? "bg-gradient-to-r from-green-600/90 via-green-500 to-green-600/90"
                  : displayStatus === "pending"
                  ? "bg-gradient-to-r from-blue-600/90 via-blue-500 to-blue-600/90"
                  : displayStatus === "completed"
                  ? "bg-gradient-to-r from-gray-600/90 via-gray-500 to-gray-600/90"
                  : "bg-gradient-to-r from-gray-500/90 via-gray-400 to-gray-500/90"
              }`}
              style={{
                width: `${(contest.participant_count / contest.max_participants) * 100}%`,
              }}
            >
              {/* Animated shine on progress bar */}
              {displayStatus !== "cancelled" && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-full"></div>
              )}
            </div>
            
            {/* Text inside progress bar */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold tracking-wide drop-shadow-lg ${displayStatus === "cancelled" ? "text-gray-400" : "text-white"}`} style={{textShadow: '1px 0 0 black, -1px 0 0 black, 0 1px 0 black, 0 -1px 0 black'}}>
                {contest.participant_count}/{contest.max_participants}
              </span>
            </div>
          </div>
          
          {/* Status indicator - only for special statuses */}
          {(contest.participant_count === contest.max_participants || contest.participant_count > contest.max_participants * 0.8) && (
            <div className="text-center">
              {contest.participant_count === contest.max_participants ? (
                <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Contest Full</span>
              ) : (
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Filling Fast</span>
              )}
            </div>
          )}
        </div>

        {/* Action button - now full width */}
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
