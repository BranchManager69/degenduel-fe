import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { isAdminWallet } from "../../lib/auth";
import { useStore } from "../../store/useStore";
import { Button } from "../ui/Button";

export const Header: React.FC = () => {
  const {
    user,
    connectWallet,
    connectAsAdmin,
    disconnectWallet,
    isConnecting,
    error,
    clearError,
  } = useStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isSuperAdmin } = useAuth();

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
            <Link
              to="/profile"
              className="text-lg font-medium text-gray-400 hover:text-brand-400 transition-colors"
            >
              Profile
            </Link>
            {user && isAdminWallet(user.wallet_address) && (
              <Link
                to="/admin"
                className="text-lg font-medium text-brand-400 hover:text-brand-300 transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Admin Tools - Only shown to superadmins */}
          {isSuperAdmin() && (
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/amm-sim"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                AMM Simulator
              </Link>
              <Link
                to="/api-playground"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                API Playground
              </Link>
            </div>
          )}

          {/* Desktop Wallet Connection */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">{user.nickname}</span>
                {user.wallet_address ===
                  "BPuRhkeCkor7DxMrcPVsB4AdW6Pmp5oACjVzpPb72Mhp" && (
                  <Button
                    onClick={connectAsAdmin}
                    variant="gradient"
                    size="sm"
                    className="relative group bg-opacity-50"
                    disabled={isConnecting}
                  >
                    <span className="relative z-10">
                      {isConnecting ? "Connecting..." : "Admin Login"}
                    </span>
                  </Button>
                )}
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
            <Link
              to="/profile"
              className="block px-3 py-2 text-base font-medium text-gray-400 hover:bg-dark-300 rounded-md"
              onClick={() => setIsMenuOpen(false)}
            >
              Profile
            </Link>
            {user && isAdminWallet(user.wallet_address) && (
              <Link
                to="/admin"
                className="block px-3 py-2 text-base font-medium text-brand-400 hover:bg-dark-300 rounded-md"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin
              </Link>
            )}
          </div>

          {/* Mobile Wallet Connection */}
          <div className="border-t border-dark-300 pt-4 pb-3">
            {user ? (
              <div className="space-y-3 px-3">
                <div className="text-sm text-gray-400">{user.nickname}</div>
                {user.wallet_address ===
                  "BPuRhkeCkor7DxMrcPVsB4AdW6Pmp5oACjVzpPb72Mhp" && (
                  <Button
                    onClick={() => {
                      connectAsAdmin();
                      setIsMenuOpen(false);
                    }}
                    variant="gradient"
                    size="sm"
                    className="w-full"
                    disabled={isConnecting}
                  >
                    <span className="relative z-10">
                      {isConnecting ? "Connecting..." : "Admin Login"}
                    </span>
                  </Button>
                )}
                <Button
                  onClick={() => {
                    disconnectWallet();
                    setIsMenuOpen(false);
                  }}
                  variant="gradient"
                  size="sm"
                  className="w-full"
                >
                  <span className="relative z-10">Disconnect</span>
                </Button>
              </div>
            ) : (
              <div className="px-3">
                <Button
                  onClick={() => {
                    connectWallet();
                    setIsMenuOpen(false);
                  }}
                  variant="gradient"
                  size="sm"
                  className="w-full"
                  disabled={isConnecting}
                >
                  <span className="relative z-10">
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                  </span>
                </Button>
              </div>
            )}
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
