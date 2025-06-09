import React, { useEffect, useMemo, useState } from "react";

import { DeleteTokenModal } from "./DeleteTokenModal";
import { useStore } from "../../store/useStore";
import { Token, TokenHelpers } from "../../types";
import { formatNumber } from "../../utils/format";
import { CopyToClipboard } from "../common/CopyToClipboard";
import { Button } from "../ui/Button";

interface TokenCardProps {
  token: Token;
}

export const TokenCard: React.FC<TokenCardProps> = ({ token }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const user = useStore((state) => state.user);

  // Add debugging logs for socials
  useEffect(() => {
    if (token.socials) {
      console.log("Token Socials Debug:", {
        tokenSymbol: token.symbol,
        socialsObject: token.socials,
        twitter: {
          exists: !!token.socials.twitter,
          value: token.socials.twitter,
        },
        telegram: {
          exists: !!token.socials.telegram,
          value: token.socials.telegram,
        },
        discord: {
          exists: !!token.socials.discord,
          value: token.socials.discord,
        },
        rawData: JSON.stringify(token.socials, null, 2),
      });
    }
  }, [token.socials, token.symbol]);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
  };

  // Get the best available image with header image as priority
  const imageUrl = useMemo(() => {
    if (!token.images) return null;
    return (
      token.images.headerImage ||
      token.images.openGraphImage ||
      token.images.imageUrl ||
      null
    );
  }, [token.images]);

  return (
    <>
      <div
        className="aspect-[3/4] w-full perspective-1000 cursor-pointer"
        onClick={handleClick}
      >
        <div
          className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front of card */}
          <div className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden shadow-lg">
            <div className="relative w-full h-full bg-dark-200/50 backdrop-blur-sm hover:bg-dark-200/60 transition-colors duration-300">
              {/* Image container */}
              <div className="relative w-full h-full overflow-hidden">
                {imageUrl ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center animate-parallax-slow transform scale-125"
                    style={{
                      backgroundImage: `url(${imageUrl})`,
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-dark-300">
                    <span className="font-display text-3xl sm:text-4xl text-white/20 animate-pulse-slow">
                      {token.symbol}
                    </span>
                  </div>
                )}

                {/* Enhanced shine effects */}
                <div className="absolute inset-0">
                  <div className="absolute inset-[-100%] bg-gradient-to-r from-transparent via-white/30 to-transparent transform -rotate-45 translate-x-[-100%] animate-shine-slow" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 animate-pulse-slow" />
                  <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent opacity-0 animate-pulse-slow" />
                </div>

                {/* Enhanced gradient overlays */}
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/20" />
                </div>

                {/* Token info overlay */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                  {/* Symbol Display */}
                  <div className="relative mb-4">
                    <h3 className="font-display text-3xl sm:text-4xl font-bold text-transparent bg-gradient-to-r from-white via-white to-white/80 bg-clip-text drop-shadow-lg tracking-wide">
                      {token.symbol}
                    </h3>
                    <div className="absolute -left-2 top-1/2 w-1 h-8 bg-brand-500/50 blur-sm animate-pulse-slow" />
                  </div>

                  {/* Enhanced Market Cap Display */}
                  <div className="relative">
                    <div className="relative overflow-hidden bg-gradient-to-r from-dark-300/80 to-dark-300/40 backdrop-blur-md rounded-r-2xl pl-4 pr-6 py-3 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-transparent opacity-0 transition-opacity duration-300" />
                      <div className="relative">
                        <span className="font-accent text-xs sm:text-sm text-white/50 uppercase tracking-wider font-medium">
                          Market Cap
                        </span>
                        <p className="font-numbers text-xl sm:text-2xl font-bold text-white tracking-wide mt-1">
                          ${formatNumber(TokenHelpers.getMarketCap(token))}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 24h Change Pill */}
                  <div
                    className={`absolute -top-3 right-4 px-4 py-1.5 rounded-full font-accent text-sm sm:text-base font-medium backdrop-blur-md shadow-lg
                      ${
                        TokenHelpers.getPriceChange(token) >= 0
                          ? "bg-green-500/30 text-green-300 border border-green-500/30"
                          : "bg-red-500/30 text-red-300 border border-red-500/30"
                      }`}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shine-slow" />
                    <span className="font-numbers">
                      {formatNumber(TokenHelpers.getPriceChange(token))}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow-lg">
            <div className="w-full h-full bg-dark-200/50 backdrop-blur-sm p-4 hover:bg-dark-200/60 transition-colors duration-300">
              {/* Enhanced gradient overlays */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/20" />
                <div className="absolute inset-[-100%] bg-gradient-to-r from-transparent via-white/5 to-transparent transform -rotate-45 translate-x-[-100%] animate-shine-slow" />
              </div>

              <div className="relative flex flex-col h-full">
                {/* Token Name Only */}
                <h3 className="font-display text-xl sm:text-2xl font-bold text-transparent bg-gradient-to-r from-white via-white to-white/80 bg-clip-text drop-shadow-lg tracking-wide mb-3">
                  {token.name}
                </h3>

                {/* Compact Stats Grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {/* Price Card */}
                  <div className="bg-dark-300/30 backdrop-blur-sm rounded-lg p-2.5 border border-white/5 hover:border-brand-400/20 transition-all duration-300 group">
                    <span className="font-accent text-xs text-white/40 uppercase tracking-wider group-hover:text-brand-400/60 transition-colors duration-300 whitespace-nowrap">
                      Price
                    </span>
                    <p className="font-numbers text-base font-bold text-white/90 mt-0.5 group-hover:text-white transition-colors duration-300">
                      ${formatNumber(TokenHelpers.getPrice(token))}
                    </p>
                  </div>

                  {/* Volume Card */}
                  <div className="bg-dark-300/30 backdrop-blur-sm rounded-lg p-2.5 border border-white/5 hover:border-brand-400/20 transition-all duration-300 group">
                    <span className="font-accent text-xs text-white/40 uppercase tracking-wider group-hover:text-brand-400/60 transition-colors duration-300 whitespace-nowrap">
                      24h Vol
                    </span>
                    <p className="font-numbers text-base font-bold text-white/90 mt-0.5 group-hover:text-white transition-colors duration-300">
                      ${formatNumber(TokenHelpers.getVolume(token))}
                    </p>
                  </div>
                </div>

                {/* Contract Address */}
                <div className="mb-4">
                  <CopyToClipboard text={TokenHelpers.getAddress(token)}>
                    <div className="bg-dark-300/30 backdrop-blur-sm rounded-lg p-2.5 border border-white/5 hover:border-brand-400/20 transition-all duration-300 group cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-accent text-xs text-white/40 uppercase tracking-wider group-hover:text-brand-400/60 transition-colors duration-300 whitespace-nowrap">
                          Contract
                        </span>
                        <span className="text-white/30 group-hover:text-brand-400 transition-colors duration-300">
                          📋
                        </span>
                      </div>
                      <p className="font-mono text-sm text-white/70 truncate mt-0.5 group-hover:text-white transition-colors duration-300">
                        {`${TokenHelpers.getAddress(token).slice(
                          0,
                          8,
                        )}...${TokenHelpers.getAddress(token).slice(-6)}`}
                      </p>
                    </div>
                  </CopyToClipboard>
                </div>

                {/* Social Links - More Compact with Debug Info */}
                {token.socials && (
                  <div className="flex gap-2 mb-4">
                    {token.socials?.twitter && (
                      <a
                        href={token.socials.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Twitter link clicked:", {
                            url: token.socials?.twitter,
                          });
                        }}
                        className="flex-1 flex items-center justify-center py-2 bg-dark-300/30 rounded-lg border border-white/5 hover:border-brand-400/20 hover:bg-dark-300/50 transition-all duration-300 group"
                      >
                        <span className="text-white/50 group-hover:text-brand-400 transition-colors duration-300">
                          𝕏
                        </span>
                      </a>
                    )}
                    {token.socials?.telegram && (
                      <a
                        href={token.socials.telegram}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Telegram link clicked:", {
                            url: token.socials?.telegram,
                          });
                        }}
                        className="flex-1 flex items-center justify-center py-2 bg-dark-300/30 rounded-lg border border-white/5 hover:border-brand-400/20 hover:bg-dark-300/50 transition-all duration-300 group"
                      >
                        <span className="text-white/50 group-hover:text-brand-400 transition-colors duration-300">
                          ✈️
                        </span>
                      </a>
                    )}
                    {token.socials?.discord && (
                      <a
                        href={token.socials.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Discord link clicked:", {
                            url: token.socials?.discord,
                          });
                        }}
                        className="flex-1 flex items-center justify-center py-2 bg-dark-300/30 rounded-lg border border-white/5 hover:border-brand-400/20 hover:bg-dark-300/50 transition-all duration-300 group"
                      >
                        <span className="text-white/50 group-hover:text-brand-400 transition-colors duration-300">
                          💬
                        </span>
                      </a>
                    )}
                  </div>
                )}

                {/* Admin Controls - More Compact */}
                {user?.is_admin && (
                  <Button
                    onClick={handleDeleteClick}
                    variant="primary"
                    size="sm"
                    className="w-full bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 py-1.5 transition-all duration-300 font-accent relative group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shine-slow" />
                    <span className="relative">Remove Token</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteTokenModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        tokenAddress={TokenHelpers.getAddress(token)}
        tokenSymbol={token.symbol}
      />
    </>
  );
};
