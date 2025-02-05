// src/components/layout/Header.tsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { isContestLive } from "../../lib/utils";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";
import type { Contest } from "../../types/index";
import { Button } from "../ui/Button";
import { LiveContestTicker } from "../ui/LiveContestTicker";

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

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const response = await ddApi.contests.getAll();
        const contests = Array.isArray(response) ? response : [];

        setActiveContests(contests.filter(isContestLive) || []);
        setOpenContests(
          contests.filter((contest: Contest) => contest.status === "pending") ||
            []
        );
      } catch (err) {
        console.error("Failed to load contests:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContests();

    // Refresh contests every minute
    const interval = setInterval(fetchContests, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-clear errors after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Add maintenance mode check on mount
  useEffect(() => {
    const checkMaintenance = async () => {
      if (isAdmin() || isSuperAdmin()) {
        const isInMaintenance = await ddApi.admin.checkMaintenanceMode();
        setMaintenanceMode(isInMaintenance);
      }
    };
    checkMaintenance();
  }, [isAdmin, isSuperAdmin, setMaintenanceMode]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <header className="bg-dark-200/95 backdrop-blur-lg border-b border-dark-300/50 sticky top-0 z-50 shadow-lg shadow-black/20">
        {user?.is_banned && (
          <div className="bg-red-500/10 border-b border-red-500/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <p className="text-red-400 text-sm text-center">
                Uh-oh! You're been banned from DegenDuel. GG.
                {user.ban_reason ? `: ${user.ban_reason}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Maintenance Mode Banner for Admins */}
        {isAdmin() && maintenanceMode && (
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 relative">
              <p className="text-yellow-400 text-sm text-center font-bold tracking-wider uppercase flex items-center justify-center gap-2">
                <span className="animate-pulse">⚠</span>
                Maintenance Mode Active
                <span className="animate-pulse">⚠</span>
              </p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/5 via-transparent to-brand-600/5" />

          {/* Main header row */}
          <div className="flex items-center justify-between h-16 relative">
            {/* Logo */}
            <Link
              to="/"
              className="flex-shrink-0 relative group"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600 group-hover:animate-pulse-fast">
                DegenDuel
              </span>
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-400/20 to-brand-600/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                      to="/rankings/global"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400/50 hover:text-brand-400 transition-colors"
                    >
                      Global Rankings
                    </Link>
                    <Link
                      to="/rankings/performance"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400/50 hover:text-brand-400 transition-colors"
                    >
                      Contest Performance
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
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400"
                        >
                          Contest Admin
                        </Link>
                      )}
                      {isSuperAdmin() && (
                        <>
                          <Link
                            to="/superadmin"
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400"
                          >
                            SuperAdmin Tools
                          </Link>
                          <Link
                            to="/amm-sim"
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400"
                          >
                            AMM Simulator
                          </Link>
                          <Link
                            to="/api-playground"
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400"
                          >
                            API Playground
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </nav>

            {/* Desktop Wallet Connection */}
            <div className="hidden md:flex md:items-center md:space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/profile"
                    className="text-sm text-gray-400 hover:text-brand-400 transition-colors flex items-center"
                  >
                    <span>{user.nickname}</span>
                    {user.is_banned && (
                      <span
                        className="ml-1.5 text-red-500"
                        title={user.ban_reason || "Account banned"}
                      >
                        🚫
                      </span>
                    )}
                  </Link>
                  <Button
                    onClick={disconnectWallet}
                    variant="gradient"
                    size="sm"
                    className="relative group"
                  >
                    <span className="relative z-10">Disconnect</span>
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={connectWallet}
                  variant="gradient"
                  size="sm"
                  className="relative group"
                  disabled={isConnecting}
                >
                  <span className="relative z-10">
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                  </span>
                </Button>
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

          {/* Add LiveContestTicker below the main header content */}
          <LiveContestTicker
            contests={[...activeContests, ...openContests]}
            loading={loading}
          />

          {/* Mobile Menu */}
          <div
            className={`absolute left-0 right-0 top-[64px] ${
              isMenuOpen ? "block" : "hidden"
            } md:hidden`}
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
                          to="/profile"
                          className="text-sm text-gray-400 hover:text-brand-400 transition-colors flex items-center"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsMenuOpen(false);
                            window.location.href = "/profile";
                          }}
                        >
                          <span>{user.nickname}</span>
                          {user.is_banned && (
                            <span
                              className="ml-1.5 text-red-500 animate-pulse"
                              title={user.ban_reason || "Account banned"}
                            >
                              🚫
                            </span>
                          )}
                        </Link>
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            disconnectWallet();
                            setIsMenuOpen(false);
                          }}
                          variant="gradient"
                          size="sm"
                          className="w-full group"
                        >
                          <span className="relative z-10 group-hover:animate-glitch">
                            Disconnect
                          </span>
                        </Button>
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
      </header>
    </div>
  );
};
