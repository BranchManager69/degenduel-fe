import React, { useState } from 'react';
import { useTokenData } from '../../../hooks/useTokenData';

/**
 * Debug component for testing the TokenData WebSocket hook
 * This component allows testing the unified WebSocket token data functionality
 */
const TokenDataDebug: React.FC = () => {
  const [filterSymbols, setFilterSymbols] = useState<string[]>([]);
  const [inputSymbol, setInputSymbol] = useState('');
  
  // Use the token data hook - will connect to unified WebSocket
  const { 
    tokens, 
    allTokens,
    isConnected, 
    error, 
    lastUpdate,
    _refresh
  } = useTokenData(filterSymbols.length > 0 ? filterSymbols : 'all');
  
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
  
  return (
    <div className="bg-gray-900 p-4 rounded-lg text-white">
      <h2 className="text-xl font-bold mb-4">Token Data WebSocket Debug</h2>
      
      {/* Connection Status */}
      <div className="mb-4">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-900 bg-opacity-50 rounded text-sm">
            Error: {error}
          </div>
        )}
        <div className="mt-2 text-sm text-gray-400">
          Last update: {formatTimestamp(lastUpdate)}
        </div>
      </div>
      
      {/* Token Filters */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Token Filters</h3>
        <div className="flex">
          <input
            type="text"
            value={inputSymbol}
            onChange={(e) => setInputSymbol(e.target.value)}
            placeholder="Enter token symbol"
            className="px-2 py-1 mr-2 bg-gray-800 rounded text-white"
          />
          <button
            onClick={handleAddSymbol}
            className="px-3 py-1 bg-blue-600 rounded"
          >
            Add
          </button>
          <button
            onClick={handleClearFilters}
            className="px-3 py-1 ml-2 bg-gray-700 rounded"
          >
            Clear All
          </button>
          <button
            onClick={() => _refresh()}
            className="px-3 py-1 ml-2 bg-green-700 rounded"
          >
            Refresh
          </button>
        </div>
        {filterSymbols.length > 0 && (
          <div className="flex flex-wrap mt-2">
            {filterSymbols.map(symbol => (
              <div key={symbol} className="px-2 py-1 bg-blue-900 rounded mr-2 mb-2 text-sm flex items-center">
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
      <div>
        <h3 className="font-semibold mb-2">Token Data ({tokens.length} tokens)</h3>
        <div className="overflow-auto max-h-80 bg-gray-800 rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-2 text-left">Symbol</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-right">Price</th>
                <th className="p-2 text-right">24h Change</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(token => (
                <tr key={token.symbol} className="border-t border-gray-700">
                  <td className="p-2">{token.symbol}</td>
                  <td className="p-2">{token.name}</td>
                  <td className="p-2 text-right font-mono">${parseFloat(token.price).toFixed(4)}</td>
                  <td className={`p-2 text-right ${
                    parseFloat(token.change24h) > 0 ? 'text-green-400' : 
                    parseFloat(token.change24h) < 0 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {parseFloat(token.change24h).toFixed(2)}%
                  </td>
                </tr>
              ))}
              {tokens.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    {isConnected ? 'No tokens available' : 'Connect to see token data'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Debug Info */}
      <div className="mt-4 text-xs text-gray-500">
        <div>WebSocket Topic: market-data</div>
        <div>Total tokens received: {allTokens.length}</div>
        <div>Displayed tokens: {tokens.length}</div>
      </div>
    </div>
  );
};

export default TokenDataDebug;