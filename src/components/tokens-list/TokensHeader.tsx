import React from "react";
import { Link } from "react-router-dom";

import { DataStatus } from "./DataStatus";
import { TokenResponseMetadata } from "../../types";

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
        <Link
          to="/tokens/whitelist"
          className="text-brand-400 hover:text-brand-300"
        >
          Add Token to Whitelist
        </Link>
      </p>
    </div>
  );
};
