import { useState } from 'react';
import { useTokenBalance } from '../hooks/websocket/topic-hooks/useTokenBalance';

/**
 * TokenBalanceDisplay Component
 * 
 * Displays the user's token balance with real-time updates through the v69 WebSocket system.
 */
const TokenBalanceDisplay = ({ walletAddress }: { walletAddress?: string }) => {
  const {
    balance,
    tokenAddress,
    refreshBalance,
    isLoading,
    isConnected,
    lastUpdate
  } = useTokenBalance(walletAddress);

  // Store token address visibility state
  const [showAddress, setShowAddress] = useState(false);

  // Format the last update timestamp
  const formattedLastUpdate = lastUpdate 
    ? new Date(lastUpdate).toLocaleString() 
    : 'Never';

  // Toggle address visibility
  const toggleAddressVisibility = () => {
    setShowAddress(!showAddress);
  };

  return (
    <div className="token-balance-container">
      <h3>Token Balance</h3>
      <div className="balance-display">
        {isLoading ? (
          <p>Connecting to WebSocket...</p>
        ) : isConnected ? (
          <>
            <div className="token-balance">
              <div className="token-row">
                <span className="token-symbol">DegenDuel:</span>
                <span className="token-balance">{balance.toLocaleString()}</span>
                <button 
                  className="address-toggle" 
                  onClick={toggleAddressVisibility}
                >
                  {showAddress ? 'Hide' : 'Show'} Address
                </button>
              </div>
              
              {showAddress && tokenAddress && (
                <div className="token-address">
                  {tokenAddress}
                </div>
              )}
            </div>
            
            <div className="balance-actions">
              <button onClick={refreshBalance} disabled={isLoading}>
                {isLoading ? 'Refreshing...' : 'Refresh Balance'}
              </button>
              <div className="last-updated">
                Last updated: {formattedLastUpdate}
              </div>
            </div>
          </>
        ) : (
          <p>WebSocket disconnected. Please refresh the page.</p>
        )}
      </div>
    </div>
  );
};

export default TokenBalanceDisplay;