export const isAdminWallet = (walletAddress?: string | null): boolean => {
  if (!walletAddress) return false;

  const adminAddresses = (import.meta.env.VITE_ADMIN_WALLETS || "").split(",");

  return adminAddresses.includes(walletAddress);
};
