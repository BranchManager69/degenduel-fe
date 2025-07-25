// src/hooks/data/index.ts
// Data-related hooks

// Export current data hooks
export { useSolanaTokenData } from './useSolanaTokenData';
export { useSolanaWalletData } from './useSolanaWalletData';
export { useStandardizedTokenData } from './useStandardizedTokenData';
export { useWalletAnalysis } from './useWalletAnalysis';

// Legacy hooks (deprecated but maintained for compatibility)
// export { useTokenData } from './legacy/useTokenData'; // Removed - legacy hook deleted
export { useUserContests } from './legacy/useUserContests';

// export { useSolanaWallet } from './useSolanaWallet'; // Removed - old hook deleted

// No type exports for now - we'll add these back if needed after fixing the hooks
