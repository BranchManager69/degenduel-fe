// src/components/contest-lobby/LivePriceUpdates.tsx

/**
 * Live Price Updates Component
 * 
 * @description A component that displays a list of tokens and a summary of their info and market data.
 * 
 * @param {TokenData[]} tokens - An array of token data.
 * @returns {React.ReactNode} A React component that displays a list of tokens and a summary of their info and market data.
 * @example
 * <LivePriceUpdates tokens={tokens} /> // tokens is an array of TokenData objects
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-05-05
 * @updated 2025-05-05
 */

import React from "react";
import { formatCurrency } from "../../lib/utils";
import { Token } from "../../types";
import { Card } from "../ui/Card";

interface TokenData {
  token: Token;
}

interface LivePriceUpdatesProps {
  tokens: TokenData[];
}

// Displays a list of tokens with summaries of their info and market data.
export const LivePriceUpdates: React.FC<LivePriceUpdatesProps> = ({
    tokens,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Map through the tokens and render a card for each */}
      {tokens.map(({ token }) => (
        // Card for each token
        <Card
          // TODO: Add a hover effect to the card

          // Shouldn't this be the token's address?
          key={token.symbol}
          className="bg-dark-200/50 backdrop-blur-sm border-dark-300 p-4 flex items-center justify-between"
        >
          {/* Token METADATA */}
          <div className="flex items-center gap-2">
            
            {/* Token Image */}
            <div className="w-10 h-10 rounded-full overflow-hidden">
              {/* Option 1: Prefer Open Graph Image */}
              <img src={token.images?.openGraphImage || token.images?.imageUrl || token.images?.headerImage} alt={token.name} className="w-full h-full object-cover" />
              {/* Option 2: Prefer Image URL */}
              {/* <img src={token.images?.imageUrl || token.images?.headerImage || token.images?.openGraphImage} alt={token.name} className="w-full h-full object-cover" /> */}
              {/* Option 3: Prefer Header Image */}
              {/* <img src={token.images?.headerImage || token.images?.openGraphImage || token.images?.imageUrl} alt={token.name} className="w-full h-full object-cover" /> */}
            </div>

            {/* Token Symbol */}
            <div className="text-lg font-semibold text-gray-100">
              {token.symbol}
            </div>

            {/* Token Name */}
            <div className="text-sm text-gray-400">
              {token.name}
            </div>

          </div>

          {/* Token MARKET DATA */}
          <div className="text-right">

            {/* Token Price */}
            <div className="text-lg font-bold text-gray-100">
              {formatCurrency(token.price)}
            </div>

            {/* Token Market Cap */}
            <div className="text-sm text-gray-400">
              {formatCurrency(token.marketCap)}
            </div>

            {/* Token Change24h */}
            <div
              className={`text-sm ${Number(token.change24h) >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {/* Change24h is (stupidly) a string, so we need to convert it to a number */}
              {Number(token.change24h) >= 0 ? "+" : ""}
              {Number(token.change24h).toFixed(2)}%
            </div>

            {/* Token Volume24h */}
            <div className="text-sm text-gray-400">
              {formatCurrency(token.volume24h)}
            </div>
            
          </div>

        </Card>

      ))}
    </div>
  );
};
