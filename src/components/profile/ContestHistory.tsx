import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';

interface ContestEntry {
  id: string;
  name: string;
  date: string;
  rank: number;
  totalParticipants: number;
  portfolioReturn: number;
  winnings: number;
}

interface ContestHistoryProps {
  contests: ContestEntry[];
}

export const ContestHistory: React.FC<ContestHistoryProps> = ({ contests }) => {
  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100">Contest History</h3>
      </CardHeader>
      <CardContent>
        {contests.length > 0 ? (
          <div className="space-y-4">
            {contests.map((contest) => (
              <Link
                key={contest.id}
                to={`/contests/${contest.id}/results`}
                className="block hover:bg-dark-300/50 transition-colors"
              >
                <div className="p-4 rounded-lg border border-dark-300">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-100">{contest.name}</div>
                      <div className="text-sm text-gray-400">{contest.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-100">
                        Rank: {contest.rank}/{contest.totalParticipants}
                      </div>
                      {contest.winnings > 0 && (
                        <div className="text-sm text-brand-400">
                          Won: {formatCurrency(contest.winnings)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className={`font-medium ${
                      contest.portfolioReturn >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {contest.portfolioReturn >= 0 ? '+' : ''}{contest.portfolioReturn}%
                    </span>
                    <span className="text-gray-400"> portfolio return</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No contests played yet. Join a contest to start building your history!
          </div>
        )}
      </CardContent>
    </Card>
  );
};