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
}

export const TokenSearch: React.FC<TokenSearchProps> = ({
  onSelectToken,
  placeholder = "Search by symbol, name, or address...",
  className = "",
  variant = "default",
  autoFocus = false,
  showPriceData = true,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchToken[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
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
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (token: SearchToken) => {
    setQuery(token.symbol || token.address.slice(0, 8));
    onSelectToken(token);
    setShowSuggestions(false);
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
        return "w-full px-4 py-2 bg-dark-200/80 backdrop-blur-sm border-b-2 border-brand-400/50 rounded-t-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-brand-400 transition-colors text-sm appearance-none";
      default:
        return "w-full px-4 py-2 bg-dark-300/50 border border-dark-300/50 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-brand-400 transition-colors appearance-none";
    }
  };

  const getSuggestionsContainerClass = () => {
    switch (variant) {
      case "minimal":
        return "absolute z-40 w-full mt-1 bg-dark-200/90 backdrop-blur-md border border-dark-300/30 rounded-md shadow-lg";
      case "modern":
        return "absolute z-40 w-full mt-0 bg-dark-200/80 backdrop-blur-md rounded-b-md shadow-xl";
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
              className={`px-4 py-3 hover:bg-dark-300/50 cursor-pointer transition-all border-b border-dark-300/50 last:border-0 ${
                variant === "modern"
                  ? "hover:border-l-2 hover:border-l-brand-400"
                  : ""
              } ${
                !token.is_active 
                  ? "opacity-50 hover:opacity-70" 
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {token.image_url && (
                    <img
                      src={token.image_url}
                      alt={token.symbol || 'Token'}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <div className="text-gray-100 font-medium flex items-center gap-2">
                      {token.symbol || 'Unknown'}
                      {!token.is_active && (
                        <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {token.name || `${token.address.slice(0, 8)}...${token.address.slice(-4)}`}
                    </div>
                  </div>
                </div>
                
                {showPriceData && variant !== "minimal" && (
                  <div className="text-right text-xs">
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
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
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
            setShowSuggestions(true);
            setError(null);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className={`${getInputClass()} ${variant === "modern" ? "pl-10" : ""}`}
        />
        {query && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
            onClick={() => {
              setQuery("");
              setShowSuggestions(false);
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
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