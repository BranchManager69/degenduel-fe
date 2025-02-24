import { useEffect, useState } from 'react';

export function useWallet() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get wallet from localStorage or session
    const storedWallet = localStorage.getItem('wallet') || sessionStorage.getItem('wallet');
    setWallet(storedWallet);
    setLoading(false);
  }, []);

  return {
    wallet,
    loading,
    setWallet: (newWallet: string | null) => {
      if (newWallet) {
        localStorage.setItem('wallet', newWallet);
      } else {
        localStorage.removeItem('wallet');
      }
      setWallet(newWallet);
    }
  };
} 