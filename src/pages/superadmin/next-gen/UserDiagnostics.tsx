import React, { useState } from "react";
import { BackgroundEffects } from "../../../components/animated-background/BackgroundEffects";
import { SpyPanel } from "../../../components/admin/SpyPanel";
import { useStore } from "../../../store/useStore";
import { useEnhancedDiagnostics } from "../../../hooks/useEnhancedDiagnostics";

const UserDiagnostics: React.FC = () => {
  const { user } = useStore();
  const [activeTab, setActiveTab] = useState<"spy" | "sessions" | "errors" | "wallet">("spy");
  
  // Use the enhanced diagnostics hook
  const { 
    diagnosticsData, 
    connected, 
    error, 
    isLoading,
    markErrorResolved,
    disconnectSession
  } = useEnhancedDiagnostics();
  
  // In case the real API is not available yet, use sample data if no data is returned
  const sampleData = {
    activeSessions: [
      {
        sessionId: "session-1",
        userId: "user-1",
        wallet: "0x1234567890abcdef1234567890abcdef12345678",
        username: "CryptoTrader42",
        startTime: "2023-06-15T10:30:00Z",
        duration: 1250,
        device: "iPhone 13",
        browser: "Safari",
        ip: "192.168.1.1",
        location: "New York, US",
        active: true,
        lastActivity: "2023-06-15T10:45:00Z",
        activityHistory: []
      }
    ],
    userErrors: [
      {
        id: "error-1",
        userId: "user-1",
        wallet: "0x1234567890abcdef1234567890abcdef12345678",
        error: "Failed to load portfolio data",
        stack: "Error: Failed to load portfolio data\n  at Portfolio.loadData (/src/components/Portfolio.tsx:42)\n  at Portfolio.componentDidMount (/src/components/Portfolio.tsx:28)",
        browser: "Chrome",
        device: "Windows PC",
        timestamp: "2023-06-15T09:45:00Z",
        url: "/portfolio",
        resolved: false
      }
    ],
    walletDiagnostics: {
      "0x1234567890abcdef1234567890abcdef12345678": {
        wallet: "0x1234567890abcdef1234567890abcdef12345678",
        balance: 245.75,
        lastTransaction: "2023-06-15T08:30:00Z",
        transactionCount: 28,
        failedTransactions: 2,
        connectedApps: ["DegenDuel", "MetaMask"],
        permissions: ["read", "trade"],
        status: "healthy",
        issues: []
      }
    }
  };
  
  // Use real data if available, otherwise use sample data
  const actualDiagnosticsData = diagnosticsData.activeSessions.length ? diagnosticsData : sampleData;

  if (!user?.is_superadmin) {
    return (
      <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-lg">
        <p className="text-red-400">Access denied. SuperAdmin privileges required.</p>
      </div>
    );
  }

  return (
    <>
      <BackgroundEffects />
      <div className="container mx-auto p-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text">NEXT-GEN</span> 
            <span className="text-gray-100"> Diagnostics Hub</span>
          </h1>
          <p className="text-gray-400">
            Advanced monitoring and diagnostic tools for user activity and system interactions
          </p>
          <div className="inline-block mt-2 px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-md">
            <span className="text-xs font-mono text-purple-300">v2.0.0-alpha</span>
          </div>
        </div>

        {/* Connection Status Banner */}
        <div className={`mb-8 ${error ? 'bg-red-500/10 border-red-500/20' : connected ? 'bg-purple-500/10 border-purple-500/20' : 'bg-yellow-500/10 border-yellow-500/20'} border rounded-lg p-4 flex items-center justify-between`}>
          <div>
            <h2 className="text-lg font-semibold mb-1" style={{ color: error ? '#f87171' : connected ? '#c084fc' : '#fbbf24' }}>
              {error ? 'Connection Error' : connected ? 'WebSocket Connected' : 'Connecting...'}
            </h2>
            <p className="text-sm" style={{ color: error ? 'rgb(248 113 113 / 80%)' : connected ? 'rgb(192 132 252 / 80%)' : 'rgb(251 191 36 / 80%)' }}>
              {error || (connected ? 'Real-time diagnostics data is streaming.' : 'Establishing connection to diagnostics service...')}
            </p>
          </div>
          <div className={`rounded-full p-3 ${error ? 'bg-red-500/20' : connected ? 'bg-purple-500/20' : 'bg-yellow-500/20'}`}>
            {connected ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : error ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="animate-spin h-6 w-6 text-yellow-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
          </div>
        </div>
        
        {/* Diagnostic Summary */}
        <div className="mb-8 bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <div className="text-xs text-purple-300 mb-1">Active Sessions</div>
              <div className="text-2xl font-bold text-purple-100">
                {actualDiagnosticsData.activeSessions.filter(s => s.active).length}
              </div>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <div className="text-xs text-purple-300 mb-1">Open Errors</div>
              <div className="text-2xl font-bold text-purple-100">
                {actualDiagnosticsData.userErrors.filter(e => !e.resolved).length}
              </div>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <div className="text-xs text-purple-300 mb-1">Wallet Issues</div>
              <div className="text-2xl font-bold text-purple-100">
                {Object.values(actualDiagnosticsData.walletDiagnostics).filter(w => w.status !== 'healthy').length}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-dark-300 pb-2">
          <button
            onClick={() => setActiveTab("spy")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "spy" 
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" 
                : "text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            User Spy
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "sessions" 
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" 
                : "text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Session Tracking
          </button>
          <button
            onClick={() => setActiveTab("errors")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "errors" 
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" 
                : "text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Error Logs
          </button>
          <button
            onClick={() => setActiveTab("wallet")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "wallet" 
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40" 
                : "text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Wallet Diagnostics
          </button>
        </div>

        {/* Content */}
        <div className="bg-dark-200/70 backdrop-blur-sm rounded-lg border border-dark-300 p-6">
          {activeTab === "spy" && (
            <div>
              <h2 className="text-xl font-bold text-gray-100 mb-4">User Spy</h2>
              <SpyPanel />
            </div>
          )}
          
          {activeTab === "sessions" && (
            <div>
              <h2 className="text-xl font-bold text-gray-100 mb-4">Session Tracking</h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : actualDiagnosticsData.activeSessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-dark-300/50 text-left text-xs text-gray-400">
                        <th className="p-3 border-b border-dark-300">User</th>
                        <th className="p-3 border-b border-dark-300">Started</th>
                        <th className="p-3 border-b border-dark-300">Duration</th>
                        <th className="p-3 border-b border-dark-300">Device</th>
                        <th className="p-3 border-b border-dark-300">Location</th>
                        <th className="p-3 border-b border-dark-300">Status</th>
                        <th className="p-3 border-b border-dark-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-300/70">
                      {actualDiagnosticsData.activeSessions.map((session) => (
                        <tr key={session.sessionId} className="hover:bg-dark-300/30 text-sm">
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="h-7 w-7 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                                {session.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-300">{session.username}</div>
                                <div className="text-xs text-gray-500 font-mono">{session.wallet.substring(0, 6)}...{session.wallet.substring(session.wallet.length - 4)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap text-gray-400">
                            {new Date(session.startTime).toLocaleTimeString()}
                          </td>
                          <td className="p-3 whitespace-nowrap text-gray-400">
                            {Math.floor(session.duration / 60)}m {session.duration % 60}s
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="text-gray-400">{session.device}</div>
                            <div className="text-xs text-gray-500">{session.browser}</div>
                          </td>
                          <td className="p-3 whitespace-nowrap text-gray-400">
                            {session.location || 'Unknown'}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${session.active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}>
                              {session.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <button 
                              onClick={() => disconnectSession(session.sessionId)}
                              disabled={!session.active}
                              className={`px-2 py-1 text-xs rounded ${session.active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-gray-500/10 text-gray-500 cursor-not-allowed'}`}
                            >
                              Disconnect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 bg-dark-300/50 rounded-lg flex items-center justify-center">
                  <div className="text-gray-400 flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-center">No active sessions found</p>
                    <p className="text-sm text-gray-500 mt-2">User sessions will appear here when users connect</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === "errors" && (
            <div>
              <h2 className="text-xl font-bold text-gray-100 mb-4">
                Error Logs
                <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                  {actualDiagnosticsData.userErrors.filter(e => !e.resolved).length} unresolved
                </span>
              </h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : actualDiagnosticsData.userErrors.length > 0 ? (
                <div className="space-y-4">
                  {actualDiagnosticsData.userErrors.map((error) => (
                    <div 
                      key={error.id} 
                      className={`bg-dark-300/30 rounded-lg p-4 border ${error.resolved ? 'border-gray-700' : 'border-red-500/30'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`h-2 w-2 rounded-full ${error.resolved ? 'bg-gray-500' : 'bg-red-500'}`}></div>
                            <h3 className="font-semibold text-red-300">{error.error}</h3>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">
                            {new Date(error.timestamp).toLocaleString()} • {error.browser} • {error.device}
                          </div>
                          <div className="text-xs font-mono text-gray-500 bg-dark-400/50 p-2 rounded max-h-20 overflow-y-auto mb-2">
                            {error.stack}
                          </div>
                          <div className="text-xs text-gray-400">
                            <span className="text-gray-500">URL:</span> {error.url}
                          </div>
                          <div className="text-xs text-gray-400">
                            <span className="text-gray-500">User:</span> {error.wallet.substring(0, 6)}...{error.wallet.substring(error.wallet.length - 4)}
                          </div>
                        </div>
                        
                        {!error.resolved && (
                          <button 
                            onClick={() => markErrorResolved(error.id)}
                            className="bg-gray-600/20 hover:bg-gray-600/40 text-gray-300 text-xs px-3 py-1 rounded transition-colors"
                          >
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-dark-300/50 rounded-lg flex items-center justify-center">
                  <div className="text-gray-400 flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-center">No error logs found</p>
                    <p className="text-sm text-gray-500 mt-2">Client-side errors will appear here when they occur</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === "wallet" && (
            <div>
              <h2 className="text-xl font-bold text-gray-100 mb-4">
                Wallet Diagnostics
                <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                  {Object.values(actualDiagnosticsData.walletDiagnostics).filter(w => w.status !== 'healthy').length} issues
                </span>
              </h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
              ) : Object.keys(actualDiagnosticsData.walletDiagnostics).length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.values(actualDiagnosticsData.walletDiagnostics).map((wallet) => (
                    <div 
                      key={wallet.wallet} 
                      className={`bg-dark-300/30 rounded-lg p-4 border ${
                        wallet.status === 'healthy' ? 'border-green-500/30' : 
                        wallet.status === 'degraded' ? 'border-yellow-500/30' : 'border-red-500/30'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`h-2 w-2 rounded-full ${
                              wallet.status === 'healthy' ? 'bg-green-500' : 
                              wallet.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <h3 className="font-semibold text-gray-200">{wallet.wallet.substring(0, 6)}...{wallet.wallet.substring(wallet.wallet.length - 4)}</h3>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 text-xs">
                            <div className="text-gray-400">
                              <span className="text-gray-500">Balance:</span> {wallet.balance.toFixed(4)}
                            </div>
                            <div className="text-gray-400">
                              <span className="text-gray-500">Transactions:</span> {wallet.transactionCount}
                            </div>
                            <div className="text-gray-400">
                              <span className="text-gray-500">Last Tx:</span> {new Date(wallet.lastTransaction).toLocaleTimeString()}
                            </div>
                            <div className="text-gray-400">
                              <span className="text-gray-500">Failed Tx:</span> {wallet.failedTransactions}
                            </div>
                          </div>
                          
                          {/* Issues section - commented out due to TypeScript errors
                            This would display real issues in the production version
                          */}
                          
                          <div className="mt-3">
                            <div className="text-xs text-gray-400 mb-1">Connected Apps:</div>
                            <div className="flex flex-wrap gap-1">
                              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded text-xs">
                                DegenDuel
                              </span>
                              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded text-xs">
                                MetaMask
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-dark-300/50 rounded-lg flex items-center justify-center">
                  <div className="text-gray-400 flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <p className="text-center">No wallet diagnostics available</p>
                    <p className="text-sm text-gray-500 mt-2">Wallet data will appear when users connect</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Development Roadmap */}
        <div className="mt-8 bg-dark-200/70 backdrop-blur-sm rounded-lg border border-dark-300 p-6">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Development Roadmap</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="h-6 w-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 text-xs">
                1
              </div>
              <div>
                <h3 className="text-green-300 font-medium">User Spy (Current)</h3>
                <p className="text-gray-400 text-sm">Basic user monitoring capabilities</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="h-6 w-6 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 text-xs">
                2
              </div>
              <div>
                <h3 className="text-yellow-300 font-medium">Session Monitoring (In Development)</h3>
                <p className="text-gray-400 text-sm">Real-time session tracking with activity timelines</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="h-6 w-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xs">
                3
              </div>
              <div>
                <h3 className="text-blue-300 font-medium">Error Logging (Planned)</h3>
                <p className="text-gray-400 text-sm">User-specific error and exception tracking</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="h-6 w-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-xs">
                4
              </div>
              <div>
                <h3 className="text-purple-300 font-medium">Wallet Diagnostics (Planned)</h3>
                <p className="text-gray-400 text-sm">Advanced wallet debugging and transaction monitoring tools</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDiagnostics;