import { motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { getContestImageUrl } from "../../lib/imageUtils";
import { cn, formatCurrency } from "../../lib/utils";
import { Contest, ContestStatus } from "../../types/index";
import { ContestButton } from "../landing/contests-preview/ContestButton";
import { CountdownTimer } from "../ui/CountdownTimer";
import { ShareContestButton } from "./ShareContestButton";
import { useStore } from "../../store/useStore";

// Global cache to prevent repeated 404 warnings for the same URLs
const warned404URLs = new Set<string>();

// Clear cache on page unload to prevent memory buildup
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    warned404URLs.clear();
  });
}

// Throttle function for performance
function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let lastCall = 0;
  let timeout: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
        timeout = null;
      }, delay - (now - lastCall));
    }
  }) as T;
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
  // Performance mode from store
  const performanceMode = useStore(state => state.performanceMode);
  
  // State management
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Mouse position tracking for parallax effect (disabled in performance mode)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const isInViewport = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

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
  
  // Lazy loading setup with Intersection Observer
  useEffect(() => {
    if (!cardRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isInViewport.current = true;
            // Load image when in viewport
            if (cardRef.current) {
              cardRef.current.classList.add('in-viewport');
            }
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    
    observerRef.current.observe(cardRef.current);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  // Throttled mouse move handler for parallax effect
  const handleMouseMoveInternal = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || performanceMode) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    setMousePosition({ x, y });
  }, [performanceMode]);
  
  // Throttle mouse move to 60fps (16ms)
  const handleMouseMove = useCallback(
    throttle(handleMouseMoveInternal, 16),
    [handleMouseMoveInternal]
  );
  
  // Mouse enter/leave handlers
  const handleMouseEnter = useCallback(() => {
    if (!performanceMode) {
      setIsHovering(true);
    }
  }, [performanceMode]);
  
  const handleMouseLeave = useCallback(() => {
    if (!performanceMode) {
      setIsHovering(false);
      setMousePosition({ x: 0, y: 0 });
    }
  }, [performanceMode]);

  return (
    <div className="relative">
      <motion.div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={!performanceMode ? handleMouseMove : undefined}
        onMouseEnter={!performanceMode ? handleMouseEnter : undefined}
        onMouseLeave={!performanceMode ? handleMouseLeave : undefined}
        className={cn(
          "group relative bg-gradient-to-br from-dark-200/90 via-purple-900/20 to-dark-300/90 backdrop-blur-md border-2 border-purple-800/60 hover:border-purple-700/80 transform transition-all duration-500 hover:scale-[1.02] rounded-xl overflow-visible w-full max-w-full cursor-pointer",
          "will-change-transform", // GPU acceleration
          className
        )}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={!performanceMode ? { 
          boxShadow: "0 25px 50px -12px rgba(153, 51, 255, 0.25), 0 0 30px rgba(153, 51, 255, 0.1)",
          transition: { duration: 0.3 }
        } : undefined}
        style={{
          transform: performanceMode ? undefined : 'translateZ(0)', // Force GPU layer
        }}
      >
      {/* Simplified Glow Effects - only on hover, reduced layers */}
      {!performanceMode && (
        <div className="absolute -inset-[1px] bg-gradient-to-r from-amber-400/20 via-purple-500/15 to-amber-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* Simplified Background Pattern - static in performance mode */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute inset-0 opacity-20">
          {/* Static grid pattern */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(153, 51, 255, 0.05) 1px, transparent 1px)`,
              backgroundSize: '32px 32px'
            }}
          />
          
          {/* Single animated wave - CSS animation instead of Framer Motion */}
          {!performanceMode && (
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-500/5 to-transparent animate-slide-x"
              style={{
                willChange: 'transform',
              }}
            />
          )}
        </div>
      </div>

      {/* Contest Image with Optimized Loading */}
      {getContestImageUrl(contest.image_url) && isInViewport.current && (
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          {/* Simple loading placeholder */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-dark-300/30 animate-pulse" />
          )}
          
          {/* Optimized image with simplified parallax */}
          {!imageError && (
            <div 
              className="absolute inset-0 transition-opacity duration-700"
              style={{ 
                opacity: imageLoaded ? 0.25 : 0,
                willChange: 'opacity'
              }}
            >
              <div
                className="w-full h-full transition-transform duration-300 ease-out"
                style={{
                  transform: !performanceMode && isHovering ? 
                    `scale(1.1) translateX(${mousePosition.x * 10}px) translateY(${mousePosition.y * 10}px)` : 
                    "scale(1.05)",
                  willChange: 'transform'
                }}
              >
                <img
                  src={getContestImageUrl(contest.image_url)}
                  alt={contest.name}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    const url = getContestImageUrl(contest.image_url);
                    if (url && !warned404URLs.has(url)) {
                      console.warn(`Contest image not found: ${url}`);
                      warned404URLs.add(url);
                    }
                    const target = e.target as HTMLImageElement;
                    target.src = '/images/contests/placeholder.png';
                    setImageError(true);
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Simplified gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-200/90 via-dark-200/70 to-transparent" />
            </div>
          )}
        </div>
      )}
      
      {/* Fallback background for cards without images */}
      {!getContestImageUrl(contest.image_url) && (
        <div className="absolute inset-0 bg-gradient-to-br from-dark-300/60 to-dark-400/60 rounded-xl" />
      )}

      {/* Featured Label Banner - Simplified */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <motion.div
          className="relative bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black text-center py-3 px-6 rounded-t-xl"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Banner content */}
          <div className="relative z-10 flex items-center justify-center gap-3">
            <span className="text-lg font-black uppercase tracking-wider text-black drop-shadow-md">
              {featuredLabel}
            </span>
          </div>
          
          {/* Simple shine effect - CSS animation */}
          {!performanceMode && (
            <div className="absolute inset-0 overflow-hidden rounded-t-xl">
              <div 
                className="w-[30%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"
                style={{ willChange: 'transform' }}
              />
            </div>
          )}
        </motion.div>
      </div>


      {/* Main Content Area */}
      <div className="relative p-6 pt-16 space-y-4 z-20">
        {/* Title Section */}
        <div className="space-y-2">
          <motion.h2
            className="text-xl sm:text-2xl font-bold text-gray-100 leading-tight group-hover:text-brand-300 transition-colors"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {contest.name}
          </motion.h2>
          
          <motion.div
            className="text-sm font-medium text-brand-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {hasEnded ? "Contest Ended" : hasStarted ? "Ends in " : "Starts in "}
            <CountdownTimer
              targetDate={hasStarted ? contest.end_time : contest.start_time}
              onComplete={() => console.log("Prominent timer completed")}
              showSeconds={true}
            />
          </motion.div>
        </div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 sm:line-clamp-3">
            {contest.description || "An epic trading competition awaits. Join the battle and prove your trading prowess."}
          </p>
        </motion.div>

        {/* Compact Stats Row */}
        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          {/* Entry Fee & Prize Pool Section */}
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4">
              {/* Entry Fee */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-300 uppercase tracking-wider">Entry Fee</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-400/30 to-transparent"></div>
                </div>
                <div className="relative group">
                  
                  {Number(contest.entry_fee) === 0 ? (
                    <div className="relative text-center">
                      <span className="text-lg font-bold text-green-400 uppercase tracking-wide whitespace-nowrap">FREE</span>
                      <div className="text-xs text-green-300/60 whitespace-nowrap">No cost to enter</div>
                    </div>
                  ) : (
                    <div className="relative text-center">
                      <span className="text-lg font-bold text-blue-300 whitespace-nowrap">{formatCurrency(Number(contest.entry_fee))}</span>
                      <div className="text-xs text-blue-300/60 whitespace-nowrap">Entry cost</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Prize Pool */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-amber-300 uppercase tracking-wider">Prize Pool</span>
                  {Number(contest.entry_fee) > 0 && (
                    <div className="relative group/tooltip">
                      <svg className="w-3 h-3 text-amber-400/60 hover:text-amber-300 transition-colors cursor-help" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      
                      {/* Enhanced Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                        <div className="bg-dark-200/95 backdrop-blur-md border border-amber-500/30 rounded-lg px-4 py-3 text-sm text-gray-200 whitespace-nowrap shadow-2xl">
                          <div className="relative">
                            <span className="block font-bold text-amber-300 mb-1">Maximum Prize Pool</span>
                            <span className="block text-gray-300">with a full roster of competitors.</span>
                            <span className="block text-amber-200">The more players, the bigger the rewards!</span>
                          </div>
                          {/* Enhanced Arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-dark-200/95"></div>
                            <div className="absolute -top-[9px] -left-[8px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-amber-500/30"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex-1 h-px bg-gradient-to-r from-amber-400/30 to-transparent"></div>
                </div>
                <div className="relative group">
                  
                  <div className="relative flex items-center justify-between">
                    <div className="text-center flex-1">
                      <span className="text-lg font-bold text-amber-300 whitespace-nowrap">
                        {formatCurrency(
                          Number(contest.entry_fee) > 0 
                            ? Number(contest.entry_fee) * contest.max_participants
                            : Number(contest.prize_pool || "0")
                        )}
                      </span>
                      <div className="text-xs text-amber-300/60 whitespace-nowrap">Maximum potential</div>
                    </div>
                    {displayStatus !== "cancelled" && Number(contest.entry_fee) > 0 && (
                      <div className="text-right">
                        <span className="text-xs font-mono text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {contest.max_participants}x
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Players Progress Section */}
          <div className="w-full">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-purple-300 uppercase tracking-wider">Competition</span>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-400/30 to-transparent"></div>
              </div>
              
              {/* Compact Players Display */}
              <div className="relative group">
                
                <div className="relative">
                  {/* Enhanced Progress Bar with Text Inside */}
                  <div className="relative h-8 bg-black/60 rounded-full overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-gray-900 to-black/80"></div>
                    
                    {/* Progress fill */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-purple-700 via-purple-600 to-purple-700 rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${(contest.participant_count / contest.max_participants) * 100}%`,
                      }}
                    >
                      {/* Animated shine on progress bar */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>
                    
                    {/* Text inside progress bar */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-white drop-shadow-lg">
                        {contest.participant_count}/{contest.max_participants}
                      </span>
                    </div>
                    
                  </div>
                  
                  {/* Status indicator - only for special statuses */}
                  {(contest.participant_count === contest.max_participants || contest.participant_count > contest.max_participants * 0.8) && (
                    <div className="mt-2 text-center">
                      {contest.participant_count === contest.max_participants ? (
                        <span className="text-xs font-bold text-green-400 uppercase tracking-wide">Contest Full</span>
                      ) : (
                        <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Filling Fast</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-row gap-4 pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          {/* Enter Button - Takes most of the space */}
          <div className="flex-1 min-w-0">
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
          
          {/* Share Button - Fixed width */}
          <div className="flex-shrink-0">
            <ShareContestButton 
              contestId={contest.id.toString()} 
              contestName={contest.name}
              status={displayStatus}
            />
          </div>
        </motion.div>

        {/* Contest Code */}
        <div className="absolute bottom-4 right-6">
          <p className="text-xs text-gray-500 font-mono">{contest.contest_code}</p>
        </div>
      </div>

      {/* Simple Hover Effect */}
      {!performanceMode && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-400/0 to-purple-500/0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
      )}
    </motion.div>
    </div>
  );
};