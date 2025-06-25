import React, { useEffect, useRef, useState } from "react";
import { Token, TokenHelpers } from "../../types";
import { PortfolioTokenCard } from "./PortfolioTokenCard";

interface CreativePortfolioGridProps {
  tokens: Token[];
  selectedTokens: Map<string, number>; // contractAddress -> weight
  onTokenSelect: (contractAddress: string, weight: number) => void;
  onWeightChange?: (contractAddress: string, weight: number) => void;
}

/**
 * CreativePortfolioGrid - Enhanced version of CreativeTokensGrid for portfolio selection
 */
export const CreativePortfolioGrid: React.FC<CreativePortfolioGridProps> = React.memo(({ 
  tokens, 
  selectedTokens,
  onTokenSelect,
  onWeightChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track which tokens have already been animated
  const [animatedTokens, setAnimatedTokens] = useState<Set<string>>(new Set());

  // Update animated tokens when new tokens arrive
  useEffect(() => {
    const newAnimatedTokens = new Set<string>();
    tokens.forEach(token => {
      const key = token.contractAddress || token.address || token.symbol;
      if (key) {
        newAnimatedTokens.add(key);
      }
    });
    
    setTimeout(() => {
      setAnimatedTokens(newAnimatedTokens);
    }, 1000);
  }, [tokens]);

  // Just use all tokens directly
  const allTokens = tokens;

  return (
    <div className="relative">
      {/* CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes bannerScan {
            0%, 100% { object-position: center center; }
            25% { object-position: left center; }
            50% { object-position: center center; }
            75% { object-position: right center; }
          }
          
          @keyframes fadeUpIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .token-card-animation {
            animation: fadeUpIn 0.6s ease-out forwards;
            opacity: 0;
            will-change: transform, opacity;
          }
          
          .perspective-1000 { perspective: 1000px; }
          .transform-style-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; }
          .rotate-y-180 { transform: rotateY(180deg); }
        `
      }} />

      {/* Main grid container - All tokens use PortfolioTokenCard */}
      <div ref={containerRef} className="relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allTokens.map((token, index) => {
            const contractAddress = TokenHelpers.getAddress(token);
            const isSelected = selectedTokens.has(contractAddress);
            const currentWeight = selectedTokens.get(contractAddress) || 0;
            
            return (
              <PortfolioTokenCard 
                key={token.contractAddress || token.address} 
                token={token} 
                index={index}
                isSelected={isSelected}
                currentWeight={currentWeight}
                animatedTokens={animatedTokens}
                onTokenSelect={onTokenSelect}
                onWeightChange={onWeightChange}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

CreativePortfolioGrid.displayName = 'CreativePortfolioGrid';