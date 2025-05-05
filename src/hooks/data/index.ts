// src/hooks/data/index.ts
// Data-related hooks

// Export current data hooks
export { useStandardizedTokenData } from './useStandardizedTokenData';
export { useSolanaTokenData } from './useSolanaTokenData';
export { useSolanaWallet } from './useSolanaWallet';
export { useSolanaWalletData } from './useSolanaWalletData';

// Legacy hooks (deprecated but maintained for compatibility)
export { useTokenData } from './legacy/useTokenData';
export { useUserContests } from './legacy/useUserContests';

// No type exports for now - we'll add these back if needed after fixing the hooks
