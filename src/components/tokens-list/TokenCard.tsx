import React, { useMemo, useState } from "react";
import { Token } from "../../types";
import { formatNumber } from "../../utils/format";

interface TokenCardProps {
  token: Token;
}

export const TokenCard: React.FC<TokenCardProps> = ({ token }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  // Get the best available image with header image as priority
  const imageUrl = useMemo(() => {
    if (!token.images) return null;

    // Try header image first, then fall back to other options
    return (
      token.images.headerImage ||
      token.images.openGraphImage ||
      token.images.imageUrl ||
      null
    );
  }, [token.images]);

  return (
    <div
      className="aspect-[3/4] w-full perspective-1000 cursor-pointer group"
      onClick={handleClick}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front of card - Image focused with shine */}
        <div className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden">
          <div className="relative w-full h-full bg-dark-200/50 backdrop-blur-sm">
            {/* Image container with shine effect */}
            <div className="relative w-full h-full overflow-hidden">
              {imageUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${imageUrl})`,
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-dark-300">
                  <span className="text-4xl text-white/20">{token.symbol}</span>
                </div>
              )}
              {/* Shine effect overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transform -rotate-45 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </div>
              {/* Dark gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {/* Token info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white/90 drop-shadow-lg">
                      {token.symbol}
                    </h3>
                    <p className="text-sm text-white/70 mt-0.5">
                      ${formatNumber(token.price)}
                    </p>
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      Number(token.change24h) >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {formatNumber(token.change24h)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden">
          <div className="w-full h-full bg-dark-200/50 backdrop-blur-sm p-4">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white/90">
                  {token.name}
                </h3>
                <p className="text-sm text-white/70">{token.symbol}</p>
              </div>

              <div className="space-y-3 flex-1">
                <div>
                  <p className="text-xs text-white/50 mb-0.5">Price</p>
                  <p className="text-sm font-medium text-white/90">
                    ${formatNumber(token.price)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-0.5">Market Cap</p>
                  <p className="text-sm font-medium text-white/90">
                    ${formatNumber(token.marketCap)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-0.5">24h Volume</p>
                  <p className="text-sm font-medium text-white/90">
                    ${formatNumber(token.volume24h)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-0.5">Contract</p>
                  <p className="text-xs font-mono text-white/70 truncate">
                    {token.contractAddress}
                  </p>
                </div>
              </div>

              {/* Social links */}
              {token.socials &&
                Object.values(token.socials).some((s) => s?.url) && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex gap-3">
                      {token.socials.twitter?.url && (
                        <a
                          href={token.socials.twitter.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-white/50 hover:text-brand-400 transition-colors"
                        >
                          Twitter
                        </a>
                      )}
                      {token.socials.telegram?.url && (
                        <a
                          href={token.socials.telegram.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-white/50 hover:text-brand-400 transition-colors"
                        >
                          Telegram
                        </a>
                      )}
                      {token.socials.discord?.url && (
                        <a
                          href={token.socials.discord.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-white/50 hover:text-brand-400 transition-colors"
                        >
                          Discord
                        </a>
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
