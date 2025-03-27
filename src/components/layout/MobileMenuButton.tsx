import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { Link } from "react-router-dom";

import { useStore } from "../../store/useStore";

interface MobileMenuButtonProps {
  className?: string;
  isCompact?: boolean;
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({
  className = "",
  isCompact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // Use store directly to check user authentication
  const { user } = useStore();

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

                {/* Divider before admin sections */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent my-1" />

                {/* (Admin sections moved to UserMenu) */}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

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
