import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';

interface LeaderboardEntry {
  rank: number;
  username: string;
  portfolioValue: number;
  change24h: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserRank?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, currentUserRank }) => {
  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100">Leaderboard</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.username}
              className={`flex items-center justify-between p-3 rounded-lg ${
                entry.rank === currentUserRank 
                  ? 'bg-brand-500/20 border border-brand-500/30' 
                  : 'bg-dark-300/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  entry.rank <= 3 
                    ? 'bg-brand-500/20 text-brand-300' 
                    : 'bg-dark-400 text-gray-400'
                }`}>
                  {entry.rank}
                </div>
                <div>
                  <div className="font-medium text-gray-100">{entry.username}</div>
                  <div className="text-sm text-gray-400">
                    {formatCurrency(entry.portfolioValue)}
                  </div>
                </div>
              </div>
              <div className={`text-sm font-medium ${
                entry.change24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {entry.change24h >= 0 ? '+' : ''}{entry.change24h.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};