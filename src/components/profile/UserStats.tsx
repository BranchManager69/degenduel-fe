import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';

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
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100">Performance Overview</h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 bg-dark-300/50 rounded-lg">
            <div className="text-sm text-gray-400">Total Winnings</div>
            <div className="text-xl font-bold text-brand-400">
              {formatCurrency(totalWinnings)}
            </div>
          </div>
          <div className="p-4 bg-dark-300/50 rounded-lg">
            <div className="text-sm text-gray-400">Contests Played</div>
            <div className="text-xl font-bold text-gray-100">{contestsPlayed || 'None'}</div>
          </div>
          <div className="p-4 bg-dark-300/50 rounded-lg">
            <div className="text-sm text-gray-400">Contests Won</div>
            <div className="text-xl font-bold text-brand-400">{contestsWon || 'None'}</div>
          </div>
          <div className="p-4 bg-dark-300/50 rounded-lg">
            <div className="text-sm text-gray-400">Win Rate</div>
            <div className="text-xl font-bold text-gray-100">
              {contestsPlayed ? `${winRate.toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          <div className="p-4 bg-dark-300/50 rounded-lg">
            <div className="text-sm text-gray-400">Average Return</div>
            <div className={`text-xl font-bold ${
              averageReturn >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {contestsPlayed ? `${averageReturn >= 0 ? '+' : ''}${averageReturn.toFixed(1)}%` : 'N/A'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};