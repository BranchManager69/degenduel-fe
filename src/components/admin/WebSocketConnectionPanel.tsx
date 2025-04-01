import React, { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Function to get connection status class
  const getStatusClass = (connection: WebSocketConnection) => {
    if (!connection.disconnected_at) {
      return 'bg-green-500/20 text-green-300 border-green-500/30';
    } 
    
    // If connection was closed with an error code
    if (connection.close_code && (connection.close_code !== 1000 && connection.close_code !== 1001)) {
      return 'bg-red-500/20 text-red-300 border-red-500/30';
    }
    
    // Normal closure
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
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
    <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg">
      {/* Header with expand/collapse control */}
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="text-xl text-brand-400">🔌</div>
          <h2 className="text-lg font-bold text-white">WebSocket Connections</h2>
          {!isExpanded && connections.length > 0 && (
            <div className="text-xs bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full border border-brand-500/30">
              {connections.filter(c => !c.disconnected_at).length} active
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              fetchConnections();
            }} 
            className="text-xs text-cyber-400 hover:text-cyber-300 flex items-center"
            disabled={loading}
          >
            <span className="mr-1">↻</span> Refresh
          </button>
          <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <span className="text-gray-400">⌄</span>
          </div>
        </div>
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
                        className="bg-dark-300/50 border border-dark-400 rounded-md hover:bg-dark-300/70 transition-colors cursor-pointer"
                        onClick={() => setViewingConnection(connection)}
                      >
                        <div className="p-3">
                          <div className="flex justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`px-2 py-0.5 text-xs rounded-md border ${getStatusClass(connection)}`}>
                                {connection.disconnected_at ? 'Disconnected' : 'Active'}
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
                            <div className="mt-2 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                              {connection.connection_error}
                            </div>
                          )}
                          
                          {/* If connection has topics, show them */}
                          {connection.subscribed_topics && connection.subscribed_topics.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {connection.subscribed_topics.map(topic => (
                                <span key={topic} className="text-xs bg-dark-400/50 text-gray-300 px-1.5 py-0.5 rounded">
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
                          className={`px-3 py-1 text-xs rounded border ${
                            pagination.hasPrevPage
                              ? 'border-cyber-500 bg-cyber-900/20 text-cyber-400 hover:bg-cyber-900/40'
                              : 'border-gray-700 bg-gray-900/20 text-gray-600 cursor-not-allowed'
                          }`}
                        >
                          ← Previous
                        </button>
                        <button
                          onClick={handleNextPage}
                          disabled={!pagination.hasNextPage}
                          className={`px-3 py-1 text-xs rounded border ${
                            pagination.hasNextPage
                              ? 'border-cyber-500 bg-cyber-900/20 text-cyber-400 hover:bg-cyber-900/40'
                              : 'border-gray-700 bg-gray-900/20 text-gray-600 cursor-not-allowed'
                          }`}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-200/90 border border-brand-500/20 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Connection Details</h3>
                  <div className="text-sm text-gray-400 font-mono mt-1">{viewingConnection.connection_id}</div>
                </div>
                <button 
                  onClick={() => setViewingConnection(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Connection Status */}
                <div className="col-span-full">
                  <div className={`px-3 py-1.5 text-sm inline-flex items-center gap-2 rounded-md border ${getStatusClass(viewingConnection)}`}>
                    <span className={`h-2 w-2 rounded-full ${viewingConnection.disconnected_at ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></span>
                    <span>{viewingConnection.disconnected_at ? 'Disconnected' : 'Active'}</span>
                    {viewingConnection.disconnected_at && viewingConnection.close_code && (
                      <span className="text-xs font-mono">Code: {viewingConnection.close_code}</span>
                    )}
                  </div>
                </div>

                {/* User Information */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-300 border-b border-dark-300 pb-1">User Information</h4>
                  
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
                  <h4 className="text-sm font-semibold text-gray-300 border-b border-dark-300 pb-1">Connection Information</h4>
                  
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
                  <h4 className="text-sm font-semibold text-gray-300 border-b border-dark-300 pb-1">Timing Information</h4>
                  
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
                  <h4 className="text-sm font-semibold text-gray-300 border-b border-dark-300 pb-1">Message Information</h4>
                  
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
                    <h4 className="text-sm font-semibold text-gray-300 border-b border-dark-300 pb-1">Disconnect Information</h4>
                    
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
                  <h4 className="text-sm font-semibold text-gray-300 border-b border-dark-300 pb-1">User Agent</h4>
                  <div className="mt-2 p-2 bg-dark-300/50 text-xs text-gray-300 font-mono rounded break-all whitespace-pre-wrap">
                    {viewingConnection.user_agent}
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