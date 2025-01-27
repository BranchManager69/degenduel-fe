import React, { useEffect, useRef } from "react";
import type { Contest } from "../../types/index";

interface Props {
  contests: Contest[];
  loading: boolean;
}

export const LiveContestTicker: React.FC<Props> = ({ contests, loading }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    // Clone items to create seamless loop
    const content = contentRef.current;
    const clone = content.cloneNode(true) as HTMLDivElement;
    containerRef.current.appendChild(clone);
  }, [contests]);

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
    <div className="bg-dark-200/80 backdrop-blur-sm h-8 border-y border-dark-300 overflow-hidden whitespace-nowrap">
      <div
        ref={containerRef}
        className="inline-flex items-center animate-ticker"
      >
        <div
          ref={contentRef}
          className="inline-flex items-center space-x-8 px-4"
        >
          {sortedContests.map((contest) => {
            // Check if the contest is live
            const isLive = contest.status === "active";
            return (
              <div
                key={contest.id}
                className="inline-flex items-center space-x-2 text-sm"
              >
                {/* Check if the contest is live */}
                {isLive ? (
                  <span className="inline-flex items-center text-cyber-400 space-x-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-500" />
                    </span>
                    <span>LIVE</span>
                  </span>
                ) : (
                  // Check if the contest is new
                  <span className="text-neon-400">NEW</span>
                )}

                {/* Contest Name */}
                <span className="font-medium text-gray-200">
                  {contest.name}
                </span>

                {/* Contest Participants */}
                <span className="text-gray-400">
                  {contest.participant_count}/{contest.max_participants}
                </span>

                {/* Contest Prize Pool */}
                <span className="bg-gradient-to-r from-cyber-400 to-neon-400 text-transparent bg-clip-text">
                  {contest.prize_pool}◎
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
