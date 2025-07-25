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
        setSuggestions(data.tokens || []);
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

  const formatPrice = (price: string | number | null): string => {
    if (!price) return 'N/A';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return 'N/A';
    if (num < 0.01) return `$${num.toFixed(6)}`;
    return `$${num.toFixed(4)}`;
  };


  const formatChange = (change: string | null) => {
    if (!change) return null;
    const num = parseFloat(change);
    const isPositive = num >= 0;
    return (
      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
        isPositive 
          ? 'text-green-400 bg-green-500/10' 
          : 'text-red-400 bg-red-500/10'
      }`}>
        {isPositive ? '+' : ''}{num.toFixed(2)}%
      </span>
    );
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
    switch (variant) {
      case "minimal":
        return "absolute z-40 w-full mt-1 bg-dark-200/90 backdrop-blur-md border border-dark-300/30 rounded-md shadow-lg";
      case "modern":
        return "absolute z-40 w-full mt-1 bg-dark-200/80 backdrop-blur-md rounded-md shadow-xl";
      default:
        return "absolute z-40 w-full mt-1 bg-dark-200 border border-dark-300/30 rounded-lg shadow-xl";
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
        <ul className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-300 scrollbar-track-dark-200">
          {suggestions.map((token) => (
            <li
              key={token.address}
              onClick={() => handleSuggestionClick(token)}
              className={`hover:bg-dark-300/50 cursor-pointer transition-all border-b border-dark-300/50 last:border-0 overflow-hidden flex items-center ${
                !token.is_active 
                  ? "opacity-50 hover:opacity-70" 
                  : ""
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center">
                  {token.image_url ? (
                    <img
                      src={token.image_url}
                      alt={token.symbol || 'Token'}
                      className="w-12 h-12 object-cover flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-dark-400/30 flex-shrink-0" />
                  )}
                  <div className="px-3">
                    <div className="text-gray-100 font-medium flex items-center gap-2">
                      {token.symbol || 'Unknown'}
                      {!token.is_active && (
                        <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 truncate">
                      {token.name || `${token.address.slice(0, 8)}...${token.address.slice(-4)}`}
                    </div>
                  </div>
                </div>
                
                {showPriceData && variant !== "minimal" && (
                  <div className="text-right text-xs pr-3">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-gray-100 font-medium">
                        {formatPrice(token.price)}
                      </span>
                      {formatChange(token.change_24h?.toString())}
                    </div>
                  </div>
                )}
              </div>
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