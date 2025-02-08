import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUser, FaUserFriends, FaSignOutAlt, FaCog, FaChartLine } from 'react-icons/fa';
import { User } from '../../types';

interface UserMenuProps {
  user: User;
  onDisconnect: () => void;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ 
  user, 
  onDisconnect,
  isAdmin,
  isSuperAdmin
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { 
      label: 'Profile',
      icon: FaUser,
      to: '/me'
    },
    {
      label: 'Referrals',
      icon: FaUserFriends,
      to: '/referrals'
    },
    ...(isAdmin ? [{
      label: 'Admin',
      icon: FaCog,
      to: '/admin'
    }] : []),
    ...(isSuperAdmin ? [{
      label: 'Super Admin',
      icon: FaChartLine,
      to: '/superadmin'
    }] : [])
  ];

  return (
    <div className="relative">
      {/* Username Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-dark-300/50 hover:bg-dark-300/80 rounded-lg border border-brand-500/30 text-sm font-medium text-gray-200 flex items-center gap-2 transition-all duration-300"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
        <span className="truncate max-w-[120px] text-xs">{user.nickname || user.wallet_address}</span>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute right-0 mt-2 w-48 bg-dark-200/95 backdrop-blur-lg border border-brand-500/30 rounded-lg shadow-xl overflow-hidden z-50"
            >
              <div className="p-2 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-brand-500/20 rounded-lg transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-brand-400" />
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onDisconnect();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}; 