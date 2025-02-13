import React from "react";
import { formatCurrency } from "../../lib/utils";

interface UserStatsProps {
  totalWinnings: number;
  contestsPlayed: number;
  contestsWon: number;
  winRate: number;
  averageReturn: number;
}

export const UserStats: React.FC<UserStatsProps> = ({
  totalWinnings = 0,
  contestsPlayed = 0,
  contestsWon = 0,
  winRate = 0,
  averageReturn = 0,
}) => {
  return (
    <div className="rounded-lg border shadow-sm backdrop-blur-sm border-dark-300/20">
      <div className="flex flex-col space-y-1.5 p-6">
        <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
          Lifetime Stats
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
        </h2>
      </div>
      <div className="p-6 pt-0">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 backdrop-blur-sm border border-dark-300/20 rounded-lg">
            <div className="text-sm text-brand-400">Total Winnings</div>
            <div className="text-xl font-bold text-gray-400">
              {formatCurrency(totalWinnings)}
            </div>
          </div>
          <div className="p-4 backdrop-blur-sm border border-dark-300/20 rounded-lg">
            <div className="text-sm text-brand-400">Duels Played</div>
            <div className="text-xl font-bold text-gray-400">
              {contestsPlayed || "None"}
            </div>
          </div>
          <div className="p-4 backdrop-blur-sm border border-dark-300/20 rounded-lg">
            <div className="text-sm text-brand-400">Duels Won</div>
            <div className="text-xl font-bold text-gray-400">
              {contestsWon || "None"}
            </div>
          </div>
          <div className="p-4 backdrop-blur-sm border border-dark-300/20 rounded-lg">
            <div className="text-sm text-brand-400">Win Rate</div>
            <div className="text-xl font-bold text-gray-400">
              {winRate ? `${winRate}%` : "N/A"}
            </div>
          </div>
          <div className="p-4 backdrop-blur-sm border border-dark-300/20 rounded-lg">
            <div className="text-sm text-brand-400">Average Return</div>
            <div className="text-xl font-bold text-gray-400">
              {averageReturn ? `${averageReturn}%` : "N/A"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
