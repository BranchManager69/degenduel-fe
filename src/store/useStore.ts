// src/store/useStore.ts
import { create } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";
import { API_URL } from "../config/config";
import { Contest, Token, User, WalletError } from "../types";

// Add debug configuration
interface DebugConfig {
  forceWalletNotFound?: boolean;
  forceUserRejection?: boolean;
  forceAPIError?: boolean;
  simulateHighLatency?: boolean;
  forceOffline?: boolean;
  showLayoutBounds?: boolean;
  slowAnimations?: boolean;
  forceLoadingStates?: boolean;
}

type StoreState = {
  isConnecting: boolean;
  user: User | null;
  error: WalletError | null;
  debugConfig: DebugConfig;
  contests: Contest[];
  tokens: Token[];
  setUser: (user: User | null) => void;
  setContests: (contests: Contest[]) => void;
  setTokens: (tokens: Token[]) => void;
  setDebugConfig: (config: Partial<DebugConfig>) => void;
  clearError: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
};

type StorePersist = PersistOptions<
  StoreState,
  Pick<StoreState, "user" | "debugConfig">
>;

const persistConfig: StorePersist = {
  name: "degen-duel-storage",
  partialize: (state) => ({
    user: state.user,
    debugConfig: state.debugConfig,
  }),
};

/*
const retryFetch = async (
  url: string,
  options?: RequestInit,
  retries = 3,
  delay = 1000
) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status === 404) {
        // 404 is handled separately
        return response;
      }
      console.warn(`Attempt ${i + 1}/${retries} failed for ${url}`);
    } catch (e) {
      console.error(`Fetch attempt ${i + 1}/${retries} failed:`, e);
    }
    if (i < retries - 1) {
      // Don't delay on last attempt
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`Failed after ${retries} attempts`);
};
*/

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      isConnecting: false,
      user: null,
      error: null,
      debugConfig: {},

      setDebugConfig: (config) =>
        set((state) => ({
          debugConfig: { ...state.debugConfig, ...config },
        })),

      clearError: () => set({ error: null }),

      contests: [],
      tokens: [],

      setUser: (user) => set({ user }),
      setContests: (contests) => set({ contests }),
      setTokens: (tokens) => set({ tokens }),

      connectWallet: async () => {
        const { isConnecting, debugConfig } = get();
        if (isConnecting) return;

        set({ isConnecting: true, error: null });

        try {
          if (debugConfig.forceWalletNotFound) {
            throw {
              code: "WALLET_NOT_FOUND",
              message: "Wallet not found (Debug)",
            } as WalletError;
          }

          // 1) Connect to Phantom
          const { solana } = window as any;
          if (!solana?.isPhantom)
            throw { code: "WALLET_NOT_FOUND", message: "No Phantom wallet" };
          const response = await solana.connect();
          const walletAddress = response.publicKey.toString();

          // 2) GET nonce
          const nonceRes = await fetch(
            `${API_URL}/auth/challenge?wallet=${walletAddress}`,
            {
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          if (!nonceRes.ok) throw new Error("Failed to get nonce");
          const { nonce } = await nonceRes.json();

          // 3) Sign
          const message = `DegenDuel Authentication\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
          const encodedMessage = new TextEncoder().encode(message);
          const signedMessage = await solana.signMessage(
            encodedMessage,
            "utf8"
          );

          // 4) Verify on server
          const authPayload = {
            wallet: walletAddress,
            signature: Array.from(signedMessage.signature),
            message,
          };
          const authResponse = await fetch(`${API_URL}/auth/verify-wallet`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(authPayload),
            credentials: "include",
          });

          if (!authResponse.ok) throw new Error("Failed to verify wallet");

          const authData = await authResponse.json();

          // 5) Set user in state
          set({
            user: {
              wallet_address: authData.user.wallet_address,
              nickname: authData.user.nickname,
              role: authData.user.role,
              created_at: authData.user.created_at,
              last_login: authData.user.last_login,
              total_contests: authData.user.total_contests,
              total_wins: authData.user.total_wins,
              total_earnings: authData.user.total_earnings,
              rank_score: authData.user.rank_score,
              settings: authData.user.settings,
              balance: authData.user.balance,
              is_banned: authData.user.is_banned,
              ban_reason: authData.user.ban_reason,
              risk_level: authData.user.risk_level,
            },
          });

          // 6) Log user in console
          console.log("User connected:", authData.user);
        } catch (error) {
          console.error("Failed to connect wallet:", error);
          set({
            error: {
              code: "CONNECTION_FAILED",
              message: (error as Error).message,
            },
          });
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
    }),
    persistConfig
  )
);
