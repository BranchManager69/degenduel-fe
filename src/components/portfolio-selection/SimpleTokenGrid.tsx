import React, { useCallback, useEffect, useState } from "react";
import { SimpleTokenCard } from "./SimpleTokenCard";
import { WeightSelectionDrawer } from "./WeightSelectionDrawer";
import { Token } from "../../types";

interface SimpleTokenGridProps {
  tokens: Token[];
  selectedTokens: Map<string, number>;
  onTokenSelect: (contractAddress: string, weight: number) => void;
  searchQuery?: string;
}

export const SimpleTokenGrid: React.FC<SimpleTokenGridProps> = ({
  tokens,
  selectedTokens,
  onTokenSelect,
  searchQuery = '',
}) => {
  const [visibleCount, setVisibleCount] = useState(50); // Start with 50 tokens
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<Token | null>(null);
  
  // Filter tokens based on search
  const filteredTokens = React.useMemo(() => {
    if (!searchQuery.trim()) return tokens;
    
    const query = searchQuery.toLowerCase().trim();
    return tokens.filter((token) => {
      return (
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query) ||
        token.contractAddress.toLowerCase().includes(query)
      );
    });
  }, [tokens, searchQuery]);
  
  // Get visible tokens
  const visibleTokens = filteredTokens.slice(0, visibleCount);
  
  // Handle infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      
      // Load more when within 500px of bottom
      if (scrollTop + clientHeight >= scrollHeight - 500 && visibleCount < filteredTokens.length) {
        setVisibleCount(prev => Math.min(filteredTokens.length, prev + 50));
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredTokens.length, visibleCount]);
  
  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery]);
  
  const handleTokenToggle = useCallback((token: Token) => {
    if (selectedTokens.has(token.contractAddress)) {
      // Remove token
      onTokenSelect(token.contractAddress, 0);
    } else {
      // Add token with smart default weight
      const currentTotalWeight = Array.from(selectedTokens.values()).reduce((sum, w) => sum + w, 0);
      const remainingWeight = 100 - currentTotalWeight;
      
      let defaultWeight: number;
      if (remainingWeight >= 20) {
        defaultWeight = 20;
      } else if (remainingWeight >= 10) {
        defaultWeight = 10;
      } else if (remainingWeight > 0) {
        defaultWeight = remainingWeight;
      } else {
        // Portfolio full
        defaultWeight = 0;
      }
      
      onTokenSelect(token.contractAddress, defaultWeight);
    }
  }, [selectedTokens, onTokenSelect]);
  
  
  const handleEditWeight = useCallback((token: Token) => {
    setEditingToken(token);
    setDrawerOpen(true);
  }, []);
  
  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingToken(null);
  }, []);
  
  const handleDrawerWeightChange = useCallback((weight: number) => {
    if (editingToken) {
      onTokenSelect(editingToken.contractAddress, weight);
    }
  }, [editingToken, onTokenSelect]);
  
  const handleRemoveFromDrawer = useCallback(() => {
    if (editingToken) {
      onTokenSelect(editingToken.contractAddress, 0);
    }
  }, [editingToken, onTokenSelect]);
  
  // Calculate remaining weight for drawer
  const remainingWeight = 100 - Array.from(selectedTokens.values()).reduce((sum, w) => sum + w, 0);
  const editingTokenWeight = editingToken ? selectedTokens.get(editingToken.contractAddress) || 0 : 0;
  const availableForEditing = remainingWeight + editingTokenWeight;
  
  return (
    <div className="space-y-3">
      {/* Selected tokens first */}
      {Array.from(selectedTokens.entries()).map(([contractAddress, weight]) => {
        const token = tokens.find(t => t.contractAddress === contractAddress);
        if (!token) return null;
        
        return (
          <SimpleTokenCard
            key={contractAddress}
            token={token}
            isSelected={true}
            weight={weight}
            onSelect={() => handleTokenToggle(token)}
            onEditWeight={() => handleEditWeight(token)}
          />
        );
      })}
      
      {/* Divider if we have selected tokens */}
      {selectedTokens.size > 0 && (
        <div className="border-t border-dark-300/50 pt-3">
          <p className="text-xs text-gray-500 mb-3">Available Tokens</p>
        </div>
      )}
      
      {/* Unselected tokens */}
      {visibleTokens
        .filter(token => !selectedTokens.has(token.contractAddress))
        .map(token => (
          <SimpleTokenCard
            key={token.contractAddress}
            token={token}
            isSelected={false}
            weight={0}
            onSelect={() => handleTokenToggle(token)}
            onEditWeight={() => handleEditWeight(token)}
          />
        ))}
      
      {/* Loading indicator */}
      {visibleCount < filteredTokens.length && (
        <div className="py-8 text-center">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <div className="w-4 h-4 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full animate-spin"></div>
            <span className="text-sm">
              Showing {visibleCount} of {filteredTokens.length} tokens
            </span>
          </div>
        </div>
      )}
      
      {/* No results */}
      {filteredTokens.length === 0 && searchQuery && (
        <div className="py-12 text-center">
          <p className="text-gray-400">No tokens found for "{searchQuery}"</p>
        </div>
      )}
      
      {/* Weight Selection Drawer */}
      <WeightSelectionDrawer
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        token={editingToken}
        currentWeight={editingTokenWeight}
        remainingWeight={availableForEditing - editingTokenWeight}
        onWeightChange={handleDrawerWeightChange}
        onRemove={handleRemoveFromDrawer}
      />
    </div>
  );
};