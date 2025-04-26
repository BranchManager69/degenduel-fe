import React from 'react';
import { BlinkButton, ShareBlinkButton } from './index';

interface ExampleContestCardProps {
  contest: {
    id: string;
    name: string;
    description: string;
    entryFee: string;
    startTime: string;
    endTime: string;
  };
}

export const ExampleContestCard: React.FC<ExampleContestCardProps> = ({ contest }) => {
  const handleSuccess = (signature: string) => {
    console.log(`Successfully joined contest ${contest.id} with transaction ${signature}`);
    // Show success message to user
  };
  
  const handleError = (error: Error) => {
    console.error(`Error joining contest ${contest.id}:`, error);
    // Show error message to user
  };
  
  return (
    <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-2">{contest.name}</h2>
      <p className="text-gray-300 mb-4">{contest.description}</p>
      
      <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
        <div>Entry: {contest.entryFee} SOL</div>
        <div>
          {new Date(contest.startTime).toLocaleDateString()} - 
          {new Date(contest.endTime).toLocaleDateString()}
        </div>
      </div>
      
      <div className="flex space-x-3">
        <BlinkButton
          blinkUrl="/api/blinks/join-contest"
          params={{
            contestId: contest.id,
            contestName: contest.name,
            entryFee: contest.entryFee
          }}
          className="flex-1 py-2"
          label="Join Contest"
          onSuccess={handleSuccess}
          onError={handleError}
        />
        
        <ShareBlinkButton
          blinkUrl="/blinks/join-contest"
          params={{
            contestId: contest.id,
            contestName: contest.name
          }}
          label="Share"
        />
      </div>
    </div>
  );
};