import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

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

  // We no longer need this function as we've refactored the details display

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

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 rounded-lg p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Recent Admin Actions</h2>
        <button 
          onClick={fetchLogs} 
          className="text-xs text-cyber-400 hover:text-cyber-300 flex items-center"
          disabled={loading}
        >
          <span className="mr-1">↻</span> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-cyber-600 border-t-cyber-300 rounded-full animate-spin"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No admin logs found
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {logs.map(log => (
              <div 
                key={log.id} 
                className="bg-dark-300/50 border border-dark-400 rounded overflow-hidden hover:bg-dark-300/70 transition-colors"
              >
                {/* Edge-to-edge colored header with action and time */}
                <div className={`flex items-center justify-between px-3 py-2 ${
                  log.action.includes('DELETE') || log.action.includes('REMOVE') || log.action.includes('BAN')
                    ? 'bg-red-900/40 text-red-200'
                    : log.action.includes('ADD') || log.action.includes('CREATE') || log.action.includes('INSERT')
                    ? 'bg-green-900/40 text-green-200'
                    : log.action.includes('UPDATE') || log.action.includes('EDIT') || log.action.includes('MODIFY')
                    ? 'bg-yellow-900/40 text-yellow-200'
                    : 'bg-blue-900/40 text-blue-200'
                }`}>
                  <span className="text-xs font-medium whitespace-nowrap">
                    {log.action}
                  </span>
                  <span className="text-xs opacity-80 whitespace-nowrap">
                    {format(new Date(log.created_at), 'MMM d, HH:mm')}
                  </span>
                </div>
                
                {/* Content area with padding */}
                <div className="p-3">
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
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-xs text-gray-400">
                Showing {pagination.page} of {pagination.totalPages} pages
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
                  ← Prev
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
        </>
      )}
    </div>
  );
};

export default AdminLogsPanel;