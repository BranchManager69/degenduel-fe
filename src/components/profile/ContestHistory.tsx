import React from "react";
import { Link } from "react-router-dom";

export interface ContestEntry {
  contest_id: number;
  contest_name: string;
  start_time: string;
  end_time: string;
  portfolio_return: string;
  rank: string;
}

interface ContestHistoryProps {
  contests: ContestEntry[];
}

export const ContestHistory: React.FC<ContestHistoryProps> = ({ contests }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="relative bg-dark-200/50 backdrop-blur-sm border-dark-300/20 rounded-lg overflow-hidden">
      {/* Matrix rain effect container */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent,rgba(99,102,241,0.2),transparent)] animate-matrix-rain" />
      </div>

      {/* Header with cyber effect */}
      <div className="relative p-6 border-b border-dark-300/20">
        <h3 className="text-lg font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
          Contest History
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
        </h3>
      </div>

      <div className="relative">
        {contests.length > 0 ? (
          <div className="space-y-1">
            {contests.map((contest, index) => (
              <Link
                key={contest.contest_id}
                to={`/contests/${contest.contest_id}/results`}
                className="block group relative"
              >
                {/* Digital portal effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-scan-fast" />

                <div className="relative p-4 transition-colors duration-300 hover:bg-dark-300/30">
                  {/* Connector line */}
                  <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-brand-400/30 to-transparent group-hover:via-brand-400/50 transition-colors duration-300" />

                  {/* Time node */}
                  <div className="absolute left-[-4px] top-1/2 transform -translate-y-1/2 w-[10px] h-[10px] rounded-full bg-dark-300 border border-brand-400/30 group-hover:border-brand-400 group-hover:bg-brand-400/20 transition-all duration-300">
                    {/* Pulse effect */}
                    <div className="absolute inset-0 rounded-full bg-brand-400/30 group-hover:animate-ping" />
                  </div>

                  <div className="ml-6 space-y-2">
                    {/* Contest name with glitch effect */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-medium text-gray-100 group-hover:text-brand-400 transition-colors relative">
                          <span className="relative z-10 group-hover:animate-glitch">
                            {contest.contest_name}
                          </span>
                        </h4>
                        <div className="text-sm text-gray-400 font-mono">
                          <span className="inline-block group-hover:animate-pulse">
                            &lt;
                          </span>
                          {formatDate(contest.start_time)}
                          <span className="mx-2">→</span>
                          {formatDate(contest.end_time)}
                          <span className="inline-block group-hover:animate-pulse">
                            /&gt;
                          </span>
                        </div>
                      </div>

                      {/* Rank display with cyber effect */}
                      <div className="text-right">
                        <div className="font-medium text-gray-100 group-hover:text-brand-300 transition-colors">
                          {contest.rank !== "-" ? (
                            <>
                              <span className="text-sm text-gray-400">
                                Rank:
                              </span>{" "}
                              <span className="font-cyber">{contest.rank}</span>
                            </>
                          ) : (
                            <span className="text-sm font-cyber animate-pulse">
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Performance metrics with energy effect */}
                    <div className="flex items-center space-x-2">
                      <div
                        className={`h-1 flex-grow rounded-full overflow-hidden bg-dark-300 relative group-hover:bg-dark-400/50 transition-colors`}
                      >
                        <div
                          className={`absolute inset-y-0 left-0 ${
                            parseFloat(contest.portfolio_return) >= 0
                              ? "bg-green-400"
                              : "bg-red-400"
                          } transition-all duration-300 group-hover:animate-pulse`}
                          style={{
                            width: `${Math.min(
                              Math.abs(parseFloat(contest.portfolio_return)) *
                                2,
                              100
                            )}%`,
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        </div>
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          parseFloat(contest.portfolio_return) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        } font-mono group-hover:animate-pulse`}
                      >
                        {contest.portfolio_return}%
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 relative">
            <div className="text-gray-400 font-cyber relative z-10">
              No contests played yet. Join a contest to start building your
              history!
            </div>
            {/* Empty state effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-400/5 to-transparent animate-scan" />
          </div>
        )}
      </div>
    </div>
  );
};
