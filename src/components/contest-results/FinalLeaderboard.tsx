import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { formatCurrency } from "../../lib/utils";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { useVisualTester } from "../contest-lobby/VisualTester";

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
  entries: initialEntries,
  currentUserRank,
}) => {
  // State for entries so we can modify them for visual testing
  const [entries, setEntries] = useState(initialEntries);
  
  // Make sure we update when props change
  React.useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);
  
  // Calculate max and min returns for color scaling
  const { maxReturn, minReturn } = useMemo(() => {
    return entries.reduce(
      (acc, entry) => ({
        maxReturn: Math.max(acc.maxReturn, entry.totalReturn),
        minReturn: Math.min(acc.minReturn, entry.totalReturn),
      }),
      { maxReturn: -Infinity, minReturn: Infinity },
    );
  }, [entries]);
  
  // Handler for leaderboard test
  const handleLeaderboardShift = useCallback(() => {
    if (entries.length >= 2) {
      // Create a copy of current entries
      const entriesCopy = [...entries];
      
      // Randomly pick two entries to swap
      const idx1 = Math.floor(Math.random() * entriesCopy.length);
      let idx2 = Math.floor(Math.random() * entriesCopy.length);
      
      // Make sure we pick different indices
      while (idx1 === idx2 && entriesCopy.length > 1) {
        idx2 = Math.floor(Math.random() * entriesCopy.length);
      }
      
      // Swap the entries
      const temp = entriesCopy[idx1];
      entriesCopy[idx1] = entriesCopy[idx2];
      entriesCopy[idx2] = temp;
      
      // Update ranks
      entriesCopy.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      
      // Update the entries state with our modified copy
      setEntries(entriesCopy);
    }
  }, [entries]);
  
  // Handler for celebration test
  const handleFlashCelebration = useCallback(() => {
    const entriesCopy = [...entries];
    
    // Add random amount to final values (simulating price changes)
    entriesCopy.forEach(entry => {
      const change = (Math.random() * 0.2 + 0.9); // Random multiplier between 0.9 and 1.1
      entry.finalValue = Math.round(entry.finalValue * change);
      entry.totalReturn = entry.totalReturn + (Math.random() * 5 - 2.5); // Adjust by -2.5% to +2.5%
    });
    
    // Sort by final value
    entriesCopy.sort((a, b) => b.finalValue - a.finalValue);
    
    // Update ranks
    entriesCopy.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    setEntries(entriesCopy);
  }, [entries]);
  
  // Connect to visual tester
  useVisualTester('leaderboardShift', handleLeaderboardShift);
  useVisualTester('flashCelebration', handleFlashCelebration);

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
            {entries.map((entry) => (
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
                className={`flex items-center justify-between p-4 rounded-lg transition-colors ${getBackgroundColor(
                  entry.totalReturn,
                )} ${entry.rank === currentUserRank ? "ring-2 ring-brand-500" : ""}`}
              >
                <div className="flex items-center space-x-4">
                  <motion.div
                    initial={{ scale: 1.3 }}
                    animate={{ scale: 1 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      entry.rank === 1
                        ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                        : entry.rank === 2
                        ? "bg-slate-400/20 text-slate-300 border border-slate-400/40"
                        : entry.rank === 3
                        ? "bg-amber-600/20 text-amber-400 border border-amber-600/40"
                        : "bg-dark-400/50 text-gray-400 border border-dark-500/40"
                    }`}
                  >
                    {entry.rank}
                  </motion.div>
                  <div>
                    <div className="font-medium text-gray-100">
                      {entry.username}
                      {entry.rank === currentUserRank && (
                        <span className="ml-1 text-xs text-brand-400">(You)</span>
                      )}
                    </div>
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                      }}
                      transition={{ duration: 0.5 }}
                      className={`text-sm ${
                        entry.totalReturn >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {entry.totalReturn >= 0 ? "+" : ""}
                      {entry.totalReturn.toFixed(2)}%
                    </motion.div>
                  </div>
                </div>
                <div className="text-right">
                  <motion.div 
                    className="font-bold text-gray-100"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.5 }}
                  >
                    {formatCurrency(Math.round(entry.finalValue))}
                  </motion.div>
                  {entry.prize > 0 && (
                    <motion.div 
                      className="text-sm text-brand-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Won: {formatCurrency(Math.round(entry.prize))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};
