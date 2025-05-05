// src/components/layout/LivePriceTicker.tsx

import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTokenData } from "../../hooks/data/legacy/useTokenData";
import { TokenData } from "../../types";

interface Props {
  isCompact?: boolean;
  significantChangeThreshold?: number; // Percentage threshold for showing tokens (default 3%)
  maxTokens?: number; // Maximum number of tokens to display
}

export const LivePriceTicker: React.FC<Props> = ({
  isCompact = false,
  significantChangeThreshold = 3,
  maxTokens = 15,
}) => {
  const { tokens, isConnected } = useTokenData("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [significantChanges, setSignificantChanges] = useState<TokenData[]>([]);

  // Process tokens for significant price changes
  useEffect(() => {
    if (!tokens || tokens.length === 0) return;

    // Filter for tokens with significant price changes
    const filtered = tokens.filter(token => 
      Math.abs(parseFloat(token.change24h)) >= significantChangeThreshold
    );
    
    // Sort by absolute change percentage (highest first)
    const sorted = [...filtered].sort((a, b) => 
      Math.abs(parseFloat(b.change24h)) - Math.abs(parseFloat(a.change24h))
    );
    
    // Take top N
    setSignificantChanges(sorted.slice(0, maxTokens));
  }, [tokens, significantChangeThreshold, maxTokens]);

  // Clone items for infinite scroll
  useEffect(() => {
    if (!containerRef.current || !contentRef.current || significantChanges.length === 0) return;

    // Remove any existing clones first
    const existingClones = containerRef.current.querySelectorAll(".clone");
    existingClones.forEach((clone) => clone.remove());

    // Clone items to create seamless loop
    const content = contentRef.current;
    const clone = content.cloneNode(true) as HTMLDivElement;
    clone.classList.add("clone"); // Add class to identify clones
    containerRef.current.appendChild(clone);

    return () => {
      // Cleanup clones when component unmounts or deps change
      if (containerRef.current) {
        const clones = containerRef.current.querySelectorAll(".clone");
        clones.forEach((clone) => clone.remove());
      }
    };
  }, [significantChanges]);

  // If no significant changes or not connected, don't render
  if (!isConnected || significantChanges.length === 0) {
    return null;
  }

  // Price Ticker
  return (
    <div className="relative w-full overflow-hidden block">
      {/* Dark base layer */}
      <div className="absolute inset-0 bg-dark-200/60" />

      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/40 via-brand-500/20 to-brand-900/40" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,0,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine opacity-30" />
      </div>

      {/* Animated scan effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(0,225,255,0.05)_50%,transparent_100%)] animate-scan-fast opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,225,255,0.05)_50%,transparent_100%)] animate-scan-vertical opacity-30" />
      </div>

      {/* Glowing borders with gradient */}
      <div className="absolute inset-x-0 top-0">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-cyber-400/50 to-transparent" />
        <div className="h-[2px] bg-gradient-to-b from-cyber-400/30 to-transparent blur-sm" />
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-cyber-400/50 to-transparent" />
        <div className="h-[2px] bg-gradient-to-b from-cyber-400/30 to-transparent blur-sm" />
      </div>

      {/* Content container */}
      <div className={`relative transition-all duration-200 ease-out ${isCompact ? "h-6" : "h-8"}`}>
        <div className="h-full overflow-hidden whitespace-nowrap">
          {/* Parent Container */}
          <div
            ref={containerRef}
            className="inline-flex items-center w-full"
            style={{
              animation: "ticker 20s linear infinite",
              animationPlayState: isPaused ? "paused" : "running",
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Content Container */}
            <div
              ref={contentRef}
              className={`inline-flex items-center space-x-8 px-4 flex-shrink-0 transition-all duration-200 ease-out
                ${isCompact ? "text-xs" : "text-sm"}`}
            >
              {significantChanges.map(token => (
                <Link
                  key={token.symbol}
                  to={`/tokens?symbol=${token.symbol}`}
                  className="group/item relative inline-flex items-center space-x-2 hover:bg-dark-300/50 px-2 py-1 rounded transition-all duration-300"
                  title={`${token.name} (${token.symbol})`}
                >
                  {/* Hover background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-400/0 via-cyber-400/5 to-cyber-400/0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 animate-data-stream rounded" />
                  
                  {/* Token Symbol */}
                  <span className="font-mono text-cyber-400 group-hover/item:text-cyber-300 font-medium transition-colors">
                    {token.symbol}
                  </span>
                  
                  {/* Token Price */}
                  <span className="font-medium text-gray-300 group-hover/item:text-gray-200 transition-colors">
                    ${parseFloat(token.price).toFixed(4)}
                  </span>
                  
                  {/* Percentage Change */}
                  <span 
                    className={`flex items-center space-x-1 transition-colors
                      ${parseFloat(token.change24h) > 0 
                        ? 'text-green-400 group-hover/item:text-green-300' 
                        : 'text-red-400 group-hover/item:text-red-300'}`}
                  >
                    {/* Trend Arrow */}
                    <span className="font-bold">
                      {parseFloat(token.change24h) > 0 ? '▲' : '▼'}
                    </span>
                    
                    {/* Percentage Value */}
                    <span className={`
                      ${Math.abs(parseFloat(token.change24h)) > 20 ? 'animate-pulse font-bold' : ''}
                    `}>
                      {Math.abs(parseFloat(token.change24h)).toFixed(2)}%
                    </span>
                  </span>
                  
                  {/* Volume Indicator (optional) */}
                  {parseFloat(token.volume24h) > 1000000 && (
                    <div className="px-1.5 py-0.5 bg-dark-300/70 rounded-sm text-xs font-mono text-gray-400">
                      V:${(parseFloat(token.volume24h) / 1000000).toFixed(1)}M
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePriceTicker;