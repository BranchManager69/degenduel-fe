// src/components/layout/Header.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useScrollHeader } from "../../hooks/useScrollHeader";
import { isContestLive } from "../../lib/utils";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import type { Contest } from "../../types/index";
import { Button } from "../ui/Button";
import { LiveContestTicker } from "./LiveContestTicker";
import { MobileMenuButton } from "./MobileMenuButton";
import { UserMenu } from "./user-menu/UserMenu";

export const Header: React.FC = () => {
  const { isCompact } = useScrollHeader(50);
  const {
    user,
    connectWallet,
    disconnectWallet,
    isConnecting,
    error,
    clearError,
    maintenanceMode,
    setMaintenanceMode,
  } = useStore();
  const { isAdmin } = useAuth();
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

        // Filter to only include live contests
        // TODO: Why not include pending contests too?
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
                err
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
        className={`relative bg-dark-200/30 backdrop-blur-lg sticky top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
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
              {/* Logo */}
              <Link
                to="/"
                className={`flex items-center gap-1 group relative pl-1 sm:pl-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                  ${
                    isCompact
                      ? "scale-[0.8] sm:scale-[0.85]"
                      : "scale-[0.85] sm:scale-100"
                  }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative flex items-center justify-center">
                  <div className="relative flex items-center gap-[2px]">
                    <span className="text-3xl sm:text-4xl font-cyber text-purple-400 group-hover:text-purple-300 transition-colors animate-logo-slam-left inline-block tracking-tighter relative">
                      <span className="relative z-20">D</span>
                      <span className="absolute inset-0 text-purple-500 translate-x-[1px] translate-y-[1px] z-10">
                        D
                      </span>
                      <span className="absolute inset-0 text-purple-600 translate-x-[2px] translate-y-[2px] z-[5]">
                        D
                      </span>
                      <span className="absolute inset-0 text-purple-700 translate-x-[3px] translate-y-[3px] z-[1]">
                        D
                      </span>
                      <span className="absolute inset-0 blur-[2px] text-purple-400/50 z-0">
                        D
                      </span>
                    </span>
                    <span className="text-3xl sm:text-4xl font-cyber text-gray-300 group-hover:text-gray-200 transition-colors animate-logo-slam-right inline-block tracking-tighter relative">
                      <span className="relative z-20">D</span>
                      <span className="absolute inset-0 text-gray-400 translate-x-[1px] translate-y-[1px] z-10">
                        D
                      </span>
                      <span className="absolute inset-0 text-gray-500 translate-x-[2px] translate-y-[2px] z-[5]">
                        D
                      </span>
                      <span className="absolute inset-0 text-gray-600 translate-x-[3px] translate-y-[3px] z-[1]">
                        D
                      </span>
                      <span className="absolute inset-0 blur-[2px] text-gray-300/50 z-0">
                        D
                      </span>
                    </span>
                  </div>
                </div>
              </Link>

              {/* Main Navigation */}
              <nav className="hidden md:flex items-center space-x-6 ml-8">
                <Link
                  to="/contests"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Contests
                </Link>
                <Link
                  to="/tokens"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Tokens
                </Link>
                <Link
                  to="/leaderboards"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Rankings
                </Link>
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
                    <Button
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className={`bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 
                        text-white font-cyber transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                        ${
                          isCompact
                            ? "text-xs sm:text-sm py-1 sm:py-1.5 px-2 sm:px-3"
                            : "text-sm sm:text-base py-1.5 sm:py-2 px-3 sm:px-4"
                        }`}
                      variant="gradient"
                      size={isCompact ? "sm" : "md"}
                    >
                      {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </Button>
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
