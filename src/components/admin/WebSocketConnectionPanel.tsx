import { format, formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

interface WebSocketConnection {
  id: number;
  connection_id: string;
  ip_address: string;
  user_agent: string;
  wallet_address: string | null;
  nickname: string | null;
  is_authenticated: boolean;
  environment: string;
  origin: string;
  connected_at: string;
  disconnected_at: string | null;
  duration_seconds: number | null;
  close_code: number | null;
  close_reason: string | null;
  subscribed_topics: string[];
  messages_received: number;
  messages_sent: number;
  connection_error: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  metadata: Record<string, any>;
}

interface WebSocketConnectionsPagination {
  page: number;
  limit: number;
  totalConnections: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface WebSocketConnectionsResponse {
  success: boolean;
  connections: WebSocketConnection[];
  pagination: WebSocketConnectionsPagination;
  error?: string;
}

interface WebSocketConnectionPanelProps {
  initialExpanded?: boolean;
}

export const WebSocketConnectionPanel: React.FC<WebSocketConnectionPanelProps> = ({ initialExpanded = false }) => {
  const [connections, setConnections] = useState<WebSocketConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<WebSocketConnectionsPagination | null>(null);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [viewingConnection, setViewingConnection] = useState<WebSocketConnection | null>(null);
  const [activeOnly, setActiveOnly] = useState(false);
  const limit = 10; // Show 10 connections at a time

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        activeOnly: activeOnly.toString()
      });
      
      const response = await fetch(`/api/admin/websocket-monitor/connections?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch connections: ${response.status}`);
      }
      
      const data: WebSocketConnectionsResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load connections');
      }
      
      setConnections(data.connections);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      fetchConnections();
    }
  }, [page, activeOnly, isExpanded]);

  const handleNextPage = () => {
    if (pagination?.hasNextPage) {
      setPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination?.hasPrevPage) {
      setPage(prev => prev - 1);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';

    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  // Helper function for determining connection state
  const getConnectionState = (connection: WebSocketConnection) => {
    if (!connection.disconnected_at) {
      return 'active';
    } 
    
    // If connection was closed with an error code
    if (connection.close_code && (connection.close_code !== 1000 && connection.close_code !== 1001)) {
      return 'error';
    }
    
    // Normal closure
    return 'closed';
  };

  // Get relative time for better readability
  const getRelativeTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return 'Unknown time';
    }
  };

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-md">
      {/* Edge-to-edge header with elegant styling */}
      <div 
        className="cursor-pointer bg-gradient-to-r from-dark-800/90 via-dark-700/80 to-dark-800/90 relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Subtle top glow effect */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent"></div>
        
        <div className="p-3 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1.5 
              ${connections.some(c => getConnectionState(c) === 'active')
                ? 'bg-green-500/20 text-green-300' 
                : 'bg-yellow-500/20 text-yellow-300'}`}
              style={{
                boxShadow: connections.some(c => getConnectionState(c) === 'active')
                  ? '0 0 4px rgba(16,185,129,0.2), inset 0 0 2px rgba(16,185,129,0.1)' 
                  : '0 0 4px rgba(234,179,8,0.2), inset 0 0 2px rgba(234,179,8,0.1)'
              }}
            >
              <div className={`w-2 h-2 rounded-full ${connections.some(c => getConnectionState(c) === 'active') ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
              <span>{connections.some(c => getConnectionState(c) === 'active') ? 'ONLINE' : 'STANDBY'}</span>
            </div>
            <h2 className="text-lg font-bold text-white ml-2">WebSocket Connections</h2>
            {!isExpanded && connections.length > 0 && (
              <div className="text-xs bg-brand-500/10 text-brand-300 px-2 py-0.5 rounded-full ml-2 flex items-center"
                style={{ boxShadow: '0 0 4px rgba(56,189,248,0.2), inset 0 0 2px rgba(56,189,248,0.1)' }}>
                {connections.filter(c => getConnectionState(c) === 'active').length} active
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                fetchConnections();
              }} 
              className="text-xs bg-gradient-to-br from-dark-600/90 to-dark-700/90 hover:from-dark-500/90 hover:to-dark-600/90 px-2 py-1 rounded text-cyan-400 hover:text-cyan-300 transition-all flex items-center gap-1"
              style={{ boxShadow: "0 0 3px rgba(8,145,178,0.2), inset 0 0 2px rgba(8,145,178,0.1)" }}
              disabled={loading}
            >
              <span className="mr-1">↻</span> Refresh
            </button>
            <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <span className="text-gray-400">⌄</span>
            </div>
          </div>
        </div>
        
        {/* Subtle bottom line */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-dark-300/70 to-transparent"></div>
      </div>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Filter controls */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400 flex items-center gap-1">
                    <input 
                      type="checkbox" 
                      checked={activeOnly} 
                      onChange={() => setActiveOnly(!activeOnly)}
                      className="form-checkbox h-3 w-3 text-brand-500 rounded"
                    />
                    Active only
                  </label>
                </div>
                <div className="text-xs text-gray-400">
                  {pagination ? `${pagination.totalConnections} total connections` : ''}
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-2 p-2 bg-red-900/20 border border-red-800 rounded text-red-300 text-xs">
                  {error}
                </div>
              )}

              {/* Loading state */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-cyber-600 border-t-cyber-300 rounded-full animate-spin"></div>
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No connections found
                </div>
              ) : (
                <div>
                  {/* Connection list */}
                  <div className="space-y-2 mb-4">
                    {connections.map(connection => (
                      <div 
                        key={connection.id}
                        className="bg-gradient-to-br from-dark-300/50 to-dark-200/50 rounded-md hover:from-dark-300/70 hover:to-dark-200/70 transition-all cursor-pointer shadow-sm transform hover:scale-[1.01] hover:shadow-md"
                        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)" }}
                        onClick={() => setViewingConnection(connection)}
                      >
                        <div className="p-3 relative overflow-hidden">
                          {/* Subtle decoration glow in top-right corner */}
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-dark-100/5 to-transparent rounded-bl-full"></div>
                          
                          <div className="flex justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`px-2 py-0.5 text-xs rounded-md flex items-center gap-1.5 ${
                                getConnectionState(connection) === 'active'
                                  ? 'bg-green-500/10 text-green-300' 
                                  : getConnectionState(connection) === 'error'
                                    ? 'bg-red-500/10 text-red-300'
                                    : 'bg-gray-500/10 text-gray-300'
                              }`}
                              style={{
                                boxShadow: getConnectionState(connection) === 'active'
                                  ? '0 0 4px rgba(16,185,129,0.15), inset 0 0 2px rgba(16,185,129,0.1)' 
                                  : getConnectionState(connection) === 'error'
                                    ? '0 0 4px rgba(239,68,68,0.15), inset 0 0 2px rgba(239,68,68,0.1)'
                                    : '0 0 4px rgba(156,163,175,0.15), inset 0 0 2px rgba(156,163,175,0.1)'
                              }}
                              >
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  getConnectionState(connection) === 'active'
                                    ? 'bg-green-400 animate-pulse' 
                                    : getConnectionState(connection) === 'error'
                                      ? 'bg-red-400'
                                      : 'bg-gray-400'
                                }`}></div>
                                {getConnectionState(connection) === 'active' ? 'Active' : 'Disconnected'}
                              </div>
                              <span className="text-gray-300 text-xs font-mono">{connection.connection_id}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {getRelativeTime(connection.connected_at)}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-start">
                            <div>
                              {connection.wallet_address ? (
                                <div className="text-sm text-brand-400 truncate" style={{ maxWidth: '160px' }}>
                                  {connection.wallet_address}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500 italic">Not authenticated</div>
                              )}
                              
                              <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <span>{connection.ip_address}</span>
                                {connection.country && (
                                  <span>• {connection.country}</span>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs flex items-center gap-1">
                                <span className="text-blue-400">{connection.messages_received}</span>
                                <span className="text-gray-500">received</span>
                                <span className="text-gray-500">/</span>
                                <span className="text-green-400">{connection.messages_sent}</span>
                                <span className="text-gray-500">sent</span>
                              </div>
                              
                              {connection.duration_seconds !== null && (
                                <div className="text-xs text-gray-500 text-right mt-1">
                                  {formatDuration(connection.duration_seconds)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* If connection had an error, show it */}
                          {connection.connection_error && (
                            <div className="mt-2 text-xs text-red-400 bg-gradient-to-r from-red-900/20 to-red-800/10 px-2 py-1 rounded relative overflow-hidden"
                              style={{ boxShadow: "inset 0 0 1px rgba(239,68,68,0.3)" }}
                            >
                              {/* Subtle left border effect */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500/20 via-red-400/20 to-red-500/20"></div>
                              <div className="pl-1.5">{connection.connection_error}</div>
                            </div>
                          )}
                          
                          {/* If connection has topics, show them */}
                          {connection.subscribed_topics && connection.subscribed_topics.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {connection.subscribed_topics.map(topic => (
                                <span key={topic} 
                                  className="text-xs bg-gradient-to-r from-dark-400/50 to-dark-500/50 text-cyan-200 px-2 py-0.5 rounded"
                                  style={{ boxShadow: "inset 0 0 1px rgba(56,189,248,0.2)" }}
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-xs text-gray-400">
                        Page {pagination.page} of {pagination.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handlePrevPage}
                          disabled={!pagination.hasPrevPage}
                          className={`px-3 py-1 text-xs rounded transition-all transform hover:scale-105 active:scale-95 ${
                            pagination.hasPrevPage
                              ? 'bg-gradient-to-br from-cyan-600/30 to-cyan-700/40 text-cyan-300 hover:from-cyan-600/40 hover:to-cyan-700/50'
                              : 'bg-gradient-to-br from-gray-700/20 to-gray-800/30 text-gray-600 cursor-not-allowed'
                          }`}
                          style={pagination.hasPrevPage 
                            ? { boxShadow: "0 0 4px rgba(8,145,178,0.2), inset 0 0 2px rgba(8,145,178,0.1)" }
                            : { boxShadow: "inset 0 0 1px rgba(156,163,175,0.2)" }
                          }
                        >
                          ← Previous
                        </button>
                        <button
                          onClick={handleNextPage}
                          disabled={!pagination.hasNextPage}
                          className={`px-3 py-1 text-xs rounded transition-all transform hover:scale-105 active:scale-95 ${
                            pagination.hasNextPage
                              ? 'bg-gradient-to-br from-cyan-600/30 to-cyan-700/40 text-cyan-300 hover:from-cyan-600/40 hover:to-cyan-700/50'
                              : 'bg-gradient-to-br from-gray-700/20 to-gray-800/30 text-gray-600 cursor-not-allowed'
                          }`}
                          style={pagination.hasNextPage 
                            ? { boxShadow: "0 0 4px rgba(8,145,178,0.2), inset 0 0 2px rgba(8,145,178,0.1)" }
                            : { boxShadow: "inset 0 0 1px rgba(156,163,175,0.2)" }
                          }
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Details Modal */}
      {viewingConnection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-dark-300/95 to-dark-200/95 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-xl"
             style={{ boxShadow: "0 0 25px rgba(0,0,0,0.5), 0 0 10px rgba(56,189,248,0.2), inset 0 0 1px rgba(56,189,248,0.1)" }}
          >
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-dark-800/90 via-dark-700/80 to-dark-800/90 p-4 relative">
              {/* Top glow line */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/30 to-transparent"></div>
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-brand-400 text-2xl">⚡</span>
                    Connection Details
                  </h3>
                  <div className="text-sm text-cyan-400 font-mono mt-1">{viewingConnection.connection_id}</div>
                </div>
                <button 
                  onClick={() => setViewingConnection(null)}
                  className="text-gray-400 hover:text-white text-2xl hover:bg-dark-600/50 h-8 w-8 flex items-center justify-center rounded transition-all"
                >
                  ×
                </button>
              </div>
              
              {/* Bottom line */}
              <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-dark-300/70 to-transparent"></div>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 80px)" }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Connection Status */}
                <div className="col-span-full">
                  <div className={`px-3 py-1.5 text-sm inline-flex items-center gap-2 rounded-md ${
                    getConnectionState(viewingConnection) === 'active'
                      ? 'bg-green-500/10 text-green-300'
                      : getConnectionState(viewingConnection) === 'error'
                        ? 'bg-red-500/10 text-red-300'
                        : 'bg-gray-500/10 text-gray-300'
                  }`}
                  style={{
                    boxShadow: getConnectionState(viewingConnection) === 'active'
                      ? '0 0 6px rgba(16,185,129,0.2), inset 0 0 2px rgba(16,185,129,0.1)'
                      : getConnectionState(viewingConnection) === 'error'
                        ? '0 0 6px rgba(239,68,68,0.2), inset 0 0 2px rgba(239,68,68,0.1)'
                        : '0 0 6px rgba(156,163,175,0.2), inset 0 0 2px rgba(156,163,175,0.1)'
                  }}
                  >
                    <span className={`h-2 w-2 rounded-full ${
                      getConnectionState(viewingConnection) === 'active'
                      ? 'bg-green-500 animate-pulse'
                      : getConnectionState(viewingConnection) === 'error'
                        ? 'bg-red-500'
                        : 'bg-gray-500'
                    }`}></span>
                    <span>{getConnectionState(viewingConnection) === 'active' ? 'Active' : 'Disconnected'}</span>
                    {viewingConnection.disconnected_at && viewingConnection.close_code && (
                      <span className="text-xs font-mono ml-1 px-1.5 py-0.5 bg-dark-600/70 rounded-sm">Code: {viewingConnection.close_code}</span>
                    )}
                  </div>
                </div>

                {/* User Information */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-cyan-300 pb-1 relative">
                    User Information
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-dark-300/70 to-transparent"></div>
                  </h4>
                  
                  <div>
                    <div className="text-xs text-gray-400">Wallet Address</div>
                    <div className="text-sm text-white font-mono break-all">
                      {viewingConnection.wallet_address || 'Not authenticated'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-400">Nickname</div>
                    <div className="text-sm text-white">
                      {viewingConnection.nickname || '-'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-400">Authentication</div>
                    <div className="text-sm text-white">
                      {viewingConnection.is_authenticated ? 'Authenticated' : 'Not authenticated'}
                    </div>
                  </div>
                </div>

                {/* Connection Information */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-cyan-300 pb-1 relative">
                    Connection Information
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-dark-300/70 to-transparent"></div>
                  </h4>
                  
                  <div>
                    <div className="text-xs text-gray-400">IP Address</div>
                    <div className="text-sm text-white font-mono">
                      {viewingConnection.ip_address}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-400">Location</div>
                    <div className="text-sm text-white">
                      {[viewingConnection.city, viewingConnection.region, viewingConnection.country]
                        .filter(Boolean)
                        .join(', ') || 'Unknown'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-400">Environment</div>
                    <div className="text-sm text-white">
                      {viewingConnection.environment}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-400">Origin</div>
                    <div className="text-sm text-white">
                      {viewingConnection.origin}
                    </div>
                  </div>
                </div>

                {/* Timing Information */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-cyan-300 pb-1 relative">
                    Timing Information
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-dark-300/70 to-transparent"></div>
                  </h4>
                  
                  <div>
                    <div className="text-xs text-gray-400">Connected At</div>
                    <div className="text-sm text-white">
                      {format(new Date(viewingConnection.connected_at), 'MMM d, yyyy HH:mm:ss')}
                    </div>
                  </div>
                  
                  {viewingConnection.disconnected_at && (
                    <div>
                      <div className="text-xs text-gray-400">Disconnected At</div>
                      <div className="text-sm text-white">
                        {format(new Date(viewingConnection.disconnected_at), 'MMM d, yyyy HH:mm:ss')}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-xs text-gray-400">Duration</div>
                    <div className="text-sm text-white">
                      {viewingConnection.duration_seconds 
                        ? formatDuration(viewingConnection.duration_seconds)
                        : 'Active connection'}
                    </div>
                  </div>
                </div>

                {/* Message Information */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-cyan-300 pb-1 relative">
                    Message Information
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-dark-300/70 to-transparent"></div>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-400">Messages Received</div>
                      <div className="text-sm text-blue-400 font-mono">
                        {viewingConnection.messages_received}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-400">Messages Sent</div>
                      <div className="text-sm text-green-400 font-mono">
                        {viewingConnection.messages_sent}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-400">Subscribed Topics</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {viewingConnection.subscribed_topics && viewingConnection.subscribed_topics.length > 0
                        ? viewingConnection.subscribed_topics.map(topic => (
                            <span key={topic} className="text-xs bg-dark-400/50 text-gray-300 px-2 py-0.5 rounded">
                              {topic}
                            </span>
                          ))
                        : <span className="text-sm text-gray-500 italic">None</span>
                      }
                    </div>
                  </div>
                </div>

                {/* Disconnect Information (if applicable) */}
                {viewingConnection.disconnected_at && (
                  <div className="col-span-full space-y-3">
                    <h4 className="text-sm font-semibold text-cyan-300 pb-1 relative">
                      Disconnect Information
                      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-dark-300/70 to-transparent"></div>
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-400">Close Code</div>
                        <div className="text-sm text-white font-mono">
                          {viewingConnection.close_code || 'Unknown'}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-400">Close Reason</div>
                        <div className="text-sm text-white">
                          {viewingConnection.close_reason || 'No reason provided'}
                        </div>
                      </div>
                    </div>
                    
                    {viewingConnection.connection_error && (
                      <div>
                        <div className="text-xs text-gray-400">Error</div>
                        <div className="text-sm text-red-400 p-2 bg-red-500/10 border border-red-500/20 rounded-md mt-1">
                          {viewingConnection.connection_error}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* User Agent Information */}
                <div className="col-span-full">
                  <h4 className="text-sm font-semibold text-cyan-300 pb-1 relative">
                    User Agent
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-dark-300/70 to-transparent"></div>
                  </h4>
                  <div className="mt-2 p-3 bg-gradient-to-br from-dark-400/40 to-dark-300/30 text-xs text-gray-300 font-mono rounded break-all whitespace-pre-wrap relative overflow-hidden"
                      style={{ boxShadow: "inset 0 0 2px rgba(0,0,0,0.3), 0 0 1px rgba(255,255,255,0.05)" }}
                  >
                    {/* Subtle decoration */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-700/20 to-transparent"></div>
                    <div className="relative z-10">
                      {viewingConnection.user_agent}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketConnectionPanel;