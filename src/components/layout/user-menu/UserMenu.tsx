import { Menu, Transition } from "@headlessui/react";
import React, { Fragment, useMemo, useState } from "react";
import { FaBell, FaFingerprint, FaTrophy, FaUser, FaUserFriends } from "react-icons/fa";
import { Link } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth";
import useBiometricAuth from "../../../hooks/useBiometricAuth";
import { useStore } from "../../../store/useStore";
import { User } from "../../../types";
import { AdminControls } from "./UserMenuAdminControls";

// Define the shape of our menu items
interface MenuItemType {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  to: string;
  badge?: number | string;
  badgeColor?: string;
}

interface UserMenuProps {
  user: User;
  onDisconnect: () => void;
  isCompact?: boolean;
  unreadNotifications?: number;
}

// Biometric Auth Menu Option Component
const BiometricAuthMenuOption: React.FC<{ userId: string }> = ({ userId }) => {
  const { isAvailable, isRegistered, registerCredential, authenticate } = useBiometricAuth();
  const [isLoading, setIsLoading] = useState(false);
  const user = useStore(state => state.user);
  
  // Don't show if biometric auth is not available
  if (!isAvailable) return null;
  
  const handleBiometricAction = async () => {
    setIsLoading(true);
    
    try {
      if (isRegistered) {
        // Authenticate with biometrics
        await authenticate(userId);
      } else {
        // Register biometric credential with platform authenticator (Face ID, Touch ID, etc.)
        await registerCredential(
          userId, 
          user?.nickname || userId,
          { 
            authenticatorType: 'platform',
            nickname: user?.nickname || undefined
          }
        );
      }
    } catch (err) {
      console.error('Biometric auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Menu.Item>
      {({ active }) => (
        <button
          onClick={handleBiometricAction}
          disabled={isLoading}
          className={`
            w-full group flex items-center gap-2 px-4 py-2 text-sm transition-all duration-300 rounded-md
            ${active ? "bg-blue-500/20 text-blue-200" : "text-blue-300 hover:text-blue-200"}
            ${isLoading ? "opacity-70 cursor-not-allowed" : ""}
          `}
        >
          <FaFingerprint 
            className={`
              w-4 h-4 transition-colors duration-300
              ${active ? "text-blue-200" : "text-blue-300"}
            `} 
          />
          <span className="flex-1">
            {isLoading ? "Processing..." : (isRegistered ? "Use Biometrics" : "Setup Biometrics")}
          </span>
        </button>
      )}
    </Menu.Item>
  );
};

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onDisconnect,
  isCompact = false,
  unreadNotifications = 0,
}) => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { achievements } = useStore();
  const [imageError, setImageError] = useState(false);

  // Get user level information
  const userLevel = achievements?.userProgress?.level || 0;

  // Define a function to get color scheme based on level
  const getLevelColorScheme = useMemo(() => {
    // Return different color schemes based on level tiers
    if (userLevel >= 40) {
      return {
        bg: "from-amber-500/20 via-amber-400/20 to-amber-300/20",
        text: "text-amber-300",
        border: "border-amber-400/30",
        badge: "bg-gradient-to-r from-amber-600 to-amber-400",
        badgeBorder: "border-amber-500/30",
        hover: {
          glow: "group-hover:shadow-[0_0_10px_rgba(251,191,36,0.3)]",
          border: "group-hover:border-amber-400/50",
          badge: "group-hover:from-amber-500 group-hover:to-amber-300",
        },
      };
    } else if (userLevel >= 30) {
      return {
        bg: "from-fuchsia-500/20 via-fuchsia-400/20 to-fuchsia-300/20",
        text: "text-fuchsia-300",
        border: "border-fuchsia-400/30",
        badge: "bg-gradient-to-r from-fuchsia-600 to-fuchsia-400",
        badgeBorder: "border-fuchsia-500/30",
        hover: {
          glow: "group-hover:shadow-[0_0_10px_rgba(217,70,239,0.3)]",
          border: "group-hover:border-fuchsia-400/50",
          badge: "group-hover:from-fuchsia-500 group-hover:to-fuchsia-300",
        },
      };
    } else if (userLevel >= 20) {
      return {
        bg: "from-blue-500/20 via-blue-400/20 to-blue-300/20",
        text: "text-blue-300",
        border: "border-blue-400/30",
        badge: "bg-gradient-to-r from-blue-600 to-blue-400",
        badgeBorder: "border-blue-500/30",
        hover: {
          glow: "group-hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]",
          border: "group-hover:border-blue-400/50",
          badge: "group-hover:from-blue-500 group-hover:to-blue-300",
        },
      };
    } else if (userLevel >= 10) {
      return {
        bg: "from-emerald-500/20 via-emerald-400/20 to-emerald-300/20",
        text: "text-emerald-300",
        border: "border-emerald-400/30",
        badge: "bg-gradient-to-r from-emerald-600 to-emerald-400",
        badgeBorder: "border-emerald-500/30",
        hover: {
          glow: "group-hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]",
          border: "group-hover:border-emerald-400/50",
          badge: "group-hover:from-emerald-500 group-hover:to-emerald-300",
        },
      };
    } else if (userLevel >= 5) {
      return {
        bg: "from-cyan-500/20 via-cyan-400/20 to-cyan-300/20",
        text: "text-cyan-300",
        border: "border-cyan-400/30",
        badge: "bg-gradient-to-r from-cyan-600 to-cyan-400",
        badgeBorder: "border-cyan-500/30",
        hover: {
          glow: "group-hover:shadow-[0_0_10px_rgba(6,182,212,0.3)]",
          border: "group-hover:border-cyan-400/50",
          badge: "group-hover:from-cyan-500 group-hover:to-cyan-300",
        },
      };
    } else {
      // Default colors for levels 1-4
      return {
        bg: "from-brand-500/20 via-brand-400/20 to-brand-300/20",
        text: "text-brand-300",
        border: "border-brand-400/30",
        badge: "bg-gradient-to-r from-brand-600 to-brand-400",
        badgeBorder: "border-brand-500/30",
        hover: {
          glow: "group-hover:shadow-[0_0_10px_rgba(153,51,255,0.3)]",
          border: "group-hover:border-brand-400/50",
          badge: "group-hover:from-brand-500 group-hover:to-brand-300",
        },
      };
    }
  }, [userLevel]);

  const buttonStyles = useMemo(() => {
    // Super Admin styling takes precedence
    if (isSuperAdmin()) {
      return {
        bg: "from-amber-500/20 via-amber-400/20 to-amber-300/20",
        text: "text-amber-100",
        border: "border-amber-400/30",
        hover: {
          bg: "group-hover:from-amber-400/30 group-hover:via-amber-300/30 group-hover:to-amber-200/30",
          text: "group-hover:text-white",
          border: "group-hover:border-amber-400/50",
          glow: "group-hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]",
        },
        ring: "ring-amber-400/30 group-hover:ring-amber-400/50",
        shine: "via-white/30",
      };
    }

    // Admin styling takes secondary precedence
    if (isAdmin()) {
      return {
        bg: "from-brand-600/20 via-brand-500/20 to-brand-400/20",
        text: "text-brand-100",
        border: "border-brand-400/30",
        hover: {
          bg: "group-hover:from-brand-500/30 group-hover:via-brand-400/30 group-hover:to-brand-300/30",
          text: "group-hover:text-white",
          border: "group-hover:border-brand-400/50",
          glow: "group-hover:shadow-[0_0_12px_rgba(153,51,255,0.25)]",
        },
        ring: "ring-brand-400/30 group-hover:ring-brand-400/50",
        shine: "via-white/25",
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
          text: "group-hover:text-white",
          border: levelColors.hover.border,
          glow: levelColors.hover.glow,
        },
        ring: `ring-${levelColors.border.replace("border-", "")} group-hover:ring-${levelColors.hover.border.replace("group-hover:border-", "")}`,
        shine: "via-white/25",
      };
    }

    // Default styling for users with no level
    return {
      bg: "from-brand-500/20 to-brand-400/20",
      text: "text-gray-200",
      border: "border-brand-400/20",
      hover: {
        bg: "group-hover:from-brand-400/25 group-hover:to-brand-300/25",
        text: "group-hover:text-white",
        border: "group-hover:border-brand-400/30",
        glow: "group-hover:shadow-[0_0_8px_rgba(153,51,255,0.15)]",
      },
      ring: "ring-brand-400/20 group-hover:ring-brand-400/30",
      shine: "via-white/20",
    };
  }, [isAdmin, isSuperAdmin, userLevel, getLevelColorScheme]);

  const displayName = useMemo(() => {
    if (user.nickname) return user.nickname;
    const addr = user.wallet_address;
    return isCompact
      ? `${addr.slice(0, 4)}...${addr.slice(-4)}`
      : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, [user.nickname, user.wallet_address, isCompact]);

  const profileImageUrl = useMemo(() => {
    if (imageError || !user.profile_image?.url) {
      return "/assets/media/default/profile_pic.png";
    }
    return user.profile_image.thumbnail_url || user.profile_image.url;
  }, [user.profile_image, imageError]);

  const handleImageError = () => {
    setImageError(true);
    console.warn("Failed to load profile image, falling back to default");
  };

  const menuItems: MenuItemType[] = [
    {
      label: "Profile",
      icon: FaUser,
      to: "/me",
    },
    // Add Degen Level item that links to leaderboard
    {
      label: "Degen Level",
      icon: FaTrophy,
      to: "/leaderboard",
      badge: userLevel > 0 ? `Lvl ${userLevel}` : undefined,
      badgeColor: userLevel > 0 ? getLevelColorScheme.badge : undefined,
    },
    {
      label: "Noti's",
      icon: FaBell,
      to: "/notifications",
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    {
      label: "Invite & Earn",
      icon: FaUserFriends,
      to: "/referrals",
    },
  ];

  return (
    <Menu as="div" className="relative">
      {({ open }) => (
        <>
          <Menu.Button
            className={`
              relative group overflow-hidden transition-all duration-300 ease-out
              ${isCompact ? "h-7" : "h-8"} flex items-center
              rounded-full border ${buttonStyles.border} ${
                buttonStyles.hover.border
              }
              ${buttonStyles.hover.glow} transition-shadow duration-500
            `}
          >
            {/* Background gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${buttonStyles.bg} ${buttonStyles.hover.bg} transition-all duration-300`}
            />

            {/* Shine effect */}
            <div className="absolute inset-0">
              <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent ${buttonStyles.shine} to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000`}
              />
            </div>

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
                      ${getLevelColorScheme.badge}
                      border ${getLevelColorScheme.badgeBorder}
                      shadow-inner transition-all duration-300
                    `}
                  >
                    <span className="mx-0.5">{userLevel}</span>
                  </div>
                )}

                {/* Username */}
                <span
                  className={`
                    ${buttonStyles.text} ${buttonStyles.hover.text}
                    font-medium tracking-wide transition-all duration-300
                    ${isCompact ? "text-sm" : "text-base"}
                  `}
                >
                  {displayName}
                </span>
              </div>

              {/* Avatar */}
              <div className="relative">
                {unreadNotifications > 0 && (
                  <div className="absolute -top-1 -right-1.5 z-10 flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-red-500 text-white border border-dark-200 shadow-lg animate-pulse">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </div>
                )}
                <div
                  className={`
                    ml-2 rounded-full overflow-hidden ring-2 ${buttonStyles.ring}
                    transition-all duration-300 shadow-lg
                    ${isCompact ? "w-5 h-5" : "w-6 h-6"}
                    bg-dark-300
                  `}
                >
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
            </div>
          </Menu.Button>

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
            <Menu.Items className="absolute right-0 mt-1 w-56 origin-top-right bg-dark-200/95 backdrop-blur-sm border border-brand-500/20 rounded-lg shadow-lg overflow-hidden z-50">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                {/* Admin Controls Section */}
                <AdminControls />

                {/* Regular Menu Items */}
                <div className="p-1">
                  {menuItems.map((item) => (
                    <Menu.Item key={item.label}>
                      {({ active }) => (
                        <Link
                          to={item.to}
                          className={`
                            group flex items-center gap-2 px-4 py-2 text-sm transition-all duration-300 rounded-md
                            ${
                              active
                                ? "bg-brand-500/20 text-white"
                                : "text-gray-200 hover:text-white"
                            }
                          `}
                        >
                          <item.icon
                            className={`
                              w-4 h-4 transition-colors duration-300
                              ${active ? "text-brand-200" : "text-brand-300"}
                            `}
                          />
                          <span className="flex-1">{item.label}</span>
                          {item.badge !== undefined && (
                            <span
                              className={`
                                flex items-center justify-center min-w-5 h-5 text-xs font-semibold 
                                rounded-full px-1.5 shadow-sm
                                ${item.badgeColor ? item.badgeColor : "bg-red-500/80"} 
                                text-white
                              `}
                            >
                              {typeof item.badge === "number" && item.badge > 99
                                ? "99+"
                                : item.badge}
                            </span>
                          )}
                        </Link>
                      )}
                    </Menu.Item>
                  ))}

                  <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent my-1" />
                  
                  {/* Biometric Authentication Option */}
                  <BiometricAuthMenuOption userId={user.wallet_address} />

                  <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent my-1" />

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onDisconnect}
                        className={`
                          w-full group flex items-center gap-2 px-4 py-2 text-sm transition-all duration-300 rounded-md
                          ${
                            active
                              ? "bg-red-500/20 text-red-200"
                              : "text-red-300 hover:text-red-200"
                          }
                        `}
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
  );
};
