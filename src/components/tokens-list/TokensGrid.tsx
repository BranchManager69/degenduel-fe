import React from "react";
import { Token } from "../../types";
import { TokenCard } from "./TokenCard";

interface TokensGridProps {
  tokens: Token[];
}

export const TokensGrid: React.FC<TokensGridProps> = ({ tokens }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
      {tokens.map((token) => (
        <TokenCard key={token.contractAddress} token={token} />
      ))}
    </div>
  );
};
