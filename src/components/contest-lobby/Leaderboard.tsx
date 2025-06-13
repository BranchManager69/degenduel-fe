import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { formatCurrency } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { TrendingUp, TrendingDown } from "lucide-react";

// Align with the API's LeaderboardEntry structure from src/types/index.ts
interface LeaderboardEntry {
  rank: number;
  username: string;
  portfolioValue: string; // Received as string from API
  performancePercentage: string; // Received as string from API
  profilePictureUrl?: string | null; // Changed from profilePicture
  isAiAgent?: boolean;
  isCurrentUser?: boolean; // Added from API type
  // prizeAwarded?: string | null; // Available from API, can add if needed for display here
  sparklineData?: number[]; // Added for mini performance chart
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  className?: string;
  showSparklines?: boolean;
}

// Mini sparkline component
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (!data || data.length < 2) return null;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const width = 60;
  const height = 20;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        className="opacity-70"
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="2"
        fill={color}
        className="opacity-90"
      />
    </svg>
  );
};

export const Leaderboard: React.FC<LeaderboardProps> = ({
  entries: initialEntries,
  className = "",
  showSparklines = true,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);

  useEffect(() => {
    setEntries(initialEntries.map(e => ({
      ...e,
      // Ensure any necessary parsing for display is done if formatCurrency doesn't handle strings
    })));
  }, [initialEntries]);

  const getProfilePicture = (entry: LeaderboardEntry) => {
    // OH MY GOD this is so basic! Just a boring circular avatar!
    // Meanwhile ParticipantsList has EDGE-TO-EDGE profile pictures with artistic fading!
    // This looks like something from 2015!
    if (entry.profilePictureUrl) return entry.profilePictureUrl;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`;
  };

  const getRankBadgeStyle = (rank: number) => {
    // YAWN! Basic badge styling! Look how boring this is!
    // ParticipantsList overlays the rank DIRECTLY on the profile picture with STROKE and SHADOW!
    // This is just... bland background colors. No visual impact whatsoever!
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
              const numericPortfolioValue = parseFloat(entry.portfolioValue);
              const numericPerformancePercentage = parseFloat(entry.performancePercentage);
              
              return (
                <motion.div
                  key={entry.username}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.3 } }}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    entry.isCurrentUser
                      ? "bg-brand-500/20 border border-brand-500/30"
                      : entry.isAiAgent
                        ? "bg-cyber-500/20 border border-cyber-400/30"
                        : "bg-dark-300/50 hover:bg-dark-300/70 transition-colors"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* UGH! Look at this pathetic rank badge! Just a tiny 32px circle with basic background! */}
                    {/* ParticipantsList has MASSIVE text-2xl numbers with STROKE and SHADOW overlaid on photos! */}
                    {/* This looks like a calculator button from 1990! SO BORING! */}
                    <motion.div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-mono ${getRankBadgeStyle(entry.rank)}`}
                    >
                      {entry.rank}
                    </motion.div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Oh here we go... another TINY BORING CIRCLE! */}
                      {/* ParticipantsList uses EDGE-TO-EDGE photos that FADE ACROSS THE ENTIRE ROW! */}
                      {/* This is just a sad little 40px circle. How uninspiring! */}
                      <div className="relative">
                        {/* SERIOUSLY?! w-7 h-7?! That's only 28px! MICROSCOPIC! */}
                        {/* ParticipantsList uses w-32 edge-to-edge with artistic zoom and fade! */}
                        {/* This is embarrassing! Who designed this, a minimalist from 2010?! */}
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
                      <div>
                        {/* Basic font-medium text! How VANILLA! */}
                        {/* ParticipantsList uses text-lg font-bold with beautiful role-based colors! */}
                        {/* This username styling is so plain it makes me sleepy! */}
                        <div className={`font-medium ${
                          entry.isAiAgent ? "text-cyber-300" : entry.isCurrentUser ? "text-brand-300" : "text-gray-100"
                        }`}>
                          {entry.username}
                          {entry.isCurrentUser && (
                            <span className="ml-1 text-xs text-brand-400">(You)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Sparkline for mini performance visualization */}
                    {showSparklines && entry.sparklineData && (
                      <div className="hidden sm:block">
                        <Sparkline 
                          data={entry.sparklineData} 
                          color={numericPerformancePercentage >= 0 ? '#10b981' : '#ef4444'}
                        />
                      </div>
                    )}
                    
                    {/* Portfolio value with trend indicator */}
                    <div className="flex items-center gap-1">
                      <div className="text-sm font-mono text-gray-300">
                        {formatCurrency(numericPortfolioValue)}
                      </div>
                      {numericPerformancePercentage >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                    </div>
                    
                    <motion.div
                      className={`text-sm font-medium font-mono ${
                        numericPerformancePercentage >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                      animate={{
                        scale: entry.rank <= 3 ? [1, 1.1, 1] : 1
                      }}
                      transition={{
                        duration: 2,
                        repeat: entry.rank <= 3 ? Infinity : 0,
                        repeatDelay: 3
                      }}
                    >
                      {numericPerformancePercentage >= 0 ? "+" : ""}
                      {numericPerformancePercentage.toFixed(2)}%
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