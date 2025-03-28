import React, { useCallback, useState, useEffect } from 'react';
import { MessageType, TopicType, useUnifiedWebSocket } from '../../../hooks/websocket';
import { NODE_ENV } from '../../../config/config';
import { useStore } from '../../../store/useStore';

interface UserProfile {
  wallet_address?: string;
  nickname?: string;
  email?: string;
  avatar?: string;
  level?: number;
  xp?: number;
  role?: string;
  created_at?: string;
  last_login?: string;
  [key: string]: any;
}

interface UserStats {
  total_contests?: number;
  contests_won?: number;
  contests_entered?: number;
  win_rate?: number;
  average_placement?: number;
  total_winnings?: number;
  current_streak?: number;
  longest_streak?: number;
  [key: string]: any;
}

/**
 * Debug component for testing the User Profile WebSocket topic
 * Shows user profile data and stats from the WebSocket
 * Requires authentication to receive data
 */
const UserProfileDebug: React.FC = () => {
  const user = useStore(state => state.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [hasRequestedProfile, setHasRequestedProfile] = useState(false);
  const [hasRequestedStats, setHasRequestedStats] = useState(false);
  
  // Generate unique ID for this hook instance
  const wsId = `user-profile-${Math.random().toString(36).substring(2, 9)}`;
  
  // Handle incoming messages from the WebSocket
  const handleMessage = useCallback((message: any) => {
    try {
      if (NODE_ENV === "development") {
        console.log(`[UserProfile] Received message:`, message);
      }
      
      // Update last updated time
      setLastUpdate(new Date());
      
      // Handle profile data
      if (message.type === 'user_profile') {
        if (message.data) {
          setProfile(message.data);
        }
      }
      // Handle stats data
      else if (message.type === 'user_stats') {
        if (message.data) {
          setStats(message.data);
        }
      }
    } catch (err) {
      console.error('[UserProfile] Failed to process message:', err);
    }
  }, []);
  
  // Connect to the WebSocket and subscribe to the USER topic
  const ws = useUnifiedWebSocket(
    wsId,
    [MessageType.DATA, MessageType.ERROR],
    handleMessage,
    [TopicType.USER]
  );
  
  // Subscribe to the USER topic when connected
  useEffect(() => {
    if (ws.isConnected && ws.isAuthenticated) {
      ws.subscribe([TopicType.USER]);
    }
  }, [ws.isConnected, ws.isAuthenticated]);
  
  // Auto-request profile and stats when connected and authenticated
  useEffect(() => {
    if (ws.isConnected && ws.isAuthenticated) {
      if (!hasRequestedProfile) {
        requestProfile();
        setHasRequestedProfile(true);
      }
      
      if (!hasRequestedStats) {
        requestStats();
        setHasRequestedStats(true);
      }
    }
  }, [ws.isConnected, ws.isAuthenticated, hasRequestedProfile, hasRequestedStats]);
  
  // Format timestamp for display
  const formatTimestamp = (date: Date | string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleTimeString();
  };
  
  // Request profile data
  const requestProfile = () => {
    if (ws.isConnected) {
      ws.request(TopicType.USER, 'getProfile');
    }
  };
  
  // Request stats data
  const requestStats = () => {
    if (ws.isConnected) {
      ws.request(TopicType.USER, 'getStats');
    }
  };
  
  // Format currency value
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };
  
  return (
    <div className="bg-gray-900 p-4 rounded-lg text-white">
      <h2 className="text-xl font-bold mb-4">User Profile WebSocket Debug</h2>
      
      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${ws.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{ws.isConnected ? 'Connected' : 'Disconnected'}</span>
          
          {ws.isConnected && (
            <>
              <div className={`w-3 h-3 rounded-full ml-4 mr-2 ${ws.isAuthenticated ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span>{ws.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</span>
            </>
          )}
        </div>
        
        {ws.error && (
          <div className="mt-2 p-2 bg-red-900 bg-opacity-50 rounded text-sm">
            Error: {ws.error}
          </div>
        )}
        
        <div className="mt-2 text-sm text-gray-400">
          Last update: {formatTimestamp(lastUpdate)}
        </div>
      </div>
      
      {/* Login Status */}
      {!user ? (
        <div className="bg-yellow-900/50 p-4 rounded-lg mb-4 text-center">
          <h3 className="font-semibold text-yellow-400 mb-2">Not Logged In</h3>
          <p className="text-sm text-yellow-300">
            You must be logged in to view user profile data.
          </p>
        </div>
      ) : !ws.isAuthenticated ? (
        <div className="bg-yellow-900/50 p-4 rounded-lg mb-4 text-center">
          <h3 className="font-semibold text-yellow-400 mb-2">Not Authenticated</h3>
          <p className="text-sm text-yellow-300">
            WebSocket not authenticated. Make sure you have a valid auth token.
          </p>
        </div>
      ) : null}
      
      {/* Action Buttons */}
      <div className="mb-4 flex space-x-2">
        <button
          onClick={requestProfile}
          className="px-3 py-1 bg-blue-600 rounded"
          disabled={!ws.isConnected || !ws.isAuthenticated}
        >
          Request Profile
        </button>
        
        <button
          onClick={requestStats}
          className="px-3 py-1 bg-purple-600 rounded"
          disabled={!ws.isConnected || !ws.isAuthenticated}
        >
          Request Stats
        </button>
      </div>
      
      {/* Profile Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="font-semibold text-lg mb-3">User Profile</h3>
          
          {profile ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Wallet:</div>
                <div className="font-mono text-xs break-all">
                  {profile.wallet_address || 'N/A'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Nickname:</div>
                <div>{profile.nickname || 'N/A'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Role:</div>
                <div className={
                  profile.role === 'admin' ? 'text-red-400' : 
                  profile.role === 'superadmin' ? 'text-purple-400' : 'text-blue-400'
                }>
                  {profile.role || 'user'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Level:</div>
                <div className="text-green-400">{profile.level || '0'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">XP:</div>
                <div>{profile.xp || '0'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Joined:</div>
                <div>{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Last Login:</div>
                <div>{profile.last_login ? new Date(profile.last_login).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 text-gray-500">
              {ws.isAuthenticated ? 'No profile data received' : 'Authentication required'}
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 p-4 rounded">
          <h3 className="font-semibold text-lg mb-3">User Stats</h3>
          
          {stats ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Total Contests:</div>
                <div>{stats.contests_entered || '0'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Contests Won:</div>
                <div className="text-green-400">{stats.contests_won || '0'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Win Rate:</div>
                <div>{stats.win_rate ? `${(stats.win_rate * 100).toFixed(1)}%` : '0%'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Avg. Placement:</div>
                <div>{stats.average_placement?.toFixed(1) || 'N/A'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Current Streak:</div>
                <div className={Number(stats.current_streak) > 0 ? 'text-green-400' : ''}>
                  {stats.current_streak || '0'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Longest Streak:</div>
                <div className="text-yellow-400">{stats.longest_streak || '0'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400">Total Winnings:</div>
                <div className="text-brand-400">{formatCurrency(stats.total_winnings)}</div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 text-gray-500">
              {ws.isAuthenticated ? 'No stats data received' : 'Authentication required'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileDebug;