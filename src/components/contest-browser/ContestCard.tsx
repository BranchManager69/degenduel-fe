import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

import { formatCurrency } from "../../lib/utils";
import { Contest, ContestStatus } from "../../types/index";
import { ContestButton } from "../landing/contests-preview/ContestButton";
import { ContestDifficulty } from "../landing/contests-preview/ContestDifficulty";
import { CountdownTimer } from "../ui/CountdownTimer";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ShareContestButton } from "./ShareContestButton";

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

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative bg-dark-200/80 backdrop-blur-sm border border-dark-300 hover:border-brand-400/20 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-brand-500/10 rounded-lg overflow-hidden w-full max-w-full"
    >
      {/* Contest Image with Parallax Effect */}
      {contest.image_url && (
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
                  src={contest.image_url}
                  alt={contest.name}
                  onLoad={() => {
                    // Small delay for smoother transition from placeholder
                    setTimeout(() => setImageLoaded(true), 100);
                  }}
                  onError={() => {
                    console.error(`Failed to load image: ${contest.image_url}`);
                    setImageError(true);
                  }}
                  initial={{ scale: 1.2, filter: "blur(8px)" }}
                  animate={{ filter: "blur(0px)" }}
                  transition={{ filter: { duration: 1.2 } }}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-dark-200/95 to-transparent" />
            </motion.div>
          )}
        </div>
      )}
      
      {/* Fallback background for cards without images */}
      {!contest.image_url && (
        <div className="absolute inset-0 bg-gradient-to-br from-dark-300/50 to-dark-400/50" />
      )}

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 via-white/0 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />

      {/* Glow effect */}
      <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Enhanced Header with Banner Style - Mobile Responsive */}
      <div className="relative p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
          <div className="space-y-1.5 flex-1 min-w-0 mb-2 sm:mb-0">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-100 truncate pr-2 group-hover:text-brand-300 transition-colors hover:text-brand-400 cursor-pointer">
              {contest.name}
            </h3>
            <p className="text-sm font-medium text-brand-300">
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

          {/* Enhanced Status Indicators - Styled like ContestButton */}
          <div className="absolute top-2 right-2 z-20">
            {/* Live Indicator with glow effect */}
            {displayStatus === "active" && (
              <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-green-500/30 group">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-brand-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Animated border glow */}
                <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-green-500/30 via-brand-500/30 to-green-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Badge content */}
                <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
                    <span className="relative rounded-full w-2 h-2 bg-green-400"></span>
                  </span>
                  <span className="text-xs font-bold text-green-400 uppercase tracking-wide font-cyber">LIVE</span>
                </div>
              </div>
            )}
            
            {/* Upcoming Indicator with glow effect */}
            {displayStatus === "pending" && (
              <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-blue-500/30 group">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-brand-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Animated border glow */}
                <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-blue-500/30 via-brand-500/30 to-blue-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Badge content */}
                <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                  <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wide font-cyber">SOON</span>
                </div>
              </div>
            )}
            
            {/* Completed Indicator with glow effect */}
            {displayStatus === "completed" && (
              <div className="relative overflow-hidden backdrop-blur-sm rounded-md border border-gray-500/30 group">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-500/20 via-brand-500/20 to-gray-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Animated border glow */}
                <div className="absolute -inset-[1px] rounded-md blur-sm bg-gradient-to-r from-gray-500/30 via-brand-500/30 to-gray-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Badge content */}
                <div className="relative flex items-center gap-1.5 px-3 py-1 bg-dark-200/40">
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide font-cyber">ENDED</span>
                </div>
              </div>
            )}
            
            {/* Removed Cancelled Indicator from top corner since we now have the stamp */}
          </div>
        </div>

        {/* Contest Description - aligned to top - Mobile Responsive */}
        <div className="relative py-2 flex flex-col justify-start h-[48px] sm:h-[60px]">
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
                className="text-xs sm:text-sm text-gray-500/40 line-clamp-2 sm:line-clamp-3"
                title={contest.description}
              >
                {contest.description || "No description available"}
              </p>
            </div>
          ) : (
            <p
              className="text-xs sm:text-sm text-gray-400 line-clamp-2 sm:line-clamp-3"
              title={contest.description}
            >
              {contest.description || "No description available"}
            </p>
          )}
        </div>

        {/* Entry Fee and Prize Pool with modern, visually connected design */}
        <div className="relative mt-2 mb-3">
          {/* Visual comparison container */}
          <div className="flex flex-col space-y-4">
            {/* Entry Fee Section - More understated */}
            <div className="flex items-center">
              <div className="w-24 flex-shrink-0">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Entry Fee</span>
              </div>
              <div className="flex-1 ml-3">
                <div className="relative h-11 rounded-md overflow-hidden bg-dark-300/40 backdrop-blur-sm flex items-center">
                  {/* Inner content */}
                  <div className="absolute inset-y-0 left-0 bg-blue-500/10" 
                       style={{ 
                         width: `${Math.min(100, (Number(contest.entry_fee) / Number(contest.prize_pool)) * 100)}%` 
                       }}>
                    {/* Subtle pulse animation */}
                    <div className="absolute inset-0 bg-blue-400/5 animate-pulse-slow"></div>
                  </div>
                  
                  {/* The value */}
                  <div className="relative z-10 px-3 py-2 flex items-center">
                    <span className={`text-xl font-bold ${displayStatus === "cancelled" ? "text-gray-500" : "text-blue-300"}`}>
                      {formatCurrency(Number(contest.entry_fee))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Prize Pool Section - More prominent */}
            <div className="flex items-center">
              <div className="w-24 flex-shrink-0">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">Prize Pool</span>
              </div>
              <div className="flex-1 ml-3">
                <div className="relative h-14 rounded-md overflow-hidden bg-dark-300/40 backdrop-blur-sm flex items-center">
                  {/* Background fill - always full width */}
                  <div className="absolute inset-y-0 left-0 right-0 bg-brand-600/20">
                    {/* Subtle shine animation */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-brand-400/40 to-transparent -translate-x-full animate-shine-slow"></div>
                    </div>
                  </div>
                  
                  {/* The value */}
                  <div className="relative z-10 px-3 py-2 flex items-center justify-between w-full">
                    <span className={`text-2xl font-bold ${displayStatus === "cancelled" ? "text-gray-500" : "text-brand-300"}`}>
                      {formatCurrency(Number(contest.prize_pool))}
                    </span>
                    
                    {/* Visual multiplier */}
                    {displayStatus !== "cancelled" && Number(contest.entry_fee) > 0 && (
                      <span className="text-sm font-mono text-gray-400 mr-3">
                        {(Number(contest.prize_pool) / Number(contest.entry_fee)).toFixed(1)}x
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connecting line element */}
          <div className="absolute left-24 top-[2.75rem] bottom-[2.75rem] w-px bg-gradient-to-b from-blue-500/30 via-brand-500/30 to-brand-500/30"></div>
        </div>

        {/* Players Progress with enhanced styling */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Players</span>
            <span className={`text-sm font-medium ${displayStatus === "cancelled" ? "text-gray-500" : "text-gray-300"}`}>
              {contest.participant_count}/{contest.max_participants}
            </span>
          </div>
          <div className="relative h-2 bg-dark-300 rounded-full overflow-hidden">
            <div
              className={`absolute inset-0 rounded-full transition-all duration-300 ease-out ${
                displayStatus === "cancelled" 
                  ? "bg-gray-500/50" 
                  : "bg-gradient-to-r from-brand-400 to-brand-600"
              }`}
              style={{
                width: `${
                  (Number(contest.participant_count) /
                    contest.max_participants) *
                  100
                }%`,
              }}
            >
              {displayStatus !== "cancelled" && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              )}
            </div>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex gap-2">
          {/* Main action button */}
          <div className="flex-1">
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
          
          {/* Share button - available for all contest statuses */}
          <ShareContestButton 
            contestId={contest.id.toString()} 
            contestName={contest.name}
            status={displayStatus}
          />
        </div>

        {/* Reference code in bottom right corner */}
        <div className="absolute bottom-1.5 right-2">
          <p className="text-[10px] text-gray-500">{contest.contest_code}</p>
        </div>

        {/* Prize distribution as an expandable drawer at bottom
            Note: ContestDifficulty is misnamed - it actually displays prize distribution.
            This component shows the 69/20/11 split for prizes. See GitHub issue for renaming task. */}
        <ContestDifficulty
          prize_pool={contest.prize_pool}
          participant_count={contest.participant_count}
          max_participants={contest.max_participants}
          isCancelled={displayStatus === "cancelled"}
        />
      </div>
    </div>
  );
};
