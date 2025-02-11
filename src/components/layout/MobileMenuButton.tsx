import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { Link } from "react-router-dom";

interface MobileMenuButtonProps {
  className?: string;
}

export const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-2 flex items-center justify-center transition-colors group"
      >
        <div className="flex flex-col gap-1 items-center justify-center w-4">
          <motion.div
            animate={isOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-3 h-[2px] bg-gray-400 group-hover:bg-gray-300 transition-colors origin-center"
          />
          <motion.div
            animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="w-2 h-[2px] bg-gray-400 group-hover:bg-gray-300 transition-colors"
          />
          <motion.div
            animate={isOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-3 h-[2px] bg-gray-400 group-hover:bg-gray-300 transition-colors origin-center"
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
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-1 w-48 bg-dark-200/95 border border-dark-300 
                rounded shadow-lg shadow-black/50 overflow-hidden z-50 origin-top-right"
            >
              <div className="py-1">
                <Link
                  to="/contests"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-300/50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Contests
                </Link>
                <Link
                  to="/tokens"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-300/50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Tokens
                </Link>
                <Link
                  to="/rankings"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-300/50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Rankings
                </Link>
                <Link
                  to="/admin"
                  className="block px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-dark-300/50 transition-colors font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Admin
                </Link>
                <Link
                  to="/superadmin"
                  className="block px-4 py-2 text-sm bg-gradient-to-r from-red-500 to-brand-500 hover:from-red-400 hover:to-brand-400 text-transparent bg-clip-text font-bold tracking-wider"
                  onClick={() => setIsOpen(false)}
                >
                  SUPER
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
