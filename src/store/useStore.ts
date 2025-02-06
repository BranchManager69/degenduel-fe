// src/store/useStore.ts

import { create } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";
import { API_URL, DDAPI_DEBUG_MODE } from "../config/config";
import { Contest, Token, User, WalletError } from "../types/index";

export type ColorScheme =
  | "default"
  | "matrix"
  | "cyberpunk"
  | "synthwave"
  | "gold"
  | "teal"
  | "plasma";

export type FontConfig = {
  heading: string;
  body: string;
  mono: string;
};

export const FONT_PRESETS = {
  pixelPerfect: {
    heading: "Silkscreen",
    body: "Pixelify Sans",
    mono: "Source Code Pro",
  },
  neonLights: {
    heading: "Tilt Neon",
    body: "Quicksand",
    mono: "DM Mono",
  },
  cyberTech: {
    heading: "Chakra Petch",
    body: "Inter",
    mono: "Fira Code",
  },
} as const;

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
  fontPreset?: keyof typeof FONT_PRESETS;
  customFonts?: FontConfig;
}

type StoreState = {
  isConnecting: boolean;
  user: User | null;
  error: WalletError | null;
  debugConfig: DebugConfig;
  contests: Contest[];
  tokens: Token[];
  maintenanceMode: boolean;
  setUser: (user: User | null) => void;
  setContests: (contests: Contest[]) => void;
  setTokens: (tokens: Token[]) => void;
  setDebugConfig: (config: Partial<DebugConfig>) => void;
  clearError: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  setMaintenanceMode: (enabled: boolean) => void;
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

// Add utility function to detect mobile
const isMobileDevice = () => {
  return (
    typeof window !== "undefined" &&
    (navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPad/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i))
  );
};

// Add utility function for Phantom deep linking
const getPhantomDeepLink = () => {
  const url = window.location.href;
  // You can customize this URL structure based on your needs
  return `https://phantom.app/ul/browse/${encodeURIComponent(url)}`;
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      isConnecting: false,
      user: null,
      error: null,
      debugConfig: {},
      maintenanceMode: false,

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

          // Check if on mobile and Phantom not injected
          if (isMobileDevice() && !solana?.isPhantom) {
            console.log("Mobile device detected, redirecting to Phantom app");
            window.location.href = getPhantomDeepLink();
            return;
          }

          if (!solana?.isPhantom) {
            console.error("Phantom wallet not found");
            if (isMobileDevice()) {
              // If we get here, we're on mobile but something else went wrong
              window.location.href = "https://phantom.app/download";
            } else {
              throw {
                code: "WALLET_NOT_FOUND",
                message:
                  "No Phantom wallet found. Please install Phantom to continue.",
              };
            }
            return;
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

            // Handle 502 Bad Gateway specifically
            if (nonceRes.status === 502) {
              throw new Error(
                "Server is currently unavailable. Please try again in a few minutes."
              );
            }

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

      disconnectWallet: async () => {
        try {
          const { user } = get();
          console.log("[Wallet Debug] Starting disconnect", {
            user,
            currentCookies: document.cookie,
            origin: window.location.origin,
          });

          if (!user?.wallet_address) {
            console.warn(
              "[Wallet Debug] No wallet address found for disconnect"
            );
            // Still proceed with local cleanup
          } else {
            // 1. Call disconnect endpoint
            console.log("[Wallet Debug] Calling disconnect endpoint");
            await retryFetch(`${API_URL}/auth/disconnect`, {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                wallet: user.wallet_address,
              }),
            });
          }

          // 2. Disconnect Phantom wallet
          console.log("[Wallet Debug] Disconnecting Phantom wallet");
          const { solana } = window as any;
          if (solana?.isPhantom) {
            await solana.disconnect();
          }

          // 3. Clear local storage and cookies
          console.log("[Wallet Debug] Clearing storage and cookies");
          localStorage.removeItem("degen-duel-storage");
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(
                /=.*/,
                "=;expires=" +
                  new Date().toUTCString() +
                  ";path=/;domain=.degenduel.me"
              );
          });

          // 4. Reset store state
          console.log("[Wallet Debug] Resetting store state");
          set({ user: null, isConnecting: false });

          console.log("[Wallet Debug] Disconnect complete", {
            remainingCookies: document.cookie,
          });
        } catch (error) {
          console.error("[Wallet Debug] Disconnect failed:", error);
          // Still clear local state even if API call fails
          localStorage.removeItem("degen-duel-storage");
          document.cookie.split(";").forEach((c) => {
            document.cookie = c
              .replace(/^ +/, "")
              .replace(
                /=.*/,
                "=;expires=" +
                  new Date().toUTCString() +
                  ";path=/;domain=.degenduel.me"
              );
          });
          set({ user: null, isConnecting: false });
        }
      },

      setMaintenanceMode: (enabled: boolean) =>
        set({ maintenanceMode: enabled }),
    }),
    persistConfig
  )
);

const verifyWallet = async (
  wallet: string,
  signature: any,
  message: string
) => {
  // If debug mode is enabled, log the request
  if (DDAPI_DEBUG_MODE === "true") {
    console.log("[Auth Debug] Sending verification request");
  }

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

  // If debug mode is enabled, log the response
  if (DDAPI_DEBUG_MODE === "true") {
    console.log("[Auth Debug] Verification response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers]),
      url: response.url,
      cookies: document.cookie,
      setCookie: response.headers.get("set-cookie"),
      allHeaders: [...response.headers.entries()].reduce(
        (acc, [key, value]) => {
          acc[key.toLowerCase()] = value;
          return acc;
        },
        {} as Record<string, string>
      ),
    });
  }

  if (!response.ok) {
    // Handle 502 Bad Gateway specifically
    if (response.status === 502) {
      throw new Error(
        "Server is currently unavailable. Please try again in a few minutes."
      );
    }

    const error = await response
      .json()
      .catch(() => ({ message: "Server error" }));
    throw new Error(error.message || "Failed to verify wallet");
  }

  const data = await response.json();
  // If debug mode is enabled, log the successful verification
  if (DDAPI_DEBUG_MODE === "true") {
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
  }

  // Add a small delay to ensure cookie is set
  await new Promise((resolve) => setTimeout(resolve, 100));

  // If debug mode is enabled, log the post-delay cookie check
  if (DDAPI_DEBUG_MODE === "true") {
    console.log("[Auth Debug] Post-delay cookie check:", {
      cookies: document.cookie,
      parsedCookies: document.cookie.split(";").reduce((acc, cookie) => {
        const [key, value] = cookie.split("=").map((c) => c.trim());
        return { ...acc, [key]: value };
      }, {} as Record<string, string>),
    });
  }

  return data;
};
