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
    <div className="relative">
      <textarea
        className={`w-full h-32 bg-gray-900 text-white font-mono text-sm rounded px-3 py-2 
          focus:outline-none focus:ring-2 ${
            error
              ? "focus:ring-red-500 border-red-500"
              : "focus:ring-purple-500 border-gray-700"
          }
          border resize-y`}
        value={
          typeof value === "string" ? value : JSON.stringify(value, null, 2)
        }
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
      {error && (
        <span className="absolute right-2 bottom-2 text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  );
}
