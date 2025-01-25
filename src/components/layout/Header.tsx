import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../store/useStore";
import { Button } from "../ui/Button";

export const Header: React.FC = () => {
  const {
    user,
    connectWallet,
    disconnectWallet,
    isConnecting,
    error,
    clearError,
  } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isSuperAdmin, isAdmin } = useAuth();

  // Auto-clear errors after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-dark-200 border-b border-dark-300 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main header row */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
              DegenDuel
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:space-x-8">
            <Link
              to="/contests"
              className="text-lg font-medium text-gray-100 hover:text-brand-400 transition-colors"
            >
              Contests
            </Link>
            <Link
              to="/tokens"
              className="text-lg font-medium text-gray-400 hover:text-brand-400 transition-colors"
            >
              Tokens
            </Link>
            <div className="relative group">
              <span className="text-lg font-medium text-gray-400 hover:text-brand-400 transition-colors cursor-pointer">
                Rankings
              </span>
              <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-dark-300 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-1">
                  <Link
                    to="/rankings/global"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400"
                  >
                    Global Rankings
                  </Link>
                  <Link
                    to="/rankings/performance"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400"
                  >
                    Contest Performance
                  </Link>
                </div>
              </div>
            </div>
            {user && (
              <Link
                to="/profile"
                className="text-lg font-medium text-gray-400 hover:text-brand-400 transition-colors"
              >
                Profile
              </Link>
            )}
            {(isAdmin() || isSuperAdmin()) && (
              <div className="relative group">
                <span className="text-lg font-medium text-brand-400 hover:text-brand-300 transition-colors cursor-pointer">
                  Admin
                </span>
                <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-dark-300 ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
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
                <span className="text-sm text-gray-400">{user.nickname}</span>
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
            onClick={toggleMenu}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-200 hover:bg-dark-300 focus:outline-none"
          >
            <span className="sr-only">Open main menu</span>
            {!isMenuOpen ? (
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
          className={`${
            isMenuOpen ? "block" : "hidden"
          } md:hidden border-t border-dark-300 py-2`}
        >
          <div className="space-y-1 pb-3 pt-2">
            <Link
              to="/contests"
              className="block px-3 py-2 text-base font-medium text-gray-100 hover:bg-dark-300 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Contests
            </Link>
            <Link
              to="/tokens"
              className="block px-3 py-2 text-base font-medium text-gray-400 hover:bg-dark-300 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Tokens
            </Link>
            <div className="px-3 py-2">
              <span className="block text-base font-medium text-gray-400">
                Rankings
              </span>
              <Link
                to="/rankings/global"
                className="block px-3 py-2 text-sm font-medium text-gray-400 hover:bg-dark-300 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Global Rankings
              </Link>
              <Link
                to="/rankings/performance"
                className="block px-3 py-2 text-sm font-medium text-gray-400 hover:bg-dark-300 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Contest Performance
              </Link>
            </div>
            {user && (
              <Link
                to="/profile"
                className="block px-3 py-2 text-base font-medium text-gray-400 hover:bg-dark-300 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
            )}
            {(isAdmin() || isSuperAdmin()) && (
              <div className="px-3 py-2">
                <span className="block text-base font-medium text-brand-400">
                  Admin
                </span>
                {isAdmin() && (
                  <Link
                    to="/admin"
                    className="block px-3 py-2 text-sm font-medium text-gray-400 hover:bg-dark-300 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contest Admin
                  </Link>
                )}
                {isSuperAdmin() && (
                  <>
                    <Link
                      to="/superadmin"
                      className="block px-3 py-2 text-sm font-medium text-gray-400 hover:bg-dark-300 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      SuperAdmin Tools
                    </Link>
                    <Link
                      to="/amm-sim"
                      className="block px-3 py-2 text-sm font-medium text-gray-400 hover:bg-dark-300 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      AMM Simulator
                    </Link>
                    <Link
                      to="/api-playground"
                      className="block px-3 py-2 text-sm font-medium text-gray-400 hover:bg-dark-300 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      API Playground
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
                  <div className="text-sm text-gray-400">{user.nickname}</div>
                  <Button
                    onClick={disconnectWallet}
                    variant="gradient"
                    size="sm"
                    className="w-full"
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={connectWallet}
                  variant="gradient"
                  size="sm"
                  className="w-full"
                  disabled={isConnecting}
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              )}
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
  );
};
