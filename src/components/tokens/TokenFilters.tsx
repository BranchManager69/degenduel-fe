import React from "react";
import { Button } from "../ui/Button";

interface TokenFiltersProps {
  marketCapFilter: string;
  onMarketCapFilterChange: (filter: string) => void;
}

export const TokenFilters: React.FC<TokenFiltersProps> = ({
  marketCapFilter,
  onMarketCapFilterChange,
}) => {
  const filters = [
    { id: "high-cap", label: "High Cap ($100M+)" },
    { id: "mid-cap", label: "Mid Cap ($25M-$100M)" },
    { id: "low-cap", label: "Low Cap (<$25M)" },
  ];

  const handleFilterClick = (id: string) => {
    onMarketCapFilterChange(marketCapFilter === id ? "" : id);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-400">Market Cap</h3>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            variant={marketCapFilter === filter.id ? "gradient" : "outline"}
            size="sm"
            onClick={() => handleFilterClick(filter.id)}
            className="w-40"
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
