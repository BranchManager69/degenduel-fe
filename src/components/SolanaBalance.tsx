import { useSolanaBalance } from '../hooks/useSolanaBalance';

/**
 * SolanaBalance Component
 * 
 * Displays Solana balance with support for compact mode for dropdown menus
 */
const SolanaBalance = ({ walletAddress, compact = false }: { 
  walletAddress?: string;
  compact?: boolean;
}) => {
  const {
    isLoading,
    isConnected,
    formatBalance
  } = useSolanaBalance(walletAddress);

  // Compact display for headers and menus
  if (compact) {
    return (
      <div className="solana-balance-compact">
        {isLoading ? (
          <span className="loading">...</span>
        ) : isConnected ? (
          <span className="balance">{formatBalance(2)} SOL</span>
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
            {formatBalance(4)} <span className="currency">SOL</span>
          </div>
        ) : (
          <div className="connection-error">Not connected</div>
        )}
      </div>
    </div>
  );
};

export default SolanaBalance;