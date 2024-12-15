import React from 'react';
import { Contest } from '../../types';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';

interface ContestCardProps {
  contest: Contest;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'guppy':
      return 'text-green-400';
    case 'tadpole':
      return 'text-blue-400';
    case 'squid':
      return 'text-purple-400';
    case 'dolphin':
      return 'text-yellow-400';
    case 'shark':
      return 'text-orange-400';
    case 'whale':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

const getTimeRemaining = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'in_progress':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'completed':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'in_progress':
        return 'Live';
      case 'pending':
        return 'Upcoming';
      case 'completed':
        return 'Ended';
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
      {getStatusText()}
    </span>
  );
};

export const ContestCard: React.FC<ContestCardProps> = ({ contest }) => {
  const timeInfo = contest.status === 'in_progress'
    ? `Ends in ${getTimeRemaining(contest.end_time)}`
    : `Starts in ${getTimeRemaining(contest.start_time)}`;

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-dark-200 transition-colors">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">{contest.name}</h3>
            <p className="text-sm text-gray-400">{timeInfo}</p>
          </div>
          <StatusBadge status={contest.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Prize Pool</p>
              <p className="text-lg font-semibold text-gray-100">
                {formatCurrency(Number(contest.prize_pool))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Entry Fee</p>
              <p className="text-lg font-semibold text-gray-100">
                {formatCurrency(Number(contest.entry_fee))}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Participants</span>
              <span className="text-sm font-medium text-gray-200">
                {contest.participant_count} / {contest.settings.max_participants}
              </span>
            </div>
            <div className="w-full bg-dark-400 rounded-full h-1.5">
              <div
                className="bg-brand-500 h-1.5 rounded-full"
                style={{
                  width: `${(contest.participant_count / contest.settings.max_participants) * 100}%`
                }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Difficulty:</span>
              <span className={`text-sm font-medium capitalize ${getDifficultyColor(contest.settings.difficulty)}`}>
                {contest.settings.difficulty}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Min Trades:</span>
              <span className="text-sm font-medium text-gray-200">
                {contest.settings.min_trades}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};