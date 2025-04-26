import React, { useEffect, useRef, useState } from "react";

import { useDebounce } from "../../hooks/useDebounce";
import type { User } from "../../services/userService";
import { userService } from "../../services/userService";

interface UserSearchProps {
  onSearch: (query: string) => void;
  onSelectUser?: (user: User) => void;
  placeholder?: string;
  className?: string;
  variant?: "default" | "minimal" | "modern";
  autoFocus?: boolean;
}

export const UserSearch: React.FC<UserSearchProps> = ({
  onSearch,
  onSelectUser,
  placeholder = "Search by wallet address or nickname...",
  className = "",
  variant = "default",
  autoFocus = false,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<User[]>([]);
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
      if (!debouncedQuery) {
        setSuggestions([]);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const results = await userService.searchUsers(debouncedQuery);
        setSuggestions(results);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch users. Please try again.",
        );
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

  const handleSuggestionClick = (user: User) => {
    setQuery(user.nickname || user.wallet_address);
    onSearch(user.wallet_address);
    if (onSelectUser) {
      onSelectUser(user);
    }
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
        return "absolute z-50 w-full mt-1 bg-dark-200/90 backdrop-blur-md border border-dark-300/70 rounded-md shadow-lg";
      case "modern":
        return "absolute z-50 w-full mt-0 bg-dark-200/80 backdrop-blur-md border-x-2 border-b-2 border-brand-400/30 rounded-b-md shadow-xl";
      default:
        return "absolute z-50 w-full mt-1 bg-dark-200 border border-dark-300 rounded-lg shadow-xl";
    }
  };

  const renderSuggestions = () => {
    if (loading) {
      return <div className="p-3 text-gray-400 text-sm">Searching...</div>;
    }

    if (error) {
      return <div className="p-3 text-red-400 text-sm">{error}</div>;
    }

    if (suggestions.length > 0) {
      return (
        <ul className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-300 scrollbar-track-dark-200">
          {suggestions.map((user) => (
            <li
              key={user.wallet_address}
              onClick={() => handleSuggestionClick(user)}
              className={`px-4 py-2 hover:bg-dark-300/50 cursor-pointer transition-colors border-b border-dark-300/50 last:border-0 ${
                variant === "modern"
                  ? "hover:border-l-2 hover:border-l-brand-400"
                  : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-gray-100 font-medium flex items-center gap-2">
                    {user.nickname || "Anonymous"}
                    {user.is_banned && (
                      <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">
                        BANNED
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 font-mono mt-1">
                    {user.wallet_address.substring(0, 6)}...
                    {user.wallet_address.substring(
                      user.wallet_address.length - 4,
                    )}
                  </div>
                </div>
                {variant !== "minimal" && (
                  <div className="text-right text-xs">
                    <div className="text-gray-400">
                      Win Rate:{" "}
                      <span className="text-gray-100">
                        {user.total_contests > 0
                          ? `${(
                              (user.total_wins / user.total_contests) *
                              100
                            ).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                    <div className="text-gray-400 mt-0.5">
                      Balance:{" "}
                      <span className="text-gray-100">
                        ${parseFloat(user.balance).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              {user.ban_reason && variant !== "minimal" && (
                <div className="mt-2 text-xs text-red-400">
                  Ban reason: {user.ban_reason}
                </div>
              )}
            </li>
          ))}
        </ul>
      );
    }

    if (query.length >= 2) {
      return <div className="p-3 text-gray-400 text-sm">No users found</div>;
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
            onSearch(e.target.value);
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
              onSearch("");
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

      {/* Suggestions Dropdown */}
      {showSuggestions && (query || loading) && (
        <div className={getSuggestionsContainerClass()}>
          {renderSuggestions()}
        </div>
      )}
    </div>
  );
};
