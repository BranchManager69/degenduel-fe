// src/store/useStore.ts
import { create } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";
import { API_URL } from "../config/config";
import { Contest, Token, User, WalletError } from "../types/index";

export type ColorScheme =
  | "default"
  | "matrix"
  | "cyberpunk"
  | "synthwave"
  | "gold"
  | "teal"
  | "plasma";

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
  colorScheme?: ColorScheme;
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

// Remove comment markers and implement retry logic
const retryFetch = async (
  url: string,
  options?: RequestInit,
  retries = 3,
  delay = 1000
) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${retries} for ${url}`);
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Attempt ${i + 1} failed with status ${response.status}:`,
          {
            url,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            errorBody: errorText,
            timestamp: new Date().toISOString(),
          }
        );

        if (i === retries - 1) {
          throw new Error(
            `Failed after ${retries} attempts. Last error: ${errorText}`
          );
        }

        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed with error:`, {
        url,
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : error,
        timestamp: new Date().toISOString(),
      });

      if (i === retries - 1) {
        throw error;
      }

      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed after ${retries} attempts`);
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
        const { isConnecting, debugConfig } = get();
        if (isConnecting) {
          console.log("Wallet connection already in progress, skipping");
          return;
        }

        console.log("Starting wallet connection process");
        set({ isConnecting: true, error: null });

        try {
          if (debugConfig.forceWalletNotFound) {
            console.log("Debug: Forcing wallet not found error");
            throw {
              code: "WALLET_NOT_FOUND",
              message: "Wallet not found (Debug)",
            } as WalletError;
          }

          // 1) Connect to Phantom
          console.log("Checking for Phantom wallet");
          const { solana } = window as any;
          if (!solana?.isPhantom) {
            console.error("Phantom wallet not found");
            throw { code: "WALLET_NOT_FOUND", message: "No Phantom wallet" };
          }

          console.log("Requesting wallet connection from Phantom");
          const response = await solana.connect();
          const walletAddress = response.publicKey.toString();
          console.log("Connected to wallet:", walletAddress);

          // 2) GET nonce with retry
          console.log("Requesting nonce for wallet:", walletAddress);
          const nonceRes = await retryFetch(
            `${API_URL}/auth/challenge?wallet=${walletAddress}`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
              },
            }
          );

          if (!nonceRes.ok) {
            const errorText = await nonceRes.text();
            console.error("Nonce request failed after retries:", {
              status: nonceRes.status,
              statusText: nonceRes.statusText,
              error: errorText,
              url: `${API_URL}/auth/challenge?wallet=${walletAddress}`,
              headers: nonceRes.headers,
              timestamp: new Date().toISOString(),
            });
            throw new Error(
              `Failed to get nonce after retries: ${nonceRes.status} ${errorText}`
            );
          }

          console.log("Nonce response received, parsing JSON");
          const { nonce } = await nonceRes.json();
          console.log("Nonce retrieved successfully");

          // 3) Sign
          console.log("Preparing message for signing");
          const message = `DegenDuel Authentication\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
          console.log("Message to sign:", message);

          const encodedMessage = new TextEncoder().encode(message);
          console.log("Requesting message signature from wallet");
          const signedMessage = await solana.signMessage(
            encodedMessage,
            "utf8"
          );
          console.log("Message signed successfully");

          // 4) Verify on server
          console.log("Preparing verification payload");
          const authPayload = {
            wallet: walletAddress,
            signature: Array.from(signedMessage.signature),
            message,
          };
          console.log("Sending verification request to server");
          const authResponse = await verifyWallet(
            walletAddress,
            authPayload.signature,
            authPayload.message
          );

          // 5) Set user in state
          set({
            user: {
              wallet_address: authResponse.user.wallet_address,
              nickname: authResponse.user.nickname,
              role: authResponse.user.role,
              created_at: authResponse.user.created_at,
              last_login: authResponse.user.last_login,
              total_contests: authResponse.user.total_contests,
              total_wins: authResponse.user.total_wins,
              total_earnings: authResponse.user.total_earnings,
              rank_score: authResponse.user.rank_score,
              settings: authResponse.user.settings,
              balance: authResponse.user.balance,
              is_banned: authResponse.user.is_banned,
              ban_reason: authResponse.user.ban_reason,
              risk_level: authResponse.user.risk_level,
            },
          });

          // 6) Log user in console
          console.log("User connected:", authResponse.user);
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

const verifyWallet = async (
  wallet: string,
  signature: any,
  message: string
) => {
  console.log("[Auth Debug] Sending verification request");

  // Use retryFetch to ensure consistent behavior
  const response = await retryFetch(`${API_URL}/auth/verify-wallet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Debug": "true",
      Origin: window.location.origin,
    },
    credentials: "include",
    body: JSON.stringify({ wallet, signature, message }),
  });

  console.log("[Auth Debug] Verification response:", {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries([...response.headers]),
    url: response.url,
    cookies: document.cookie,
    setCookie: response.headers.get("set-cookie"),
    allHeaders: [...response.headers.entries()].reduce((acc, [key, value]) => {
      acc[key.toLowerCase()] = value;
      return acc;
    }, {} as Record<string, string>),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to verify wallet");
  }

  const data = await response.json();
  console.log("[Auth Debug] Verification successful:", {
    data,
    cookies: document.cookie,
    parsedCookies: document.cookie.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.split("=").map((c) => c.trim());
      return { ...acc, [key]: value };
    }, {}),
    documentCookie: document.cookie,
    cookieEnabled: navigator.cookieEnabled,
    protocol: window.location.protocol,
    host: window.location.host,
    origin: window.location.origin,
  });

  // Add a small delay to ensure cookie is set
  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log("[Auth Debug] Post-delay cookie check:", {
    cookies: document.cookie,
    parsedCookies: document.cookie.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.split("=").map((c) => c.trim());
      return { ...acc, [key]: value };
    }, {}),
  });

  return data;
};
