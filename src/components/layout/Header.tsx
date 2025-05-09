// src/components/layout/Header.tsx

import React, { useEffect, useRef } from "react";

import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useScrollHeader } from "../../hooks/ui/useScrollHeader";
import { useNotifications } from "../../hooks/websocket/topic-hooks/useNotifications";
import { useSystemSettings } from "../../hooks/websocket/topic-hooks/useSystemSettings";
import { useStore } from "../../store/useStore";
// import LoginOptionsButton from "../auth/LoginOptionsButton"; // TEMP
// import Logo from "../ui/Logo"; // TEMP
// import { ContestsDropdown } from "./ContestsDropdown"; // TEMP
// import { MobileMenuButton } from "./MobileMenuButton"; // TEMP
// import { RankingsDropdown } from "./RankingsDropdown"; // TEMP
// import { TokensDropdown } from "./TokensDropdown"; // TEMP
// import { UserMenu } from "./user-menu/UserMenu"; // TEMP

export const Header: React.FC = () => {
  const { isCompact } = useScrollHeader(50);
  
  // Select only the error message string, or null. This is more stable for dependencies.
  const storeErrorMessage = useStore(state => state.error?.message || null);
  const clearStoreError = useStore(state => state.clearError);
  
  const { user, isAdmin, isAuthenticated } = useMigratedAuth(); 
  const { unreadCount, error: notificationsError } = useNotifications(); 
  const { settings, error: systemSettingsError } = useSystemSettings(); 
  
  const isMounted = useRef(true);
  const isMaintenanceMode = settings?.maintenanceMode || false;

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

  console.log("[Header STEP 2] Rendering. User:", user, "IsAuth:", isAuthenticated, "Maint:", isMaintenanceMode, "StoreErr:", storeErrorMessage);

  return (
    <header
      className={`bg-dark-900 sticky top-0 z-50 h-auto p-2 flex flex-col items-center justify-center text-xs`}
    >
      <p className="text-white">
        Header Test - User: {user ? user.id : 'Logged Out'} - Auth: {isAuthenticated ? 'Yes' : 'No'}
      </p>
      <p className="text-white">
        Compact: {isCompact ? 'Yes' : 'No'} - Store Msg: {storeErrorMessage || 'None'}
      </p>
      <p className="text-white">
        Unread: {unreadCount} - Maint: {isMaintenanceMode ? 'Yes' : 'No'}
      </p>
      <p className="text-white">
        Settings Loaded: {settings ? 'Yes' : 'No'} - Notif Hook Err: {notificationsError || 'None'} - SysSettings Hook Err: {systemSettingsError || 'None'}
      </p>
    </header>
  );

  // Original return statement commented out for testing
  /*
  return (
    <header
      className={`bg-dark-200/30 backdrop-blur-lg sticky top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isCompact ? "h-12 sm:h-14" : "h-14 sm:h-16"}`}
      onClick={(e) => e.stopPropagation()}
    >
        {user?.banned && (
          <div className="bg-red-500/10 border-b border-red-500/20">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <p className="text-red-400 text-sm text-center">
                Uh-oh! You're been banned from DegenDuel. GG.
                {user?.banned_reason ? `: ${user.banned_reason}` : ""} 
              </p>
            </div>
          </div>
        )}

        {isMaintenanceMode && (
          // ... maintenance banner JSX ...
        )}

        <div className="relative max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-8">
          <div
            className={`relative flex items-center justify-between transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isCompact ? "h-12 sm:h-14" : "h-14 sm:h-16"}`}
          >
            <div className="flex items-center">
              <div
                className={`transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                  ${isCompact ? "scale-[0.9]" : "scale-100"}`}
                onClick={(e) => e.stopPropagation()}
              >
                <Logo
                  size={isCompact ? "sm" : "md"}
                  asLink={true}
                  animated={true}
                  enhancedGlow={true}
                  glowColor="#9933ff"
                />
              </div>

              <nav className="hidden md:flex items-center ml-6">
                {(isAuthenticated || new Date() >= new Date(import.meta.env.VITE_RELEASE_DATE_TOKEN_LAUNCH_DATETIME || '2025-12-31T23:59:59-05:00')) ? (
                  <div className="flex items-center bg-dark-300/50 backdrop-blur-md rounded-md border border-brand-400/20 overflow-visible shadow-md nav-dropdown-container">
                    
                    <ContestsDropdown isCompact={isCompact} />
                    <TokensDropdown isCompact={isCompact} />
                    <RankingsDropdown isCompact={isCompact} />
                  </div>
                ) : (
                  <div className="flex items-center ml-6">
                    <div className="bg-brand-500/10 text-brand-400 px-4 py-2 rounded-md text-sm font-medium border border-brand-500/20">
                      <span className="hidden sm:inline">Launch imminent</span>
                      <span className="sm:hidden">Launch imminent</span>
                    </div>
                  </div>
                )}
              </nav>
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
                        unreadNotifications={unreadCount}
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
                      <div className="flex items-center">
                        <LoginOptionsButton compact={isCompact} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="md:hidden">
                <MobileMenuButton 
                  isCompact={isCompact} 
                  onDisconnect={disconnectWallet}
                  unreadNotifications={unreadCount}
                />
              </div>
            </div>
          </div>
        </div>

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
  */
};
