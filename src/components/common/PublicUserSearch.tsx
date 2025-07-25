import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../hooks/utilities/useDebounce";

interface PublicUser {
  nickname: string;
  twitter_handle: string | null;
  role: string;
  is_banned?: boolean;
  total_contests: number;
  experience_points: number;
  profile_image_url?: string;
  _count?: {
    contest_participants: number;
    created_contests: number;
  };
  activity_metrics?: {
    contests_participated: number;
    contests_created: number;
    last_contest_date: string;
  };
}

interface PublicUserSearchProps {
  onSelectUser: (user: PublicUser) => void;
  placeholder?: string;
  className?: string;
  variant?: "default" | "minimal" | "modern";
  autoFocus?: boolean;
  currentUserNickname?: string;
}

export const PublicUserSearch: React.FC<PublicUserSearchProps> = ({
  onSelectUser,
  placeholder = "Search by username or @twitter...",
  className = "",
  variant = "default",
  autoFocus = false,
  currentUserNickname,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PublicUser[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popularUsers, setPopularUsers] = useState<PublicUser[]>([]);
  const [hasLoadedPopular, setHasLoadedPopular] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Fetch popular users for initial suggestions
  const fetchPopularUsers = async () => {
    if (hasLoadedPopular) return;
    
    try {
      console.log('[PublicUserSearch] Starting to fetch suggested opponents...');
      setLoading(true);
      
      // Use the dedicated suggested opponents endpoint
      const response = await fetch(
        `/api/users/suggested-opponents?limit=5`,
        {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('[PublicUserSearch] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch suggested opponents: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[PublicUserSearch] Suggested opponents data:', data);
      
      if (data.users && Array.isArray(data.users)) {
        // Users are already sorted by the backend (contest participation + recent activity)
        // Filter out duplicates and current user
        const filteredUsers = data.users.filter((user: PublicUser, index: number, arr: PublicUser[]) => 
          // Remove duplicates by nickname
          arr.findIndex((u: PublicUser) => u.nickname === user.nickname) === index &&
          // Remove current user
          (!currentUserNickname || user.nickname !== currentUserNickname)
        );
        console.log('[PublicUserSearch] Setting', filteredUsers.length, 'popular users (after deduplication)');
        setPopularUsers(filteredUsers);
        setHasLoadedPopular(true);
      } else {
        console.warn('[PublicUserSearch] No users in response');
        setPopularUsers([]);
      }
    } catch (error) {
      console.error("[PublicUserSearch] Failed to fetch suggested opponents:", error);
      setPopularUsers([]);
      setHasLoadedPopular(true); // Mark as loaded even on error to prevent retries
    } finally {
      setLoading(false);
      console.log('[PublicUserSearch] Finished loading suggested opponents');
    }
  };

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
          `/api/users/search?search=${encodeURIComponent(debouncedQuery)}&limit=5`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to search users: ${response.status}`);
        }
        
        const data = await response.json();
        // Filter out current user from search results
        const filteredUsers = (data.users || []).filter((user: PublicUser) => 
          !currentUserNickname || user.nickname !== currentUserNickname
        );
        setSuggestions(filteredUsers);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setError("Failed to search users. Please try again.");
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

  const handleSuggestionClick = (user: PublicUser) => {
    setQuery(user.twitter_handle || user.nickname);
    onSelectUser(user);
    setShowSuggestions(false);
  };

  const getInputClass = () => {
    switch (variant) {
      case "minimal":
        return "w-full px-3 py-1.5 bg-dark-300/30 border border-dark-300/50 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400 text-sm transition-colors";
      case "modern":
        return "w-full px-4 py-2 bg-dark-200/80 backdrop-blur-sm border-b-2 border-brand-400/50 rounded-t-md text-gray-100 placeholder-gray-400 focus:outline-none focus:border-brand-400 transition-colors text-sm";
      default:
        return "w-full px-4 py-2 bg-dark-300/50 border border-dark-300 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyber-500 transition-colors";
    }
  };

  const getSuggestionsContainerClass = () => {
    switch (variant) {
      case "minimal":
        return "absolute z-50 w-full mt-1 bg-dark-200/90 backdrop-blur-md border border-dark-300/70 rounded-md shadow-lg max-h-64 overflow-hidden";
      case "modern":
        return "absolute z-50 w-full mt-0 bg-dark-200/80 backdrop-blur-md border-x-2 border-b-2 border-dark-300 rounded-b-md shadow-xl";
      default:
        return "absolute z-50 w-full mt-1 bg-dark-200 border border-dark-300/50 rounded-lg shadow-xl max-h-64 overflow-hidden";
    }
  };

  const renderSuggestions = () => {
    if (loading && query.length >= 2) {
      return <div className="p-3 text-gray-400 text-sm">Searching...</div>;
    }
    
    if (loading && query.length === 0 && !hasLoadedPopular) {
      return <div className="p-3 text-gray-400 text-sm">Loading suggestions...</div>;
    }

    if (error) {
      return <div className="p-3 text-red-400 text-sm">{error}</div>;
    }

    // Show search results if we have a query
    if (query.length >= 2 && suggestions.length > 0) {
      return (
        <ul className="max-h-60 overflow-y-auto">
          {suggestions.map((user, index) => (
            <li
              key={`${user.nickname}-${index}`}
              onClick={() => handleSuggestionClick(user)}
              className={`px-4 py-2 hover:bg-dark-300/50 cursor-pointer transition-colors border-b border-dark-300/50 last:border-0 ${
                variant === "modern"
                  ? "hover:border-l-2 hover:border-l-brand-400"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={user.profile_image_url || "/images/profiles/default_pic_green.png"}
                    alt={user.nickname}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.currentTarget.src = "/images/profiles/default_pic_green.png";
                    }}
                  />
                  <div>
                    <div className="text-gray-100 font-medium flex items-center gap-2">
                      {user.nickname}
                      {user.is_banned && (
                        <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                          BANNED
                        </span>
                      )}
                    </div>
                    {user.twitter_handle && (
                      <div className="text-sm text-brand-400">
                        {user.twitter_handle}
                      </div>
                    )}
                  </div>
                </div>
                {variant !== "minimal" && (
                  <div className="text-right text-xs">
                    <div className="text-gray-400">
                      Joined: <span className="text-gray-100">{user._count?.contest_participants || 0}</span>
                    </div>
                    <div className="text-gray-400">
                      Created: <span className="text-gray-100">{user._count?.created_contests || 0}</span>
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
      return <div className="p-3 text-gray-400 text-sm">No users found</div>;
    }

    // Show popular users when no query (or query is too short)
    if (query.length < 2 && popularUsers.length > 0) {
      return (
        <>
          <div className="px-4 py-2 text-xs text-gray-500 border-b border-dark-300/50">
            Suggested Opponents
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {popularUsers.map((user, index) => (
              <li
                key={`popular-${user.nickname}-${index}`}
                onClick={() => handleSuggestionClick(user)}
                className={`px-4 py-2 hover:bg-dark-300/50 cursor-pointer transition-colors border-b border-dark-300/50 last:border-0 ${
                  variant === "modern"
                    ? "hover:border-l-2 hover:border-l-brand-400"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profile_image_url || "/images/profiles/default_pic_green.png"}
                      alt={user.nickname}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.currentTarget.src = "/images/profiles/default_pic_green.png";
                      }}
                    />
                    <div>
                      <div className="text-gray-100 font-medium flex items-center gap-2">
                        {user.nickname}
                        {user.is_banned && (
                          <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                            BANNED
                          </span>
                        )}
                      </div>
                      {user.twitter_handle && (
                        <div className="text-sm text-brand-400">
                          {user.twitter_handle}
                        </div>
                      )}
                    </div>
                  </div>
                  {variant !== "minimal" && (
                    <div className="text-right text-xs">
                      <div className="text-gray-400">
                        <span className="text-gray-100 font-medium">
                          {user.activity_metrics?.contests_participated || user._count?.contest_participants || 0}
                        </span> contests
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      );
    }

    return (
      <div className="p-3 text-red-400 text-sm font-bold">
        DEBUG: query={query.length}, popular={popularUsers.length}, loaded={hasLoadedPopular}, loading={loading}
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
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setError(null);
          }}
          onFocus={() => {
            setShowSuggestions(true);
            if (!hasLoadedPopular) {
              fetchPopularUsers();
            }
          }}
          onBlur={() => {
            // TEMPORARILY DISABLED for debugging
            // setTimeout(() => {
            //   if (!wrapperRef.current?.contains(document.activeElement)) {
            //     setShowSuggestions(false);
            //   }
            // }, 150);
          }}
          placeholder={placeholder}
          className={`${getInputClass()} ${variant === "modern" ? "pl-10" : ""}`}
          autoComplete="off"
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

      {showSuggestions && (
        <div className={getSuggestionsContainerClass()}>
          {renderSuggestions()}
        </div>
      )}
    </div>
  );
};