import { useState } from "react";

import { JsonInputProps } from "./types";

export function JsonInput({ value, onChange, placeholder }: JsonInputProps) {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError("Invalid JSON");
      // Still update the raw text even if invalid JSON
      onChange(text);
    }
  };

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-500 to-cyber-500 rounded-lg blur opacity-0 group-hover:opacity-20 group-focus-within:opacity-100 transition duration-300" />
      <textarea
        className={`w-full h-32 bg-dark-400/50 text-white font-mono text-sm rounded-lg px-4 py-3 
          focus:outline-none focus:ring-2 transition-all duration-300
          ${
            error
              ? "focus:ring-red-500 border-red-500/50 hover:border-red-500"
              : "focus:ring-brand-500 border-dark-300/50 hover:border-brand-500/50"
          }
          border backdrop-blur-sm resize-y placeholder-gray-500`}
        value={
          typeof value === "string" ? value : JSON.stringify(value, null, 2)
        }
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
      {error && (
        <div className="absolute right-2 bottom-2 flex items-center gap-2 bg-dark-400/80 px-2 py-1 rounded backdrop-blur-sm border border-red-500/50 group-hover:animate-glitch">
          <span className="text-lg">⚠️</span>
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}
    </div>
  );
}
