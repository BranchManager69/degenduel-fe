import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../../lib/utils";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { useVisualTester } from "./VisualTester";

interface LeaderboardEntry {
  rank: number;
  username: string;
  portfolioValue: number;
  change24h: number;
  profilePicture?: string;
  isAiAgent?: boolean;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserRank?: number;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries: initialEntries,
  currentUserRank,
  className = "",
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [prevEntries, setPrevEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Simulate rank changes for animation purposes
  useEffect(() => {
    setPrevEntries(entries);
    setEntries(initialEntries);
    setHasAnimated(true);
  }, [initialEntries]);
  
  // Function to simulate leaderboard position shifts for testing
  const simulatePositionShift = useCallback(() => {
    // Create a copy of current entries
    const entriesCopy = [...entries];
    
    // Randomly shuffle some positions to simulate changes
    if (entriesCopy.length >= 2) {
      // Save current state as previous for animation reference
      setPrevEntries(entries);
      
      // Randomly pick two entries to swap
      const idx1 = Math.floor(Math.random() * entriesCopy.length);
      let idx2 = Math.floor(Math.random() * entriesCopy.length);
      
      // Make sure we pick different indices
      while (idx1 === idx2 && entriesCopy.length > 1) {
        idx2 = Math.floor(Math.random() * entriesCopy.length);
      }
      
      // Swap the ranks (not the array positions)
      const tempRank = entriesCopy[idx1].rank;
      entriesCopy[idx1].rank = entriesCopy[idx2].rank;
      entriesCopy[idx2].rank = tempRank;
      
      // Sort the array by rank to maintain order
      entriesCopy.sort((a, b) => a.rank - b.rank);
      
      // Also randomize some of the percentage changes
      entriesCopy.forEach(entry => {
        // 50% chance to update a percentage
        if (Math.random() > 0.5) {
          const change = (Math.random() * 10) - 5; // Random change between -5% and +5%
          entry.change24h = Number((entry.change24h + change).toFixed(2));
        }
      });
      
      // Update the entries state with our modified copy
      setEntries(entriesCopy);
      setHasAnimated(true);
    }
  }, [entries]);
  
  // Hook into the visual tester to trigger position shifts
  useVisualTester('leaderboardShift', simulatePositionShift);

  // Get previous rank for animating position changes
  const getPrevRank = (username: string) => {
    const prevEntry = prevEntries.find(entry => entry.username === username);
    return prevEntry ? prevEntry.rank : -1;
  };

  // Get animation type for rank changes
  const getAnimationType = (username: string) => {
    if (!hasAnimated) return "none";
    
    const currentRank = entries.find(entry => entry.username === username)?.rank || 0;
    const prevRank = getPrevRank(username);
    
    if (prevRank === -1) return "new";
    if (currentRank < prevRank) return "up";
    if (currentRank > prevRank) return "down";
    return "same";
  };

  // Default profile picture URL if none provided
  const getProfilePicture = (entry: LeaderboardEntry) => {
    if (entry.profilePicture) return entry.profilePicture;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`;
  };

  // Rank badge styling
  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40";
    if (rank === 2) return "bg-slate-400/20 text-slate-300 border border-slate-400/40";
    if (rank === 3) return "bg-amber-600/20 text-amber-400 border border-amber-600/40";
    return "bg-dark-400/70 text-gray-400 border border-dark-500/40";
  };

  return (
    <Card className={`bg-dark-200/50 backdrop-blur-sm border-dark-300 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-bold text-gray-100 flex items-center">
            Leaderboard
            <motion.div
              className="inline-block ml-2"
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5 }}
            >
              🏆
            </motion.div>
          </h3>
          <Badge variant="default" className="font-mono">LIVE</Badge>
        </div>
        <div className="text-xs text-gray-400">Position | Trader | Portfolio | Change</div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <AnimatePresence>
            {entries.map((entry) => {
              const animationType = getAnimationType(entry.username);
              
              return (
                <motion.div
                  key={entry.username}
                  initial={{ 
                    opacity: animationType === "new" ? 0 : 1,
                    y: animationType === "new" ? 20 : 0,
                    backgroundColor: animationType === "new" ? "rgba(16, 185, 129, 0.2)" : "transparent"
                  }}
                  animate={{ 
                    opacity: 1,
                    y: 0,
                    backgroundColor: "transparent",
                    transition: { duration: 0.5 }
                  }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
                  layout
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    entry.rank === currentUserRank
                      ? "bg-brand-500/20 border border-brand-500/30"
                      : entry.isAiAgent
                        ? "bg-cyber-500/20 border border-cyber-400/30"
                        : "bg-dark-300/50 hover:bg-dark-300/70 transition-colors"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {/* Rank Change Indicator */}
                      {animationType === "up" && (
                        <motion.div 
                          className="absolute -top-3 -right-1 text-green-400 text-xs"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          ▲
                        </motion.div>
                      )}
                      {animationType === "down" && (
                        <motion.div 
                          className="absolute -top-3 -right-1 text-red-400 text-xs"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          ▼
                        </motion.div>
                      )}
                      
                      {/* Rank Badge */}
                      <motion.div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-mono ${getRankBadgeStyle(entry.rank)}`}
                        initial={{ scale: animationType !== "none" ? 1.3 : 1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.4, type: "spring" }}
                      >
                        {entry.rank}
                      </motion.div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Profile Picture */}
                      <div className="relative">
                        <img
                          src={getProfilePicture(entry)}
                          alt={entry.username}
                          className={`w-7 h-7 rounded-full ${entry.isAiAgent ? "ring-2 ring-cyber-400" : ""}`}
                        />
                        {entry.isAiAgent && (
                          <div className="absolute -top-1 -right-1 bg-cyber-500 text-xs rounded-full w-4 h-4 flex items-center justify-center text-white border border-dark-300">
                            AI
                          </div>
                        )}
                      </div>
                      
                      {/* Username */}
                      <div>
                        <div className={`font-medium ${
                          entry.isAiAgent ? "text-cyber-300" : entry.rank === currentUserRank ? "text-brand-300" : "text-gray-100"
                        }`}>
                          {entry.username}
                          {entry.rank === currentUserRank && (
                            <span className="ml-1 text-xs text-brand-400">(You)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Portfolio Value */}
                    <div className="text-sm font-mono text-gray-300">
                      {formatCurrency(entry.portfolioValue)}
                    </div>
                    
                    {/* Change Percentage */}
                    <motion.div
                      className={`text-sm font-medium font-mono ${
                        entry.change24h >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                      animate={{ 
                        scale: animationType !== "none" && Math.abs(entry.change24h) > 10 ? [1, 1.1, 1] : 1,
                        opacity: [1, 0.8, 1]
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      {entry.change24h >= 0 ? "+" : ""}
                      {entry.change24h.toFixed(2)}%
                    </motion.div>
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