import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { formatAddress } from '../../lib/utils';

interface ProfileHeaderProps {
  address: string;
  username: string;
  rankScore: number;
  joinDate: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  address,
  username,
  rankScore,
  joinDate,
}) => {
  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-brand-500/20 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold text-gray-100">
                {username}
              </h1>
            </div>
            <p className="text-gray-400 mt-1">{formatAddress(address)}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-400">
                Rank Score: <span className="text-gray-200">{rankScore}</span>
              </span>
              <span className="text-sm text-gray-400">
                Joined: <span className="text-gray-200">{joinDate}</span>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};