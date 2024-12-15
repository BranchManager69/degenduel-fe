import { create } from 'zustand';
import { User, Contest, Token } from '../types';

interface Store {
  user: User | null;
  contests: Contest[];
  tokens: Token[];
  setUser: (user: User | null) => void;
  setContests: (contests: Contest[]) => void;
  setTokens: (tokens: Token[]) => void;
  connectWallet: () => Promise<void>;
  connectAsAdmin: () => void;
  disconnectWallet: () => void;
}

export const useStore = create<Store>((set) => ({
  user: null,
  contests: [],
  tokens: [],
  
  setUser: (user) => set({ user }),
  setContests: (contests) => set({ contests }),
  setTokens: (tokens) => set({ tokens }),
  
  connectWallet: async () => {
    // Simulate wallet connection
    set({
      user: {
        address: '0x1234...5678',
        username: 'degen_trader',
        total_winnings: 1500,
        contests_won: 3,
        contests_played: 10,
        is_admin: false,
      },
    });
  },

  connectAsAdmin: () => {
    set({
      user: {
        address: '0xADMIN',
        username: 'Platform Admin',
        total_winnings: 0,
        contests_won: 0,
        contests_played: 0,
        is_admin: true,
      },
    });
  },
  
  disconnectWallet: () => {
    set({ user: null });
  },
}));