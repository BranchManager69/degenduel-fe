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
  useAbsolutePositioning?: boolean; // For use inside modals
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
  useAbsolutePositioning = false,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchToken[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  // Wrap setShowSuggestions to trigger callbacks and calculate position
  const updateShowSuggestions = (show: boolean) => {
    if (show && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4, // Remove window.scrollY, use viewport coordinates
        left: rect.left,      // Remove window.scrollX, use viewport coordinates  
        width: rect.width
      });
    }
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

  const formatTokenAge = (pairCreatedAt: string | null): string => {
    if (!pairCreatedAt) return '';
    
    const now = new Date();
    const created = new Date(pairCreatedAt);
    const diffMs = now.getTime() - created.getTime();
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
    
    if (years >= 1) return `${years}y`;
    if (months >= 1) return `${months}mo`;
    if (days >= 1) return `${days}d`;
    if (hours >= 1) return `${hours}h`;
    return `${minutes}m`;
  };


  const formatChange = (change: string | number | null | undefined, timeframe: string) => {
    if (change === null || change === undefined) {
      return (
        <span className="text-[10px] font-medium text-gray-500">
          —% {timeframe}
        </span>
      );
    }
    const num = typeof change === 'string' ? parseFloat(change) : change;
    if (isNaN(num)) {
      return (
        <span className="text-[10px] font-medium text-gray-500">
          —% {timeframe}
        </span>
      );
    }
    
    const rounded = Math.round(num);
    // If rounding results in 0, show as gray dash since it's not truly zero
    if (rounded === 0) {
      return (
        <span className="text-[10px] font-medium text-gray-500">
          —% {timeframe}
        </span>
      );
    }
    
    const isPositive = rounded > 0;
    return (
      <span className={`text-[10px] font-medium ${
        isPositive 
          ? 'text-green-400' 
          : 'text-red-400'
      }`}>
        {isPositive ? '+' : ''}{rounded}% {timeframe}
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
    // Use higher z-index to ensure it appears over modal
    const baseClass = "fixed z-[99999]";
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
              className={`hover:bg-dark-300/50 cursor-pointer transition-all border-b border-dark-300/50 last:border-0 overflow-hidden flex items-center ${
                !token.is_active 
                  ? "opacity-50 hover:opacity-70" 
                  : ""
              }`}
            >
              <div className="flex items-center justify-between w-full min-w-0">
                <div className="flex items-center min-w-0 flex-1">
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
                  <div className="px-3 min-w-0 flex-1">
                    <div className="text-gray-100 font-medium flex items-center gap-2 whitespace-nowrap">
                      <span className="truncate">{token.symbol || 'Unknown'}</span>
                      
                      {/* Social Media Icons - right next to symbol */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* DEXScreener Link - Always show for tokens */}
                        <a
                          href={`https://dexscreener.com/solana/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-green-400 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title="View on DEXScreener"
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="48" fill="currentColor" opacity="0.1"/>
                            <g transform="translate(20,20) scale(0.6,0.6)">
                              <path d="M50 10 C70 10 90 25 90 45 C90 50 85 60 75 70 L65 75 L50 85 L35 75 L25 70 C15 60 10 50 10 45 C10 25 30 10 50 10 Z M35 35 C40 30 45 35 50 40 C55 35 60 30 65 35 C60 40 55 45 50 50 C45 45 40 40 35 35 Z" fill="currentColor"/>
                            </g>
                          </svg>
                        </a>
                        
                        {token.socials?.website && (
                          <a
                            href={token.socials.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-blue-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="Website"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                            </svg>
                          </a>
                        )}
                        {token.socials?.twitter && (
                          <a
                            href={token.socials.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-blue-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="Twitter"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </a>
                        )}
                        {token.socials?.telegram && (
                          <a
                            href={token.socials.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-blue-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="Telegram"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                          </a>
                        )}
                        {token.socials?.discord && (
                          <a
                            href={token.socials.discord}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-blue-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="Discord"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.30zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                      
                      {!token.is_active && (
                        <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs flex-shrink-0">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-2 whitespace-nowrap">
                      <span className="truncate">
                        {token.name ? 
                          (token.name.length > 16 ? `${token.name.slice(0, 16)}...` : token.name) :
                          `${token.address.slice(0, 8)}...${token.address.slice(-4)}`
                        }
                      </span>
                      {token.pairCreatedAt && (
                        <a
                          href={`https://solscan.io/token/${token.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 hover:text-blue-400 hover:underline transition-colors flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {formatTokenAge(token.pairCreatedAt)}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                {showPriceData && variant !== "minimal" && (
                  <div className="text-left text-xs pr-3 flex-shrink-0">
                    <div className="flex items-start gap-2 whitespace-nowrap">
                      {/* Left column: MC and VOL */}
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-100 font-medium whitespace-nowrap">
                          <span className="text-gray-400 font-normal">MC</span> {formatMarketCap(token.market_cap)}
                        </span>
                        <span className="text-gray-100 font-medium whitespace-nowrap">
                          <span className="text-gray-400 font-normal">VOL</span> {formatVolume(token.volume_24h)}
                        </span>
                      </div>
                      
                      <span className="text-gray-500">•</span>
                      
                      {/* Middle column: 24h changes */}
                      <div className="flex flex-col gap-1">
                        {formatChange(token.change_24h, '24h')}
                        <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap">
                          {formatVolume(token.volumes?.h24 || 0)} 24h
                        </span>
                      </div>
                      
                      {/* Right column: 5m changes */}
                      <div className="flex flex-col gap-1">
                        {formatChange(token.priceChanges?.m5, '5m')}
                        <span className="text-[10px] font-medium text-gray-500 whitespace-nowrap">
                          {formatVolume(token.volumes?.m5 || 0)} 5m
                        </span>
                      </div>
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
        <div 
          className={useAbsolutePositioning ? "absolute z-[9999] mt-1 w-full bg-dark-200/80 backdrop-blur-md rounded-md shadow-xl border border-dark-300/20" : getSuggestionsContainerClass()}
          style={useAbsolutePositioning ? 
            {} : 
            {
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`
            }
          }
        >
          {renderSuggestions()}
        </div>
      )}
    </div>
  );
};