import React from "react";

import { Token, SearchToken } from "../../types";
import { Button } from "../ui/Button";
import { Select, SelectOption } from "../ui/Select";
import { TokenSearch } from "../common/TokenSearch";

interface TokensControlsProps {
  onTokenSearchSelect: (token: SearchToken) => void;
  sortField: keyof Token;
  onSortFieldChange: (field: keyof Token) => void;
  sortDirection: "asc" | "desc";
  onSortDirectionChange: () => void;
  imageSource: "default" | "header" | "openGraph";
  onImageSourceChange: (source: "default" | "header" | "openGraph") => void;
}

export const TokensControls: React.FC<TokensControlsProps> = ({
  onTokenSearchSelect,
  sortField,
  onSortFieldChange,
  sortDirection,
  onSortDirectionChange,
  imageSource,
  onImageSourceChange,
}) => {
  const sortOptions: SelectOption<keyof Token>[] = [
    { value: "marketCap", label: "Market Cap" },
    { value: "volume24h", label: "Volume" },
    { value: "change24h", label: "24h Change" },
  ];

  const imageSourceOptions: SelectOption<"default" | "header" | "openGraph">[] =
    [
      { value: "default", label: "Default Image" },
      { value: "header", label: "Header Image" },
      { value: "openGraph", label: "OpenGraph Image" },
    ];

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1">
        <TokenSearch
          onSelectToken={onTokenSearchSelect}
          placeholder="Search tokens by symbol, name, or address..."
          variant="default"
          showPriceData={true}
        />
      </div>
      <div className="flex gap-2">
        <Select<keyof Token>
          value={sortField}
          onChange={onSortFieldChange}
          options={sortOptions}
          className="bg-dark-200/50 border-dark-300"
        />
        <Button
          onClick={onSortDirectionChange}
          className="px-3 bg-dark-200/50 hover:bg-dark-300/50"
        >
          {sortDirection === "asc" ? "↑" : "↓"}
        </Button>
        <Select<"default" | "header" | "openGraph">
          value={imageSource}
          onChange={onImageSourceChange}
          options={imageSourceOptions}
          className="bg-dark-200/50 border-dark-300"
        />
      </div>
    </div>
  );
};
