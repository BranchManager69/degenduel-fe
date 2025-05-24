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
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useScrollHeader } from "../../hooks/ui/useScrollHeader";
import { useNotifications } from "../../hooks/websocket/topic-hooks/useNotifications";
import { useStore } from "../../store/useStore";
// import { useSystemSettings } from "../../hooks/websocket/topic-hooks/useSystemSettings";
import ConsolidatedLoginButton from "../auth/ConsolidatedLoginButton";
import MiniLogo from "../logo/MiniLogo";
import NanoLogo from "../logo/NanoLogo";
import { MobileMenuButton } from './MobileMenuButton'; // TEMP
import { UserMenu } from './user-menu/UserMenu';


export const Header: React.FC = () => {
  const { isCompact } = useScrollHeader(50);
  
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
    console.log("[Header EFFECT on auth change] User:", user, "IsAuthenticated:", isAuthenticated, "IsAdmin:", isAdministrator);
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

            {/* User Menu (Desktop) */}
            <div className="hidden md:block">
              <AnimatePresence mode="wait">
                {isAuthenticated && user ? (
                  <motion.div 
                    key="user-menu" 
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
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
                    key="login-btn-consolidated"
                    initial={{ opacity: 0, x: 10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ConsolidatedLoginButton 
                      onLoginComplete={() => {
                        console.log("[Header] Login complete callback triggered from ConsolidatedLoginButton");
                      }}
                    />
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
              />
            </div>

          </div>

        </div>
        
      </div>

    </header>
  );
};
