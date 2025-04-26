import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TokenCard } from "./TokenCard";
import { Token } from "../../types";

interface TokensGridProps {
  tokens: Token[];
  selectedTokenSymbol?: string | null;
}

export const TokensGrid: React.FC<TokensGridProps> = ({ 
  tokens, 
  selectedTokenSymbol 
}) => {
  const selectedTokenRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to selected token when it's rendered
  useEffect(() => {
    if (selectedTokenSymbol && selectedTokenRef.current) {
      selectedTokenRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [selectedTokenSymbol, tokens]);

  return (
    <div className="relative">
      {/* Cyber grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-cyber-500/5"></div>
        
        {/* Horizontal grid lines */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div 
              key={`h-line-${i}`} 
              className="absolute w-full h-px bg-brand-500/10"
              style={{ top: `${i * 8}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/20 to-transparent animate-pulse-slow opacity-20"></div>
            </div>
          ))}
        </div>
        
        {/* Vertical grid lines */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div 
              key={`v-line-${i}`} 
              className="absolute h-full w-px bg-cyber-500/10"
              style={{ left: `${i * 8}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-500/20 to-transparent animate-pulse-slow opacity-20"></div>
            </div>
          ))}
        </div>
        
        {/* Animated scanning effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-500/5 to-transparent animate-scan-fast"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-500/5 to-transparent animate-cyber-scan"></div>
        </div>
      </div>

      {/* Actual grid container */}
      <div 
        ref={containerRef}
        className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 z-10"
      >
        <AnimatePresence>
          {tokens.map((token, index) => {
            const isSelected = token.symbol.toLowerCase() === selectedTokenSymbol?.toLowerCase();
            
            return (
              <motion.div 
                key={token.contractAddress}
                ref={isSelected ? selectedTokenRef : null}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: isSelected ? 1.05 : 1,
                  transition: { 
                    delay: index * 0.03, 
                    duration: 0.4,
                    ease: [0.25, 0.1, 0.25, 1.0]
                  }
                }}
                whileHover={{ 
                  z: 20,
                  scale: isSelected ? 1.08 : 1.03,
                  transition: { duration: 0.2 }
                }}
                className={`
                  relative
                  transition-all duration-300
                  ${isSelected ? 'z-20' : 'z-10'}
                `}
              >
                {/* Glow effect for selected tokens */}
                {isSelected && (
                  <motion.div 
                    className="absolute -inset-4 rounded-xl bg-gradient-to-br from-brand-400/30 via-brand-500/20 to-cyber-400/30 blur-md -z-10"
                    animate={{ 
                      opacity: [0.5, 0.7, 0.5],
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  />
                )}

                {/* Card border effect */}
                <div className={`
                  absolute inset-0 rounded-xl overflow-hidden
                  ${isSelected ? 'border border-brand-500/70' : 'border border-dark-300/50'}
                `}>
                  {/* Animated border for selected items */}
                  {isSelected && (
                    <>
                      <div className="absolute inset-0 border border-brand-500/10 rounded-xl"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-scan-fast"></div>
                      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-500/90 to-transparent transform animate-scan-fast"></div>
                      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyber-500/90 to-transparent transform animate-scan-fast delay-300"></div>
                    </>
                  )}
                </div>

                <motion.div 
                  className={`
                    relative rounded-xl overflow-hidden
                    ${isSelected ? 'shadow-lg shadow-brand-500/20' : 'shadow-sm'}
                  `}
                >
                  <TokenCard token={token} />
                </motion.div>
                
                {/* Indicator symbol for selected tokens */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-cyber-500 flex items-center justify-center text-white text-xs font-bold shadow-lg z-30">
                    <motion.div
                      animate={{ opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ✦
                    </motion.div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
