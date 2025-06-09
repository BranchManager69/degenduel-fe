import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Token, TokenHelpers } from '../../types';
import { formatNumber } from '../../utils/format';
import { CopyToClipboard } from '../common/CopyToClipboard';

interface TokenDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
}

export const TokenDetailModal: React.FC<TokenDetailModalProps> = ({
  isOpen,
  onClose,
  token
}) => {
  // Close on ESC key press
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!token) return null;

  // Get the best available image
  const imageUrl = token.images?.headerImage || 
                   token.images?.openGraphImage || 
                   token.images?.imageUrl || 
                   null;

  // Calculate a color scheme based on token symbol 
  // This creates a pseudo-unique color for each token
  const getTokenColor = (symbol: string) => {
    // Simple hash function to get a consistent number from token symbol
    const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Use hash to determine color position between brand and cyber colors
    const position = hash % 100;
    
    if (position < 30) return 'from-brand-500 to-brand-600'; // Brand heavy
    if (position < 60) return 'from-brand-500 to-cyber-500'; // Mixed
    return 'from-cyber-500 to-cyber-600'; // Cyber heavy
  };

  const tokenColor = getTokenColor(token.symbol);

  // Create price trend indicator
  const priceDirection = Number(token.change24h) >= 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={handleBackdropClick}
        >
          {/* Background cyber grid */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Horizontal grid lines */}
            {[...Array(20)].map((_, i) => (
              <div 
                key={`h-line-${i}`} 
                className="absolute w-full h-px bg-brand-500/5"
                style={{ top: `${i * 5}%` }}
              />
            ))}
            
            {/* Vertical grid lines */}
            {[...Array(20)].map((_, i) => (
              <div 
                key={`v-line-${i}`} 
                className="absolute h-full w-px bg-cyber-500/5"
                style={{ left: `${i * 5}%` }}
              />
            ))}
            
            {/* Animated scan lines */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/5 to-transparent transform animate-scan-fast"></div>
            <div className="absolute inset-x-0 h-full bg-gradient-to-b from-transparent via-cyber-500/5 to-transparent transform animate-cyber-scan"></div>
          </div>
          
          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              duration: 0.4,
              ease: [0.19, 1.0, 0.22, 1.0],
            }}
            className="relative w-full max-w-2xl overflow-hidden z-10"
          >
            {/* Outer glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-brand-400/30 via-transparent to-cyber-400/30 blur-md rounded-xl"></div>
            
            {/* Modal with cyber styling */}
            <div className="relative bg-dark-100/90 backdrop-blur-sm rounded-xl overflow-hidden border border-dark-300 shadow-xl shadow-dark-900/50">
              {/* Angular cutout corners */}
              <div className="absolute top-0 left-0 w-8 h-8 bg-dark-100/90 transform translate-x-[-55%] translate-y-[-55%] rotate-45 border-r border-brand-500/50"></div>
              <div className="absolute top-0 right-0 w-8 h-8 bg-dark-100/90 transform translate-x-[55%] translate-y-[-55%] rotate-45 border-l border-cyber-500/50"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 bg-dark-100/90 transform translate-x-[-55%] translate-y-[55%] rotate-45 border-t border-brand-500/50"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 bg-dark-100/90 transform translate-x-[55%] translate-y-[55%] rotate-45 border-t border-cyber-500/50"></div>
              
              {/* Top border line */}
              <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-scan-fast"></div>
              </div>
              
              {/* Bottom border line */}
              <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-cyber-500/70 to-transparent">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-scan-fast"></div>
              </div>
  
              {/* Header with image and cyberpunk styling */}
              <div className="relative h-56 overflow-hidden">
                {/* Image background with cyber overlay */}
                {imageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${imageUrl})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-dark-900/60 backdrop-blur-sm"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-dark-900/20 via-transparent to-dark-900/20"></div>
                    
                    {/* Scanlines effect */}
                    <div className="absolute inset-0" style={{ 
                      backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)`,
                      backgroundSize: '100% 2px',
                      opacity: 0.3
                    }}></div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-dark-800 to-dark-900">
                    <div className="h-full flex items-center justify-center">
                      <span className="font-display text-7xl text-transparent bg-clip-text bg-gradient-to-br from-brand-400/40 to-cyber-400/40 animate-pulse-slow">
                        {token.symbol}
                      </span>
                    </div>
                    
                    {/* Digital circuit pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(153, 51, 255, 0.5)" strokeWidth="0.5"/>
                          </pattern>
                          <pattern id="circuit" width="80" height="80" patternUnits="userSpaceOnUse">
                            <circle cx="40" cy="40" r="2" fill="rgba(0, 225, 255, 0.5)"/>
                            <path d="M 40 0 L 40 38 M 0 40 L 38 40 M 42 40 L 80 40 M 40 42 L 40 80" fill="none" stroke="rgba(0, 225, 255, 0.5)" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                        <rect width="100%" height="100%" fill="url(#circuit)" />
                      </svg>
                    </div>
                  </div>
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-100/90 via-dark-100/60 to-transparent" />
                
                {/* Close button with cyber styling */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 bg-dark-300/70 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-all z-10 overflow-hidden"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)' }}
                >
                  <span className="transform translate-y-[-1px]">&times;</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-cyber-500/20 opacity-0 hover:opacity-100 transition-opacity"></div>
                </button>
                
                {/* Digital price display with cyber styling */}
                <div className="absolute top-6 right-16 z-10">
                  <div className={`
                    px-4 py-2 
                    backdrop-blur-md 
                    border 
                    shadow-lg
                    ${priceDirection ? 
                      'bg-green-500/10 border-green-500/30 text-green-300' : 
                      'bg-red-500/10 border-red-500/30 text-red-300'}
                  `}
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 90% 100%, 0 100%)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-scan-fast"></div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-xs uppercase">Price</div>
                      <div className="font-numbers text-xl font-bold">${formatNumber(TokenHelpers.getPrice(token))}</div>
                    </div>
                    
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-xs ${priceDirection ? 'text-green-300' : 'text-red-300'}`}>
                        {priceDirection ? '▲' : '▼'}
                      </span>
                      <span className="font-numbers text-sm">
                        {formatNumber(Math.abs(Number(token.change24h)))}%
                      </span>
                      
                      {/* Animated indicator */}
                      <motion.div 
                        className={`w-1.5 h-1.5 rounded-full ml-1 ${priceDirection ? 'bg-green-400' : 'bg-red-400'}`}
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Token symbol and name with cyber styling */}
                <div className="absolute bottom-4 left-6 right-6 z-10">
                  <div className="flex flex-col">
                    <div className="relative inline-block">
                      <h3 className="font-display text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/80 drop-shadow-lg tracking-wide">
                        {token.symbol}
                      </h3>
                      <div 
                        className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-500 to-cyber-500"
                        style={{ clipPath: 'polygon(0 0, 100% 15%, 100% 85%, 0% 100%)' }}
                      >
                        <motion.div 
                          className="absolute inset-0 bg-white/50"
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </div>
                    <p className="text-white/70 text-lg">{token.name}</p>
                  </div>
                </div>
              </div>
              
              {/* Content body with cyber grid styling */}
              <div className="relative p-6 overflow-hidden">
                {/* Background grid pattern */}
                <div className="absolute inset-0 opacity-5">
                  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="microGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="0.3"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#microGrid)" />
                  </svg>
                </div>
                
                {/* Stats grid with cyber styling */}
                <div className="relative grid grid-cols-3 gap-4 mb-6 z-10">
                  {/* Market Cap */}
                  <div 
                    className="bg-dark-200/70 backdrop-blur-sm rounded p-4 border border-dark-300 hover:border-brand-400/30 transition-all duration-300 group overflow-hidden"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 5% 100%, 0 95%)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-0 left-0 w-full h-px bg-brand-500/30"></div>
                    
                    <div className="relative">
                      <span className="font-mono text-xs text-brand-400/70 uppercase tracking-wider transition-colors duration-300 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-brand-400/70 rounded-full"></span>
                        MCAP
                      </span>
                      <p className="font-numbers text-xl font-bold text-white/90 mt-1 transition-colors duration-300">
                        ${formatNumber(TokenHelpers.getMarketCap(token))}
                      </p>
                    </div>
                  </div>
                  
                  {/* 24h Volume */}
                  <div 
                    className="bg-dark-200/70 backdrop-blur-sm rounded p-4 border border-dark-300 hover:border-cyber-400/30 transition-all duration-300 group overflow-hidden"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 5% 100%, 0 95%)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-0 left-0 w-full h-px bg-cyber-500/30"></div>
                    
                    <div className="relative">
                      <span className="font-mono text-xs text-cyber-400/70 uppercase tracking-wider transition-colors duration-300 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-cyber-400/70 rounded-full"></span>
                        VOLUME
                      </span>
                      <p className="font-numbers text-xl font-bold text-white/90 mt-1 transition-colors duration-300">
                        ${formatNumber(TokenHelpers.getVolume(token))}
                      </p>
                    </div>
                  </div>
                  
                  {/* Liquidity */}
                  <div 
                    className="bg-dark-200/70 backdrop-blur-sm rounded p-4 border border-dark-300 hover:border-white/20 transition-all duration-300 group overflow-hidden"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 5% 100%, 0 95%)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-0 left-0 w-full h-px bg-white/20"></div>
                    
                    <div className="relative">
                      <span className="font-mono text-xs text-white/50 uppercase tracking-wider transition-colors duration-300 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-white/50 rounded-full"></span>
                        LIQUIDITY
                      </span>
                      <p className="font-numbers text-xl font-bold text-white/90 mt-1 transition-colors duration-300">
                        ${formatNumber(token.liquidity || 0)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Contract Address with terminal styling */}
                <div className="mb-6 relative">
                  <div className="absolute -top-1 left-4 px-2 py-0.5 bg-dark-200 text-xs font-mono text-brand-400 z-10">
                    CONTRACT
                  </div>
                  
                  <CopyToClipboard text={TokenHelpers.getAddress(token)}>
                    <div 
                      className="relative bg-dark-200/80 backdrop-blur-sm rounded-sm p-4 border border-dark-300 hover:border-brand-400/30 transition-all duration-300 group cursor-pointer overflow-hidden pt-5"
                    >
                      {/* Terminal scan effect */}
                      <div className="absolute inset-0 pointer-events-none">
                        <motion.div 
                          className="absolute left-0 right-0 h-px bg-brand-400/20"
                          animate={{ top: ['0%', '100%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                      </div>
                      
                      {/* Copy icon */}
                      <span className="absolute top-4 right-4 text-white/30 group-hover:text-brand-400 transition-colors duration-300">
                        📋
                      </span>
                      
                      {/* Address text */}
                      <p className="font-mono text-sm text-white/70 group-hover:text-white transition-colors duration-300 break-all">
                        {token.contractAddress}
                      </p>
                      
                      {/* Scan animation */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 animate-scan-fast"></div>
                    </div>
                  </CopyToClipboard>
                </div>
                
                {/* Social Links with cyber styling */}
                {token.socials && (
                  <div className="flex gap-2 mb-6">
                    {token.socials?.twitter && (
                      <a
                        href={token.socials.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3 bg-dark-200/80 rounded border border-dark-300 hover:border-brand-400/30 transition-all duration-300 group flex items-center justify-center gap-2 overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-dark-100 transform rotate-45 border-l border-brand-500/20"></div>
                        <span className="text-white/50 group-hover:text-brand-400 transition-colors duration-300">
                          𝕏
                        </span>
                        <span className="text-white/70 group-hover:text-white transition-colors duration-300 font-mono">
                          Twitter
                        </span>
                      </a>
                    )}
                    
                    {token.socials?.telegram && (
                      <a
                        href={token.socials.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3 bg-dark-200/80 rounded border border-dark-300 hover:border-brand-400/30 transition-all duration-300 group flex items-center justify-center gap-2 overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-dark-100 transform rotate-45 border-l border-brand-500/20"></div>
                        <span className="text-white/50 group-hover:text-brand-400 transition-colors duration-300">
                          ✈️
                        </span>
                        <span className="text-white/70 group-hover:text-white transition-colors duration-300 font-mono">
                          Telegram
                        </span>
                      </a>
                    )}
                    
                    {token.socials?.discord && (
                      <a
                        href={token.socials.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3 bg-dark-200/80 rounded border border-dark-300 hover:border-brand-400/30 transition-all duration-300 group flex items-center justify-center gap-2 overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-dark-100 transform rotate-45 border-l border-brand-500/20"></div>
                        <span className="text-white/50 group-hover:text-brand-400 transition-colors duration-300">
                          💬
                        </span>
                        <span className="text-white/70 group-hover:text-white transition-colors duration-300 font-mono">
                          Discord
                        </span>
                      </a>
                    )}
                  </div>
                )}
                
                {/* Bottom action buttons with cyber styling */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-dark-200/80 rounded border border-dark-300 hover:border-cyber-400/30 transition-all duration-300 text-white/70 hover:text-white group relative overflow-hidden"
                    style={{ clipPath: 'polygon(0 0, 100% 0, 98% 100%, 0 100%)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-0 left-0 w-full h-px bg-cyber-500/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="relative font-mono uppercase tracking-wider">Close</span>
                  </button>
                  
                  {token.websites && token.websites.length > 0 && typeof token.websites[0] === 'string' && (
                    <a
                      href={token.websites[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 bg-dark-200/80 border border-dark-300 hover:border-brand-400/30 transition-all duration-300 text-center group relative overflow-hidden"
                      style={{ clipPath: 'polygon(2% 0, 100% 0, 100% 100%, 0% 100%)' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute top-0 left-0 w-full h-px bg-brand-500/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative font-mono text-brand-400 group-hover:text-brand-300 uppercase tracking-wider">
                        Visit Website
                      </span>
                      <span className="text-brand-400/60 ml-2">→</span>
                    </a>
                  )}
                </div>
                
                {/* Token-specific color animated bottom accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden">
                  <div className={`absolute inset-x-0 bottom-0 h-full bg-gradient-to-r ${tokenColor}`}>
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};