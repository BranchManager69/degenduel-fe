import { useTokenBalance } from '../hooks/websocket/topic-hooks/useTokenBalance';

/**
 * TokenBalanceCompact Component
 * 
 * A compact version of the token balance display designed for use in dropdown menus
 */
const TokenBalanceCompact = ({ walletAddress }: { walletAddress?: string }) => {
  const {
    balance,
    isLoading,
    isConnected
  } = useTokenBalance(walletAddress);

  if (isLoading) {
    return <span className="loading">...</span>;
  }
  
  if (!isConnected) {
    return <span className="disconnected">--</span>;
  }
  
  return (
    <span className="token-balance-compact">
      {balance.toLocaleString()}
    </span>
  );
};

export default TokenBalanceCompact;