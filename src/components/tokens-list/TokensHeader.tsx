import React from "react";
import { TokenResponseMetadata } from "../../types";
import { DataStatus } from "./DataStatus";

interface TokensHeaderProps {
  metadata: TokenResponseMetadata;
}

export const TokensHeader: React.FC<TokensHeaderProps> = ({ metadata }) => {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">
          Tokens Supported
        </h1>
        <DataStatus metadata={metadata} />
      </div>
      <p className="text-sm sm:text-base text-gray-400">
        Tokens in your portfolio must be on the{" "}
        <a
          href="https://degenduel.me/whitelist"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-400 hover:text-brand-300"
        >
          Add Token to Whitelist
        </a>
      </p>
    </div>
  );
};
