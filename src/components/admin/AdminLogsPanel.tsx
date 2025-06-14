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
        hoverClass: 'group-hover:bg-red-500/15',
        gradientClass: 'from-red-500/10 via-red-500/5 to-transparent'
      };
    } else if (action.includes('ADD') || action.includes('CREATE') || action.includes('INSERT')) {
      return {
        bgClass: 'bg-green-900/50',
        textClass: 'text-green-200',
        borderClass: 'border-green-500/70',
        hoverClass: 'group-hover:bg-green-500/15',
        gradientClass: 'from-green-500/10 via-green-500/5 to-transparent'
      };
    } else if (action.includes('UPDATE') || action.includes('EDIT') || action.includes('MODIFY')) {
      return {
        bgClass: 'bg-yellow-900/50',
        textClass: 'text-yellow-200',
        borderClass: 'border-yellow-500/70',
        hoverClass: 'group-hover:bg-yellow-500/15',
        gradientClass: 'from-yellow-500/10 via-yellow-500/5 to-transparent'
      };
    } else {
      return {
        bgClass: 'bg-blue-900/50',
        textClass: 'text-blue-200',
        borderClass: 'border-blue-500/70',
        hoverClass: 'group-hover:bg-blue-500/15',
        gradientClass: 'from-blue-500/10 via-blue-500/5 to-transparent'
      };
    }
  };

  return (
    <div className="bg-dark-200/60 backdrop-blur-sm border border-dark-300 p-4 shadow-lg relative h-full min-w-0 overflow-hidden">
      {/* Top horizontal scanner line animation */}
      <div className="absolute inset-0 h-px w-full bg-brand-400/30 animate-scan-fast"></div>
      
      {/* Vertical scan line */}
      <div className="absolute inset-0 w-px h-full bg-brand-400/10 animate-cyber-scan"></div>
      
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-100/5 to-dark-300/10 pointer-events-none"></div>
      
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-4 relative">
        <h2 className="text-lg font-bold text-white">Recent Admin Actions</h2>
        <button 
          onClick={fetchLogs} 
          className="text-xs text-cyber-400 hover:text-cyber-300 flex items-center group"
          disabled={loading}
        >
          <span className="mr-1 transform group-hover:rotate-180 transition-transform duration-500">↻</span> 
          <span className="relative overflow-hidden">
            Refresh
            <span className="absolute bottom-0 left-0 w-full h-px bg-cyber-400/50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
          </span>
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
          <div className="relative">
            <div className="w-10 h-10 border-4 border-brand-600 border-t-brand-300 rounded-full animate-spin shadow-lg shadow-brand-500/20"></div>
            <div className="absolute inset-0 w-10 h-10 border-4 border-transparent border-t-brand-400/30 rounded-full animate-ping"></div>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 font-mono">
          <div className="text-gray-400 border border-dark-400 rounded p-4 bg-dark-300/30 inline-block">
            <div className="text-xs text-brand-400 mb-2">NO_LOGS_FOUND</div>
            <div className="text-sm">No administrator actions recorded</div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4 max-h-[460px] overflow-y-auto hide-scrollbar pr-1">
            <AnimatePresence>
              {logs
                .filter(log => log.action !== 'ADMIN_LOGS_VIEW')
                .map((log, index) => {
                const theme = getActionTheme(log.action);
                
                return (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-dark-300/60 border-2 border-dark-400 overflow-hidden hover:bg-dark-300/80 transition-all duration-300 group relative min-w-0 max-w-full"
                  >
                    {/* Background scanner effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                    
                    {/* Corner markers for cyberpunk feel - more pronounced */}
                    <div className={`absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 ${theme.borderClass}`}></div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 ${theme.borderClass}`}></div>
                    
                    {/* Edge-to-edge colored header with action and time */}
                    <div className={`flex items-center justify-between px-3 py-2 ${theme.bgClass} ${theme.textClass} min-w-0`}>
                      <span className="text-xs font-medium truncate flex-1 min-w-0 mr-2">
                        {log.action}
                      </span>
                      <span className="text-xs opacity-80 flex-shrink-0 whitespace-nowrap">
                        {format(new Date(log.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    
                    {/* Content area with padding */}
                    <div className="p-3 min-w-0">
                      {/* Details as a responsive grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-2 min-w-0 max-w-full">
                        {Object.entries(log.details)
                          .filter(([key]) => key !== '__v' && key !== '_id')
                          .slice(0, 6) // Show up to 6 details
                          .map(([key, value]) => (
                            <div key={key} className="flex flex-col min-w-0 max-w-full">
                              <span className="text-gray-400 text-xs truncate">{key.replace(/_/g, ' ')}</span>
                              <span className="text-gray-300 text-sm truncate break-all">
                                {typeof value === 'object' 
                                  ? JSON.stringify(value).substring(0, 15) + (JSON.stringify(value).length > 15 ? '...' : '')
                                  : String(value).substring(0, 15) + (String(value).length > 15 ? '...' : '')}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                      
                      {/* Footer with admin address and IP */}
                      <div className="mt-3 pt-2 border-t border-dark-400 flex items-center justify-between text-xs min-w-0 gap-2">
                        <div className="font-mono flex-shrink-0 min-w-0">
                          {isWalletAddress(log.admin_address) ? (
                            <a 
                              href={`https://solscan.io/account/${log.admin_address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyber-400 hover:text-cyber-300 relative group truncate block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {formatShortAddress(log.admin_address)}
                              <span className="absolute -bottom-px left-0 right-0 h-px bg-cyber-400/50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
                            </a>
                          ) : (
                            <span className="text-gray-500 truncate block">{formatShortAddress(log.admin_address)}</span>
                          )}
                        </div>
                        {log.ip_address && (
                          <div className="text-gray-500 truncate flex-shrink-0 text-right max-w-[50%]">
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

          {/* Pagination - stylized version */}
          {pagination && (
            <div className="flex items-center justify-between mt-4 min-w-0 gap-2">
              <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                Showing {pagination.page} of {pagination.totalPages} pages
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handlePrevPage}
                  disabled={!pagination.hasPrevPage}
                  className={`px-3 py-1 text-xs border-2 ${
                    pagination.hasPrevPage
                      ? 'border-cyber-500/60 bg-cyber-900/25 text-cyber-400 hover:bg-cyber-900/40 relative overflow-hidden group'
                      : 'border-gray-700 bg-gray-900/40 text-gray-600 cursor-not-allowed'
                  } whitespace-nowrap transition-all duration-300`}
                >
                  {pagination.hasPrevPage && (
                    <span className="absolute inset-0 w-full h-px bg-cyber-400/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></span>
                  )}
                  ← Prev
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage}
                  className={`px-3 py-1 text-xs border-2 ${
                    pagination.hasNextPage
                      ? 'border-cyber-500/60 bg-cyber-900/25 text-cyber-400 hover:bg-cyber-900/40 relative overflow-hidden group'
                      : 'border-gray-700 bg-gray-900/40 text-gray-600 cursor-not-allowed'
                  } whitespace-nowrap transition-all duration-300`}
                >
                  {pagination.hasNextPage && (
                    <span className="absolute inset-0 w-full h-px bg-cyber-400/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></span>
                  )}
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