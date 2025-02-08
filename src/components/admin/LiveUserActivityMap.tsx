import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

// Configurable thresholds
const DEFAULT_THRESHOLDS = {
  WHALE_BALANCE: 10,      // Consider 10 SOL holders as whales initially
  BUSY_ZONE: 2,          // Alert when 2+ users in a zone
  ACTIVITY_CHANCE: 1,    // 100% chance to play sound for new users
  SOUND_VOLUME: {
    WHALE: 0.4,
    ACTIVITY: 0.3,
    ALERT: 0.3
  }
};

// Sound generation using Web Audio API
const createAudioContext = () => {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
};

const generateSound = (type: 'WHALE' | 'ACTIVITY' | 'ALERT', volume: number) => {
  const audioContext = createAudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Configure sound based on type
  switch (type) {
    case 'WHALE':
      // Rich notification sound (two-tone with slight sweep)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
      oscillator.frequency.linearRampToValueAtTime(880, audioContext.currentTime + 0.1); // A5
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
      break;
      
    case 'ACTIVITY':
      // Subtle tick sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.001);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.05);
      break;
      
    case 'ALERT':
      // Gentle alert sound (rising tone)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(440, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
      break;
  }
};

interface UserActivity {
  wallet: string;
  nickname: string;
  avatar_url?: string;
  current_zone: string;
  previous_zone?: string;
  wallet_balance: number;
  last_action: string;
  last_active: string;
  session_duration: number;
  is_whale: boolean;
}

interface AdminLog {
  id: number;
  admin_address: string;
  action: string;
  details: any;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

// Define the zones of our application
const SITE_ZONES = {
  TRADING: { label: 'Trading Arena', x: 0, y: 0 },
  CONTESTS: { label: 'Contest Lobbies', x: 1, y: 0 },
  PORTFOLIO: { label: 'Portfolio', x: 2, y: 0 },
  TOKENS: { label: 'Token Explorer', x: 0, y: 1 },
  PROFILE: { label: 'Profile Pages', x: 1, y: 1 },
  LEADERBOARD: { label: 'Leaderboards', x: 2, y: 1 }
};

const GRID_SIZE = 200; // Size of each zone in pixels

// Add type for sound volume settings
type SoundVolumeKey = keyof typeof DEFAULT_THRESHOLDS.SOUND_VOLUME;

export const LiveUserActivityMap: React.FC = () => {
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS);
  const [showSettings, setShowSettings] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const prevUsersRef = useRef<UserActivity[]>([]);

  // Sound effect helper
  const playSound = (type: 'WHALE' | 'ACTIVITY' | 'ALERT') => {
    if (!soundEnabled) return;
    const volume = thresholds.SOUND_VOLUME[type];
    generateSound(type, volume);
  };

  // Fetch admin logs
  const fetchAdminLogs = async () => {
    try {
      const response = await fetch('/api/admin/activity?limit=50');
      if (!response.ok) throw new Error('Failed to fetch admin logs');
      const data = await response.json();
      setAdminLogs(data.activities || []);
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      setAdminLogs([]); // Set empty array on error
    }
  };

  useEffect(() => {
    fetchAdminLogs();
    const logsInterval = setInterval(fetchAdminLogs, 30000); // Refresh every 30 seconds
    return () => clearInterval(logsInterval);
  }, []);

  useEffect(() => {
    // Initialize WebSocket connection
    const connectWebSocket = () => {
      // Get session token from cookies
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as { [key: string]: string });

      const sessionToken = cookies['session'];
      if (!sessionToken) {
        console.error('No session token found - please log in again');
        return;
      }

      // Use the correct WebSocket URL format based on environment
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname;
      const wsPort = import.meta.env.DEV ? ':3003' : '';
      const wsUrl = `${wsProtocol}//${wsHost}${wsPort}/api/analytics?token=${sessionToken}`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to analytics websocket');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'user_activity_update') {
            const newUsers = data.users;
            const prevUsers = prevUsersRef.current;

            // Always notify about new users
            newUsers.forEach((user: UserActivity) => {
              const prevUser = prevUsers.find(p => p.wallet === user.wallet);
              
              if (!prevUser) {
                // New user joined - check if whale
                if (user.wallet_balance >= thresholds.WHALE_BALANCE) {
                  playSound('WHALE');
                } else {
                  // Regular new user
                  playSound('ACTIVITY');
                }
              }
            });

            // Check for busy zones
            Object.entries(SITE_ZONES).forEach(([zone, _]) => {
              const newCount = newUsers.filter((u: UserActivity) => u.current_zone === zone).length;
              const prevCount = prevUsers.filter(u => u.current_zone === zone).length;
              
              if (newCount >= thresholds.BUSY_ZONE && newCount > prevCount) {
                playSound('ALERT');
              }
            });

            setUsers(newUsers);
            prevUsersRef.current = newUsers;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('Disconnected from analytics websocket', event.code, event.reason);
        setIsConnected(false);
        // Only attempt to reconnect if not closed intentionally
        if (event.code !== 1000) {
          setTimeout(connectWebSocket, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      // Cleanup on unmount
      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1000, 'Component unmounting');
        }
      };
    };

    connectWebSocket();
  }, [thresholds.WHALE_BALANCE, thresholds.BUSY_ZONE, soundEnabled]);

  const getZonePosition = (zoneName: string) => {
    const zone = SITE_ZONES[zoneName as keyof typeof SITE_ZONES];
    return {
      x: zone.x * GRID_SIZE,
      y: zone.y * GRID_SIZE
    };
  };

  // Settings panel component
  const SettingsPanel = () => (
    <div className="absolute right-0 top-12 mt-2 w-64 bg-dark-200 rounded-lg shadow-lg p-4 z-20">
      <h4 className="text-sm font-medium text-gray-100 mb-3">Monitor Settings</h4>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400">Whale Balance (SOL)</label>
          <input
            type="number"
            value={thresholds.WHALE_BALANCE}
            onChange={(e) => setThresholds(prev => ({
              ...prev,
              WHALE_BALANCE: Number(e.target.value)
            }))}
            className="w-full bg-dark-300 rounded px-2 py-1 text-sm text-gray-100"
          />
        </div>
        
        <div>
          <label className="text-xs text-gray-400">Busy Zone Threshold</label>
          <input
            type="number"
            value={thresholds.BUSY_ZONE}
            onChange={(e) => setThresholds(prev => ({
              ...prev,
              BUSY_ZONE: Number(e.target.value)
            }))}
            className="w-full bg-dark-300 rounded px-2 py-1 text-sm text-gray-100"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400">Sound Volumes</label>
          <div className="space-y-2">
            {(Object.entries(thresholds.SOUND_VOLUME) as [SoundVolumeKey, number][]).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-20">{key}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={value}
                  onChange={(e) => setThresholds(prev => ({
                    ...prev,
                    SOUND_VOLUME: {
                      ...prev.SOUND_VOLUME,
                      [key]: Number(e.target.value)
                    }
                  }))}
                  className="flex-1"
                />
                <span className="text-xs text-gray-400 w-8">{(value * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-dark-300/30 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-100">Live User Activity</h3>
        <div className="flex items-center gap-4">
          {/* Settings toggle */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-400/50 hover:bg-dark-400/70 transition-colors"
            >
              <span className="text-base">⚙️</span>
              <span className="text-sm text-gray-400">Settings</span>
            </button>
            {showSettings && <SettingsPanel />}
          </div>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-400/50 hover:bg-dark-400/70 transition-colors"
          >
            <span className="text-base">
              {soundEnabled ? '🔊' : '🔇'}
            </span>
            <span className="text-sm text-gray-400">
              {soundEnabled ? 'Sounds On' : 'Sounds Off'}
            </span>
          </button>

          {/* Connection status */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Reconnecting...'}
            </span>
          </div>
        </div>
      </div>

      {/* Activity Map */}
      <div className="relative w-full aspect-[3/2] bg-dark-400/20 rounded-lg overflow-hidden">
        {/* Zone Grid */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0.5">
          {Object.entries(SITE_ZONES).map(([key, zone]) => (
            <div
              key={key}
              className="relative bg-dark-300/30 p-4"
              style={{
                gridColumn: zone.x + 1,
                gridRow: zone.y + 1
              }}
            >
              <span className="text-sm font-medium text-gray-400">{zone.label}</span>
            </div>
          ))}
        </div>

        {/* User Avatars */}
        <AnimatePresence>
          {users.map((user) => {
            const pos = getZonePosition(user.current_zone);
            const isHovered = hoveredUser === user.wallet;

            return (
              <motion.div
                key={user.wallet}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  x: pos.x + Math.random() * (GRID_SIZE - 40),
                  y: pos.y + Math.random() * (GRID_SIZE - 40)
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="absolute"
                style={{ width: 40, height: 40 }}
                onMouseEnter={() => setHoveredUser(user.wallet)}
                onMouseLeave={() => setHoveredUser(null)}
              >
                {/* User Avatar */}
                <div
                  className={`
                    relative w-full h-full rounded-full 
                    ${isHovered ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-dark-400' : ''}
                    transition-all duration-200
                  `}
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.nickname}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-brand-500/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-brand-400">
                        {user.nickname.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Balance Indicator */}
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded-full bg-dark-300/90 text-xs">
                    ◎ {user.wallet_balance.toFixed(2)}
                  </div>

                  {/* Activity Trail */}
                  {user.previous_zone && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-brand-500/20"
                      initial={{ scale: 1, opacity: 0.5 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Hover Details */}
                {isHovered && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 p-2 bg-dark-300/90 rounded-lg shadow-lg z-10">
                    <div className="text-xs space-y-1">
                      <p className="font-medium text-gray-200">{user.nickname}</p>
                      <p className="text-gray-400">
                        Last Action: {user.last_action}
                      </p>
                      <p className="text-gray-400">
                        Session: {Math.floor(user.session_duration / 60)}m
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Zone Activity Indicators */}
        {Object.entries(SITE_ZONES).map(([key, zone]) => {
          const zoneUsers = users.filter(u => u.current_zone === key);
          const intensity = Math.min(zoneUsers.length / 5, 1); // Max intensity at 5 users

          return (
            <div
              key={`heat-${key}`}
              className="absolute pointer-events-none"
              style={{
                left: zone.x * GRID_SIZE,
                top: zone.y * GRID_SIZE,
                width: GRID_SIZE,
                height: GRID_SIZE,
                background: `radial-gradient(circle, rgba(99, 102, 241, ${intensity * 0.2}) 0%, transparent 70%)`
              }}
            />
          );
        })}
      </div>

      {/* Stats Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-dark-300/30 rounded-lg p-3">
          <p className="text-sm text-gray-400">Active Users</p>
          <p className="text-xl font-semibold text-gray-100">{users.length}</p>
        </div>
        <div className="bg-dark-300/30 rounded-lg p-3">
          <p className="text-sm text-gray-400">Most Active Zone</p>
          <p className="text-xl font-semibold text-gray-100">
            {Object.entries(SITE_ZONES).reduce((max, [key, _]) => {
              const count = users.filter(u => u.current_zone === key).length;
              return count > users.filter(u => u.current_zone === max).length ? key : max;
            }, Object.keys(SITE_ZONES)[0])}
          </p>
        </div>
        <div className="bg-dark-300/30 rounded-lg p-3">
          <p className="text-sm text-gray-400">Total SOL</p>
          <p className="text-xl font-semibold text-gray-100">
            ◎ {users.reduce((sum, user) => sum + user.wallet_balance, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Recent Admin Activity */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-100 mb-2">Recent Admin Activity</h4>
        <div className="bg-dark-300/30 rounded-lg overflow-hidden">
          <div className="max-h-40 overflow-y-auto">
            <table className="w-full">
              <tbody>
                {adminLogs.slice(0, 5).map((log) => (
                  <tr key={log.id} className="border-b border-dark-300/50 last:border-0">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </span>
                        <span className="text-sm text-gray-300">{log.action}</span>
                      </div>
                      {log.details && (
                        <div className="mt-1 text-xs text-gray-400">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}; 