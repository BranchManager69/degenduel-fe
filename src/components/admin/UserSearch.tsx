import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { userService } from "../../services/userService";

interface SearchUser {
  wallet_address: string;
  nickname: string;
}

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
  const [suggestions, setSuggestions] = useState<SearchUser[]>([]);
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
        setError("Failed to fetch users. Please try again.");
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (wallet: string) => {
    setQuery(wallet);
    onSearch(wallet);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit}>
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
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 bg-cyber-500 text-dark-100 rounded hover:bg-cyber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "..." : "Search"}
          </button>
        </div>
      </form>

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
                  <div className="text-gray-100 font-medium">
                    {user.nickname || "Anonymous"}
                  </div>
                  <div className="text-sm text-gray-400 font-mono mt-1">
                    {user.wallet_address}
                  </div>
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
