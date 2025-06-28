/**
 * UserMenu Component (Desktop)
 * 
 * Part of DegenDuel's Unified Menu System: This component handles the desktop version
 * of the application's user menu. It shares core functionality with the mobile 
 * MobileMenuButton component through shared configuration and components.
 * 
 * @see /components/layout/menu/menuConfig.tsx - Shared menu structure
 * @see /components/layout/menu/SharedMenuComponents.tsx - Shared UI components
 * @see /components/layout/MobileMenuButton.tsx - Mobile counterpart
 */

import { Menu, Transition } from "@headlessui/react";
import React, { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";
import { useStore } from "../../../store/useStore";
import { User } from "../../../types";
import { TwitterLoginButton, DiscordLoginButton, TelegramLoginButton, BiometricAuthButton } from "../../auth";
import { getFullImageUrl } from "../../../utils/profileImageUtils";
import { getUserRoleColors } from "../../../utils/roleColors";
import { AdminControls } from "./UserMenuAdminControls";

// Import shared menu components and configuration
import { getMenuItems } from '../menu/menuConfig';
import {
    MenuDivider,
    SectionHeader
} from '../menu/SharedMenuComponents';

interface UserMenuProps {
  user: User | null;
  onDisconnect: () => void;
  isCompact?: boolean;
  unreadNotifications?: number;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onDisconnect,
  isCompact = false,
  unreadNotifications = 0,
}) => {
  const { isAdministrator, isSuperAdmin } = useMigratedAuth();
  const { achievements } = useStore();
  const [imageError, setImageError] = useState(false);

  // Get user level information
  const userLevel = achievements?.userProgress?.level || 0;
  
  // Get shared menu items from unified configuration
  const { profileItems, contestItems, tokenItems } = getMenuItems(user, userLevel);


  const buttonStyles = useMemo(() => {
    // Create a user object with the auth flags for the color utility
    const userWithAuthFlags = user ? {
      ...user,
      is_superadmin: isSuperAdmin,
      is_admin: isAdministrator && !isSuperAdmin  // Only true for regular admins, not super admins
    } : null;
    
    const roleColors = getUserRoleColors(userWithAuthFlags);
    
    // Add empty string defaults for optional properties
    return {
      ...roleColors,
      ring: roleColors.glow || "",
      shine: "",
      hover: roleColors.hover || {
        bg: "",
        text: "",
        border: "",
        glow: ""
      }
    };
  }, [user, isAdministrator, isSuperAdmin]);

  const displayName = useMemo(() => {
    if (!user) return 'User';
    if (user.nickname) return user.nickname;
    const addr = user.wallet_address;
    return isCompact
      ? `${addr.slice(0, 4)}...${addr.slice(-4)}`
      : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, [user, isCompact]);

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

  const handleImageError = () => {
    setImageError(true);
    console.warn("Failed to load profile image, falling back to default");
  };

  // Active menu item style
  const activeItemStyles = `bg-brand-500/20 text-white`;
  // Inactive menu item style
  const inactiveItemStyles = `text-gray-200 hover:text-white hover:bg-brand-500/10`;
  
  // Common menu item class for consistency
  const menuItemClass = `group flex items-center gap-2 px-4 py-2 text-sm transition-all duration-300 rounded-md`;

  // If user is null, perhaps render a loading state or minimal menu, or rely on parent not to render UserMenu
  // For now, the parent Header handles conditional rendering. These internal checks are for added safety.
  if (!user) {
    // This case should ideally not be reached if Header correctly unmounts UserMenu when user is null.
    // However, if it is reached, returning null prevents further rendering errors within UserMenu.
    // console.warn("[UserMenu] Rendered with null user prop. This shouldn't happen if Header is working correctly.");
    return null; 
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Mobile Menu Button - For non-logged in users */}
      {!user && (
        <div className="md:hidden">
          <button
            className="relative flex items-center justify-center transition-all duration-300 group overflow-hidden
              w-10 h-10
              rounded-full bg-gradient-to-r from-purple-600/20 via-purple-700/20 to-purple-800/20
              border border-purple-500/30 hover:border-purple-400/50
              hover:from-purple-500/30 hover:via-purple-600/30 hover:to-purple-700/30
              hover:shadow-[0_0_12px_rgba(127,0,255,0.3)]
              backdrop-blur-sm z-[60]"
            aria-label="Navigation menu"
          >
            {/* Gradient shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            
            {/* Hamburger Icon */}
            <div className="flex flex-col gap-[3px] items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-4">
              <div className="w-3 h-[2px] bg-purple-300 group-hover:bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center" />
              <div className="w-2.5 h-[2px] bg-purple-300 group-hover:bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />
              <div className="w-3 h-[2px] bg-purple-300 group-hover:bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center" />
            </div>
          </button>
        </div>
      )}
      
      {/* User Menu */}
      <Menu as="div" className="relative">
        {({ open }) => (
          <>
            {/* Desktop menu doesn't need backdrop - Headless UI handles click-outside */}
            
            <div className="relative z-50">
              <Menu.Button
                className={`
                  relative group overflow-hidden transition-all duration-300 ease-out
                  ${isCompact ? "h-7" : "h-8"} flex items-center
                  rounded-full border ${buttonStyles.border} ${
                    buttonStyles.hover.border
                  }
                `}
                aria-label="User menu"
                aria-expanded={open}
                aria-haspopup="true"
              >
                {/* Background */}
                <div
                  className={`absolute inset-0 ${buttonStyles.bg} ${buttonStyles.hover.bg} transition-all duration-300`}
                />

                {/* Content */}
                <div className="relative flex items-center justify-between w-full px-3">
                  <div className="flex items-center gap-2">
                    {/* Level Badge - Only show if level > 0 */}
                    {userLevel > 0 && (
                      <div
                        className={`
                          flex items-center justify-center 
                          ${isCompact ? "h-4 min-w-4 text-[9px]" : "h-5 min-w-5 text-[10px]"} 
                          px-1 font-bold rounded-full 
                          bg-purple-700/80 text-purple-100
                          border border-purple-600/50
                          shadow-inner transition-all duration-300
                        `}
                      >
                        <span className="mx-0.5">{userLevel}</span>
                      </div>
                    )}

                    {/* Username with profile link indicator */}
                    <span
                      className={`
                        ${buttonStyles.text} ${buttonStyles.hover.text}
                        font-medium tracking-wide transition-all duration-300
                        ${isCompact ? "text-sm" : "text-base"} group-hover:underline
                      `}
                    >
                      {displayName}
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className={`
                        ml-2 rounded-full overflow-hidden
                        transition-all duration-300 shadow-lg
                        ${isCompact ? "w-7 h-7" : "w-8 h-8"}
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
              </Menu.Button>
            </div>

            <Transition
              show={open}
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items 
                static
                className="absolute right-0 mt-1 w-56 origin-top-right bg-dark-200/95 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg overflow-hidden z-50"
                style={{ isolation: 'isolate' }}
              >
                {/* Enhanced gradient overlays for consistency with mobile */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_50%_0%,rgba(127,0,255,0.12),transparent_70%)]" />

                <div className="relative">
                  {/* Admin Controls Section */}
                  <AdminControls />

                  {/* User Profile Section with notifications */}
                  <div className="flex items-center justify-between px-3 py-2 bg-dark-300/40 border-b border-brand-500/20">
                    {/* Profile section - clickable */}
                    <Link 
                      to="/me"
                      className="flex items-center flex-1 hover:opacity-80 transition-opacity"
                    >
                      <div className="relative mr-3">
                        {/* Level Badge */}
                        {userLevel > 0 && (
                          <div className={`absolute -bottom-0.5 -right-0.5 z-10 flex items-center justify-center h-4 w-4 
                            bg-purple-700/80 text-xs font-bold rounded-full border border-purple-600/50 
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

                  {/* Profile Menu Items */}
                  <div className="p-1">
                    {/* User-specific menu items mapped from shared config */}
                    {profileItems.map((item: { 
                      id: string; 
                      label: string; 
                      to: string; 
                      icon: React.ComponentType<{ className?: string }>;
                      badge?: string | number;
                    }) => (
                      <Menu.Item key={item.id}>
                        {({ active }) => (
                          <Link
                            to={item.to}
                            className={`
                              ${menuItemClass}
                              ${active ? activeItemStyles : inactiveItemStyles}
                            `}
                            role="menuitem"
                          >
                            <item.icon
                              className={`
                                w-4 h-4 transition-colors duration-300
                                ${active ? "text-brand-200" : "text-brand-300"}
                              `}
                            />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`
                                  flex items-center justify-center min-w-5 h-5 text-xs font-semibold 
                                  rounded-full px-1.5 shadow-sm
                                  bg-red-500/80 text-white
                                `}
                              >
                                {typeof item.badge === "string" || typeof item.badge === "number" ? 
                                  (typeof item.badge === "number" && item.badge > 99 ? "99+" : item.badge) 
                                  : ""}
                              </span>
                            )}
                          </Link>
                        )}
                      </Menu.Item>
                    ))}
                    
                    {/* Social Authentication Grid - Professional layout */}
                    <div className="px-4 py-3">
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
                              linkMode={true}
                              iconOnly={true}
                              className="w-11 h-11 p-0 rounded-lg bg-gray-800/40 border border-gray-600/30 hover:bg-gray-700/60 hover:border-gray-500/50 transition-all duration-200 flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5"
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
                        <div className="relative group">
                          {user?.telegram_id ? (
                            <div className="w-11 h-11 rounded-lg bg-[#0088cc]/20 border border-[#0088cc]/40 flex items-center justify-center relative overflow-hidden">
                              {/* Telegram Logo SVG */}
                              <svg className="w-5 h-5 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345c-.48.33-.913.49-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789c.027-.216.325-.437.893-.663c3.498-1.524 5.83-2.529 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635z"/>
                              </svg>
                              {/* Connected indicator */}
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                            </div>
                          ) : (
                            <TelegramLoginButton 
                              linkMode={true}
                              iconOnly={true}
                              className="w-11 h-11 p-0 rounded-lg bg-[#0088cc]/10 border border-[#0088cc]/20 hover:bg-[#0088cc]/20 hover:border-[#0088cc]/40 transition-all duration-200 flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5"
                            />
                          )}
                        </div>

                        {/* Passkey */}
                        <div className="relative group">
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
                          ) : (
                            <BiometricAuthButton 
                              mode="register"
                              buttonStyle="icon-only"
                              className="w-11 h-11 p-0 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-all duration-200 flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <MenuDivider />
                    
                    {/* COMMENTED OUT: Biometric Authentication Component */}
                    {/* {user.wallet_address && (
                      <BiometricAuthComponent 
                        userId={user.wallet_address}
                        menuItemClass={`${menuItemClass} text-blue-300 hover:text-blue-200 hover:bg-blue-500/20`}
                      />
                    )} */}

                    {/* Add navigation sections from shared config */}
                    <MenuDivider />
                    
                    {/* Contests Section */}
                    <SectionHeader title="Contests" />
                    {contestItems.map((item) => (
                      <Menu.Item key={item.id}>
                        {({ active }) => (
                          <Link
                            to={item.to}
                            className={`
                              ${menuItemClass}
                              ${active ? activeItemStyles : inactiveItemStyles}
                            `}
                            role="menuitem"
                          >
                            <span className="flex-1">{item.label}</span>
                          </Link>
                        )}
                      </Menu.Item>
                    ))}

                    {/* Tokens Section */}
                    <MenuDivider />
                    <SectionHeader title="Tokens" />
                    {tokenItems.map((item) => (
                      <Menu.Item key={item.id}>
                        {({ active }) => (
                          <Link
                            to={item.to}
                            className={`
                              ${menuItemClass}
                              ${active ? activeItemStyles : inactiveItemStyles}
                            `}
                            role="menuitem"
                          >
                            <span className="flex-1">{item.label}</span>
                          </Link>
                        )}
                      </Menu.Item>
                    ))}

                    {/* MCP Section - REMOVED to match mobile menu and header nav */}


                    <MenuDivider />

                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={onDisconnect}
                          className={`
                            w-full group flex items-center gap-2 px-4 py-2 text-sm transition-all duration-300 rounded-md
                            ${
                              active
                                ? "bg-red-500/20 text-red-200"
                                : "text-red-300 hover:text-red-200 hover:bg-red-500/10"
                            }
                          `}
                          role="menuitem"
                        >
                          <svg
                            className={`
                              w-4 h-4 transition-colors duration-300
                              ${active ? "text-red-200" : "text-red-300"}
                            `}
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
                      )}
                    </Menu.Item>
                  </div>
                </div>
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
    </div>
  );
};