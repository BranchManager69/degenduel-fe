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
import React, { lazy, Suspense, useEffect } from "react";
// React Router
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";

// Auth providers
import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { UnifiedAuthProvider } from "./contexts/UnifiedAuthContext";
import { UnifiedWebSocketProvider } from "./contexts/UnifiedWebSocketContext";

// Wallet providers
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { Adapter } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

// Other providers
import { ToastContainer, ToastListener, ToastProvider } from "./components/toast";
import { SolanaConnectionProvider } from "./contexts/SolanaConnectionContext";
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

// App entry
export const App: React.FC = () => {
  // Initialize scrollbar visibility
  useScrollbarVisibility();

  // Create wallet adapters
  const walletAdapters: Adapter[] = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter()
  ];
  
  // Global flag to make hooks aware of wallet provider
  const FlagSetter: React.FC = () => {
    useEffect(() => {
      if (typeof window !== 'undefined') {
        (window as any).__JUP_WALLET_PROVIDER_EXISTS = true;
      }
    }, []);
    return null;
  };
  
  // Use a public RPC endpoint by default at the root level
  // The actual role-based endpoint will be used in the AppContent component after auth is available
  const defaultRpcEndpoint = `${window.location.origin}/api/solana-rpc/public`;
  
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
    // Use default public endpoint initially
    connectionConfig: {
      commitment: 'confirmed' as const,
      endpoint: defaultRpcEndpoint
    }
  };
  
  // Privy configuration
  const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';
  const privyConfig: PrivyClientConfig = {
    // Login methods configuration
    loginMethods: [
      'wallet',
      'passkey',
    ],
    
    // UI appearance configuration
    appearance: {
      theme: 'dark',
      accentColor: '#5865F2',
      showWalletLoginFirst: false,
      walletChainType: 'ethereum-and-solana',
    },
    
    // Embedded wallet configuration
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
      requireUserPasswordOnCreate: true
    },
    
    // External wallets integration
    externalWallets: {
      solana: {
        connectors: toSolanaWalletConnectors({
          shouldAutoConnect: false
        })
      }
    },
    
    // Chain configuration
    supportedChains: [
      {
        name: 'Solana',
        id: 101, // Solana mainnet chain ID
        nativeCurrency: {
          name: 'Solana',
          symbol: 'SOL',
          decimals: 9
        },
        rpcUrls: {
          default: {
            http: [
              `${window.location.origin}/api/solana-rpc`
            ]
          },
          public: {
            http: [`${window.location.origin}/api/solana-rpc/public`]
          },
          admin: {
            http: [`${window.location.origin}/api/solana-rpc/admin`]
          }
        }
      }
    ]
  };
  
  return (
    <Router>
      {/* Wallet Provider */}
      <UnifiedWalletProvider 
        wallets={walletAdapters}
        config={uwkConfig}
      >
        <FlagSetter />
        
        {/* Privy Provider */}
        <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
          
          {/* Authentication - Single provider replaces all previous auth providers */}
          <UnifiedAuthProvider>
            
            {/* Support Providers */}
            <InviteSystemProvider>
              <AffiliateSystemProvider>
                
                {/* WebSocket Provider - Single provider using new auth system */}
                <UnifiedWebSocketProvider>
                  
                  {/* Other Providers */}
                  <SolanaConnectionProvider>
                    <TokenDataProvider>
                      <ToastProvider>
                        
                        {/* App Content - Now in a separate component that can safely use auth */}
                        <AppContent />
                        
                      </ToastProvider>
                    </TokenDataProvider>
                  </SolanaConnectionProvider>
                </UnifiedWebSocketProvider>
              </AffiliateSystemProvider>
            </InviteSystemProvider>
          </UnifiedAuthProvider>
        </PrivyProvider>
      </UnifiedWalletProvider>
    </Router>
  );
};

// This component can safely use auth hooks because it renders after all providers
const AppContent: React.FC = () => {
  // Now we can safely use the migrated auth hook
  const { user } = useMigratedAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Toast Listener */}
      <ToastListener />
      
      {/* Debug Panels */}
      {user?.is_superadmin && <UiDebugPanel />}
      {user?.is_superadmin && <ServiceDebugPanel />}
      {user?.is_superadmin && <GameDebugPanel />}
      
      {/* Background and Layout */}
      <BackgroundEffectsBoundary>
        <BackgroundEffects />
      </BackgroundEffectsBoundary>
      <Header />
      <EdgeToEdgeTicker />
      {user && <WalletBalanceTicker isCompact={true} />}
      <ServerDownBanner />
      
      {/* Main Content */}
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
                          
                          {/* Footer */}
                          <Footer />
                          
                          {/* Additional Components */}
                          <AchievementNotification />
                          <InviteWelcomeModal />
                          <BlinkResolver />
                          <ToastContainer />
                        </div>
  );
};