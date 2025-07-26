// src/components/layout/Header.tsx

/**
 * Header Component
 * 
 * @description This component is the main header for the application.
 * It displays the logo, user menu, and login button.
 * 
 * @author BranchManager69
 * @version 2.1.1
 * @created 2025-01-01
 * @updated 2025-05-23
 */

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useScrollHeader } from "../../hooks/ui/useScrollHeader";
import { useNotifications } from "../../hooks/websocket/topic-hooks/useNotifications";
import { useStore } from "../../store/useStore";
// import { useSystemSettings } from "../../hooks/websocket/topic-hooks/useSystemSettings";
import MiniLogo from "../logo/MiniLogo";
import NanoLogo from "../logo/NanoLogo";
import { MobileMenuButton } from './MobileMenuButton'; // TEMP
import { UserMenu } from './user-menu/UserMenu';
import SolanaTokenDisplay from "../SolanaTokenDisplay";
import { config } from "../../config/config";
// import { MenuBackdrop } from './menu/SharedMenuComponents';


export const Header: React.FC = () => {
  const { isCompact } = useScrollHeader(50);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // (why?) Get the store error message and clear the error
  const storeErrorMessage = useStore(state => state.error?.message || null);
  const clearStoreError = useStore(state => state.clearError);
  
  const { user, isAdministrator, isAuthenticated, logout } = useMigratedAuth(); 
  const { unreadCount } = useNotifications(); 
  // TODO: Add settings back in; may still be needed for other parts of the Header
  // const { settings } = useSystemSettings(); 
  
  const isMounted = useRef(true);

  // Log the component mount and unmount
  useEffect(() => {
    isMounted.current = true;
    //console.log("[Header STEP 2] Mounted");
    return () => {
      isMounted.current = false;
      //console.log("[Header STEP 2] Unmounted");
    };
  }, []);

  // Log the user, isAuthenticated, and isAdmin when they change
  useEffect(() => {
    //console.log("[Header EFFECT on auth change] User:", user, "IsAuthenticated:", isAuthenticated, "IsAdmin:", isAdministrator);
  }, [user, isAuthenticated, isAdministrator]);

  // Re-enable the effect for clearing storeError, but guarded
  useEffect(() => {
    if (storeErrorMessage && clearStoreError) {
      //console.log("[Header] Store error detected, will clear in 5s:", storeErrorMessage);
      // Clear the store error after 5 seconds
      const timer = setTimeout(() => {
        // Check if the component is still mounted
        if (isMounted.current) {
          //console.log("[Header] Clearing store error.");
          clearStoreError();
        }
      }, 5000);
      // Clear the timer when the component unmounts
      return () => clearTimeout(timer);
    }
  }, [storeErrorMessage, clearStoreError]); // Depends on the message string and clear function

  // Other effects (maintenance sync, header height) remain commented out for now

  //console.log("[Header STEP 4 - Error Banners Relocated] Rendering. User:", user ? user.id : null, "IsAuth:", isAuthenticated, "IsAdmin:", isAdministrator, "Compact:", isCompact, "StoreError:", storeErrorMessage ? "Yes" : "No", "UnreadNotifs:", unreadCount);

  const headerHeight = isCompact ? "h-12 sm:h-14" : "h-14 sm:h-16";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${headerHeight}
      ${isCompact ? 'bg-dark-200/30 backdrop-blur-lg' : 'bg-dark-200/30 backdrop-blur-lg'}
      ${isMobileMenuOpen ? 'backdrop-blur-[8px] bg-dark-200/60' : ''}
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Error Banners Container REMOVED from here */}
      
      {/* Banned User Banner (unsure if this needs to be removed also?)) */}
      {user?.banned && (

        // Banned User Banner Container
        <div className="bg-red-500/10 border-b border-red-500/20">

          {/* Banned User Banner Content */}
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <p className="text-red-400 text-sm text-center">
              Uh-oh, you're banned from DegenDuel... gg.
              {user?.banned_reason ? `: ${user.banned_reason}` : ""} 
            </p>
          </div>

        </div>

      )}

      {/* Maintenance Mode Banner - uses settings, so useSystemSettings hook might need to be restored if this is re-enabled fully */}
      {/* For now, assuming settings might come from a different source or this banner logic will be refined */}
      {/* {settings && typeof settings.maintenance_mode === 'object' && settings.maintenance_mode?.enabled && !isAdministrator && ( ... )} */}

      {/* Main Header Container */}
      <div className="relative max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-8">
        
        {/* Header Content */}
        <div
          className={`relative flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${headerHeight}`}
        >
          {/* Logo (links to Home) */}
          <Link to="/" className="flex items-center" aria-label="Home">
            {/* Use NanoLogo when compact, MiniLogo otherwise */}
            {isCompact 
              ? <NanoLogo /> 
              : <MiniLogo />
            } 
            {/* <IntroLogo /> */} {/* another option - full name */}
            {/* <Logo /> */} {/* another option - old logo image */}
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden sm:flex items-center gap-6 ml-8">
            <Link 
              to="/contests" 
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Contests
            </Link>
            <Link 
              to="/tokens" 
              className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
            >
              Tokens
            </Link>
          </nav>

          {/* Spacer */}
          <div className="flex-1"></div> 

          {/* User Menu */}
          <div
            className={`flex items-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${
              isCompact
                ? "gap-1 sm:gap-1.5 md:gap-2"
                : "gap-2 sm:gap-3 md:gap-4"
            }`}
          >

            {/* Desktop Balances and User Menu */}
            <div className="hidden md:flex items-center gap-3">
              <AnimatePresence mode="wait">
                {isAuthenticated && user ? (
                  <motion.div 
                    key="user-menu" 
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2"
                  >
                    {/* Token Balance Display (desktop only - for all users) */}
                    <Link
                      to="/wallet"
                      className="hidden md:block group relative cursor-pointer"
                    >
                      {/* Outer glow that intensifies on hover */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-0 group-hover:opacity-75 blur transition-all duration-300 group-hover:duration-200" />
                      
                      {/* Main container with enhanced styling - matching UserMenu height */}
                      <div className={`relative flex items-center gap-1 pl-2 pr-3 
                        ${isCompact ? "h-7" : "h-8"}
                        bg-gradient-to-r from-purple-900/40 via-purple-800/30 to-purple-900/40 
                        backdrop-blur-sm rounded-full 
                        border border-purple-500/15 group-hover:border-purple-400/30 
                        transition-all duration-300 transform group-hover:scale-105
                        shadow-lg shadow-purple-900/10 group-hover:shadow-purple-500/20`}>
                        
                        {/* Animated background gradient */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600/0 via-purple-500/10 to-purple-600/0 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-500
                          animate-pulse" />
                        
                        {/* Balance or Dividends display */}
                        <div className="relative text-purple-100 flex items-center">
                          {isAuthenticated && user ? (
                            <SolanaTokenDisplay 
                              mintAddress={config.SOLANA.DEGEN_TOKEN_ADDRESS}
                              walletAddress={user.wallet_address} 
                              compact={true}
                              className={`font-medium leading-none ${isCompact ? "text-sm" : "text-base"}`}
                              showSupply={false}
                              showHolders={false}
                            />
                          ) : (
                            <span className={`font-medium leading-none ${isCompact ? "text-sm" : "text-base"}`}>
                              Dividends
                            </span>
                          )}
                        </div>
                        
                        {/* Token icon - slightly smaller with more spacing */}
                        <div className="relative flex items-center justify-center w-4 h-4 ml-1">
                          <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-20" />
                          <div className="relative w-4 h-4 flex items-center justify-center">
                            <NanoLogo />
                          </div>
                        </div>
                        
                        {/* Chevron indicator */}
                        <svg className="w-3 h-3 ml-1 text-purple-300 group-hover:text-purple-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        
                        {/* Shimmer effect overlay */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 
                            bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>
                      </div>
                    </Link>
                    
                    <UserMenu 
                      user={user} 
                      onDisconnect={() => logout && logout()} 
                      isCompact={isCompact} 
                      unreadNotifications={unreadCount} 
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    key="login-btn"
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to="/login"
                      className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white 
                        bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 
                        rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-brand-500/25
                        ${isCompact ? 'h-8 text-xs' : 'h-10'}`}
                    >
                      Login
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              {/* <div className="w-8 h-8 bg-gray-500/30 rounded text-xs flex items-center justify-center text-gray-300">M</div> */} {/* REMOVE placeholder */}
              <MobileMenuButton 
                isCompact={isCompact}
                onDisconnect={() => logout && logout()}
                unreadNotifications={unreadCount}
                onMenuToggle={setIsMobileMenuOpen}
              />
            </div>

          </div>

        </div>
        
      </div>

    </header>
  );
};
