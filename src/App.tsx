// src/App.tsx

/**
 * Unified Auth Implementation - DegenDuel Frontend
 * 
 * @description This file contains the App component with the new unified authentication system.
 * It removes the nested auth providers and replaces them with a single UnifiedAuthProvider.
 * 
 * @author BranchManager69
 * @version 2.0.2
 * @created 2025-05-05
 * @updated 2025-05-25
 */

// React
//import { useEffect, useState } from "react";
import React, { createContext, lazy, Suspense, useContext, useMemo } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";

// Stagewise for visual debugging
// import { StagewiseToolbar } from "@stagewise/toolbar-react";

// Auth providers
// Unified Auth Contexts
import { SolanaConnectionProvider, useSolanaConnection } from './contexts/SolanaConnectionContext';
import { UnifiedAuthProvider } from "./contexts/UnifiedAuthContext";

// @solana/kit related imports
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'; // Corrected: Use SolanaRpcApi from @solana/rpc
import { type Adapter } from "@solana/wallet-adapter-base"; // Added for explicit typing

// Wallet providers
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter
} from "@solana/wallet-adapter-wallets";

// Other providers of dubious quality:
import { Toaster } from "react-hot-toast";
import { ToastListener, ToastProvider } from "./components/toast";

// Components
import { NotificationDebugPanel } from './components/debug/NotificationDebugPanel';

// Helper component to redirect while preserving query parameters
const PreserveQueryParamsRedirect = ({ to }: { to: string }) => {
  const location = useLocation();
  // Preserve all query parameters by appending the search string to the destination
  return <Navigate to={`${to}${location.search}`} replace />;
};

// Stuff
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
import { SystemNotice } from "./components/layout/SystemNotice";
// import { WalletBalanceTicker } from "./components/layout/WalletBalanceTicker";
import { InviteWelcomeModal } from "./components/modals/InviteWelcomeModal";
import { AdminRoute } from "./components/routes/AdminRoute";
import { AuthenticatedRoute } from "./components/routes/AuthenticatedRoute";
import { MaintenanceGuard } from "./components/routes/MaintenanceGuard";
import { SuperAdminRoute } from "./components/routes/SuperAdminRoute";
import LoadingFallback from "./components/shared/LoadingFallback";
import ScrollToTop from "./components/shared/ScrollToTop";
import { Terminal } from "./components/terminal/Terminal";
// import { useNotifications } from './hooks/websocket/topic-hooks/useNotifications';
// import { useSystemSettings } from './hooks/websocket/topic-hooks/useSystemSettings';

// Wallet adapter styles (if this is the old wallet adapter, we removed it)
import "@solana/wallet-adapter-react-ui/styles.css";
// General styles
import "./styles/color-schemes.css";

// Hooks and utils
import { useMigratedAuth } from "./hooks/auth/useMigratedAuth";
import { InviteSystemProvider } from './hooks/social/legacy/useInviteSystem'; // ? test
import { useScrollbarVisibility } from "./hooks/ui/useScrollbarVisibility";
import { useBackgroundCycler } from './hooks/useBackgroundCycler';


// Config - Prelaunch mode
import { config, PRELAUNCH_BYPASS_KEY, PRELAUNCH_MODE } from './config/config';

// Landing Page
import { LandingPage } from "./pages/public/general/LandingPage";

// Admin Chat Dashboard
const AdminChatDashboard = lazy(() => import('./pages/admin/AdminChatDashboard'));

// Liquidity Simulator Page
const LiquiditySimulatorPage = lazy(() => import("./pages/admin/LiquiditySimulatorPage"));

// Superadmin routes lazy loaded
const AmmSim = lazy(() => import('./pages/superadmin/AmmSim'));
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
const AdminWalletDashboard = lazy(() => import('./pages/admin/AdminWalletDashboard'));
const AiTesting = lazy(() => import('./pages/admin/AiTesting').then(module => ({ default: module.AiTesting })));
const ClientErrorsPage = lazy(() => import('./pages/admin/ClientErrorsPage'));
const ConnectionDebugger = lazy(() => import('./pages/admin/ConnectionDebugger').then(module => ({ default: module.ConnectionDebugger })));
const ContestImageBrowserPage = lazy(() => import('./pages/admin/ContestImageBrowserPage').then(module => ({ default: module.ContestImageBrowserPage })));
const ContestImageGeneratorPage = lazy(() => import('./pages/admin/ContestImageGeneratorPage'));
const IpBanManagementPage = lazy(() => import('./pages/admin/ip-ban/IpBanManagementPage'));
const SkyDuelPage = lazy(() => import('./pages/admin/SkyDuelPage').then(module => ({ default: module.SkyDuelPage })));
const SystemReports = lazy(() => import('./pages/admin/SystemReports').then(module => ({ default: module.SystemReports })));
const VanityWalletManagementPage = lazy(() => import('./pages/admin/VanityWalletManagementPage'));
const WalletManagementPage = lazy(() => import('./pages/admin/WalletManagementPage'));
const WebSocketHub = lazy(() => import('./pages/admin/WebSocketHub'));
const TokenSyncTest = lazy(() => import('./pages/admin/TokenSyncTest'));
const TokenDataControlCenter = lazy(() => import('./pages/admin/TokenDataControlCenter').then(module => ({ default: module.TokenDataControlCenter })));
const ApiTestingPage = lazy(() => import('./pages/admin/ApiTestingPage'));


// Authenticated routes lazy loaded
const ReferralPage = lazy(() => import('./pages/authenticated/AffiliatePage').then(module => ({ default: module.ReferralPage })));
const ContestCreditsPage = lazy(() => import('./pages/authenticated/ContestCreditsPage').then(module => ({ default: module.ContestCreditsPage })));
const CreateContestPage = lazy(() => import('./pages/authenticated/CreateContestPage').then(module => ({ default: module.CreateContestPage })));
const MyContestsPage = lazy(() => import('./pages/authenticated/MyContestsPage'));
const MyPortfoliosPage = lazy(() => import('./pages/authenticated/MyPortfoliosPage'));
const NotificationsPage = lazy(() => import('./pages/authenticated/NotificationsPage'));
const TokenSelection = lazy(() => import('./pages/public/contests/PortfolioTokenSelectionPage').then(module => ({ default: module.PortfolioTokenSelectionPage })));
const PrivateProfilePage = lazy(() => import('./pages/authenticated/PrivateProfilePage').then(module => ({ default: module.PrivateProfilePage })));
const WalletPage = lazy(() => import('./pages/authenticated/WalletPage'));

// Example routes lazy loaded
const ContestChatExample = lazy(() => import('./pages/examples/ContestChatExample'));

// Public routes lazy loaded
const DegenDuelMCPPortal = lazy(() => import('./pages/public/general/DegenDuelMCPPortal').then(module => ({ default: module.DegenDuelMCPPortal })));
const ContestBrowser = lazy(() => import('./pages/public/contests/ContestBrowserPage').then(module => ({ default: module.ContestBrowser })));
const ContestDetails = lazy(() => import('./pages/public/contests/ContestDetailPage').then(module => ({ default: module.ContestDetails })));
const ContestLobbyV2 = lazy(() => import('./pages/public/contests/ContestLobbyV2'));
const ContestResults = lazy(() => import('./pages/public/contests/ContestResultsPage').then(module => ({ default: module.ContestResults })));
const ComingSoonPage = lazy(() => import('./pages/public/general/ComingSoonPage'));
const Contact = lazy(() => import('./pages/public/general/Contact').then(module => ({ default: module.Contact })));
const FAQ = lazy(() => import('./pages/public/general/FAQ').then(module => ({ default: module.FAQ })));
const HowItWorks = lazy(() => import('./pages/public/general/HowItWorks').then(module => ({ default: module.HowItWorks })));
const LoginPage = lazy(() => import('./pages/public/general/LoginPage'));
const TermsOfService = lazy(() => import('./pages/public/general/TermsOfService').then(module => ({ default: module.TermsOfService })));
const PrivacyPolicy = lazy(() => import('./pages/public/general/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const WhitepaperPage = lazy(() => import('./pages/public/general/WhitepaperPage').then(module => ({ default: module.WhitepaperPage })));
const RoadmapPage = lazy(() => import('./pages/public/general/RoadmapPage').then(module => ({ default: module.RoadmapPage })));
const Maintenance = lazy(() => import('./pages/public/general/Maintenance').then(module => ({ default: module.Maintenance })));
const NotFound = lazy(() => import('./pages/public/general/NotFound').then(module => ({ default: module.NotFound })));
const PublicProfile = lazy(() => import('./pages/public/general/PublicProfile').then(module => ({ default: module.PublicProfile })));
const BannedIP = lazy(() => import('./pages/public/general/BannedIP').then(module => ({ default: module.BannedIP })));
const BannedUser = lazy(() => import('./pages/public/general/BannedUser').then(module => ({ default: module.BannedUser })));
const BlinksDemo = lazy(() => import('./pages/public/general/BlinksDemo').then(module => ({ default: module.BlinksDemo })));
const SolanaBlockchainDemo = lazy(() => import('./pages/public/general/SolanaBlockchainDemo'));
const WebSocketAuthTest = lazy(() => import('./pages/public/general/WebSocketAuthTest'));
const ImportantUpdate = lazy(() => import('./pages/public/general/ImportantUpdate').then(module => ({ default: module.ImportantUpdate })));
const DeveloperUpdates = lazy(() => import('./pages/public/general/DeveloperUpdates').then(module => ({ default: module.DeveloperUpdates })));
const LogoAnimationShowcase = lazy(() => import('./pages/public/general/LogoAnimationShowcase').then(module => ({ default: module.LogoAnimationShowcase })));
const VirtualAgentPage = lazy(() => import('./pages/public/game/VirtualAgent').then(module => ({ default: module.VirtualAgentPage })));
const ContestPerformance = lazy(() => import('./pages/public/leaderboards/ContestPerformanceRankings').then(module => ({ default: module.ContestPerformance })));
const DegenLevelPage = lazy(() => import('./pages/public/leaderboards/DegenLevelPage').then(module => ({ default: module.DegenLevelPage })));
const GlobalRankings = lazy(() => import('./pages/public/leaderboards/GlobalRankings').then(module => ({ default: module.GlobalRankings })));
const LeaderboardLanding = lazy(() => import('./pages/public/leaderboards/LeaderboardLanding').then(module => ({ default: module.LeaderboardLanding })));
const TokensPage = lazy(() => import('./pages/public/tokens/TokensPage').then(module => ({ default: module.TokensPage })));
const TokenDetailPage = lazy(() => import('./pages/public/tokens/TokenDetailPageNew'));
const WebSocketAPIPage = lazy(() => import('./pages/public/WebSocketAPIPage'));
const WhaleRoomPage = lazy(() => import('./pages/public/whaleroom/WhaleRoomPage').then(module => ({ default: module.default })));

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

// A small intermediate component to bridge your context with the adapter's
const WalletAdapterProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Safely get RPC endpoint with fallback to prevent circular dependency
  let rpcEndpoint: string;
  try {
    const solanaConnection = useSolanaConnection();
    rpcEndpoint = solanaConnection.rpcEndpoint;
  } catch (error) {
    // Fallback endpoint when SolanaConnectionProvider isn't available yet
    rpcEndpoint = `${window.location.origin}/api/solana-rpc/public`;
    console.log('[WalletAdapterProviders] Using fallback RPC endpoint, SolanaConnectionProvider not ready yet');
  }
  
  const wallets: Adapter[] = useMemo(
    () => [
        new PhantomWalletAdapter(), // DO NOT DELETE DESPITE WHAT YOUR LINTER OR BRAIN SAYS. IT IS REQUIRED.
        new SolflareWalletAdapter(), // DO NOT DELETE DESPITE WHAT YOUR LINTER OR BRAIN SAYS. IT IS REQUIRED.
        //new TrustWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={rpcEndpoint}> {/* Use your dynamic endpoint here */}
      {/* Use the explicit list of wallets and set autoConnect to false */}
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// App entry
export const App: React.FC = () => {
  useScrollbarVisibility();
  
  // Enable background cycling with 'B' key
  useBackgroundCycler();
  
  // Memoize searchParams to prevent infinite re-renders caused by creating new URLSearchParams on every render
  const searchParams = React.useMemo(() => new URLSearchParams(window.location.search), []);
  
  // EMERGENCY PERFORMANCE MODE RESET - for users stuck on mobile
  React.useEffect(() => {
    if (searchParams.get('reset-performance') === 'true') {
      localStorage.removeItem('performance-mode');
      localStorage.removeItem('performance-toggle-dismissed');
      document.body.classList.remove('performance-mode');
      
      // Show a success message
      console.log('🚀 Performance mode reset successfully!');
      
      // Remove the parameter and reload to clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('reset-performance');
      window.history.replaceState({}, '', url.toString());
      
      // Small delay then reload to ensure settings are applied
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }, [searchParams]);
  
  /* PRELAUNCH BYPASS */
  // Log the expected bypass key for debugging
  // console.log('[App.tsx] Expected PRELAUNCH_BYPASS_KEY:', PRELAUNCH_BYPASS_KEY);
  // Log the received bypass key from URL for debugging
  // console.log('[App.tsx] Received bypass from URL:', searchParams.get('bypass'));

  const hasAdminBypass = searchParams.get('bypass') === PRELAUNCH_BYPASS_KEY;
  const showComingSoon = PRELAUNCH_MODE && !hasAdminBypass;

  // Debug logging
  // if (PRELAUNCH_MODE) {
  //   console.log(`[App.tsx] Prelaunch Mode Active. Expected Key: ${PRELAUNCH_BYPASS_KEY}, Received Key: ${searchParams.get('bypass')}, Bypass active: ${hasAdminBypass}. Showing Coming Soon: ${showComingSoon}`);
  // }

  // Move UnifiedAuthProvider above Router to prevent route-change remounts
  // This stops the cascade of provider remounts that was affecting WebSocket stability
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}> 
      {showComingSoon ? (
        // App access is blocked, so we show Coming Soon
        <ComingSoonPage />
      ) : (
        // App access is granted, so we can wrap the app in the providers and display
        <AppProvidersAndContent />
      )}
    </Router>
  );
};

// Component to house providers that depend on auth state and manage dynamic DegenDuel RPC client
const AppProvidersAndContent: React.FC = () => {
  return (
    <InviteSystemProvider>
      {/* Correct provider hierarchy: */}
      {/* 1. WalletAdapterProviders (provides wallet context) */}
      {/* 2. UnifiedAuthProvider (uses wallet context, provides auth context) */}
      {/* 3. SolanaConnectionProvider (uses auth context) */}
      <WalletAdapterProviders>
        <UnifiedAuthProvider>
          <SolanaConnectionProvider>
            <ToastProvider>
              <AppContent />
              <Toaster position="top-right" />
            </ToastProvider>
          </SolanaConnectionProvider>
        </UnifiedAuthProvider>
      </WalletAdapterProviders>
    </InviteSystemProvider>
  );
};

// This component can safely use auth hooks because it renders after all providers
const AppContent: React.FC = () => {
  const { user } = useMigratedAuth();

  // State and hooks for error banners
  // const { error: notificationsError } = useNotifications();
  // const { error: systemSettingsError } = useSystemSettings(); // Renamed for clarity
  //const [showNotificationErrorBanner, setShowNotificationErrorBanner] = useState(false);
  //const [showSystemSettingsErrorBanner, setShowSystemSettingsErrorBanner] = useState(false);
  // const { isCompact: isHeaderCompact } = useScrollHeader(50); // To dynamically position banners

  // Effect for notification errors
  /*
  useEffect(() => {
    if (notificationsError) {
      setShowNotificationErrorBanner(true);
    }
  }, [notificationsError]);

  // Effect for system settings errors
  useEffect(() => {
    if (systemSettingsError) {
      setShowSystemSettingsErrorBanner(true);
    }
  }, [systemSettingsError]);
  */

  // Calculate top position for banners dynamically
  //const headerBaseHeight = 16; // h-16 (4rem)
  //const tickerBaseHeight = 12; // h-12 (3rem)
  //const compactHeaderHeight = 14; // sm:h-14 (3.5rem)
  //const compactTickerHeight = 10; // sm:h-10 (2.5rem)

  // Calculate the total offset for banners
  //const currentHeaderHeight = isHeaderCompact ? compactHeaderHeight : headerBaseHeight;
  //const currentTickerHeight = isHeaderCompact ? compactTickerHeight : tickerBaseHeight;
  //const totalOffset = currentHeaderHeight + currentTickerHeight; // This is in Tailwind spacing units (1 unit = 0.25rem)
  
  // Helper to get error message safely
  /*
  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error && typeof error.message === 'string') return error.message;
    return "Unknown error";
  };
  */

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      {/* Scroll to top on navigation */}
      <ScrollToTop />
      
      {/* Toast Listener */}
      <ToastListener />
      
      {/* Debug Panels */}
      {user && (user as any).is_superadmin && <UiDebugPanel />}
      {user && (user as any).is_superadmin && <ServiceDebugPanel />}
      {user && (user as any).is_superadmin && <GameDebugPanel />}
      
      {/* Stagewise Visual Debugging Toolbar */}
      {/* {process.env.NODE_ENV === 'development' && <StagewiseToolbar />} */}
      
      {/* Performance Toggle moved to Footer */}
      
      {/* Background Effects */}
      <BackgroundEffectsBoundary>
        <BackgroundEffects />
      </BackgroundEffectsBoundary>

      {/* Header */}
      <Header />
      
      {/* EdgeToEdgeTicker */}
      <EdgeToEdgeTicker />
      
      {/* SystemNotice - global site-wide notice from API */}
      <SystemNotice />
      
      {/* WalletBalanceTicker - Removed per user request */}
      
      {/* ServerDownBanner (?) */}
      {/* <ServerDownBanner /> */}

      {/* Main */}
      <main className="flex-1 pb-12">
        <Routes>
          {/* Landing and Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/join" element={<PreserveQueryParamsRedirect to="/" />} />
          <Route path="/tokens/legacy" element={<PreserveQueryParamsRedirect to="/tokens" />} />
          
          {/* Contest Routes */}
          <Route path="/contests" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><ContestBrowser /></Suspense></MaintenanceGuard>} />
          <Route path="/contests/:id" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><ContestDetails /></Suspense></MaintenanceGuard>} />
          <Route path="/contests/:id/live" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><ContestLobbyV2 /></Suspense></MaintenanceGuard>} />
          <Route path="/contests/:id/results" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><ContestResults /></Suspense></MaintenanceGuard>} />
          
          {/* Token Routes */}
          <Route path="/tokens" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><TokensPage /></Suspense></MaintenanceGuard>} />
          <Route path="/tokens/:address" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><TokenDetailPage /></Suspense></MaintenanceGuard>} />
          
          {/* Whale Room - Institutional Analytics Dashboard */}
          <Route path="/whale-room" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><WhaleRoomPage /></Suspense></MaintenanceGuard>} />
          
          {/* Game Routes */}
          <Route path="/game/virtual-agent" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><VirtualAgentPage /></Suspense></MaintenanceGuard>} />
          
          {/* Profile Routes */}
          <Route path="/profile/:identifier" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><PublicProfile /></Suspense></MaintenanceGuard>} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><LoginPage /></Suspense></MaintenanceGuard>} />
          
          {/* DegenDuel MCP Portal Route */}
          <Route path="/mcp" element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><DegenDuelMCPPortal /></Suspense></MaintenanceGuard>} />
          
          {/* Static Pages */}
          <Route path="/faq" element={<Suspense fallback={<LoadingFallback />}><FAQ /></Suspense>} />
          <Route path="/how-it-works" element={<Suspense fallback={<LoadingFallback />}><HowItWorks /></Suspense>} />
          <Route path="/contact" element={<Suspense fallback={<LoadingFallback />}><Contact /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<LoadingFallback />}><TermsOfService /></Suspense>} />
          <Route path="/privacy" element={<Suspense fallback={<LoadingFallback />}><PrivacyPolicy /></Suspense>} />
          <Route path="/whitepaper" element={<Suspense fallback={<LoadingFallback />}><WhitepaperPage /></Suspense>} />
          <Route path="/roadmap" element={<Suspense fallback={<LoadingFallback />}><RoadmapPage /></Suspense>} />
          <Route path="/important-update" element={<Suspense fallback={<LoadingFallback />}><ImportantUpdate /></Suspense>} />
          <Route path="/developer-updates" element={<Suspense fallback={<LoadingFallback />}><DeveloperUpdates /></Suspense>} />
          <Route path="/blinks-demo" element={<Suspense fallback={<LoadingFallback />}><BlinksDemo /></Suspense>} />
          <Route path="/solana-demo" element={<Suspense fallback={<LoadingFallback />}><SolanaBlockchainDemo /></Suspense>} />
          <Route path="/websocket-auth-test" element={<Suspense fallback={<LoadingFallback />}><WebSocketAuthTest /></Suspense>} />
          <Route path="/logo-showcase" element={<Suspense fallback={<LoadingFallback />}><LogoAnimationShowcase /></Suspense>} />
          
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
            element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><WalletPage /></Suspense></MaintenanceGuard>}
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
            element={<MaintenanceGuard><Suspense fallback={<LoadingFallback />}><TokenSelection /></Suspense></MaintenanceGuard>}
          />
          
          {/* Admin Dashboard Routes */}
          <Route path="/admin/skyduel" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading SkyDuel..." />}><SkyDuelPage /></Suspense></AdminRoute>} />
          <Route path="/admin/system-reports" element={<AdminRoute><Suspense fallback={<LoadingFallback />}><SystemReports /></Suspense></AdminRoute>} />
          <Route path="/admin/client-errors" element={<AdminRoute><Suspense fallback={<LoadingFallback />}><ClientErrorsPage /></Suspense></AdminRoute>} />
          <Route path="/admin/token-data-control" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading Token Data Control Center..." />}><TokenDataControlCenter /></Suspense></AdminRoute>} />
          <Route path="/admin" element={<AdminRoute><Suspense fallback={<LoadingFallback />}><AdminDashboard /></Suspense></AdminRoute>} />
          <Route path="/admin/wallet-dashboard" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading Admin Wallet Dashboard..." />}><AdminWalletDashboard /></Suspense></AdminRoute>} />
          <Route path="/admin/ip-ban" element={<AdminRoute><Suspense fallback={<LoadingFallback />}><IpBanManagementPage /></Suspense></AdminRoute>} />
          <Route path="/admin/vanity-wallets" element={<AdminRoute><Suspense fallback={<LoadingFallback />}><VanityWalletManagementPage /></Suspense></AdminRoute>} />
          <Route path="/admin/contest-management/regenerate-image/:contestId" element={<AdminRoute><Suspense fallback={<LoadingFallback />}><ContestImageGeneratorPage /></Suspense></AdminRoute>} />
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
          <Route path="/wss-playground" element={<SuperAdminRoute><Suspense fallback={<LoadingFallback />}><WssPlayground /></Suspense></SuperAdminRoute>} />
          <Route path="/admin/ai-testing" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading AI Testing..." />}><AiTesting /></Suspense></AdminRoute>} />
          <Route path="/admin/wallet-monitoring" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading Wallet Monitoring..." />}><WalletMonitoring /></Suspense></AdminRoute>} />
          <Route path="/admin/liq-sim" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading Liquidity Simulator..." />}><LiquiditySimulatorPage /></Suspense></AdminRoute>} />
          <Route path="/admin/token-sync-test" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading Token Sync Test..." />}><TokenSyncTest /></Suspense></AdminRoute>} />
          <Route path="/admin/api-testing" element={<AdminRoute><Suspense fallback={<LoadingFallback variant="default" message="Loading API Testing Dashboard..." />}><ApiTestingPage /></Suspense></AdminRoute>} />
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
          size="middle"
      />

      {/* Footer */}
      <Footer />

      {/* Smart Performance Toggle - DISABLED - was causing users to get stuck in low FPS mode */}
      {/* <SmartPerformanceToggle /> */}

      {/* Invite Welcome Modal */}
      <InviteWelcomeModal />

      {/* Blink Resolver */}
      <BlinkResolver />

      {/* Achievement Notification (?) */}
      <AchievementNotification />

      {/* Notification Debug Panel */}
      {user && (user as any).is_superadmin && <NotificationDebugPanel />}

      {/* Connection error banners aligned to the top of the screen */}
      {/*
      {createPortal(
        <div 
          className={`fixed left-1/2 -translate-x-1/2 w-auto max-w-xs sm:max-w-sm md:max-w-md z-[60] pointer-events-none space-y-2`} 
          style={
            { top: `${totalOffset / 4 + 1}rem`}
            }>
        
          <AnimatePresence>
                       
            {notificationsError && showNotificationErrorBanner && (
              <motion.div
                key="app-notification-error-banner"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 0.9, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="bg-dark-300/80 backdrop-blur-md text-orange-300 text-xs font-medium px-3 py-2 rounded-lg shadow-2xl border border-orange-600/50 pointer-events-auto flex items-center justify-between gap-2"
              >
                <AlertTriangle size={16} className="text-orange-400 flex-shrink-0"/>

                <span>

                  <strong className="font-semibold">
                    Warning: 
                  </strong> 
                
                  {getErrorMessage(notificationsError)}
                </span>

                <button 
                  onClick={() => setShowNotificationErrorBanner(false)} 
                  className="p-1 rounded-full hover:bg-orange-400/20 transition-colors flex-shrink-0"
                  title="Dismiss notification error"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}


            {systemSettingsError && showSystemSettingsErrorBanner && (
              <motion.div
                key="app-system-settings-error-banner"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: (notificationsError && showNotificationErrorBanner) ? 0.1 : 0 } }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="bg-dark-300/80 backdrop-blur-md text-red-400 text-xs font-medium px-3 py-2 rounded-lg shadow-2xl border border-red-600/50 pointer-events-auto flex items-center justify-between gap-2"
              >

                <SettingsIcon 
                  size={16} 
                  className="text-red-400 flex-shrink-0" 
                /> 

                <span>
                  <strong className="font-semibold">
                    Error: 
                  </strong> 
                  
                  {getErrorMessage(systemSettingsError)}

                </span>

                <button 
                  onClick={() => setShowSystemSettingsErrorBanner(false)} 
                  className="p-1 rounded-full hover:bg-red-400/20 transition-colors flex-shrink-0"
                  title="Dismiss system settings error"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}

          </AnimatePresence>
          
        </div>,

        // Render the banners in the document body
        document.body
      )}
      */}

    </div>
  );
};