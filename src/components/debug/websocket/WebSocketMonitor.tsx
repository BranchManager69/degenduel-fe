/**
 * WebSocketMonitor Component
 * 
 * This component provides a real-time view of all active WebSocket connections in the application.
 * It shows connection status, counts by type, and recent events to help with debugging.
 * V69 version - Compatible with centralized WebSocket tracking
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../../../store/useStore';
import {
  dispatchWebSocketEvent,
  getAllWebSocketCounts,
  getAllConnectionAttempts,
  resetWebSocketTracking
} from '../../../utils/wsMonitor';

interface WebSocketEvent {
  id: string;
  timestamp: string;
  type: string;
  socketType?: string;
  data?: any;
}

// Event type colors for better visual distinction
const EVENT_TYPE_COLORS: Record<string, string> = {
  connection: 'text-green-400',
  close: 'text-red-400',
  error: 'text-red-500 font-semibold bg-red-900/30',
  reconnect: 'text-yellow-400',
  'reconnect_throttled': 'text-orange-400 font-semibold',
  'reconnect_rate_limited': 'text-amber-400 font-semibold',
  'reconnect_severe_throttling': 'text-red-400 font-semibold',
  'connection-attempt': 'text-teal-300',
  message: 'text-blue-400',
  pong: 'text-blue-300',
  heartbeat: 'text-blue-200',
  'connection-tracking': 'text-cyan-400',
  'zombie_connection': 'text-red-300 font-semibold',
  'forced_reconnect': 'text-pink-300 font-semibold',
  system: 'text-purple-400',
  init: 'text-teal-400',
  cleanup: 'text-orange-400',
  auth: 'text-indigo-400',
  reset: 'text-pink-400', 
  sent: 'text-green-300',
  default: 'text-gray-300'
};

export const WebSocketMonitor: React.FC = () => {
  const [connectionCounts, setConnectionCounts] = useState<Record<string, number>>({});
  const [connectionAttempts, setConnectionAttempts] = useState<Record<string, number>>({});
  const [events, setEvents] = useState<WebSocketEvent[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false); // Default to OFF
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [expandedView, setExpandedView] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [filterEventType, setFilterEventType] = useState<string>('');
  const [isPaused, setIsPaused] = useState(false);
  
  // Store pause-time events so we can resume capturing later
  const pausedEventsRef = useRef<WebSocketEvent[]>([]);
  // Track all unique event types we've seen
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  // Keep track of the interval
  const intervalRef = useRef<number | null>(null);
  
  // Update connection counts and attempts - but only if auto-refresh is on
  const updateCounts = useCallback(() => {
    if (!isPaused) {
      setConnectionCounts(getAllWebSocketCounts());
      setConnectionAttempts(getAllConnectionAttempts());
    }
  }, [isPaused]);
  
  // Start/stop the auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (autoRefresh) {
      intervalRef.current = window.setInterval(updateCounts, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, updateCounts]);
  
  // Always update counts once on mount
  useEffect(() => {
    updateCounts();
  }, [updateCounts]);
  
  // Listen for WebSocket events
  useEffect(() => {
    const handleWsEvent = (event: CustomEvent) => {
      const { type, socketType, timestamp, data } = event.detail;
      
      // Track unique event types for filtering
      setEventTypes(prev => {
        if (!prev.includes(type)) {
          return [...prev, type];
        }
        return prev;
      });
      
      // If paused, store in ref but don't update state
      if (isPaused) {
        pausedEventsRef.current.push({
          id: `${Date.now()}-${Math.random()}`,
          timestamp: timestamp || new Date().toISOString(),
          type,
          socketType,
          data
        });
        return;
      }
      
      // Add event to list
      setEvents(prev => {
        const newEvent: WebSocketEvent = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: timestamp || new Date().toISOString(),
          type,
          socketType,
          data
        };
        
        // Keep only the most recent 300 events (increased from 100)
        const updated = sortNewestFirst 
          ? [newEvent, ...prev].slice(0, 300)
          : [...prev, newEvent].slice(-300);
        return updated;
      });
      
      // Update counts if we received an event, even if auto-refresh is off
      updateCounts();
    };
    
    window.addEventListener('ws-debug', handleWsEvent as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('ws-debug', handleWsEvent as EventListener);
    };
  }, [sortNewestFirst, isPaused, updateCounts]);
  
  // Format the timestamp for display
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        ////millisecond: 'true',
        hour12: false
      });
    } catch (e) {
      return 'Invalid time';
    }
  };
  
  // Get CSS class for status indicator
  const getStatusClass = (count: number) => {
    if (count === 0) return 'bg-gray-400';
    if (count === 1) return 'bg-green-500';
    return count < 5 ? 'bg-yellow-500' : 'bg-red-500';
  };
  
  // Handle reset button click
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset WebSocket tracking? This is for debugging purposes only.')) {
      resetWebSocketTracking();
      setEvents([]);
      pausedEventsRef.current = [];
      
      // Dispatch a custom event to notify about reset
      dispatchWebSocketEvent('system', {
        message: 'WebSocket tracking reset by administrator',
        timestamp: new Date().toISOString()
      });
    }
  };
  
  // Handle resuming from pause
  const handleResume = () => {
    setIsPaused(false);
    
    // Add all paused events to the events list
    if (pausedEventsRef.current.length > 0) {
      setEvents(prev => {
        // Combine existing and paused events based on sort order
        let combinedEvents = sortNewestFirst
          ? [...pausedEventsRef.current, ...prev]
          : [...prev, ...pausedEventsRef.current];
          
        // Sort by timestamp if needed
        combinedEvents = sortNewestFirst
          ? combinedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          : combinedEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          
        // Keep only the most recent 300 events
        return combinedEvents.slice(0, 300);
      });
      
      // Clear the paused events
      pausedEventsRef.current = [];
      
      // Update counts immediately
      updateCounts();
    }
  };
  
  // Handle sorting change
  const handleSortChange = () => {
    setSortNewestFirst(!sortNewestFirst);
    // Reverse the current events array
    setEvents(prev => [...prev].reverse());
  };
  
  // Handle clear events
  const handleClearEvents = () => {
    if (window.confirm('Are you sure you want to clear all events? This won\'t affect connection tracking.')) {
      setEvents([]);
      pausedEventsRef.current = [];
    }
  };
  
  // Get appropriate CSS class for event type
  const getEventTypeClass = (type: string) => EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS.default;
  
  // Get appropriate CSS class for socketType
  const getSocketTypeClass = (socketType?: string) => {
    switch (socketType) {
      case 'server-status':
        return 'text-yellow-300 font-medium';
      case 'token-data':
        return 'text-cyan-300 font-medium';
      case 'contest-chat':
        return 'text-green-300 font-medium';
      case 'wallet':
        return 'text-indigo-300 font-medium';
      default:
        return 'text-gray-300';
    }
  };
  
  // Filter events based on selected type, event type filter, and sort order
  const filterAndSortEvents = () => {
    let filtered = events;
    
    // Filter by socket type if selected
    if (selectedType) {
      filtered = filtered.filter(event => event.socketType === selectedType);
    }
    
    // Filter by event type if selected
    if (filterEventType) {
      filtered = filtered.filter(event => event.type === filterEventType);
    }
    
    return filtered;
  };
  
  const filteredEvents = filterAndSortEvents();
  
  // Get authentication tokens for debugging  
  const user = useStore(state => state.user);
  const sessionToken = user?.session_token || null;
  const jwtToken = user?.jwt || null;
  const wsToken = user?.wsToken || null;

  // Safely truncate token for display (first 10 chars only)
  const truncateToken = (token: string | null): string => {
    if (!token) return 'Not available';
    return `${token.substring(0, 10)}...`;
  };
  
  // Log full token details to console for debugging
  useEffect(() => {
    if (user) {
      console.log('WebSocketMonitor - Authentication details:', {
        sessionToken: {
          available: !!sessionToken,
          value: sessionToken,
          length: sessionToken?.length
        },
        jwt: {
          available: !!jwtToken,
          value: jwtToken,
          length: jwtToken?.length
        },
        wsToken: {
          available: !!wsToken,
          value: wsToken,
          length: wsToken?.length
        },
        user: {
          id: user.wallet_address,
          isAdmin: user.is_admin,
          isSuperAdmin: user.is_superadmin
        }
      });
    }
  }, [user, sessionToken, jwtToken, wsToken]);

  return (
    <div className={`bg-gray-800 text-white rounded-lg shadow-lg transition-all duration-300 ${expandedView ? 'w-full h-full fixed inset-0 z-50 overflow-auto' : 'p-4'}`}>
      <div className={`${expandedView ? 'p-4 h-full flex flex-col' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">WebSocket Monitor</h2>
            {/* Auth Debug Section */}
            <div className="mt-1 text-xs bg-gray-700/50 p-1 px-2 rounded-lg">
              <span className="font-medium text-green-400">Auth Tokens:</span>
              <div className="flex flex-col mt-1 space-y-1">
                <div className="flex">
                  <span className="text-blue-300 w-20 font-medium">Session:</span>
                  <span className="text-blue-400">
                    <span title="Session cookies are managed by the browser and not stored in JavaScript">
                      Using HTTP-only cookie
                    </span>
                  </span>
                </div>
                <div className="flex">
                  <span className="text-blue-300 w-20 font-medium">JWT:</span>
                  <span className={jwtToken ? 'text-green-400' : 'text-red-400'}>
                    {truncateToken(jwtToken)}
                  </span>
                  {jwtToken && (
                    <button 
                      className="ml-2 text-xs px-1 bg-blue-800/50 hover:bg-blue-700/50 rounded"
                      onClick={() => {
                        console.log('Full JWT token:', jwtToken);
                        alert('Full JWT token logged to console');
                      }}
                    >
                      Log Full
                    </button>
                  )}
                </div>
                <div className="flex">
                  <span className="text-blue-300 w-20 font-medium">WS Token:</span>
                  <span className={wsToken ? 'text-green-400' : 'text-orange-400'}>
                    {truncateToken(wsToken)}
                  </span>
                  {wsToken && (
                    <button 
                      className="ml-2 text-xs px-1 bg-blue-800/50 hover:bg-blue-700/50 rounded"
                      onClick={() => {
                        console.log('Full WebSocket token:', wsToken);
                        alert('Full WebSocket token logged to console');
                      }}
                    >
                      Log Full
                    </button>
                  )}
                </div>
                <div className="flex">
                  <span className="text-blue-300 w-20 font-medium">User ID:</span>
                  <span className={user?.wallet_address ? 'text-green-400' : 'text-red-400'}>
                    {user?.wallet_address ? `${user.wallet_address.substring(0, 10)}...` : 'Not available'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Pause/Resume button */}
            <button 
              onClick={() => isPaused ? handleResume() : setIsPaused(true)}
              className={`px-3 py-1 rounded ${isPaused ? 'bg-green-600' : 'bg-yellow-600'}`}
              title={isPaused ? `Resume capturing (${pausedEventsRef.current.length} events paused)` : 'Pause event capture'}
            >
              {isPaused ? `Resume (${pausedEventsRef.current.length})` : 'Pause'}
            </button>
            
            {/* Expand/Collapse button */}
            <button
              onClick={() => setExpandedView(!expandedView)}
              className="px-3 py-1 bg-blue-600 rounded"
              title={expandedView ? 'Collapse view' : 'Expand to full screen'}
            >
              {expandedView ? 'Collapse' : 'Expand'}
            </button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-refresh toggle */}
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded ${autoRefresh ? 'bg-green-600' : 'bg-gray-600'}`}
              title={autoRefresh ? 'Turn off automatic refresh' : 'Turn on automatic refresh (updates every second)'}
            >
              {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
            </button>
            
            {/* Reset tracking button */}
            <button 
              onClick={handleReset}
              className="px-3 py-1 bg-red-600 rounded"
              title="Reset all WebSocket tracking counters"
            >
              Reset Tracking
            </button>
            
            {/* Clear events button */}
            <button 
              onClick={handleClearEvents}
              className="px-3 py-1 bg-red-800 rounded"
              title="Clear event log without resetting counters"
            >
              Clear Events
            </button>
            
            {/* Sorting order button */}
            <button
              onClick={handleSortChange}
              className="px-3 py-1 bg-purple-600 rounded flex items-center"
              title={sortNewestFirst ? 'Show oldest events first' : 'Show newest events first'}
            >
              {sortNewestFirst ? (
                <>
                  <span className="mr-1">Newest First</span>
                  <span>↓</span>
                </>
              ) : (
                <>
                  <span className="mr-1">Oldest First</span>
                  <span>↑</span>
                </>
              )}
            </button>
            
            {/* Compact mode toggle */}
            <button
              onClick={() => setCompactMode(!compactMode)}
              className={`px-3 py-1 rounded ${compactMode ? 'bg-cyan-600' : 'bg-gray-600'}`}
              title={compactMode ? 'Show detailed event view' : 'Show compact event view'}
            >
              {compactMode ? 'Compact View' : 'Detailed View'}
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* WebSocket type filter */}
            <select 
              value={selectedType || ''}
              onChange={(e) => setSelectedType(e.target.value || null)}
              className="bg-gray-700 text-white p-1 rounded"
              title="Filter events by WebSocket type"
            >
              <option value="">All Socket Types</option>
              {Object.keys(connectionCounts)
                .filter(key => key !== 'total')
                .map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
            </select>
            
            {/* Event type filter */}
            <select 
              value={filterEventType}
              onChange={(e) => setFilterEventType(e.target.value)}
              className="bg-gray-700 text-white p-1 rounded"
              title="Filter events by event type"
            >
              <option value="">All Event Types</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Connection Stats */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <h3 className="text-lg font-semibold">Active Connections</h3>
            <span className="text-xs text-gray-400 ml-2">(active / attempts)</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {Object.entries(connectionCounts)
              .filter(([key]) => key !== 'total')
              .map(([type, count]) => {
                const attempts = connectionAttempts[type] || 0;
                return (
                  <div 
                    key={type}
                    className={`flex items-center px-3 py-1 rounded transition-colors
                      ${selectedType === type ? 'bg-brand-600/50 border border-brand-500/30' : 'bg-gray-700 hover:bg-gray-600'}`}
                    onClick={() => setSelectedType(type !== selectedType ? type : null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={`w-3 h-3 rounded-full mr-2 ${getStatusClass(count)}`}></div>
                    <span className="font-medium">{type}:</span>
                    <span className={`ml-1 ${count > 0 ? 'text-white' : 'text-gray-400'}`}>
                      {count}
                      {attempts > 0 && (
                        <span className="text-xs text-gray-400 ml-1">/ {attempts}</span>
                      )}
                    </span>
                  </div>
                );
              })}
            <div className="flex items-center bg-gray-900 px-3 py-1 rounded">
              <div className={`w-3 h-3 rounded-full mr-2 ${connectionCounts.total > 0 ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
              <span className="font-medium">Total:</span>
              <span className={`ml-1 ${connectionCounts.total > 0 ? 'text-white font-bold' : 'text-gray-400'}`}>
                {connectionCounts.total || 0}
                {connectionAttempts.total > 0 && (
                  <span className="text-xs text-gray-400 ml-1">/ {connectionAttempts.total}</span>
                )}
              </span>
            </div>
          </div>
        </div>
        
        {/* Events Log */}
        <div className={`${expandedView ? 'flex-grow overflow-hidden' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">
              Recent Events {selectedType ? `(${selectedType})` : ''} 
              {filterEventType ? ` - ${filterEventType}` : ''}
              <span className="text-sm text-gray-400 ml-2">
                {filteredEvents.length} of {events.length} events
              </span>
            </h3>
            
            {isPaused && (
              <div className="text-yellow-400 text-sm animate-pulse">
                Event capture paused - {pausedEventsRef.current.length} events waiting
              </div>
            )}
          </div>
          
          <div className={`bg-gray-900 rounded p-2 overflow-auto ${expandedView ? 'h-[calc(100%-2rem)]' : 'h-[26rem]'}`}>
            {filteredEvents.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No events recorded</div>
            ) : compactMode ? (
              // Compact view
              <div className="space-y-1 text-xs">
                {filteredEvents.map(event => (
                  <div key={event.id} className={`flex items-center p-1 rounded hover:bg-gray-800 ${event.type === 'error' ? 'bg-red-900/20' : ''}`}>
                    <span className="w-12 shrink-0 text-gray-500">{formatTime(event.timestamp).split(' ')[1]}</span>
                    <span className={`w-24 shrink-0 ${getEventTypeClass(event.type)}`}>{event.type}</span>
                    <span className={`w-24 shrink-0 ${getSocketTypeClass(event.socketType)}`}>{event.socketType || '-'}</span>
                    <span className="truncate">
                      {event.data ? (
                        typeof event.data === 'object' ? (
                          event.data.message || JSON.stringify(event.data).substring(0, 80) + (JSON.stringify(event.data).length > 80 ? '...' : '')
                        ) : String(event.data).substring(0, 80) + (String(event.data).length > 80 ? '...' : '')
                      ) : '-'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              // Detailed view
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-900 z-10">
                  <tr className="text-gray-400 text-left">
                    <th className="p-1 border-b border-gray-700">Time</th>
                    <th className="p-1 border-b border-gray-700">Type</th>
                    <th className="p-1 border-b border-gray-700">Socket</th>
                    <th className="p-1 border-b border-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map(event => (
                    <tr key={event.id} className={`border-t border-gray-800 hover:bg-gray-800/50 ${event.type === 'error' ? 'bg-red-900/20' : ''}`}>
                      <td className="p-1 text-gray-300 whitespace-nowrap">{formatTime(event.timestamp)}</td>
                      <td className={`p-1 whitespace-nowrap ${getEventTypeClass(event.type)}`}>{event.type}</td>
                      <td className={`p-1 whitespace-nowrap ${getSocketTypeClass(event.socketType)}`}>{event.socketType || '-'}</td>
                      <td className="p-1">
                        {event.data ? (
                          <div>
                            {/* Show key info directly when possible */}
                            {event.data.message && (
                              <div className="text-gray-300">{event.data.message}</div>
                            )}
                            
                            {event.data.error && (
                              <div className="text-red-400">{event.data.error}</div>
                            )}
                            
                            {event.data.code && (
                              <div className="text-yellow-400">Code: {event.data.code}</div>
                            )}
                            
                            {/* Always include the full details in a disclosure */}
                            <details>
                              <summary className="cursor-pointer text-blue-400 text-xs mt-1">
                                {event.data.message ? 'View Full Details' : 'View Details'}
                              </summary>
                              <pre className="mt-1 text-xs bg-gray-800 p-2 rounded overflow-auto max-h-40">
                                {JSON.stringify(event.data, null, 2)}
                              </pre>
                            </details>
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSocketMonitor;