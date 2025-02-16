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
          hover:bg-dark-300/20 active:bg-dark-300/30 rounded-full relative z-50`}
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
              className={`absolute right-0 mt-1 w-48 bg-dark-200/95 border border-brand-500/20 
                rounded-lg shadow-lg shadow-black/50 overflow-hidden z-50 origin-top-right backdrop-blur-sm
                ${isCompact ? "mt-0.5" : "mt-1"}`}
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
                <MenuItem to="/contests" onClick={() => setIsOpen(false)}>
                  Contests
                </MenuItem>
                <MenuItem to="/tokens" onClick={() => setIsOpen(false)}>
                  Tokens
                </MenuItem>
                <MenuItem to="/rankings" onClick={() => setIsOpen(false)}>
                  Rankings
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
      className={`block px-4 py-2 text-sm text-gray-300 hover:bg-dark-300/50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${className}`}
      onClick={onClick}
    >
      {children}
    </Link>
  </motion.div>
);
