// src/components/admin/RPCBenchmarkSuperAdminDashboard.tsx

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRPCBenchmarkWebSocket } from '../../hooks/websocket/legacy/useRPCBenchmarkWebSocket';
import RPCBenchmarkDashboard from './RPCBenchmarkDashboard';

export const RPCBenchmarkSuperAdminDashboard: React.FC = () => {
  const { 
    isConnected, 
    isAuthenticated, 
    isBenchmarkRunning, 
    triggerBenchmark 
  } = useRPCBenchmarkWebSocket();
  
  const [isTriggering, setIsTriggering] = useState(false);

  // Update triggering state based on websocket feedback
  useEffect(() => {
    if (!isBenchmarkRunning && isTriggering) {
      setIsTriggering(false);
    }
  }, [isBenchmarkRunning, isTriggering]);

  const handleTriggerBenchmark = async () => {
    if (!isConnected || !isAuthenticated) {
      toast.error('WebSocket not connected or not authenticated');
      return;
    }
    
    setIsTriggering(true);
    
    try {
      const success = triggerBenchmark();
      
      if (success) {
        toast.success('Benchmark test triggered successfully');
      } else {
        throw new Error('Failed to trigger benchmark test');
      }
    } catch (error) {
      console.error('Error triggering benchmark:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to trigger benchmark test');
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-cyber tracking-wider bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
          RPC BENCHMARK CONTROL CENTER
        </h1>
        
        <button
          onClick={handleTriggerBenchmark}
          disabled={isTriggering || !isConnected || !isAuthenticated}
          className={`
            px-4 py-2 rounded-lg flex items-center gap-2 font-medium
            ${isTriggering || !isConnected || !isAuthenticated
              ? 'bg-cyber-500/20 text-cyber-400/50 cursor-not-allowed'
              : 'bg-cyber-500/30 hover:bg-cyber-500/40 text-cyber-300 transition-colors'
            }
          `}
        >
          {isTriggering ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-cyber-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Triggering Benchmark...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Trigger New Benchmark
            </>
          )}
        </button>
      </div>
      
      {/* Connection status */}
      {!isConnected && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center text-amber-400">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>WebSocket connection is not established. Real-time updates are unavailable.</span>
          </div>
        </div>
      )}
      
      {/* Authentication status */}
      {isConnected && !isAuthenticated && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center text-amber-400">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Not authenticated. Please login with admin or superadmin privileges.</span>
          </div>
        </div>
      )}
      
      {/* Active benchmark notice */}
      {isTriggering && (
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center text-brand-400">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Benchmark test is running. This may take a few minutes to complete. Results will appear automatically when finished.</span>
          </div>
        </div>
      )}
      
      {/* Technical Information Panel */}
      <div className="bg-dark-200/50 backdrop-blur-sm border border-brand-500/20 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">
          Benchmark Technical Information
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Testing Framework:</span>
            <span className="text-brand-300">DegenDuel RPC Benchmark Suite</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Test Parameters:</span>
            <span className="text-brand-300">50 calls per method, 5ms delay between calls</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Methods Tested:</span>
            <span className="text-brand-300">getLatestBlockhash, getBalance, getSlot, getVersion</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Environment:</span>
            <span className="text-brand-300">Production</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Providers:</span>
            <span className="text-brand-300">BranchRPC, Helius, GenesysGo, Triton</span>
          </div>
        </div>
      </div>
      
      {/* Benchmark Dashboard */}
      <RPCBenchmarkDashboard />
    </div>
  );
};

export default RPCBenchmarkSuperAdminDashboard;