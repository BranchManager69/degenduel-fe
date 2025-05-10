// src/components/layout/Header.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef } from "react";

import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useScrollHeader } from "../../hooks/ui/useScrollHeader";
// Error-related hooks are no longer used directly in Header for banners
// import { useNotifications } from "../../hooks/websocket/topic-hooks/useNotifications"; 
// import { useSystemSettings } from "../../hooks/websocket/topic-hooks/useSystemSettings";
import { useStore } from "../../store/useStore";
import Logo from "../ui/Logo"; // STEP 3: Re-enable Logo import
// import { ContestsDropdown } from "./ContestsDropdown"; // TEMP
// import { MobileMenuButton } from "./MobileMenuButton"; // TEMP
// import { RankingsDropdown } from "./RankingsDropdown"; // TEMP
// import { TokensDropdown } from "./TokensDropdown"; // TEMP
// import { UserMenu } from "./user-menu/UserMenu"; // TEMP

export const Header: React.FC = () => {
  const { isCompact } = useScrollHeader(50);
  
  const storeErrorMessage = useStore(state => state.error?.message || null);
  const clearStoreError = useStore(state => state.clearError);
  
  const { user, isAdmin, isAuthenticated } = useMigratedAuth(); 
  // unreadCount and settings might still be needed for other parts of the Header later
  // For now, keep them if UserMenu/MobileMenu will use them, or comment out if not.
  // const { unreadCount } = useNotifications(); 
  // const { settings } = useSystemSettings(); 
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    console.log("[Header STEP 2] Mounted");
    return () => {
      isMounted.current = false;
      console.log("[Header STEP 2] Unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("[Header EFFECT on auth change] User:", user, "IsAuthenticated:", isAuthenticated, "IsAdmin:", isAdmin);
  }, [user, isAuthenticated, isAdmin]);

  // Re-enable the effect for clearing storeError, but guarded
  useEffect(() => {
    if (storeErrorMessage && clearStoreError) {
      console.log("[Header] Store error detected, will clear in 5s:", storeErrorMessage);
      const timer = setTimeout(() => {
        if (isMounted.current) {
          console.log("[Header] Clearing store error.");
          clearStoreError();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [storeErrorMessage, clearStoreError]); // Depends on the message string and clear function

  // Other effects (maintenance sync, header height) remain commented out for now

  console.log("[Header STEP 4 - Error Banners Relocated] Rendering. User:", user ? user.id : null, "IsAuth:", isAuthenticated, "IsAdmin:", isAdmin, "Compact:", isCompact, "StoreError:", storeErrorMessage ? "Yes" : "No");

  const headerHeight = isCompact ? "h-12 sm:h-14" : "h-14 sm:h-16";

  return (
    <header
      className={`bg-dark-200/30 backdrop-blur-lg sticky top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${headerHeight}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Error Banners Container REMOVED from here */}
      
      {/* Banned User Banner */}
      {user?.banned && (
        <div className="bg-red-500/10 border-b border-red-500/20">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <p className="text-red-400 text-sm text-center">
              Uh-oh! You've been banned from DegenDuel. GG.
              {user?.banned_reason ? `: ${user.banned_reason}` : ""} 
            </p>
          </div>
        </div>
      )}

      {/* Maintenance Mode Banner - uses settings, so useSystemSettings hook might need to be restored if this is re-enabled fully */}
      {/* For now, assuming settings might come from a different source or this banner logic will be refined */}
      {/* {settings && typeof settings.maintenance_mode === 'object' && settings.maintenance_mode?.enabled && !isAdmin && ( ... )} */}

      {/* Main Header Content */}
      <div className="relative max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-8">
        <div
          className={`relative flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${headerHeight}`}
        >
          <div className="flex items-center">
            <Logo />
          </div>

          <div className="flex-1"></div> 

          <div
            className={`flex items-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${
              isCompact
                ? "gap-1 sm:gap-1.5 md:gap-2"
                : "gap-2 sm:gap-3 md:gap-4"
            }`}
          >
            <div className="hidden md:block">
              <AnimatePresence mode="wait">
                {isAuthenticated && user ? (
                  <motion.div key="user-menu-ph">
                    <div className="w-8 h-8 bg-green-500/30 rounded-full text-xs flex items-center justify-center text-green-300">U</div>
                  </motion.div>
                ) : (
                  <motion.div key="login-btn-ph">
                     <div className="w-24 h-8 bg-purple-500/30 rounded text-xs flex items-center justify-center text-purple-300">Connect</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="md:hidden">
              <div className="w-8 h-8 bg-gray-500/30 rounded text-xs flex items-center justify-center text-gray-300">M</div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Error Message Toast */}
      <AnimatePresence>
        {storeErrorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full z-50"
          >
            <div className="bg-red-500/10 border border-red-500/20 rounded-b-lg px-4 py-2">
              <p className="text-red-400 text-sm">{storeErrorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
