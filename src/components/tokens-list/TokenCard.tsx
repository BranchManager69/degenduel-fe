import React, { useMemo, useState } from "react";
import { useStore } from "../../store/useStore";
import { Token } from "../../types";
import { formatNumber } from "../../utils/format";
import { CopyToClipboard } from "../common/CopyToClipboard";
import { Button } from "../ui/Button";
import { DeleteTokenModal } from "./DeleteTokenModal";

interface TokenCardProps {
  token: Token;
}

export const TokenCard: React.FC<TokenCardProps> = ({ token }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const user = useStore((state) => state.user);

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
        className="aspect-[3/4] w-full perspective-1000 cursor-pointer group"
        onClick={handleClick}
      >
        <div
          className={`relative w-full h-full transition-all duration-500 transform-style-3d shadow-xl hover:scale-[1.02] ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front of card */}
          <div className="absolute w-full h-full backface-hidden rounded-xl overflow-hidden shadow-lg">
            <div className="relative w-full h-full bg-dark-200/50 backdrop-blur-sm">
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
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-[-100%] bg-gradient-to-r from-transparent via-white/30 to-transparent transform -rotate-45 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
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
                    <div className="relative overflow-hidden bg-gradient-to-r from-dark-300/80 to-dark-300/40 backdrop-blur-md rounded-r-2xl pl-4 pr-6 py-3 group-hover:from-dark-300/90 group-hover:to-dark-300/50 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative">
                        <span className="font-accent text-xs sm:text-sm text-white/50 uppercase tracking-wider font-medium">
                          Market Cap
                        </span>
                        <p className="font-numbers text-xl sm:text-2xl font-bold text-white tracking-wide mt-1">
                          ${formatNumber(token.marketCap)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 24h Change Pill */}
                  <div
                    className={`absolute -top-3 right-4 px-4 py-1.5 rounded-full font-accent text-sm sm:text-base font-medium backdrop-blur-md shadow-lg
                      ${
                        Number(token.change24h) >= 0
                          ? "bg-green-500/30 text-green-300 border border-green-500/30"
                          : "bg-red-500/30 text-red-300 border border-red-500/30"
                      }`}
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shine-slow" />
                    <span className="font-numbers">
                      {formatNumber(token.change24h)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back of card */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-xl overflow-hidden shadow-lg">
            <div className="w-full h-full bg-dark-200/50 backdrop-blur-sm p-3 sm:p-4">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-display text-base sm:text-lg font-bold text-white/90 truncate mr-2 group-hover:text-white transition-colors duration-300">
                    {token.name}
                  </h3>
                  <p className="font-accent text-xs sm:text-sm text-white/70 shrink-0 group-hover:text-white/90 transition-colors duration-300">
                    {token.symbol}
                  </p>
                </div>

                <div className="space-y-2 sm:space-y-3 flex-1">
                  {/* Stats with hover effects */}
                  <div className="group/stat hover:bg-dark-300/30 p-2 rounded-lg transition-colors duration-300">
                    <p className="font-accent text-[clamp(0.65rem,2vw,0.75rem)] sm:text-sm text-white/50 mb-0.5 group-hover/stat:text-white/70 transition-colors duration-300">
                      Price
                    </p>
                    <p className="font-numbers text-xs sm:text-sm font-medium text-white/90 group-hover/stat:text-white transition-colors duration-300">
                      ${formatNumber(token.price)}
                    </p>
                  </div>
                  <div className="group/stat hover:bg-dark-300/30 p-2 rounded-lg transition-colors duration-300">
                    <p className="font-accent text-[clamp(0.65rem,2vw,0.75rem)] sm:text-sm text-white/50 mb-0.5 group-hover/stat:text-white/70 transition-colors duration-300">
                      Market Cap
                    </p>
                    <p className="font-numbers text-xs sm:text-sm font-medium text-white/90 group-hover/stat:text-white transition-colors duration-300">
                      ${formatNumber(token.marketCap)}
                    </p>
                  </div>
                  <div className="group/stat hover:bg-dark-300/30 p-2 rounded-lg transition-colors duration-300">
                    <p className="font-accent text-[clamp(0.65rem,2vw,0.75rem)] sm:text-sm text-white/50 mb-0.5 group-hover/stat:text-white/70 transition-colors duration-300">
                      24h Volume
                    </p>
                    <p className="font-numbers text-xs sm:text-sm font-medium text-white/90 group-hover/stat:text-white transition-colors duration-300">
                      ${formatNumber(token.volume24h)}
                    </p>
                  </div>
                  <div className="group/stat hover:bg-dark-300/30 p-2 rounded-lg transition-colors duration-300">
                    <p className="font-accent text-[clamp(0.65rem,2vw,0.75rem)] sm:text-sm text-white/50 mb-0.5 group-hover/stat:text-white/70 transition-colors duration-300">
                      Contract
                    </p>
                    <CopyToClipboard text={token.contractAddress}>
                      <div className="flex items-center gap-1 sm:gap-2 group/copy cursor-pointer">
                        <p className="font-mono text-[clamp(0.65rem,2vw,0.75rem)] sm:text-sm text-white/70 truncate max-w-[150px] sm:max-w-full group-hover/copy:text-white transition-colors duration-300">
                          {token.contractAddress}
                        </p>
                        <span className="text-[clamp(0.65rem,2vw,0.75rem)] sm:text-sm text-white/30 group-hover/copy:text-white/50 shrink-0 transition-colors duration-300">
                          📋
                        </span>
                      </div>
                    </CopyToClipboard>
                  </div>
                </div>

                {/* Admin Controls */}
                {user?.is_admin && (
                  <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-white/10">
                    <Button
                      onClick={handleDeleteClick}
                      variant="primary"
                      size="sm"
                      className="w-full bg-red-500 hover:bg-red-600 text-xs sm:text-sm py-1.5 sm:py-2 group-hover:shadow-lg group-hover:shadow-red-500/20 transition-shadow duration-300 font-accent"
                    >
                      Remove Token
                    </Button>
                  </div>
                )}

                {/* Social links */}
                {token.socials &&
                  Object.values(token.socials).some((s) => s?.url) && (
                    <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-white/10">
                      <div className="flex gap-2 sm:gap-3">
                        {token.socials.twitter?.url && (
                          <a
                            href={token.socials.twitter.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-accent text-[clamp(0.65rem,2vw,0.75rem)] sm:text-sm text-white/50 hover:text-brand-400 transition-all duration-300 hover:scale-110"
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
                            className="font-accent text-[clamp(0.65rem,2vw,0.75rem)] sm:text-sm text-white/50 hover:text-brand-400 transition-all duration-300 hover:scale-110"
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
                            className="font-accent text-[clamp(0.65rem,2vw,0.75rem)] sm:text-sm text-white/50 hover:text-brand-400 transition-all duration-300 hover:scale-110"
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

      <DeleteTokenModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        tokenAddress={token.contractAddress}
        tokenSymbol={token.symbol}
      />
    </>
  );
};
