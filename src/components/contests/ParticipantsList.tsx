import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';

interface Participant {
  address: string;
  username?: string;
  score?: number;
}

interface ParticipantsListProps {
  participants: Participant[];
  contestStatus: 'upcoming' | 'live' | 'completed';
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({ participants, contestStatus }) => {
  const sortedParticipants = [...participants].sort((a, b) => {
    if (contestStatus === 'upcoming') {
      return 0; // No sorting for upcoming contests
    }
    return (b.score || 0) - (a.score || 0); // Sort by score for live/completed contests
  });

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100">Participants</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedParticipants.map((participant, index) => (
            <div 
              key={participant.address} 
              className="flex items-center justify-between p-2 rounded bg-dark-300/50"
            >
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">#{index + 1}</span>
                <span className="text-gray-300">
                  {participant.username || `${participant.address.slice(0, 6)}...${participant.address.slice(-4)}`}
                </span>
              </div>
              {contestStatus !== 'upcoming' && participant.score !== undefined && (
                <span className={`text-sm font-medium ${participant.score >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {participant.score >= 0 ? '+' : ''}{participant.score.toFixed(2)}%
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};