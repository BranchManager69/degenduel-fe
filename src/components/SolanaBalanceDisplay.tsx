import { useSolanaBalance } from '../hooks/websocket/topic-hooks/useSolanaBalance';

/**
 * SolanaBalanceDisplay Component
 * 
 * Simple component that displays just the Solana balance, designed for compact displays
 * like headers and dropdown menus.
 */
const SolanaBalanceDisplay = ({ walletAddress, compact = false }: { 
  walletAddress?: string;
  compact?: boolean;
}) => {
  const {
    isLoading,
    isConnected,
    getFormattedBalance
  } = useSolanaBalance(walletAddress);

  // Compact display for headers and menus
  if (compact) {
    return (
      <div className="solana-balance-compact">
        {isLoading ? (
          <span className="loading">...</span>
        ) : isConnected ? (
          <span className="balance">{getFormattedBalance(2)} SOL</span>
        ) : (
          <span className="disconnected">--</span>
        )}
      </div>
    );
  }

  // Standard display
  return (
    <div className="solana-balance-container">
      <h4>Solana Balance</h4>
      <div className="balance-display">
        {isLoading ? (
          <div className="loading-indicator">Loading...</div>
        ) : isConnected ? (
          <div className="sol-balance-value">
            {getFormattedBalance(4)} <span className="currency">SOL</span>
          </div>
        ) : (
          <div className="connection-error">Not connected</div>
        )}
      </div>
    </div>
  );
};

export default SolanaBalanceDisplay;