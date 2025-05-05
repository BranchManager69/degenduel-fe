import React, { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  iconColor?: string;
  focusColor?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = "Search...",
  value,
  onChange,
  className = "",
  iconColor = "text-gray-500",
  focusColor = "text-brand-400",
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className={`group relative flex items-center ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-brand-400/5 to-brand-600/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <FaSearch 
        className={`absolute left-4 ${iconColor} ${isFocused ? focusColor : ''} transition-colors duration-300`} 
      />
      <input
        type="search"
        placeholder={placeholder}
        className="w-full bg-dark-300/30 border-none rounded-full py-3 pl-12 pr-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-400/50 backdrop-blur-sm transition-all duration-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {value && (
        <button 
          className="absolute right-4 text-gray-500 hover:text-gray-300 transition-colors"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <FaTimes />
        </button>
      )}
    </div>
  );
};

export default SearchInput;