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
import { useSolanaTokenData } from "../../hooks/data/useSolanaTokenData";
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
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
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
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Link to="/" className="flex items-center" aria-label="Home">
              <div className="relative">
                {/* Use NanoLogo when compact, MiniLogo otherwise - without BETA */}
                {isCompact 
                  ? <NanoLogo showBeta={false} /> 
                  : <MiniLogo showBeta={false} />
                }
                
                {/* Animated BETA text */}
                <motion.span
                  initial={false}
                  animate={{
                    fontSize: isCompact ? '5px' : '8px',
                    opacity: isCompact ? 0.6 : 0.8,
                    x: isCompact ? '-50%' : '2px',
                    y: isCompact ? '12px' : '-2px',
                    left: isCompact ? '50%' : '100%',
                  }}
                  transition={{
                    duration: 0.3,
                    ease: 'easeInOut'
                  }}
                  style={{
                    fontFamily: isCompact ? "'Russo One', sans-serif" : "'Orbitron', sans-serif",
                    fontWeight: isCompact ? 'normal' : 900,
                    letterSpacing: isCompact ? '0.1em' : '0.05em',
                    color: '#9D4EDD',
                    position: 'absolute',
                    whiteSpace: 'nowrap',
                    transformOrigin: 'left center'
                  }}
                >
                  BETA
                </motion.span>
              </div>
              {/* <IntroLogo /> */} {/* another option - full name */}
              {/* <Logo /> */} {/* another option - old logo image */}
            </Link>
          </motion.div>

          {/* Navigation Menu */}
          <nav className="flex items-center gap-2 sm:gap-6 ml-1 sm:ml-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Link 
                to="/contests" 
                className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm font-medium"
              >
                Contests
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Link 
                to="/tokens" 
                className="text-gray-400 hover:text-white transition-colors text-xs sm:text-sm font-medium"
              >
                Tokens
              </Link>
            </motion.div>
          </nav>

          {/* Spacer */}
          <div className="hidden sm:flex flex-1"></div> 

          {/* User Menu */}
          <div
            className={`flex items-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${
              isCompact
                ? "gap-1 sm:gap-1.5 md:gap-2"
                : "gap-2 sm:gap-3 md:gap-4"
            }`}
          >

            {/* Balances and User Menu */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Token Balance Display (desktop only - for all users) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="hidden md:block"
              >
                <Link
                  to="/wallet"
                  className="group relative cursor-pointer"
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
                            <BalanceOrDividends
                              mintAddress={config.SOLANA.DEGEN_TOKEN_ADDRESS}
                              walletAddress={user.wallet_address}
                              isCompact={isCompact}
                            />
                          ) : (
                            <motion.span 
                              className={`relative font-semibold tracking-wider uppercase leading-none ${isCompact ? "text-xs" : "text-sm"}`}
                              initial={{ opacity: 0.7 }}
                              animate={{ opacity: [0.7, 1, 1, 0.7] }}
                              transition={{
                                duration: 3,
                                times: [0, 0.3, 0.7, 1],
                                repeat: Infinity,
                                repeatDelay: 7,
                              }}
                            >
                              DIVIDENDS
                            </motion.span>
                          )}
                        </div>
                        
                        {/* Token icon - slightly smaller with more spacing */}
                        <div className="relative flex items-center justify-center w-4 h-4 ml-2">
                          <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-20" />
                          <div className="relative w-4 h-4 flex items-center justify-center">
                            <NanoLogo showBeta={false} />
                          </div>
                        </div>
                        
                        
                        {/* Shimmer effect overlay */}
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 
                            bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        </div>
                      </div>
                </Link>
              </motion.div>

              <AnimatePresence mode="wait">
                {isAuthenticated && user ? (
                  <motion.div 
                    key="user-menu" 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="hidden md:block"
                  >
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
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="hidden md:block"
                  >
                    <Link
                      to="/login"
                      className={`
                        relative group overflow-hidden transition-all duration-300 ease-out
                        ${isCompact ? "h-7" : "h-8"} flex items-center
                        rounded-full border border-emerald-900/50 hover:border-emerald-800/70
                        bg-gradient-to-r from-emerald-950/80 via-emerald-900/70 to-emerald-950/80
                        hover:from-emerald-900/90 hover:via-emerald-800/80 hover:to-emerald-900/90
                      `}
                    >
                      {/* Background */}
                      <div className="absolute inset-0 bg-gray-800/40 transition-all duration-300" />

                      {/* Content */}
                      <div className="relative flex items-center justify-between w-full pl-3 pr-0.5">
                        <div className="flex items-center gap-2">
                          {/* Login text */}
                          <motion.span
                            className={`
                              text-white
                              font-semibold tracking-wider transition-all duration-300
                              ${isCompact ? "text-xs" : "text-sm"} uppercase
                            `}
                            initial={{ opacity: 0.7 }}
                            animate={{ opacity: [0.7, 1, 1, 0.7] }}
                            transition={{
                              duration: 3,
                              times: [0, 0.3, 0.7, 1],
                              repeat: Infinity,
                              repeatDelay: 7,
                            }}
                          >
                            LOGIN
                          </motion.span>
                        </div>

                        {/* Default avatar */}
                        <div className="relative ml-3">
                          <div
                            className={`
                              rounded-full overflow-hidden
                              transition-all duration-300 shadow-lg
                              ${isCompact ? "w-7 h-7" : "w-8 h-8"}
                              bg-dark-300 ring-2 ring-emerald-800/50
                              group-hover:scale-105
                            `}
                          >
                            <img
                              src="/assets/media/default/profile_pic.png"
                              alt="Login"
                              className="w-full h-full object-cover group-hover:brightness-110"
                              loading="eager"
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button / Login */}
            <div className="md:hidden flex items-center gap-1">
              {isAuthenticated && user ? (
                <MobileMenuButton 
                  isCompact={isCompact}
                  onDisconnect={() => logout && logout()}
                  unreadNotifications={unreadCount}
                  onMenuToggle={setIsMobileMenuOpen}
                />
              ) : (
                <>
                  {/* Mobile Dividends Display for logged out users */}
                  <Link
                    to="/wallet"
                    className="group relative"
                  >
                    <div className={`relative flex items-center gap-1 pl-2 pr-3 
                      ${isCompact ? "h-7" : "h-8"}
                      bg-gradient-to-r from-purple-900/40 via-purple-800/30 to-purple-900/40 
                      backdrop-blur-sm rounded-full 
                      border border-purple-500/15
                      transition-all duration-300`}>
                      
                      <div className="relative text-purple-100 flex items-center">
                        <motion.span 
                          className={`relative font-semibold tracking-wider uppercase leading-none ${isCompact ? "text-[10px]" : "text-xs"}`}
                          initial={{ opacity: 0.7 }}
                          animate={{ opacity: [0.7, 1, 1, 0.7] }}
                          transition={{
                            duration: 3,
                            times: [0, 0.3, 0.7, 1],
                            repeat: Infinity,
                            repeatDelay: 7,
                          }}
                        >
                          DIVIDENDS
                        </motion.span>
                      </div>
                      
                      <div className="relative flex items-center justify-center w-4 h-4 ml-1">
                        <div className="relative w-4 h-4 flex items-center justify-center">
                          <NanoLogo showBeta={false} />
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <Link
                      to="/login"
                    className={`
                      relative group overflow-hidden transition-all duration-300 ease-out
                      ${isCompact ? "h-7" : "h-8"} flex items-center
                      rounded-full border border-emerald-900/50 hover:border-emerald-800/70
                      bg-gradient-to-r from-emerald-950/80 via-emerald-900/70 to-emerald-950/80
                      hover:from-emerald-900/90 hover:via-emerald-800/80 hover:to-emerald-900/90
                    `}
                  >
                    {/* Background */}
                    <div className="absolute inset-0 bg-gray-800/40 transition-all duration-300" />

                    {/* Content */}
                    <div className="relative flex items-center justify-between w-full pl-3 pr-0.5">
                      <div className="flex items-center gap-2">
                        {/* Login text */}
                        <motion.span
                          className={`
                            text-white
                            font-semibold tracking-wider transition-all duration-300
                            ${isCompact ? "text-xs" : "text-sm"} uppercase
                          `}
                          initial={{ opacity: 0.7 }}
                          animate={{ opacity: [0.7, 1, 1, 0.7] }}
                          transition={{
                            duration: 3,
                            times: [0, 0.3, 0.7, 1],
                            repeat: Infinity,
                            repeatDelay: 7,
                          }}
                        >
                          LOGIN
                        </motion.span>
                      </div>

                      {/* Default avatar */}
                      <div className="relative ml-3">
                        <div
                          className={`
                            rounded-full overflow-hidden
                            transition-all duration-300 shadow-lg
                            ${isCompact ? "w-7 h-7" : "w-8 h-8"}
                            bg-dark-300 ring-2 ring-emerald-800/50
                            group-hover:scale-105
                          `}
                        >
                          <img
                            src="/assets/media/default/profile_pic.png"
                            alt="Login"
                            className="w-full h-full object-cover group-hover:brightness-110"
                            loading="eager"
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
                </>
              )}
            </div>

          </div>

        </div>
        
      </div>

    </motion.header>
  );
};

// Custom component to show balance or DIVIDENDS text
const BalanceOrDividends: React.FC<{
  mintAddress?: string;
  walletAddress?: string;
  isCompact?: boolean;
}> = ({ mintAddress, walletAddress, isCompact = false }) => {
  const { tokenData, isLoading } = useSolanaTokenData(mintAddress, walletAddress, undefined, true);
  
  // Check if balance is zero or undefined
  const hasBalance = tokenData?.userBalance && parseFloat(tokenData.userBalance.toString()) > 0;
  
  // If loading or has balance, show the normal display
  if (isLoading || hasBalance) {
    return (
      <SolanaTokenDisplay 
        mintAddress={mintAddress}
        walletAddress={walletAddress} 
        compact={true}
        className={`font-normal leading-none ${isCompact ? "text-sm" : "text-base"}`}
        showSupply={false}
        showHolders={false}
      />
    );
  }
  
  // If no balance, show DIVIDENDS text with animation
  return (
    <motion.span 
      className={`relative font-semibold tracking-wider uppercase leading-none ${isCompact ? "text-xs" : "text-sm"}`}
      initial={{ opacity: 0.7 }}
      animate={{ opacity: [0.7, 1, 1, 0.7] }}
      transition={{
        duration: 3,
        times: [0, 0.3, 0.7, 1],
        repeat: Infinity,
        repeatDelay: 7,
      }}
    >
      DIVIDENDS
    </motion.span>
  );
};
