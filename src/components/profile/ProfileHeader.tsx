import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { formatAddress } from '../../lib/utils';

const MAX_NICKNAME_LENGTH = 15;

interface ProfileHeaderProps {
  address: string;
  username: string;
  rankScore: number;
  joinDate: string;
  onUpdateNickname: (newNickname: string) => Promise<void>;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  address,
  username,
  rankScore,
  joinDate,
  onUpdateNickname
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState(username);
  const [updating, setUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate nickname
    const trimmedNickname = newNickname.trim();
    if (trimmedNickname.length < 3) {
      alert('Nickname must be at least 3 characters long');
      return;
    }
    if (trimmedNickname.length > MAX_NICKNAME_LENGTH) {
      alert(`Nickname must be no longer than ${MAX_NICKNAME_LENGTH} characters`);
      return;
    }
    if (trimmedNickname === username) {
      setIsEditing(false);
      return;
    }

    try {
      setUpdating(true);
      await onUpdateNickname(trimmedNickname);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update nickname:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-brand-500/20 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    maxLength={MAX_NICKNAME_LENGTH}
                    className="bg-dark-200 border border-dark-400 rounded px-2 py-1 text-white"
                    disabled={updating}
                    placeholder="Enter nickname"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-brand-500 text-white rounded hover:bg-brand-600 disabled:opacity-50"
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 bg-dark-400 text-white rounded hover:bg-dark-500 disabled:opacity-50"
                    onClick={() => setIsEditing(false)}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-bold text-gray-100">{username}</h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
              )}
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