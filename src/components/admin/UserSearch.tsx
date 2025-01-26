import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce.ts";
import type { User } from "../../services/userService.ts";
import { userService } from "../../services/userService.ts";

interface UserSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const UserSearch: React.FC<UserSearchProps> = ({
  onSearch,
  placeholder = "Search by wallet address or nickname...",
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
            : "Failed to fetch users. Please try again."
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

  const handleSuggestionClick = (wallet: string) => {
    setQuery(wallet);
    onSearch(wallet);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
            setError(null);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 bg-dark-300/50 border border-dark-300 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyber-500 transition-colors"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (query || loading) && (
        <div className="absolute z-50 w-full mt-1 bg-dark-200 border border-dark-300 rounded-lg shadow-xl">
          {loading ? (
            <div className="p-3 text-gray-400">Searching...</div>
          ) : error ? (
            <div className="p-3 text-red-400">{error}</div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-dark-300 scrollbar-track-dark-200">
              {suggestions.map((user) => (
                <li
                  key={user.wallet_address}
                  onClick={() => handleSuggestionClick(user.wallet_address)}
                  className="px-4 py-3 hover:bg-dark-300/50 cursor-pointer transition-colors border-b border-dark-300 last:border-0"
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
                        {user.wallet_address}
                      </div>
                    </div>
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
                  </div>
                  {user.ban_reason && (
                    <div className="mt-2 text-xs text-red-400">
                      Ban reason: {user.ban_reason}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <div className="p-3 text-gray-400">No users found</div>
          ) : (
            <div className="p-3 text-gray-400">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      )}
    </div>
  );
};
