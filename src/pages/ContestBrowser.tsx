import React, { useState, useMemo } from 'react';
import { ContestCard } from '../components/contests/ContestCard';
import { ContestFilters } from '../components/contests/ContestFilters';
import { CreateContestButton } from '../components/contests/CreateContestButton';
import { Card } from '../components/ui/Card';

export const ContestBrowser: React.FC = () => {
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activeDifficultyFilter, setActiveDifficultyFilter] = useState('');
  const [activeSort, setActiveSort] = useState('startTime');

  // Demo contests with proper typing
  const demoContests = [
    {
      id: '1',
      title: 'Daily SOL Tournament',
      timeInfo: 'Ends in 2h 15m',
      prizePool: 1000,
      entryFee: 10,
      players: 45,
      maxPlayers: 100,
      difficulty: 'dolphin' as const,
      type: 'live' as const,
      startTime: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    },
    {
      id: '2',
      title: 'Weekly Crypto Challenge',
      timeInfo: 'Starts in 4h',
      prizePool: 2500,
      entryFee: 25,
      players: 75,
      maxPlayers: 150,
      difficulty: 'shark' as const,
      type: 'upcoming' as const,
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 4), // 4 hours from now
    },
    {
      id: '3',
      title: 'Beginner Friendly Contest',
      timeInfo: 'Starts in 1h',
      prizePool: 500,
      entryFee: 5,
      players: 20,
      maxPlayers: 50,
      difficulty: 'guppy' as const,
      type: 'upcoming' as const,
      startTime: new Date(Date.now() + 1000 * 60 * 60), // 1 hour from now
    },
  ];

  const sortedAndFilteredContests = useMemo(() => {
    let filtered = demoContests.filter(contest => {
      const matchesStatus = activeStatusFilter === 'all' || contest.type === activeStatusFilter;
      const matchesDifficulty = !activeDifficultyFilter || contest.difficulty === activeDifficultyFilter;
      return matchesStatus && matchesDifficulty;
    });

    return filtered.sort((a, b) => {
      switch (activeSort) {
        case 'startTime':
          return a.startTime.getTime() - b.startTime.getTime();
        case 'prizePool':
          return b.prizePool - a.prizePool;
        case 'entryFee':
          return a.entryFee - b.entryFee;
        case 'players':
          return (b.players / b.maxPlayers) - (a.players / a.maxPlayers);
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
            <ContestCard key={contest.id} {...contest} />
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