// src/components/layout/Header.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";

import { ContestsDropdown } from "./ContestsDropdown";
import { MobileMenuButton } from "./MobileMenuButton";
import { RankingsDropdown } from "./RankingsDropdown";
import { TokensDropdown } from "./TokensDropdown";
import { useAuth } from "../../hooks/useAuth";
import { useNotificationWebSocket } from "../../hooks/websocket/useNotificationWebSocket";
import { useScrollHeader } from "../../hooks/useScrollHeader";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import LoginOptionsButton from "../auth/LoginOptionsButton";
import Logo from "../ui/Logo";
import { UserMenu } from "./user-menu/UserMenu";

export const Header: React.FC = () => {
  const { isCompact } = useScrollHeader(50);
  const {
    user,
    disconnectWallet,
    error,
    clearError,
    maintenanceMode,
    setMaintenanceMode,
  } = useStore();
  const { isAdmin, isAuthenticated } = useAuth();
  
  // For debugging - check if we have a mismatch between store user and auth state
  useEffect(() => {
    if (user && !isAuthenticated()) {
      console.warn('[Header] User exists in store but isAuthenticated() is false');
    } else if (!user && isAuthenticated()) {
      console.warn('[Header] isAuthenticated() is true but no user in store');
    }
  }, [user, isAuthenticated]);
  const { unreadCount } = useNotificationWebSocket();
  const [lastMaintenanceCheck, setLastMaintenanceCheck] = useState<number>(0);
  const [isTransitioningToMaintenance, setIsTransitioningToMaintenance] =
    useState(false);

  // No longer fetching contests here - EdgeToEdgeTicker now handles this

  // Handle maintenance transitions
  const handleMaintenanceTransition = () => {
    if (!maintenanceMode && !isTransitioningToMaintenance) {
      setIsTransitioningToMaintenance(true);
      setMaintenanceMode(true);

      // Use a fade-out animation and then transition
      setTimeout(() => {
        // Only reload if we're not an admin
        if (!isAdmin()) {
          window.location.href = "/maintenance";
        }
        setIsTransitioningToMaintenance(false);
      }, 1000);
    }
  };

  useEffect(() => {
    const checkMaintenance = async () => {
      const now = Date.now();
      if (now - lastMaintenanceCheck < 15000) return;

      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setLastMaintenanceCheck(now);

        if (isInMaintenance !== maintenanceMode) {
          // If transitioning out of maintenance mode
          if (!isInMaintenance && maintenanceMode) {
            try {
              // No longer need to fetch contests here - EdgeToEdgeTicker will handle that
              useStore.setState({ maintenanceMode: false }); // Use store setState directly
            } catch (err) {
              console.error(
                "Failed during maintenance exit:",
                err,
              );
              // Don't update maintenance mode if there was an error
              return;
            }
          } else {
            useStore.setState({ maintenanceMode: isInMaintenance }); // Use store setState directly
          }

          // Only reload for non-admin users entering maintenance mode
          if (isInMaintenance && !isAdmin()) {
            setTimeout(() => {
              window.location.href = "/maintenance";
            }, 500);
          }
        }
      } catch (err: any) {
        console.error("Failed to check maintenance mode:", err);
        // Only set maintenance mode on 503 errors
        if (err?.status === 503 || err?.message?.includes("503")) {
          handleMaintenanceTransition();
        }
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 15000);
    return () => clearInterval(interval);
  }, [lastMaintenanceCheck, maintenanceMode, isTransitioningToMaintenance]);

  // Add transition overlay
  useEffect(() => {
    if (isTransitioningToMaintenance) {
      document.body.style.opacity = "0.5";
      document.body.style.transition = "opacity 0.5s ease-in-out";
    } else {
      document.body.style.opacity = "1";
    }
    return () => {
      document.body.style.opacity = "1";
    };
  }, [isTransitioningToMaintenance]);

  // Error display
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Set the CSS variable for the header height that will be used by the ticker
  useEffect(() => {
    // Function to update the header height CSS variable
    const updateHeaderHeight = () => {
      // Base header height
      let baseHeight = isCompact 
        ? (window.innerWidth >= 640 ? 3.5 : 3) // sm:h-14 (3.5rem) or h-12 (3rem)
        : (window.innerWidth >= 640 ? 4 : 3.5); // sm:h-16 (4rem) or h-14 (3.5rem)
      
      // Additional height for banners
      let additionalHeight = 0;
      
      // Add banned user banner height if present
      if (user?.is_banned) {
        additionalHeight += 2.5; // ~40px (py-2 + text + border)
      }
      
      // Add maintenance mode banner height if present
      if (maintenanceMode) {
        additionalHeight += 2; // ~32px (py-1.5 + text)
      }
      
      // Set the CSS variable with the total height
      document.documentElement.style.setProperty('--header-height', `${baseHeight + additionalHeight}rem`);
    };
    
    // Set initial value
    updateHeaderHeight();
    
    // Add resize listener to update when screen size changes
    window.addEventListener('resize', updateHeaderHeight);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [isCompact, user?.is_banned, maintenanceMode]);

  // Header - Fixed sticky positioning by removing wrapper div
  return (
    <header
      className={`bg-dark-200/30 backdrop-blur-lg sticky top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isCompact ? "h-12 sm:h-14" : "h-14 sm:h-16"}`}
      onClick={(e) => e.stopPropagation()}
    >
        {/* Banned User Banner */}
        {user?.is_banned && (
          <div className="bg-red-500/10 border-b border-red-500/20">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <p className="text-red-400 text-sm text-center">
                Uh-oh! You're been banned from DegenDuel. GG.
                {user.ban_reason ? `: ${user.ban_reason}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Maintenance Mode Banner */}
        {maintenanceMode && (
          <div className="relative overflow-hidden">
            {/* Base glow layer */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-yellow-400/20 to-yellow-400/10" />

            {/* Primary caution stripes - flowing left */}
            <div
              className="absolute inset-0 animate-caution-flow-left"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, transparent 0, transparent 10px, #fbbf24 10px, #fbbf24 20px, transparent 20px, transparent 30px)",
                backgroundSize: "200% 200%",
                opacity: 0.15,
              }}
            />

            {/* Secondary caution stripes - flowing right */}
            <div
              className="absolute inset-0 animate-caution-flow-right"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent 0, transparent 10px, #000 10px, #000 20px, transparent 20px, transparent 30px)",
                backgroundSize: "200% 200%",
                opacity: 0.1,
              }}
            />

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent animate-shine-slow" />

            {/* Content */}
            <div className="relative py-1.5">
              <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Desktop message */}
                <p className="hidden sm:flex items-center justify-center gap-2 text-yellow-400 text-sm font-bold tracking-wider uppercase whitespace-nowrap">
                  <span className="animate-pulse font-bold">&lt;!</span>
                  <span>DEGENDUEL MAINTENANCE IN PROGRESS</span>
                  <span className="animate-pulse font-bold">!&gt;</span>
                </p>
                {/* Mobile message */}
                <p className="sm:hidden flex items-center justify-center gap-2 text-yellow-400 text-sm font-bold tracking-wider uppercase whitespace-nowrap">
                  <span className="animate-pulse font-bold">&lt;!</span>
                  <span>MAINTENANCE</span>
                  <span className="animate-pulse font-bold">!&gt;</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add transition overlay */}
        {isTransitioningToMaintenance && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="text-white text-xl font-cyber animate-pulse">
              Entering Maintenance Mode...
            </div>
          </div>
        )}

        <div className="relative max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-8">
          {/* Main header content */}
          <div
            className={`relative flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isCompact ? "h-12 sm:h-14" : "h-14 sm:h-16"}`}
          >
            {/* Left section: Logo and Nav */}
            <div className="flex items-center">
              {/* Logo - New clean version */}
              <div
                className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                  ${isCompact ? "scale-[0.9]" : "scale-100"}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Logo
                  size={isCompact ? "sm" : "md"}
                  asLink={true}
                  animated={true}
                  enhancedGlow={true}
                  glowColor="#9933ff"
                />
              </div>

              {/* Main Navigation - new streamlined version */}
              <nav className="hidden md:flex items-center ml-6">
                {/* Check if user is authenticated or if we're past the release date */}
                {(isAuthenticated() || new Date() >= new Date(import.meta.env.VITE_RELEASE_DATE_TOKEN_LAUNCH_DATETIME || '2025-12-31T23:59:59-05:00')) ? (
                  <div className="flex items-center bg-dark-300/50 backdrop-blur-md rounded-md border border-brand-400/20 overflow-visible shadow-md nav-dropdown-container">
                    
                    {/* Import directly with existing components for now */}
                    <ContestsDropdown isCompact={isCompact} />
                    <TokensDropdown isCompact={isCompact} />
                    <RankingsDropdown isCompact={isCompact} />
                    
                    {/* 
                      Enhanced dropdowns can be implemented after testing:
                      <EnhancedDropdown 
                        label="Contests" 
                        items={contestItems} 
                        isCompact={isCompact} 
                        isAuthenticated={!!user} 
                        colorScheme="brand" 
                      />
                      <EnhancedDropdown 
                        label="Tokens" 
                        items={tokenItems} 
                        isCompact={isCompact} 
                        colorScheme="cyber" 
                      />
                      <EnhancedDropdown 
                        label="Rankings" 
                        items={rankingItems} 
                        isCompact={isCompact} 
                        colorScheme="success" 
                      /> 
                    */}
                  </div>
                ) : (
                  /* Show pre-release message for non-authenticated users */
                  <div className="flex items-center ml-6">
                    <div className="bg-brand-500/10 text-brand-400 px-4 py-2 rounded-md text-sm font-medium border border-brand-500/20">
                      <span className="hidden sm:inline">Launch imminent</span>
                      <span className="sm:hidden">Launch imminent</span>
                    </div>
                  </div>
                )}
              </nav>
            </div>

            {/* Center section - empty now that ticker is moved to its own component */}
            <div className="flex-1"></div>

            {/* Right section: Auth and Mobile Menu */}
            <div
              className={`flex items-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
              ${
                isCompact
                  ? "gap-1 sm:gap-1.5 md:gap-2"
                  : "gap-2 sm:gap-3 md:gap-4"
              }`}
            >
              {/* Desktop user menu or connect button */}
              <div className="hidden md:block">
                <AnimatePresence mode="wait">
                  {user ? (
                    <motion.div
                      key="user-menu"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <UserMenu
                        user={user}
                        onDisconnect={disconnectWallet}
                        isCompact={isCompact}
                        unreadNotifications={unreadCount}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="connect-button"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {/* Desktop Login Options Button */}
                      <div className="flex items-center">
                        <LoginOptionsButton compact={isCompact} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Mobile menu with auth integrated */}
              <div className="md:hidden">
                <MobileMenuButton 
                  isCompact={isCompact} 
                  onDisconnect={disconnectWallet}
                  unreadNotifications={unreadCount}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full z-50"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-b-lg px-4 py-2">
                <p className="text-red-400 text-sm">{error.toString()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
  );
};
