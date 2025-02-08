// src/components/layout/Header.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { isContestLive } from "../../lib/utils";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import type { Contest } from "../../types/index";
import { Button } from "../ui/Button";
import { LiveContestTicker } from "./LiveContestTicker";
import { UserMenu } from "./UserMenu";

export const Header: React.FC = () => {
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
  const { isSuperAdmin, isAdmin } = useAuth();
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastMaintenanceCheck, setLastMaintenanceCheck] = useState<number>(0);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        // If not in maintenance mode, fetch contests
        if (!maintenanceMode) {
          const response = await ddApi.contests.getAll();
          const contests = Array.isArray(response) ? response : [];

          setActiveContests(contests.filter(isContestLive) || []);
        } else {
          // Clear contests during maintenance mode
          setActiveContests([]);
        }
      } catch (err: any) {
        // If we get a 503, that means we're in maintenance mode
        if (err?.status === 503 || err?.message?.includes("503")) {
          setMaintenanceMode(true);
        }
        console.error("Failed to load contests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContests();

    // Refresh contests every minute
    const interval = setInterval(fetchContests, 60000);
    return () => clearInterval(interval);
  }, [maintenanceMode, setMaintenanceMode]);

  // Auto-clear errors after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Add maintenance mode check on mount and every 30 seconds
  useEffect(() => {
    const checkMaintenance = async () => {
      const now = Date.now();
      // Only check if 30 seconds have passed since last check
      if (now - lastMaintenanceCheck < 30000) return;

      try {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setMaintenanceMode(isInMaintenance);
        setLastMaintenanceCheck(now);
      } catch (err: any) {
        // If we get a 503, that means we're in maintenance mode
        if (err?.status === 503 || err?.message?.includes("503")) {
          setMaintenanceMode(true);
        }
        console.error("Failed to check maintenance mode:", err);
      }
    };

    checkMaintenance();
    const interval = setInterval(checkMaintenance, 30000);
    return () => clearInterval(interval);
  }, [setMaintenanceMode, lastMaintenanceCheck]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <header className="relative bg-dark-200/30 backdrop-blur-lg sticky top-0 z-50">
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
        {/* {isAdmin() && maintenanceMode && ( */}
        {maintenanceMode && (
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-yellow-400/20" />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, #000 0, #000 10px, #fbbf24 10px, #fbbf24 20px)",
                opacity: 0.15,
              }}
            />
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-2 relative">
              <p className="text-yellow-400 text-sm text-center font-bold tracking-wider uppercase flex items-center justify-center gap-2">
                <span className="animate-pulse">⚠</span>
                ⚙️ DegenDuel maintenance in progress ⚙️
                <span className="animate-pulse">⚠</span>
              </p>
            </div>
          </div>
        )}

        <div className="relative max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Glass base with visible blur */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark-200/60 to-dark-200/30 backdrop-blur-lg" />

          {/* Visible gradient background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-500/20 via-dark-200/5 to-brand-500/20" />
          </div>

          {/* Animated scan effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-x-0 h-1/2 bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-cyber-scan"
              style={{ animationDuration: "3s" }}
            />
          </div>

          {/* Glowing borders */}
          <div className="absolute inset-x-0 top-0">
            <div className="h-[1px] bg-brand-400/50" />
            <div className="h-[2px] bg-gradient-to-b from-brand-400/30 to-transparent blur-sm" />
          </div>
          <div className="absolute inset-x-0 bottom-0">
            <div className="h-[1px] bg-cyber-400/50" />
            <div className="h-[2px] bg-gradient-to-b from-cyber-400/30 to-transparent blur-sm" />
          </div>

          {/* Corner accents with glow */}
          <div className="absolute top-0 left-0 w-20 h-20">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-brand-400/80" />
            <div className="absolute top-0 left-0 h-full w-[1px] bg-gradient-to-b from-brand-400/80 to-transparent" />
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-b from-brand-400/30 to-transparent blur-sm" />
          </div>
          <div className="absolute top-0 right-0 w-20 h-20">
            <div className="absolute top-0 right-0 w-full h-[1px] bg-brand-400/80" />
            <div className="absolute top-0 right-0 h-full w-[1px] bg-gradient-to-b from-brand-400/80 to-transparent" />
            <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-b from-brand-400/30 to-transparent blur-sm" />
          </div>

          {/* Main header content */}
          <div className="relative flex items-center justify-between h-16 min-h-[64px]">
            {/* Main Logo */}
            <Link
              to="/"
              className="flex items-center gap-1 group relative pl-2 md:pl-5 flex-shrink-0 min-w-[80px]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Container for the compact DxD logo */}
              <div className="relative flex items-center justify-center scale-[0.85] sm:scale-100">
                {/* Shockwave effect container */}
                <div
                  className="absolute inset-0 rounded-full animate-logo-shockwave"
                  style={{ animationDelay: "1s" }}
                />

                {/* DD container with relative positioning */}
                <div className="relative flex items-center gap-[2px]">
                  {/* First D with purple/violet color */}
                  <span className="text-3xl sm:text-4xl font-cyber text-purple-400 group-hover:text-purple-300 transition-colors animate-logo-slam-left inline-block tracking-tighter relative">
                    <span className="relative z-20">D</span>
                    {/* 3D layers for depth */}
                    <span className="absolute inset-0 text-purple-500 translate-x-[1px] translate-y-[1px] z-10">
                      D
                    </span>
                    <span className="absolute inset-0 text-purple-600 translate-x-[2px] translate-y-[2px] z-[5]">
                      D
                    </span>
                    <span className="absolute inset-0 text-purple-700 translate-x-[3px] translate-y-[3px] z-[1]">
                      D
                    </span>
                    {/* Glow effect */}
                    <span className="absolute inset-0 blur-[2px] text-purple-400/50 z-0">
                      D
                    </span>
                  </span>
                  {/* Second D with grey-white color */}
                  <span className="text-3xl sm:text-4xl font-cyber text-gray-300 group-hover:text-gray-200 transition-colors animate-logo-slam-right inline-block tracking-tighter relative">
                    <span className="relative z-20">D</span>
                    {/* 3D layers for depth */}
                    <span className="absolute inset-0 text-gray-400 translate-x-[1px] translate-y-[1px] z-10">
                      D
                    </span>
                    <span className="absolute inset-0 text-gray-500 translate-x-[2px] translate-y-[2px] z-[5]">
                      D
                    </span>
                    <span className="absolute inset-0 text-gray-600 translate-x-[3px] translate-y-[3px] z-[1]">
                      D
                    </span>
                    {/* Glow effect */}
                    <span className="absolute inset-0 blur-[2px] text-gray-300/50 z-0">
                      D
                    </span>
                  </span>

                  {/* Centered x overlay */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                    <span className="text-xl sm:text-2xl font-display text-cyan-400 inline-block animate-spin-slow relative">
                      <span className="relative z-10">×</span>
                      {/* Shadow effect */}
                      <span className="absolute inset-0 text-cyan-600 blur-[1px] -translate-y-[1px] translate-x-[1px] z-0">
                        ×
                      </span>
                    </span>
                    {/* Energy burst effect */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="absolute w-8 h-8 bg-cyan-400/20 rounded-full animate-ping" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Main Navigation */}
            <motion.nav
              className="hidden md:flex items-center gap-6 ml-8"
              initial={false}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/contests"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Contests
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/tokens"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Tokens
                </Link>
              </motion.div>
              <div className="relative group">
                <motion.button
                  className="text-gray-300 hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Rankings
                </motion.button>
                <motion.div
                  className="absolute left-0 mt-2 w-48 bg-dark-200/95 backdrop-blur-lg border border-brand-500/30 rounded-lg shadow-xl overflow-hidden"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.2 },
                  }}
                  style={{
                    opacity: "var(--tw-enter-opacity, 0)",
                    transform:
                      "var(--tw-enter-transform, translate3d(0, -10px, 0) scale(0.95))",
                  }}
                >
                  <div className="p-2 space-y-1">
                    <motion.div whileHover={{ x: 4 }}>
                      <Link
                        to="/rankings/global"
                        className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-brand-500/20 rounded-lg transition-colors"
                      >
                        Global Rankings
                      </Link>
                    </motion.div>
                    <motion.div whileHover={{ x: 4 }}>
                      <Link
                        to="/rankings/performance"
                        className="block px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-brand-500/20 rounded-lg transition-colors"
                      >
                        Performance Rankings
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </motion.nav>

            {/* Right section */}
            <motion.div className="flex items-center gap-4" initial={false}>
              {/* Live Contest Ticker */}
              <AnimatePresence>
                {!loading && activeContests.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <LiveContestTicker
                      contests={activeContests}
                      loading={loading}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Auth Section */}
              <AnimatePresence mode="wait">
                {user ? (
                  <motion.div
                    key="user-menu"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <UserMenu
                      user={user}
                      onDisconnect={disconnectWallet}
                      isAdmin={isAdmin()}
                      isSuperAdmin={isSuperAdmin()}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="connect-button"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Button
                      onClick={connectWallet}
                      disabled={isConnecting}
                      className="bg-brand-500 hover:bg-brand-600 text-white"
                    >
                      {isConnecting ? "Connecting..." : "Connect Wallet"}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Error display with animation */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-4"
            >
              <p className="text-red-400 text-sm">{error.message}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
};
