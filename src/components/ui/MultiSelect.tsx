import React from "react";

interface MultiSelectOption {
  value: number;
  label: string;
}

interface MultiSelectProps {
  value: number[];
  onChange: (values: number[]) => void;
  options: MultiSelectOption[];
  className?: string;
  disabled?: boolean;
  hideSelectAll?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  value,
  onChange,
  options,
  className = "",
  disabled = false,
  hideSelectAll = false,
}) => {
  const toggleOption = (optionValue: number) => {
    if (disabled) return;
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const toggleAll = () => {
    if (disabled) return;
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.value));
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {!hideSelectAll && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleAll}
            disabled={disabled}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              disabled 
                ? 'text-gray-500 border-gray-600 cursor-not-allowed' 
                : value.length === options.length
                  ? 'text-red-400 hover:text-red-300 border-red-400/30 hover:border-red-400/50'
                  : 'text-brand-400 hover:text-brand-300 border-brand-400/30 hover:border-brand-400/50'
            }`}
          >
            {value.length === options.length ? "Deselect All" : "Select All"}
          </button>
        </div>
      )}
      <div className="grid grid-cols-9 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleOption(option.value)}
            disabled={disabled}
            className={`relative flex items-center justify-center w-10 h-10 rounded-md border-2 text-sm font-medium transition-all ${
              disabled 
                ? "bg-dark-400/50 border-dark-500/50 text-gray-500 cursor-not-allowed"
                : value.includes(option.value)
                  ? "bg-green-500/30 border-green-400 text-white font-bold shadow-lg shadow-green-500/20 scale-105"
                  : "bg-dark-300 border-dark-400 text-gray-300 hover:border-gray-500"
            }`}
          >
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
