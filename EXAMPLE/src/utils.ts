/**
 * Utility function to create a delay
 * @param ms Time to sleep in milliseconds
 * @returns Promise that resolves after the specified time
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const distributeAmount = (
  totalAmount: string,
  walletIds: string[],
  mode: 'equal' | 'proportional' | 'random',
  wallets: { id: string; tokenBalance: string }[]
): TransactionDistribution[] => {
  const total = parseFloat(totalAmount);
  
  switch (mode) {
    case 'equal': {
      const perWallet = total / walletIds.length;
      return walletIds.map(id => {
        // For sells, verify against wallet balance
        const wallet = wallets.find(w => w.id === id);
        const maxAmount = wallet ? parseFloat(wallet.tokenBalance) : 0;
        const amount = Math.min(perWallet, maxAmount);
        return {
          walletId: id,
          amount: amount.toFixed(8)
        };
      });
    }
    
    case 'proportional': {
      const selectedWallets = wallets.filter(w => walletIds.includes(w.id));
      const totalBalance = selectedWallets.reduce((sum, w) => sum + parseFloat(w.tokenBalance), 0);
      
      return walletIds.map(id => {
        const wallet = wallets.find(w => w.id === id)!;
        const proportion = totalBalance === 0 ? 1 / selectedWallets.length : parseFloat(wallet.tokenBalance) / totalBalance;
        const amount = total * proportion;
        // For sells, verify against wallet balance
        const maxAmount = parseFloat(wallet.tokenBalance);
        const finalAmount = Math.min(amount, maxAmount);
        return {
          walletId: id,
          amount: finalAmount.toFixed(8)
        };
      });
    }
    
    case 'random': {
      const amounts: number[] = [];
      let remaining = total;
      
      // Generate random proportions
      for (let i = 0; i < walletIds.length - 1; i++) {
        const max = remaining * 0.8; // Don't let any single random amount be more than 80% of remaining
        // For sells, check wallet balance
        const wallet = wallets.find(w => w.id === walletIds[i])!;
        const walletMax = parseFloat(wallet.tokenBalance);
        const amount = Math.min(Math.random() * max, walletMax);
        amounts.push(amount);
        remaining -= amount;
      }
      // Add the remainder to the last wallet
      const lastWallet = wallets.find(w => w.id === walletIds[walletIds.length - 1])!;
      const lastWalletMax = parseFloat(lastWallet.tokenBalance);
      amounts.push(Math.min(remaining, lastWalletMax));
      
      return walletIds.map((id, i) => ({
        walletId: id,
        amount: amounts[i].toFixed(8)
      }));
    }
  }
};