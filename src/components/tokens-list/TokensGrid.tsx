import React from "react";

import { TokenCard } from "./TokenCard";
import { Token } from "../../types";

interface TokensGridProps {
  tokens: Token[];
}

export const TokensGrid: React.FC<TokensGridProps> = ({ tokens }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {tokens.map((token) => (
        <TokenCard key={token.contractAddress} token={token} />
      ))}
    </div>
  );
};
