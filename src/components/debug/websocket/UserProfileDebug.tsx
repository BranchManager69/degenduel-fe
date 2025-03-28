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
    <div className="text-white">
      {/* Connection Status */}
      <div className="mb-4 bg-black/30 backdrop-blur-sm p-3 rounded border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${ws.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={ws.isConnected ? 'text-green-400' : 'text-red-400'}>
                {ws.isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            {ws.isConnected && (
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${ws.isAuthenticated ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                <span className={ws.isAuthenticated ? 'text-green-400' : 'text-yellow-400'}>
                  {ws.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-400">
            Last update: <span className="text-purple-400">{formatTimestamp(lastUpdate)}</span>
          </div>
        </div>
        
        {ws.error && (
          <div className="mt-2 p-2 bg-red-900/50 border border-red-700 rounded text-sm">
            Error: {ws.error}
          </div>
        )}
      </div>
      
      {/* Login Status */}
      {!user ? (
        <div className="bg-yellow-900/50 p-4 rounded-lg mb-4 text-center border border-yellow-800/50">
          <div className="flex flex-col items-center space-y-2">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="font-semibold text-yellow-400">Authentication Required</h3>
            <p className="text-sm text-yellow-300">
              You must be logged in to view user profile data.
            </p>
          </div>
        </div>
      ) : !ws.isAuthenticated ? (
        <div className="bg-yellow-900/50 p-4 rounded-lg mb-4 text-center border border-yellow-800/50">
          <div className="flex flex-col items-center space-y-2">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="font-semibold text-yellow-400">WebSocket Not Authenticated</h3>
            <p className="text-sm text-yellow-300">
              Make sure you have a valid authentication token.
            </p>
          </div>
        </div>
      ) : null}
      
      {/* Action Buttons */}
      <div className="mb-4 flex justify-center space-x-4">
        <button
          onClick={requestProfile}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded transition-colors flex items-center disabled:opacity-50 disabled:pointer-events-none"
          disabled={!ws.isConnected || !ws.isAuthenticated}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Request Profile
        </button>
        
        <button
          onClick={requestStats}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors flex items-center disabled:opacity-50 disabled:pointer-events-none"
          disabled={!ws.isConnected || !ws.isAuthenticated}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Request Stats
        </button>
      </div>
      
      {/* Profile Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-black/30 backdrop-blur-sm p-3 rounded border border-gray-700">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700">
            <h3 className="font-semibold text-lg text-purple-400">User Profile</h3>
            {profile && (
              <div className="bg-purple-900/40 py-1 px-2 rounded-full border border-purple-700 text-xs text-purple-300 font-mono">
                ID: {profile.wallet_address?.substring(0, 6)}...
              </div>
            )}
          </div>
          
          {profile ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">WALLET:</div>
                <div className="font-mono text-xs break-all text-purple-300">
                  {profile.wallet_address || 'N/A'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">NICKNAME:</div>
                <div>{profile.nickname || 'N/A'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">ROLE:</div>
                <div className={
                  profile.role === 'admin' ? 'text-red-400' : 
                  profile.role === 'superadmin' ? 'text-purple-400' : 'text-blue-400'
                }>
                  {profile.role || 'user'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">LEVEL:</div>
                <div className="flex items-center">
                  <div className="text-green-400 mr-2">{profile.level || '0'}</div>
                  <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-brand-500" style={{width: `${Math.min((profile.xp || 0) % 100, 100)}%`}}></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">XP:</div>
                <div className="text-yellow-400 font-mono">{profile.xp || '0'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">JOINED:</div>
                <div className="text-xs">{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">LAST LOGIN:</div>
                <div className="text-xs">{profile.last_login ? new Date(profile.last_login).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="flex flex-col items-center justify-center text-gray-500 space-y-2">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{ws.isAuthenticated ? 'No profile data' : 'Authentication required'}</span>
                {ws.isAuthenticated && <span className="text-xs">Try requesting profile data</span>}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-black/30 backdrop-blur-sm p-3 rounded border border-gray-700">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-700">
            <h3 className="font-semibold text-lg text-blue-400">User Stats</h3>
            {stats && stats.contests_entered && (
              <div className="bg-blue-900/40 py-1 px-2 rounded-full border border-blue-700 text-xs text-blue-300">
                {stats.contests_entered} contests
              </div>
            )}
          </div>
          
          {stats ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">CONTESTS:</div>
                <div className="font-mono">{stats.contests_entered || '0'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">WINS:</div>
                <div className="text-green-400 font-mono">{stats.contests_won || '0'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">WIN RATE:</div>
                <div className="flex items-center">
                  <div className="mr-2">{stats.win_rate ? `${(stats.win_rate * 100).toFixed(1)}%` : '0%'}</div>
                  <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{width: `${(stats.win_rate || 0) * 100}%`}}></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">AVG PLACE:</div>
                <div className="font-mono">{stats.average_placement?.toFixed(1) || 'N/A'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">STREAK:</div>
                <div className={Number(stats.current_streak) > 0 ? 'text-green-400 font-mono' : 'font-mono'}>
                  {stats.current_streak || '0'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">BEST STREAK:</div>
                <div className="text-yellow-400 font-mono">{stats.longest_streak || '0'}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-400 font-mono">WINNINGS:</div>
                <div className="text-brand-400 font-mono">{formatCurrency(stats.total_winnings)}</div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="flex flex-col items-center justify-center text-gray-500 space-y-2">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>{ws.isAuthenticated ? 'No stats data' : 'Authentication required'}</span>
                {ws.isAuthenticated && <span className="text-xs">Try requesting stats data</span>}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Debug Info */}
      <div className="px-3 py-2 text-xs bg-black/30 backdrop-blur-sm rounded border border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-gray-500 mr-2">Topic:</span>
          <span className="bg-purple-900/60 border border-purple-800 rounded-sm px-1.5 text-purple-300 font-mono">user</span>
        </div>
        <div className="text-gray-500">Authentication status: <span className={ws.isAuthenticated ? "text-green-400" : "text-red-400"}>{ws.isAuthenticated ? "ACTIVE" : "INACTIVE"}</span></div>
      </div>
    </div>
  );
};

export default UserProfileDebug;