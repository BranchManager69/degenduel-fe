import { useState } from 'react';
import { useTokenBalance } from '../hooks/useTokenBalance';

/**
 * TokenBalance Component
 * 
 * Displays token balance with support for compact mode for dropdown menus
 */
const TokenBalance = ({ walletAddress, compact = false }: { 
  walletAddress?: string;
  compact?: boolean;
}) => {
  const {
    balance,
    tokenAddress,
    refreshBalance,
    isLoading,
    isConnected
  } = useTokenBalance(walletAddress);

  // Store token address visibility state
  const [showAddress, setShowAddress] = useState(false);

  // Toggle address visibility
  const toggleAddressVisibility = () => {
    setShowAddress(!showAddress);
  };

  // Compact display for headers and menus
  if (compact) {
    return (
      <div className="token-balance-compact">
        {isLoading ? (
          <span className="loading">...</span>
        ) : isConnected ? (
          <span className="balance">{balance.toLocaleString()}</span>
        ) : (
          <span className="disconnected">--</span>
        )}
      </div>
    );
  }

  // Standard display
  return (
    <div className="token-balance-container">
      <h4>DegenDuel Token</h4>
      <div className="balance-display">
        {isLoading ? (
          <div className="loading-indicator">Loading...</div>
        ) : isConnected ? (
          <>
            <div className="token-balance-value">
              {balance.toLocaleString()}
            </div>
            
            <div className="token-address-control">
              <button 
                className="address-toggle-btn" 
                onClick={toggleAddressVisibility}
              >
                {showAddress ? 'Hide' : 'Show'} Token Address
              </button>
              
              {showAddress && tokenAddress && (
                <div className="token-address">
                  {tokenAddress}
                </div>
              )}
            </div>
            
            {/* Manual refresh rarely needed - balances update automatically */}
            <div className="refresh-control" style={{ display: 'none' }}>
              <button 
                className="refresh-btn"
                onClick={refreshBalance} 
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing...' : 'Refresh Balance'}
              </button>
            </div>
          </>
        ) : (
          <div className="connection-error">Not connected</div>
        )}
      </div>
    </div>
  );
};

export default TokenBalance;