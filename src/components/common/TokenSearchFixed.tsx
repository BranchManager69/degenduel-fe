import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../hooks/utilities/useDebounce";
import { SearchToken } from "../../types";

interface TokenSearchFixedProps {
  onSelectToken: (token: SearchToken) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  showPriceData?: boolean;
}

export const TokenSearchFixed: React.FC<TokenSearchFixedProps> = ({
  onSelectToken,
  placeholder = "Search by symbol, name, or address...",
  className = "",
  autoFocus = false,
  showPriceData = true,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchToken[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSuggestionClick(suggestions[selectedIndex]);
          }
          break;
        case "Escape":
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showSuggestions, suggestions, selectedIndex]);

  // Fetch with better limits and error handling
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSuggestions([]);
        setError(null);
        setSelectedIndex(-1);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Request MORE results and handle pagination
        const response = await fetch(
          `/api/tokens/search?search=${encodeURIComponent(debouncedQuery)}&limit=50`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to search: ${response.status}`);
        }
        
        const data = await response.json();
        setSuggestions(data.tokens || []);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Search failed:", error);
        setError("Search failed. Please try again.");
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (token: SearchToken) => {
    setQuery("");
    onSelectToken(token);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const formatPrice = (price: string | null): string => {
    if (!price) return 'N/A';
    const num = parseFloat(price);
    if (num < 0.01) return `$${num.toFixed(6)}`;
    if (num < 1) return `$${num.toFixed(4)}`;
    return `$${num.toFixed(2)}`;
  };

  const formatChange = (change: string | null): string => {
    if (!change) return '';
    const num = parseFloat(change);
    const isPositive = num >= 0;
    return `${isPositive ? '+' : ''}${num.toFixed(2)}%`;
  };

  // Render dropdown
  const renderDropdown = () => {
    if (!showSuggestions || (!query && !loading)) return null;

    return (
      <div
        className="absolute top-full left-0 right-0 mt-1 bg-dark-200/95 backdrop-blur-sm border border-emerald-500/30 rounded-lg shadow-2xl overflow-hidden z-50"
        style={{
          maxHeight: '400px',
        }}
      >
        {loading ? (
          <div className="p-4 text-gray-400 text-sm text-center">
            <div className="w-5 h-5 border-2 border-emerald-400/50 border-t-emerald-400 rounded-full animate-spin mx-auto mb-2"></div>
            Searching tokens...
          </div>
        ) : error ? (
          <div className="p-4 text-red-400 text-sm">{error}</div>
        ) : suggestions.length > 0 ? (
          <div className="overflow-y-auto max-h-[380px] scrollbar-thin scrollbar-thumb-emerald-500/30 scrollbar-track-dark-300/20">
            {suggestions.map((token, index) => (
              <button
                key={token.address}
                onClick={() => handleSuggestionClick(token)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full px-4 py-3 hover:bg-emerald-500/10 cursor-pointer transition-all border-b border-dark-300/50 last:border-0 flex items-center gap-3 ${
                  selectedIndex === index ? 'bg-emerald-500/20' : ''
                }`}
              >
                {token.image_url && (
                  <img
                    src={token.image_url}
                    alt={token.symbol || 'Token'}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-100">
                      {token.symbol || 'Unknown'}
                    </span>
                    {!token.is_active && (
                      <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 truncate">
                    {token.name || `${token.address.slice(0, 8)}...`}
                  </div>
                </div>

                {showPriceData && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-gray-100 font-medium">
                      {formatPrice(token.price?.toString())}
                    </div>
                    {token.change_24h && (
                      <div className={`text-xs ${
                        token.change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatChange(token.change_24h.toString())}
                      </div>
                    )}
                  </div>
                )}
              </button>
            ))}
            
            {suggestions.length === 50 && (
              <div className="p-3 text-center text-xs text-gray-400 border-t border-dark-300/50">
                Showing first 50 results. Type more to refine search.
              </div>
            )}
          </div>
        ) : query.length >= 2 ? (
          <div className="p-4 text-gray-400 text-sm text-center">
            No tokens found for "{query}"
          </div>
        ) : (
          <div className="p-4 text-gray-400 text-sm text-center">
            Type at least 2 characters to search
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setError(null);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full px-4 py-3 bg-dark-200/80 backdrop-blur-sm border border-emerald-500/30 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all text-sm"
        />
        
        {/* Search Icon */}
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      
      {renderDropdown()}
    </div>
  );
};