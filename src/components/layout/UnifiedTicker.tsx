// src/components/layout/UnifiedTicker.tsx

import { formatDistanceToNow } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStandardizedTokenData } from "../../hooks/data/useStandardizedTokenData";
import { useStore } from "../../store/useStore";
import type { Contest, TokenData } from "../../types";

interface Props {
  contests: Contest[];
  loading: boolean;
  isCompact?: boolean;
  maxTokens?: number;
}

export const UnifiedTicker: React.FC<Props> = ({
  contests,
  loading,
  isCompact = false,
  maxTokens = 8,
}) => {
  const { maintenanceMode } = useStore();
  const { tokensAsTokenData, isConnected, error, refresh: doRefresh } = useStandardizedTokenData("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "contests" | "tokens">("all");
  const [significantChanges, setSignificantChanges] = useState<TokenData[]>([]);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Sort contests: active first, then pending
  const sortedContests = [...contests].sort((a, b) => {
    const statusOrder = { active: 0, pending: 1, completed: 2, cancelled: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // Process tokens without filtering for changes - show all tokens
  useEffect(() => {
    // Add more debugging to diagnose connection issues
    console.log(`UnifiedTicker DEBUG: 
      - isConnected: ${isConnected}
      - Connection state: ${error ? 'ERROR' : 'OK'}
      - Error: ${error || 'None'} 
      - Tokens received: ${tokensAsTokenData ? tokensAsTokenData.length : 0}
      - Connection attempts: ${connectionAttempts}
    `);

    if (!tokensAsTokenData || tokensAsTokenData.length === 0) return;

    console.log(`UnifiedTicker: Processing ${tokensAsTokenData.length} tokens`);
    
    // Sort by absolute change percentage (highest first) but don't filter
    // This ensures we always show tokens regardless of change percentage
    const sorted = [...tokensAsTokenData].sort((a, b) => 
      Math.abs(parseFloat(b.change24h || '0')) - Math.abs(parseFloat(a.change24h || '0'))
    );
    
    // Take top N tokens based on maxTokens parameter
    const tokensToShow = sorted.slice(0, maxTokens);
    console.log(`UnifiedTicker: Showing ${tokensToShow.length} tokens`);
    
    // Force update the ticker data
    setSignificantChanges(tokensToShow);
    
    // Force animation reset when token data changes
    if (containerRef.current && !isMobileView) {
      // Brief reset of animation to ensure it restarts properly
      const currentAnimation = containerRef.current.style.animation;
      containerRef.current.style.animation = 'none';
      
      // Force reflow
      void containerRef.current.offsetWidth;
      
      // Restore animation
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.animation = currentAnimation || getAnimationSpeed();
        }
      }, 50);
    }
    
  }, [tokensAsTokenData, maxTokens, isConnected, error, connectionAttempts]);
  
  // Manually trigger token data refresh when WebSocket is connected
  useEffect(() => {
    // Only try to refresh when we're actually connected
    if (isConnected && doRefresh) {
      console.log("UnifiedTicker: WebSocket connected, refreshing token data");
      doRefresh();
      
      // Set up interval for periodic refresh every 30 seconds
      const intervalId = setInterval(() => {
        if (doRefresh) {
          console.log("UnifiedTicker: Periodic token data refresh");
          doRefresh();
        }
      }, 30000);
      
      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [isConnected, doRefresh]);

  // Handle container resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    
    // Create a ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(updateWidth);
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Decide whether to use scroll or animation based on container width
  const isMobileView = containerWidth < 640;
  
  // Debug helper to track content width changes and ensure continuous animation
  useEffect(() => {
    if (contentRef.current) {
      const contentWidth = contentRef.current.offsetWidth;
      console.log(`UnifiedTicker: Content width is ${contentWidth}px (Container width: ${containerWidth}px)`);
      
      // If content is narrower than container, we need different animation strategy
      const needsSpecialAnimation = contentWidth > 0 && contentWidth < containerWidth * 0.9;
      
      if (needsSpecialAnimation && containerRef.current && !isMobileView) {
        console.log("UnifiedTicker: Content is narrower than container - needs special animation");
        
        // Add multiple clones to fill the space
        if (contentRef.current && containerRef.current) {
          // Remove existing clones first
          const existingClones = containerRef.current.querySelectorAll(".clone");
          existingClones.forEach(clone => clone.remove());
          
          // Calculate how many clones we need (at least 4 to ensure continuous flow)
          const clonesNeeded = Math.max(4, Math.ceil((containerWidth * 2) / contentWidth));
          console.log(`UnifiedTicker: Creating ${clonesNeeded} clones to fill space`);
          
          // Create multiple clones
          for (let i = 0; i < clonesNeeded; i++) {
            const clone = contentRef.current.cloneNode(true) as HTMLDivElement;
            clone.classList.add("clone");
            containerRef.current.appendChild(clone);
          }
        }
      }
    }
    
    // Set up animation monitoring to ensure continuous movement
    if (containerRef.current && !isMobileView) {
      // Animation monitoring - restart animation if it stops
      let animationObserver: number;
      let lastPosition = -1;
      let stuckCounter = 0;
      
      const checkAnimationProgress = () => {
        if (containerRef.current && !isPaused) {
          // Get computed transform to check if animation is actually moving
          const style = window.getComputedStyle(containerRef.current);
          const transform = style.getPropertyValue('transform');
          const matrix = new DOMMatrix(transform);
          const currentX = matrix.m41; // The X translation component
          
          // Check if position has changed
          if (lastPosition === currentX) {
            stuckCounter++;
            console.log(`UnifiedTicker: Animation may be stuck (${stuckCounter})`);
            
            // If position hasn't changed for several checks, restart the animation
            if (stuckCounter > 3) {
              console.log("UnifiedTicker: Restarting stuck animation");
              
              // Briefly remove animation
              const currentAnimation = containerRef.current.style.animation;
              containerRef.current.style.animation = 'none';
              
              // Force reflow
              void containerRef.current.offsetWidth;
              
              // Restore animation
              setTimeout(() => {
                if (containerRef.current) {
                  containerRef.current.style.animation = currentAnimation || getAnimationSpeed();
                  console.log("UnifiedTicker: Animation restarted");
                }
              }, 50);
              
              stuckCounter = 0;
            }
          } else {
            // Position has changed, reset stuck counter
            stuckCounter = 0;
          }
          
          lastPosition = currentX;
        }
      };
      
      // Check every second if animation is still moving
      animationObserver = window.setInterval(checkAnimationProgress, 1000);
      
      return () => {
        clearInterval(animationObserver);
      };
    }
  }, [containerWidth, sortedContests, significantChanges, activeTab, isPaused]);
  
  // Handle manual refresh for both contest and token data
  const handleManualRefresh = () => {
    console.log("UnifiedTicker: Manual refresh requested");
    setIsRefreshing(true);
    setConnectionAttempts(prev => prev + 1);
    
    // Refresh token data
    if (doRefresh) {
      doRefresh();
    }
    
    // Set a timeout to reset refresh state
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  // Handle manual scrolling on mobile
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStartX(e.pageX - (containerRef.current?.offsetLeft || 0));
    setDragScrollLeft(containerRef.current?.scrollLeft || 0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartX(e.touches[0].pageX - (containerRef.current?.offsetLeft || 0));
    setDragScrollLeft(containerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const x = e.pageX - (containerRef.current?.offsetLeft || 0);
    const walk = (x - dragStartX) * 2; // Scroll speed multiplier
    
    if (containerRef.current) {
      containerRef.current.scrollLeft = dragScrollLeft - walk;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const x = e.touches[0].pageX - (containerRef.current?.offsetLeft || 0);
    const walk = (x - dragStartX) * 2;
    
    if (containerRef.current) {
      containerRef.current.scrollLeft = dragScrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Setup scrolling vs. animation based on screen size
  useEffect(() => {
    console.log("UnifiedTicker: Setting up animation mode based on screen size");
    
    // Exit early if refs aren't ready
    if (!containerRef.current || !contentRef.current) {
      console.log("UnifiedTicker: Refs not ready yet");
      return;
    }

    if (isMobileView) {
      console.log("UnifiedTicker: Setting up MOBILE scrolling mode");
      
      // For mobile: Use horizontal scroll
      // Remove any existing clones and animation
      const existingClones = containerRef.current.querySelectorAll(".clone");
      existingClones.forEach((clone) => clone.remove());
      containerRef.current.style.animation = 'none';

      // Add scroll snap
      containerRef.current.className = containerRef.current.className
        .replace(/ticker-animation/g, '')
        .trim() + ' overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar';
      
      // Add snap points to children
      Array.from(contentRef.current.children).forEach(child => {
        (child as HTMLElement).classList.add('snap-start');
      });
    } else {
      console.log("UnifiedTicker: Setting up DESKTOP animation mode");
      
      // For desktop: Use animation
      // Remove scroll properties
      containerRef.current.className = containerRef.current.className
        .replace(/overflow-x-auto/g, '')
        .replace(/snap-x/g, '')
        .replace(/snap-mandatory/g, '')
        .replace(/scroll-smooth/g, '')
        .replace(/hide-scrollbar/g, '')
        .trim() + ' ticker-animation';
      
      // Remove snap points from children
      Array.from(contentRef.current.children).forEach(child => {
        (child as HTMLElement).classList.remove('snap-start');
      });

      // Remove any existing clones first
      const existingClones = containerRef.current.querySelectorAll(".clone");
      existingClones.forEach((clone) => clone.remove());

      // Clone items to create seamless loop only if we have content
      const content = contentRef.current;
      
      // Log content dimensions before cloning
      console.log(`UnifiedTicker: Content dimensions before cloning - Width: ${content.offsetWidth}px, Children: ${content.children.length}`);
      
      // Only clone if we have visible content
      if (content.offsetWidth > 0 && content.children.length > 0) {
        // Create multiple clones to ensure continuous animation
        const contentWidth = content.offsetWidth;
        const containerWidth = containerRef.current.offsetWidth;
        
        // We need at least 2x the container width for seamless animation
        const clonesNeeded = Math.max(2, Math.ceil((containerWidth * 2) / contentWidth));
        
        console.log(`UnifiedTicker: Creating ${clonesNeeded} clones to ensure smooth animation`);
        
        for (let i = 0; i < clonesNeeded; i++) {
          const clone = content.cloneNode(true) as HTMLDivElement;
          clone.classList.add("clone"); // Add class to identify clones
          containerRef.current.appendChild(clone);
        }
        
        console.log("UnifiedTicker: Content cloned successfully");
      } else {
        console.log("UnifiedTicker: Content not ready for cloning yet (zero width or no children)");
      }
      
      // Ensure animation is properly set
      const currentAnimation = containerRef.current.style.animation;
      if (!currentAnimation || currentAnimation === 'none') {
        containerRef.current.style.animation = getAnimationSpeed();
        console.log(`UnifiedTicker: Animation set to ${getAnimationSpeed()}`);
      }
    }

    return () => {
      // Cleanup clones when component unmounts or deps change
      if (containerRef.current) {
        const clones = containerRef.current.querySelectorAll(".clone");
        clones.forEach((clone) => clone.remove());
      }
    };
  }, [sortedContests, significantChanges, maintenanceMode, activeTab, isMobileView]);

  // Make the ticker run faster or slower based on active tab and content amount
  const getAnimationSpeed = () => {
    if (isMobileView) return 'none'; // No animation on mobile
    
    // Get a reference to the content and container for width calculations
    const content = contentRef.current;
    const container = containerRef.current;
    
    if (!content || !container) {
      // Default fallback animation if refs aren't available
      return 'ticker 30s linear infinite';
    }
    
    // Calculate the optimal animation duration based on content width
    const contentWidth = content.offsetWidth;
    
    // Pixels per second - adjust this value to change the base speed
    // Lower = faster, Higher = slower
    const pixelsPerSecond = 80; 
    
    // Calculate how long it should take to scroll the content (in seconds)
    // We use the full content width as the distance to travel
    let duration = contentWidth / pixelsPerSecond;
    
    // Ensure the duration is reasonable (not too fast or too slow)
    duration = Math.max(15, Math.min(60, duration));
    
    // Determine if we have enough content based on active tab
    if (activeTab === "contests" && sortedContests.length < 3) {
      // Slow down for very few items
      duration = 40;
    } else if (activeTab === "tokens" && significantChanges.length < 3) {
      // Slow down for very few items
      duration = 40;
    }
    
    console.log(`UnifiedTicker: Animation duration set to ${duration}s (Content width: ${contentWidth}px)`);
    
    // Return the animation with the calculated duration
    return `ticker ${duration}s linear infinite`;
  };

  // Glow effect for tab buttons
  const tabButtonVariants = {
    active: {
      opacity: 1,
      scale: 1,
      boxShadow: [
        "0 0 0px rgba(153, 51, 255, 0.5)",
        "0 0 5px rgba(153, 51, 255, 0.5)",
        "0 0 3px rgba(153, 51, 255, 0.5)",
      ],
      transition: {
        boxShadow: {
          repeat: Infinity,
          repeatType: "reverse" as const,
          duration: 2,
        },
      },
    },
    inactive: {
      opacity: 0.7,
      scale: 0.95,
      boxShadow: "0 0 0px rgba(153, 51, 255, 0)",
    },
  };

  if (maintenanceMode) {
    return (
      <div className="bg-dark-200/60 backdrop-blur-sm border-y border-yellow-400/20 overflow-hidden whitespace-nowrap relative w-full">
        <div
          ref={containerRef}
          className={`inline-flex items-center w-full ${!isMobileView ? 'ticker-animation' : 'overflow-x-auto hide-scrollbar'}`}
          style={{
            animation: isMobileView ? 'none' : "ticker 30s linear infinite",
            animationPlayState: isPaused ? "paused" : "running",
            maxHeight: isCompact ? "1.5rem" : "2rem",
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            setIsPaused(false);
            if (isMobileView) handleMouseUp();
          }}
          onMouseDown={isMobileView ? handleMouseDown : undefined}
          onMouseMove={isMobileView ? handleMouseMove : undefined}
          onMouseUp={isMobileView ? handleMouseUp : undefined}
          onTouchStart={isMobileView ? handleTouchStart : undefined}
          onTouchMove={isMobileView ? handleTouchMove : undefined}
          onTouchEnd={isMobileView ? handleMouseUp : undefined}
        >
          <div
            ref={contentRef}
            className={`inline-flex items-center space-x-8 px-4 flex-shrink-0 ${isCompact ? 'h-6' : 'h-8'}`}
          >
            <div className="inline-flex items-center space-x-4 text-sm">
              <span className="text-yellow-400 font-mono">
                ⚠ DUELS PAUSED
              </span>
              <span className="text-yellow-400/75 font-mono">
                MAINTENANCE IN PROGRESS
              </span>
              <span className="text-yellow-400/50 font-mono">
                PLEASE DEGEN ELSEWHERE
              </span>
              <span
                className="font-mono text-yellow-400/75"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(-45deg, #000 0, #000 10px, #fbbf24 10px, #fbbf24 20px)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ▰▰▰▰▰▰▰▰
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-dark-200/60 backdrop-blur-sm border-y border-dark-300">
        <div className={`animate-pulse bg-dark-300/50 ${isCompact ? 'h-6' : 'h-8'}`} />
      </div>
    );
  }

  // No content - Add better logging and connection indicator
  if (sortedContests.length === 0 && significantChanges.length === 0) {
    console.log(`UnifiedTicker: No content available. Contests: ${contests.length}, Tokens loaded: ${tokensAsTokenData?.length || 0}, WebSocket connected: ${isConnected}`);
    
    // No need for authentication check since we're showing connection status
    
    // Show connection diagnostics first - preserve error visibility for debugging
    if (error || (tokensAsTokenData?.length === 0 && !isConnected)) {
      return (
        <div className="bg-dark-200/60 backdrop-blur-sm border-y border-dark-300 overflow-hidden whitespace-nowrap relative w-full">
          <div
            ref={containerRef}
            className={`flex items-center justify-center w-full overflow-hidden`}
            style={{
              maxHeight: isCompact ? "1.5rem" : "2rem",
            }}
          >
            <div
              ref={contentRef}
              className={`flex items-center justify-center px-4 flex-shrink-0 ${isCompact ? 'h-6' : 'h-8'} w-full`}
            >
              <div className="flex items-center space-x-4 text-sm">
                {error ? (
                  <>
                    <span className="font-mono text-red-400">
                      <span className="animate-ping inline-block h-2 w-2 rounded-full bg-red-500 opacity-75 mr-2"></span>
                      CONNECTION ERROR
                    </span>
                    <button 
                      onClick={handleManualRefresh}
                      className="ml-2 bg-red-900/30 hover:bg-red-800/30
                        border border-red-500/20 rounded text-[10px] px-1.5 py-0.5 flex items-center justify-center text-red-300"
                      title="Retry connection"
                    >
                      <span className={`${isRefreshing ? 'hidden' : 'inline-block mr-0.5'}`}>↻</span>
                      <span className={`${isRefreshing ? 'inline-block mr-0.5 animate-spin' : 'hidden'}`}>◌</span>
                      RETRY
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-amber-500">
                      <span className="animate-ping inline-block h-2 w-2 rounded-full bg-amber-500 opacity-75 mr-2"></span>
                      CONNECTING
                      {connectionAttempts > 0 ? ` (${connectionAttempts + 1})` : ''}
                    </span>
                    <button 
                      onClick={handleManualRefresh}
                      className="ml-2 bg-dark-400/30 hover:bg-dark-400/40
                        border border-brand-500/20 rounded text-[10px] px-1.5 py-0.5 flex items-center justify-center text-brand-300"
                      disabled={isRefreshing}
                      title="Refresh data"
                    >
                      <span className={`${isRefreshing ? 'hidden' : 'inline-block mr-0.5'}`}>↻</span>
                      <span className={`${isRefreshing ? 'inline-block mr-0.5 animate-spin' : 'hidden'}`}>◌</span>
                      SYNC
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // This should never be reached now, but keep it for safety
    if (false) {
      return (
        <div className="bg-dark-200/60 backdrop-blur-sm border-y border-dark-300 overflow-hidden whitespace-nowrap relative w-full">
          <div
            ref={containerRef}
            className={`flex items-center justify-center w-full overflow-hidden`}
            style={{
              maxHeight: isCompact ? "1.5rem" : "2rem",
            }}
          >
            <div
              ref={contentRef}
              className={`flex items-center justify-center px-4 flex-shrink-0 ${isCompact ? 'h-6' : 'h-8'} w-full`}
            >
              <div className="flex items-center space-x-4 text-sm">
                {error ? (
                  <>
                    <span className="font-mono text-red-400">
                      <span className="animate-ping inline-block h-2 w-2 rounded-full bg-red-500 opacity-75 mr-2"></span>
                      CONNECTION ERROR
                    </span>
                    <button 
                      onClick={handleManualRefresh}
                      className="ml-2 bg-red-900/30 hover:bg-red-800/30
                        border border-red-500/20 rounded text-[10px] px-1.5 py-0.5 flex items-center justify-center text-red-300"
                      title="Retry connection"
                    >
                      <span className={`${isRefreshing ? 'hidden' : 'inline-block mr-0.5'}`}>↻</span>
                      <span className={`${isRefreshing ? 'inline-block mr-0.5 animate-spin' : 'hidden'}`}>◌</span>
                      RETRY
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-amber-500">
                      <span className="animate-ping inline-block h-2 w-2 rounded-full bg-amber-500 opacity-75 mr-2"></span>
                      CONNECTING
                      {connectionAttempts > 0 ? ` (${connectionAttempts + 1})` : ''}
                    </span>
                    <button 
                      onClick={handleManualRefresh}
                      className="ml-2 bg-dark-400/30 hover:bg-dark-400/40
                        border border-brand-500/20 rounded text-[10px] px-1.5 py-0.5 flex items-center justify-center text-brand-300"
                      disabled={isRefreshing}
                      title="Refresh data"
                    >
                      <span className={`${isRefreshing ? 'hidden' : 'inline-block mr-0.5'}`}>↻</span>
                      <span className={`${isRefreshing ? 'inline-block mr-0.5 animate-spin' : 'hidden'}`}>◌</span>
                      SYNC
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // If we're waiting for data but connected, show simple loading state
    if (tokensAsTokenData?.length === 0) {
      return (
        <div className="bg-dark-200/60 backdrop-blur-sm border-y border-dark-300 overflow-hidden whitespace-nowrap relative w-full">
          <div className="flex items-center justify-center w-full overflow-hidden" ref={containerRef}>
            <div className={`flex items-center justify-center px-4 py-2 ${isCompact ? 'h-6' : 'h-8'} w-full`} ref={contentRef}>
              <div className="flex items-center space-x-4 text-sm">
                <span className="font-mono text-blue-400">
                  <span className="animate-pulse inline-block h-2 w-2 rounded-full bg-blue-500 opacity-75 mr-2"></span>
                  LOADING DATA
                </span>
                <button 
                  onClick={handleManualRefresh}
                  className="ml-2 bg-dark-400/30 hover:bg-dark-400/40
                    border border-blue-500/20 rounded text-[10px] px-1.5 py-0.5 flex items-center justify-center text-blue-300"
                  disabled={isRefreshing}
                  title="Refresh data"
                >
                  <span className={`${isRefreshing ? 'hidden' : 'inline-block mr-0.5'}`}>↻</span>
                  <span className={`${isRefreshing ? 'inline-block mr-0.5 animate-spin' : 'hidden'}`}>◌</span>
                  REFRESH
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // If we're connected but have no real data, show this message
    return (
      <div className="bg-dark-200/60 backdrop-blur-sm border-y border-dark-300 overflow-hidden whitespace-nowrap relative w-full">
        <div
          ref={containerRef}
          className="flex items-center justify-center w-full"
          style={{
            maxHeight: isCompact ? "1.5rem" : "2rem",
          }}
        >
          <div
            ref={contentRef}
            className={`flex items-center justify-center px-4 flex-shrink-0 ${isCompact ? 'h-6' : 'h-8'} w-full`}
          >
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-400">No featured duels or significant price movements at the moment.</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-400">Check back soon for updates</span>
              <button 
                onClick={handleManualRefresh}
                className="ml-2 bg-dark-400/30 hover:bg-dark-400/40
                  border border-purple-500/20 rounded text-[10px] px-1.5 py-0.5 flex items-center justify-center text-purple-300"
                disabled={isRefreshing}
                title="Refresh data"
              >
                <span className={`${isRefreshing ? 'hidden' : 'inline-block mr-0.5'}`}>↻</span>
                <span className={`${isRefreshing ? 'inline-block mr-0.5 animate-spin' : 'hidden'}`}>◌</span>
                REFRESH
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Floating tab UI with motion animation
  const floatingTabs = (
    <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex space-x-0.5">
      <AnimatePresence>
        <motion.button
          onClick={() => setActiveTab("all")}
          initial="inactive"
          animate={activeTab === "all" ? "active" : "inactive"}
          variants={tabButtonVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-all ${
            activeTab === "all"
              ? "bg-gradient-to-r from-brand-400/20 to-cyber-400/20 text-brand-400 shadow-brand"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          ALL
        </motion.button>
        <motion.button
          onClick={() => setActiveTab("contests")}
          initial="inactive"
          animate={activeTab === "contests" ? "active" : "inactive"}
          variants={tabButtonVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-all ${
            activeTab === "contests"
              ? "bg-brand-400/20 text-brand-400 shadow-brand"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          DUELS
        </motion.button>
        <motion.button
          onClick={() => setActiveTab("tokens")}
          initial="inactive"
          animate={activeTab === "tokens" ? "active" : "inactive"}
          variants={tabButtonVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-1.5 py-0.5 text-[10px] font-medium rounded-sm transition-all ${
            activeTab === "tokens"
              ? "bg-cyber-400/20 text-cyber-400 shadow-cyber"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          PRICES
        </motion.button>
      </AnimatePresence>
    </div>
  );

  // Unified Ticker (edge-to-edge) with modern design
  return (
    <div className="relative w-full overflow-hidden block">
      {/* Dark base layer with slightly increased opacity for better readability */}
      <div className="absolute inset-0 bg-dark-200/70 backdrop-blur-sm" />

      {/* Animated gradient background - different for each tab */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: activeTab === "all" || activeTab === "contests" ? 0.5 : 0,
          }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-gradient-to-br from-brand-900/40 via-brand-500/20 to-brand-900/40"
        />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: activeTab === "all" || activeTab === "tokens" ? 0.5 : 0,
          }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-gradient-to-br from-cyber-900/40 via-cyber-500/20 to-cyber-900/40"
        />
        
        {/* Moving light beam effect */}
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{ 
            repeat: Infinity, 
            duration: 5,
            ease: "linear",
          }}
          className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        />
        
        {/* Data particles for cyber feel */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(153,0,255,0.05),transparent_30%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,225,255,0.05),transparent_30%)]" />
      </div>

      {/* Animated scan effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: activeTab === "all" || activeTab === "contests" ? 0.3 : 0 
          }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(99,102,241,0.05)_50%,transparent_100%)] animate-scan-fast"
        />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: activeTab === "all" || activeTab === "tokens" ? 0.3 : 0 
          }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,225,255,0.05)_50%,transparent_100%)] animate-scan-fast"
        />
        
        <div 
          className="absolute inset-x-0 h-1/2 bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-cyber-scan" 
          style={{ animationDuration: "3s" }}
        />
      </div>

      {/* Glowing borders with gradient that changes based on tab */}
      <motion.div 
        className="absolute inset-x-0 top-0"
        initial={{ boxShadow: "0 0 0px rgba(0, 0, 0, 0)" }}
        animate={{ 
          boxShadow: activeTab === "tokens" 
            ? "0 1px 6px rgba(0, 225, 255, 0.3)" 
            : activeTab === "contests" 
              ? "0 1px 6px rgba(153, 51, 255, 0.3)"
              : "0 1px 6px rgba(153, 51, 255, 0.2)"
        }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="h-[1px] bg-gradient-to-r from-transparent to-transparent"
          animate={{ 
            backgroundImage: activeTab === "tokens" 
              ? "linear-gradient(to right, transparent, rgba(0, 225, 255, 0.5), transparent)" 
              : activeTab === "contests" 
                ? "linear-gradient(to right, transparent, rgba(153, 51, 255, 0.5), transparent)"
                : "linear-gradient(to right, transparent, rgba(153, 51, 255, 0.3), rgba(0, 225, 255, 0.3), transparent)"
          }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
      
      <motion.div 
        className="absolute inset-x-0 bottom-0"
        initial={{ boxShadow: "0 0 0px rgba(0, 0, 0, 0)" }}
        animate={{ 
          boxShadow: activeTab === "tokens" 
            ? "0 -1px 6px rgba(0, 225, 255, 0.3)" 
            : activeTab === "contests" 
              ? "0 -1px 6px rgba(153, 51, 255, 0.3)"
              : "0 -1px 6px rgba(153, 51, 255, 0.2)"
        }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="h-[1px] bg-gradient-to-r from-transparent to-transparent"
          animate={{ 
            backgroundImage: activeTab === "tokens" 
              ? "linear-gradient(to right, transparent, rgba(0, 225, 255, 0.5), transparent)" 
              : activeTab === "contests" 
                ? "linear-gradient(to right, transparent, rgba(153, 51, 255, 0.5), transparent)"
                : "linear-gradient(to right, transparent, rgba(153, 51, 255, 0.3), rgba(0, 225, 255, 0.3), transparent)"
          }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>

      {/* Tab buttons only shown when we have both contests and tokens */}
      {(sortedContests.length > 0 && significantChanges.length > 0) && floatingTabs}

      {/* Content container */}
      <div
        className={`relative transition-all duration-200 ease-out ${
          isCompact ? "h-6" : "h-8"
        }`}
      >
        <div className="h-full overflow-hidden whitespace-nowrap">
          {/* Mobile hint (shows on small screens) */}
          {isMobileView && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-dark-300/70 backdrop-blur-sm text-[10px] text-gray-400 px-1.5 py-0.5 rounded-sm z-10 pointer-events-none">
              Swipe ↔
            </div>
          )}
          
          {/* Parent Container */}
          <div
            ref={containerRef}
            className={`inline-flex items-center w-full ${!isMobileView ? 'ticker-animation' : 'overflow-x-auto hide-scrollbar'}`}
            style={{
              animation: getAnimationSpeed(),
              animationPlayState: isPaused ? "paused" : "running",
              scrollBehavior: "smooth",
              position: "relative", // Ensure positioned context for proper animation
              overflow: isMobileView ? "auto" : "hidden", // Important for animation containment
              willChange: "transform", // Performance optimization
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => {
              setIsPaused(false);
              if (isMobileView) handleMouseUp();
            }}
            onMouseDown={isMobileView ? handleMouseDown : undefined}
            onMouseMove={isMobileView ? handleMouseMove : undefined}
            onMouseUp={isMobileView ? handleMouseUp : undefined}
            onTouchStart={isMobileView ? handleTouchStart : undefined}
            onTouchMove={isMobileView ? handleTouchMove : undefined}
            onTouchEnd={isMobileView ? handleMouseUp : undefined}
          >
            {/* Content Container */}
            <div
              ref={contentRef}
              className={`inline-flex items-center space-x-8 px-4 flex-shrink-0 transition-all duration-200 ease-out min-w-max
                ${isCompact ? "text-xs" : "text-sm"}`}
            >
              {/* Show content based on active tab */}
              {(activeTab === "all" || activeTab === "contests") && sortedContests.map((contest) => (
                <Link
                  key={contest.id}
                  to={`/contests/${contest.id}`}
                  className={`group/item relative inline-flex items-center space-x-2 hover:bg-dark-300/50 px-2 py-1 rounded transition-all duration-300 ${
                    contest.status === "cancelled"
                      ? "line-through opacity-60"
                      : ""
                  } ${isMobileView ? 'snap-start min-w-max' : ''}`}
                  title={contest.description}
                >
                  {/* Hover background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 animate-data-stream rounded" />

                  {/* Status-based Contest Indicator */}
                  {contest.status === "active" ? (
                    <span className="inline-flex items-center text-green-400 group-hover/item:text-green-300 space-x-1.5 transition-colors">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      <span className="font-bold animate-pulse group-hover/item:text-green-300 transition-colors">
                        LIVE NOW
                      </span>
                    </span>
                  ) : contest.status === "pending" ? (
                    <span className="inline-flex items-center text-cyber-400 group-hover/item:text-cyber-300 space-x-1.5 transition-colors">
                      <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-500 animate-pulse" />
                      </span>
                      <span className="font-bold group-hover/item:text-cyber-300 transition-colors">
                        OPEN
                      </span>
                    </span>
                  ) : contest.status === "completed" ? (
                    <span className="text-green-400/50 group-hover/item:text-green-300 font-medium transition-colors">
                      ENDED
                    </span>
                  ) : (
                    <span className="text-red-400/50 group-hover/item:text-red-300 font-medium transition-colors">
                      CANCELLED
                    </span>
                  )}

                  {/* Contest Name */}
                  <span
                    className={`font-medium transition-colors ${
                      contest.status === "active"
                        ? "text-gray-300 group-hover/item:text-gray-200"
                        : contest.status === "pending"
                          ? "text-gray-300 group-hover/item:text-gray-200"
                          : contest.status === "completed"
                            ? "text-green-300/50 group-hover/item:text-green-200"
                            : "text-red-300/50 group-hover/item:text-red-200"
                    }`}
                  >
                    {contest.name}
                  </span>

                  {/* Solana amounts with gradient text */}
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-sm bg-gradient-to-r ${
                        contest.status === "active"
                          ? "from-cyber-400 to-brand-400"
                          : contest.status === "pending"
                            ? "from-green-400 to-brand-400"
                            : contest.status === "completed"
                              ? "from-green-600/50 to-brand-400/50"
                              : "from-red-400/50 to-brand-400/50"
                      } bg-clip-text text-transparent group-hover/item:animate-gradientX`}
                    >
                      {Number(contest.entry_fee)} SOL
                    </span>
                  </div>

                  {/* Integrated Progress Bar with Entry Count */}
                  <div className="flex flex-col items-center gap-0.5 ml-2">
                    {/* Entry Count */}
                    <div className="text-[10px] text-gray-400 group-hover/item:text-gray-300 transition-colors">
                      {contest.participant_count}/{contest.max_participants}
                    </div>
                    {/* Enhanced Progress Bar */}
                    <div className="relative h-1 w-16 bg-dark-300/50 rounded-full overflow-hidden group/progress">
                      {/* Background Pulse Effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-scan-fast" />
                      {/* Progress Fill */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ${
                          contest.status === "active"
                            ? "bg-gradient-to-r from-cyber-400 to-brand-400"
                            : contest.status === "pending"
                              ? "bg-gradient-to-r from-green-400 to-brand-400"
                              : contest.status === "completed"
                                ? "bg-gradient-to-r from-green-600/50 to-brand-400/50"
                                : "bg-gradient-to-r from-red-400/50 to-brand-400/50"
                        }`}
                        style={{
                          width: `${
                            (contest.participant_count /
                              contest.max_participants) *
                            100
                          }%`,
                        }}
                      >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
                      </div>
                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover/progress:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 blur-sm" />
                    </div>
                  </div>

                  {/* Time Info with enhanced styling */}
                  {(contest.status === "active" ||
                    contest.status === "pending" ||
                    contest.status === "cancelled" ||
                    contest.status === "completed") && (
                    <span
                      className={`text-sm ${
                        contest.status === "active"
                          ? "text-gray-500 group-hover/item:text-gray-400"
                          : "text-gray-500 group-hover/item:text-gray-400"
                      } transition-colors`}
                    >
                      {/* Handle different status cases */}
                      {contest.status === "active" && (
                        <>
                          Ends{" "}
                          {contest.end_time
                            ? formatDistanceToNow(
                                new Date(contest.end_time),
                                {
                                  addSuffix: true,
                                },
                              )
                            : "N/A"}
                        </>
                      )}
                      {contest.status === "pending" && (
                        <>
                          Starts{" "}
                          {contest.start_time
                            ? new Date(contest.start_time) < new Date()
                              ? "soon"
                              : formatDistanceToNow(
                                  new Date(contest.start_time),
                                  {
                                    addSuffix: true,
                                  },
                                )
                            : "N/A"}
                        </>
                      )}
                      {contest.status === "cancelled" && (
                        <>
                          Cancelled{" "}
                          {formatDistanceToNow(
                            new Date(
                              contest.cancelled_at || contest.end_time,
                            ),
                            { addSuffix: true },
                          )}
                        </>
                      )}
                      {contest.status === "completed" && (
                        <>
                          Ended{" "}
                          {formatDistanceToNow(new Date(contest.end_time), {
                            addSuffix: true,
                          })}
                        </>
                      )}
                    </span>
                  )}
                </Link>
              ))}

              {/* Token price updates */}
              {(activeTab === "all" || activeTab === "tokens") && significantChanges.map(token => (
                <Link
                  key={token.symbol}
                  to={`/tokens?symbol=${token.symbol}`}
                  className={`group/item relative inline-flex items-center space-x-2 hover:bg-dark-300/50 px-2 py-1 rounded transition-all duration-300 ${isMobileView ? 'snap-start min-w-max' : ''}`}
                  title={`${token.name} (${token.symbol})`}
                >
                  {/* Hover background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-400/0 via-cyber-400/5 to-cyber-400/0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 animate-data-stream rounded" />
                  
                  {/* Token Symbol */}
                  <span className="font-mono text-cyber-400 group-hover/item:text-cyber-300 font-medium transition-colors">
                    {token.symbol}
                  </span>
                  
                  {/* Token Price */}
                  <span className="font-medium text-gray-300 group-hover/item:text-gray-200 transition-colors">
                    ${parseFloat(token.price).toFixed(4)}
                  </span>
                  
                  {/* Percentage Change */}
                  <span 
                    className={`flex items-center space-x-1 transition-colors
                      ${parseFloat(token.change24h) > 0 
                        ? 'text-green-400 group-hover/item:text-green-300' 
                        : 'text-red-400 group-hover/item:text-red-300'}`}
                  >
                    {/* Trend Arrow */}
                    <span className="font-bold">
                      {parseFloat(token.change24h) > 0 ? '▲' : '▼'}
                    </span>
                    
                    {/* Percentage Value */}
                    <span className={`
                      ${Math.abs(parseFloat(token.change24h)) > 20 ? 'animate-pulse font-bold' : ''}
                    `}>
                      {Math.abs(parseFloat(token.change24h)).toFixed(2)}%
                    </span>
                  </span>
                  
                  {/* Volume Indicator (optional) */}
                  {parseFloat(token.volume24h) > 1000000 && (
                    <div className="px-1.5 py-0.5 bg-dark-300/70 rounded-sm text-xs font-mono text-gray-400">
                      V:${(parseFloat(token.volume24h) / 1000000).toFixed(1)}M
                    </div>
                  )}
                </Link>
              ))}

              {/* Category divider for "all" view */}
              {activeTab === "all" && sortedContests.length > 0 && significantChanges.length > 0 && (
                <div className={`inline-flex items-center gap-2 ${isMobileView ? 'snap-start min-w-max' : ''}`}>
                  <span className="h-4 w-0.5 bg-gradient-to-b from-brand-400/50 to-cyber-400/50 rounded-full" />
                  <span className="text-xs font-mono text-gray-500">MARKET</span>
                  <span className="h-4 w-0.5 bg-gradient-to-b from-cyber-400/50 to-brand-400/50 rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add custom styles for scrollbar hiding */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .hide-scrollbar {
          -ms-overflow-style: none !important;  /* IE and Edge */
          scrollbar-width: none !important;  /* Firefox */
          overflow-x: auto;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;  /* Chrome, Safari, Opera */
          width: 0px !important;
          height: 0px !important;
        }
        .ticker-animation {
          display: flex !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          width: 100% !important;
          will-change: transform !important;
        }
        /* Shadow effects */
        .shadow-brand {
          box-shadow: 0 0 5px rgba(153, 51, 255, 0.3);
        }
        .shadow-cyber {
          box-shadow: 0 0 5px rgba(0, 225, 255, 0.3);
        }
        
        /* Animation debugging */
        .ticker-debug {
          position: relative;
        }
        .ticker-debug:after {
          content: "Animation Debug";
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: black;
          color: lime;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 4px;
          z-index: 1000;
        }
        /* Additional animations */
        @keyframes gradientX {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradientX {
          animation: gradientX 2s ease infinite;
          background-size: 200% auto;
        }
        
        /* Explicit ticker animation */
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        `
      }} />
      
      {/* Debug information to help understand what's wrong */}
      <div className="debug-info hidden absolute bottom-full left-0 mb-1 p-2 bg-dark-800 text-xs text-white z-50 opacity-80 rounded">
        <div>Size: {containerWidth}px (Mobile: {isMobileView ? 'Yes' : 'No'})</div>
        <div>Contests: {sortedContests.length}, Tokens: {significantChanges.length}</div>
        <div>WebSocket: {isConnected ? 'Connected' : 'Disconnected'}</div>
        <div>Animation: {getAnimationSpeed()}</div>
      </div>
    </div>
  );
};

export default UnifiedTicker;