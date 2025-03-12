import React, { useMemo } from "react";

import { formatCurrency } from "../../lib/utils";
import { Card, CardHeader, CardContent } from "../ui/Card";

interface LeaderboardEntry {
  rank: number;
  username: string;
  finalValue: number;
  totalReturn: number;
  prize: number;
}

interface FinalLeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserRank?: number;
}

export const FinalLeaderboard: React.FC<FinalLeaderboardProps> = ({
  entries,
  currentUserRank,
}) => {
  const { maxReturn, minReturn } = useMemo(() => {
    return entries.reduce(
      (acc, entry) => ({
        maxReturn: Math.max(acc.maxReturn, entry.totalReturn),
        minReturn: Math.min(acc.minReturn, entry.totalReturn),
      }),
      { maxReturn: -Infinity, minReturn: Infinity },
    );
  }, [entries]);

  const getBackgroundColor = (returnValue: number) => {
    if (returnValue === 0) return "bg-dark-300/50";

    if (returnValue > 0) {
      const intensity = (returnValue / maxReturn) * 100;
      return `bg-gradient-to-r from-green-500/${Math.round(intensity)}`;
    } else {
      const intensity = (returnValue / minReturn) * 100;
      return `bg-gradient-to-r from-red-500/${Math.round(intensity)}`;
    }
  };

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100">Final Rankings</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.username}
              className={`flex items-center justify-between p-4 rounded-lg transition-colors ${getBackgroundColor(
                entry.totalReturn,
              )} ${entry.rank === currentUserRank ? "ring-2 ring-brand-500" : ""}`}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    entry.rank <= 3
                      ? "bg-brand-500/20 text-brand-300"
                      : "bg-dark-400/50 text-gray-400"
                  }`}
                >
                  {entry.rank}
                </div>
                <div>
                  <div className="font-medium text-gray-100">
                    {entry.username}
                  </div>
                  <div
                    className={`text-sm ${
                      entry.totalReturn >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {entry.totalReturn >= 0 ? "+" : ""}
                    {entry.totalReturn.toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-100">
                  {formatCurrency(Math.round(entry.finalValue))}
                </div>
                {entry.prize > 0 && (
                  <div className="text-sm text-brand-400">
                    Won: {formatCurrency(Math.round(entry.prize))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
