import { motion } from "framer-motion";
import React, { useRef, useState } from "react";

import { getContestImageUrl } from "../../lib/imageUtils";
import { cn, formatCurrency } from "../../lib/utils";
import { Contest, ContestStatus } from "../../types/index";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ContestButton } from "../landing/contests-preview/ContestButton";
import { CountdownTimer } from "../ui/CountdownTimer";
import { ShareContestButton } from "./ShareContestButton";

// Global cache to prevent repeated 404 warnings for the same URLs
const warned404URLs = new Set<string>();

// Clear cache on page unload to prevent memory buildup
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    warned404URLs.clear();
  });
}

interface ProminentContestCardProps {
  contest: Contest;
  onClick?: () => void;
  featuredLabel?: string;
  className?: string;
}

export const ProminentContestCard: React.FC<ProminentContestCardProps> = ({
  contest,
  onClick,
  featuredLabel = "🏆 CONTEST OF THE WEEK",
  className
}) => {
  // TODO: Component needs cleanup:
  // - Make action buttons (Details, Enter, Share) more uniform in size/style
  // - Further reduce height to better match regular cards
  // - Consider responsive adjustments for mobile
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageBlurhash, setImageBlurhash] = useState(false);
  
  // Mouse position tracking for enhanced parallax effect
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
  
  // Mouse move handler for enhanced parallax effect
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
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn("group relative bg-gradient-to-br from-dark-200/90 via-dark-200/95 to-dark-300/90 backdrop-blur-md border-2 border-brand-400/30 hover:border-brand-400/60 transform transition-all duration-500 hover:scale-[1.02] rounded-xl overflow-hidden w-full max-w-full cursor-pointer", className)}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ 
        boxShadow: "0 25px 50px -12px rgba(153, 51, 255, 0.25), 0 0 30px rgba(153, 51, 255, 0.1)",
        transition: { duration: 0.3 }
      }}
    >
      {/* Enhanced Glow Effects */}
      <div className="absolute -inset-[2px] bg-gradient-to-r from-brand-400/20 via-purple-500/20 to-brand-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400/30 via-purple-500/30 to-brand-600/30 rounded-xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute inset-0 opacity-30">
          {/* Dynamic grid pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(153, 51, 255, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(153, 51, 255, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px'
            }}
          />
          
          {/* Animated energy waves */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-400/5 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-400/5 to-transparent"
            animate={{ y: ["-100%", "100%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 1 }}
          />
        </div>
      </div>

      {/* Contest Image with Enhanced Parallax Effect */}
      {getContestImageUrl(contest.image_url) && (
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          {/* Loading state */}
          {!imageLoaded && !imageError && !imageBlurhash && (
            <div className="absolute inset-0 flex items-center justify-center bg-dark-300/50 z-10">
              <LoadingSpinner size="lg" />
            </div>
          )}
          
          {/* Progressive loading effect */}
          {!imageLoaded && !imageError && (
            <motion.div
              initial={{ opacity: 0, filter: "blur(30px)" }}
              animate={{ opacity: 0.2, filter: "blur(15px)" }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 bg-gradient-to-br from-dark-300 to-dark-400"
              onAnimationComplete={() => setImageBlurhash(true)}
            />
          )}
          
          {/* Actual image with enhanced parallax */}
          {!imageError && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={imageLoaded ? { opacity: 0.25 } : { opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
              style={{ 
                perspective: "1500px",
                perspectiveOrigin: "center"
              }}
            >
              <motion.div
                style={{
                  width: "100%",
                  height: "100%",
                  transform: isHovering ? 
                    `scale(1.15) translateX(${mousePosition.x * 15}px) translateY(${mousePosition.y * 15}px) rotateX(${mousePosition.y * 2}deg) rotateY(${mousePosition.x * 2}deg)` : 
                    "scale(1.08)",
                  transition: "transform 0.4s ease-out"
                }}
              >
                <motion.img
                  src={getContestImageUrl(contest.image_url)}
                  alt={contest.name}
                  onLoad={() => {
                    setTimeout(() => setImageLoaded(true), 200);
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
                  initial={{ scale: 1.3, filter: "blur(12px)" }}
                  animate={{ filter: "blur(0px)" }}
                  transition={{ filter: { duration: 1.5 } }}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              
              {/* Enhanced gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-200/95 via-dark-200/85 to-dark-200/40" />
              <div className="absolute inset-0 bg-gradient-to-br from-brand-900/20 via-transparent to-purple-900/20" />
            </motion.div>
          )}
        </div>
      )}
      
      {/* Fallback background for cards without images */}
      {!getContestImageUrl(contest.image_url) && (
        <div className="absolute inset-0 bg-gradient-to-br from-dark-300/60 to-dark-400/60 rounded-xl" />
      )}

      {/* Featured Label Banner */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <motion.div
          className="relative bg-gradient-to-r from-brand-500 via-purple-500 to-brand-600 text-white text-center py-3 px-6 rounded-t-xl"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Banner glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-brand-400 via-purple-400 to-brand-600 rounded-t-xl blur-sm opacity-50" />
          
          {/* Banner content */}
          <div className="relative z-10 flex items-center justify-center gap-2">
            <motion.span
              className="text-lg font-black uppercase tracking-wider"
              animate={{ 
                textShadow: [
                  "0 0 10px rgba(255,255,255,0.3)",
                  "0 0 20px rgba(255,255,255,0.5)",
                  "0 0 10px rgba(255,255,255,0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {featuredLabel}
            </motion.span>
          </div>
          
          {/* Animated shine effect */}
          <motion.div 
            className="absolute inset-0 overflow-hidden rounded-t-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="w-[30%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ["-30%", "130%"] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Enhanced Status Indicator */}
      <div className="absolute top-14 right-4 z-30">
        {displayStatus === "active" && (
          <motion.div 
            className="relative overflow-hidden backdrop-blur-md rounded-lg border border-green-400/50 bg-dark-200/60"
            initial={{ scale: 0, rotate: 45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 via-brand-500/30 to-green-500/30" />
            <div className="absolute -inset-[1px] rounded-lg blur-sm bg-gradient-to-r from-green-400/50 via-brand-400/50 to-green-400/50" />
            
            <div className="relative flex items-center gap-2 px-4 py-2">
              <span className="relative flex h-3 w-3">
                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
                <span className="relative rounded-full w-3 h-3 bg-green-400" />
              </span>
              <span className="text-sm font-bold text-green-300 uppercase tracking-wide">LIVE NOW</span>
            </div>
          </motion.div>
        )}
        
        {displayStatus === "pending" && (
          <motion.div 
            className="relative overflow-hidden backdrop-blur-md rounded-lg border border-blue-400/50 bg-dark-200/60"
            initial={{ scale: 0, rotate: 45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-brand-500/30 to-blue-500/30" />
            <div className="absolute -inset-[1px] rounded-lg blur-sm bg-gradient-to-r from-blue-400/50 via-brand-400/50 to-blue-400/50" />
            
            <div className="relative flex items-center gap-2 px-4 py-2">
              <motion.svg 
                className="w-4 h-4 text-blue-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </motion.svg>
              <span className="text-sm font-bold text-blue-300 uppercase tracking-wide">SOON</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="relative p-6 pt-16 space-y-4 z-20">
        {/* Title and Timer Section */}
        <div className="space-y-3">
          <motion.h2
            className="text-3xl md:text-4xl font-black text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              textShadow: "0 0 20px rgba(153, 51, 255, 0.5), 0 2px 4px rgba(0,0,0,0.8)"
            }}
          >
            {contest.name}
          </motion.h2>
          
          <motion.div
            className="flex items-center gap-2 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <span className="text-gray-400">
              {hasEnded ? "Contest Ended" : hasStarted ? "Ends in" : "Starts in"}
            </span>
            <span className="text-xl font-bold text-white">
              <CountdownTimer
                targetDate={hasStarted ? contest.end_time : contest.start_time}
                onComplete={() => console.log("Prominent timer completed")}
                showSeconds={true}
              />
            </span>
          </motion.div>
        </div>

        {/* Description */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-lg text-gray-300 leading-relaxed max-w-2xl">
            {contest.description || "An epic trading competition awaits. Join the battle and prove your trading prowess."}
          </p>
        </motion.div>

        {/* Compact Stats Row */}
        <motion.div
          className="flex flex-wrap gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          {/* Entry Fee */}
          <div className="flex-1 min-w-[150px] bg-dark-300/40 backdrop-blur-sm rounded-lg px-4 py-3 border border-blue-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-medium text-blue-300 uppercase tracking-wide">Entry</span>
              <span className="text-xl font-bold text-white">{formatCurrency(Number(contest.entry_fee))}</span>
            </div>
          </div>

          {/* Prize Pool */}
          <div className="flex-1 min-w-[200px] bg-dark-300/40 backdrop-blur-sm rounded-lg px-4 py-3 border border-brand-400/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-medium text-brand-300 uppercase tracking-wide">Prize</span>
              <span className="text-2xl font-bold text-brand-300">
                {formatCurrency(Number(contest.total_prize_pool || contest.prize_pool || "0"))}
              </span>
            </div>
            
            {/* Prize pool shine effect */}
            <motion.div 
              className="absolute inset-0 overflow-hidden rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div 
                className="w-[30%] h-full bg-gradient-to-r from-transparent via-brand-400/20 to-transparent"
                animate={{ x: ["-30%", "130%"] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            </motion.div>
          </div>

          {/* Players */}
          <div className="flex-1 min-w-[150px] bg-dark-300/40 backdrop-blur-sm rounded-lg px-4 py-3 border border-green-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-green-300 uppercase tracking-wide">Players</span>
                <span className="text-lg font-bold text-white">
                  {contest.participant_count}/{contest.max_participants}
                </span>
              </div>
              <div className="w-full bg-dark-400 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-brand-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(contest.participant_count / contest.max_participants) * 100}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
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
          
          <ShareContestButton 
            contestId={contest.id.toString()} 
            contestName={contest.name}
            status={displayStatus}
          />
        </motion.div>

        {/* Contest Code */}
        <div className="absolute bottom-4 right-6">
          <p className="text-xs text-gray-500 font-mono">{contest.contest_code}</p>
        </div>
      </div>

      {/* Enhanced Hover Effects */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-brand-400/0 via-brand-400/0 to-purple-500/0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
        animate={isHovering ? {
          background: [
            "linear-gradient(135deg, rgba(153,51,255,0) 0%, rgba(153,51,255,0) 50%, rgba(128,0,255,0) 100%)",
            "linear-gradient(135deg, rgba(153,51,255,0.1) 0%, rgba(153,51,255,0.05) 50%, rgba(128,0,255,0.1) 100%)",
            "linear-gradient(135deg, rgba(153,51,255,0) 0%, rgba(153,51,255,0) 50%, rgba(128,0,255,0) 100%)"
          ]
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.div>
  );
};