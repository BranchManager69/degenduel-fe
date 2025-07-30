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
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { config } from "../../config/config";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useStore } from "../../store/useStore";
import { getFullImageUrl } from "../../utils/profileImageUtils";
import { getUserRoleColors } from "../../utils/roleColors";
import { BiometricAuthButton, DiscordLoginButton, SimpleWalletButton, TelegramLoginButton, TwitterLoginButton } from "../auth";
import NanoLogo from "../logo/NanoLogo";
import SolanaTokenDisplay from "../SolanaTokenDisplay";

// Import shared menu components and configuration
import { getMenuItems } from './menu/menuConfig';
import {
  // MenuBackdrop,
  MenuDivider,
  SectionHeader
} from './menu/SharedMenuComponents';

interface MobileMenuButtonProps {
  className?: string;
  isCompact?: boolean;
  onDisconnect?: () => void;
  unreadNotifications?: number;
  onMenuToggle?: (isOpen: boolean) => void;
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({
  className = "",
  isCompact = false,
  onDisconnect,
  unreadNotifications = 0,
  onMenuToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Notify parent when menu state changes
  useEffect(() => {
    onMenuToggle?.(isOpen);
  }, [isOpen, onMenuToggle]);
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
    if (!user || imageError) {
      return "/assets/media/default/profile_pic.png";
    }
    
    // Try multiple profile image sources in order of preference
    let imageUrl = null;
    
    // 1. Try profile_image_url (string field)
    if (user.profile_image_url) {
      imageUrl = getFullImageUrl(user.profile_image_url);
    }
    
    // 2. Try profile_image.url (object field)
    if (!imageUrl && user.profile_image?.url) {
      imageUrl = getFullImageUrl(user.profile_image.url);
    }
    
    // 3. Try avatar_url (alternative field)
    if (!imageUrl && user.avatar_url) {
      imageUrl = getFullImageUrl(user.avatar_url);
    }
    
    return imageUrl || "/assets/media/default/profile_pic.png";
  }, [user, imageError]);

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

  // Use the same role-based button styling as desktop
  const buttonStyles = useMemo(() => {
    // Get role colors from the shared utility
    const roleColors = getUserRoleColors(user);
    
    // For regular users with levels, use level-based styling
    if (!user?.is_admin && !user?.is_superadmin && !user?.role && userLevel > 0) {
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
    
    // Use role colors from the utility
    return {
      bg: roleColors.bg,
      text: roleColors.text,
      border: roleColors.border,
      hover: {
        bg: roleColors.hover?.bg || "",
        border: roleColors.hover?.border || "",
        glow: roleColors.glow || "",
      },
      ring: roleColors.glow || "",
    };
  }, [user, userLevel, getLevelColorScheme]);

  return (
    <div className={`relative ${className}`}>
        {/* Header Menu Controls - Row Layout for Token Balance, Profile and Notifications */}
        <div className="flex items-center space-x-1">
        {/* Token Balance Display (for all users) */}
        <Link
          to="/wallet"
          className="group relative mr-1"
          onClick={() => setIsOpen(false)}
        >
          {/* Outer glow that intensifies on hover */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full opacity-0 group-hover:opacity-75 blur transition-all duration-300 group-hover:duration-200" />
          
          {/* Main container - compact for mobile, matching UserMenu height */}
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
              {user ? (
                <SolanaTokenDisplay 
                  mintAddress={config.SOLANA.DEGEN_TOKEN_ADDRESS}
                  walletAddress={user.wallet_address} 
                  compact={true}
                  className={`font-normal leading-none ${isCompact ? "text-[10px]" : "text-xs"}`}
                  showSupply={false}
                  showHolders={false}
                />
              ) : (
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
              )}
            </div>
            
            {/* Token icon - slightly smaller with more spacing */}
            <div className="relative flex items-center justify-center w-4 h-4 ml-2">
              <div className="absolute inset-0 bg-purple-400 rounded-full animate-ping opacity-20" />
              <div className="relative w-4 h-4 flex items-center justify-center">
                <NanoLogo />
              </div>
            </div>
            
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 
                bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>
        </Link>
        
        {/* User Menu Button - Full pill style like desktop */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative group overflow-hidden transition-all duration-300 ease-out
            ${isCompact ? "h-7" : "h-8"} flex items-center
            rounded-full border ${user ? `${buttonStyles.border} ${buttonStyles.hover.border} ${buttonStyles.hover.glow}` : 
            `border-purple-500/30 hover:border-purple-400/50
            hover:shadow-[0_0_12px_rgba(127,0,255,0.3)]`} z-[60]`}
          aria-label="User menu"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {user ? (
            <>
              {/* Background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-r ${buttonStyles.bg} ${buttonStyles.hover.bg} transition-all duration-300`}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between w-full px-2">
                <div className="flex items-center gap-1.5">
                  {/* Level Badge - Only show if level > 0 */}
                  {userLevel > 0 && (
                    <div
                      className={`
                        flex items-center justify-center 
                        ${isCompact ? "h-3.5 min-w-3.5 text-[9px]" : "h-4 min-w-4 text-[10px]"} 
                        px-1 font-bold rounded-full 
                        bg-purple-700/80 text-purple-100
                        border border-purple-600/50
                        shadow-inner transition-all duration-300
                      `}
                    >
                      <span className="mx-0.5">{userLevel}</span>
                    </div>
                  )}

                  {/* Username */}
                  <span
                    className={`
                      ${buttonStyles.text}
                      font-medium tracking-wide transition-all duration-300
                      ${isCompact ? "text-xs" : "text-sm"}
                    `}
                  >
                    {displayName}
                  </span>
                </div>

                {/* Avatar */}
                <div className="relative">
                  <div
                    className={`
                      ml-1.5 rounded-full overflow-hidden
                      transition-all duration-300 shadow-lg
                      ${isCompact ? "w-6 h-6" : "w-7 h-7"}
                      bg-dark-300 
                      group-hover:scale-105
                    `}
                  >
                    <img
                      src={profileImageUrl}
                      alt={displayName}
                      onError={handleImageError}
                      className="w-full h-full object-cover group-hover:brightness-110"
                      loading="eager"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Non-logged in button background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-purple-700/20 to-purple-800/20 backdrop-blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              
              {/* Hamburger Menu for Non-Logged-In Users */}
              <div className="relative px-3 py-1">
                
                {/* Hamburger Menu for Non-Logged-In Users */}
                <div className={`flex flex-col gap-[3px] items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isCompact ? "w-3" : "w-4"}`}>
                  <motion.div
                    animate={isOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className={`${
                      isCompact ? "w-2.5" : "w-3"
                    } h-[2px] bg-purple-300 group-hover:bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center shadow-[0_0_4px_rgba(127,0,255,0.3)]`}
                  />
                  <motion.div
                    animate={
                      isOpen ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }
                    }
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className={`${
                      isCompact ? "w-2" : "w-2.5"
                    } h-[2px] bg-purple-300 group-hover:bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_0_4px_rgba(127,0,255,0.3)]`}
                  />
                  <motion.div
                    animate={isOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className={`${
                      isCompact ? "w-2.5" : "w-3"
                    } h-[2px] bg-purple-300 group-hover:bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center shadow-[0_0_4px_rgba(127,0,255,0.3)]`}
                  />
                </div>
                
              </div>

            </>
          )}
        </button>
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`absolute right-0 mt-2 w-56 max-h-[85vh] overflow-y-auto bg-dark-200/95 border border-gray-700/30 
                rounded-lg shadow-lg shadow-black/50 z-[60] origin-top-right backdrop-blur-xl`}
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="mobile-menu-button"
            >
              {/* Enhanced gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_50%_0%,rgba(127,0,255,0.12),transparent_70%)]" />

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
                    {/* User profile info with notifications */}
                    <div className="flex items-center justify-between px-3 py-2 bg-dark-300/40 border-b border-brand-500/20">
                      {/* Profile section - clickable */}
                      <Link 
                        to="/me"
                        className="flex items-center flex-1 hover:opacity-80 transition-opacity"
                        onClick={() => setIsOpen(false)}
                      >
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
                      </Link>
                      
                      {/* Notifications bell */}
                      <Link
                        to="/notifications"
                        className="relative p-2 hover:bg-dark-300/60 rounded-lg transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <svg
                          className="w-5 h-5 text-gray-400 hover:text-white transition-colors"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                        {unreadNotifications > 0 && (
                          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 text-xs font-semibold rounded-full px-1 bg-red-500/80 text-white">
                            {unreadNotifications > 99 ? "99+" : unreadNotifications}
                          </span>
                        )}
                      </Link>
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
                    
                    {/* Social Authentication Grid - Moved up from bottom */}
                    <div className="px-3 py-3">
                      <div className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">Connect Accounts</div>
                      <div className="grid grid-cols-4 gap-3">
                        {/* X (Twitter) */}
                        <div className="relative group">
                          {user?.twitter_id ? (
                            <div className="w-11 h-11 rounded-lg bg-gray-800/60 border border-gray-600/40 flex items-center justify-center relative overflow-hidden">
                              {/* X Logo SVG */}
                              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>
                              {/* Connected indicator */}
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                            </div>
                          ) : (
                            <TwitterLoginButton 
                              linkMode={!!user}
                              iconOnly={true}
                              className="w-11 h-11 p-0 rounded-lg bg-gray-800/40 border border-gray-600/30 hover:bg-gray-700/60 hover:border-gray-500/50 transition-all duration-200 flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5"
                              onSuccess={() => setIsOpen(false)}
                            />
                          )}
                        </div>

                        {/* Discord */}
                        <div className="relative group">
                          {user?.discord_id ? (
                            <div className="w-11 h-11 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/40 flex items-center justify-center relative overflow-hidden">
                              {/* Discord Logo SVG */}
                              <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.197.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                              </svg>
                              {/* Connected indicator */}
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                            </div>
                          ) : (
                            <DiscordLoginButton 
                              linkMode={true}
                              iconOnly={true}
                              className="w-11 h-11 p-0 rounded-lg bg-[#5865F2]/10 border border-[#5865F2]/20 hover:bg-[#5865F2]/20 hover:border-[#5865F2]/40 transition-all duration-200 flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5"
                            />
                          )}
                        </div>

                        {/* Telegram */}
                        <div className={`relative group ${!(isAdministrator || isSuperAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {user?.telegram_id ? (
                            <div className="w-11 h-11 rounded-lg bg-[#0088cc]/20 border border-[#0088cc]/40 flex items-center justify-center relative overflow-hidden">
                              {/* Telegram Logo SVG */}
                              <svg className="w-5 h-5 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345c-.48.33-.913.49-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789c.027-.216.325-.437.893-.663c3.498-1.524 5.83-2.529 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635z"/>
                              </svg>
                              {/* Connected indicator */}
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                            </div>
                          ) : (isAdministrator || isSuperAdmin) ? (
                            <TelegramLoginButton 
                              linkMode={!!user}
                              iconOnly={true}
                              className="w-11 h-11 p-0 rounded-lg bg-[#0088cc]/10 border border-[#0088cc]/20 hover:bg-[#0088cc]/20 hover:border-[#0088cc]/40 transition-all duration-200 flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-[#0088cc]/10 border border-[#0088cc]/20 flex items-center justify-center pointer-events-none">
                              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345c-.48.33-.913.49-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789c.027-.216.325-.437.893-.663c3.498-1.524 5.83-2.529 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635z"/>
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Passkey */}
                        <div className={`relative group ${!(isAdministrator || isSuperAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {user?.passkey_id ? (
                            <div className="w-11 h-11 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center relative overflow-hidden">
                              {/* Fingerprint/Touch ID SVG */}
                              <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/>
                                <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2"/>
                                <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                                <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                                <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                                <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                                <path d="M2 16h.01"/>
                                <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                                <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2"/>
                              </svg>
                              {/* Connected indicator */}
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                            </div>
                          ) : (isAdministrator || isSuperAdmin) ? (
                            <BiometricAuthButton 
                              mode="register"
                              buttonStyle="icon-only"
                              className="w-11 h-11 p-0 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all duration-200 flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center pointer-events-none">
                              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/>
                                <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2"/>
                                <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                                <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                                <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                                <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                                <path d="M2 16h.01"/>
                                <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                                <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <MenuDivider />
                    
                    {/* User menu items */}
                    {profileItems.map((item: any) => (
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