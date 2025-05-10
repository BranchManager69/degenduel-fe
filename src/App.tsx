// src/App.tsx

/**
 * Unified Auth Implementation - DegenDuel Frontend
 * 
 * @description This file contains the App component with the new unified authentication system.
 * It removes the nested auth providers and replaces them with a single UnifiedAuthProvider.
 * 
 * @author BranchManager69
 * @version 2.0.1
 * @created 2025-05-05
 * @updated 2025-05-08
 */

// React
import React, { createContext, lazy, Suspense, useContext, useEffect, useMemo, useState } from "react";
// React Router
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";

// Auth providers
// Privy
import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
//import { toEthereumWalletConnectors } from "@privy-io/react-auth/ethereum";
// Unified Auth Contexts
import { UnifiedAuthProvider } from "./contexts/UnifiedAuthContext";
import { UnifiedWebSocketProvider } from "./contexts/UnifiedWebSocketContext";

// NEW: @solana/kit related imports
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'; // Corrected: Use SolanaRpcApi from @solana/rpc
import { createDegenDuelRpcClient } from "./lib/solana/rpcClient"; // Our custom RPC client factory

// Wallet providers
// We will remove WalletName and Commitment if they are confirmed to be unused after this change.

// Other providers of dubious quality:
import { ToastContainer, ToastListener, ToastProvider } from "./components/toast";
import { TokenDataProvider } from "./contexts/TokenDataContext";
import { AffiliateSystemProvider } from "./hooks/social/legacy/useAffiliateSystem";
import { InviteSystemProvider } from "./hooks/social/legacy/useInviteSystem";

// Components
// Helper component to redirect while preserving query parameters
const PreserveQueryParamsRedirect = ({ to }: { to: string }) => {
  const location = useLocation();
  // Preserve all query parameters by appending the search string to the destination
  return <Navigate to={`${to}${location.search}`} replace />;
};

import { AchievementNotification } from "./components/achievements/AchievementNotification";
import { BackgroundEffects } from "./components/animated-background/BackgroundEffects";
import { BackgroundEffectsBoundary } from "./components/animated-background/BackgroundEffectsBoundary";
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
import { Terminal } from "./components/terminal/Terminal";

// Wallet adapter styles (if this is the old wallet adapter, we removed it)
import "@solana/wallet-adapter-react-ui/styles.css";
// General styles
import "./styles/color-schemes.css";

// Hooks and utils
import { useMigratedAuth } from "./hooks/auth/useMigratedAuth";
import { useScrollbarVisibility } from "./hooks/ui/useScrollbarVisibility";

// Route components
// Admin routes
// import { AdminDashboard } from "./pages/admin/AdminDashboard"; // Will be lazy
// import { AiTesting } from "./pages/admin/AiTesting"; // Now a lazy const
// import ClientErrorsPage from "./pages/admin/ClientErrorsPage"; // Will be lazy
// import { ConnectionDebugger } from "./pages/admin/ConnectionDebugger"; // Will be lazy
// import { ContestImageBrowserPage } from "./pages/admin/ContestImageBrowserPage"; // Will be lazy
// import IpBanManagementPage from "./pages/admin/ip-ban/IpBanManagementPage"; // Will be lazy
// import { SkyDuelPage } from "./pages/admin/SkyDuelPage"; // Now a lazy const
// import { SystemReports } from "./pages/admin/SystemReports"; // Will be lazy
// import VanityWalletManagementPage from "./pages/admin/VanityWalletManagementPage"; // Will be lazy
// import WalletManagementPage from "./pages/admin/WalletManagementPage"; // Will be lazy
// import WebSocketHub from "./pages/admin/WebSocketHub"; // Now a lazy const

// Authenticated routes
// import { ReferralPage } from "./pages/authenticated/AffiliatePage"; // Will be lazy
// import { ContestCreditsPage } from "./pages/authenticated/ContestCreditsPage"; // Will be lazy
// import { CreateContestPage } from "./pages/authenticated/CreateContestPage"; // Will be lazy
// import MyContestsPage from "./pages/authenticated/MyContestsPage"; // Will be lazy
// import MyPortfoliosPage from "./pages/authenticated/MyPortfoliosPage"; // Will be lazy
// import NotificationsPage from "./pages/authenticated/NotificationsPage"; // Will be lazy
// import { TokenSelection } from "./pages/authenticated/PortfolioTokenSelectionPage"; // Will be lazy
// import { PrivateProfilePage } from "./pages/authenticated/PrivateProfilePage"; // Will be lazy
// import WalletPage from "./pages/authenticated/WalletPage"; // Will be lazy

// Example routes
// import ContestChatExample from "./pages/examples/ContestChatExample"; // Will be lazy

// Public routes
// import { ContestBrowser } from "./pages/public/contests/ContestBrowserPage"; // Will be lazy
// import { ContestDetails } from "./pages/public/contests/ContestDetailPage"; // Will be lazy
// import { ContestLobby } from "./pages/public/contests/ContestLobbyPage"; // Will be lazy
// import { ContestResults } from "./pages/public/contests/ContestResultsPage"; // Will be lazy
// import ComingSoonPage from './pages/public/general/ComingSoonPage'; // Will be lazy
// import { Contact } from "./pages/public/general/Contact"; // Will be lazy
// import { FAQ } from "./pages/public/general/FAQ"; // Will be lazy
// import { HowItWorks } from "./pages/public/general/HowItWorks"; // Will be lazy
// import { LandingPage } from "./pages/public/general/LandingPage"; // This is the main entry, not lazy loaded here
// import LoginPage from "./pages/public/general/LoginPage"; // Will be lazy
// import { Maintenance } from "./pages/public/general/Maintenance"; // Will be lazy
// import { NotFound } from "./pages/public/general/NotFound"; // Will be lazy
// import { PublicProfile } from "./pages/public/general/PublicProfile"; // Will be lazy
// import { BannedIP } from "./pages/public/general/BannedIP"; // Will be lazy
// import { BannedUser } from "./pages/public/general/BannedUser"; // Will be lazy
// import { BlinksDemo } from "./pages/public/general/BlinksDemo"; // Will be lazy
// import SolanaBlockchainDemo from "./pages/public/general/SolanaBlockchainDemo"; // Will be lazy
// import { VirtualAgentPage } from "./pages/public/game/VirtualAgent"; // Will be lazy

// Leaderboard routes
// import { ContestPerformance } from "./pages/public/leaderboards/ContestPerformanceRankings"; // Will be lazy
// import { DegenLevelPage } from "./pages/public/leaderboards/DegenLevelPage"; // Will be lazy
// import { GlobalRankings } from "./pages/public/leaderboards/GlobalRankings"; // Will be lazy
// import { LeaderboardLanding } from "./pages/public/leaderboards/LeaderboardLanding"; // Will be lazy

// Token routes
// import { TokensPage } from "./pages/public/tokens/TokensPage"; // Will be lazy

// API routes
// import WebSocketAPIPage from "./pages/public/WebSocketAPIPage"; // Will be lazy

// Superadmin routes
// import AmmSim from "./pages/superadmin/AmmSim"; // Will be lazy
// import ApiPlayground from "./pages/superadmin/ApiPlayground"; // Will be lazy
// import CircuitBreakerPage from "./pages/superadmin/CircuitBreakerPage"; // Will be lazy
// import { ControlPanelHub } from "./pages/superadmin/ControlPanelHub"; // Will be lazy
// import ServiceCommandCenter from "./pages/superadmin/ServiceCommandCenter"; // Will be lazy
// import { ServiceControlPage } from "./pages/superadmin/ServiceControlPage"; // Will be lazy
// import { ServiceSwitchboard } from "./pages/superadmin/ServiceSwitchboard"; // Will be lazy
// import { SuperAdminDashboard } from "./pages/superadmin/SuperAdminDashboard"; // Will be lazy
// import { WalletMonitoring } from "./pages/superadmin/WalletMonitoring"; // Will be lazy for superadmin route
// import { WssPlayground } from "./pages/superadmin/WssPlayground"; // Will be lazy

// Get Privy app ID
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';
console.log('[DEBUG][App.tsx] PRIVY_APP_ID:', PRIVY_APP_ID);

// Config
// Prelaunch mode
import { config, PRELAUNCH_BYPASS_KEY, PRELAUNCH_MODE } from './config/config';
import { LandingPage } from "./pages/public/general/LandingPage";

// Lazy loaded components

// Decryption Timer - No longer used directly in App.tsx, Terminal handles its own
// const DecryptionTimer = lazy(
//   () => import("./components/layout/DecryptionTimer"),
// );

// Admin Chat Dashboard
const AdminChatDashboard = lazy(() => import('./pages/admin/AdminChatDashboard'));

// Liquidity Simulator Page
const LiquiditySimulatorPage = lazy(() => import("./pages/admin/LiquiditySimulatorPage"));

// Superadmin routes lazy loaded
const AmmSim = lazy(() => import('./pages/superadmin/AmmSim'));
const ApiPlayground = lazy(() => import('./pages/superadmin/ApiPlayground'));
const CircuitBreakerPage = lazy(() => import('./pages/superadmin/CircuitBreakerPage'));
const ControlPanelHub = lazy(() => import('./pages/superadmin/ControlPanelHub').then(module => ({ default: module.ControlPanelHub })));
const ServiceCommandCenter = lazy(() => import('./pages/superadmin/ServiceCommandCenter'));
const ServiceControlPage = lazy(() => import('./pages/superadmin/ServiceControlPage').then(module => ({ default: module.ServiceControlPage })));
const ServiceSwitchboard = lazy(() => import('./pages/superadmin/ServiceSwitchboard').then(module => ({ default: module.ServiceSwitchboard })));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard').then(module => ({ default: module.SuperAdminDashboard })));
const WalletMonitoring = lazy(() => import('./pages/superadmin/WalletMonitoring').then(module => ({ default: module.WalletMonitoring })));
const WssPlayground = lazy(() => import('./pages/superadmin/WssPlayground').then(module => ({ default: module.WssPlayground })));
const LogForwarderDebugLazy = lazy(() => import('./pages/admin/LogForwarderDebug')); // Renamed to avoid conflict if original is kept for some reason

// Admin routes lazy loaded
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const AiTesting = lazy(() => import('./pages/admin/AiTesting').then(module => ({ default: module.AiTesting })));
const ClientErrorsPage = lazy(() => import('./pages/admin/ClientErrorsPage'));
const ConnectionDebugger = lazy(() => import('./pages/admin/ConnectionDebugger').then(module => ({ default: module.ConnectionDebugger })));
const ContestImageBrowserPage = lazy(() => import('./pages/admin/ContestImageBrowserPage').then(module => ({ default: module.ContestImageBrowserPage })));
const IpBanManagementPage = lazy(() => import('./pages/admin/ip-ban/IpBanManagementPage'));
const SkyDuelPage = lazy(() => import('./pages/admin/SkyDuelPage').then(module => ({ default: module.SkyDuelPage })));
const SystemReports = lazy(() => import('./pages/admin/SystemReports').then(module => ({ default: module.SystemReports })));
const VanityWalletManagementPage = lazy(() => import('./pages/admin/VanityWalletManagementPage'));
const WalletManagementPage = lazy(() => import('./pages/admin/WalletManagementPage'));
const WebSocketHub = lazy(() => import('./pages/admin/WebSocketHub'));

// Authenticated routes lazy loaded
const ReferralPage = lazy(() => import('./pages/authenticated/AffiliatePage').then(module => ({ default: module.ReferralPage })));
const ContestCreditsPage = lazy(() => import('./pages/authenticated/ContestCreditsPage').then(module => ({ default: module.ContestCreditsPage })));
const CreateContestPage = lazy(() => import('./pages/authenticated/CreateContestPage').then(module => ({ default: module.CreateContestPage })));
const MyContestsPage = lazy(() => import('./pages/authenticated/MyContestsPage'));
const MyPortfoliosPage = lazy(() => import('./pages/authenticated/MyPortfoliosPage'));
const NotificationsPage = lazy(() => import('./pages/authenticated/NotificationsPage'));
const TokenSelection = lazy(() => import('./pages/authenticated/PortfolioTokenSelectionPage').then(module => ({ default: module.TokenSelection })));
const PrivateProfilePage = lazy(() => import('./pages/authenticated/PrivateProfilePage').then(module => ({ default: module.PrivateProfilePage })));
const WalletPage = lazy(() => import('./pages/authenticated/WalletPage'));

// Example routes lazy loaded
const ContestChatExample = lazy(() => import('./pages/examples/ContestChatExample'));

// Public routes lazy loaded
const ContestBrowser = lazy(() => import('./pages/public/contests/ContestBrowserPage').then(module => ({ default: module.ContestBrowser })));
const ContestDetails = lazy(() => import('./pages/public/contests/ContestDetailPage').then(module => ({ default: module.ContestDetails })));
const ContestLobby = lazy(() => import('./pages/public/contests/ContestLobbyPage').then(module => ({ default: module.ContestLobby })));
const ContestResults = lazy(() => import('./pages/public/contests/ContestResultsPage').then(module => ({ default: module.ContestResults })));
const ComingSoonPage = lazy(() => import('./pages/public/general/ComingSoonPage'));
const Contact = lazy(() => import('./pages/public/general/Contact').then(module => ({ default: module.Contact })));
const FAQ = lazy(() => import('./pages/public/general/FAQ').then(module => ({ default: module.FAQ })));
const HowItWorks = lazy(() => import('./pages/public/general/HowItWorks').then(module => ({ default: module.HowItWorks })));
const LoginPage = lazy(() => import('./pages/public/general/LoginPage'));
const Maintenance = lazy(() => import('./pages/public/general/Maintenance').then(module => ({ default: module.Maintenance })));
const NotFound = lazy(() => import('./pages/public/general/NotFound').then(module => ({ default: module.NotFound })));
const PublicProfile = lazy(() => import('./pages/public/general/PublicProfile').then(module => ({ default: module.PublicProfile })));
const BannedIP = lazy(() => import('./pages/public/general/BannedIP').then(module => ({ default: module.BannedIP })));
const BannedUser = lazy(() => import('./pages/public/general/BannedUser').then(module => ({ default: module.BannedUser })));
const BlinksDemo = lazy(() => import('./pages/public/general/BlinksDemo').then(module => ({ default: module.BlinksDemo })));
const SolanaBlockchainDemo = lazy(() => import('./pages/public/general/SolanaBlockchainDemo'));
const VirtualAgentPage = lazy(() => import('./pages/public/game/VirtualAgent').then(module => ({ default: module.VirtualAgentPage })));
const ContestPerformance = lazy(() => import('./pages/public/leaderboards/ContestPerformanceRankings').then(module => ({ default: module.ContestPerformance })));
const DegenLevelPage = lazy(() => import('./pages/public/leaderboards/DegenLevelPage').then(module => ({ default: module.DegenLevelPage })));
const GlobalRankings = lazy(() => import('./pages/public/leaderboards/GlobalRankings').then(module => ({ default: module.GlobalRankings })));
const LeaderboardLanding = lazy(() => import('./pages/public/leaderboards/LeaderboardLanding').then(module => ({ default: module.LeaderboardLanding })));
const TokensPage = lazy(() => import('./pages/public/tokens/TokensPage').then(module => ({ default: module.TokensPage })));
const WebSocketAPIPage = lazy(() => import('./pages/public/WebSocketAPIPage'));

export interface RpcContextType {
  rpcClient: Rpc<SolanaRpcApi> | null;
  endpoint: string;
}
// RpcContext for custom DegenDuel JWT-aware RPC client
export const RpcContext = createContext<RpcContextType | null>(null);
export const useDegenDuelRpc = () => {
  const context = useContext(RpcContext);
  if (!context) throw new Error("useDegenDuelRpc must be used within an RpcProvider");
  return context;
};

// App entry
export const App: React.FC = () => {
  useScrollbarVisibility();
  
  // Prelaunch Mode uses values from config/config.ts now
  const searchParams = new URLSearchParams(window.location.search);
  
  /* PRELAUNCH BYPASS */
  // Log the expected bypass key for debugging
  console.log('[App.tsx] Expected PRELAUNCH_BYPASS_KEY:', PRELAUNCH_BYPASS_KEY);
  // Log the received bypass key from URL for debugging
  console.log('[App.tsx] Received bypass from URL:', searchParams.get('bypass'));

  const hasAdminBypass = searchParams.get('bypass') === PRELAUNCH_BYPASS_KEY;
  const showComingSoon = PRELAUNCH_MODE && !hasAdminBypass;

  // Debug logging
  if (PRELAUNCH_MODE) {
    console.log(`[App.tsx] Prelaunch Mode Active. Expected Key: ${PRELAUNCH_BYPASS_KEY}, Received Key: ${searchParams.get('bypass')}, Bypass active: ${hasAdminBypass}. Showing Coming Soon: ${showComingSoon}`);
  }

  // Return the app or Coming Soon page based on the bypass status
  return (
    <Router> 
      {showComingSoon ? (
        // App access is blocked, so we show Coming Soon
        <ComingSoonPage />
      ) : (
        // App access is granted, so we can wrap the app in the providers and display
        <UnifiedAuthProvider>
          <AppProvidersAndContent />
        </UnifiedAuthProvider>
      )}
    </Router>
  );
};

// Component to house providers that depend on auth state and manage dynamic DegenDuel RPC client
const AppProvidersAndContent: React.FC = () => {
  const { user } = useMigratedAuth();
  const ddJwt = useMemo(() => (user as any)?.ddJwt || null, [user]);
  const [currentRpcEndpoint, setCurrentRpcEndpoint] = useState(() => `${window.location.origin}/api/solana-rpc/public`);

  useEffect(() => {
    if (ddJwt) {
      setCurrentRpcEndpoint(`${window.location.origin}/api/solana-rpc`);
    } else {
      setCurrentRpcEndpoint(`${window.location.origin}/api/solana-rpc/public`);
    }
  }, [ddJwt]);

  const rpcClientV2 = useMemo(() => {
    return createDegenDuelRpcClient(currentRpcEndpoint, ddJwt);
  }, [currentRpcEndpoint, ddJwt]);

  const privyConfig: PrivyClientConfig = useMemo(() => ({
    loginMethods: ["wallet", "email", "sms", "google", "twitter", "discord", "github", "apple", "telegram", "passkey"],
    appearance: {
      theme: 'dark',
      accentColor: '#5a2b66',
      showWalletLoginFirst: false,
      walletChainType: 'solana-only',
    },
    embeddedWallets: {
      solana: { createOnLogin: 'users-without-wallets' },
    },
    externalWallets: {
      solana: { connectors: toSolanaWalletConnectors({ shouldAutoConnect: false }) }
    },
    supportedChains: [
      {
        name: 'Solana',
        id: 101,
        nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
        rpcUrls: {
          default: { http: [`${window.location.origin}/api/solana-rpc`] },
          public: { http: [`${window.location.origin}/api/solana-rpc`] },
          admin: { http: [`${window.location.origin}/api/solana-rpc`] }
        }
      }
    ]
  }), []); // Stable config

  return (
    <RpcContext.Provider value={{ rpcClient: rpcClientV2, endpoint: currentRpcEndpoint }}>
      <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
        <InviteSystemProvider>
          <AffiliateSystemProvider>
            <UnifiedWebSocketProvider>
              <TokenDataProvider>
                <ToastProvider>
                  <AppContent />
                </ToastProvider>
              </TokenDataProvider>
            </UnifiedWebSocketProvider>
          </AffiliateSystemProvider>
        </InviteSystemProvider>
      </PrivyProvider>
    </RpcContext.Provider>
  );
};

// This component can safely use auth hooks because it renders after all providers
const AppContent: React.FC = () => {
  const { user: authUser } = useMigratedAuth(); 
  // const location = useLocation(); // No longer used here as Terminal always renders

  return (
    <div className="min-h-screen flex flex-col">
      <ToastListener />
      
      {/* Debug Panels */}
      {authUser && (authUser as any).is_superadmin && <UiDebugPanel />}
      {authUser && (authUser as any).is_superadmin && <ServiceDebugPanel />}
      {authUser && (authUser as any).is_superadmin && <GameDebugPanel />}
      
      <BackgroundEffectsBoundary>
        <BackgroundEffects />
      </BackgroundEffectsBoundary>

      <Header />
      <EdgeToEdgeTicker />
      {authUser && <WalletBalanceTicker isCompact={true} />}
      <ServerDownBanner />
      
      {/* Loose DecryptionTimer instance removed */}
      {/* 
      {isLandingPage ? (
        null 
      ) : (
        <DecryptionTimer /> 
      )}
      */}

      <main className="flex-1 pb-12">
        <Routes>
          {/* Landing and Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/join" element={<PreserveQueryParamsRedirect to="/" />} />
          <Route path="/tokens/legacy" element={<PreserveQueryParamsRedirect to="/tokens" />} />
          
          {/* Contest Routes */}
          <Route path="/contests" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><ContestBrowser /></Suspense></MaintenanceGuard>} />
          <Route path="/contests/:id" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><ContestDetails /></Suspense></MaintenanceGuard>} />
          <Route path="/contests/:id/live" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><ContestLobby /></Suspense></MaintenanceGuard>} />
          <Route path="/contests/:id/results" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><ContestResults /></Suspense></MaintenanceGuard>} />
          
          {/* Token Routes */}
          <Route path="/tokens" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><TokensPage /></Suspense></MaintenanceGuard>} />
          
          {/* Game Routes */}
          <Route path="/game/virtual-agent" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><VirtualAgentPage /></Suspense></MaintenanceGuard>} />
          
          {/* Profile Routes */}
          <Route path="/profile/:identifier" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><PublicProfile /></Suspense></MaintenanceGuard>} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense></MaintenanceGuard>} />
          
          {/* Static Pages */}
          <Route path="/faq" element={<Suspense fallback={<LoadingFallback />}><FAQ /></Suspense>} />
          <Route path="/how-it-works" element={<Suspense fallback={<LoadingFallback />}><HowItWorks /></Suspense>} />
          <Route path="/contact" element={<Suspense fallback={<LoadingFallback />}><Contact /></Suspense>} />
          <Route path="/blinks-demo" element={<Suspense fallback={<LoadingFallback />}><BlinksDemo /></Suspense>} />
          <Route path="/solana-demo" element={<Suspense fallback={<LoadingFallback />}><SolanaBlockchainDemo /></Suspense>} />
          
          {/* Leaderboard Routes */}
          <Route path="/leaderboards" element={<Suspense fallback={<LoadingFallback />}><LeaderboardLanding /></Suspense>} />
          <Route path="/leaderboard" element={<Suspense fallback={<LoadingFallback />}><DegenLevelPage /></Suspense>} />
          <Route path="/rankings/performance" element={<Suspense fallback={<LoadingFallback />}><ContestPerformance /></Suspense>} />
          <Route path="/rankings/global" element={<Suspense fallback={<LoadingFallback />}><GlobalRankings /></Suspense>} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/wallet-management"
            element={<AdminRoute><Suspense fallback={<LoadingFallback />}><WalletManagementPage /></Suspense></AdminRoute>}
          />
          
          {/* Authenticated Routes */}
          <Route
            path="/me"
            element={<AuthenticatedRoute><MaintenanceGuard><Suspense fallback={<LoadingFallback />}><PrivateProfilePage /></Suspense></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/referrals"
            element={<AuthenticatedRoute><MaintenanceGuard><Suspense fallback={<LoadingFallback />}><ReferralPage /></Suspense></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/notifications"
            element={<AuthenticatedRoute><MaintenanceGuard><Suspense fallback={<LoadingFallback />}><NotificationsPage /></Suspense></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/my-contests"
            element={<AuthenticatedRoute><MaintenanceGuard><Suspense fallback={<LoadingFallback />}><MyContestsPage /></Suspense></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/my-portfolios"
            element={<AuthenticatedRoute><MaintenanceGuard><Suspense fallback={<LoadingFallback />}><MyPortfoliosPage /></Suspense></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/wallet"
            element={<AuthenticatedRoute><MaintenanceGuard><Suspense fallback={<LoadingFallback />}><WalletPage /></Suspense></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/contest-credits"
            element={<AuthenticatedRoute><MaintenanceGuard><Suspense fallback={<LoadingFallback />}><ContestCreditsPage /></Suspense></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/contests/create"
            element={<AuthenticatedRoute><MaintenanceGuard><Suspense fallback={<LoadingFallback />}><CreateContestPage /></Suspense></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/contests/:id/select-tokens"
            element={<AuthenticatedRoute><MaintenanceGuard><Suspense fallback={<LoadingFallback />}><TokenSelection /></Suspense></MaintenanceGuard></AuthenticatedRoute>}
          />
          
          {/* Admin Dashboard Routes */}
          <Route path="/admin/skyduel" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading SkyDuel..." />}><SkyDuelPage /></Suspense></AdminRoute>} />
          <Route path="/admin/system-reports" element={<AdminRoute><Suspense fallback={<LoadingFallback />}><SystemReports /></Suspense></AdminRoute>} />
          <Route path="/admin/client-errors" element={<AdminRoute><Suspense fallback={<LoadingFallback />}><ClientErrorsPage /></Suspense></AdminRoute>} />
          <Route path="/admin" element={<AdminRoute><Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense></AdminRoute>} />
          <Route path="/admin/ip-ban" element={<AdminRoute><Suspense fallback={<LoadingFallback />}><IpBanManagementPage /></Suspense></AdminRoute>} />
          <Route path="/admin/vanity-wallets" element={<AdminRoute><Suspense fallback={<LoadingFallback />}><VanityWalletManagementPage /></Suspense></AdminRoute>} />
          <Route path="/admin/contest-management/regenerate-image/:contestId" element={<AdminRoute><div>Contest Image Generator Page</div></AdminRoute>} />
          <Route path="/admin/contest-image-browser" element={<AdminRoute><Suspense fallback={<LoadingFallback />}><ContestImageBrowserPage /></Suspense></AdminRoute>} />
          <Route path="/admin/chat-dashboard" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading Chat Dashboard..." />}><AdminChatDashboard /></Suspense></AdminRoute>} />
          <Route path="/connection-debugger" element={<AdminRoute><Suspense fallback={<LoadingFallback />}><ConnectionDebugger /></Suspense></AdminRoute>} />
          <Route path="/websocket-hub" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading WebSocket Hub..." />}><WebSocketHub /></Suspense></AdminRoute>} />
          
          {/* SuperAdmin Routes */}
          <Route path="/superadmin" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback />}><SuperAdminDashboard /></Suspense></SuperAdminRoute>} />
          <Route path="/superadmin/wallet-monitoring" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback />}><WalletMonitoring /></Suspense></SuperAdminRoute>} />
          <Route path="/superadmin/control-hub" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback />}><ControlPanelHub /></Suspense></SuperAdminRoute>} />
          <Route path="/superadmin/chat-dashboard" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback variant="full" message="Loading SuperAdmin Chat Dashboard..." />}><AdminChatDashboard /></Suspense></SuperAdminRoute>} />
          <Route path="/superadmin/services" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback />}><ServiceControlPage /></Suspense></SuperAdminRoute>} />
          <Route path="/superadmin/switchboard" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback />}><ServiceSwitchboard /></Suspense></SuperAdminRoute>} />
          <Route path="/superadmin/circuit-breaker" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback />}><CircuitBreakerPage /></Suspense></SuperAdminRoute>} />
          <Route path="/superadmin/service-command-center" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback />}><ServiceCommandCenter /></Suspense></SuperAdminRoute>} />
          <Route path="/superadmin/websocket-monitor" element={<SuperAdminRoute><Navigate to="/superadmin/service-command-center" replace /></SuperAdminRoute>} />
          <Route path="/api-playground" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback />}><ApiPlayground /></Suspense></SuperAdminRoute>} />
          <Route path="/wss-playground" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback />}><WssPlayground /></Suspense></SuperAdminRoute>} />
          <Route path="/admin/ai-testing" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading AI Testing..." />}><AiTesting /></Suspense></AdminRoute>} />
          <Route path="/admin/wallet-monitoring" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading Wallet Monitoring..." />}><WalletMonitoring /></Suspense></AdminRoute>} />
          <Route path="/admin/liq-sim" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading Liquidity Simulator..." />}><LiquiditySimulatorPage /></Suspense></AdminRoute>} />
          <Route path="/websocket-test" element={<SuperAdminRoute><Navigate to="/connection-debugger" replace /></SuperAdminRoute>} />
          <Route path="/websocket-dashboard" element={<SuperAdminRoute><Navigate to="/connection-debugger" replace /></SuperAdminRoute>} />
          <Route path="/amm-sim" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback />}><AmmSim /></Suspense></SuperAdminRoute>} />
          <Route path="/superadmin/log-forwarder" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback />}><LogForwarderDebugLazy /></Suspense></SuperAdminRoute>} />
          
          {/* Utility Routes */}
          <Route path="/blinks/*" element={<BlinkResolver />} />
          <Route path="/websocket-api" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><WebSocketAPIPage /></Suspense></MaintenanceGuard>} />
          <Route path="*" element={<Suspense fallback={<LoadingFallback />}><NotFound /></Suspense>} />
          <Route path="/banned" element={<Suspense fallback={<LoadingFallback />}><BannedUser /></Suspense>} />
          <Route path="/banned-ip" element={<Suspense fallback={<LoadingFallback />}><BannedIP /></Suspense>} />
          <Route path="/maintenance" element={<Suspense fallback={<LoadingFallback />}><Maintenance /></Suspense>} />
          <Route path="/examples/contest-chat" element={<Suspense fallback={<LoadingFallback variant="minimal" message="Loading Example..." />}><ContestChatExample /></Suspense>} />
        </Routes>
      </main>
      
      {/* Persistent Terminal Component - ALWAYS RENDERED NOW */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-[60] pointer-events-none"
      >
        <div className="pointer-events-auto"> 
          <Terminal 
              config={{
                  RELEASE_DATE: config.RELEASE_DATE.TOKEN_LAUNCH_DATETIME,
                  CONTRACT_ADDRESS: config.CONTRACT_ADDRESS.REAL, 
                  DISPLAY: {
                      DATE_SHORT: config.RELEASE_DATE.DISPLAY.LAUNCH_DATE_SHORT,
                      DATE_FULL: config.RELEASE_DATE.DISPLAY.LAUNCH_DATE_FULL, 
                      TIME: config.RELEASE_DATE.DISPLAY.LAUNCH_TIME
                  }
              }}
              size="contracted"
          />
        </div>
      </div>

      <Footer />
      <AchievementNotification />
      <InviteWelcomeModal />
      <BlinkResolver />
      <ToastContainer />
    </div>
  );
};