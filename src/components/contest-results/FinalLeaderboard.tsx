import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";

import { formatCurrency } from "../../lib/utils";
import { Card, CardContent, CardHeader } from "../ui/Card";

interface LeaderboardEntry {
  rank: number;
  username: string;
  portfolioValue: string;
  performancePercentage: string;
  prizeAwarded: string | null;
  profilePictureUrl?: string | null;
  isAiAgent?: boolean;
  isCurrentUser?: boolean;
}

interface FinalLeaderboardProps {
  entries: LeaderboardEntry[];
}

export const FinalLeaderboard: React.FC<FinalLeaderboardProps> = ({
  entries: initialEntries,
}) => {
  const [entries, setEntries] = useState(initialEntries);
  
  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);
  
  const { maxReturn, minReturn } = useMemo(() => {
    return entries.reduce(
      (acc, entry) => {
        const perf = parseFloat(entry.performancePercentage);
        return {
          maxReturn: Math.max(acc.maxReturn, perf),
          minReturn: Math.min(acc.minReturn, perf),
        };
      },
      { maxReturn: -Infinity, minReturn: Infinity },
    );
  }, [entries]);

  const getBackgroundColor = (performancePercentageStr: string) => {
    const returnValue = parseFloat(performancePercentageStr);
    if (returnValue === 0) return "bg-dark-300/50";
    const safeMaxReturn = maxReturn === 0 ? 1 : maxReturn;
    const safeMinReturn = minReturn === 0 ? -1 : minReturn;

    if (returnValue > 0) {
      const intensity = Math.min(Math.round((returnValue / safeMaxReturn) * 100), 100);
      return `bg-gradient-to-r from-green-500/${intensity}`;
    } else {
      const intensity = Math.min(Math.round((returnValue / safeMinReturn) * 100), 100);
      return `bg-gradient-to-r from-red-500/${intensity}`;
    }
  };
  
  const getProfilePicture = (entry: LeaderboardEntry) => {
    if (entry.profilePictureUrl) return entry.profilePictureUrl;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`;
  };

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100 flex items-center">
          Final Rankings
          <motion.div
            className="inline-block ml-2"
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5 }}
          >
            🏆
          </motion.div>
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <AnimatePresence>
            {entries.map((entry) => {
              const numericPortfolioValue = parseFloat(entry.portfolioValue);
              const numericPerformancePercentage = parseFloat(entry.performancePercentage);
              const numericPrizeAwarded = parseFloat(entry.prizeAwarded || "0");

              return (
                <motion.div
                  key={entry.username}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    layout: { type: "spring", duration: 0.6 },
                    opacity: { duration: 0.3 },
                  }}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    getBackgroundColor(entry.performancePercentage)
                  } ${entry.isCurrentUser ? "ring-2 ring-brand-500" : ""}`}
                >
                  <div className="flex items-center space-x-4">
                    <img 
                        src={getProfilePicture(entry)} 
                        alt={entry.username} 
                        className="w-10 h-10 rounded-full object-cover bg-gray-700 p-0.5"
                    />
                    <motion.div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        entry.rank === 1 ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" :
                        entry.rank === 2 ? "bg-slate-400/20 text-slate-300 border border-slate-400/40" :
                        entry.rank === 3 ? "bg-amber-600/20 text-amber-400 border border-amber-600/40" :
                        "bg-dark-400/50 text-gray-400 border border-dark-500/40"
                      }`}
                    >
                      {entry.rank}
                    </motion.div>
                    <div>
                      <div className="font-medium text-gray-100">
                        {entry.username}
                        {entry.isCurrentUser && (
                          <span className="ml-1 text-xs text-brand-400">(You)</span>
                        )}
                      </div>
                      <motion.div
                        className={`text-sm ${
                          numericPerformancePercentage >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {numericPerformancePercentage >= 0 ? "+" : ""}
                        {numericPerformancePercentage.toFixed(2)}%
                      </motion.div>
                    </div>
                  </div>
                  <div className="text-right">
                    <motion.div className="font-bold text-gray-100">
                      {formatCurrency(numericPortfolioValue)}
                    </motion.div>
                    {numericPrizeAwarded > 0 && (
                      <motion.div className="text-sm text-brand-400">
                        Won: {formatCurrency(numericPrizeAwarded)}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};
