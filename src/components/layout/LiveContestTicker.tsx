// src/components/ui/LiveContestTicker.tsx

import { formatDistanceToNow } from "date-fns";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../store/useStore";
import type { Contest } from "../../types/index";

interface Props {
  contests: Contest[];
  loading: boolean;
}

export const LiveContestTicker: React.FC<Props> = ({ contests, loading }) => {
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
      <div className="bg-dark-200/80 backdrop-blur-sm h-8 border-y border-yellow-400/20 overflow-hidden whitespace-nowrap relative w-full">
        <div
          ref={containerRef}
          className="inline-flex items-center"
          style={{
            animation: "ticker 30s linear infinite",
            animationPlayState: isPaused ? "paused" : "running",
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div
            ref={contentRef}
            className="inline-flex items-center space-x-8 px-4"
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
      <div className="bg-dark-200/80 backdrop-blur-sm h-8 border-y border-dark-300">
        <div className="animate-pulse h-full bg-dark-300/50" />
      </div>
    );
  }

  // TODO: improve the empty state
  if (sortedContests.length === 0) {
    return (
      <div className="bg-dark-200/80 backdrop-blur-sm h-8 border-y border-dark-300 flex items-center justify-center text-sm text-gray-400">
        Featured Duels are currently unavailable
      </div>
    );
  }

  // Live Contest Ticker (edge-to-edge)
  return (
    <div className="relative bg-dark-200/80 backdrop-blur-sm border-y border-dark-300 w-full">
      {/* Scrolling content container */}
      <div className="h-8 overflow-hidden whitespace-nowrap">
        {/* Parent Container */}
        <div
          ref={containerRef}
          className="inline-flex items-center"
          style={{
            animation: "ticker 30s linear infinite",
            animationPlayState: isPaused ? "paused" : "running",
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Content Container */}
          <div
            ref={contentRef}
            className="inline-flex items-center space-x-8 px-4"
          >
            {sortedContests.map((contest) => {
              return (
                <Link
                  key={contest.id}
                  to={`/contests/${contest.id}`}
                  className={`group/item relative inline-flex items-center space-x-2 text-sm hover:bg-dark-300/50 px-2 py-1 rounded transition-colors ${
                    contest.status === "cancelled"
                      ? "line-through opacity-60"
                      : ""
                  }`}
                  title={contest.description}
                >
                  {/* Status-based Contest Indicator */}
                  {contest.status === "active" ? (
                    <span className="inline-flex items-center text-cyber-400 hover:text-cyber-300 space-x-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-500" />
                      </span>
                      <span className="text-cyber-400 hover:text-cyber-300 font-bold animate-pulse">
                        LIVE NOW
                      </span>
                    </span>
                  ) : contest.status === "pending" ? (
                    <span className="inline-flex items-center text-green-400 hover:text-green-300 space-x-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      <span className="font-bold text-green-400 hover:text-green-300">
                        OPEN
                      </span>
                    </span>
                  ) : contest.status === "completed" ? (
                    <span className="text-green-400/50 hover:text-green-300 font-medium">
                      ENDED
                    </span>
                  ) : (
                    <span className="text-red-400/50 hover:text-red-300 font-medium">
                      CANCELLED
                    </span>
                  )}

                  {/* Contest Name */}
                  <span
                    className={`font-medium transition-colors ${
                      contest.status === "active"
                        ? "text-gray-300 hover:text-gray-200"
                        : contest.status === "pending"
                        ? "text-gray-300 hover:text-gray-200"
                        : contest.status === "completed"
                        ? "text-green-300/50 hover:text-green-200"
                        : "text-red-300/50 hover:text-red-200"
                    }`}
                  >
                    <span className="text-gray-300 hover:text-gray-200">
                      {contest.name}
                    </span>
                  </span>

                  {/* Solana amounts (e.g., entry fee, prize pool) */}
                  <div className="flex items-center gap-1">
                    {/* Entry Fee */}
                    <span
                      className={`text-sm ${
                        contest.status === "active"
                          ? "text-gray-400 hover:text-gray-300"
                          : contest.status === "pending"
                          ? "text-gray-400 hover:text-gray-300"
                          : contest.status === "completed"
                          ? "text-green-400/50 hover:text-green-300"
                          : "text-red-400/50 hover:text-red-300"
                      }`}
                    >
                      {Number(contest.entry_fee)} SOL
                    </span>
                  </div>

                  {/* Custom Tooltip */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 -top-24 min-w-[300px] opacity-0 invisible 
                      group-hover/item:opacity-100 group-hover/item:visible transition-all duration-200 z-[100]"
                  >
                    <div
                      className="relative bg-dark-200/95 backdrop-blur-sm border border-brand-500/20 
                        rounded-lg p-3 shadow-xl shadow-black/50"
                    >
                      <div className="mb-1 font-bold text-brand-400">
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

                  {/* Time Info */}
                  {(contest.status === "active" ||
                    contest.status === "pending" ||
                    contest.status === "cancelled" ||
                    contest.status === "completed") && (
                    <span
                      className={`text-sm ${
                        contest.status === "active"
                          ? "text-gray-500 hover:text-gray-400"
                          : "text-gray-500 hover:text-gray-400"
                      }`}
                    >
                      {/* Handle different status cases */}
                      {contest.status === "active" && (
                        <>
                          Ends{" "}
                          {contest.end_time
                            ? formatDistanceToNow(new Date(contest.end_time), {
                                addSuffix: true,
                              })
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
                                  }
                                )
                            : "N/A"}
                        </>
                      )}
                      {contest.status === "cancelled" && (
                        <>
                          Cancelled{" "}
                          {formatDistanceToNow(
                            new Date(contest.cancelled_at || contest.end_time),
                            { addSuffix: true }
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

                  {/* Contest Entry Stats */}
                  <div className="flex items-center gap-1.5">
                    {/* Entry Count */}
                    <span
                      className={`text-xs ${
                        contest.status === "active"
                          ? "text-neon-400 hover:text-neon-300"
                          : contest.status === "pending"
                          ? "text-neon-400 hover:text-neon-300"
                          : contest.status === "completed"
                          ? "text-green-600/50 hover:text-green-500"
                          : "text-red-400/50 hover:text-red-400"
                      }`}
                    >
                      {contest.participant_count} of {contest.max_participants}
                    </span>
                    {/* Entry Progress Bar */}
                    <div className="relative h-1.5 w-12 bg-dark-300 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 bottom-0 rounded-full transition-all ${
                          contest.status === "active"
                            ? "bg-cyber-400"
                            : contest.status === "pending"
                            ? "bg-cyber-400"
                            : contest.status === "completed"
                            ? "bg-green-600/50"
                            : "bg-red-400/50"
                        }`}
                        style={{
                          width: `${
                            (contest.participant_count /
                              contest.max_participants) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* All of the below are almost never visible so who cares */}

                  {/* Contest "Difficulty" */}
                  <span className="text-red-400">
                    {/* format: "{difficulty}" */}
                    {contest.settings.difficulty}
                  </span>

                  {/* Contest Cancelled At */}
                  <span className="text-orange-400">
                    {/* format: "{cancelled at}" */}
                    {contest.cancelled_at}
                  </span>

                  {/* Contest Cancellation Reason */}
                  <span className="text-red-400">
                    {/* format: "{cancellation reason}" */}
                    {contest.cancellation_reason}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
