export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  className?: string;
}

export const Select = <T extends string>({
  value,
  onChange,
  options,
  className = "",
}: SelectProps<T>): React.JSX.Element => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`px-3 py-2 bg-dark-300 border-dark-400 rounded-md text-gray-200 appearance-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:bg-dark-200 transition-colors ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-dark-300 text-gray-200">
          {option.label}
        </option>
      ))}
    </select>
  );
};
