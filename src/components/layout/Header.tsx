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
  const { isCompact } = useScrollHeader(50); // Re-enabled
  const {
    // disconnectWallet, // Keep commented for now, only used in children or complex effects
    error: storeError,
    // clearError, // Keep commented for now, only used in an effect
  } = useStore(state => ({ 
      disconnectWallet: state.disconnectWallet, 
      error: state.error, 
      clearError: state.clearError, 
  })); 
  const { user, isAdmin, isAuthenticated } = useMigratedAuth(); 
  const { unreadCount } = useNotifications(); // Re-enabled
  const { settings } = useSystemSettings(); // Re-enabled
  
  const isMounted = useRef(true);
  
  const isMaintenanceMode = settings?.maintenanceMode || false; // Re-enabled
  // const maintenanceMessage = settings?.maintenanceMessage; // Keep commented, only used in banner

  useEffect(() => {
    isMounted.current = true;
    console.log("[Header STEP 1] Mounted");
    return () => {
      isMounted.current = false;
      console.log("[Header STEP 1] Unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("[Header EFFECT on auth change] User:", user, "IsAuthenticated:", isAuthenticated, "IsAdmin:", isAdmin);
  }, [user, isAuthenticated, isAdmin]);

  // useEffect(() => {
  //   const currentStoreValue = useStore.getState().maintenanceMode;
  //   let redirectTimerId: number | undefined;
  //   if (isMaintenanceMode !== currentStoreValue) {
  //     console.log(`[Header] Syncing maintenanceMode to store: ${isMaintenanceMode}`);
  //     if (isMounted.current) {
  //       useStore.setState({ maintenanceMode: isMaintenanceMode });
  //     }

  //     if (isMaintenanceMode === true && !isAdmin) {
  //       console.log("[Header] Maintenance mode activated, redirecting non-admin.");
  //       redirectTimerId = window.setTimeout(() => {
  //         if (isMounted.current) {
  //           window.location.href = "/maintenance";
  //         }
  //       }, 500); 
  //     }
  //   }
  //   return () => {
  //     if (redirectTimerId) {
  //       clearTimeout(redirectTimerId);
  //     }
  //   };
  // }, [isMaintenanceMode, isAdmin]); // TEMP

  // useEffect(() => {
  //   if (storeError) {
  //     const timer = setTimeout(clearError, 5000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [storeError, clearError]); // TEMP

  // useEffect(() => {
  //   const updateHeaderHeight = () => {
  //     let baseHeight = isCompact 
  //       ? (window.innerWidth >= 640 ? 3.5 : 3)
  //       : (window.innerWidth >= 640 ? 4 : 3.5);
      
  //     let additionalHeight = 0;
      
  //     if (user?.banned) { 
  //       additionalHeight += 2.5;
  //     }
      
  //     if (isMaintenanceMode) {
  //       additionalHeight += 2;
  //     }
      
  //     document.documentElement.style.setProperty('--header-height', `${baseHeight + additionalHeight}rem`);
  //   };
    
  //   updateHeaderHeight();
    
  //   window.addEventListener('resize', updateHeaderHeight);
    
  //   return () => {
  //     window.removeEventListener('resize', updateHeaderHeight);
  //   };
  // }, [isCompact, user?.banned, isMaintenanceMode]); // TEMP

  console.log("[Header STEP 1] Rendering. User:", user, "IsAuth:", isAuthenticated, "IsAdmin:", isAdmin, "Compact:", isCompact, "Unread:", unreadCount, "Settings:", settings);

  return (
    <header
      className={`bg-dark-900 sticky top-0 z-50 h-16 flex flex-col items-center justify-center text-xs`}
    >
      <p className="text-white">
        Header Test - User: {user ? user.id : 'Logged Out'} - Auth: {isAuthenticated ? 'Yes' : 'No'}
      </p>
      <p className="text-white">
        Compact: {isCompact ? 'Yes' : 'No'} - StoreError: {storeError?.message || 'None'}
      </p>
      <p className="text-white">
        Unread: {unreadCount} - Maint: {isMaintenanceMode ? 'Yes' : 'No'}
      </p>
      <p className="text-white">
        Settings Loaded: {settings ? 'Yes' : 'No'} - Notification Hook Error: {useNotifications().error || 'None'} - System Settings Hook Error: {useSystemSettings().error || 'None'}
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
          {storeError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full z-50"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-b-lg px-4 py-2">
                <p className="text-red-400 text-sm">{storeError.toString()}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
  );
  */
};
