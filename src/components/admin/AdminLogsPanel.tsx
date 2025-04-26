import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Types for admin logs
interface AdminLog {
  id: number;
  admin_address: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface AdminLogsPagination {
  page: number;
  limit: number;
  totalLogs: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface AdminLogsResponse {
  success: boolean;
  logs: AdminLog[];
  pagination: AdminLogsPagination;
  error?: string;
}

export const AdminLogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<AdminLogsPagination | null>(null);
  const limit = 10; // Show 10 logs at a time

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/admin-logs?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch admin logs: ${response.status}`);
      }
      
      const data: AdminLogsResponse = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load admin logs');
      }
      
      setLogs(data.logs);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin logs');
      toast.error('Failed to load admin logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

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

  // Format admin address for display (truncate if needed)
  const formatShortAddress = (address: string) => {
    if (address === 'SYSTEM' || address === 'pm2') return address;
    if (address.length > 12) {
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
    return address;
  };
  
  // Check if address is a wallet that should link to Solscan
  const isWalletAddress = (address: string) => {
    return address !== 'SYSTEM' && address !== 'pm2' && address.length >= 32;
  };

  // Get color theme based on action type
  const getActionTheme = (action: string) => {
    if (action.includes('DELETE') || action.includes('REMOVE') || action.includes('BAN')) {
      return {
        bgClass: 'bg-red-900/50',
        textClass: 'text-red-200',
        borderClass: 'border-red-500/70',
        hoverClass: 'group-hover:bg-red-500/15'
      };
    } else if (action.includes('ADD') || action.includes('CREATE') || action.includes('INSERT')) {
      return {
        bgClass: 'bg-green-900/50',
        textClass: 'text-green-200',
        borderClass: 'border-green-500/70',
        hoverClass: 'group-hover:bg-green-500/15'
      };
    } else if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('MODIFY')) {
      return {
        bgClass: 'bg-yellow-900/50',
        textClass: 'text-yellow-200',
        borderClass: 'border-yellow-500/70',
        hoverClass: 'group-hover:bg-yellow-500/15'
      };
    } else {
      return {
        bgClass: 'bg-blue-900/50',
        textClass: 'text-blue-200',
        borderClass: 'border-blue-500/70',
        hoverClass: 'group-hover:bg-blue-500/15'
      };
    }
  };

  return (
    <div className="bg-dark-200/60 backdrop-blur-sm border border-dark-300 rounded-lg p-4 shadow-lg relative h-full">
      {/* Horizontal scan line animation */}
      <div className="absolute inset-0 h-px w-full bg-cyber-500/30 animate-scan-fast"></div>
      
      <div className="flex items-center justify-between mb-4 relative">
        <h2 className="text-lg font-bold text-white">Recent Admin Actions</h2>
        <button 
          onClick={fetchLogs} 
          className="text-xs text-cyber-400 hover:text-cyber-300 flex items-center"
          disabled={loading}
        >
          <span className="mr-1">↻</span> Refresh
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-300 text-sm">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-cyber-600 border-t-cyber-300 rounded-full animate-spin shadow-lg shadow-cyber-500/20"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-400 font-mono">
          No admin logs found
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            <AnimatePresence>
              {logs.map((log, index) => {
                const theme = getActionTheme(log.action);
                
                return (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-dark-300/60 border-2 border-dark-400 overflow-hidden hover:bg-dark-300/80 transition-colors rounded group"
                  >
                    {/* Edge-to-edge colored header with action and time */}
                    <div className={`flex items-center justify-between px-3 py-2 ${theme.bgClass} ${theme.textClass}`}>
                      <span className="text-xs font-medium whitespace-nowrap">
                        {log.action}
                      </span>
                      <span className="text-xs opacity-80 whitespace-nowrap">
                        {format(new Date(log.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    
                    {/* Content area with padding */}
                    <div className="p-3 relative overflow-hidden">
                      {/* Scanner effect */}
                      <div className={`absolute inset-0 w-full h-16 bg-gradient-to-r from-transparent via-${theme.textClass.split('-')[1]}-500/5 to-transparent -translate-x-full group-hover:translate-x-full duration-1500 ease-in-out transition-transform`}></div>
                    
                      {/* Corner markers for cyberpunk feel */}
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-brand-500/30"></div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-brand-500/30"></div>
                      
                      {/* Details as a grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {Object.entries(log.details)
                          .filter(([key]) => key !== '__v' && key !== '_id')
                          .slice(0, 6) // Show up to 6 details
                          .map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                              <span className="text-gray-400 text-xs">{key.replace(/_/g, ' ')}</span>
                              <span className="text-gray-300 text-sm truncate">
                                {typeof value === 'object' 
                                  ? JSON.stringify(value).substring(0, 30) + (JSON.stringify(value).length > 30 ? '...' : '')
                                  : String(value).substring(0, 30) + (String(value).length > 30 ? '...' : '')}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                      
                      {/* Footer with admin address and IP */}
                      <div className="mt-3 pt-2 border-t border-dark-400 flex items-center justify-between text-xs">
                        <div className="font-mono">
                          {isWalletAddress(log.admin_address) ? (
                            <a 
                              href={`https://solscan.io/account/${log.admin_address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyber-400 hover:text-cyber-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {formatShortAddress(log.admin_address)}
                            </a>
                          ) : (
                            <span className="text-gray-500">{formatShortAddress(log.admin_address)}</span>
                          )}
                        </div>
                        {log.ip_address && (
                          <div className="text-gray-500 truncate max-w-[50%]">
                            {log.ip_address}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-400 whitespace-nowrap">
                Showing {pagination.page} of {pagination.totalPages} pages
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={!pagination.hasPrevPage}
                  className={`px-3 py-1 text-xs border-2 ${
                    pagination.hasPrevPage
                      ? 'border-cyber-500/60 bg-cyber-900/25 text-cyber-400 hover:bg-cyber-900/40'
                      : 'border-gray-700 bg-gray-900/40 text-gray-600 cursor-not-allowed'
                  } whitespace-nowrap`}
                >
                  ← Prev
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage}
                  className={`px-3 py-1 text-xs border-2 ${
                    pagination.hasNextPage
                      ? 'border-cyber-500/60 bg-cyber-900/25 text-cyber-400 hover:bg-cyber-900/40'
                      : 'border-gray-700 bg-gray-900/40 text-gray-600 cursor-not-allowed'
                  } whitespace-nowrap`}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminLogsPanel;