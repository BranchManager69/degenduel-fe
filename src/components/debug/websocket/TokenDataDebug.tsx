import React, { useCallback, useState } from 'react';
import { useTokenData } from '../../../hooks/data/legacy/useTokenData';
import { useWebSocketMonitor } from '../../../hooks/utilities/legacy/useWebSocketMonitor'; //   whats this?

/**
 * Debug component for testing the TokenData WebSocket hook
 * This component allows testing the unified WebSocket token data functionality with detailed connection state monitoring
 */
const TokenDataDebug: React.FC = () => {
  const [filterSymbols, setFilterSymbols] = useState<string[]>([]);
  const [inputSymbol, setInputSymbol] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get WebSocket monitor data for more detailed connection state info
  const wsMonitor = useWebSocketMonitor();
  
  // Use the token data hook - will connect to unified WebSocket
  const { 
    tokens, 
    allTokens,
    isConnected, 
    connectionState,
    error, 
    lastUpdate,
    _refresh
  } = useTokenData(filterSymbols.length > 0 ? filterSymbols : 'all');
  
  // Enhanced refresh function with visual feedback
  const handleRefresh = useCallback(() => {
    if (isConnected && _refresh) {
      setIsRefreshing(true);
      Promise.resolve(_refresh()).finally(() => {
        setTimeout(() => setIsRefreshing(false), 500);
      });
    } else {
      console.warn("Cannot refresh: WebSocket not connected");
    }
  }, [isConnected, _refresh]);
  
  // Handle adding a symbol to filter
  const handleAddSymbol = () => {
    if (inputSymbol && !filterSymbols.includes(inputSymbol)) {
      setFilterSymbols([...filterSymbols, inputSymbol.toUpperCase()]);
      setInputSymbol('');
    }
  };
  
  // Handle clearing all filters
  const handleClearFilters = () => {
    setFilterSymbols([]);
  };
  
  // Format timestamp for display
  const formatTimestamp = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };
  
  // Get appropriate connection status display
  const getConnectionStatus = () => {
    if (!connectionState) return { color: 'gray', text: 'Unknown', icon: '?' };
    
    switch(connectionState) {
      case 'connecting':
        return { color: 'yellow', text: 'Connecting', icon: '⌛' };
      case 'connected':
        return { color: 'green', text: 'Connected', icon: '✓' };
      case 'authenticated':
        return { color: 'blue', text: 'Authenticated', icon: '🔒' };
      case 'reconnecting':
        return { color: 'orange', text: 'Reconnecting', icon: '🔄' };
      case 'disconnected':
        return { color: 'red', text: 'Disconnected', icon: '❌' };
      case 'error':
        return { color: 'red', text: 'Error', icon: '⚠️' };
      default:
        return { color: 'gray', text: connectionState || 'Unknown', icon: '?' };
    }
  };
  
  const connectionStatus = getConnectionStatus();
  
  return (
    <div className="text-white">
      {/* Enhanced Connection Status Section */}
      <div className="mb-4 bg-black/30 backdrop-blur-sm p-3 rounded border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                connectionState === 'connected' || connectionState === 'authenticated' 
                  ? 'bg-green-500 animate-pulse' 
                  : connectionState === 'connecting' || connectionState === 'reconnecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
              }`} />
              <span className={`font-medium text-${connectionStatus.color}-400`}>
                {connectionStatus.text}
              </span>
              {wsMonitor.isAuthError && (
                <span className="ml-2 text-yellow-400 text-xs bg-yellow-900/50 px-1.5 py-0.5 rounded-sm">
                  Auth Failed
                </span>
              )}
            </div>
            <div className="text-sm text-gray-400">
              Last update: <span className="text-cyan-400">{formatTimestamp(lastUpdate)}</span>
            </div>
          </div>
          <button 
            onClick={handleRefresh}
            className="ml-4 bg-brand-500/20 hover:bg-brand-500/30 border border-brand-500/30 rounded-full w-7 h-7 flex items-center justify-center text-brand-300 transition-all duration-300 shadow-sm hover:shadow-brand-500/20"
            disabled={!isConnected || isRefreshing}
            title="Refresh data"
          >
            <span className={`text-base ${isRefreshing ? 'animate-spin' : ''}`}>⟳</span>
          </button>
        </div>
        
        {/* Authentication State Details */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs border-t border-gray-700 pt-2">
          <div className="flex items-center space-x-1 text-gray-400">
            <span>Socket:</span>
            <span className={`font-mono ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Ready' : 'Not Ready'}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400">
            <span>Auth:</span>
            <span className={`font-mono ${wsMonitor.isAuthenticated ? 'text-green-400' : 'text-yellow-400'}`}>
              {wsMonitor.isAuthenticated ? 'Success' : 'Public Only'}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400">
            <span>Msgs:</span>
            <span className="font-mono text-brand-300">{wsMonitor.messageCount || 0}</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400">
            <span>Errors:</span>
            <span className={`font-mono ${wsMonitor.errorCount > 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {wsMonitor.errorCount || 0}
            </span>
          </div>
        </div>
        
        {error && (
          <div className="mt-2 p-2 bg-red-900/50 border border-red-700 rounded text-sm">
            Error: {error}
          </div>
        )}
      </div>
      
      {/* Token Filters */}
      <div className="mb-4 bg-black/30 backdrop-blur-sm p-3 rounded border border-gray-700">
        <h3 className="font-semibold mb-2 text-brand-400">Token Filters</h3>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
            placeholder="Enter token symbol"
            className="px-3 py-1.5 bg-gray-800/70 border border-gray-700 rounded text-white focus:border-brand-500 focus:outline-none"
          />
          <button
            onClick={handleAddSymbol}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
          >
            Add
          </button>
          <button
            onClick={handleClearFilters}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-green-700 hover:bg-green-600 rounded transition-colors flex items-center"
            disabled={!isConnected || isRefreshing}
          >
            <svg className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        {filterSymbols.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3 p-2 bg-gray-800/50 rounded border border-gray-700">
            {filterSymbols.map(symbol => (
              <div key={symbol} className="px-2 py-1 bg-blue-900/70 border border-blue-700 rounded text-sm flex items-center">
                {symbol}
                <button
                  onClick={() => setFilterSymbols(filterSymbols.filter(s => s !== symbol))}
                  className="ml-2 text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Token Data */}
      <div className="bg-black/30 backdrop-blur-sm rounded border border-gray-700">
        <div className="flex justify-between items-center p-3 border-b border-gray-700">
          <h3 className="font-semibold text-brand-400">Token Data <span className="text-white">({tokens.length} tokens)</span></h3>
          <div className="flex items-center text-xs bg-black/30 px-2 py-1 rounded">
            <span className="text-gray-400 mr-2">Filtered:</span> 
            <span className="text-brand-300 font-mono">{tokens.length}/{allTokens.length}</span>
          </div>
        </div>
        <div className="overflow-auto max-h-80 rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/80 sticky top-0">
                <th className="p-2 text-left text-brand-400 font-mono">SYMBOL</th>
                <th className="p-2 text-left text-brand-400 font-mono">NAME</th>
                <th className="p-2 text-right text-brand-400 font-mono">PRICE</th>
                <th className="p-2 text-right text-brand-400 font-mono">24H</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(token => (
                <tr key={token.symbol} className="border-t border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="p-2 text-brand-300 font-mono">{token.symbol}</td>
                  <td className="p-2 truncate max-w-[150px]">{token.name}</td>
                  <td className="p-2 text-right font-mono">${parseFloat(token.price).toFixed(4)}</td>
                  <td className={`p-2 text-right font-mono ${
                    parseFloat(token.change24h) > 0 ? 'text-green-400' : 
                    parseFloat(token.change24h) < 0 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {parseFloat(token.change24h) > 0 ? '+' : ''}{parseFloat(token.change24h).toFixed(2)}%
                  </td>
                </tr>
              ))}
              {tokens.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 space-y-2">
                      <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        {connectionState === 'connecting' ? 'Connecting to server...' :
                         connectionState === 'connected' && tokens.length === 0 ? 'Connected, requesting token data...' :
                         isConnected && tokens.length === 0 ? 'No tokens available' : 
                         'Waiting for connection...'}
                      </span>
                      {isConnected && tokens.length === 0 && (
                        <span className="text-xs">
                          Try refreshing or checking your filters
                          {wsMonitor.isAuthError ? ' (Operating in public data mode)' : ''}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Debug Info */}
        <div className="px-3 py-2 text-xs border-t border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">Topic:</span>
            <span className="bg-green-900/60 border border-green-800 rounded-sm px-1.5 text-green-300 font-mono">market-data</span>
            {wsMonitor.isAuthError ? (
              <span className="ml-2 bg-yellow-900/60 border border-yellow-800 rounded-sm px-1.5 text-yellow-300 font-mono">public</span>
            ) : (
              <span className="ml-2 bg-indigo-900/60 border border-indigo-800 rounded-sm px-1.5 text-indigo-300 font-mono">authenticated</span>
            )}
          </div>
          <div className="text-gray-500">
            <span>WebSocket messages: </span>
            <span className="text-green-400 font-mono">{wsMonitor.messageCount} </span>
            <span className="text-gray-500 ml-1">({wsMonitor.messageRatePerSecond}/sec)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDataDebug;