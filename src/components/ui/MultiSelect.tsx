import { CheckIcon } from "@heroicons/react/24/solid";
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
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  value,
  onChange,
  options,
  className = "",
  disabled = false,
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
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={toggleAll}
          disabled={disabled}
          className={`text-sm ${disabled ? 'text-gray-500 cursor-not-allowed' : 'text-gray-300 hover:text-gray-100'}`}
        >
          {value.length === options.length ? "Deselect All" : "Select All"}
        </button>
      </div>
      <div className="grid grid-cols-9 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleOption(option.value)}
            disabled={disabled}
            className={`relative flex items-center justify-center w-10 h-10 rounded-md border text-sm font-medium ${
              disabled 
                ? "bg-dark-400/50 border-dark-500/50 text-gray-500 cursor-not-allowed"
                : value.includes(option.value)
                  ? "bg-brand-500/20 border-brand-500 text-brand-300"
                  : "bg-dark-300 border-dark-400 text-gray-300 hover:border-gray-500"
            }`}
          >
            <span>{option.label}</span>
            {value.includes(option.value) && (
              <CheckIcon className="w-3 h-3 absolute" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
