import { Menu, Transition } from "@headlessui/react";
import React, { Fragment, useMemo } from "react";
import { FaUser, FaUserFriends } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { User } from "../../types";
import { AdminControls } from "./AdminControls";

interface UserMenuProps {
  user: User;
  onDisconnect: () => void;
  isCompact?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onDisconnect,
  isCompact = false,
}) => {
  const { isAdmin, isSuperAdmin } = useAuth();

  const buttonStyles = useMemo(() => {
    if (isSuperAdmin()) {
      return {
        bg: "from-red-600/30 via-brand-500/30 to-purple-600/30",
        text: "bg-gradient-to-r from-red-400 via-brand-400 to-purple-400",
        hover: {
          bg: "group-hover:from-red-500/40 group-hover:via-brand-400/40 group-hover:to-purple-500/40",
          text: "group-hover:from-red-300 group-hover:via-brand-300 group-hover:to-purple-300",
        },
      };
    }
    if (isAdmin()) {
      return {
        bg: "from-red-500/20 to-brand-500/20",
        text: "text-red-400",
        hover: {
          bg: "group-hover:from-red-400/30 group-hover:to-brand-400/30",
          text: "group-hover:text-red-300",
        },
      };
    }
    return {
      bg: "from-brand-500 to-purple-600",
      text: "text-white",
      hover: {
        bg: "group-hover:from-brand-400 group-hover:to-purple-500",
        text: "group-hover:text-white",
      },
    };
  }, [isAdmin, isSuperAdmin]);

  const displayName = useMemo(() => {
    if (user.nickname) return user.nickname;
    // Truncate wallet address more aggressively in compact mode
    const addr = user.wallet_address;
    return isCompact
      ? `${addr.slice(0, 4)}...${addr.slice(-4)}`
      : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, [user.nickname, user.wallet_address, isCompact]);

  const menuItems = [
    {
      label: "Profile",
      icon: FaUser,
      to: "/me",
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
              relative group overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
              ${isCompact ? "h-7" : "h-8"} flex items-center
            `}
          >
            {/* Container that creates the pill shape */}
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-r ${buttonStyles.bg} transition-all duration-300 ${buttonStyles.hover.bg}`}
            />
            <div className="absolute inset-0 rounded-full bg-dark-200/40 backdrop-blur-sm" />

            {/* Shine effect */}
            <div className="absolute inset-0 rounded-full">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(127,0,255,0.1),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Content */}
            <div className="relative flex items-center">
              <div
                className={`
                  rounded-full overflow-hidden ring-1 ring-brand-500/20 transition-all duration-300
                  ${isCompact ? "w-7 h-7" : "w-8 h-8"}
                `}
              >
                <img
                  src="/assets/media/default/profile_pic.png"
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <span
                className={`
                  ${
                    buttonStyles.text
                  } font-chakra transition-all duration-300 pl-2 pr-3 bg-clip-text
                  ${buttonStyles.hover.text}
                  ${isCompact ? "text-sm" : "text-base"}
                `}
              >
                {displayName}
              </span>
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
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_50%_0%,rgba(127,0,255,0.1),transparent_70%)]" />

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
                                ? "bg-brand-500/10 text-white"
                                : "text-gray-300"
                            }
                          `}
                        >
                          <item.icon
                            className={`
                            w-4 h-4 transition-colors duration-300
                            ${active ? "text-brand-300" : "text-brand-400"}
                          `}
                          />
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </Menu.Item>
                  ))}

                  <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent my-1" />

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onDisconnect}
                        className={`
                          w-full group flex items-center gap-2 px-4 py-2 text-sm transition-all duration-300 rounded-md
                          ${
                            active
                              ? "bg-red-500/10 text-red-300"
                              : "text-red-400"
                          }
                        `}
                      >
                        <svg
                          className={`
                            w-4 h-4 transition-colors duration-300
                            ${active ? "text-red-300" : "text-red-400"}
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
