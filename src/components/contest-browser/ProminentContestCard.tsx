import { motion } from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { getContestImageUrl } from "../../lib/imageUtils";
import { cn, formatCurrency } from "../../lib/utils";
import { Contest, ContestStatus } from "../../types/index";
import { ContestButton } from "../landing/contests-preview/ContestButton";
import { CountdownTimer } from "../ui/CountdownTimer";
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
  // featuredLabel = "🏆 CONTEST OF THE WEEK",
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
          `group relative bg-gradient-to-br from-dark-200/90 via-purple-900/20 to-dark-300/90 backdrop-blur-md border-2 transform transition-all duration-500 hover:scale-[1.02] rounded-xl overflow-hidden w-full max-w-full cursor-pointer ${
            displayStatus === "active" 
              ? "border-green-500/60 hover:border-green-400/80" 
              : displayStatus === "pending" 
              ? "border-blue-500/60 hover:border-blue-400/80"
              : displayStatus === "completed"
              ? "border-gray-500/60 hover:border-gray-400/80"
              : "border-red-500/60 hover:border-red-400/80"
          }`,
          "will-change-transform", // GPU acceleration
          className
        )}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={!performanceMode ? { 
          boxShadow: displayStatus === "active" 
            ? "0 25px 50px -12px rgba(34, 197, 94, 0.25), 0 0 30px rgba(34, 197, 94, 0.1)"
            : displayStatus === "pending"
            ? "0 25px 50px -12px rgba(59, 130, 246, 0.25), 0 0 30px rgba(59, 130, 246, 0.1)"
            : displayStatus === "completed"
            ? "0 25px 50px -12px rgba(156, 163, 175, 0.25), 0 0 30px rgba(156, 163, 175, 0.1)"
            : "0 25px 50px -12px rgba(239, 68, 68, 0.25), 0 0 30px rgba(239, 68, 68, 0.1)",
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
                  className="w-full h-full"
                  style={{ 
                    objectFit: 'cover',
                    objectPosition: 'center center',
                    minWidth: '100%',
                    width: '100%',
                    height: 'auto'
                  }}
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

      {/* Featured Gold Gradient Overlay - No text, fades out */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <motion.div
          className="absolute top-0 left-0 right-0 h-20 rounded-t-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.5) 0%, rgba(245, 158, 11, 0.35) 25%, rgba(234, 179, 8, 0.2) 50%, rgba(234, 179, 8, 0.08) 75%, transparent 100%)'
          }}
        />
      </div>


      {/* Edge-to-Edge Corner Status Indicators - Clipped to card rounded corners */}
      <div className="absolute top-0 right-0 z-40 overflow-hidden rounded-tr-lg">
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

      {/* Share button - top right but below featured banner */}
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

      {/* Main Content Area */}
      <div className="relative px-6 pt-6 pb-16 space-y-3 z-20">
        {/* Title Section */}
        <div className="space-y-1">
          <motion.h2
            className={`font-black text-white leading-tight group-hover:text-brand-300 transition-colors text-left font-sans tracking-tight ${
              contest.name.length > 50 ? 'text-base sm:text-lg lg:text-xl' :
              contest.name.length > 35 ? 'text-lg sm:text-xl lg:text-2xl' :
              contest.name.length > 25 ? 'text-xl sm:text-2xl lg:text-3xl' :
              'text-2xl sm:text-3xl lg:text-4xl'
            }`}
            style={{textShadow: '2px 0 0 black, -2px 0 0 black, 0 2px 0 black, 0 -2px 0 black', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {contest.name}
          </motion.h2>
          
          <motion.div
            className="text-sm font-medium text-brand-300 text-left"
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
          <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 sm:line-clamp-3 italic font-medium tracking-wide text-left border-l-2 border-amber-500/40 pl-3 py-1 bg-gradient-to-r from-amber-900/10 to-transparent min-h-[2.5rem] sm:min-h-[3.5rem]"
            style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}
          >
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
          {/* Entry Fee & Prize Pool Section - Clean Typography Layout */}
          <div className="flex-1">
            <div className="space-y-4">
              {/* Entry Fee */}
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-blue-300 uppercase tracking-wider">Entry Fee</span>
                <div className="flex items-center gap-2">
                  {Number(contest.entry_fee) === 0 ? (
                    <span className="text-xl font-bold text-green-400 uppercase tracking-wide">FREE</span>
                  ) : (
                    <>
                      <span className="text-xl font-bold text-blue-300 tracking-tight">
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
                  <span className="text-2xl font-bold text-amber-300 tracking-tight">
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
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-full"></div>
                    </div>
                    
                    {/* Text inside progress bar */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold tracking-wide drop-shadow-lg text-white" style={{textShadow: '1px 0 0 black, -1px 0 0 black, 0 1px 0 black, 0 -1px 0 black'}}>
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

      </div>

      {/* Edge-to-edge button container */}
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        onClick={(e) => e.stopPropagation()}
      >
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
      </motion.div>

      {/* Simple Hover Effect */}
      {!performanceMode && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-400/0 to-purple-500/0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
      )}
    </motion.div>
    </div>
  );
};