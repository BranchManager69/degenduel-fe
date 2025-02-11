import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { Link } from "react-router-dom";

interface MobileMenuButtonProps {
  className?: string;
  isCompact?: boolean;
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({
  className = "",
  isCompact = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group
          ${isCompact ? "h-6 px-1.5" : "h-8 px-2"}
          hover:bg-dark-300/20 active:bg-dark-300/30 rounded-full`}
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
            } h-[2px] bg-gray-400 group-hover:bg-gray-300 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center`}
          />
          <motion.div
            animate={
              isOpen ? { opacity: 0, scale: 0 } : { opacity: 1, scale: 1 }
            }
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className={`${
              isCompact ? "w-2" : "w-2.5"
            } h-[2px] bg-gray-400 group-hover:bg-gray-300 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
          />
          <motion.div
            animate={isOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className={`${
              isCompact ? "w-2.5" : "w-3"
            } h-[2px] bg-gray-400 group-hover:bg-gray-300 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center`}
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`absolute right-0 mt-1 w-48 bg-dark-200/95 border border-dark-300 
                rounded-lg shadow-lg shadow-black/50 overflow-hidden z-50 origin-top-right backdrop-blur-sm
                ${isCompact ? "mt-0.5" : "mt-1"}`}
            >
              <motion.div
                className="py-1"
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
                <MenuItem to="/contests" onClick={() => setIsOpen(false)}>
                  Contests
                </MenuItem>
                <MenuItem to="/tokens" onClick={() => setIsOpen(false)}>
                  Tokens
                </MenuItem>
                <MenuItem to="/rankings" onClick={() => setIsOpen(false)}>
                  Rankings
                </MenuItem>
                <MenuItem
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="text-red-400 hover:text-red-300 font-medium"
                >
                  Admin
                </MenuItem>
                <MenuItem
                  to="/superadmin"
                  onClick={() => setIsOpen(false)}
                  className="bg-gradient-to-r from-red-500 to-brand-500 hover:from-red-400 hover:to-brand-400 text-transparent bg-clip-text font-bold tracking-wider"
                >
                  SUPER
                </MenuItem>
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
      className={`block px-4 py-2 text-sm text-gray-300 hover:bg-dark-300/50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${className}`}
      onClick={onClick}
    >
      {children}
    </Link>
  </motion.div>
);
