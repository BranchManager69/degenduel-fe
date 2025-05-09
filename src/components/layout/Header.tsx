// src/components/layout/Header.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef } from "react";

import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useScrollHeader } from "../../hooks/ui/useScrollHeader";
import { useNotifications } from "../../hooks/websocket/topic-hooks/useNotifications";
import { useSystemSettings } from "../../hooks/websocket/topic-hooks/useSystemSettings";
import { useStore } from "../../store/useStore";
import LoginOptionsButton from "../auth/LoginOptionsButton";
import Logo from "../ui/Logo";
import { ContestsDropdown } from "./ContestsDropdown";
import { MobileMenuButton } from "./MobileMenuButton";
import { RankingsDropdown } from "./RankingsDropdown";
import { TokensDropdown } from "./TokensDropdown";
import { UserMenu } from "./user-menu/UserMenu";

export const Header: React.FC = () => {
  const { isCompact } = useScrollHeader(50);
  const {
    disconnectWallet,
    error: storeError,
    clearError,
  } = useStore(state => ({ 
      disconnectWallet: state.disconnectWallet, 
      error: state.error, 
      clearError: state.clearError, 
  })); 
  const { user, isAdmin, isAuthenticated } = useMigratedAuth(); 
  
  const { unreadCount } = useNotifications();
  const { settings } = useSystemSettings();
  
  const isMounted = useRef(true);
  
  const isMaintenanceMode = settings?.maintenanceMode || false;
  const maintenanceMessage = settings?.maintenanceMessage;

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const currentStoreValue = useStore.getState().maintenanceMode;
    let redirectTimerId: number | undefined;
    if (isMaintenanceMode !== currentStoreValue) {
      console.log(`[Header] Syncing maintenanceMode to store: ${isMaintenanceMode}`);
      if (isMounted.current) {
        useStore.setState({ maintenanceMode: isMaintenanceMode });
      }

      if (isMaintenanceMode === true && !isAdmin) {
        console.log("[Header] Maintenance mode activated, redirecting non-admin.");
        redirectTimerId = window.setTimeout(() => {
          if (isMounted.current) {
            window.location.href = "/maintenance";
          }
        }, 500); 
      }
    }
    return () => {
      if (redirectTimerId) {
        clearTimeout(redirectTimerId);
      }
    };
  }, [isMaintenanceMode, isAdmin]);

  useEffect(() => {
    if (storeError) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [storeError, clearError]);

  useEffect(() => {
    const updateHeaderHeight = () => {
      let baseHeight = isCompact 
        ? (window.innerWidth >= 640 ? 3.5 : 3)
        : (window.innerWidth >= 640 ? 4 : 3.5);
      
      let additionalHeight = 0;
      
      if ((user as any)?.is_banned) {
        additionalHeight += 2.5;
      }
      
      if (isMaintenanceMode) {
        additionalHeight += 2;
      }
      
      document.documentElement.style.setProperty('--header-height', `${baseHeight + additionalHeight}rem`);
    };
    
    updateHeaderHeight();
    
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [isCompact, (user as any)?.is_banned, isMaintenanceMode]);

  return (
    <header
      className={`bg-dark-200/30 backdrop-blur-lg sticky top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isCompact ? "h-12 sm:h-14" : "h-14 sm:h-16"}`}
      onClick={(e) => e.stopPropagation()}
    >
        {user?.is_banned && (
          <div className="bg-red-500/10 border-b border-red-500/20">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <p className="text-red-400 text-sm text-center">
                Uh-oh! You're been banned from DegenDuel. GG.
                {user?.ban_reason ? `: ${user?.ban_reason}` : ""}
              </p>
            </div>
          </div>
        )}

        {isMaintenanceMode && (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-yellow-400/20 to-yellow-400/10" />

            <div
              className="absolute inset-0 animate-caution-flow-left"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, transparent 0, transparent 10px, #fbbf24 10px, #fbbf24 20px, transparent 20px, transparent 30px)",
                backgroundSize: "200% 200%",
                opacity: 0.15,
              }}
            />

            <div
              className="absolute inset-0 animate-caution-flow-right"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent 0, transparent 10px, #000 10px, #000 20px, transparent 20px, transparent 30px)",
                backgroundSize: "200% 200%",
                opacity: 0.1,
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent animate-shine-slow" />

            <div className="relative py-1.5">
              <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                <p className="hidden sm:flex items-center justify-center gap-2 text-yellow-400 text-sm font-bold tracking-wider uppercase whitespace-nowrap">
                  <span className="animate-pulse font-bold">&lt;!</span>
                  <span>{maintenanceMessage || "DEGENDUEL MAINTENANCE IN PROGRESS"}</span>
                  <span className="animate-pulse font-bold">!&gt;</span>
                </p>
                <p className="sm:hidden flex items-center justify-center gap-2 text-yellow-400 text-sm font-bold tracking-wider uppercase whitespace-nowrap">
                  <span className="animate-pulse font-bold">&lt;!</span>
                  <span>MAINTENANCE</span>
                  <span className="animate-pulse font-bold">!&gt;</span>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="relative max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-8">
          <div
            className={`relative flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isCompact ? "h-12 sm:h-14" : "h-14 sm:h-16"}`}
          >
            <div className="flex items-center">
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

              <nav className="hidden md:flex items-center ml-6">
                {(isAuthenticated || new Date() >= new Date(import.meta.env.VITE_RELEASE_DATE_TOKEN_LAUNCH_DATETIME || '2025-12-31T23:59:59-05:00')) ? (
                  <div className="flex items-center bg-dark-300/50 backdrop-blur-md rounded-md border border-brand-400/20 overflow-visible shadow-md nav-dropdown-container">
                    
                    <ContestsDropdown isCompact={isCompact} />
                    <TokensDropdown isCompact={isCompact} />
                    <RankingsDropdown isCompact={isCompact} />
                  </div>
                ) : (
                  <div className="flex items-center ml-6">
                    <div className="bg-brand-500/10 text-brand-400 px-4 py-2 rounded-md text-sm font-medium border border-brand-500/20">
                      <span className="hidden sm:inline">Launch imminent</span>
                      <span className="sm:hidden">Launch imminent</span>
                    </div>
                  </div>
                )}
              </nav>
            </div>

            <div className="flex-1"></div>

            <div
              className={`flex items-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
              ${
                isCompact
                  ? "gap-1 sm:gap-1.5 md:gap-2"
                  : "gap-2 sm:gap-3 md:gap-4"
              }`}
            >
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
                      <div className="flex items-center">
                        <LoginOptionsButton compact={isCompact} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
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

        <AnimatePresence>
          {storeError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full z-50"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-b-lg px-4 py-2">
                <p className="text-red-400 text-sm">{storeError.toString()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
  );
};
