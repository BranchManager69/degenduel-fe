import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { userService } from "../../services/userService";

interface User {
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
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedQuery) {
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);
        const results = await userService.searchUsers(debouncedQuery);
        setSuggestions(results);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
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
    onSearch(query.trim());
    setShowSuggestions(false);
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
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="w-full px-4 py-2 bg-dark-300/50 border border-dark-300 rounded text-cyber-300 placeholder-cyber-300/50 focus:outline-none focus:border-cyber-500 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1 bg-cyber-500 text-dark-100 rounded hover:bg-cyber-400 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (query || loading) && (
        <div className="absolute z-10 w-full mt-1 bg-dark-200 border border-dark-300 rounded-lg shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-2 text-cyber-300">Loading...</div>
          ) : suggestions.length > 0 ? (
            <ul>
              {suggestions.map((user) => (
                <li
                  key={user.wallet_address}
                  onClick={() => handleSuggestionClick(user.wallet_address)}
                  className="px-4 py-2 hover:bg-dark-300/50 cursor-pointer transition-colors border-b border-dark-300 last:border-0"
                >
                  <div className="text-cyber-400">
                    {user.nickname || "Anonymous"}
                  </div>
                  <div className="text-xs text-cyber-300 font-mono">
                    {user.wallet_address}
                  </div>
                </li>
              ))}
            </ul>
          ) : query.length >= 2 ? (
            <div className="p-2 text-cyber-300">No results found</div>
          ) : (
            <div className="p-2 text-cyber-300">Type at least 2 characters</div>
          )}
        </div>
      )}
    </div>
  );
};
