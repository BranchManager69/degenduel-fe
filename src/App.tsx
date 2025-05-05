// src/App.tsx

/**
 * Main entry point for the DegenDuel frontend.
 * 
 * @author @BranchManager69
 * @version 1.9.0
 * @created 2025-04-02
 * @updated 2025-04-30
 */

/***********************************************************************
 * ⚠️ CRITICAL PERFORMANCE OPTIMIZATION NEEDED ⚠️
 * 
 * BEFORE GOING LIVE, WE MUST IMPLEMENT LAZY LOADING ACROSS THE APP.
 * 
 * URGENT ACTION REQUIRED:
 * - LAZY LOAD ALL MAJOR COMPONENTS AND ROUTES
 * - IMPLEMENT CODE SPLITTING FOR ALL FEATURE MODULES
 * - ADD SUSPENSE BOUNDARIES WITH APPROPRIATE FALLBACKS
 * - PRIORITIZE CRITICAL PATH RENDERING
 * - DEFER LOADING OF NON-ESSENTIAL COMPONENTS
 * 
 * CURRENTLY ONLY 2-3 COMPONENTS ARE LAZY LOADED OUT OF DOZENS.
 * THIS WILL SEVERELY IMPACT INITIAL LOAD PERFORMANCE AND USER EXPERIENCE.
 ***********************************************************************/

/***********************************************************************
 * ⚠️ CRITICAL CODE ORGANIZATION ISSUE ⚠️
 * 
 * THIS FILE IS APPROACHING 1000 LINES AND MUST BE REFACTORED.
 * 
 * URGENT ACTION REQUIRED:
 * - BREAK ROUTES INTO SEPARATE FILES BY FEATURE AREA
 * - CREATE A DEDICATED ROUTING MODULE
 * - MOVE AUTH LOGIC TO DEDICATED AUTH MODULE
 * - EXTRACT LAYOUT COMPONENTS TO SEPARATE FILES
 * - ELIMINATE THE MASSIVE LIST OF IMPORTS AT THE TOP
 * 
 * THERE IS NO REASON FOR THE APP FILE TO CONTAIN ALL ROUTES AND
 * IMPORTS IN A SINGLE MASSIVE FILE. THIS HURTS MAINTAINABILITY.
 ***********************************************************************/

/***********************************************************************
 * ⚠️ SECURITY VULNERABILITY: EXPOSED SECRETS ⚠️
 * 
 * REVIEW ALL DIRECT import.meta.env USAGES FOR EXPOSED SECRETS
 * 
 * URGENT ACTION REQUIRED:
 * - AUDIT ALL ENVIRONMENT VARIABLES FOR SENSITIVE DATA
 * - ENSURE NO API KEYS OR SECRETS ARE EXPOSED IN CLIENT CODE
 * - MOVE ALL SECRETS TO SERVER-SIDE ENVIRONMENT
 * - IMPLEMENT PROPER SECRET ROTATION AND MANAGEMENT
 * - USE THE env.ts FILE TO CENTRALIZE AND CONTROL ACCESS
 * 
 * DIRECT USE OF import.meta.env CAN LEAD TO ACCIDENTAL EXPOSURE
 * OF SENSITIVE INFORMATION IN CLIENT-SIDE CODE.
 ***********************************************************************/

/***********************************************************************
 * ⚠️ UI RENDERING ISSUE: WHITE FLASH DURING ROTATION ⚠️
 * 
 * FIX THE WHITE BACKGROUND FLASH DURING DEVICE ROTATION
 * 
 * URGENT ACTION REQUIRED:
 * - SET BACKGROUND COLOR IN THE HTML/BODY ELEMENTS
 * - ENSURE DARK MODE STYLES ARE APPLIED BEFORE RENDERING
 * - ADD PERSISTENT BACKGROUND COLOR TO ROOT ELEMENT
 * - IMPLEMENT PROPER VIEWPORT META TAGS
 * - CONSIDER USING CSS VARIABLES FOR THEME COLORS
 * 
 * ADD TO index.html:
 * - Set background-color on html and body
 * - Add proper viewport meta tags
 * - Consider adding a splash screen for initial load
 ***********************************************************************/

// React
import React, { lazy, Suspense, useEffect } from "react";
// React Router
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";

// QUEUED FOR DELETION:
//   Helper component to redirect while preserving query parameters
const PreserveQueryParamsRedirect = ({ to }: { to: string }) => {
  const location = useLocation();
  // Preserve all query parameters by appending the search string to the destination
  return <Navigate to={`${to}${location.search}`} replace />;
};

/* Components */
// WebSocketManager is now provided by WebSocketProvider (WebSocketContext.tsx)
// ContestChatManager functionality is now provided by context providers
import { AchievementNotification } from "./components/achievements/AchievementNotification";
import { BackgroundEffects } from "./components/animated-background/BackgroundEffects";
import { BlinkResolver } from "./components/blinks/BlinkResolver";
import { GameDebugPanel } from "./components/debug/game/GameDebugPanel";
import { ServiceDebugPanel } from "./components/debug/ServiceDebugPanel";
import { UiDebugPanel } from "./components/debug/ui/UiDebugPanel";
import { EdgeToEdgeTicker } from "./components/layout/EdgeToEdgeTicker";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { ServerDownBanner } from "./components/layout/ServerDownBanner";
import { WalletBalanceTicker } from "./components/layout/WalletBalanceTicker";
import { InviteWelcomeModal } from "./components/modals/InviteWelcomeModal";
import { AdminRoute } from "./components/routes/AdminRoute";
import { AuthenticatedRoute } from "./components/routes/AuthenticatedRoute";
import { MaintenanceGuard } from "./components/routes/MaintenanceGuard";
import { SuperAdminRoute } from "./components/routes/SuperAdminRoute";
import LoadingFallback from "./components/shared/LoadingFallback";
import {
  toast,
  ToastContainer, ToastListener, ToastProvider
} from "./components/toast"; // really? soooooooooooo many!?

/* Contexts */
import { PrivyProvider, usePrivy, type PrivyClientConfig } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { AuthProvider } from "./contexts/AuthContext";
import { PrivyAuthProvider } from "./contexts/PrivyAuthContext";
import { SolanaConnectionProvider } from "./contexts/SolanaConnectionContext";
import { TokenDataProvider } from "./contexts/TokenDataContext";
import { TwitterAuthProvider } from "./contexts/TwitterAuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
/* Hooks */
import "jupiverse-kit/dist/index.css";
import { AffiliateSystemProvider } from "./hooks/useAffiliateSystem";
import { useAuth } from "./hooks/useAuth";
import { InviteSystemProvider } from "./hooks/useInviteSystem";
import { useScrollbarVisibility } from "./hooks/useScrollbarVisibility";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AiTesting } from "./pages/admin/AiTesting";
import ClientErrorsPage from "./pages/admin/ClientErrorsPage";
import { ConnectionDebugger } from "./pages/admin/ConnectionDebugger";
import { ContestImageBrowserPage } from "./pages/admin/ContestImageBrowserPage";
import IpBanManagementPage from "./pages/admin/ip-ban/IpBanManagementPage";
import LogForwarderDebug from "./pages/admin/LogForwarderDebug";
import { SkyDuelPage } from "./pages/admin/SkyDuelPage";
import { SystemReports } from "./pages/admin/SystemReports";
import VanityWalletManagementPage from "./pages/admin/VanityWalletManagementPage";
import WalletManagementPage from "./pages/admin/WalletManagementPage";
import WebSocketHub from "./pages/admin/WebSocketHub";
import { ReferralPage } from "./pages/authenticated/AffiliatePage";
import { ContestCreditsPage } from "./pages/authenticated/ContestCreditsPage";
import MyContestsPage from "./pages/authenticated/MyContestsPage";
import MyPortfoliosPage from "./pages/authenticated/MyPortfoliosPage";
import NotificationsPage from "./pages/authenticated/NotificationsPage";
import { TokenSelection } from "./pages/authenticated/PortfolioTokenSelectionPage";
import { PrivateProfilePage } from "./pages/authenticated/PrivateProfilePage";
import WalletPage from "./pages/authenticated/WalletPage";
import ContestChatExample from "./pages/examples/ContestChatExample";
import { ContestBrowser } from "./pages/public/contests/ContestBrowserPage";
import { ContestDetails } from "./pages/public/contests/ContestDetailPage";
import { ContestLobby } from "./pages/public/contests/ContestLobbyPage";
import { ContestResults } from "./pages/public/contests/ContestResultsPage";
import { VirtualAgentPage } from "./pages/public/game/VirtualAgent";
import { BannedIP } from "./pages/public/general/BannedIP";
import { BannedUser } from "./pages/public/general/BannedUser";
import { BlinksDemo } from "./pages/public/general/BlinksDemo";
import { Contact } from "./pages/public/general/Contact";
import { FAQ } from "./pages/public/general/FAQ";
import { HowItWorks } from "./pages/public/general/HowItWorks";
import { LandingPage } from "./pages/public/general/LandingPage";
import LoginPage from "./pages/public/general/LoginPage";
import { Maintenance } from "./pages/public/general/Maintenance";
import { NotFound } from "./pages/public/general/NotFound";
import { PublicProfile } from "./pages/public/general/PublicProfile";
import SolanaBlockchainDemo from "./pages/public/general/SolanaBlockchainDemo";
import { ContestPerformance } from "./pages/public/leaderboards/ContestPerformanceRankings";
import { DegenLevelPage } from "./pages/public/leaderboards/DegenLevelPage";
import { GlobalRankings } from "./pages/public/leaderboards/GlobalRankings";
import { LeaderboardLanding } from "./pages/public/leaderboards/LeaderboardLanding";
import { EnhancedTokensPage } from "./pages/public/tokens/EnhancedTokensPage";
import WebSocketAPIPage from "./pages/public/WebSocketAPIPage";
// import { TokenWhitelistPage } from "./pages/public/tokens/whitelist"; // Commented out 2025-04-05 - Page hidden
// Lazy LiquiditySimulatorPage
import AmmSim from "./pages/superadmin/AmmSim";
import ApiPlayground from "./pages/superadmin/ApiPlayground";
import CircuitBreakerPage from "./pages/superadmin/CircuitBreakerPage";
import { ControlPanelHub } from "./pages/superadmin/ControlPanelHub";
import ServiceCommandCenter from "./pages/superadmin/ServiceCommandCenter";
import { ServiceControlPage } from "./pages/superadmin/ServiceControlPage";
import { ServiceSwitchboard } from "./pages/superadmin/ServiceSwitchboard";
import { SuperAdminDashboard } from "./pages/superadmin/SuperAdminDashboard";
import { WalletMonitoring } from "./pages/superadmin/WalletMonitoring";
import { WssPlayground } from "./pages/superadmin/WssPlayground";
import { useStore } from "./store/useStore";
import "./styles/color-schemes.css";

/* eslint-disable no-unused-vars */
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { Adapter } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

// QUEUED FOR DELETION:
// Lazy AdminChatDashboard
const AdminChatDashboard = lazy(
  () => import("./pages/admin/AdminChatDashboard"),
);

// Lazy LiquiditySimulatorPage
const LiquiditySimulatorPage = lazy(
  () => import("./pages/admin/LiquiditySimulatorPage"),
);

// App entry
export const App: React.FC = () => {
  // Get the user from the store directly - DO NOT use useAuth() here
  //   This avoids circular dependencies since useAuth depends on wallet providers that aren't initialized yet
  //   [4-30-25: NEED TO RE-VERIFY THIS!]
  const { user } = useStore();
  
  // We'll get checkAuth from useAuth() inside the useEffect
  //   [4-30-25: NEED TO RE-VERIFY THIS!]

  // Role-based Solana RPC endpoint for use with the wallet provider.
  // This tiered RPC setup is important for our application.
  //     [4-30-25: Done! The RPC endpoint is now available at the ___ endpoint]
  //     [         Check if this is being used in the UnifiedWalletProvider configuration above]
  const solanaRpcEndpoint = `${window.location.origin}/api/solana-rpc${user?.is_admin || user?.is_superadmin ? '/admin' : user ? '' : '/public'}`;
  
  // Create wallet adapters for both Jupiter wallet and Solana wallet adapter
  const walletAdapters: Adapter[] = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter()
  ];
  
  // QUEUED FOR DELETION:
  // Create a component to set the global flag for our hooks to check
  const FlagSetter: React.FC = () => {
    useEffect(() => {
      if (typeof window !== 'undefined') {
        (window as any).__JUP_WALLET_PROVIDER_EXISTS = true;
      }
    }, []);
    return null;
  };
  
  // Configuration for UnifiedWalletProvider
  const uwkConfig = {
    autoConnect: false,
    env: import.meta.env.PROD ? 'mainnet-beta' as const : 'devnet' as const,
    metadata: {
      name: 'DegenDuel',
      description: 'Battle-tested onchain contest platform',
      url: window.location.origin,
      iconUrls: [`${window.location.origin}/favicon.ico`],
    },
    theme: 'dark' as const,
    // Pass our (role-based) DegenDuel RPC endpoint to the client wallet provider
    connectionConfig: {
      commitment: 'confirmed' as const,
      endpoint: solanaRpcEndpoint
    }
  };
  
  // Initialize scrollbar visibility
  useScrollbarVisibility();
  
  // Hooks (always at top level)
  const privy = usePrivy();
  const { checkAuth } = useAuth();

  // Effect to validate auth on startup
  //   [4-30-25: NEED TO RE-VERIFY THIS!]
  useEffect(() => {
    
    // Only run auth checks after all providers have properly initialized
    //   [4-30-25: NEED TO RE-VERIFY THIS!]
    
    // Always validate auth on startup, regardless of stored user state
    //   [4-30-25: NEED TO RE-VERIFY THIS!]

    // Validate auth on startup
    const validateAuth = async () => {
      console.log("[Auth] Validating authentication status on app startup");
      try {
        // Check auth
        checkAuth();
      } catch (error) {
        console.error("[Auth] Failed to validate authentication:", error);
        // If validation fails and we have a stored user, clear it
        if (user) {
          console.log("[Auth] Stored user found but validation failed, logging out");
          // Disconnect the wallet
          useStore.getState().disconnectWallet();
          // Clear the user from the store
          useStore.getState().setUser(null); // [4-30-25: ADDED]
          // Logout the user using the top-level instance
          privy.logout(); // Use the instance from the top level
          // Redirect to the login page
          window.location.href = "/login"; // [4-30-25: ADDED]
          // TODO: Add a toast notification to the user
          toast.error("Logged out."); // [4-30-25: ADDED]
          // (did i use the right toast function?)
        }
      }
    };

    // Run auth validation immediately upon page load
    validateAuth();//     [4-30-25: WHY??]
    // Set up regular auth checks 
    //   (1 minute in production, 30 seconds in development)
    //   [4-30-25: WHY??]
    const checkInterval = import.meta.env.PROD ? 60 * 1000 : 30 * 1000; // 1 minute in production, 30 seconds in development
    const authCheckInterval = setInterval(checkAuth, checkInterval);

    // Debounced handlers for visibility and online status
    let visibilityTimeout: NodeJS.Timeout;
    let onlineTimeout: NodeJS.Timeout;

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Clear any existing timeout
        clearTimeout(visibilityTimeout);
        // Wait 1 second before checking auth
        //   [4-30-25: WHY??]
        visibilityTimeout = setTimeout(checkAuth, 1000);
      }
    };

    /* Event listeners and handlers */
    
    // Handle online status
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        // Clear any existing timeout
        clearTimeout(onlineTimeout);
        // Wait 1 second before checking auth
        //   [4-30-25: WHY??]
        onlineTimeout = setTimeout(checkAuth, 1000);
      }
    };

    // Add event listeners for auth checks
    document.addEventListener("visibilitychange", handleVisibilityChange); // Handle visibility change
    window.addEventListener("online", handleOnlineStatus); // Handle online status

    // Cleanup
    return () => {
      clearInterval(authCheckInterval); // Stop regular auth checks
      clearTimeout(visibilityTimeout); // Clear visibility timeout
      clearTimeout(onlineTimeout); // Clear online timeout
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      ); // Remove visibility change listener
      window.removeEventListener("online", handleOnlineStatus); // Remove online status listener
    };
  }, [user, checkAuth, privy]); //     [4-30-25: Added privy to dependency array]

  // Privy configuration
  //   [4-30-25: The official DegenDuel RPC is now being used for Privy configuration!
  const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';
  const privyConfig: PrivyClientConfig = {
    // Login methods configuration
    loginMethods: [
//      'email',
      'wallet',
//      'google',
//      'twitter',
//      'sms',
      'passkey',
    ],

    // UI appearance configuration
    appearance: {
      theme: 'dark',
      accentColor: '#5865F2',
      showWalletLoginFirst: false, // Show all login options equally
      walletChainType: 'ethereum-and-solana', // Enable Solana wallets in UI
      // TODO: Can this be set to Solana only?
    },

    // Comprehensive embedded wallet configuration
    //   Reference: https://docs.privy.io/wallets/wallets/create/overview
    embeddedWallets: {
      // Create embedded wallets for users without existing wallets
      createOnLogin: 'users-without-wallets',
      // Allow users to recover wallets across devices
      requireUserPasswordOnCreate: true
    },

    // External wallets integration - this wires up Solana connectors to Privy
    // This is the fix for issue #4 - wire Solana connectors into Privy
    externalWallets: {
      solana: {
        // Use Privy's helper from @privy-io/react-auth/solana to set up connectors
        connectors: toSolanaWalletConnectors({
          // Specify that we don't want automatic connection
          shouldAutoConnect: false
        })
      }
    },

    // Social auth configuration (including Twitter)
    // URL handling is done automatically by auth context
    //   Note: WalletConnect metadata is configured in the wallet provider below
    //     This enables Solana integrations
    // Reference: https://docs.privy.io/wallets/connectors/setup/configuring-external-connector-chains#solana
    supportedChains: [
      {
        name: 'Solana',
        // Use the correct ID type (number) for the Chain interface
        id: 101, // Solana mainnet chain ID
        // Native currency info required by Chain type
        nativeCurrency: {
          name: 'Solana',
          symbol: 'SOL',
          decimals: 9
        },
        // Properly formatted RPC URLs according to Privy's Chain type
        rpcUrls: {
          default: {
            // Use the appropriate tier endpoint - based on user role
            http: [
              // This is for authenticated users
              `${window.location.origin}/api/solana-rpc`
            ]
          },
          public: {
            // Endpoint for public visitors with rate limiting
            http: [`${window.location.origin}/api/solana-rpc/public`]
          },
          admin: {
            // Endpoint for admin operations
            http: [`${window.location.origin}/api/solana-rpc/admin`]
          }
        }
      }
    ]
  };      
  
  // DegenDuel entry
  return (
    <Router>

      {/* The UnifiedWalletProvider replaces all three wallet providers with a single one */}
      {/* [4-30-25: NEED TO RE-VERIFY THIS!] */}
      <UnifiedWalletProvider 
        wallets={walletAdapters}
        config={uwkConfig}
      >

        {/* FlagSetter maintains global flag for backward compatibility */}
        {/* [4-30-25: NEED TO RE-VERIFY THIS!] */}
        <FlagSetter />
            
          {/* PrivyProvider provides authentication for the app */}
          <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>

            {/* PrivyAuthProvider provides authentication AND supports wallet custody AND (...))*/}
            <PrivyAuthProvider>

              {/* AuthProvider provides ??????????? */}
              <AuthProvider>

                {/* TwitterAuthProvider provides non-initial registration via Twitter authentication for the app */}
                <TwitterAuthProvider>
                  
                  {/* InviteSystemProvider provides ??????????? */}
                  <InviteSystemProvider>

                    {/* AffiliateSystemProvider provides ??????????? */}
                    <AffiliateSystemProvider>
                      
                      {/* WebSocketProvider must come BEFORE components that use it */}
                      <WebSocketProvider>
                        
                        {/* SolanaConnectionProvider provides throttled DegenDuel RPC connections based on user role */}
                        <SolanaConnectionProvider>
                          
                          {/* TokenDataProvider provides token data for the app */}
                          <TokenDataProvider>

                            {/* ToastProvider provides toast notifications for the app */}
                            <ToastProvider>

                              {/* The main content of the app */}
                              <div className="min-h-screen flex flex-col">

                                {/* ToastListener listens for toast notifications */}
                                <ToastListener />

                                {/* UiDebugPanel is a debugging tool for the UI */}
                                {user?.is_superadmin && <UiDebugPanel />}
                                {user?.is_superadmin && <ServiceDebugPanel />}
                                {user?.is_superadmin && <GameDebugPanel />}

                                {/* BackgroundEffects is a component that provides background effects for the app */}
                                <BackgroundEffects />

                                {/* Header is the main header of the app */}
                                <Header />

                                {/* EdgeToEdgeTicker is a component that provides a ticker for the app */}
                                <EdgeToEdgeTicker />

                                {/* WalletBalanceTicker is a component that provides a wallet balance for the app */}
                                {user && <WalletBalanceTicker isCompact={true} />}

                                {/* ServerDownBanner is a component that provides a banner for the app */}
                                <ServerDownBanner />

                                {/* The main content of the app */}
                                <main className="flex-1 pb-12">

                                  {/* The routes of the app */}
                                  <Routes>

                                    {/* The landing page of the app */}
                                    <Route path="/" element={<LandingPage />} />

                                    {/* The join page of the app */}
                                    <Route
                                      path="/join"
                                      element={<PreserveQueryParamsRedirect to="/" />}
                                    />

                                    {/* Redirect from any old path variations to the enhanced tokens page */}
                                    <Route
                                      path="/tokens/legacy"
                                      element={<PreserveQueryParamsRedirect to="/tokens" />}
                                    />
                                    <Route
                                      path="/contests"
                                      element={
                                        <MaintenanceGuard>
                                          <ContestBrowser />
                                        </MaintenanceGuard>
                                      }
                                    />
                                    <Route
                                      path="/contests/:id"
                                      element={
                                        <MaintenanceGuard>
                                          <ContestDetails />
                                        </MaintenanceGuard>
                                      }
                                    />
                                    <Route
                                      path="/contests/:id/live"
                                      element={
                                        <MaintenanceGuard>
                                          <ContestLobby />
                                        </MaintenanceGuard>
                                      }
                                    />
                                    <Route
                                      path="/contests/:id/results"
                                      element={
                                        <MaintenanceGuard>
                                          <ContestResults />
                                        </MaintenanceGuard>
                                      }
                                    />
                                    <Route
                                      path="/tokens"
                                      element={
                                        <MaintenanceGuard>
                                          <EnhancedTokensPage />
                                        </MaintenanceGuard>
                                      }
                                    />
                                    <Route
                                      path="/game/virtual-agent"
                                      element={
                                        <MaintenanceGuard>
                                          <VirtualAgentPage />
                                        </MaintenanceGuard>
                                      }
                                    />
                                    <Route
                                      path="/profile/:identifier"
                                      element={
                                        <MaintenanceGuard>
                                          <PublicProfile />
                                        </MaintenanceGuard>
                                      }
                                    />
                                    <Route 
                                      path="/login" 
                                      element={
                                        <MaintenanceGuard>
                                          <LoginPage />
                                        </MaintenanceGuard>
                                      } 
                                    />
                                    <Route path="/faq" element={<FAQ />} />
                                    <Route path="/how-it-works" element={<HowItWorks />} />
                                    <Route path="/contact" element={<Contact />} />
                                    <Route path="/blinks-demo" element={<BlinksDemo />} />
                                    <Route path="/solana-demo" element={<SolanaBlockchainDemo />} />
                                    <Route
                                      path="/leaderboards"
                                      element={<LeaderboardLanding />}
                                    />
                                    <Route 
                                      path="/leaderboard" 
                                      element={<DegenLevelPage />} 
                                    />
                                    <Route
                                      path="/rankings/performance"
                                      element={<ContestPerformance />}
                                    />

                                    <Route
                                      path="/admin/wallet-management"
                                      element={
                                        <AdminRoute>
                                          <WalletManagementPage />
                                        </AdminRoute>
                                      }
                                    />

                                    <Route
                                      path="/rankings/global"
                                      element={<GlobalRankings />}
                                    />
                                    <Route
                                      path="/me"
                                      element={
                                        <AuthenticatedRoute>
                                          <MaintenanceGuard>
                                            <PrivateProfilePage />
                                          </MaintenanceGuard>
                                        </AuthenticatedRoute>
                                      }
                                    />
                                    <Route
                                      path="/referrals"
                                      element={
                                        <AuthenticatedRoute>
                                          <MaintenanceGuard>
                                            <ReferralPage />
                                          </MaintenanceGuard>
                                        </AuthenticatedRoute>
                                      }
                                    />
                                    <Route
                                      path="/notifications"
                                      element={
                                        <AuthenticatedRoute>
                                          <MaintenanceGuard>
                                            <NotificationsPage />
                                          </MaintenanceGuard>
                                        </AuthenticatedRoute>
                                      }
                                    />
                                    <Route
                                      path="/my-contests"
                                      element={
                                        <AuthenticatedRoute>
                                          <MaintenanceGuard>
                                            <MyContestsPage />
                                          </MaintenanceGuard>
                                        </AuthenticatedRoute>
                                      }
                                    />
                                    <Route
                                      path="/my-portfolios"
                                      element={
                                        <AuthenticatedRoute>
                                          <MaintenanceGuard>
                                            <MyPortfoliosPage />
                                          </MaintenanceGuard>
                                        </AuthenticatedRoute>
                                      }
                                    />
                                    <Route
                                      path="/wallet"
                                      element={
                                        <AuthenticatedRoute>
                                          <MaintenanceGuard>
                                            <WalletPage />
                                          </MaintenanceGuard>
                                        </AuthenticatedRoute>
                                      }
                                    />
                                    <Route
                                      path="/contest-credits"
                                      element={
                                        <AuthenticatedRoute>
                                          <MaintenanceGuard>
                                            <ContestCreditsPage />
                                          </MaintenanceGuard>
                                        </AuthenticatedRoute>
                                      }
                                    />
                                    <Route
                                      path="/contests/:id/select-tokens"
                                      element={
                                        <AuthenticatedRoute>
                                          <MaintenanceGuard>
                                            <TokenSelection />
                                          </MaintenanceGuard>
                                        </AuthenticatedRoute>
                                      }
                                    />
                                    <Route
                                      path="/admin/skyduel"
                                      element={
                                        <AdminRoute>
                                          <Suspense fallback={<LoadingFallback variant="default" message="Loading SkyDuel..." />}>
                                            <SkyDuelPage />
                                          </Suspense>
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/admin/system-reports"
                                      element={
                                        <AdminRoute>
                                          <SystemReports />
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/admin/client-errors"
                                      element={
                                        <AdminRoute>
                                          <ClientErrorsPage />
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/admin"
                                      element={
                                        <AdminRoute>
                                          <AdminDashboard />
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/admin/ip-ban"
                                      element={
                                        <AdminRoute>
                                          <IpBanManagementPage />
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/admin/vanity-wallets"
                                      element={
                                        <AdminRoute>
                                          <VanityWalletManagementPage />
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/admin/contest-management/regenerate-image/:contestId"
                                      element={
                                        <AdminRoute>
                                          <div>Contest Image Generator Page</div>
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/admin/contest-image-browser"
                                      element={
                                        <AdminRoute>
                                          <ContestImageBrowserPage />
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/admin/chat-dashboard"
                                      element={
                                        <AdminRoute>
                                          <Suspense fallback={<LoadingFallback variant="default" message="Loading Chat Dashboard..." />}>
                                            <AdminChatDashboard />
                                          </Suspense>
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/connection-debugger"
                                      element={
                                        <AdminRoute>
                                          <ConnectionDebugger />
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/websocket-hub"
                                      element={
                                        <AdminRoute>
                                          <Suspense fallback={<LoadingFallback variant="default" message="Loading WebSocket Hub..." />}>
                                            <WebSocketHub />
                                          </Suspense>
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/superadmin"
                                      element={
                                        <SuperAdminRoute>
                                          <SuperAdminDashboard />
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/superadmin/wallet-monitoring"
                                      element={
                                        <SuperAdminRoute>
                                          <WalletMonitoring />
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/superadmin/control-hub"
                                      element={
                                        <SuperAdminRoute>
                                          <ControlPanelHub />
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/superadmin/chat-dashboard"
                                      element={
                                        <SuperAdminRoute>
                                          <Suspense fallback={<LoadingFallback variant="full" message="Loading SuperAdmin Chat Dashboard..." />}>
                                            <AdminChatDashboard />
                                          </Suspense>
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/superadmin/services"
                                      element={
                                        <SuperAdminRoute>
                                          <ServiceControlPage />
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/superadmin/switchboard"
                                      element={
                                        <SuperAdminRoute>
                                          <ServiceSwitchboard />
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/superadmin/circuit-breaker"
                                      element={
                                        <SuperAdminRoute>
                                          <CircuitBreakerPage />
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/superadmin/service-command-center"
                                      element={
                                        <SuperAdminRoute>
                                          <ServiceCommandCenter />
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/superadmin/websocket-monitor"
                                      element={
                                        <Navigate
                                          to="/superadmin/service-command-center"
                                          replace
                                        />
                                      }
                                    />
                                    <Route
                                      path="/api-playground"
                                      element={
                                        <SuperAdminRoute>
                                          <ApiPlayground />
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/wss-playground"
                                      element={
                                        <SuperAdminRoute>
                                          <WssPlayground />
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/admin/ai-testing"
                                      element={
                                        <AdminRoute>
                                          <Suspense fallback={<LoadingFallback variant="default" message="Loading AI Testing..." />}>
                                            <AiTesting />
                                          </Suspense>
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/admin/wallet-monitoring"
                                      element={
                                        <AdminRoute>
                                          <Suspense fallback={<LoadingFallback variant="default" message="Loading Wallet Monitoring..." />}>
                                            <WalletMonitoring />
                                          </Suspense>
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/admin/liq-sim"
                                      element={
                                        <AdminRoute>
                                          <Suspense fallback={<LoadingFallback variant="default" message="Loading Liquidity Simulator..." />}>
                                            <LiquiditySimulatorPage />
                                          </Suspense>
                                        </AdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/websocket-test"
                                      element={
                                        <SuperAdminRoute>
                                          <Navigate to="/connection-debugger" replace />
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/websocket-dashboard"
                                      element={
                                        <SuperAdminRoute>
                                          <Navigate to="/connection-debugger" replace />
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/amm-sim"
                                      element={
                                        <SuperAdminRoute>
                                          <AmmSim />
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route
                                      path="/superadmin/log-forwarder"
                                      element={
                                        <SuperAdminRoute>
                                          <LogForwarderDebug />
                                        </SuperAdminRoute>
                                      }
                                    />
                                    <Route path="/blinks/*" element={<BlinkResolver />} />
                                    <Route path="/websocket-api" element={<MaintenanceGuard><WebSocketAPIPage /></MaintenanceGuard>} />
                                    <Route path="*" element={<NotFound />} />
                                    <Route path="/banned" element={<BannedUser />} />
                                    <Route path="/banned-ip" element={<BannedIP />} />
                                    <Route path="/maintenance" element={<Maintenance />} />
                                    <Route path="/examples/contest-chat" element={
                                      <Suspense fallback={<LoadingFallback variant="minimal" message="Loading Example..." />}>
                                        <ContestChatExample />
                                      </Suspense>
                                    } />
                                  </Routes>
                                </main>

                              {/* The footer */}
                              {/* [4-30-25: NOTE: WE NEED FOOTER 2.0!!!] */}
                              <Footer />


                              {/* XXX-factor?! */}

                              {/* The achievement notification of the app */}
                              {/* [4-30-25: ??????] */}
                              <AchievementNotification />

                              {/* The invite welcome modal of the app */}
                              <InviteWelcomeModal />

                              {/* The blink resolver of the app */}
                              <BlinkResolver />
                          
                              {/* The toast container of the app */}
                              <ToastContainer />

                            </div>
                          </ToastProvider>
                        </TokenDataProvider>
                      </SolanaConnectionProvider>
                    </WebSocketProvider>
                  </AffiliateSystemProvider>
                </InviteSystemProvider>
              </TwitterAuthProvider>
            </AuthProvider>
          </PrivyAuthProvider>
        </PrivyProvider>
      </UnifiedWalletProvider>
    </Router>
  );
};
