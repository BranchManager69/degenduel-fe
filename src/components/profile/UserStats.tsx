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
        <h3 className="text-lg font-semibold text-gray-100">
          Performance Overview
        </h3>
      </div>
      <div className="p-6 pt-0">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 backdrop-blur-sm border border-dark-300/20 rounded-lg">
            <div className="text-sm text-gray-400">Total Winnings</div>
            <div className="text-xl font-bold text-brand-400">
              {formatCurrency(totalWinnings)} SOL
            </div>
          </div>
          <div className="p-4 backdrop-blur-sm border border-dark-300/20 rounded-lg">
            <div className="text-sm text-gray-400">Contests Played</div>
            <div className="text-xl font-bold text-gray-100">
              {contestsPlayed || "None"}
            </div>
          </div>
          <div className="p-4 backdrop-blur-sm border border-dark-300/20 rounded-lg">
            <div className="text-sm text-gray-400">Contests Won</div>
            <div className="text-xl font-bold text-brand-400">
              {contestsWon || "None"}
            </div>
          </div>
          <div className="p-4 backdrop-blur-sm border border-dark-300/20 rounded-lg">
            <div className="text-sm text-gray-400">Win Rate</div>
            <div className="text-xl font-bold text-gray-100">
              {winRate ? `${winRate}%` : "N/A"}
            </div>
          </div>
          <div className="p-4 backdrop-blur-sm border border-dark-300/20 rounded-lg">
            <div className="text-sm text-gray-400">Average Return</div>
            <div className="text-xl font-bold text-green-400">
              {averageReturn ? `${averageReturn}%` : "N/A"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
