// src/components/layout/LiveContestTicker.tsx

import { formatDistanceToNow } from "date-fns";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useStore } from "../../store/useStore";
import type { Contest } from "../../types/index";

interface Props {
  contests: Contest[];
  loading: boolean;
  isCompact?: boolean;
}

export const LiveContestTicker: React.FC<Props> = ({
  contests,
  loading,
  isCompact = false,
}) => {
  const { maintenanceMode } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    // Remove any existing clones first
    const existingClones = containerRef.current.querySelectorAll(".clone");
    existingClones.forEach((clone) => clone.remove());

    // Clone items to create seamless loop
    const content = contentRef.current;
    const clone = content.cloneNode(true) as HTMLDivElement;
    clone.classList.add("clone"); // Add class to identify clones
    containerRef.current.appendChild(clone);

    return () => {
      // Cleanup clones when component unmounts or deps change
      if (containerRef.current) {
        const clones = containerRef.current.querySelectorAll(".clone");
        clones.forEach((clone) => clone.remove());
      }
    };
  }, [contests, maintenanceMode]);

  if (maintenanceMode) {
    return (
      <div className="bg-dark-200/60 backdrop-blur-sm h-8 border-y border-yellow-400/20 overflow-hidden whitespace-nowrap relative w-full">
        <div
          ref={containerRef}
          className="inline-flex items-center w-full"
          style={{
            animation: "ticker 30s linear infinite",
            animationPlayState: isPaused ? "paused" : "running",
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            ref={contentRef}
            className="inline-flex items-center space-x-8 px-4 flex-shrink-0"
          >
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="inline-flex items-center space-x-4 text-sm"
              >
                <span className="text-yellow-400 font-mono">
                  ⚠ DUELS PAUSED
                </span>
                <span className="text-yellow-400/75 font-mono">
                  MAINTENANCE IN PROGRESS
                </span>
                <span className="text-yellow-400/50 font-mono">
                  PLEASE DEGEN ELSEWHERE
                </span>
                <span
                  className="font-mono text-yellow-400/75"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(-45deg, #000 0, #000 10px, #fbbf24 10px, #fbbf24 20px)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  ▰▰▰▰▰▰▰▰
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Sort contests: active first, then pending // TODO: pick a better sorting method
  const sortedContests = [...contests].sort((a, b) => {
    const statusOrder = { active: 0, pending: 1, completed: 2, cancelled: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // TODO: improve the loading state
  if (loading) {
    return (
      <div className="bg-dark-200/60 backdrop-blur-sm h-8 border-y border-dark-300">
        <div className="animate-pulse h-full bg-dark-300/50" />
      </div>
    );
  }

  // TODO: improve the empty state
  if (sortedContests.length === 0) {
    return (
      <div className="bg-dark-200/60 backdrop-blur-sm h-8 border-y border-dark-300 overflow-hidden whitespace-nowrap relative w-full">
        <div
          ref={containerRef}
          className="inline-flex items-center w-full"
          style={{
            animation: "ticker 30s linear infinite",
            animationPlayState: isPaused ? "paused" : "running",
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            ref={contentRef}
            className="inline-flex items-center space-x-8 px-4 flex-shrink-0"
          >
            {[...Array(3)].map((_, index) => (
              <div
                key={index}
                className="inline-flex items-center space-x-4 text-sm text-gray-400"
              >
                <span>There are no featured duels right now.</span>
                <span className="text-gray-500">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Live Contest Ticker (edge-to-edge)
  return (
    <div className="relative w-full overflow-hidden block">
      {/* Dark base layer */}
      <div className="absolute inset-0 bg-dark-200/60" />

      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/40 via-brand-500/20 to-brand-900/40" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(68,0,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine opacity-30" />
      </div>

      {/* Animated scan effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(99,102,241,0.05)_50%,transparent_100%)] animate-scan-fast opacity-30" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(99,102,241,0.05)_50%,transparent_100%)] animate-scan-vertical opacity-30" />
        <div
          className="absolute inset-x-0 h-1/2 bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-cyber-scan"
          style={{ animationDuration: "3s" }}
        />
      </div>

      {/* Glowing borders with gradient */}
      <div className="absolute inset-x-0 top-0">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" />
        <div className="h-[2px] bg-gradient-to-b from-brand-400/30 to-transparent blur-sm" />
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-cyber-400/50 to-transparent" />
        <div className="h-[2px] bg-gradient-to-b from-cyber-400/30 to-transparent blur-sm" />
      </div>

      {/* Content container */}
      <div
        className={`relative transition-all duration-200 ease-out ${
          isCompact ? "h-6" : "h-8"
        }`}
      >
        <div className="h-full overflow-hidden whitespace-nowrap">
          {/* Parent Container */}
          <div
            ref={containerRef}
            className="inline-flex items-center w-full"
            style={{
              animation: "ticker 20s linear infinite",
              animationPlayState: isPaused ? "paused" : "running",
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          >
            {/* Content Container */}
            <div
              ref={contentRef}
              className={`inline-flex items-center space-x-8 px-4 flex-shrink-0 transition-all duration-200 ease-out
                ${isCompact ? "text-xs" : "text-sm"}`}
            >
              {sortedContests.map((contest) => {
                return (
                  <Link
                    key={contest.id}
                    to={`/contests/${contest.id}`}
                    className={`group/item relative inline-flex items-center space-x-2 hover:bg-dark-300/50 px-2 py-1 rounded transition-all duration-300 ${
                      contest.status === "cancelled"
                        ? "line-through opacity-60"
                        : ""
                    }`}
                    title={contest.description}
                  >
                    {/* Hover background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 animate-data-stream rounded" />

                    {/* Status-based Contest Indicator */}
                    {contest.status === "active" ? (
                      <span className="inline-flex items-center text-green-400 group-hover/item:text-green-300 space-x-1.5 transition-colors">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        <span className="font-bold animate-pulse group-hover/item:text-green-300 transition-colors">
                          LIVE NOW
                        </span>
                      </span>
                    ) : contest.status === "pending" ? (
                      <span className="inline-flex items-center text-cyber-400 group-hover/item:text-cyber-300 space-x-1.5 transition-colors">
                        <span className="relative flex h-2 w-2">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-500 animate-pulse" />
                        </span>
                        <span className="font-bold group-hover/item:text-cyber-300 transition-colors">
                          OPEN
                        </span>
                      </span>
                    ) : contest.status === "completed" ? (
                      <span className="text-green-400/50 group-hover/item:text-green-300 font-medium transition-colors">
                        ENDED
                      </span>
                    ) : (
                      <span className="text-red-400/50 group-hover/item:text-red-300 font-medium transition-colors">
                        CANCELLED
                      </span>
                    )}

                    {/* Contest Name */}
                    <span
                      className={`font-medium transition-colors ${
                        contest.status === "active"
                          ? "text-gray-300 group-hover/item:text-gray-200"
                          : contest.status === "pending"
                            ? "text-gray-300 group-hover/item:text-gray-200"
                            : contest.status === "completed"
                              ? "text-green-300/50 group-hover/item:text-green-200"
                              : "text-red-300/50 group-hover/item:text-red-200"
                      }`}
                    >
                      {contest.name}
                    </span>

                    {/* Solana amounts with gradient text */}
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-sm bg-gradient-to-r ${
                          contest.status === "active"
                            ? "from-cyber-400 to-brand-400"
                            : contest.status === "pending"
                              ? "from-green-400 to-brand-400"
                              : contest.status === "completed"
                                ? "from-green-600/50 to-brand-400/50"
                                : "from-red-400/50 to-brand-400/50"
                        } bg-clip-text text-transparent group-hover/item:animate-gradientX`}
                      >
                        {Number(contest.entry_fee)} SOL
                      </span>
                    </div>

                    {/* Integrated Progress Bar with Entry Count */}
                    <div className="flex flex-col items-center gap-0.5 ml-2">
                      {/* Entry Count */}
                      <div className="text-[10px] text-gray-400 group-hover/item:text-gray-300 transition-colors">
                        {contest.participant_count}/{contest.max_participants}
                      </div>
                      {/* Enhanced Progress Bar */}
                      <div className="relative h-1 w-16 bg-dark-300/50 rounded-full overflow-hidden group/progress">
                        {/* Background Pulse Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-scan-fast" />
                        {/* Progress Fill */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500 ${
                            contest.status === "active"
                              ? "bg-gradient-to-r from-cyber-400 to-brand-400"
                              : contest.status === "pending"
                                ? "bg-gradient-to-r from-green-400 to-brand-400"
                                : contest.status === "completed"
                                  ? "bg-gradient-to-r from-green-600/50 to-brand-400/50"
                                  : "bg-gradient-to-r from-red-400/50 to-brand-400/50"
                          }`}
                          style={{
                            width: `${
                              (contest.participant_count /
                                contest.max_participants) *
                              100
                            }%`,
                          }}
                        >
                          {/* Shine Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine" />
                        </div>
                        {/* Hover Glow Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover/progress:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 blur-sm" />
                      </div>
                    </div>

                    {/* Enhanced Tooltip */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -top-24 min-w-[300px] opacity-0 invisible 
                        group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 z-[100]"
                    >
                      <div
                        className="relative bg-dark-200/95 backdrop-blur-sm border border-brand-500/20 
                          rounded-lg p-3 shadow-xl shadow-black/50"
                      >
                        <div className="mb-1 font-bold text-brand-400 group-hover/item:text-brand-300 transition-colors">
                          Contest Details
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {contest.description}
                        </p>
                        <div
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 
                            bg-dark-200/95 border-r border-b border-brand-500/20 
                            transform rotate-45 shadow-xl"
                        />
                      </div>
                    </div>

                    {/* Time Info with enhanced styling */}
                    {(contest.status === "active" ||
                      contest.status === "pending" ||
                      contest.status === "cancelled" ||
                      contest.status === "completed") && (
                      <span
                        className={`text-sm ${
                          contest.status === "active"
                            ? "text-gray-500 group-hover/item:text-gray-400"
                            : "text-gray-500 group-hover/item:text-gray-400"
                        } transition-colors`}
                      >
                        {/* Handle different status cases */}
                        {contest.status === "active" && (
                          <>
                            Ends{" "}
                            {contest.end_time
                              ? formatDistanceToNow(
                                  new Date(contest.end_time),
                                  {
                                    addSuffix: true,
                                  },
                                )
                              : "N/A"}
                          </>
                        )}
                        {contest.status === "pending" && (
                          <>
                            Starts{" "}
                            {contest.start_time
                              ? new Date(contest.start_time) < new Date()
                                ? "soon"
                                : formatDistanceToNow(
                                    new Date(contest.start_time),
                                    {
                                      addSuffix: true,
                                    },
                                  )
                              : "N/A"}
                          </>
                        )}
                        {contest.status === "cancelled" && (
                          <>
                            Cancelled{" "}
                            {formatDistanceToNow(
                              new Date(
                                contest.cancelled_at || contest.end_time,
                              ),
                              { addSuffix: true },
                            )}
                          </>
                        )}
                        {contest.status === "completed" && (
                          <>
                            Ended{" "}
                            {formatDistanceToNow(new Date(contest.end_time), {
                              addSuffix: true,
                            })}
                          </>
                        )}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
