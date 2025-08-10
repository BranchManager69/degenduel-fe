import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../hooks/utilities/useDebounce";
import { SearchToken } from "../../types";

interface TokenSearchProps {
  onSelectToken: (token: SearchToken) => void;
  placeholder?: string;
  className?: string;
  variant?: "default" | "minimal" | "modern";
  autoFocus?: boolean;
  showPriceData?: boolean;
  onDropdownOpen?: () => void;
  onDropdownClose?: () => void;
  clearOnSelect?: boolean;
}

export const TokenSearch: React.FC<TokenSearchProps> = ({
  onSelectToken,
  placeholder = "Search by symbol, name, or address...",
  className = "",
  variant = "default",
  autoFocus = false,
  showPriceData = true,
  onDropdownOpen,
  onDropdownClose,
  clearOnSelect = false,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchToken[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Wrap setShowSuggestions to trigger callbacks
  const updateShowSuggestions = (show: boolean) => {
    setShowSuggestions(show);
    if (show && onDropdownOpen) {
      onDropdownOpen();
    } else if (!show && onDropdownClose) {
      onDropdownClose();
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 150);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSuggestions([]);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Note: The search endpoint now returns only active tokens by default
        // To include inactive tokens in the future, add &include_inactive=true to the query string
        const response = await fetch(
          `/api/tokens/search?search=${encodeURIComponent(debouncedQuery)}&limit=10`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to search tokens: ${response.status}`);
        }
        
        const data = await response.json();
        // Sort tokens by volume (24h volume) in descending order
        const sortedTokens = (data.tokens || []).sort((a: SearchToken, b: SearchToken) => {
          const volumeA = parseFloat(String(a.volume_24h || 0));
          const volumeB = parseFloat(String(b.volume_24h || 0));
          return volumeB - volumeA; // Descending order (highest volume first)
        });
        setSuggestions(sortedTokens);
      } catch (error) {
        console.error("Failed to fetch token suggestions:", error);
        setError("Failed to search tokens. Please try again.");
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        updateShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (token: SearchToken) => {
    if (clearOnSelect) {
      setQuery("");
    } else {
      setQuery(token.symbol || token.address.slice(0, 8));
    }
    onSelectToken(token);
    updateShowSuggestions(false);
  };

  const formatMarketCap = (marketCap: string | number | null): string => {
    if (!marketCap) return 'N/A';
    const num = typeof marketCap === 'string' ? parseFloat(marketCap) : marketCap;
    if (isNaN(num)) return 'N/A';
    
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(1)}B`;
    } else if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(1)}M`;
    } else if (num >= 1_000) {
      return `$${Math.round(num / 1_000)}K`;
    } else {
      return `$${num.toFixed(0)}`;
    }
  };

  const formatVolume = (volume: string | number | null): string => {
    if (!volume) return 'N/A';
    const num = typeof volume === 'string' ? parseFloat(volume) : volume;
    if (isNaN(num)) return 'N/A';
    
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(1)}B`;
    } else if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(1)}M`;
    } else if (num >= 1_000) {
      return `$${Math.round(num / 1_000)}K`;
    } else {
      return `$${num.toFixed(0)}`;
    }
  };


  const getInputClass = () => {
    switch (variant) {
      case "minimal":
        return "w-full px-3 py-1.5 bg-dark-300/30 border border-dark-300/50 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400 text-sm transition-colors appearance-none";
      case "modern":
        return "w-full px-4 py-2 bg-dark-200/80 backdrop-blur-sm border border-dark-400/50 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400/20 transition-colors text-sm appearance-none";
      default:
        return "w-full px-4 py-2 bg-dark-300/50 border border-dark-300/50 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-400 transition-colors appearance-none";
    }
  };

  const getSuggestionsContainerClass = () => {
    // Use absolute positioning to attach to input
    const baseClass = "absolute z-[99999] w-full";
    switch (variant) {
      case "minimal":
        return `${baseClass} mt-1 bg-dark-200/90 backdrop-blur-md border border-dark-300/30 rounded-md shadow-lg`;
      case "modern":
        return `${baseClass} mt-1 bg-dark-200/80 backdrop-blur-md rounded-md shadow-xl border border-dark-300/20`;
      default:
        return `${baseClass} mt-1 bg-dark-200 border border-dark-300/30 rounded-lg shadow-xl`;
    }
  };

  const renderSuggestions = () => {
    if (loading) {
      return <div className="p-3 text-gray-400 text-sm">Searching tokens...</div>;
    }

    if (error) {
      return <div className="p-3 text-red-400 text-sm">{error}</div>;
    }

    if (suggestions.length > 0) {
      return (
        <ul className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-300 scrollbar-track-dark-200">
          {suggestions.map((token) => (
            <li
              key={token.address}
              onClick={() => handleSuggestionClick(token)}
              className={`p-3 hover:bg-dark-300/50 cursor-pointer transition-all border-b border-dark-300/50 last:border-0 flex items-center gap-3 ${
                !token.is_active 
                  ? "opacity-50 hover:opacity-70" 
                  : ""
              }`}
            >
              {/* Token Image */}
              {token.image_url ? (
                <img
                  src={token.image_url}
                  alt={token.symbol || 'Token'}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-10 h-10 bg-dark-400/30 rounded-lg flex-shrink-0" />
              )}
              
              {/* Token Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{token.symbol || 'Unknown'}</span>
                  {!token.is_active && (
                    <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                      INACTIVE
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  {token.name ? 
                    (token.name.length > 25 ? `${token.name.slice(0, 25)}...` : token.name) :
                    `${token.address.slice(0, 8)}...`
                  }
                </div>
              </div>
              
              {/* Price Info */}
              {showPriceData && (
                <div className="text-right">
                  <div className="text-sm text-white">
                    {formatMarketCap(token.market_cap)} MC
                  </div>
                  <div className="text-xs text-gray-400">
                    Vol: {formatVolume(token.volume_24h)}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      );
    }

    if (query.length >= 2) {
      return <div className="p-3 text-gray-400 text-sm">No tokens found</div>;
    }

    return (
      <div className="p-3 text-gray-400 text-sm">
        Type at least 2 characters to search
      </div>
    );
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div className="relative">
        {variant === "modern" && (
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none z-10">
            <svg
              className="h-5 w-5 text-brand-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            updateShowSuggestions(true);
            setError(null);
          }}
          onFocus={() => updateShowSuggestions(true)}
          placeholder={placeholder}
          className={`${getInputClass()} ${variant === "modern" ? "pl-10" : ""}`}
        />
        {query && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-red-400 hover:text-red-300"
            onClick={() => {
              setQuery("");
              updateShowSuggestions(false);
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6L14 14M6 14L14 6"
              />
            </svg>
          </button>
        )}
      </div>

      {showSuggestions && (query || loading) && (
        <div className={getSuggestionsContainerClass()}>
          {renderSuggestions()}
        </div>
      )}
    </div>
  );
};