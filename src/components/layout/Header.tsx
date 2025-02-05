// src/components/layout/Header.tsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { isContestLive } from "../../lib/utils";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import type { Contest } from "../../types/index";
import { Button } from "../ui/Button";
import { LiveContestTicker } from "./LiveContestTicker";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isSuperAdmin, isAdmin } = useAuth();
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [openContests, setOpenContests] = useState<Contest[]>([]);
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
          setOpenContests(
            contests.filter(
              (contest: Contest) => contest.status === "pending"
            ) || []
          );
        } else {
          // Clear contests during maintenance mode
          setActiveContests([]);
          setOpenContests([]);
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <header className="relative bg-dark-200/40 backdrop-blur-xl sticky top-0 z-50">
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
          <div className="absolute inset-0 bg-gradient-to-b from-dark-200/80 to-dark-200/40 backdrop-blur-xl" />

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
          <div className="relative flex items-center justify-between h-16">
            {/* Main Logo */}
            <Link
              to="/"
              className="flex items-center gap-1 group relative"
              onClick={(e) => e.stopPropagation()}
            >
              <span
                data-text="DEGEN"
                className="text-sm font-black tracking-tight font-pressStart relative
                  text-transparent bg-clip-text bg-gradient-to-r from-violet-500 via-pink-500 to-violet-500 
                  bg-[length:200%_100%] animate-gradientX
                  after:absolute after:inset-0
                  after:bg-gradient-to-r after:from-transparent after:via-white/95 after:to-transparent
                  after:translate-x-[-100%] after:animate-shine after:bg-clip-text
                  [text-shadow:0_0_5px_rgba(139,92,246,0.15),0_0_10px_rgba(139,92,246,0.1)]
                  transition-colors duration-300 group-hover:text-purple-500"
              >
                DEGEN
              </span>
              <span className="text-base font-extrabold text-gray-400/50 group-hover:text-gray-400/70 transition-colors duration-300">
                ×
              </span>
              <span
                data-text="DUEL"
                className="text-sm font-black tracking-tight font-pressStart relative
                  text-transparent bg-clip-text bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
                  after:absolute after:inset-0
                  after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent
                  after:translate-x-[-100%] after:animate-shine after:bg-clip-text
                  [text-shadow:0_0_3px_rgba(139,92,246,0.1),0_0_5px_rgba(139,92,246,0.05)]
                  transition-colors duration-300 group-hover:text-gray-100"
              >
                DUEL
              </span>

              {/* Hover underline effect */}
              <div
                className="absolute -bottom-1 left-0 w-full h-0.5 scale-x-0 group-hover:scale-x-100
                bg-gradient-to-r from-transparent via-purple-500/50 to-transparent
                transition-transform duration-300 origin-center"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav
              className="hidden md:flex md:items-center md:space-x-8"
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                to="/contests"
                className="text-lg font-medium text-gray-100 hover:text-brand-400 transition-colors relative group"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="relative z-10 group-hover:animate-glitch">
                  Contests
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                to="/tokens"
                className="text-lg font-medium text-gray-400 hover:text-brand-400 transition-colors relative group"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="relative z-10 group-hover:animate-glitch">
                  Tokens
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <div className="relative group">
                <span className="text-lg font-medium text-gray-400 hover:text-brand-400 transition-colors cursor-pointer">
                  Rankings
                </span>
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-dark-300/95 backdrop-blur-sm ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30">
                  <div className="py-1">
                    <Link
                      to="/rankings/performance"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400/50 hover:text-brand-400 transition-colors"
                    >
                      Degen Leaderboard
                    </Link>
                    <Link
                      to="/rankings/global"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400/50 hover:text-brand-400 transition-colors"
                    >
                      Global Rankings
                    </Link>
                  </div>
                </div>
              </div>
              {(isAdmin() || isSuperAdmin()) && (
                <div className="relative group">
                  <span className="text-lg font-medium text-brand-400 hover:text-brand-300 transition-colors cursor-pointer">
                    Admin
                  </span>
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-dark-300 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-30">
                    <div className="py-1">
                      {/* Superadmin Dashboard */}
                      {isSuperAdmin() && (
                        <Link
                          to="/superadmin"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400"
                        >
                          Superadmin Dashboard
                        </Link>
                      )}

                      {/* Admin Dashboard */}
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400"
                        >
                          Admin Dashboard
                        </Link>
                      )}

                      {/* Profit Simulator */}
                      {isSuperAdmin() && (
                        <Link
                          to="/amm-sim"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400"
                        >
                          Launch Simulator
                        </Link>
                      )}

                      {/* API Playground */}
                      {isSuperAdmin() && (
                        <Link
                          to="/api-playground"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400"
                        >
                          API Playground
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </nav>

            {/* Desktop Wallet Connection */}
            <div className="hidden md:flex md:items-center md:space-x-3">
              {user ? (
                <div className="relative group">
                  <button
                    onClick={() => {}}
                    className="relative px-4 py-1.5 bg-dark-300 group-hover:bg-dark-200 border border-brand-500/20 group-hover:border-brand-500/50 rounded flex items-center gap-2 transition-all duration-200"
                  >
                    {/* Glow effect */}
                    <div className="absolute inset-px rounded-sm bg-brand-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Username */}
                    <span className="relative font-cyber text-sm text-gray-300 group-hover:text-brand-400 transition-colors">
                      {user.nickname}
                    </span>

                    {/* Banned indicator */}
                    {user.is_banned && (
                      <span
                        className="text-red-500 animate-pulse"
                        title={user.ban_reason || "Account banned"}
                      >
                        🚫
                      </span>
                    )}

                    {/* Arrow icon */}
                    <svg
                      className="w-4 h-4 text-brand-500/50 group-hover:text-brand-500 transition-colors transform group-hover:rotate-180 duration-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-1 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-1 z-[60]">
                    <div className="relative bg-dark-200/95 backdrop-blur-sm border border-brand-500/20 rounded shadow-lg shadow-black/50 overflow-hidden">
                      {/* Menu items container */}
                      <div className="relative py-1">
                        <Link to="/me" className="block relative group/item">
                          <div className="absolute inset-0 bg-brand-500/0 group-hover/item:bg-brand-500/10 transition-colors" />
                          <div className="relative px-4 py-2 flex items-center gap-2">
                            <span className="text-sm text-gray-300 group-hover/item:text-brand-400 transition-colors">
                              Profile
                            </span>
                          </div>
                          {/* Left border highlight */}
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-500/0 group-hover/item:bg-brand-500 transition-colors" />
                        </Link>

                        <button
                          onClick={disconnectWallet}
                          className="block w-full relative group/item mt-1"
                        >
                          <div className="absolute inset-0 bg-red-500/0 group-hover/item:bg-red-500/10 transition-colors" />
                          <div className="relative px-4 py-2 flex items-center gap-2">
                            <span className="text-sm text-gray-400 group-hover/item:text-red-400 transition-colors">
                              Disconnect
                            </span>
                          </div>
                          {/* Left border highlight */}
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500/0 group-hover/item:bg-red-500 transition-colors" />
                        </button>
                      </div>

                      {/* Corner accents */}
                      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-brand-500/30" />
                      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-brand-500/30" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-brand-500/30" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-brand-500/30" />
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="relative px-4 py-1.5 bg-dark-300 hover:bg-dark-200 border border-brand-500/20 hover:border-brand-500/50 rounded flex items-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-px rounded-sm bg-brand-500/20 blur-sm opacity-0 hover:opacity-100 transition-opacity" />

                  {/* Button text */}
                  <span className="relative font-cyber text-sm text-gray-300 hover:text-brand-400 transition-colors">
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                  </span>
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Stop event propagation
                toggleMenu();
              }}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-dark-300 focus:outline-none"
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              {!isMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            className={`absolute left-0 right-0 top-[64px] ${
              isMenuOpen ? "block" : "hidden"
            } md:hidden z-[60]`}
          >
            <div
              className="bg-dark-200/95 backdrop-blur-lg border-t border-dark-300/50 shadow-lg shadow-black/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-h-[calc(100vh-64px)] overflow-y-auto">
                <div className="space-y-1 pb-3 pt-2">
                  <Link
                    to="/contests"
                    className="block px-3 py-2 text-base font-medium text-gray-100 hover:text-brand-400 hover:bg-dark-300/50 rounded-md transition-all duration-200 relative group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="relative z-10 group-hover:animate-glitch">
                      Contests
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                  <Link
                    to="/tokens"
                    className="block px-3 py-2 text-base font-medium text-gray-400 hover:text-brand-400 hover:bg-dark-300/50 rounded-md transition-all duration-200 relative group"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="relative z-10 group-hover:animate-glitch">
                      Tokens
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>

                  {/* Rankings Section */}
                  <div className="px-3 py-2 space-y-1">
                    <span className="block text-base font-medium text-brand-400 animate-cyber-pulse">
                      Rankings
                    </span>
                    <Link
                      to="/rankings/global"
                      className="block px-3 py-2 text-sm font-medium text-gray-400 hover:text-brand-400 hover:bg-dark-300/50 rounded-md transition-all duration-200 relative group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="relative z-10 group-hover:animate-glitch">
                        Global Rankings
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                    <Link
                      to="/rankings/performance"
                      className="block px-3 py-2 text-sm font-medium text-gray-400 hover:text-brand-400 hover:bg-dark-300/50 rounded-md transition-all duration-200 relative group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span className="relative z-10 group-hover:animate-glitch">
                        Contest Performance
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                  </div>

                  {/* Admin Section */}
                  {(isAdmin() || isSuperAdmin()) && (
                    <div className="px-3 py-2 space-y-1">
                      <span className="block text-base font-medium text-brand-400 animate-cyber-pulse">
                        Admin
                      </span>
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          className="block px-3 py-2 text-sm font-medium text-gray-400 hover:text-brand-400 hover:bg-dark-300/50 rounded-md transition-all duration-200 relative group"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="relative z-10 group-hover:animate-glitch">
                            Contest Admin
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </Link>
                      )}
                      {isSuperAdmin() && (
                        <>
                          <Link
                            to="/superadmin"
                            className="block px-3 py-2 text-sm font-medium text-gray-400 hover:text-brand-400 hover:bg-dark-300/50 rounded-md transition-all duration-200 relative group"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <span className="relative z-10 group-hover:animate-glitch">
                              SuperAdmin Tools
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </Link>
                          <Link
                            to="/amm-sim"
                            className="block px-3 py-2 text-sm font-medium text-gray-400 hover:text-brand-400 hover:bg-dark-300/50 rounded-md transition-all duration-200 relative group"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <span className="relative z-10 group-hover:animate-glitch">
                              AMM Simulator
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </Link>
                          <Link
                            to="/api-playground"
                            className="block px-3 py-2 text-sm font-medium text-gray-400 hover:text-brand-400 hover:bg-dark-300/50 rounded-md transition-all duration-200 relative group"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <span className="relative z-10 group-hover:animate-glitch">
                              API Playground
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </Link>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Mobile Wallet Connection */}
                <div className="pt-4 pb-3 border-t border-dark-300">
                  <div className="px-3 space-y-3">
                    {user ? (
                      <div className="space-y-3">
                        <Link
                          to="/me"
                          className="block px-3 py-2 text-sm font-medium text-gray-400 hover:text-brand-400 hover:bg-dark-300/50 rounded-md transition-all duration-200 relative group"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <span className="relative z-10 group-hover:animate-glitch">
                            Profile
                          </span>
                          {user.is_banned && (
                            <span
                              className="ml-1.5 text-red-500 animate-pulse"
                              title={user.ban_reason || "Account banned"}
                            >
                              🚫
                            </span>
                          )}
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            disconnectWallet();
                            setIsMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm font-medium text-gray-400 hover:text-brand-400 hover:bg-dark-300/50 rounded-md transition-all duration-200 relative group"
                        >
                          <span className="relative z-10 group-hover:animate-glitch">
                            Disconnect Wallet
                          </span>
                        </button>
                      </div>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          connectWallet();
                          setIsMenuOpen(false);
                        }}
                        variant="gradient"
                        size="sm"
                        className="w-full group"
                        disabled={isConnecting}
                      >
                        <span className="relative z-10 group-hover:animate-glitch">
                          {isConnecting ? "Connecting..." : "Connect Wallet"}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-4">
              <p className="text-red-400 text-sm">{error.message}</p>
            </div>
          )}
        </div>

        {/* Add LiveContestTicker below the main header content */}
        <LiveContestTicker
          contests={[...activeContests, ...openContests]}
          loading={loading}
        />
      </header>
    </div>
  );
};
