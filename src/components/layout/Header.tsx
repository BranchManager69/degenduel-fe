// src/components/layout/Header.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";

import { ContestsDropdown } from "./ContestsDropdown";
import { LiveContestTicker } from "./LiveContestTicker";
import { LivePriceTicker } from "./LivePriceTicker";
import { MobileMenuButton } from "./MobileMenuButton";
import { RankingsDropdown } from "./RankingsDropdown";
import { TokensDropdown } from "./TokensDropdown";
import { useAuth } from "../../hooks/useAuth";
import { useNotificationWebSocket } from "../../hooks/websocket/useNotificationWebSocket";
import { useScrollHeader } from "../../hooks/useScrollHeader";
import { isContestLive } from "../../lib/utils";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import type { Contest } from "../../types/index";
import { ConnectWalletButton } from "../auth/ConnectWalletButton";
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
  const { isAdmin } = useAuth();
  const { unreadCount } = useNotificationWebSocket();
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastMaintenanceCheck, setLastMaintenanceCheck] = useState<number>(0);
  const [isTransitioningToMaintenance, setIsTransitioningToMaintenance] =
    useState(false);

  // Fetch contests
  useEffect(() => {
    const fetchContests = async () => {
      try {
        // Don't fetch if we're in maintenance mode
        if (maintenanceMode) {
          setActiveContests([]);
          setLoading(false);
          return;
        }

        const response = await ddApi.contests.getAll();
        const contests = Array.isArray(response) ? response : [];

        // TEMPORARY FIX: Including ALL contests regardless of status
        // We're temporarily disabling all filtering because:
        // 1. The contest evaluation service is not currently functional
        // 2. This ensures the LiveContestTicker displays content for all contest states
        // 3. The LiveContestTicker component already has formatting for all four status types
        //    (active, pending, completed, and cancelled)
        // 4. This is an easy temporary solution until the evaluation service is fixed
        //setActiveContests(contests || []);

        // NEVERMIND! C.E.S. should be back up and running now:
        setActiveContests(contests.filter(isContestLive) || []);
      } catch (err: any) {
        if (err?.status === 503 || err?.message?.includes("503")) {
          handleMaintenanceTransition();
        } else {
          console.error("Failed to load contests:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
    const interval = setInterval(fetchContests, 60000);
    return () => clearInterval(interval);
  }, [maintenanceMode]);

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
          // If transitioning out of maintenance mode, try to fetch contests first
          if (!isInMaintenance && maintenanceMode) {
            try {
              const response = await ddApi.contests.getAll();
              const contests = Array.isArray(response) ? response : [];
              setActiveContests(contests.filter(isContestLive) || []);
              useStore.setState({ maintenanceMode: false }); // Use store setState directly
            } catch (err) {
              console.error(
                "Failed to fetch contests during maintenance exit:",
                err,
              );
              // Don't update maintenance mode if we can't fetch contests
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

  // Header
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <header
        className={`bg-dark-200/30 backdrop-blur-lg sticky top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isCompact ? "h-12 sm:h-14" : "h-14 sm:h-16"}`}
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
                  <span className="animate-pulse">⚠</span>
                  <span>⚙️ DegenDuel maintenance in progress ⚙️</span>
                  <span className="animate-pulse">⚠</span>
                </p>
                {/* Mobile message */}
                <p className="sm:hidden flex items-center justify-center gap-2 text-yellow-400 text-sm font-bold tracking-wider uppercase whitespace-nowrap">
                  <span className="animate-pulse">⚠</span>
                  <span>⚙️ Maintenance in progress ⚙️</span>
                  <span className="animate-pulse">⚠</span>
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
                />
              </div>

              {/* Main Navigation - new streamlined version */}
              <nav className="hidden md:flex items-center ml-6">
                <div className="flex items-center bg-dark-300/50 backdrop-blur-md rounded-md border border-brand-400/20">
                  <ContestsDropdown isCompact={isCompact} />
                  <TokensDropdown isCompact={isCompact} />
                  <RankingsDropdown isCompact={isCompact} />
                </div>
              </nav>
            </div>

            {/* Center section: Live Contest Ticker */}
            <div
              className={`flex-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
              ${
                isCompact ? "mx-2 sm:mx-3 md:mx-4" : "mx-3 sm:mx-4 md:mx-8"
              } min-w-0`}
            >
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="w-full"
                >
                  <LiveContestTicker
                    contests={activeContests}
                    loading={loading}
                    isCompact={isCompact}
                  />
                </motion.div>
              </AnimatePresence>
              
              {/* Token Price Ticker */}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="w-full mt-px" // Add slight margin to separate the tickers
                >
                  <LivePriceTicker 
                    isCompact={isCompact}
                    significantChangeThreshold={3}
                    maxTokens={15}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right section: Auth and Mobile Menu */}
            <div
              className={`flex items-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
              ${
                isCompact
                  ? "gap-1 sm:gap-1.5 md:gap-2"
                  : "gap-2 sm:gap-3 md:gap-4"
              }`}
            >
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
                    {/* Use our centralized ConnectWalletButton component */}
                    <div className="flex items-center">
                      <ConnectWalletButton compact={isCompact} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="md:hidden">
                <MobileMenuButton isCompact={isCompact} />
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
    </div>
  );
};
