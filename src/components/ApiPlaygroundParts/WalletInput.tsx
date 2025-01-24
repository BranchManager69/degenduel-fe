import { WalletInputProps } from "./types";

export function WalletInput({
  value,
  onChange,
  placeholder,
}: WalletInputProps) {
  return (
    <input
      type="text"
      className="w-full bg-gray-900 text-white font-mono text-sm rounded px-3 py-2 
        focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
    />
  );
}
