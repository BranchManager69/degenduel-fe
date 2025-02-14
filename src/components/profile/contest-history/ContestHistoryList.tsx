import { formatDistanceToNow } from "date-fns";
import React from "react";
import { Link } from "react-router-dom";

interface ContestHistoryEntry {
  contest_id: string;
  contest_name: string;
  start_time: string;
  end_time: string;
  portfolio_return: number;
  rank: number;
}

interface ContestHistoryListProps {
  history: ContestHistoryEntry[];
}

export const ContestHistoryList: React.FC<ContestHistoryListProps> = ({
  history,
}) => {
  if (history.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-dark-300/20 backdrop-blur-sm relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <p className="text-gray-400 text-center group-hover:animate-cyber-pulse">
          No contest history yet. Join a contest to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-dark-300/20">
      {history.map((entry) => (
        <Link
          key={entry.contest_id}
          to={`/contests/${entry.contest_id}`}
          className="block p-4 hover:bg-dark-300/20 transition-colors relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center justify-between">
            <div>
              <h3 className="text-gray-200 font-medium group-hover:text-brand-400 transition-colors">
                {entry.contest_name}
              </h3>
              <p className="text-sm text-gray-400">
                Ended{" "}
                {formatDistanceToNow(new Date(entry.end_time), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className="text-right">
              <div
                className={`text-lg font-medium ${
                  entry.portfolio_return >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {entry.portfolio_return >= 0 ? "+" : ""}
                {entry.portfolio_return.toFixed(2)}%
              </div>
              <p className="text-sm text-gray-400">Rank: #{entry.rank}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};
