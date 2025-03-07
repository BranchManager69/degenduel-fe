import { Menu, Transition } from "@headlessui/react";
import React, { Fragment, useMemo, useState } from "react";
import { FaUser, FaUserFriends, FaBell } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { User } from "../../../types";
import { AdminControls } from "./UserMenuAdminControls";

interface UserMenuProps {
  user: User;
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
  const { isAdmin, isSuperAdmin } = useAuth();
  const [imageError, setImageError] = useState(false);

  const buttonStyles = useMemo(() => {
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
  }, [isAdmin, isSuperAdmin]);

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

  const menuItems = [
    {
      label: "Profile",
      icon: FaUser,
      to: "/me",
    },
    {
      label: "Noti's",
      icon: FaBell,
      to: "/notifications",
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    {
      label: "Referrals",
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
              <span
                className={`
                  ${buttonStyles.text} ${buttonStyles.hover.text}
                  font-medium tracking-wide transition-all duration-300
                  ${isCompact ? "text-sm" : "text-base"}
                `}
              >
                {displayName}
              </span>
              <div className="relative">
                {unreadNotifications > 0 && (
                  <div className="absolute -top-1 -right-1.5 z-10 flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-red-500 text-white border border-dark-200 shadow-lg animate-pulse">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
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
                            <span className="flex items-center justify-center min-w-5 h-5 text-xs font-semibold rounded-full bg-red-500/80 text-white px-1">
                              {item.badge > 99 ? "99+" : item.badge}
                            </span>
                          )}
                        </Link>
                      )}
                    </Menu.Item>
                  ))}

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
