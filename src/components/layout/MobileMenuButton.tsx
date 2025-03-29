import { AnimatePresence, motion } from "framer-motion";
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FaBell, FaTrophy, FaUser, FaUserFriends, FaTwitter } from "react-icons/fa";

import { useStore } from "../../store/useStore";
import { useAuth } from "../../hooks/useAuth";
import { ConnectWalletButton } from "../auth/ConnectWalletButton";

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
  const { isAdmin, isSuperAdmin } = useAuth();
  const [imageError, setImageError] = useState(false);
  
  // Get user level information
  const { achievements } = useStore();
  const userLevel = achievements?.userProgress?.level || 0;
  
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
    if (imageError || !user?.profile_image?.url) {
      return "/assets/media/default/profile_pic.png";
    }
    return user.profile_image.thumbnail_url || user.profile_image.url;
  }, [user?.profile_image, imageError]);

  const displayName = useMemo(() => {
    if (!user) return "";
    if (user.nickname) return user.nickname;
    const addr = user.wallet_address;
    return isCompact
      ? `${addr.slice(0, 4)}...${addr.slice(-4)}`
      : `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, [user?.nickname, user?.wallet_address, isCompact]);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center transition-all duration-200 group
          ${isCompact ? "w-8 h-8" : "w-9 h-9"}
          hover:bg-dark-300/30 active:bg-dark-300/40 rounded-md relative z-50`}
      >
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
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`absolute right-0 mt-2 w-56 bg-dark-200/95 border border-brand-500/30 
                rounded-md shadow-lg shadow-black/50 overflow-hidden z-50 origin-top-right backdrop-blur-xl`}
            >
              {/* Enhanced gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 via-transparent to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_50%_0%,rgba(127,0,255,0.15),transparent_70%)]" />

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
                    <div className="px-4 py-3 bg-dark-300/40 border-b border-brand-500/20">
                      <div className="flex items-center">
                        <div className="relative mr-3">
                          {unreadNotifications > 0 && (
                            <div className="absolute -top-1 -right-1 z-10 flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-red-500 text-white border border-dark-200 shadow-lg animate-pulse">
                              {unreadNotifications > 9 ? "9+" : unreadNotifications}
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
                    
                    {/* User menu items */}
                    <ProfileMenuItem 
                      to="/me" 
                      icon={FaUser} 
                      onClick={() => setIsOpen(false)}
                    >
                      Profile
                    </ProfileMenuItem>
                    <ProfileMenuItem 
                      to="/leaderboard" 
                      icon={FaTrophy} 
                      onClick={() => setIsOpen(false)}
                    >
                      Degen Level
                    </ProfileMenuItem>
                    <ProfileMenuItem 
                      to="/notifications" 
                      icon={FaBell} 
                      badge={unreadNotifications > 0 ? unreadNotifications : undefined}
                      onClick={() => setIsOpen(false)}
                    >
                      Notifications
                    </ProfileMenuItem>
                    <ProfileMenuItem 
                      to="/referrals" 
                      icon={FaUserFriends} 
                      onClick={() => setIsOpen(false)}
                    >
                      Referrals
                    </ProfileMenuItem>
                    
                    {/* Admin controls section if applicable */}
                    {(isAdmin() || isSuperAdmin()) && (
                      <>
                        <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent my-1" />
                        <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Admin
                        </div>
                        {isAdmin() && (
                          <ProfileMenuItem 
                            to="/admin" 
                            onClick={() => setIsOpen(false)}
                          >
                            Admin Dashboard
                          </ProfileMenuItem>
                        )}
                        {isSuperAdmin() && (
                          <ProfileMenuItem 
                            to="/superadmin" 
                            onClick={() => setIsOpen(false)}
                          >
                            Super Admin Dashboard
                          </ProfileMenuItem>
                        )}
                      </>
                    )}
                    
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent my-1" />
                  </>
                ) : (
                  <>
                    {/* Login section */}
                    <div className="px-4 py-3 bg-dark-300/40 border-b border-brand-500/20">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setIsOpen(false)}
                          className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white py-2 px-4 rounded-md font-medium text-sm transition-all duration-300 flex items-center justify-center"
                        >
                          <ConnectWalletButton 
                            compact={true} 
                            className="py-0 px-0 bg-transparent border-none shadow-none hover:bg-transparent" 
                          />
                        </button>
                        
                        <button
                          onClick={() => {
                            window.location.href = "/login?auth=twitter";
                            setIsOpen(false);
                          }}
                          className="w-full bg-[#1DA1F2] hover:bg-[#1a94df] text-white py-2 px-4 rounded-md font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <FaTwitter className="w-4 h-4" />
                          Login with Twitter
                        </button>
                      </div>
                    </div>
                    
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent my-1" />
                  </>
                )}

                {/* Contests Section */}
                <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contests
                </div>
                <MenuItem to="/contests" onClick={() => setIsOpen(false)}>
                  Browse Contests
                </MenuItem>
                {user && (
                  <>
                    <MenuItem
                      to="/my-contests"
                      onClick={() => setIsOpen(false)}
                    >
                      My Contests
                    </MenuItem>
                    <MenuItem
                      to="/my-portfolios"
                      onClick={() => setIsOpen(false)}
                    >
                      My Portfolios
                    </MenuItem>
                  </>
                )}

                {/* Tokens Section */}
                <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                  Tokens
                </div>
                <MenuItem to="/tokens" onClick={() => setIsOpen(false)}>
                  Browse Tokens
                </MenuItem>
                <MenuItem
                  to="/tokens/whitelist"
                  onClick={() => setIsOpen(false)}
                >
                  Whitelist
                </MenuItem>

                {/* Rankings Section */}
                <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-2">
                  Rankings
                </div>
                <MenuItem
                  to="/rankings/global"
                  onClick={() => setIsOpen(false)}
                >
                  Global Rankings
                </MenuItem>
                <MenuItem
                  to="/rankings/performance"
                  onClick={() => setIsOpen(false)}
                >
                  Performance Rankings
                </MenuItem>

                {/* Disconnect button (if logged in) */}
                {user && (
                  <>
                    <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent my-1" />
                    <LogoutButton onClick={handleDisconnect} />
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
  children: React.ReactNode;
}> = ({ to, onClick, className = "", children }) => (
  <motion.div
    variants={{
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
    }}
  >
    <Link
      to={to}
      className={`block px-4 py-2 text-sm text-gray-300 hover:bg-brand-500/20 hover:backdrop-blur-md hover:text-white rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${className}`}
      onClick={onClick}
    >
      {children}
    </Link>
  </motion.div>
);

// Profile menu item with icon
const ProfileMenuItem: React.FC<{
  to: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick?: () => void;
  className?: string;
  badge?: number;
  children: React.ReactNode;
}> = ({ to, icon: Icon, onClick, className = "", badge, children }) => (
  <motion.div
    variants={{
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
    }}
  >
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-brand-500/20 hover:backdrop-blur-md hover:text-white rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${className}`}
      onClick={onClick}
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
}> = ({ onClick }) => (
  <motion.div
    variants={{
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
    }}
  >
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 hover:backdrop-blur-md hover:text-red-200 rounded-lg transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
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