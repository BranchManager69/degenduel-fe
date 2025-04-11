import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TokenSyncStatusWidget: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/token-sync/status');
      setStatus(response.data);
      setError(null);
    } catch (err: any) {
      setError('Failed to fetch token sync status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchStatus();

    // Poll for updates every 10 seconds if sync is in progress
    const interval = setInterval(() => {
      if (status?.inProgress) {
        fetchStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [status?.inProgress]);

  if (loading && !status) return (
    <div className="flex items-center justify-center p-6">
      <div className="animate-spin h-8 w-8 border-4 border-brand-500 rounded-full border-t-transparent"></div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
      {error}
    </div>
  );
  
  if (!status) return (
    <div className="text-gray-400 p-4">No token status available</div>
  );

  // Format progress and metrics for display
  const coverage = parseFloat(status.database.coverage).toFixed(1);
  const remaining = status.database.remaining.toLocaleString();
  const tokenCount = status.database.tokenCount.toLocaleString();
  const jupiterCount = status.database.jupiterTokens.toLocaleString();

  // Calculate progress percentage for sync in progress
  const progressPercent = status.inProgress && status.lastSyncStats ? 
    Math.min(100, Math.round((status.lastSyncStats.batchesProcessed / status.lastSyncStats.totalBatches) * 100)) : 0;

  return (
    <div className="token-sync-widget">
      <h3 className="text-lg font-semibold mb-4 text-gray-200">Token Sync Status</h3>

      {/* Status indicator */}
      <div className="mb-4 flex items-center gap-3">
        <div className="text-sm font-medium text-gray-300">Status:</div>
        {status.inProgress ? (
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-green-400 font-medium">Sync in Progress</span>
          </div>
        ) : status.scheduled ? (
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-yellow-500"></span>
            <span className="text-yellow-400 font-medium">Scheduled</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-gray-500"></span>
            <span className="text-gray-400 font-medium">Idle</span>
          </div>
        )}
      </div>

      {/* Progress bar - only show when sync is in progress */}
      {status.inProgress && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-dark-300 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          {status.lastSyncStats && (
            <div className="text-xs text-gray-400 mt-1">
              Processing batch {status.lastSyncStats.batchesProcessed} of {status.lastSyncStats.totalBatches}
            </div>
          )}
        </div>
      )}

      {/* Token database stats */}
      <div className="mb-6 bg-dark-200/50 rounded-lg p-4 border border-dark-100/10">
        <h4 className="text-md font-semibold mb-3 text-gray-300">Database Status</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-dark-300/50 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Database tokens</div>
            <div className="text-lg font-mono text-gray-200">{tokenCount}</div>
          </div>
          <div className="bg-dark-300/50 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Available tokens</div>
            <div className="text-lg font-mono text-gray-200">{jupiterCount}</div>
          </div>
          <div className="bg-dark-300/50 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Coverage</div>
            <div className="text-lg font-mono text-brand-400">{coverage}%</div>
          </div>
          <div className="bg-dark-300/50 p-3 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Remaining</div>
            <div className="text-lg font-mono text-gray-200">{remaining}</div>
          </div>
        </div>
      </div>

      {/* Last sync results */}
      {status.lastSyncStats && (
        <div className="mb-4 bg-dark-200/50 rounded-lg p-4 border border-dark-100/10">
          <h4 className="text-md font-semibold mb-3 text-gray-300">Last Sync Results</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="stat flex flex-col">
              <span className="text-xs text-gray-400">Added</span>
              <span className="text-md font-medium text-gray-200">{status.lastSyncStats.addedCount.toLocaleString()}</span>
            </div>
            <div className="stat flex flex-col">
              <span className="text-xs text-gray-400">Duration</span>
              <span className="text-md font-medium text-gray-200">{status.lastSyncStats.elapsedSeconds}s</span>
            </div>
            <div className="stat flex flex-col">
              <span className="text-xs text-gray-400">Speed</span>
              <span className="text-md font-medium text-gray-200">{status.lastSyncStats.tokensPerSecond} tokens/sec</span>
            </div>
            <div className="stat flex flex-col">
              <span className="text-xs text-gray-400">Completed</span>
              <span className="text-md font-medium text-gray-200">
                {new Date(status.lastSyncStats.completedAt).toLocaleTimeString()}
              </span>
            </div>
            {(status.lastSyncStats.skippedCount > 0 || status.lastSyncStats.errorCount > 0) && (
              <>
                <div className="stat flex flex-col">
                  <span className="text-xs text-gray-400">Skipped</span>
                  <span className="text-md font-medium text-yellow-400">{status.lastSyncStats.skippedCount}</span>
                </div>
                <div className="stat flex flex-col">
                  <span className="text-xs text-gray-400">Errors</span>
                  <span className="text-md font-medium text-red-400">{status.lastSyncStats.errorCount}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Last sync error */}
      {status.lastSyncError && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <h4 className="text-md font-semibold mb-1 text-red-400">Last Sync Error</h4>
          <div className="text-sm text-red-400">{status.lastSyncError.message}</div>
          <div className="text-xs text-red-300/70 mt-1">
            {new Date(status.lastSyncError.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {/* Refresh button */}
      <button 
        onClick={fetchStatus}
        className="w-full py-2 px-4 bg-dark-300 hover:bg-dark-400 transition-colors rounded-lg text-gray-300 flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh Status
      </button>
    </div>
  );
};

export default TokenSyncStatusWidget;