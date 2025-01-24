// src/store/useStore.ts
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

      // connectWallet: async () => {
      //   if (get().isConnecting) return;

      //   try {
      //     set({ isConnecting: true, error: null });

      //     const { solana } = window as any;
      //     const { debugConfig } = get();
      //     let userData: any = null;

      //     /* For Superadmin Debug Menu (part 1 of 3) */
      //     // Debug: Force wallet not found
      //     if (debugConfig.forceWalletNotFound || !solana?.isPhantom) {
      //       throw {
      //         code: "WALLET_NOT_FOUND",
      //         message:
      //           "Phantom wallet not found! Please install it from phantom.app",
      //       } as WalletError;
      //     }

      //     // Debug: Force user rejection
      //     if (debugConfig.forceUserRejection) {
      //       throw {
      //         code: "USER_REJECTED",
      //         message: "Wallet connection was rejected",
      //       } as WalletError;
      //     }
      //     /* End Superadmin Debug Menu (part 1 of 3) */

      //     /* Start Actual Wallet Connection */
      //     // Connect to Phantom
      //     const response = await solana.connect();
      //     const walletAddress = response.publicKey.toString();
      //     console.log("Connected to wallet:", walletAddress);

      //     // Request signature to verify wallet ownership
      //     const message = `DegenDuel Authentication\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      //     console.log("Requesting signature for message:", message);

      //     const encodedMessage = new TextEncoder().encode(message);
      //     const signedMessage = await solana.signMessage(
      //       encodedMessage,
      //       "utf8"
      //     );
      //     console.log("Received signed message:", {
      //       signature: Array.from(signedMessage.signature),
      //       signatureLength: signedMessage.signature.length,
      //     });

      //     // Send signature to backend for verification
      //     const authPayload = {
      //       wallet: walletAddress,
      //       signature: Array.from(signedMessage.signature),
      //       message: message,
      //     };
      //     console.log("Sending auth payload:", authPayload);

      //     const authResponse = await fetch(`${API_URL}/auth/verify-wallet`, {
      //       method: "POST",
      //       headers: {
      //         "Content-Type": "application/json",
      //       },
      //       body: JSON.stringify(authPayload),
      //       credentials: "include",
      //     });

      //     const authData = await authResponse.json();
      //     console.log("Auth response:", {
      //       status: authResponse.status,
      //       ok: authResponse.ok,
      //       data: authData,
      //     });

      //     if (!authResponse.ok) {
      //       throw new Error(
      //         `Failed to verify wallet signature: ${
      //           authData.error || "Unknown error"
      //         }`
      //       );
      //     }
      //     /* End Actual Wallet Connection */

      //     /* Start Superadmin Debug Menu (part 2 of 3) */
      //     // Debug: Force API error
      //     if (debugConfig.forceAPIError) {
      //       throw {
      //         code: "API_ERROR",
      //         message: "Failed to fetch or create user data",
      //       } as WalletError;
      //     }
      //     /* End Superadmin Debug Menu (part 2 of 3) */

      //     // Try to fetch existing user data with retries
      //     let userResponse;
      //     try {
      //       // Add auth headers to the initial user fetch
      //       userResponse = await retryFetch(
      //         `${API_URL}/users/${walletAddress}`,
      //         {
      //           headers: {
      //             "Content-Type": "application/json",
      //             "X-Wallet-Address": walletAddress,
      //             ...(authData?.token && {
      //               Authorization: `Bearer ${authData.token}`,
      //             }),
      //           },
      //           credentials: "include",
      //         }
      //       );

      //       console.log("User fetch response:", {
      //         status: userResponse.status,
      //         ok: userResponse.ok,
      //       });

      //       // If user doesn't exist, create a new one
      //       if (userResponse.status === 404) {
      //         console.log("User not found, creating new user...");
      //         try {
      //           const createUserPayload = {
      //             wallet_address: walletAddress,
      //             nickname: `degen_${walletAddress.slice(0, 8)}`,
      //           };
      //           console.log("Creating user with payload:", createUserPayload);

      //           const createResponse = await fetch(`${API_URL}/users`, {
      //             method: "POST",
      //             headers: {
      //               "Content-Type": "application/json",
      //               "X-Wallet-Address": walletAddress,
      //               ...(authData?.token && {
      //                 Authorization: `Bearer ${authData.token}`,
      //               }),
      //             },
      //             body: JSON.stringify(createUserPayload),
      //             credentials: "include",
      //           });

      //           console.log(
      //             "Create user response status:",
      //             createResponse.status
      //           );
      //           console.log(
      //             "Create user response headers:",
      //             Object.fromEntries(createResponse.headers.entries())
      //           );

      //           const responseText = await createResponse.text();
      //           console.log("Create user raw response:", responseText);

      //           if (responseText) {
      //             try {
      //               userData = JSON.parse(responseText);
      //             } catch (parseError) {
      //               console.error("Failed to parse user creation response:", {
      //                 text: responseText,
      //                 error: parseError,
      //               });
      //             }
      //           }

      //           if (!createResponse.ok) {
      //             throw new Error(
      //               userData?.error ||
      //                 `Failed to create user: ${responseText} (Status: ${createResponse.status})`
      //             );
      //           }

      //           if (!userData || !userData.wallet_address) {
      //             throw new Error("Invalid user data received from server");
      //           }

      //           console.log("Successfully created user:", userData);
      //           userResponse = createResponse;
      //         } catch (error) {
      //           const e = error as Error;
      //           console.error("User creation failed:", {
      //             error: e,
      //             message: e.message,
      //             stack: e.stack,
      //           });
      //           throw {
      //             code: "API_ERROR",
      //             message: `Failed to create user account: ${e.message}`,
      //           } as WalletError;
      //         }
      //       } else {
      //         // Handle existing user response
      //         try {
      //           const responseText = await userResponse.text();
      //           try {
      //             userData = JSON.parse(responseText);
      //           } catch (parseError) {
      //             console.error("Invalid JSON response:", responseText);
      //             throw {
      //               code: "API_ERROR",
      //               message: "Received invalid data from server",
      //             } as WalletError;
      //           }
      //         } catch (error) {
      //           const e = error as Error;
      //           console.error("Failed to read response:", e);
      //           throw {
      //             code: "API_ERROR",
      //             message: "Failed to process server response",
      //           } as WalletError;
      //         }
      //       }

      //       if (!userData) {
      //         throw {
      //           code: "API_ERROR",
      //           message: "No user data received from server",
      //         } as WalletError;
      //       }

      //       console.log("Successfully retrieved user data:", userData);
      //       set({
      //         user: {
      //           ...userData,
      //           is_admin: isAdminWallet(userData.wallet_address),
      //         },
      //       });
      //     } catch (e) {
      //       console.error("Failed to fetch user after retries:", e);
      //       // Try to get more error details
      //       if (e instanceof Error) {
      //         throw {
      //           code: "API_ERROR",
      //           message: `Unable to connect to server: ${e.message}`,
      //         } as WalletError;
      //       }
      //       throw {
      //         code: "API_ERROR",
      //         message: "Unable to connect to server. Please try again later.",
      //       } as WalletError;
      //     }
      //   } catch (error) {
      //     console.error("Failed to connect wallet:", error);
      //     set({
      //       error: (error as WalletError).code
      //         ? (error as WalletError)
      //         : {
      //             code: "CONNECTION_FAILED",
      //             message: "Failed to connect wallet",
      //           },
      //     });
      //   } finally {
      //     set({ isConnecting: false });
      //   }
      // },

      connectWallet: async () => {
        const { isConnecting, debugConfig } = get();
        if (isConnecting) return;

        try {
          set({ isConnecting: true, error: null });

          const { solana } = window as any;

          // If Phantom not installed or debug override:
          if (debugConfig.forceWalletNotFound || !solana?.isPhantom) {
            throw {
              code: "WALLET_NOT_FOUND",
              message:
                "Phantom wallet not found! Please install it from phantom.app",
            } as WalletError;
          }

          // Possibly simulate user rejection (debug)
          if (debugConfig.forceUserRejection) {
            throw {
              code: "USER_REJECTED",
              message: "Wallet connection was rejected",
            } as WalletError;
          }

          // 1) Connect to Phantom
          const response = await solana.connect();
          const walletAddress = response.publicKey.toString();
          console.log("Connected to wallet:", walletAddress);

          // 2) Fetch a nonce from your server
          const challengeRes = await fetch(
            `${API_URL}/auth/challenge?wallet=${walletAddress}`,
            {
              method: "GET",
              credentials: "include",
            }
          );
          if (!challengeRes.ok) {
            throw new Error(
              `Failed to get nonce from server: ${challengeRes.status}`
            );
          }
          const { nonce } = await challengeRes.json();
          console.log("Received nonce from server:", nonce);

          // 3) Construct the message that includes the nonce
          // Example format:
          //   "DegenDuel Authentication
          //    Wallet: <walletAddress>
          //    Nonce: <nonce>
          //    Timestamp: <Date.now()>"
          const message = [
            "DegenDuel Authentication",
            `Wallet: ${walletAddress}`,
            `Nonce: ${nonce}`,
            `Timestamp: ${Date.now()}`,
          ].join("\n");
          console.log("Requesting signature for message:", message);

          // 4) Sign the message
          const encodedMessage = new TextEncoder().encode(message);
          const signedMessage = await solana.signMessage(
            encodedMessage,
            "utf8"
          );
          console.log("Received signed message:", {
            signature: Array.from(signedMessage.signature),
            signatureLength: signedMessage.signature.length,
          });

          // 5) POST to /verify-wallet
          const authPayload = {
            wallet: walletAddress,
            signature: Array.from(signedMessage.signature),
            message: message,
          };
          console.log("Sending auth payload:", authPayload);

          const authResponse = await fetch(`${API_URL}/auth/verify-wallet`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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

          // 6) If you want to fetch user data:
          // (some code omitted for brevity, you can keep your old logic of /users/walletAddress)
          // For example:
          const walletAddr = authData.user?.wallet_address;
          if (!walletAddr) {
            throw new Error("No user wallet address returned from auth");
          }

          // If you do the same logic as before to fetch or create a user:
          //   ... your existing user fetch (404 => create user) ...
          //   set({ user: { ...userData, is_admin: isAdminWallet(...)} })

          // Or if the returned "authData.user" is enough:
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
              risk_level: authData.user.risk_level,
              is_admin: isAdminWallet(authData.user.wallet_address),
            },
          });
        } catch (error) {
          console.error("Failed to connect wallet:", error);
          set({
            error: (error as WalletError).code
              ? (error as WalletError)
              : {
                  code: "CONNECTION_FAILED",
                  message:
                    (error as Error).message || "Failed to connect wallet",
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
