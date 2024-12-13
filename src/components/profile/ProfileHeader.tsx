import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { formatAddress } from '../../lib/utils';

interface ProfileHeaderProps {
  address: string;
  username: string;
  snsNames: string[];
  onSNSSelect: (name: string) => void;
  selectedSNS: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  address,
  username,
  snsNames,
  onSNSSelect,
  selectedSNS,
}) => {
  const [showSNSDropdown, setShowSNSDropdown] = useState(false);

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
                {selectedSNS || username}
              </h1>
              {snsNames.length > 0 && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSNSDropdown(!showSNSDropdown)}
                    className="text-sm"
                  >
                    Change Display Name
                  </Button>
                  {showSNSDropdown && (
                    <div className="absolute top-full mt-1 w-48 rounded-md shadow-lg bg-dark-300 ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        {snsNames.map((name) => (
                          <button
                            key={name}
                            onClick={() => {
                              onSNSSelect(name);
                              setShowSNSDropdown(false);
                            }}
                            className="block w-full px-4 py-2 text-sm text-gray-300 hover:bg-dark-400"
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-gray-400 mt-1">{formatAddress(address)}</p>
          </div>
          <Button variant="outline" size="sm">
            Link Twitter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};