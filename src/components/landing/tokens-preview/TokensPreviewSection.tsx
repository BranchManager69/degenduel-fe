import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Token } from "../../../types";
import { formatNumber } from "../../../utils/format";
import useTokenData from "../../../hooks/useTokenData";

interface TokensPreviewSectionProps {
  maxTokens?: number; // Maximum number of tokens to display
  initialLoading?: boolean; // For SSR/pre-loading states
}

export const TokensPreviewSection: React.FC<TokensPreviewSectionProps> = ({
  maxTokens = 6,
  initialLoading = false
}) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  
  // Use WebSocket-based token data hook
  const { tokens: wsTokens } = useTokenData("all");
  
  // Process tokens when WebSocket data is available
  useEffect(() => {
    try {
      if (wsTokens && wsTokens.length > 0) {
        setLoading(false);
        
        // Transform tokens to match our expected format
        const transformedTokens = wsTokens.map((token: any) => ({
          contractAddress: token.contractAddress || token.address,
          name: token.name,
          symbol: token.symbol,
          price: token.price?.toString() || "0",
          marketCap: token.marketCap?.toString() || "0",
          volume24h: token.volume24h?.toString() || "0",
          change24h: token.change24h?.toString() || "0",
          // Ensure status field is present and valid
          status: token.status || "active",
          liquidity: {
            usd: token.liquidity?.usd?.toString() || "0",
            base: token.liquidity?.base?.toString() || "0",
            quote: token.liquidity?.quote?.toString() || "0",
          },
          images: {
            imageUrl: token.imageUrl || token.image,
            headerImage: token.headerImage,
            openGraphImage: token.openGraphImage,
          },
          socials: token.socials,
          websites: token.websites,
          // Include any optional fields that might be used elsewhere
          changesJson: token.changesJson,
          transactionsJson: token.transactionsJson,
          baseToken: token.baseToken,
          quoteToken: token.quoteToken
        }));
        
        // Sort by market cap (descending) - explicitly typing as Token[]
        const sortedTokens: Token[] = transformedTokens.sort(
          (a, b) => Number(b.marketCap) - Number(a.marketCap)
        );
        
        // Take only the top N tokens
        setTokens(sortedTokens.slice(0, maxTokens));
      }
    } catch (err) {
      console.error("Failed to process tokens:", err);
      setError("Failed to process tokens data");
      setLoading(false);
    }
  }, [wsTokens, maxTokens]);

  // Helper function to get a color based on token symbol - for visual variety
  const getTokenColor = useCallback((symbol: string): string => {
    const colors: Record<string, string> = {
      SOL: '#14F195',
      BTC: '#F7931A',
      ETH: '#627EEA',
      DOGE: '#C3A634',
      ADA: '#0033AD',
      WIF: '#9945FF',
      PEPE: '#479F53',
      BONK: '#F2A900',
      SHIB: '#FFA409'
    };
    // Default to brand purple if no match
    return colors[symbol] || '#7F00FF';
  }, []);

  // Token Card Component - Simplified version of the TokenCard for landing page
  const TokenPreviewCard = useCallback(({ token }: { token: Token }) => {
    const isPositive = Number(token.change24h) >= 0;
    
    return (
      <motion.div
        className="group relative bg-dark-200/70 backdrop-blur-sm hover:bg-dark-200/80 transition-all duration-300 rounded-xl overflow-hidden shadow-lg border border-dark-300/60 hover:border-brand-400/30"
        whileHover={{ scale: 1.03, y: -5 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Cyberpunk corner cuts */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-brand-500/50 -translate-x-0.5 -translate-y-0.5 z-10"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/50 translate-x-0.5 -translate-y-0.5 z-10"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-brand-500/50 -translate-x-0.5 translate-y-0.5 z-10"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/50 translate-x-0.5 translate-y-0.5 z-10"></div>
        
        {/* Card content */}
        <div className="p-4">
          {/* Token header section */}
          <div className="flex items-center space-x-3 mb-3">
            {/* Token logo/color */}
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden shadow-md"
              style={{
                background: `linear-gradient(135deg, ${getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.8) 100%)`,
              }}
            >
              {token.images?.imageUrl ? (
                <img 
                  src={token.images.imageUrl} 
                  alt={token.symbol}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-white">{token.symbol.slice(0, 3)}</span>
              )}
            </div>
            
            {/* Token name and symbol */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white truncate group-hover:text-brand-400 transition-colors duration-300">{token.symbol}</h3>
              <p className="text-xs text-gray-400 truncate">{token.name}</p>
            </div>
            
            {/* 24h change */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {formatNumber(token.change24h)}%
            </div>
          </div>
          
          {/* Price information */}
          <div className="mb-2">
            <div className="text-lg font-mono text-white font-bold">${formatNumber(token.price)}</div>
          </div>
          
          {/* Additional metrics */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-dark-300/40 p-2 rounded-lg">
              <div className="text-xs text-gray-500 uppercase">Market Cap</div>
              <div className="text-sm text-white font-mono">${formatNumber(token.marketCap)}</div>
            </div>
            <div className="bg-dark-300/40 p-2 rounded-lg">
              <div className="text-xs text-gray-500 uppercase">24h Vol</div>
              <div className="text-sm text-white font-mono">${formatNumber(token.volume24h)}</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }, [getTokenColor]);

  // Container variants for animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  // Item variants for animation
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };
  
  // Cosmic effects component for background
  const CosmicEffects = (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute -top-[300px] right-[5%] w-[800px] h-[800px] bg-gradient-to-r from-brand-500/5 via-purple-500/10 to-transparent rounded-full blur-[120px] animate-pulse-slow" />
      <div
        className="absolute -bottom-[200px] left-[10%] w-[600px] h-[600px] bg-gradient-to-l from-brand-500/5 via-purple-500/10 to-transparent rounded-full blur-[100px] animate-pulse-slow"
        style={{ animationDelay: "-2s" }}
      />

      {/* Digital grid lines */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px),linear-gradient(90deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px)] bg-[length:50px_50px]"></div>
      </div>
      
      {/* Energy waves */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-500/5 to-transparent animate-scan-fast opacity-20"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent animate-scan-vertical opacity-20"
          style={{ animationDuration: "12s" }}
        />
      </div>
    </div>
  );

  // Loading state skeleton UI
  if (loading) {
    return (
      <section className="relative py-16">
        {CosmicEffects}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header with loading state */}
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 w-64 rounded animate-pulse bg-dark-300/20" />
          </div>
          
          {/* Grid of skeleton cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(maxTokens)].map((_, i) => (
              <div key={i} className="bg-dark-300/20 h-48 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }
  
  // Error state
  if (error) {
    return (
      <section className="relative py-16">
        {CosmicEffects}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center p-8 bg-dark-200/50 backdrop-blur-sm rounded-lg">
            <div className="text-red-500 animate-glitch">{error}</div>
          </div>
        </div>
      </section>
    );
  }
  
  // If no tokens are available
  if (tokens.length === 0) {
    return null;
  }

  return (
    <section className="relative py-16">
      {CosmicEffects}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with cosmic glow */}
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2
              className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-cyan-400 via-brand-400 to-brand-500 text-transparent bg-clip-text relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
              Top Tokens
              <span
                className="absolute -left-[1px] top-[1px] text-2xl font-bold font-cyber text-cyan-600/30 select-none"
              >
                Top Tokens
              </span>
            </h2>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="text-sm text-cyan-400 font-cyber">
                Live Market Data
              </span>
            </div>
          </div>
          
          {/* "View All" button */}
          <Link 
            to="/tokens" 
            className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 
              border border-brand-500/30 text-brand-400 transition-all duration-300 text-sm font-cyber"
          >
            View All
            <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
        
        {/* Tokens Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 [perspective:1500px]"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {tokens.map((token, index) => (
            <motion.div
              key={token.contractAddress}
              className="opacity-0 translate-x-full rotate-y-12 animate-contest-card-entrance"
              style={{
                animationDelay: `${index * 150}ms`,
                animationFillMode: "forwards",
                transformStyle: "preserve-3d",
              }}
              variants={itemVariants}
            >
              <Link to={`/tokens?symbol=${token.symbol}`}>
                <TokenPreviewCard token={token} />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};