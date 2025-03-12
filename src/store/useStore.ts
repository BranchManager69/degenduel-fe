// src/store/useStore.ts

import { create } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";

import { API_URL, DDAPI_DEBUG_MODE } from "../config/config";
import { ServiceConnection, ServiceNode } from "../hooks/useSkyDuelWebSocket";
import { WebSocketState } from "../hooks/useWebSocketMonitor";
import { Contest, Token, User, WalletError } from "../types/index";

interface WebSocketAlert {
  type: "error" | "warning" | "info";
  title: string;
  message: string;
}

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

export interface ServiceState {
  status: "online" | "offline" | "degraded";
  metrics: {
    uptime: number;
    latency: number;
    activeUsers: number;
  };
}

export interface ServiceAlert {
  id: string;
  type: "info" | "warning" | "error";
  message: string;
  timestamp: number;
}

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

// Import SkyDuel types

// SkyDuel system state
interface SkyDuelState {
  nodes: ServiceNode[];
  connections: ServiceConnection[];
  systemStatus: {
    overall: "operational" | "degraded" | "outage";
    timestamp: string;
    message: string;
  };
  selectedNode: string | null;
  viewMode: "graph" | "list" | "grid" | "circuit";
  lastUpdated: string;
}

// Separate type for state data (without actions)
interface StateData {
  isConnecting: boolean;
  user: User | null;
  error: WalletError | null;
  debugConfig: DebugConfig;
  contests: Contest[];
  tokens: Token[];
  maintenanceMode: boolean;
  serviceState: ServiceState | null;
  serviceAlerts: ServiceAlert[];
  // SkyDuel state
  skyDuel: SkyDuelState;
  circuitBreaker: {
    services: Array<{
      name: string;
      status: "healthy" | "degraded" | "failed";
      circuit: {
        state: "closed" | "open" | "half-open";
        failureCount: number;
        lastFailure: string | null;
        recoveryAttempts: number;
      };
      config?: {
        failureThreshold: number;
        recoveryTimeout: number;
        requestLimit: number;
      };
    }>;
    systemHealth?: {
      status: "operational" | "degraded" | "critical";
      activeIncidents: number;
      lastIncident: string | null;
    };
  };
  services: Record<
    string,
    {
      enabled: boolean;
      status: string;
      last_started: string | null;
      last_check?: string;
      stats?: {
        operations: {
          successful: number;
          total: number;
        };
        performance: {
          averageOperationTimeMs: number;
        };
        circuitBreaker?: {
          isOpen: boolean;
        };
      };
    }
  >;
  analytics: {
    userActivities: Record<
      string,
      {
        wallet: string;
        nickname: string;
        avatar_url: string;
        current_zone: string;
        previous_zone: string | null;
        wallet_balance: number;
        last_action: string;
        last_active: string;
        session_duration: number;
        is_whale: boolean;
      }
    >;
    systemMetrics: {
      active_users: number;
      total_contests: number;
      total_trades_24h: number;
      total_volume_24h: number;
      peak_concurrent_users: number;
      average_response_time: number;
      error_rate: number;
      last_updated: string;
    } | null;
    userSegments: Record<
      string,
      {
        user_count: number;
        average_balance: number;
        activity_score: number;
        retention_rate: number;
        last_updated: string;
      }
    >;
  };
  wallet: {
    status: {
      type: "created" | "statusChanged" | "balanceChanged";
      publicKey: string;
      balance?: number;
      status?: "active" | "inactive" | "locked";
      last_updated: string;
    } | null;
    transfers: Record<
      string,
      {
        transfer_id: string;
        from: string;
        to: string;
        amount: number;
        status: "pending" | "success" | "failed";
        timestamp: string;
        token?: string;
        error?: string;
      }
    >;
    activities: Array<{
      wallet: string;
      activity_type: "login" | "logout" | "connect" | "disconnect";
      device_info?: string;
      ip_address?: string;
      location?: string;
      timestamp: string;
    }>;
  };
  achievements: {
    userProgress: {
      level: number;
      experiencePoints: number;
      nextLevelThreshold: number;
      tierProgress: {
        achievements: {
          bronze: number;
          silver: number;
          gold: number;
          platinum: number;
          diamond: number;
        };
      };
    } | null;
    unlockedAchievements: Array<{
      id: string;
      tier:
        | "BRONZE"
        | "SILVER"
        | "GOLD"
        | "PLATINUM"
        | "DIAMOND"
        | "TRANSCENDENT";
      xp_awarded: number;
      achieved_at: string;
      context: any;
    }>;
    pendingCelebrations: Array<{
      type: "achievement" | "level_up";
      data: any;
      timestamp: string;
    }>;
  };
  uiDebug: {
    backgrounds: {
      movingBackground: {
        enabled: boolean;
        intensity: number;
      };
      tokenVerse: {
        enabled: boolean;
        intensity: number;
        starIntensity: number;
        bloomStrength: number;
        particleCount: number;
        updateFrequency: number;
      };
      marketBrain: {
        enabled: boolean;
        intensity: number;
        particleCount: number;
        energyLevel: number;
      };
      ambientMarketData: {
        enabled: boolean;
        intensity: number;
        updateFrequency: number;
      };
      gradientWaves: {
        enabled: boolean;
        intensity: number;
      };
      fluidTokens: {
        enabled: boolean;
        intensity: number;
      };
      abstractPatterns: {
        enabled: boolean;
        intensity: number;
      };
      neonGrid: {
        enabled: boolean;
        intensity: number;
      };
    };
  };
  webSocket: WebSocketState;
  webSocketAlerts: WebSocketAlert[];
}

// Full state type including actions
interface State extends StateData {
  setUser: (user: User | null) => void;
  setContests: (contests: Contest[]) => void;
  setTokens: (tokens: Token[]) => void;
  setDebugConfig: (config: Partial<DebugConfig>) => void;
  clearError: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  setMaintenanceMode: (enabled: boolean) => void;
  setServiceState: (
    status: "online" | "offline" | "degraded",
    metrics: { uptime: number; latency: number; activeUsers: number },
  ) => void;
  addServiceAlert: (
    type: "info" | "warning" | "error",
    message: string,
  ) => void;
  setSkyDuelState: (state: Partial<SkyDuelState>) => void;
  updateSkyDuelNode: (nodeId: string, updates: Partial<ServiceNode>) => void;
  updateSkyDuelConnection: (
    sourceId: string,
    targetId: string,
    updates: Partial<ServiceConnection>,
  ) => void;
  setSkyDuelSelectedNode: (nodeId: string | null) => void;
  setSkyDuelViewMode: (mode: SkyDuelState["viewMode"]) => void;
  setCircuitBreakerState: (state: StateData["circuitBreaker"]) => void;
  addCircuitAlert: (alert: {
    type: string;
    title: string;
    message: string;
    details?: any;
  }) => void;
  setServices: (services: StateData["services"]) => void;
  updatePortfolio: (data: {
    tokens: Array<{
      symbol: string;
      name: string;
      amount: number;
      value: number;
    }>;
    total_value: number;
    performance_24h: number;
  }) => void;
  updateTokenPrice: (data: {
    symbol: string;
    price: number;
    change_24h: number;
    timestamp: string;
  }) => void;
  addTradeNotification: (data: {
    trade_id: string;
    wallet_address: string;
    symbol: string;
    amount: number;
    price: number;
    timestamp: string;
    contest_id?: string;
  }) => void;
  updateContest: (data: {
    contest_id: string;
    status: "active" | "completed" | "cancelled";
    current_round?: number;
    time_remaining?: number;
    total_participants: number;
    total_prize_pool: number;
  }) => void;
  updateLeaderboard: (data: {
    contest_id: string;
    leaderboard: Array<{
      rank: number;
      wallet_address: string;
      username: string;
      portfolio_value: number;
      performance: number;
      last_trade_time?: string;
    }>;
    timestamp: string;
  }) => void;
  addContestActivity: (data: {
    contest_id: string;
    wallet_address: string;
    username: string;
    activity_type: "join" | "leave" | "trade";
    details?: {
      symbol?: string;
      amount?: number;
      price?: number;
    };
    timestamp: string;
  }) => void;
  updateMarketPrice: (data: {
    symbol: string;
    price: number;
    change_24h: number;
    volume_24h: number;
    high_24h: number;
    low_24h: number;
    timestamp: string;
  }) => void;
  updateMarketVolume: (data: {
    symbol: string;
    volume: number;
    trades_count: number;
    buy_volume: number;
    sell_volume: number;
    interval: "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
    timestamp: string;
  }) => void;
  updateMarketSentiment: (data: {
    symbol: string;
    sentiment_score: number;
    buy_pressure: number;
    sell_pressure: number;
    volume_trend: "increasing" | "decreasing" | "stable";
    timestamp: string;
  }) => void;
  updateUserActivity: (
    users: Array<{
      wallet: string;
      nickname: string;
      avatar_url: string;
      current_zone: string;
      previous_zone: string | null;
      wallet_balance: number;
      last_action: string;
      last_active: string;
      session_duration: number;
      is_whale: boolean;
    }>,
  ) => void;
  updateSystemMetrics: (metrics: {
    active_users: number;
    total_contests: number;
    total_trades_24h: number;
    total_volume_24h: number;
    peak_concurrent_users: number;
    average_response_time: number;
    error_rate: number;
    timestamp: string;
  }) => void;
  updateUserSegments: (segment: {
    segment: string;
    user_count: number;
    average_balance: number;
    activity_score: number;
    retention_rate: number;
    timestamp: string;
  }) => void;
  updateWalletStatus: (status: {
    type: "created" | "statusChanged" | "balanceChanged";
    publicKey: string;
    balance?: number;
    status?: "active" | "inactive" | "locked";
    timestamp: string;
  }) => void;
  trackTransfer: (transfer: {
    transfer_id: string;
    from: string;
    to: string;
    amount: number;
    status?: "success" | "failed";
    token?: string;
    error?: string;
    timestamp: string;
  }) => void;
  updateWalletActivity: (activity: {
    wallet: string;
    activity_type: "login" | "logout" | "connect" | "disconnect";
    device_info?: string;
    ip_address?: string;
    location?: string;
    timestamp: string;
  }) => void;
  updateUserProgress: (
    progress: StateData["achievements"]["userProgress"],
  ) => void;
  addAchievement: (
    achievement: StateData["achievements"]["unlockedAchievements"][0],
  ) => void;
  addCelebration: (
    celebration: StateData["achievements"]["pendingCelebrations"][0],
  ) => void;
  clearCelebration: (timestamp: string) => void;
  toggleBackground: (name: keyof StateData["uiDebug"]["backgrounds"]) => void;
  updateBackgroundSetting: (
    name: keyof StateData["uiDebug"]["backgrounds"],
    setting: string,
    value: number,
  ) => void;
  setWebSocketState: (
    state: WebSocketState | ((prev: WebSocketState) => WebSocketState),
  ) => void;
  addWebSocketAlert: (alert: WebSocketAlert) => void;
}

type StorePersist = PersistOptions<
  State,
  Pick<
    State,
    | "user"
    | "debugConfig"
    | "maintenanceMode"
    | "serviceState"
    | "serviceAlerts"
    | "skyDuel"
    | "circuitBreaker"
    | "services"
    | "analytics"
    | "wallet"
    | "achievements"
    | "webSocket"
    | "webSocketAlerts"
  >
>;

const persistConfig: StorePersist = {
  name: "degenduel-storage",
  partialize: (state) => ({
    user: state.user,
    debugConfig: state.debugConfig,
    maintenanceMode: state.maintenanceMode,
    serviceState: state.serviceState,
    serviceAlerts: state.serviceAlerts,
    skyDuel: state.skyDuel,
    circuitBreaker: state.circuitBreaker,
    services: state.services,
    analytics: state.analytics,
    wallet: state.wallet,
    achievements: state.achievements,
    webSocket: state.webSocket,
    webSocketAlerts: state.webSocketAlerts,
  }),
};

// Remove comment markers and implement retry logic
const retryFetch = async (
  url: string,
  options?: RequestInit,
  retries = 3,
  delay = 1000,
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
          },
        );

        if (i === retries - 1) {
          throw new Error(
            `Failed after ${retries} attempts. Last error: ${errorText}`,
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

const initialState: StateData = {
  isConnecting: false,
  user: null,
  error: null,
  debugConfig: {},
  contests: [],
  tokens: [],
  maintenanceMode: false,
  serviceState: null,
  serviceAlerts: [],
  // Initialize SkyDuel state
  skyDuel: {
    nodes: [],
    connections: [],
    systemStatus: {
      overall: "operational",
      timestamp: new Date().toISOString(),
      message: "System initialization",
    },
    selectedNode: null,
    viewMode: "graph",
    lastUpdated: new Date().toISOString(),
  },
  circuitBreaker: {
    services: [],
  },
  services: {},
  analytics: {
    userActivities: {},
    systemMetrics: null,
    userSegments: {},
  },
  wallet: {
    status: null,
    transfers: {},
    activities: [],
  },
  achievements: {
    userProgress: null,
    unlockedAchievements: [],
    pendingCelebrations: [],
  },
  uiDebug: {
    backgrounds: {
      movingBackground: {
        enabled: true,
        intensity: 100,
      },
      tokenVerse: {
        enabled: true,
        intensity: 75,
        starIntensity: 80,
        bloomStrength: 2.0,
        particleCount: 1500,
        updateFrequency: 50,
      },
      marketBrain: {
        enabled: true,
        intensity: 100,
        particleCount: 1000,
        energyLevel: 50,
      },
      ambientMarketData: {
        enabled: true,
        intensity: 100,
        updateFrequency: 30,
      },
      gradientWaves: {
        enabled: true,
        intensity: 100,
      },
      fluidTokens: {
        enabled: false,
        intensity: 100,
      },
      abstractPatterns: {
        enabled: true,
        intensity: 100,
      },
      neonGrid: {
        enabled: false,
        intensity: 100,
      },
    },
  },
  webSocket: {
    systemHealth: {
      status: "operational",
      activeConnections: 0,
      messageRate: 0,
      activeIncidents: 0,
      lastUpdate: new Date().toISOString(),
    },
    services: [],
  },
  webSocketAlerts: [],
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialState,
      setUser: (user) => set({ user }),
      setContests: (contests) => set({ contests }),
      setTokens: (tokens) => set({ tokens }),
      setDebugConfig: (config) =>
        set((state) => ({
          debugConfig: { ...state.debugConfig, ...config },
        })),
      clearError: () => set({ error: null }),
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
            },
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
                "Server is currently unavailable. Please try again in a few minutes.",
              );
            }

            throw new Error(
              `Failed to get nonce after retries: ${nonceRes.status} ${errorText}`,
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
            "utf8",
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
            authPayload.message,
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
              jwt: authResponse.token,
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
              "[Wallet Debug] No wallet address found for disconnect",
            );
            // Still proceed with local cleanup
          } else {
            // 1. Call disconnect endpoint
            console.log("[Wallet Debug] Calling disconnect endpoint");
            try {
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
            } catch (error) {
              console.error(
                "[Wallet Debug] Disconnect endpoint failed:",
                error,
              );
              // Continue with local cleanup even if server call fails
            }
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

          // Clear cookies for all possible domains/paths
          const domains = [
            window.location.hostname,
            `.${window.location.hostname}`,
            "degenduel.me",
            ".degenduel.me",
          ];
          const paths = ["/", "/api"];

          document.cookie.split(";").forEach((c) => {
            const cookieName = c.split("=")[0].trim();
            domains.forEach((domain) => {
              paths.forEach((path) => {
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}${
                  domain ? `; domain=${domain}` : ""
                }`;
              });
            });
          });

          // 4. Reset store state
          console.log("[Wallet Debug] Resetting store state");
          set({ user: null, isConnecting: false });

          console.log("[Wallet Debug] Disconnect complete", {
            remainingCookies: document.cookie,
          });
        } catch (error) {
          console.error("[Wallet Debug] Disconnect failed:", error);
          // Still clear local state even if something fails
          localStorage.removeItem("degen-duel-storage");
          set({ user: null, isConnecting: false });
        }
      },
      setMaintenanceMode: async (enabled: boolean) => {
        try {
          set({ maintenanceMode: enabled });

          const response = await retryFetch(
            `${API_URL}/admin/maintenance/status`,
            {
              method: "GET",
              credentials: "include",
            },
          );

          if (!response.ok) {
            throw new Error("Failed to verify maintenance mode status");
          }

          const { enabled: backendStatus } = await response.json();

          if (backendStatus !== enabled) {
            console.warn(
              "Maintenance mode state mismatch detected, syncing with backend",
            );
            set({ maintenanceMode: backendStatus });
          }
        } catch (error) {
          console.error("Failed to sync maintenance mode:", error);
          const response = await retryFetch(
            `${API_URL}/admin/maintenance/status`,
            {
              method: "GET",
              credentials: "include",
            },
          ).catch(() => null);

          if (response) {
            const { enabled: backendStatus } = await response.json();
            set({ maintenanceMode: backendStatus });
          }
        }
      },
      setServiceState: (status, metrics) =>
        set({
          serviceState: {
            status,
            metrics,
          },
        }),
      addServiceAlert: (type, message) =>
        set((state) => ({
          serviceAlerts: [
            ...state.serviceAlerts,
            { id: Date.now().toString(), type, message, timestamp: Date.now() },
          ],
        })),
      setCircuitBreakerState: (state) => set({ circuitBreaker: state }),
      addCircuitAlert: (alert) => {
        set((state) => ({
          serviceAlerts: [
            {
              id: crypto.randomUUID(),
              type: alert.type as "info" | "warning" | "error",
              message: alert.message,
              timestamp: Date.now(),
            },
            ...state.serviceAlerts,
          ],
        }));
      },
      setServices: (services) => set({ services }),
      // SkyDuel actions
      setSkyDuelState: (state) =>
        set((prevState) => ({
          skyDuel: {
            ...prevState.skyDuel,
            ...state,
            lastUpdated: new Date().toISOString(),
          },
        })),
      updateSkyDuelNode: (nodeId, updates) =>
        set((prevState) => {
          const nodeIndex = prevState.skyDuel.nodes.findIndex(
            (node) => node.id === nodeId,
          );
          if (nodeIndex === -1) return prevState;

          const updatedNodes = [...prevState.skyDuel.nodes];
          updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            ...updates,
          };

          return {
            skyDuel: {
              ...prevState.skyDuel,
              nodes: updatedNodes,
              lastUpdated: new Date().toISOString(),
            },
          };
        }),
      updateSkyDuelConnection: (sourceId, targetId, updates) =>
        set((prevState) => {
          const connectionIndex = prevState.skyDuel.connections.findIndex(
            (conn) => conn.source === sourceId && conn.target === targetId,
          );
          if (connectionIndex === -1) return prevState;

          const updatedConnections = [...prevState.skyDuel.connections];
          updatedConnections[connectionIndex] = {
            ...updatedConnections[connectionIndex],
            ...updates,
          };

          return {
            skyDuel: {
              ...prevState.skyDuel,
              connections: updatedConnections,
              lastUpdated: new Date().toISOString(),
            },
          };
        }),
      setSkyDuelSelectedNode: (nodeId) =>
        set((prevState) => ({
          skyDuel: {
            ...prevState.skyDuel,
            selectedNode: nodeId,
          },
        })),
      setSkyDuelViewMode: (mode) =>
        set((prevState) => ({
          skyDuel: {
            ...prevState.skyDuel,
            viewMode: mode,
          },
        })),
      updatePortfolio: (data) => {
        // Implementation will update portfolio state
        console.log("Portfolio updated:", data);
      },
      updateTokenPrice: (data) => {
        // Implementation will update token price state
        console.log("Token price updated:", data);
      },
      addTradeNotification: (data) => {
        // Implementation will add trade notification
        console.log("Trade notification added:", data);
      },
      updateContest: (data) => {
        // Implementation will update contest state
        console.log("Contest updated:", data);
      },
      updateLeaderboard: (data) => {
        // Implementation will update leaderboard state
        console.log("Leaderboard updated:", data);
      },
      addContestActivity: (data) => {
        // Implementation will add contest activity
        console.log("Contest activity added:", data);
      },
      updateMarketPrice: (data) => {
        // Implementation will update market price state
        console.log("Market price updated:", data);
      },
      updateMarketVolume: (data) => {
        // Implementation will update market volume state
        console.log("Market volume updated:", data);
      },
      updateMarketSentiment: (data) => {
        // Implementation will update market sentiment state
        console.log("Market sentiment updated:", data);
      },
      updateUserActivity: (users) =>
        set((state) => ({
          analytics: {
            ...state.analytics,
            userActivities: users.reduce(
              (acc, user) => ({
                ...acc,
                [user.wallet]: user,
              }),
              state.analytics.userActivities,
            ),
          },
        })),
      updateSystemMetrics: (metrics) =>
        set((state) => ({
          analytics: {
            ...state.analytics,
            systemMetrics: {
              ...metrics,
              last_updated: metrics.timestamp,
            },
          },
        })),
      updateUserSegments: (segment) =>
        set((state) => ({
          analytics: {
            ...state.analytics,
            userSegments: {
              ...state.analytics.userSegments,
              [segment.segment]: {
                user_count: segment.user_count,
                average_balance: segment.average_balance,
                activity_score: segment.activity_score,
                retention_rate: segment.retention_rate,
                last_updated: segment.timestamp,
              },
            },
          },
        })),
      updateWalletStatus: (status) =>
        set((state) => ({
          wallet: {
            ...state.wallet,
            status: {
              ...status,
              last_updated: status.timestamp,
            },
          },
        })),
      trackTransfer: (transfer) =>
        set((state) => ({
          wallet: {
            ...state.wallet,
            transfers: {
              ...state.wallet.transfers,
              [transfer.transfer_id]: {
                ...transfer,
                status: transfer.status || "pending",
              },
            },
          },
        })),
      updateWalletActivity: (activity) =>
        set((state) => ({
          wallet: {
            ...state.wallet,
            activities: [activity, ...state.wallet.activities],
          },
        })),
      updateUserProgress: (progress) =>
        set((state) => ({
          achievements: {
            ...state.achievements,
            userProgress: progress,
          },
        })),
      addAchievement: (achievement) =>
        set((state) => ({
          achievements: {
            ...state.achievements,
            unlockedAchievements: [
              achievement,
              ...state.achievements.unlockedAchievements,
            ],
          },
        })),
      addCelebration: (celebration) =>
        set((state) => ({
          achievements: {
            ...state.achievements,
            pendingCelebrations: [
              celebration,
              ...state.achievements.pendingCelebrations,
            ],
          },
        })),
      clearCelebration: (timestamp) =>
        set((state) => ({
          achievements: {
            ...state.achievements,
            pendingCelebrations: state.achievements.pendingCelebrations.filter(
              (c) => c.timestamp !== timestamp,
            ),
          },
        })),
      toggleBackground: (name) =>
        set((state) => ({
          uiDebug: {
            ...state.uiDebug,
            backgrounds: {
              ...state.uiDebug.backgrounds,
              [name]: {
                ...state.uiDebug.backgrounds[name],
                enabled: !state.uiDebug.backgrounds[name].enabled,
              },
            },
          },
        })),
      updateBackgroundSetting: (name, setting, value) =>
        set((state) => ({
          uiDebug: {
            ...state.uiDebug,
            backgrounds: {
              ...state.uiDebug.backgrounds,
              [name]: {
                ...state.uiDebug.backgrounds[name],
                [setting]: value,
              },
            },
          },
        })),
      setWebSocketState: (state) =>
        set((prev) => ({
          ...prev,
          webSocket:
            typeof state === "function" ? state(prev.webSocket) : state,
        })),
      addWebSocketAlert: (alert) =>
        set((prev) => ({
          ...prev,
          webSocketAlerts: [...prev.webSocketAlerts, alert],
        })),
    }),
    {
      ...persistConfig,
      onRehydrateStorage: () => async (state) => {
        if (!state) return;

        try {
          const response = await fetch(`${API_URL}/admin/maintenance/status`, {
            credentials: "include",
          });

          if (response.ok) {
            const { enabled: backendStatus } = await response.json();
            if (backendStatus !== state.maintenanceMode) {
              console.warn(
                "Maintenance mode state mismatch on init, syncing with backend",
              );
              state.setMaintenanceMode(backendStatus);
            }
          }
        } catch (error) {
          console.error("Failed to verify maintenance mode on init:", error);
        }
      },
    },
  ),
);

const verifyWallet = async (
  wallet: string,
  signature: any,
  message: string,
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
        {} as Record<string, string>,
      ),
    });
  }

  if (!response.ok) {
    // Handle 502 Bad Gateway specifically
    if (response.status === 502) {
      throw new Error(
        "Server is currently unavailable. Please try again in a few minutes.",
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
      parsedCookies: document.cookie.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.split("=").map((c) => c.trim());
          return { ...acc, [key]: value };
        },
        {} as Record<string, string>,
      ),
    });
  }

  return data;
};
