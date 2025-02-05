// src/components/ui/LiveContestTicker.tsx

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
      <div className="bg-dark-200/80 backdrop-blur-sm h-8 border-y border-yellow-400/20 overflow-hidden whitespace-nowrap relative">
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
                  ⚠ SYSTEM MAINTENANCE
                </span>
                <span className="text-yellow-400/75 font-mono">
                  UPGRADING SYSTEMS
                </span>
                <span className="text-yellow-400/50 font-mono">
                  PLEASE STAND BY
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

  // Sort contests: active first, then pending
  const sortedContests = [...contests].sort((a, b) => {
    const statusOrder = { active: 0, pending: 1, completed: 2, cancelled: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  if (loading) {
    return (
      <div className="bg-dark-200/80 backdrop-blur-sm h-8 border-y border-dark-300">
        <div className="animate-pulse h-full bg-dark-300/50" />
      </div>
    );
  }

  if (sortedContests.length === 0) {
    return (
      <div className="bg-dark-200/80 backdrop-blur-sm h-8 border-y border-dark-300 flex items-center justify-center text-sm text-gray-400">
        No contests available
      </div>
    );
  }

  return (
    <div className="bg-dark-200/80 backdrop-blur-sm h-8 border-y border-dark-300 overflow-hidden whitespace-nowrap relative">
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
          {sortedContests.map((contest) => {
            const isLive = contest.status === "active";
            return (
              <Link
                key={contest.id}
                to={`/contests/${contest.id}`}
                className="inline-flex items-center space-x-2 text-sm hover:bg-dark-300/50 px-2 py-1 rounded transition-colors"
              >
                {isLive ? (
                  <span className="inline-flex items-center text-cyber-400 space-x-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-500" />
                    </span>
                    <span>LIVE</span>
                  </span>
                ) : (
                  <span className="text-neon-400">NEW</span>
                )}
                <span className="font-medium text-gray-200 hover:text-brand-400 transition-colors">
                  {contest.name}
                </span>
                <span className="text-gray-400">
                  {contest.participant_count}/{contest.max_participants}
                </span>
                <span className="bg-gradient-to-r from-cyber-400 to-neon-400 text-transparent bg-clip-text">
                  {contest.prize_pool}◎
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
