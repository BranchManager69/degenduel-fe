import { create } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";
import { API_URL } from "../config/config";
import { isAdminWallet } from "../lib/auth";
import { Contest, Token, User, WalletError } from "../types";

// Add debug configuration
interface DebugConfig {
  forceWalletNotFound?: boolean;
  forceUserRejection?: boolean;
  forceAPIError?: boolean;
  forceUnauthorized?: boolean;
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
  connectAsAdmin: () => Promise<void>;
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
        if (get().isConnecting) return;

        try {
          set({ isConnecting: true, error: null });

          const { solana } = window as any;
          const { debugConfig } = get();

          /* For Superadmin Debug Menu (part 1 of 3) */
          // Debug: Force wallet not found
          if (debugConfig.forceWalletNotFound || !solana?.isPhantom) {
            throw {
              code: "WALLET_NOT_FOUND",
              message:
                "Phantom wallet not found! Please install it from phantom.app",
            } as WalletError;
          }

          // Debug: Force user rejection
          if (debugConfig.forceUserRejection) {
            throw {
              code: "USER_REJECTED",
              message: "Wallet connection was rejected",
            } as WalletError;
          }
          /* End Superadmin Debug Menu (part 1 of 3) */

          /* Start Actual Wallet Connection */
          // Connect to Phantom
          const response = await solana.connect();
          const walletAddress = response.publicKey.toString();
          console.log("Connected to wallet:", walletAddress);

          // Request signature to verify wallet ownership
          const message = `DegenDuel Authentication\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
          console.log("Requesting signature for message:", message);

          const encodedMessage = new TextEncoder().encode(message);
          const signedMessage = await solana.signMessage(
            encodedMessage,
            "utf8"
          );
          console.log("Received signed message:", {
            signature: Array.from(signedMessage.signature),
            signatureLength: signedMessage.signature.length,
          });

          // Send signature to backend for verification
          const authPayload = {
            wallet: walletAddress,
            signature: Array.from(signedMessage.signature),
            message: message,
          };
          console.log("Sending auth payload:", authPayload);

          const authResponse = await fetch(`${API_URL}/auth/verify-wallet`, {
            // <-- Fixed endpoint
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(authPayload),
            credentials: "include",
          });

          const authData = await authResponse.json();
          console.log("Auth response:", {
            status: authResponse.status,
            ok: authResponse.ok,
            data: authData,
          });

          if (!authResponse.ok) {
            throw new Error(
              `Failed to verify wallet signature: ${
                authData.error || "Unknown error"
              }`
            );
          }
          /* End Actual Wallet Connection */

          /* Start Superadmin Debug Menu (part 2 of 3) */
          // Debug: Force API error
          if (debugConfig.forceAPIError) {
            throw {
              code: "API_ERROR",
              message: "Failed to fetch or create user data",
            } as WalletError;
          }
          /* End Superadmin Debug Menu (part 2 of 3) */

          // Try to fetch existing user data
          let userResponse = await fetch(`${API_URL}/users/${walletAddress}`);

          // If user doesn't exist, create a new one
          if (userResponse.status === 404) {
            userResponse = await fetch(`${API_URL}/users`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                wallet_address: walletAddress,
                nickname: `degen_${walletAddress.slice(0, 8)}`, // Default nickname
              }),
            });
          }

          if (!userResponse.ok)
            throw new Error("Failed to fetch/create user data");

          const userData = await userResponse.json();
          set({ user: { ...userData, is_admin: false } });
        } catch (error) {
          console.error("Failed to connect wallet:", error);
          set({
            error: (error as WalletError).code
              ? (error as WalletError)
              : {
                  code: "CONNECTION_FAILED",
                  message: "Failed to connect wallet",
                },
          });
        } finally {
          set({ isConnecting: false });
        }
      },

      connectAsAdmin: async () => {
        if (get().isConnecting) return;

        try {
          set({ isConnecting: true, error: null });

          const currentUser = get().user;
          const { debugConfig } = get();

          if (
            !currentUser ||
            debugConfig.forceUnauthorized ||
            !isAdminWallet(currentUser.wallet_address)
          ) {
            throw {
              code: "UNAUTHORIZED",
              message: "Only administrators can access admin features",
            } as WalletError;
          }

          const response = await fetch(
            `${API_URL}/users/${currentUser.wallet_address}`
          );
          if (!response.ok) {
            throw {
              code: "API_ERROR",
              message: "Failed to fetch admin data",
            } as WalletError;
          }

          const userData = await response.json();
          set({ user: { ...userData, is_admin: true }, error: null });
        } catch (error) {
          console.error("Failed to connect as admin:", error);
          set({
            error: (error as WalletError).code
              ? (error as WalletError)
              : {
                  code: "CONNECTION_FAILED",
                  message: "Failed to connect as admin",
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
