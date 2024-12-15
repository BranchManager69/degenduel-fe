import React, { useState, useMemo } from 'react';
import { ContestCard } from '../components/contests/ContestCard';
import { ContestFilters } from '../components/contests/ContestFilters';
import { CreateContestButton } from '../components/contests/CreateContestButton';
import { Card } from '../components/ui/Card';
import { Contest } from '../types';

export const ContestBrowser: React.FC = () => {
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activeDifficultyFilter, setActiveDifficultyFilter] = useState('');
  const [activeSort, setActiveSort] = useState('start_time');

  // Demo contests with proper Contest interface
  const demoContests: Contest[] = [
    {
      id: 1,
      name: 'Weekend Retard Party',
      description: 'Put your retarded hat on, because this is a retarded contest.',
      start_time: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      end_time: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
      entry_fee: '10',
      prize_pool: '1000',
      status: 'in_progress',
      settings: {
        difficulty: 'dolphin',
        min_trades: 5,
        max_participants: 100
      },
      participant_count: 45,
      is_participating: false,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Gay Degen Contest',
      description: 'The biggest degens often win from the gayest trades.',
      start_time: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
      end_time: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString(),
      entry_fee: '25',
      prize_pool: '2500',
      status: 'pending',
      settings: {
        difficulty: 'shark',
        min_trades: 10,
        max_participants: 150
      },
      participant_count: 75,
      is_participating: false,
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Scam Contest',
      description: 'Entrants can only trade rugs and scams. Even this contest is a scam.',
      start_time: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      end_time: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
      entry_fee: '5',
      prize_pool: '500',
      status: 'pending',
      settings: {
        difficulty: 'guppy',
        min_trades: 3,
        max_participants: 50
      },
      participant_count: 20,
      is_participating: false,
      created_at: new Date().toISOString()
    },
  ];

  const sortedAndFilteredContests = useMemo(() => {
    let filtered = demoContests.filter(contest => {
      const matchesStatus = activeStatusFilter === 'all' || 
        (activeStatusFilter === 'live' && contest.status === 'in_progress') ||
        (activeStatusFilter === 'upcoming' && contest.status === 'pending');
      const matchesDifficulty = !activeDifficultyFilter || 
        contest.settings.difficulty === activeDifficultyFilter;
      return matchesStatus && matchesDifficulty;
    });

    return filtered.sort((a, b) => {
      switch (activeSort) {
        case 'start_time':
          return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
        case 'prize_pool':
          return Number(b.prize_pool) - Number(a.prize_pool);
        case 'entry_fee':
          return Number(a.entry_fee) - Number(b.entry_fee);
        case 'players':
          return (b.participant_count / b.settings.max_participants) - 
                 (a.participant_count / a.settings.max_participants);
        default:
          return 0;
      }
    });
  }, [demoContests, activeStatusFilter, activeDifficultyFilter, activeSort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Available Contests</h1>
        <CreateContestButton />
      </div>
      
      <div className="mb-8">
        <ContestFilters
          activeStatusFilter={activeStatusFilter}
          activeDifficultyFilter={activeDifficultyFilter}
          activeSort={activeSort}
          onStatusFilterChange={setActiveStatusFilter}
          onDifficultyFilterChange={setActiveDifficultyFilter}
          onSortChange={setActiveSort}
        />
      </div>

      {sortedAndFilteredContests.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedAndFilteredContests.map((contest) => (
            <ContestCard 
              key={contest.id} 
              contest={contest}
            />
          ))}
        </div>
      ) : (
        <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 p-8 text-center">
          <p className="text-gray-400 text-lg">
            No contests found matching your filters. Try adjusting your search criteria.
          </p>
        </Card>
      )}
    </div>
  );
};