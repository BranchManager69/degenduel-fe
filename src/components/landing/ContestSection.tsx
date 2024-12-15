import React from 'react';
import { Link } from 'react-router-dom';
import type { Contest } from '../../types';
import { isContestLive } from '../../lib/utils';

interface Props {
  title: string;
  type: 'active' | 'pending'; // Updated to match actual status types
  contests: Contest[];
  loading: boolean;
}

export const ContestSection: React.FC<Props> = ({ title, type, contests, loading }) => {
  if (loading) {
    return (
      <section className="py-12">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-dark-200 rounded-lg p-6 h-48"></div>
          ))}
        </div>
      </section>
    );
  }

  if (contests.length === 0) {
    return (
      <section className="py-12">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="text-center text-gray-400 py-12">
          No {type} contests available at the moment.
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contests.filter(contest => type === 'active' ? isContestLive(contest) : !isContestLive(contest)).map((contest) => (
          <Link 
            key={contest.id} 
            to={`/contests/${contest.id}`}
            className="block bg-dark-200 rounded-lg p-6 hover:bg-dark-300 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{contest.name}</h3>
              <span className={`px-2 py-1 rounded text-sm ${
                contest.settings.difficulty === 'whale' ? 'bg-purple-900 text-purple-100' :
                contest.settings.difficulty === 'shark' ? 'bg-red-900 text-red-100' :
                'bg-blue-900 text-blue-100'
              }`}>
                {contest.settings.difficulty}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Entry Fee:</span>
                <span className="font-medium">{contest.entry_fee} SOL</span>
              </div>
              <div className="flex justify-between">
                <span>Prize Pool:</span>
                <span className="font-medium text-brand-400">{contest.prize_pool} SOL</span>
              </div>
              <div className="flex justify-between">
                <span>Players:</span>
                <span>{contest.participant_count}/{contest.settings.max_participants}</span>
              </div>
              <div className="flex justify-between">
                <span>{type === 'active' ? 'Ends' : 'Starts'}:</span>
                <span>
                  {new Date(type === 'active' ? contest.end_time : contest.start_time).toLocaleString()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};