/**
 * Mobile Menu Button Component
 * 
 * Part of DegenDuel's Unified Menu System: This component handles the mobile version
 * of the application's main navigation menu. It shares core functionality with the desktop
 * UserMenu component through shared configuration and components.
 * 
 * @see /components/layout/menu/menuConfig.tsx - Shared menu structure
 * @see /components/layout/menu/SharedMenuComponents.tsx - Shared UI components
 * @see /components/layout/user-menu/UserMenu.tsx - Desktop counterpart
 */

import { AnimatePresence, motion } from "framer-motion";
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useStore } from "../../store/useStore";
import { ConsolidatedLoginButton } from "../auth";

// Import shared menu components and configuration
import { getMenuItems } from './menu/menuConfig';
import { NotificationsDropdown } from './menu/NotificationsDropdown';
import {
  BiometricAuthComponent,
  MenuBackdrop,
  MenuDivider,
  SectionHeader,
  WalletDetailsSection
} from './menu/SharedMenuComponents';

interface MobileMenuButtonProps {
  className?: string;
  isCompact?: boolean;
  onDisconnect?: () => void;
  unreadNotifications?: number;
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({
  className = "",
  isCompact = false,
  onDisconnect,
  unreadNotifications = 0,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // Use store directly to check user authentication
  const { user, disconnectWallet } = useStore();
  const { isAdministrator, isSuperAdmin } = useMigratedAuth();
  const [imageError, setImageError] = useState(false);
  
  // Get user level information
  const { achievements } = useStore();
  const userLevel = achievements?.userProgress?.level || 0;
  
  // Get shared menu items from unified configuration
  const { profileItems, contestItems, tokenItems } = getMenuItems(user, userLevel);
  
  const handleDisconnect = () => {
    if (onDisconnect) {
      onDisconnect();
    } else if (disconnectWallet) {
      disconnectWallet();
    }
    setIsOpen(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const profileImageUrl = useMemo(() => {
    if (!user || imageError || !user?.profile_image?.url) {
      return "/assets/media/default/profile_pic.png";
    }
    return user.profile_image.thumbnail_url || user.profile_image.url;
  }, [user, user?.profile_image, imageError]);

  const displayName = useMemo(() => {
    if (!user) return "";
    if (user.nickname) return user.nickname;
    const addr = user.wallet_address;
    return isCompact
      ? `${addr.slice(0, 4)}...${addr.slice(-4)}`
      : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, [user?.nickname, user?.wallet_address, isCompact]);

  // Shared animation variants for menu items
  const itemVariants = {
    open: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    closed: {
      opacity: 0,
      y: 10,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  // Get level color scheme for styling the level badge
  const getLevelColorScheme = useMemo(() => {
    // Default colors for no level
    if (userLevel <= 0) {
      return {
        bg: "bg-brand-500/80",
        border: "border-brand-400/50",
        text: "text-white"
      };
    }
    
    // Return color scheme based on level tiers
    if (userLevel >= 40) {
      return {
        bg: "bg-amber-500/80",
        border: "border-amber-400/50",
        text: "text-white"
      };
    } else if (userLevel >= 30) {
      return {
        bg: "bg-fuchsia-500/80",
        border: "border-fuchsia-400/50",
        text: "text-white"
      };
    } else if (userLevel >= 20) {
      return {
        bg: "bg-blue-500/80", 
        border: "border-blue-400/50",
        text: "text-white"
      };
    } else if (userLevel >= 10) {
      return {
        bg: "bg-emerald-500/80",
        border: "border-emerald-400/50",
        text: "text-white"
      };
    } else {
      // Level 1-9
      return {
        bg: "bg-brand-500/80",
        border: "border-brand-400/50",
        text: "text-white"
      };
    }
  }, [userLevel]);

  return (
    <div className={`relative ${className}`}>
      {/* Header Menu Controls - Row Layout for Profile and Notifications */}
      <div className="flex items-center space-x-1">
        {/* Notifications Dropdown (only for logged in users) */}
        {user && (
          <NotificationsDropdown 
            unreadCount={unreadNotifications} 
            isMobile={true}
          />
        )}
        
        {/* User Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative flex items-center justify-center transition-all duration-200 group
            ${isCompact ? "w-8 h-8" : "w-9 h-9"}
            hover:bg-dark-300/30 active:bg-dark-300/40 rounded-full relative z-50`}
          aria-label="User menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {user ? (
            <>
              {/* User Profile Avatar Button */}
              <div className="relative">
                {/* Profile Image */}
                <div className="relative rounded-full overflow-hidden ring-2 ring-brand-400/30 group-hover:ring-brand-400/50 transition-all duration-300 shadow-lg bg-dark-300 w-full h-full">
                  <img
                    src={profileImageUrl}
                    alt={displayName}
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                    loading="eager"
                    crossOrigin="anonymous"
                  />
                </div>
                
                {/* Level Badge - Small circle with level number */}
                {userLevel > 0 && (
                  <div className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center h-4 w-4 
                    ${getLevelColorScheme.bg} text-xs font-bold rounded-full border ${getLevelColorScheme.border} 
                    ${getLevelColorScheme.text} shadow-md`}
                  >
                    {userLevel > 99 ? "99+" : userLevel}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Hamburger Menu for Non-Logged-In Users */}
              <div
                className={`flex flex-col gap-[3px] items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                  ${isCompact ? "w-3" : "w-4"}`}
              >
                <motion.div
                  animate={isOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className={`${
                    isCompact ? "w-2.5" : "w-3"
                  } h-[2px] bg-gray-300 group-hover:bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center`}
                />
                <motion.div
                  animate={
                    isOpen ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }
                  }
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className={`${
                    isCompact ? "w-2" : "w-2.5"
                  } h-[2px] bg-gray-300 group-hover:bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
                />
                <motion.div
                  animate={isOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className={`${
                    isCompact ? "w-2.5" : "w-3"
                  } h-[2px] bg-gray-300 group-hover:bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center`}
                />
              </div>
            </>
          )}
        </button>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Use the shared MenuBackdrop component with mobile-specific settings */}
            <MenuBackdrop 
              isOpen={isOpen} 
              onClose={() => setIsOpen(false)} 
              isMobile={true}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`absolute right-0 mt-2 w-56 max-h-[85vh] overflow-y-auto bg-dark-200/95 border border-brand-500/30 
                rounded-b-md rounded-tl-md rounded-tr-[24px] shadow-lg shadow-black/50 z-50 origin-top-right backdrop-blur-xl`}
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="mobile-menu-button"
            >
              {/* Enhanced gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 via-transparent to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-b-md rounded-tl-md rounded-tr-[24px] bg-[radial-gradient(circle_at_50%_0%,rgba(127,0,255,0.15),transparent_70%)]" />

              <motion.div
                className="py-1 relative"
                initial="closed"
                animate="open"
                variants={{
                  open: {
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                  closed: {
                    transition: {
                      staggerChildren: 0.05,
                      staggerDirection: -1,
                    },
                  },
                }}
              >
                {/* User Profile Section (if logged in) or Connect Wallet (if not logged in) */}
                {user ? (
                  <>
                    {/* User profile info */}
                    <div className="px-3 py-2 bg-dark-300/40 border-b border-brand-500/20">
                      <div className="flex items-center">
                        <div className="relative mr-3">
                          {/* Level Badge */}
                          {userLevel > 0 && (
                            <div className={`absolute -bottom-0.5 -right-0.5 z-10 flex items-center justify-center h-4 w-4 
                              ${getLevelColorScheme.bg} text-xs font-bold rounded-full border ${getLevelColorScheme.border} 
                              ${getLevelColorScheme.text} shadow-md`}
                            >
                              {userLevel > 99 ? "99+" : userLevel}
                            </div>
                          )}
                          <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-brand-400/30 group-hover:ring-brand-400/50 transition-all duration-300 shadow-lg bg-dark-300">
                            <img
                              src={profileImageUrl}
                              alt={displayName}
                              onError={handleImageError}
                              className="w-full h-full object-cover"
                              loading="eager"
                              crossOrigin="anonymous"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-200">{displayName}</div>
                          {userLevel > 0 && (
                            <div className="text-xs text-brand-300">Level {userLevel}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Add Wallet Details Section (shared component) */}
                    <WalletDetailsSection user={user} />
                    
                    {/* User menu items */}
                    {profileItems.map((item) => (
                      <ProfileMenuItem 
                        key={item.id}
                        to={item.to} 
                        icon={item.icon} 
                        badge={item.badge}
                        onClick={() => setIsOpen(false)}
                        variants={itemVariants}
                      >
                        {item.label}
                      </ProfileMenuItem>
                    ))}
                    
                    {/* Admin controls section if applicable */}
                    {(isAdministrator || isSuperAdmin) && (
                      <>
                        <MenuDivider />
                        <SectionHeader title="Admin Access" />
                        
                        {/* Side-by-side Admin and Super Admin buttons */}
                        <div className="grid grid-cols-2 gap-1 px-3 py-1">
                          {isAdministrator && (
                            <Link
                              to="/admin"
                              className="flex items-center justify-center px-2 py-1.5 rounded-md transition-all duration-300
                                bg-gradient-to-br from-red-600/90 to-red-800/90 border border-red-500/50 
                                text-white text-xs font-semibold shadow-md hover:shadow-lg hover:from-red-500/90 hover:to-red-700/90
                                focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-dark-200"
                              onClick={() => setIsOpen(false)}
                            >
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                                  <path d="M19 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z"></path>
                                  <path d="M12 13v5"></path>
                                </svg>
                                ADMIN
                              </span>
                            </Link>
                          )}
                          
                          {isSuperAdmin && (
                            <Link
                              to="/superadmin"
                              className="flex items-center justify-center px-2 py-1.5 rounded-md transition-all duration-300
                                bg-gradient-to-br from-amber-500/90 to-amber-700/90 border border-amber-400/50
                                text-white text-xs font-semibold shadow-md hover:shadow-lg hover:from-amber-400/90 hover:to-amber-600/90
                                focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-2 focus:ring-offset-dark-200"
                              onClick={() => setIsOpen(false)}
                            >
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                SUPER
                              </span>
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* Add Biometric Authentication Option */}
                    <MenuDivider />
                    <BiometricAuthComponent 
                      userId={user.wallet_address} 
                      onClose={() => setIsOpen(false)} 
                      menuItemClass="flex items-center gap-2 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/20 hover:backdrop-blur-md hover:text-blue-200 rounded-lg transition-all duration-300"
                    />
                    <MenuDivider />
                  </>
                ) : (
                  <>
                    {/* Consolidated Login section */}
                    <div className="px-3 py-2 bg-dark-300/40 border-b border-brand-500/20">
                      <div className="flex flex-col gap-2">
                        {/* Login Options Section */}
                        <ConsolidatedLoginButton onLoginComplete={() => setIsOpen(false)} />
                        
                        <Link
                          to="/login"
                          className="w-full text-xs text-center text-gray-400 hover:text-white py-1 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          View all login options
                        </Link>
                      </div>
                    </div>
                    
                    <MenuDivider />
                  </>
                )}

                {/* Contests Section - using shared config */}
                <SectionHeader title="Contests" />
                {contestItems.map((item) => (
                  <MenuItem 
                    key={item.id}
                    to={item.to} 
                    onClick={() => setIsOpen(false)}
                    variants={itemVariants}
                  >
                    {item.label}
                  </MenuItem>
                ))}

                {/* Tokens Section - using shared config */}
                <MenuDivider />
                <SectionHeader title="Tokens" />
                {tokenItems.map((item) => (
                  <MenuItem 
                    key={item.id}
                    to={item.to} 
                    onClick={() => setIsOpen(false)}
                    variants={itemVariants}
                  >
                    {item.label}
                  </MenuItem>
                ))}

                {/* Rankings Section - REMOVED */}

                {/* Disconnect button (if logged in) */}
                {user && (
                  <>
                    <MenuDivider />
                    <LogoutButton onClick={handleDisconnect} variants={itemVariants} />
                  </>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Regular menu item
const MenuItem: React.FC<{
  to: string;
  onClick?: () => void;
  className?: string;
  variants?: any;
  children: React.ReactNode;
}> = ({ to, onClick, className = "", variants, children }) => (
  <motion.div
    variants={variants}
  >
    <Link
      to={to}
      className={`block px-3 py-1.5 text-sm text-gray-300 hover:bg-brand-500/20 hover:backdrop-blur-md hover:text-white rounded-lg transition-all duration-300 ${className}`}
      onClick={onClick}
      role="menuitem"
    >
      {children}
    </Link>
  </motion.div>
);

// Profile menu item with icon
const ProfileMenuItem: React.FC<{
  to: string;
  icon?: React.ComponentType<any>;
  onClick?: () => void;
  className?: string;
  badge?: string | number;
  variants?: any;
  children: React.ReactNode;
}> = ({ to, icon: Icon, onClick, className = "", badge, variants, children }) => (
  <motion.div
    variants={variants}
  >
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-brand-500/20 hover:backdrop-blur-md hover:text-white rounded-lg transition-all duration-300 ${className}`}
      onClick={onClick}
      role="menuitem"
    >
      {Icon && <Icon className="w-4 h-4 text-brand-300" />}
      <span className="flex-1">{children}</span>
      {badge !== undefined && (
        <span className="flex items-center justify-center min-w-5 h-5 text-xs font-semibold rounded-full px-1.5 shadow-sm bg-red-500/80 text-white">
          {typeof badge === "number" && badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  </motion.div>
);

// Logout button
const LogoutButton: React.FC<{
  onClick?: () => void;
  variants?: any;
}> = ({ onClick, variants }) => (
  <motion.div
    variants={variants}
  >
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/20 hover:backdrop-blur-md hover:text-red-200 rounded-lg transition-all duration-300"
      role="menuitem"
    >
      <svg
        className="w-4 h-4 text-red-300"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span>Disconnect</span>
    </button>
  </motion.div>
);