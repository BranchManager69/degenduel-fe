import React, { useEffect, useState } from 'react';
import { admin } from '../../services/api/admin';
import { ClientError, ClientErrorFilters, ClientErrorStats } from '../../types/clientErrors';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ClientErrorManagementProps {
  limit?: number;
}

export const ClientErrorManagement: React.FC<ClientErrorManagementProps> = ({ limit = 10 }) => {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<ClientError[]>([]);
  const [stats, setStats] = useState<ClientErrorStats | null>(null);
  const [selectedError, setSelectedError] = useState<ClientError | null>(null);
  const [filters, setFilters] = useState<ClientErrorFilters>({
    status: 'open',
    page: 1,
    limit,
    sort: 'last_occurrence',
    order: 'desc'
  });
  const [totalErrors, setTotalErrors] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [processing, setProcessing] = useState<{[key: number]: boolean}>({});

  // Fetch errors and stats
  const fetchData = async () => {
    setLoading(true);
    try {
      const [errorsRes, statsRes] = await Promise.all([
        admin.clientErrors.list(filters),
        admin.clientErrors.getStats(),
      ]);
      
      setErrors(errorsRes.errors);
      setTotalErrors(errorsRes.total);
      setStats(statsRes);
    } catch (error) {
      console.error("Failed to fetch error data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchData();
  }, [filters.page, filters.limit, filters.status, filters.critical, filters.sort, filters.order]);

  // Handle search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery) {
        setFilters(prev => ({ ...prev, search: searchQuery, page: 1 }));
      } else if (filters.search) {
        setFilters(prev => {
          const newFilters = { ...prev, page: 1 };
          delete newFilters.search;
          return newFilters;
        });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Handle marking an error as resolved
  const handleResolve = async (id: number) => {
    try {
      setProcessing(prev => ({ ...prev, [id]: true }));
      await admin.clientErrors.resolve(id);
      
      // Update local state
      setErrors(errors.map(err => 
        err.id === id ? { ...err, status: 'resolved' } : err
      ));
      
      // Refresh stats
      const newStats = await admin.clientErrors.getStats();
      setStats(newStats);
    } catch (error) {
      console.error(`Failed to resolve error ${id}:`, error);
    } finally {
      setProcessing(prev => {
        const newProcessing = { ...prev };
        delete newProcessing[id];
        return newProcessing;
      });
    }
  };

  // Handle marking an error as critical
  const handleToggleCritical = async (id: number, isCritical: boolean) => {
    try {
      setProcessing(prev => ({ ...prev, [id]: true }));
      await admin.clientErrors.setCritical(id, isCritical);
      
      // Update local state
      setErrors(errors.map(err => 
        err.id === id ? { ...err, is_critical: isCritical } : err
      ));
      
      // Refresh stats
      const newStats = await admin.clientErrors.getStats();
      setStats(newStats);
    } catch (error) {
      console.error(`Failed to update critical status for error ${id}:`, error);
    } finally {
      setProcessing(prev => {
        const newProcessing = { ...prev };
        delete newProcessing[id];
        return newProcessing;
      });
    }
  };

  // Handle batch resolve
  const handleBatchResolve = async () => {
    try {
      const openErrorIds = errors
        .filter(err => err.status === 'open')
        .map(err => err.id);
        
      if (openErrorIds.length === 0) return;
      
      setLoading(true);
      await admin.clientErrors.batchResolve(openErrorIds);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Failed to batch resolve errors:", error);
      setLoading(false);
    }
  };

  // Handle view error details
  const handleViewDetails = async (error: ClientError) => {
    setSelectedError(error);
    
    // If we don't have complete details, fetch them
    if (!error.stack) {
      try {
        const detailedError = await admin.clientErrors.get(error.id);
        setSelectedError(detailedError);
      } catch (err) {
        console.error("Failed to fetch error details:", err);
      }
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  // Helper to get the field value regardless of API field name differences
  const getField = <T extends unknown>(obj: any, fields: string[], defaultValue: T): T => {
    for (const field of fields) {
      if (obj[field] !== undefined) return obj[field] as T;
    }
    return defaultValue;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      {stats && (
        <div className="bg-dark-300/30 rounded-lg p-4 border border-blue-500/20">
          <h3 className="text-lg font-bold text-blue-300 mb-4">Error Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-dark-200/50 p-3 rounded-lg border border-blue-500/10">
              <div className="text-xs text-blue-300/70 mb-1">Total Errors</div>
              <div className="text-xl font-bold text-white">{stats.total_errors}</div>
            </div>
            <div className="bg-dark-200/50 p-3 rounded-lg border border-red-500/10">
              <div className="text-xs text-red-300/70 mb-1">Open Issues</div>
              <div className="text-xl font-bold text-red-300">{stats.open_errors}</div>
            </div>
            <div className="bg-dark-200/50 p-3 rounded-lg border border-green-500/10">
              <div className="text-xs text-green-300/70 mb-1">Resolved</div>
              <div className="text-xl font-bold text-green-300">{stats.resolved_errors}</div>
            </div>
            <div className="bg-dark-200/50 p-3 rounded-lg border border-amber-500/10">
              <div className="text-xs text-amber-300/70 mb-1">Critical</div>
              <div className="text-xl font-bold text-amber-300">{stats.critical_errors}</div>
            </div>
            <div className="bg-dark-200/50 p-3 rounded-lg border border-purple-500/10">
              <div className="text-xs text-purple-300/70 mb-1">Last 24h</div>
              <div className="text-xl font-bold text-purple-300">{stats.recent_errors}</div>
            </div>
          </div>

          {/* Most Frequent Errors */}
          {stats.most_frequent && stats.most_frequent.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">Most Frequent Errors</h4>
              <div className="bg-dark-400/30 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-dark-500/50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Error</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Count</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-400">Last Occurrence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {stats.most_frequent.map(error => (
                      <tr key={error.id} className="hover:bg-dark-500/30 cursor-pointer" onClick={() => handleViewDetails(error)}>
                        <td className="px-4 py-3">
                          <div className="flex items-start">
                            {error.is_critical && (
                              <span className="mr-2 text-amber-500">⚠</span>
                            )}
                            <div>
                              <div className="font-medium text-blue-300">{error.name}</div>
                              <div className="text-sm text-gray-400 truncate max-w-xs">{error.message}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {getField(error, ['occurrence_count', 'occurrences'], 0)}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {formatDate(getField(error, ['last_occurrence', 'last_occurred_at'], ''))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-gray-400 text-sm">Status:</label>
            <select 
              value={filters.status || 'all'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="bg-dark-400 border border-dark-300 rounded-md px-3 py-1 text-sm text-gray-300"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Critical Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-gray-400 text-sm">Priority:</label>
            <select 
              value={filters.critical === undefined ? 'all' : filters.critical ? 'critical' : 'normal'}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange('critical', value === 'all' ? undefined : value === 'critical');
              }}
              className="bg-dark-400 border border-dark-300 rounded-md px-3 py-1 text-sm text-gray-300"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="normal">Normal</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-gray-400 text-sm">Sort by:</label>
            <select 
              value={filters.sort || 'last_occurrence'}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="bg-dark-400 border border-dark-300 rounded-md px-3 py-1 text-sm text-gray-300"
            >
              <option value="last_occurrence">Last Occurrence</option>
              <option value="first_occurrence">First Occurrence</option>
              <option value="occurrence_count">Frequency</option>
            </select>
            <select 
              value={filters.order || 'desc'}
              onChange={(e) => handleFilterChange('order', e.target.value)}
              className="bg-dark-400 border border-dark-300 rounded-md px-3 py-1 text-sm text-gray-300"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search errors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-dark-400 border border-dark-300 rounded-md pl-8 pr-4 py-1.5 text-sm text-gray-300 w-44 md:w-64"
            />
            <span className="absolute left-2.5 top-2 text-gray-500">🔍</span>
          </div>

          {/* Batch Resolve */}
          {filters.status === 'open' && errors.filter(e => e.status === 'open').length > 0 && (
            <button 
              onClick={handleBatchResolve}
              disabled={loading}
              className="text-xs bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-md px-3 py-1.5 transition-colors"
            >
              Resolve All
            </button>
          )}

          {/* Refresh */}
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-md px-2 py-1.5 transition-colors"
          >
            {loading ? <LoadingSpinner size="sm" /> : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* Errors Table */}
      <div className="bg-dark-300/30 rounded-lg border border-dark-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : errors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No errors found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-dark-400/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Error</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Occurrences</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Last Occurrence</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {errors.map(error => (
                  <tr 
                    key={error.id} 
                    className={`hover:bg-dark-400/30 ${error.status === 'resolved' ? 'opacity-70' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div 
                        className="cursor-pointer" 
                        onClick={() => handleViewDetails(error)}
                      >
                        <div className="flex items-start">
                          {error.is_critical && (
                            <span className="mr-2 text-amber-500">⚠</span>
                          )}
                          <div>
                            <div className="font-medium text-blue-300">{error.name}</div>
                            <div className="text-sm text-gray-400 truncate max-w-xs">{error.message}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-400 truncate max-w-xs">
                        {getField(error, ['source', 'source_url'], '—')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {getField(error, ['occurrence_count', 'occurrences'], 0)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {formatDate(getField(error, ['last_occurrence', 'last_occurred_at'], ''))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        error.status === 'open' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                      }`}>
                        {error.status === 'open' ? 'Open' : 'Resolved'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleToggleCritical(error.id, !error.is_critical)}
                          disabled={!!processing[error.id]}
                          className={`text-xs ${
                            error.is_critical
                              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                              : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                          } rounded-md px-2 py-1 transition-colors`}
                          title={error.is_critical ? "Mark as normal" : "Mark as critical"}
                        >
                          {processing[error.id] ? <LoadingSpinner size="sm" /> : (error.is_critical ? '⚠' : '☒')}
                        </button>
                        
                        {error.status === 'open' && (
                          <button
                            onClick={() => handleResolve(error.id)}
                            disabled={!!processing[error.id]}
                            className="text-xs bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-md px-2 py-1 transition-colors"
                            title="Mark as resolved"
                          >
                            {processing[error.id] ? <LoadingSpinner size="sm" /> : '✓'}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleViewDetails(error)}
                          className="text-xs bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded-md px-2 py-1 transition-colors"
                          title="View details"
                        >
                          👁
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalErrors > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-400">
            Showing {errors.length} of {totalErrors} errors
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(1, filters.page || 1))}
              disabled={loading || (filters.page || 1) <= 1}
              className="px-3 py-1 rounded bg-dark-400 text-gray-300 disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
              disabled={loading || (filters.page || 1) <= 1}
              className="px-3 py-1 rounded bg-dark-400 text-gray-300 disabled:opacity-50"
            >
              ← Prev
            </button>
            <span className="text-gray-400">Page {filters.page || 1}</span>
            <button
              onClick={() => handlePageChange((filters.page || 1) + 1)}
              disabled={loading || errors.length < (filters.limit || 10)}
              className="px-3 py-1 rounded bg-dark-400 text-gray-300 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-300 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-dark-300 p-4 border-b border-dark-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-blue-300">Error Details</h3>
              <button 
                onClick={() => setSelectedError(null)}
                className="text-gray-400 hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Error Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <h4 className="text-xl font-bold text-white">{selectedError.name}</h4>
                    {selectedError.is_critical && (
                      <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-xs">
                        Critical
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      selectedError.status === 'open' 
                        ? 'bg-red-500/20 text-red-300' 
                        : 'bg-green-500/20 text-green-300'
                    }`}>
                      {selectedError.status === 'open' ? 'Open' : 'Resolved'}
                    </span>
                  </div>
                  <p className="text-gray-300 mt-1">{selectedError.message}</p>
                </div>
                
                <div className="flex space-x-2">
                  {selectedError.status === 'open' && (
                    <button
                      onClick={() => {
                        handleResolve(selectedError.id);
                        setSelectedError(prev => prev ? { ...prev, status: 'resolved' } : null);
                      }}
                      className="text-xs bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-md px-3 py-1.5 transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                  <button
                    onClick={() => {
                      handleToggleCritical(selectedError.id, !selectedError.is_critical);
                      setSelectedError(prev => prev ? { ...prev, is_critical: !prev.is_critical } : null);
                    }}
                    className={`text-xs ${
                      selectedError.is_critical
                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                    } rounded-md px-3 py-1.5 transition-colors`}
                  >
                    {selectedError.is_critical ? 'Mark Non-Critical' : 'Mark Critical'}
                  </button>
                </div>
              </div>
              
              {/* Error Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Occurrence Information</h5>
                  <div className="bg-dark-400/30 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">First Occurrence:</span>
                      <span className="text-gray-300">
                        {formatDate(getField(selectedError, ['first_occurrence', 'created_at'], ''))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Occurrence:</span>
                      <span className="text-gray-300">
                        {formatDate(getField(selectedError, ['last_occurrence', 'last_occurred_at'], ''))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Occurrences:</span>
                      <span className="text-gray-300">
                        {getField(selectedError, ['occurrence_count', 'occurrences'], 0)}
                      </span>
                    </div>
                    {selectedError.resolved_at && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Resolved At:</span>
                        <span className="text-gray-300">{formatDate(selectedError.resolved_at)}</span>
                      </div>
                    )}
                    {selectedError.resolved_by && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Resolved By:</span>
                        <span className="text-gray-300">{selectedError.resolved_by}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Error ID:</span>
                      <span className="text-gray-300 font-mono text-xs">{selectedError.error_id}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Source Information</h5>
                  <div className="bg-dark-400/30 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Source:</span>
                      <span className="text-gray-300">{getField(selectedError, ['source', 'source_url'], '—')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Line:</span>
                      <span className="text-gray-300">{getField(selectedError, ['lineno', 'line_number'], '—')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Column:</span>
                      <span className="text-gray-300">{getField(selectedError, ['colno', 'column_number'], '—')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Browser:</span>
                      <span className="text-gray-300">
                        {selectedError.browser_version 
                          ? `${selectedError.browser} ${selectedError.browser_version}` 
                          : selectedError.browser || '—'}
                      </span>
                    </div>
                    {(selectedError.os || selectedError.environment) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">OS / Environment:</span>
                        <span className="text-gray-300">
                          {[
                            selectedError.os,
                            selectedError.environment ? `(${selectedError.environment})` : null
                          ].filter(Boolean).join(' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Stack Trace */}
              {(selectedError.stack || selectedError.stack_trace) && (
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Stack Trace</h5>
                  <pre className="bg-dark-400/30 rounded-lg p-4 overflow-x-auto text-xs text-gray-300 font-mono">
                    {selectedError.stack || selectedError.stack_trace}
                  </pre>
                </div>
              )}
              
              {/* User Information */}
              {(selectedError.user_id || selectedError.user_wallet || selectedError.userWallet || 
                (selectedError.user && selectedError.user.wallet_address)) && (
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">User Information</h5>
                  <div className="bg-dark-400/30 rounded-lg p-4 space-y-3">
                    {(selectedError.user_id || (selectedError.user && selectedError.user.id)) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">User ID:</span>
                        <span className="text-gray-300">
                          {selectedError.user_id || (selectedError.user && selectedError.user.id)}
                        </span>
                      </div>
                    )}
                    {(selectedError.user && selectedError.user.username) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Username:</span>
                        <span className="text-gray-300">{selectedError.user.username}</span>
                      </div>
                    )}
                    {(selectedError.user_wallet || selectedError.userWallet || 
                      (selectedError.user && selectedError.user.wallet_address)) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Wallet:</span>
                        <span className="text-gray-300 font-mono text-xs">
                          {selectedError.user_wallet || selectedError.userWallet || 
                            (selectedError.user && selectedError.user.wallet_address)}
                        </span>
                      </div>
                    )}
                    {(selectedError.ip_address) && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">IP Address:</span>
                        <span className="text-gray-300 font-mono text-xs">{selectedError.ip_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Additional Context */}
              {selectedError.context && Object.keys(selectedError.context).length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Additional Context</h5>
                  <pre className="bg-dark-400/30 rounded-lg p-4 overflow-x-auto text-xs text-gray-300 font-mono">
                    {JSON.stringify(selectedError.context, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* Tags */}
              {selectedError.tags && selectedError.tags.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Tags</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedError.tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="bg-blue-500/20 text-blue-300 rounded-full px-3 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};