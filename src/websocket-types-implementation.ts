/**
 * WebSocket Type Definitions for DegenDuel
 * 
 * This file contains shared type definitions for WebSocket communication
 * between the frontend and backend systems.
 */

/**
 * WebSocket Topics
 * Used to organize messages by functional area
 */
export enum DDWebSocketTopic {
  MARKET_DATA = 'market_data',
  PORTFOLIO = 'portfolio',
  SYSTEM = 'system',
  CONTEST = 'contest',
  USER = 'user',
  ADMIN = 'admin',
  WALLET = 'wallet',
  WALLET_BALANCE = 'wallet-balance',
  SKYDUEL = 'skyduel',
  TERMINAL = 'terminal',
  LOGS = 'logs',
  LAUNCH_EVENTS = 'launch_events'
}

/**
 * WebSocket Message Types
 * Used to categorize the purpose of each message
 */
export enum DDWebSocketMessageType {
  // Client -> Server messages
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  REQUEST = 'REQUEST',
  COMMAND = 'COMMAND',
  
  // Server -> Client messages
  DATA = 'DATA',
  RESPONSE = 'RESPONSE',
  ERROR = 'ERROR',
  SYSTEM = 'SYSTEM',
  ACKNOWLEDGMENT = 'ACKNOWLEDGMENT'
}

/**
 * WebSocket Action Names
 * Standard action names for client requests and server responses
 * 
 * *** IMPORTANT IMPLEMENTATION NOTES ***
 * 1. The enum keys use UPPERCASE_WITH_UNDERSCORES for type safety and code clarity
 * 2. The string values use camelCase to match the backend's expected format
 * 3. When adding new actions, follow this pattern: ACTION_NAME = 'actionName'
 * 4. Always group actions by topic with comments for better organization
 * 5. Keep the values in sync with backend handlers to prevent communication errors
 */
export enum DDWebSocketActions {
  // ========== MARKET_DATA topic actions ==========
  GET_TOKENS = 'getTokens',
  GET_TOKEN = 'getToken',
  GET_TOKEN_DETAILS = 'getTokenDetails',
  GET_PRICE_HISTORY = 'getPriceHistory',
  GET_PRICE_UPDATES = 'getPriceUpdates',
  GET_TOP_TOKENS = 'getTopTokens',
  GET_TRENDING_TOKENS = 'getTrendingTokens',
  GET_TOKEN_STATS = 'getTokenStats',
  SEARCH_TOKENS = 'searchTokens',
  TOKEN_UPDATE = 'tokenUpdate',
  PRICE_UPDATE = 'priceUpdate',
  
  // ========== USER topic actions ==========
  GET_PROFILE = 'getProfile',
  UPDATE_PROFILE = 'updateProfile',
  GET_USER_STATS = 'getUserStats',
  GET_USER_ACHIEVEMENTS = 'getUserAchievements',
  GET_USER_HISTORY = 'getUserHistory',
  GET_USER_ACTIVITY = 'getUserActivity',
  VERIFY_USER = 'verifyUser',
  
  // ========== LOGS topic actions ==========
  SEND_CLIENT_LOG = 'sendClientLog',
  GET_CLIENT_LOGS = 'getClientLogs',
  CLEAR_LOGS = 'clearLogs',
  
  // ========== SYSTEM topic actions ==========
  GET_STATUS = 'getStatus',
  GET_SETTINGS = 'getSettings',
  STATUS_UPDATE = 'statusUpdate',
  SYSTEM_ALERT = 'systemAlert',
  SYSTEM_NOTIFICATION = 'systemNotification',
  MAINTENANCE_STATUS = 'maintenanceStatus',
  MAINTENANCE_MODE_UPDATE = 'maintenanceModeUpdate',
  SETTINGS_UPDATE = 'settingsUpdate',
  
  // ========== WALLET topic actions ==========
  // Transaction-related actions
  GET_TRANSACTIONS = 'getTransactions',
  GET_TRANSACTION = 'getTransaction',
  GET_RECENT_TRANSACTIONS = 'getRecentTransactions',
  VERIFY_TRANSACTION = 'verifyTransaction',
  
  // Settings-related actions
  UPDATE_SETTINGS = 'updateSettings',
  GET_WALLET_SETTINGS = 'getWalletSettings',
  
  // ========== WALLET_BALANCE topic actions ==========
  GET_SOLANA_BALANCE = 'getSolanaBalance',
  GET_TOKEN_BALANCE = 'getTokenBalance',
  GET_WALLET_BALANCE = 'getWalletBalance',
  GET_BALANCE = 'getBalance',
  REFRESH_TOKEN_BALANCE = 'refreshTokenBalance',
  TOKEN_BALANCE_UPDATE = 'tokenBalanceUpdate',
  PORTFOLIO_BALANCE_UPDATE = 'portfolioBalanceUpdate',
  
  // ========== TERMINAL topic actions ==========
  GET_DATA = 'getData',
  TERMINAL_UPDATE = 'update',  // Renamed to avoid duplicate with common UPDATE
  GET_COMMANDS = 'getCommands',
  EXECUTE_COMMAND = 'executeCommand',
  
  // ========== CONTEST topic actions ==========
  GET_CONTESTS = 'getContests',
  GET_CONTEST = 'getContest',
  CREATE_CONTEST = 'createContest',
  JOIN_CONTEST = 'joinContest',
  LEAVE_CONTEST = 'leaveContest',
  GET_CONTEST_SCHEDULES = 'getContestSchedules',
  GET_USER_CONTESTS = 'getUserContests',
  UPDATE_CONTEST = 'updateContest',
  CANCEL_CONTEST = 'cancelContest',
  START_CONTEST = 'startContest',
  END_CONTEST = 'endContest',
  GET_CONTEST_PARTICIPANTS = 'getContestParticipants',
  GET_CONTEST_LEADERBOARD = 'getContestLeaderboard',
  GET_CONTEST_RESULTS = 'getContestResults',
  SUBMIT_PORTFOLIO = 'submitPortfolio',
  UPDATE_PORTFOLIO = 'updatePortfolio',
  
  // ========== CONTEST_CHAT topic actions ==========
  GET_MESSAGES = 'getMessages',
  SEND_MESSAGE = 'sendMessage',
  DELETE_MESSAGE = 'deleteMessage',
  PIN_MESSAGE = 'pinMessage',
  
  // ========== ADMIN topic actions ==========
  GET_SYSTEM_STATUS = 'getSystemStatus',
  GET_USER_LIST = 'getUserList',
  BAN_USER = 'banUser',
  UNBAN_USER = 'unbanUser',
  GET_SYSTEM_METRICS = 'getSystemMetrics',
  GET_ERROR_LOGS = 'getErrorLogs',
  RESTART_SERVICE = 'restartService',
  UPDATE_SYSTEM_SETTINGS = 'updateSystemSettings',
  
  // ========== ANALYTICS topic actions ==========
  GET_USER_ANALYTICS = 'getUserAnalytics',
  GET_SYSTEM_ANALYTICS = 'getSystemAnalytics',
  GET_CONTEST_ANALYTICS = 'getContestAnalytics',
  GET_PERFORMANCE_METRICS = 'getPerformanceMetrics',
  
  // ========== ACHIEVEMENT topic actions ==========
  GET_ACHIEVEMENTS = 'getAchievements',
  UNLOCK_ACHIEVEMENT = 'unlockAchievement',
  GET_ACHIEVEMENT_PROGRESS = 'getAchievementProgress',
  
  // ========== NOTIFICATION topic actions ==========
  GET_NOTIFICATIONS = 'getNotifications',
  MARK_AS_READ = 'markAsRead',
  CLEAR_NOTIFICATIONS = 'clearNotifications',
  MARK_ALL_AS_READ = 'markAllAsRead',
  
  // ========== SKYDUEL topic actions ==========
  GET_GAME_STATE = 'getGameState',
  JOIN_GAME = 'joinGame',
  MAKE_MOVE = 'makeMove',
  FORFEIT_GAME = 'forfeitGame',
  GET_LEADERBOARD = 'getLeaderboard',
  
  // ========== CIRCUIT_BREAKER topic actions ==========
  GET_CIRCUIT_STATUS = 'getCircuitStatus',
  TRIGGER_CIRCUIT = 'triggerCircuit',
  RESET_CIRCUIT = 'resetCircuit',
  
  // ========== SERVICE topic actions ==========
  GET_SERVICE_STATUS = 'getServiceStatus',
  UPDATE_SERVICE = 'updateService',
  RESTART_SERVICE_INSTANCE = 'restartServiceInstance',
  
  // ========== RPC_BENCHMARK topic actions ==========
  GET_RPC_STATUS = 'getRpcStatus',
  RUN_BENCHMARK = 'runBenchmark',
  GET_BENCHMARK_RESULTS = 'getBenchmarkResults',
  
  // ========== LIQUIDITY_SIM topic actions ==========
  GET_SIMULATION_PARAMS = 'getSimulationParams',
  RUN_SIMULATION = 'runSimulation',
  SAVE_SIMULATION = 'saveSimulation',
  GET_SAVED_SIMULATIONS = 'getSavedSimulations',
  
  // ========== VANITY_DASHBOARD topic actions ==========
  GET_VANITY_WALLETS = 'getVanityWallets',
  CREATE_VANITY_WALLET = 'createVanityWallet',
  CHECK_VANITY_POOL = 'checkVanityPool',
  
  // ========== LAUNCH_EVENTS topic actions ==========
  ADDRESS_REVEALED = 'addressRevealed',
  GET_LAUNCH_STATUS = 'getLaunchStatus',
  
  // ========== Subscription actions for all topics ==========
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  
  // ========== Common actions applicable to multiple topics ==========
  REFRESH = 'refresh',
  GET_ALL = 'getAll',
  GET_BY_ID = 'getById',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  
  // ========== CONTEST topic actions (continued, or new section for view updates) ==========
  // From FE_WEBSOCKETS_CONTESTS.md for contest view updates
  LEADERBOARD_UPDATE = 'leaderboardUpdate', // Standardized to camelCase value
  PARTICIPANT_UPDATE = 'participantUpdate', // Standardized to camelCase value
  
  // Ensure NEW_MESSAGE is also here if used by chat, though chat uses its own hook
  // For consistency, if action strings are shared, they should be in this central enum.
  // The chat hook (useContestChat) might reference actions like GET_MESSAGES, SEND_MESSAGE etc.
  // which are already in DDWebSocketActions.

  // ADDED FOR CONTEST_CHAT in useContestChat - ensure these are sensible & match backend
  // GET_MESSAGES = 'getMessages', // Already exists
  // SEND_MESSAGE = 'sendMessage', // Already exists
  // DELETE_MESSAGE = 'deleteMessage', // Already exists
  // PIN_MESSAGE = 'pinMessage', // Already exists

  // Add any other actions from FE_WEBSOCKETS_CONTESTS.md if they are distinct and needed
  // For example, the doc mentions "NEW_MESSAGE" for chat, if that's a specific action string.
  // For now, only adding the ones for the useContestViewUpdates hook.

  // Ensure common actions like SUBSCRIBE, UNSUBSCRIBE, REFRESH, GET_ALL etc. are at the end or grouped logically
  // SUBSCRIBE = 'subscribe', // Already exists
  // UNSUBSCRIBE = 'unsubscribe', // Already exists
  // REFRESH = 'refresh', // Already exists
  // GET_ALL = 'getAll', // Already exists
  // GET_BY_ID = 'getById', // Already exists
  // CREATE = 'create', // Already exists
  // UPDATE = 'update', // Already exists
  // DELETE = 'delete' // Already exists
}

/**
 * Base WebSocket Message Interface
 */
export interface DDWebSocketMessage {
  type: DDWebSocketMessageType;
  topic: DDWebSocketTopic;
  timestamp?: string;
  subtype?: string;
}

/**
 * WebSocket Request Message Interface
 * Used for messages from client to server
 */
export interface DDWebSocketRequestMessage extends DDWebSocketMessage {
  type: DDWebSocketMessageType.REQUEST | DDWebSocketMessageType.COMMAND;
  action: DDWebSocketActions;
  data?: any;
  requestId?: string;
}

/**
 * WebSocket Response Message Interface
 * Used for server responses to client requests
 */
export interface DDWebSocketResponseMessage extends DDWebSocketMessage {
  type: DDWebSocketMessageType.RESPONSE;
  action: DDWebSocketActions;
  data: any;
  requestId?: string;
}

/**
 * WebSocket Data Message Interface
 * Used for pushed data from server to client
 */
export interface DDWebSocketDataMessage extends DDWebSocketMessage {
  type: DDWebSocketMessageType.DATA;
  action?: DDWebSocketActions;
  data: any;
}

/**
 * WebSocket Subscription Message Interface
 * Used for subscribing to topics
 */
export interface DDWebSocketSubscriptionMessage extends DDWebSocketMessage {
  type: DDWebSocketMessageType.SUBSCRIBE | DDWebSocketMessageType.UNSUBSCRIBE;
  data?: {
    parameters?: any;
  }
}

/**
 * WebSocket Error Message Interface
 * Used for error responses
 */
export interface DDWebSocketErrorMessage extends DDWebSocketMessage {
  type: DDWebSocketMessageType.ERROR;
  error: string;
  code: number;
  requestId?: string;
}

/**
 * WebSocket Acknowledgment Message Interface
 * Used for acknowledging subscription requests
 */
export interface DDWebSocketAcknowledgmentMessage extends DDWebSocketMessage {
  type: DDWebSocketMessageType.ACKNOWLEDGMENT;
  action: DDWebSocketActions;
  data: any;
  requestId?: string;
}

/**
 * WebSocket System Message Interface
 * Used for system-level notifications
 */
export interface DDWebSocketSystemMessage extends DDWebSocketMessage {
  type: DDWebSocketMessageType.SYSTEM;
  data: any;
}

// Define payload for the ADDRESS_REVEALED message
export interface DDWebSocketLaunchAddressRevealedPayload {
  contractAddress: string;
  revealTime: string; // ISO timestamp of when reveal happened on server
}

// Extend DDWebSocketDataMessage potentially or create specific type
export interface DDWebSocketLaunchDataMessage extends DDWebSocketMessage {
  type: DDWebSocketMessageType.DATA;
  topic: DDWebSocketTopic.LAUNCH_EVENTS;
  action?: DDWebSocketActions.ADDRESS_REVEALED; // Action might be included
  data: DDWebSocketLaunchAddressRevealedPayload;
}

// Define payload for MAINTENANCE_MODE_UPDATE message
export interface DDWebSocketMaintenanceModeUpdatePayload {
  enabled: boolean;
  timestamp?: string; // Optional timestamp from server
}

// Potentially extend DDWebSocketDataMessage or create specific type if needed
export interface DDWebSocketSystemDataMessage extends DDWebSocketMessage {
  type: DDWebSocketMessageType.DATA;
  topic: DDWebSocketTopic.SYSTEM;
  action?: DDWebSocketActions.MAINTENANCE_MODE_UPDATE | DDWebSocketActions.STATUS_UPDATE | string; // Allow known actions
  data: DDWebSocketMaintenanceModeUpdatePayload | any; // Use specific payload or allow any
}