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
import { SimpleWalletButton } from "../auth";
import { CompactBalance } from "../ui/CompactBalance";

// Import shared menu components and configuration
import { getMenuItems } from './menu/menuConfig';
import { NotificationsDropdown } from './menu/NotificationsDropdown';
import {
    MenuBackdrop,
    MenuDivider,
    SectionHeader
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

  // Get level color scheme for styling the level badge (unified with desktop)
  const getLevelColorScheme = useMemo(() => {
    // Return different color schemes based on level tiers
    if (userLevel >= 40) {
      return {
        bg: "from-amber-500/20 via-amber-400/20 to-amber-300/20",
        text: "text-amber-300",
        border: "border-amber-400/30",
        badge: "bg-gradient-to-r from-amber-600 to-amber-400",
        badgeBorder: "border-amber-500/30",
        ring: "ring-amber-400/30 group-hover:ring-amber-400/50"
      };
    } else if (userLevel >= 30) {
      return {
        bg: "from-fuchsia-500/20 via-fuchsia-400/20 to-fuchsia-300/20",
        text: "text-fuchsia-300",
        border: "border-fuchsia-400/30",
        badge: "bg-gradient-to-r from-fuchsia-600 to-fuchsia-400",
        badgeBorder: "border-fuchsia-500/30",
        ring: "ring-fuchsia-400/30 group-hover:ring-fuchsia-400/50"
      };
    } else if (userLevel >= 20) {
      return {
        bg: "from-blue-500/20 via-blue-400/20 to-blue-300/20",
        text: "text-blue-300",
        border: "border-blue-400/30",
        badge: "bg-gradient-to-r from-blue-600 to-blue-400",
        badgeBorder: "border-blue-500/30",
        ring: "ring-blue-400/30 group-hover:ring-blue-400/50"
      };
    } else if (userLevel >= 10) {
      return {
        bg: "from-emerald-500/20 via-emerald-400/20 to-emerald-300/20",
        text: "text-emerald-300",
        border: "border-emerald-400/30",
        badge: "bg-gradient-to-r from-emerald-600 to-emerald-400",
        badgeBorder: "border-emerald-500/30",
        ring: "ring-emerald-400/30 group-hover:ring-emerald-400/50"
      };
    } else if (userLevel >= 5) {
      return {
        bg: "from-cyan-500/20 via-cyan-400/20 to-cyan-300/20",
        text: "text-cyan-300",
        border: "border-cyan-400/30",
        badge: "bg-gradient-to-r from-cyan-600 to-cyan-400",
        badgeBorder: "border-cyan-500/30",
        ring: "ring-cyan-400/30 group-hover:ring-cyan-400/50"
      };
    } else {
      // Default colors for levels 1-4
      return {
        bg: "from-brand-500/20 via-brand-400/20 to-brand-300/20",
        text: "text-brand-300",
        border: "border-brand-400/30",
        badge: "bg-gradient-to-r from-brand-600 to-brand-400",
        badgeBorder: "border-brand-500/30",
        ring: "ring-brand-400/30 group-hover:ring-brand-400/50"
      };
    }
  }, [userLevel]);

  // Add role-based button styling like desktop
  const buttonStyles = useMemo(() => {
    // Super Admin styling takes precedence
    if (isSuperAdmin) {
      return {
        bg: "from-amber-500/20 via-amber-400/20 to-amber-300/20",
        text: "text-amber-100",
        border: "border-amber-400/30",
        hover: {
          bg: "group-hover:from-amber-400/30 group-hover:via-amber-300/30 group-hover:to-amber-200/30",
          border: "group-hover:border-amber-400/50",
          glow: "group-hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]",
        },
        ring: "ring-amber-400/30 group-hover:ring-amber-400/50",
      };
    }

    // Admin styling takes secondary precedence
    if (isAdministrator) {
      return {
        bg: "from-brand-600/20 via-brand-500/20 to-brand-400/20",
        text: "text-brand-100",
        border: "border-brand-400/30",
        hover: {
          bg: "group-hover:from-brand-500/30 group-hover:via-brand-400/30 group-hover:to-brand-300/30",
          border: "group-hover:border-brand-400/50",
          glow: "group-hover:shadow-[0_0_12px_rgba(153,51,255,0.25)]",
        },
        ring: "ring-brand-400/30 group-hover:ring-brand-400/50",
      };
    }

    // For regular users, use level-based styling if they have a level
    if (userLevel > 0) {
      const levelColors = getLevelColorScheme;
      return {
        bg: levelColors.bg,
        text: levelColors.text,
        border: levelColors.border,
        hover: {
          bg: `group-hover:${levelColors.bg.replace("from-", "from-").replace("/20", "/30")}`,
          border: levelColors.border.replace("/30", "/50"),
          glow: `group-hover:shadow-[0_0_10px_rgba(153,51,255,0.2)]`,
        },
        ring: levelColors.ring,
      };
    }

    // Default styling for users with no level
    return {
      bg: "from-brand-500/20 to-brand-400/20",
      text: "text-gray-200",
      border: "border-brand-400/20",
      hover: {
        bg: "group-hover:from-brand-400/25 group-hover:to-brand-300/25",
        border: "group-hover:border-brand-400/30",
        glow: "group-hover:shadow-[0_0_8px_rgba(153,51,255,0.15)]",
      },
      ring: "ring-brand-400/20 group-hover:ring-brand-400/30",
    };
  }, [isAdministrator, isSuperAdmin, userLevel, getLevelColorScheme]);

  return (
    <div className={`relative ${className}`}>
      {/* Header Menu Controls - Row Layout for Balances, Profile and Notifications */}
      <div className="flex items-center space-x-1">
        {/* Compact Balance Display (only for logged in users) */}
        {user && (
          <CompactBalance 
            walletAddress={user.wallet_address}
            className="mr-1"
            showLabels={false}
          />
        )}
        
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
          className={`relative flex items-center justify-center transition-all duration-300 group overflow-hidden
            ${isCompact ? "w-8 h-8" : "w-9 h-9"}
            rounded-full border ${buttonStyles.border} ${buttonStyles.hover.border}
            ${buttonStyles.hover.glow} z-50`}
          aria-label="User menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {/* Background gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${buttonStyles.bg} ${buttonStyles.hover.bg} transition-all duration-300`}
          />
          {user ? (
            <>
              {/* User Profile Avatar Button */}
              <div className="relative">
                {/* Profile Image */}
                <div className={`relative rounded-full overflow-hidden ring-2 ${buttonStyles.ring} transition-all duration-300 shadow-lg bg-dark-300 w-full h-full group-hover:scale-105`}>
                  <img
                    src={profileImageUrl}
                    alt={displayName}
                    onError={handleImageError}
                    className="w-full h-full object-cover group-hover:brightness-110"
                    loading="eager"
                    crossOrigin="anonymous"
                  />
                </div>
                
                {/* Level Badge - Small circle with level number (unified with desktop) */}
                {userLevel > 0 && (
                  <div className={`absolute -bottom-0.5 -right-0.5 flex items-center justify-center h-4 w-4 
                    ${getLevelColorScheme.badge} text-xs font-bold rounded-full border ${getLevelColorScheme.badgeBorder} 
                    text-white shadow-inner transition-all duration-300`}
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
                              ${getLevelColorScheme.badge} text-xs font-bold rounded-full border ${getLevelColorScheme.badgeBorder} 
                              text-white shadow-inner transition-all duration-300`}
                            >
                              {userLevel > 99 ? "99+" : userLevel}
                            </div>
                          )}
                          <div className={`w-9 h-9 rounded-full overflow-hidden ring-2 ${buttonStyles.ring} transition-all duration-300 shadow-lg bg-dark-300`}>
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
                    
                    {/* Admin controls section moved to top for consistency with desktop */}
                    {(isAdministrator || isSuperAdmin) && (
                      <>
                        <MenuDivider />
                        <SectionHeader title="Admin Access" />
                        
                        {/* Side-by-side Admin and Super Admin buttons */}
                        <div className="flex gap-1 px-3 py-1">
                          {isAdministrator && (
                            <Link
                              to="/admin"
                              className="relative group flex-1 text-center py-2 overflow-hidden transition-all duration-300
                                bg-black/80 border border-red-600/50 hover:border-red-500
                                text-red-500 hover:text-red-400
                                text-xs font-mono uppercase tracking-[0.2em] font-bold
                                hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                              onClick={() => setIsOpen(false)}
                            >
                              {/* Matrix-style background */}
                              <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-red-900/10 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              {/* Scan lines */}
                              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(239,68,68,0.03)_50%,transparent_100%)] bg-[length:100%_4px] animate-pulse opacity-60" />
                              
                              {/* Terminal cursor effect */}
                              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-1 h-3 bg-red-500 opacity-0 group-hover:opacity-100 animate-pulse" />
                              
                              <span className="relative">ADMIN</span>
                            </Link>
                          )}
                          
                          {isSuperAdmin && (
                            <Link
                              to="/superadmin"
                              className="relative group flex-1 text-center py-2 overflow-hidden transition-all duration-300
                                bg-black/80 border border-amber-600/50 hover:border-amber-500
                                text-amber-500 hover:text-amber-400
                                text-xs font-mono uppercase tracking-[0.2em] font-bold
                                hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                              onClick={() => setIsOpen(false)}
                            >
                              {/* Matrix-style background */}
                              <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-amber-900/10 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              {/* Scan lines */}
                              <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(245,158,11,0.03)_50%,transparent_100%)] bg-[length:100%_4px] animate-pulse opacity-60" />
                              
                              {/* Terminal cursor effect */}
                              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-1 h-3 bg-amber-500 opacity-0 group-hover:opacity-100 animate-pulse" />
                              
                              <span className="relative">SUPERADMIN</span>
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* User menu items */}
                    {profileItems.map((item) => (
                      <ProfileMenuItem 
                        key={item.id}
                        to={item.to} 
                        icon={item.icon} 
                        badge={(item as any).badge}
                        onClick={() => setIsOpen(false)}
                        variants={itemVariants}
                      >
                        {item.label}
                      </ProfileMenuItem>
                    ))}
                    
                    
                    {/* COMMENTED OUT: Biometric Authentication Option */}
                    {/* <MenuDivider />
                    <BiometricAuthComponent 
                      userId={user.wallet_address} 
                      onClose={() => setIsOpen(false)} 
                      menuItemClass="flex items-center gap-2 px-4 py-2 text-sm text-blue-300 hover:bg-blue-500/20 hover:backdrop-blur-md hover:text-blue-200 rounded-lg transition-all duration-300"
                    />
                    <MenuDivider /> */}
                  </>
                ) : (
                  <>
                    {/* Consolidated Login section */}
                    <div className="px-3 py-2 bg-dark-300/40 border-b border-brand-500/20">
                      <div className="flex flex-col gap-2">
                        {/* Login Options Section */}
                        <SimpleWalletButton onLoginComplete={() => setIsOpen(false)} isCompact={isCompact} />
                        
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

                {/* MCP Section - DISABLED FOR NOW */}
                {/* <MenuDivider />
                <motion.div variants={itemVariants}>
                  <Link
                    to="/mcp"
                    className="relative group overflow-hidden transition-all duration-300 ease-out
                      flex items-center justify-between mx-3 px-3 py-2.5 text-sm rounded-md
                      bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-purple-600/20
                      border border-purple-500/30 hover:border-purple-400/50
                      text-purple-200 hover:text-white
                      hover:shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                    onClick={() => setIsOpen(false)}
                    role="menuitem"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] animate-scan-fast opacity-0 group-hover:opacity-100" />
                    </div>
                    <span className="relative font-semibold tracking-wide group-hover:text-shadow-sm whitespace-nowrap">Connect to Degen MCP</span>
                    <div className="relative w-2 h-2 rounded-full bg-purple-400 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 rounded-full bg-purple-300 animate-ping opacity-40 group-hover:opacity-60" />
                    </div>
                  </Link>
                </motion.div> */}

                {/* Twitter/X Section - Special Styling for Mobile */}
                <motion.div variants={itemVariants}>
                  {(() => {
                    const isTwitterLinked = user?.twitter_id || user?.twitter_handle;
                    
                    if (isTwitterLinked) {
                      // Connected state - show handle or "Connected"
                      return (
                        <div
                          className="relative group overflow-hidden transition-all duration-300 ease-out
                            flex items-center justify-between mx-3 px-3 py-2.5 text-sm rounded-md
                            bg-gradient-to-r from-green-600/20 via-emerald-500/20 to-green-600/20
                            border border-green-500/30
                            text-green-200 cursor-default"
                          role="menuitem"
                        >
                          <span className="relative font-semibold tracking-wide whitespace-nowrap">
                            {user?.twitter_handle ? `@${user.twitter_handle}` : 'X Connected'}
                          </span>
                          
                          {/* Check icon */}
                          <div className="relative w-4 h-4 opacity-80">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-green-400">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          </div>
                        </div>
                      );
                    } else {
                      // Not connected - show connect button
                      return (
                        <a
                          href="https://degenduel.me/api/auth/twitter/login"
                          className="relative group overflow-hidden transition-all duration-300 ease-out
                            flex items-center justify-between mx-3 px-3 py-2.5 text-sm rounded-md
                            bg-gradient-to-r from-blue-600/20 via-cyan-500/20 to-blue-600/20
                            border border-blue-500/30 hover:border-blue-400/50
                            text-blue-200 hover:text-white
                            hover:shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                          onClick={() => setIsOpen(false)}
                          role="menuitem"
                        >
                          {/* Background shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                          
                          {/* Scan line effect */}
                          <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] animate-scan-fast opacity-0 group-hover:opacity-100" />
                          </div>
                          
                          <span className="relative font-semibold tracking-wide group-hover:text-shadow-sm whitespace-nowrap">Connect with X</span>
                          
                          {/* X icon */}
                          <div className="relative w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </div>
                        </a>
                      );
                    }
                  })()}
                </motion.div>

                {/* Telegram Section - Special Styling for Mobile */}
                <motion.div variants={itemVariants}>
                  {(() => {
                    const isTelegramLinked = user?.social_links?.telegram;
                    
                    if (isTelegramLinked) {
                      // Connected state - show handle or "Connected"
                      return (
                        <div
                          className="relative group overflow-hidden transition-all duration-300 ease-out
                            flex items-center justify-between mx-3 px-3 py-2.5 text-sm rounded-md
                            bg-gradient-to-r from-green-600/20 via-emerald-500/20 to-green-600/20
                            border border-green-500/30
                            text-green-200 cursor-default"
                          role="menuitem"
                        >
                          <span className="relative font-semibold tracking-wide whitespace-nowrap">
                            {user?.social_links?.telegram ? `@${user.social_links.telegram}` : 'Telegram Connected'}
                          </span>
                          
                          {/* Check icon */}
                          <div className="relative w-4 h-4 opacity-80">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-green-400">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          </div>
                        </div>
                      );
                    } else {
                      // Not connected - show connect button
                      return (
                        <a
                          href="https://degenduel.me/api/auth/telegram/login"
                          className="relative group overflow-hidden transition-all duration-300 ease-out
                            flex items-center justify-between mx-3 px-3 py-2.5 text-sm rounded-md
                            bg-gradient-to-r from-cyan-600/20 via-sky-500/20 to-cyan-600/20
                            border border-cyan-500/30 hover:border-cyan-400/50
                            text-cyan-200 hover:text-white
                            hover:shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                          onClick={() => setIsOpen(false)}
                          role="menuitem"
                        >
                          {/* Background shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                          
                          {/* Scan line effect */}
                          <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.08)_50%,transparent_100%)] animate-scan-fast opacity-0 group-hover:opacity-100" />
                          </div>
                          
                          <span className="relative font-semibold tracking-wide group-hover:text-shadow-sm whitespace-nowrap">Connect with Telegram</span>
                          
                          {/* Telegram icon */}
                          <div className="relative w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                          </div>
                        </a>
                      );
                    }
                  })()}
                </motion.div>

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