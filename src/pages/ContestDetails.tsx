import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ContestRules } from '../components/contests/ContestRules';
import { PrizeStructure } from '../components/contests/PrizeStructure';
import { ParticipantsList } from '../components/contests/ParticipantsList';
import { Card, CardContent } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import { ContestDifficulty } from '../components/landing/contests/ContestDifficulty';

export const ContestDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Placeholder contest data
  const contest = {
    id,
    title: 'Daily SOL Tournament',
    description: 'Join our daily tournament and compete with traders worldwide. Select your best tokens and aim for the top prize!',
    difficulty: 'dolphin' as const,
    entryFee: 10,
    prizePool: 1000,
    startTime: new Date(Date.now() + 3600000),
    endTime: new Date(Date.now() + 7200000),
    participants: [
      { address: '0x1234...5678', username: 'crypto_king', score: 32.5 },
      { address: '0x8765...4321', username: 'sol_trader', score: 28.7 },
      { address: '0xabcd...efgh', username: 'moon_walker', score: 25.2 },
      { address: '0x9876...5432', score: -5.8 },
    ],
    maxParticipants: 100,
    status: 'live' as const,
    rules: [
      'Select tokens to build your portfolio',
      'Portfolio performance tracked in real-time',
      'Winners determined by highest portfolio value at end time',
      'No trading allowed once contest begins',
      'Prizes distributed automatically after contest ends',
    ],
    tokenTypes: ['SOL', 'RAY', 'BONK', 'JTO'],
  };

  const handleJoinContest = () => {
    navigate(`/contests/${id}/select-tokens`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">{contest.title}</h1>
            <p className="text-gray-400">{contest.description}</p>
          </div>
          <ContestDifficulty difficulty={contest.difficulty} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-gray-400">Entry Fee</div>
              <div className="text-xl font-bold text-brand-400">
                {formatCurrency(contest.entryFee)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-gray-400">Prize Pool</div>
              <div className="text-xl font-bold text-brand-400">
                {formatCurrency(contest.prizePool)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-gray-400">Start Time</div>
              <div className="text-lg font-medium text-gray-100">
                {contest.startTime.toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-gray-400">Players</div>
              <div className="flex items-center space-x-2">
                <div className="w-24 h-1.5 bg-dark-300 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-500 rounded-full" 
                    style={{ width: `${(contest.participants.length / contest.maxParticipants) * 100}%` }} 
                  />
                </div>
                <span className="text-lg font-medium text-gray-100">
                  {contest.participants.length}/{contest.maxParticipants}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-8">
          <ContestRules rules={contest.rules} />
          
          {/* Available Tokens */}
          <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Available Tokens</h3>
              <div className="flex flex-wrap gap-2">
                {contest.tokenTypes.map((token) => (
                  <span key={token} className="px-3 py-1 bg-dark-300 rounded-full text-sm text-gray-300">
                    {token}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <PrizeStructure prizePool={contest.prizePool} />
          <ParticipantsList 
            participants={contest.participants}
            contestStatus={contest.status}
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button 
          size="lg"
          variant="gradient"
          onClick={handleJoinContest}
          className="relative group overflow-hidden"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-32 bg-white/10 rotate-45 transform translate-x-32 group-hover:translate-x-48 transition-transform duration-500" />
          </div>
          <span className="relative flex items-center justify-center font-medium">
            Enter Contest ({formatCurrency(contest.entryFee)})
            <svg 
              className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </span>
        </Button>
      </div>
    </div>
  );
};