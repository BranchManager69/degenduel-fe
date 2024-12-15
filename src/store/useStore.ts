import { create } from 'zustand';
import { User, Contest, Token, WalletError } from '../types';
import { API_URL } from '../services/api';

interface Store {
  user: User | null;
  contests: Contest[];
  tokens: Token[];
  isConnecting: boolean;
  error: WalletError | null;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setContests: (contests: Contest[]) => void;
  setTokens: (tokens: Token[]) => void;
  connectWallet: () => Promise<void>;
  connectAsAdmin: () => Promise<void>;
  disconnectWallet: () => void;
}

export const useStore = create<Store>((set, get) => ({
  user: null,
  contests: [],
  tokens: [],
  isConnecting: false,
  error: null,
  
  clearError: () => set({ error: null }),
  
  setUser: (user) => set({ user }),
  setContests: (contests) => set({ contests }),
  setTokens: (tokens) => set({ tokens }),
  
  connectWallet: async () => {
    if (get().isConnecting) return;
    try {
      set({ isConnecting: true });
      // Check if Phantom is installed
      const { solana } = window as any;
      if (!solana?.isPhantom) {
        throw new Error('Phantom wallet not found! Get it from https://phantom.app/');
      }

      // Connect to wallet
      const response = await solana.connect();
      const walletAddress = response.publicKey.toString();

      // Try to fetch existing user data
      let userResponse = await fetch(`${API_URL}/users/${walletAddress}`);
      
      // If user doesn't exist, create a new one
      if (userResponse.status === 404) {
        userResponse = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wallet_address: walletAddress,
            nickname: `degen_${walletAddress.slice(0, 8)}`, // Default nickname
          }),
        });
      }

      if (!userResponse.ok) throw new Error('Failed to fetch/create user data');
      
      const userData = await userResponse.json();
      set({ user: { ...userData, is_admin: false } });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // You might want to show this error to the user
    } finally {
      set({ isConnecting: false });
    }
  },

  connectAsAdmin: async () => {
    if (get().isConnecting) return;
    try {
      set({ isConnecting: true });
      const currentUser = get().user;
      if (currentUser?.wallet_address !== 'BPuRhkeCkor7DxMrcPVsB4AdW6Pmp5oACjVzpPb72Mhp') {
        console.error('Unauthorized: Only Branch Manager can access admin features');
        return;
      }

      const response = await fetch(`${API_URL}/users/${currentUser.wallet_address}`);
      if (!response.ok) throw new Error('Failed to fetch admin data');
      
      const userData = await response.json();
      set({ user: { ...userData, is_admin: true } });
    } catch (error) {
      console.error('Failed to connect as admin:', error);
    } finally {
      set({ isConnecting: false });
    }
  },
  
  disconnectWallet: () => {
    const { solana } = window as any;
    if (solana?.isPhantom) {
      solana.disconnect();
    }
    set({ user: null, isConnecting: false });
  },
}));