// src/App.tsx

/**
 * Unified Auth Implementation - DegenDuel Frontend
 * 
 * @description This file contains the App component with the new unified authentication system.
 * It removes the nested auth providers and replaces them with a single UnifiedAuthProvider.
 * 
 * @author @BranchManager69
 * @version 2.0.0
 * @created 2025-05-05
 * @updated 2025-05-05
 */

// React
import React, { createContext, lazy, Suspense, useContext, useEffect, useMemo, useState } from "react";
// React Router
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";

// Auth providers
import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { UnifiedAuthProvider } from "./contexts/UnifiedAuthContext";
import { UnifiedWebSocketProvider } from "./contexts/UnifiedWebSocketContext";

// NEW: @solana/kit related imports
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'; // Corrected: Use SolanaRpcApi from @solana/rpc
import { createDegenDuelRpcClient } from "./lib/solana/rpcClient"; // Our custom RPC client factory

// Wallet providers
import { WalletName } from "@solana/wallet-adapter-base";
import { Commitment } from "@solana/web3.js";

// Other providers
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

// Hooks and utils
import "@solana/wallet-adapter-react-ui/styles.css";
import "jupiverse-kit/dist/index.css";
import { useMigratedAuth } from "./hooks/auth/useMigratedAuth";
import { useScrollbarVisibility } from "./hooks/ui/useScrollbarVisibility";
import "./styles/color-schemes.css";

// Route components
// Admin routes
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

// Authenticated routes
import { ReferralPage } from "./pages/authenticated/AffiliatePage";
import { ContestCreditsPage } from "./pages/authenticated/ContestCreditsPage";
import MyContestsPage from "./pages/authenticated/MyContestsPage";
import MyPortfoliosPage from "./pages/authenticated/MyPortfoliosPage";
import NotificationsPage from "./pages/authenticated/NotificationsPage";
import { TokenSelection } from "./pages/authenticated/PortfolioTokenSelectionPage";
import { PrivateProfilePage } from "./pages/authenticated/PrivateProfilePage";
import WalletPage from "./pages/authenticated/WalletPage";

// Example routes
import ContestChatExample from "./pages/examples/ContestChatExample";

// Public routes
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

// Leaderboard routes
import { ContestPerformance } from "./pages/public/leaderboards/ContestPerformanceRankings";
import { DegenLevelPage } from "./pages/public/leaderboards/DegenLevelPage";
import { GlobalRankings } from "./pages/public/leaderboards/GlobalRankings";
import { LeaderboardLanding } from "./pages/public/leaderboards/LeaderboardLanding";

// Token routes
import { TokensPage } from "./pages/public/tokens/TokensPage";

// API routes
import WebSocketAPIPage from "./pages/public/WebSocketAPIPage";

// Superadmin routes
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

// Lazy loaded components
const AdminChatDashboard = lazy(
  () => import("./pages/admin/AdminChatDashboard"),
);
const LiquiditySimulatorPage = lazy(
  () => import("./pages/admin/LiquiditySimulatorPage"),
);

interface AppUwkConfig {
  autoConnect: boolean;
  env: 'mainnet-beta' | 'devnet';
  metadata: {
    name: string;
    description: string;
    url: string;
    iconUrls: string[];
  };
  theme: 'dark' | 'light' | 'jupiter';
  connectionConfig: {
    endpoint: string;
    commitment?: Commitment;
  };
  walletPrecedence?: WalletName[];
  notificationCallback?: {
      onConnect: (props: any) => void;
      onConnecting: (props: any) => void;
      onDisconnect: (props: any) => void;
      onNotInstalled: (props: any) => void;
  };
  walletlistExplanation?: { href: string; };
  walletAttachments?: Record<string, { attachment: React.ReactNode; }>;
  walletModalAttachments?: { footer?: React.ReactNode; };
}

const FlagSetter: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__JUP_WALLET_PROVIDER_EXISTS = true;
    }
  }, []);
  return null;
};

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';

// RpcContext for our custom JWT-aware RPC client
interface RpcContextType {
  rpcClient: Rpc<SolanaRpcApi> | null;
  endpoint: string;
}
// Export RpcContext so it can be imported by hooks
export const RpcContext = createContext<RpcContextType | null>(null);
export const useDegenDuelRpc = () => {
  const context = useContext(RpcContext);
  if (!context) throw new Error("useDegenDuelRpc must be used within an RpcProvider");
  return context;
};

// App entry
export const App: React.FC = () => {
  useScrollbarVisibility();

  return (
    <Router>
      <UnifiedAuthProvider>
        <AppProvidersAndContent />
      </UnifiedAuthProvider>
    </Router>
  );
};

// Component to house providers that depend on auth state and manage dynamic RPC client
const AppProvidersAndContent: React.FC = () => {
  const { user } = useMigratedAuth();
  const ddJwt = useMemo(() => (user as any)?.ddJwt || null, [user]);

  const [currentRpcEndpoint, setCurrentRpcEndpoint] = useState(() => `${window.location.origin}/api/solana-rpc/public`);

  useEffect(() => {
    if (ddJwt) {
      console.log('[App.tsx] User authenticated, setting user-tier DegenDuel RPC proxy for Kit client');
      setCurrentRpcEndpoint(`${window.location.origin}/api/solana-rpc`);
    } else {
      console.log('[App.tsx] User not authenticated, setting public-tier DegenDuel RPC proxy for Kit client');
      setCurrentRpcEndpoint(`${window.location.origin}/api/solana-rpc/public`);
    }
  }, [ddJwt]);

  const rpcClientV2 = useMemo(() => {
    return createDegenDuelRpcClient(currentRpcEndpoint, ddJwt);
  }, [currentRpcEndpoint, ddJwt]);

  const privyConfig: PrivyClientConfig = useMemo(() => ({
    loginMethods: ['wallet', 'passkey'],
    appearance: {
      theme: 'dark',
      accentColor: '#5865F2',
      showWalletLoginFirst: false,
      walletChainType: 'ethereum-and-solana',
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
      requireUserPasswordOnCreate: true
    },
    externalWallets: {
      solana: {
        connectors: toSolanaWalletConnectors({ shouldAutoConnect: false })
      }
    },
    supportedChains: [
      {
        name: 'Solana',
        id: 101,
        nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
        rpcUrls: {
          default: { http: [currentRpcEndpoint] }, // Privy also uses the dynamic endpoint
          public: { http: [`${window.location.origin}/api/solana-rpc/public`] },
          admin: { http: [`${window.location.origin}/api/solana-rpc/admin`] }
        }
      }
    ]
  }), [user, currentRpcEndpoint]); // Added currentRpcEndpoint to privy dependencies

  // THIS IS WHERE @solana/react PROVIDER(S) WOULD GO
  // Your research will determine what this looks like.
  // Example conceptual structure:
  // <SolanaReactProvider
  //    (props determined by your research - does it take an rpcClient? Or configure one?)
  // >
  //    <YourWalletStandardUiModalProviderIfNeeded>
  //       <RestOfProvidersAndApp />
  //    </YourWalletStandardUiModalProviderIfNeeded>
  // </SolanaReactProvider>

  // For now, wrapping remaining providers in a placeholder for clarity
  // and providing the rpcClientV2 via our custom context.
  return (
    <RpcContext.Provider value={{ rpcClient: rpcClientV2, endpoint: currentRpcEndpoint }}>
      <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
        <InviteSystemProvider>
          <AffiliateSystemProvider>
            <UnifiedWebSocketProvider>
              <TokenDataProvider> { /* Review if TokenDataProvider needs direct rpcClient or relies on new wallet hooks */ }
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
  const { user: authUser } = useMigratedAuth(); // Example of using useMigratedAuth in a deeper component

  return (
    <div className="min-h-screen flex flex-col">
      <ToastListener />
      
      {/* Debug Panels - use authUser here */}
      {authUser && (authUser as any).is_superadmin && <UiDebugPanel />}
      {authUser && (authUser as any).is_superadmin && <ServiceDebugPanel />}
      {authUser && (authUser as any).is_superadmin && <GameDebugPanel />}
      
      <BackgroundEffectsBoundary>
        <BackgroundEffects />
      </BackgroundEffectsBoundary>
      <Header />
      <EdgeToEdgeTicker />
      {/* Use authUser here */}
      {authUser && <WalletBalanceTicker isCompact={true} />}
      <ServerDownBanner />
      
      <main className="flex-1 pb-12">
        {/* Routes */}
        <Routes>
          {/* Landing and Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/join" element={<PreserveQueryParamsRedirect to="/" />} />
          <Route path="/tokens/legacy" element={<PreserveQueryParamsRedirect to="/tokens" />} />
          
          {/* Contest Routes */}
          <Route
            path="/contests"
            element={<MaintenanceGuard><ContestBrowser /></MaintenanceGuard>}
          />
          <Route
            path="/contests/:id"
            element={<MaintenanceGuard><ContestDetails /></MaintenanceGuard>}
          />
          <Route
            path="/contests/:id/live"
            element={<MaintenanceGuard><ContestLobby /></MaintenanceGuard>}
          />
          <Route
            path="/contests/:id/results"
            element={<MaintenanceGuard><ContestResults /></MaintenanceGuard>}
          />
          
          {/* Token Routes */}
          <Route
            path="/tokens"
            element={<MaintenanceGuard><TokensPage /></MaintenanceGuard>}
          />
          
          {/* Game Routes */}
          <Route
            path="/game/virtual-agent"
            element={<MaintenanceGuard><VirtualAgentPage /></MaintenanceGuard>}
          />
          
          {/* Profile Routes */}
          <Route
            path="/profile/:identifier"
            element={<MaintenanceGuard><PublicProfile /></MaintenanceGuard>}
          />
          
          {/* Auth Routes */}
          <Route
            path="/login"
            element={<MaintenanceGuard><LoginPage /></MaintenanceGuard>}
          />
          
          {/* Static Pages */}
          <Route path="/faq" element={<FAQ />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/blinks-demo" element={<BlinksDemo />} />
          <Route path="/solana-demo" element={<SolanaBlockchainDemo />} />
          
          {/* Leaderboard Routes */}
          <Route path="/leaderboards" element={<LeaderboardLanding />} />
          <Route path="/leaderboard" element={<DegenLevelPage />} />
          <Route path="/rankings/performance" element={<ContestPerformance />} />
          <Route path="/rankings/global" element={<GlobalRankings />} />
          
          {/* Admin Routes */}
          <Route
            path="/admin/wallet-management"
            element={<AdminRoute><WalletManagementPage /></AdminRoute>}
          />
          
          {/* Authenticated Routes */}
          <Route
            path="/me"
            element={<AuthenticatedRoute><MaintenanceGuard><PrivateProfilePage /></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/referrals"
            element={<AuthenticatedRoute><MaintenanceGuard><ReferralPage /></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/notifications"
            element={<AuthenticatedRoute><MaintenanceGuard><NotificationsPage /></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/my-contests"
            element={<AuthenticatedRoute><MaintenanceGuard><MyContestsPage /></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/my-portfolios"
            element={<AuthenticatedRoute><MaintenanceGuard><MyPortfoliosPage /></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/wallet"
            element={<AuthenticatedRoute><MaintenanceGuard><WalletPage /></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/contest-credits"
            element={<AuthenticatedRoute><MaintenanceGuard><ContestCreditsPage /></MaintenanceGuard></AuthenticatedRoute>}
          />
          <Route
            path="/contests/:id/select-tokens"
            element={<AuthenticatedRoute><MaintenanceGuard><TokenSelection /></MaintenanceGuard></AuthenticatedRoute>}
          />
          
          {/* Admin Dashboard Routes */}
          <Route path="/admin/skyduel" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading SkyDuel..." />}><SkyDuelPage /></Suspense></AdminRoute>} />
          <Route path="/admin/system-reports" element={<AdminRoute><SystemReports /></AdminRoute>} />
          <Route path="/admin/client-errors" element={<AdminRoute><ClientErrorsPage /></AdminRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/ip-ban" element={<AdminRoute><IpBanManagementPage /></AdminRoute>} />
          <Route path="/admin/vanity-wallets" element={<AdminRoute><VanityWalletManagementPage /></AdminRoute>} />
          <Route path="/admin/contest-management/regenerate-image/:contestId" element={<AdminRoute><div>Contest Image Generator Page</div></AdminRoute>} />
          <Route path="/admin/contest-image-browser" element={<AdminRoute><ContestImageBrowserPage /></AdminRoute>} />
          <Route path="/admin/chat-dashboard" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading Chat Dashboard..." />}><AdminChatDashboard /></Suspense></AdminRoute>} />
          <Route path="/connection-debugger" element={<AdminRoute><ConnectionDebugger /></AdminRoute>} />
          <Route path="/websocket-hub" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading WebSocket Hub..." />}><WebSocketHub /></Suspense></AdminRoute>} />
          
          {/* SuperAdmin Routes */}
          <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
          <Route path="/superadmin/wallet-monitoring" element={<SuperAdminRoute><WalletMonitoring /></SuperAdminRoute>} />
          <Route path="/superadmin/control-hub" element={<SuperAdminRoute><ControlPanelHub /></SuperAdminRoute>} />
          <Route path="/superadmin/chat-dashboard" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback variant="full" message="Loading SuperAdmin Chat Dashboard..." />}><AdminChatDashboard /></Suspense></SuperAdminRoute>} />
          <Route path="/superadmin/services" element={<SuperAdminRoute><ServiceControlPage /></SuperAdminRoute>} />
          <Route path="/superadmin/switchboard" element={<SuperAdminRoute><ServiceSwitchboard /></SuperAdminRoute>} />
          <Route path="/superadmin/circuit-breaker" element={<SuperAdminRoute><CircuitBreakerPage /></SuperAdminRoute>} />
          <Route path="/superadmin/service-command-center" element={<SuperAdminRoute><ServiceCommandCenter /></SuperAdminRoute>} />
          <Route path="/superadmin/websocket-monitor" element={<SuperAdminRoute><Navigate to="/superadmin/service-command-center" replace /></SuperAdminRoute>} />
          <Route path="/api-playground" element={<SuperAdminRoute><ApiPlayground /></SuperAdminRoute>} />
          <Route path="/wss-playground" element={<SuperAdminRoute><WssPlayground /></SuperAdminRoute>} />
          <Route path="/admin/ai-testing" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading AI Testing..." />}><AiTesting /></Suspense></AdminRoute>} />
          <Route path="/admin/wallet-monitoring" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading Wallet Monitoring..." />}><WalletMonitoring /></Suspense></AdminRoute>} />
          <Route path="/admin/liq-sim" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading Liquidity Simulator..." />}><LiquiditySimulatorPage /></Suspense></AdminRoute>} />
          <Route path="/websocket-test" element={<SuperAdminRoute><Navigate to="/connection-debugger" replace /></SuperAdminRoute>} />
          <Route path="/websocket-dashboard" element={<SuperAdminRoute><Navigate to="/connection-debugger" replace /></SuperAdminRoute>} />
          <Route path="/amm-sim" element={<SuperAdminRoute><AmmSim /></SuperAdminRoute>} />
          <Route path="/superadmin/log-forwarder" element={<SuperAdminRoute><LogForwarderDebug /></SuperAdminRoute>} />
          
          {/* Utility Routes */}
          <Route path="/blinks/*" element={<BlinkResolver />} />
          <Route path="/websocket-api" element={<MaintenanceGuard><WebSocketAPIPage /></MaintenanceGuard>} />
          <Route path="*" element={<NotFound />} />
          <Route path="/banned" element={<BannedUser />} />
          <Route path="/banned-ip" element={<BannedIP />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/examples/contest-chat" element={<Suspense fallback={<LoadingFallback variant="minimal" message="Loading Example..." />}><ContestChatExample /></Suspense>} />
        </Routes>
      </main>
      
      <Footer />
      
      <AchievementNotification />
      <InviteWelcomeModal />
      <BlinkResolver />
      <ToastContainer />
    </div>
  );
};