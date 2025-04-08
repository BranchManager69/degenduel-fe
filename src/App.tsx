// src/App.tsx

/**
 * Main entry point for the DegenDuel frontend.
 * 
 * @author @BranchManager69
 * @since 2025-04-02
 */

import React, { lazy, Suspense, useEffect } from "react";
/* Router */
import {
    Navigate,
    Route,
    BrowserRouter as Router,
    Routes,
    useLocation,
} from "react-router-dom";

// Helper component to redirect while preserving query parameters
const PreserveQueryParamsRedirect = ({ to }: { to: string }) => {
  const location = useLocation();
  // Preserve all query parameters by appending the search string to the destination
  return <Navigate to={`${to}${location.search}`} replace />;
};

/* Components */
// WebSocketManager is now provided by WebSocketProvider
import { AchievementNotification } from "./components/achievements/AchievementNotification";
import { BlinkResolver } from "./components/blinks/BlinkResolver";
import { ContestChatManager } from "./components/contest-chat/ContestChatManager";
import { GameDebugPanel } from "./components/debug/game/GameDebugPanel";
import { ServiceDebugPanel } from "./components/debug/ServiceDebugPanel";
import { UiDebugPanel } from "./components/debug/ui/UiDebugPanel";
import { EdgeToEdgeTicker } from "./components/layout/EdgeToEdgeTicker";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { ServerDownBanner } from "./components/layout/ServerDownBanner";
import { InviteWelcomeModal } from "./components/modals/InviteWelcomeModal";
import { AdminRoute } from "./components/routes/AdminRoute";
import { AuthenticatedRoute } from "./components/routes/AuthenticatedRoute";
import { MaintenanceGuard } from "./components/routes/MaintenanceGuard";
import { SuperAdminRoute } from "./components/routes/SuperAdminRoute";
import { ToastContainer, ToastListener, ToastProvider } from "./components/toast";
import { MovingBackground } from "./components/ui/MovingBackground";
/* Contexts */
import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import { AuthProvider } from "./contexts/AuthContext";
import { PrivyAuthProvider } from "./contexts/PrivyAuthContext";
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
import IpBanManagementPage from "./pages/admin/ip-ban/IpBanManagementPage";
import LogForwarderDebug from "./pages/admin/LogForwarderDebug";
import { SkyDuelPage } from "./pages/admin/SkyDuelPage";
import { SystemReports } from "./pages/admin/SystemReports";
import VanityWalletManagementPage from "./pages/admin/VanityWalletManagementPage";
import WebSocketHub from "./pages/admin/WebSocketHub";
import { ReferralPage } from "./pages/authenticated/AffiliatePage";
import MyContestsPage from "./pages/authenticated/MyContestsPage";
import MyPortfoliosPage from "./pages/authenticated/MyPortfoliosPage";
import NotificationsPage from "./pages/authenticated/NotificationsPage";
import { TokenSelection } from "./pages/authenticated/PortfolioTokenSelectionPage";
import { PrivateProfilePage } from "./pages/authenticated/PrivateProfilePage";
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
import { ContestPerformance } from "./pages/public/leaderboards/ContestPerformanceRankings";
import { DegenLevelPage } from "./pages/public/leaderboards/DegenLevelPage";
import { GlobalRankings } from "./pages/public/leaderboards/GlobalRankings";
import { LeaderboardLanding } from "./pages/public/leaderboards/LeaderboardLanding";
import { TokensPage } from "./pages/public/tokens/TokensPage";
// import { TokenWhitelistPage } from "./pages/public/tokens/whitelist"; // Commented out 2025-04-05 - Page hidden
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
import { WalletProvider } from "@jup-ag/wallet-adapter";
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { env } from "./config/env";
import WebSocketAPIPage from "./pages/public/WebSocketAPIPage";

// Lazy AdminChatDashboard
const AdminChatDashboard = lazy(
  () => import("./pages/admin/AdminChatDashboard"),
);

// App entry
export const App: React.FC = () => {
  // Get the auth checker from the auth context
  const { checkAuth } = useAuth();  
  // Get the user from the store
  const { user } = useStore();
  
  // Create wallet adapters for both Jupiter wallet and Solana wallet adapter
  const walletAdapters = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter()
  ];
  
  // Complete configuration for Solana wallet adapter
  const walletConfigSolana = {
    wallets: walletAdapters,
    autoConnect: false
  };
  
  // Initialize scrollbar visibility
  useScrollbarVisibility();

  useEffect(() => {
    // Always validate auth on startup, regardless of stored user state
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
          //   TODO: Does this log the user out of ALL the possible authentication methods?
          useStore.getState().disconnectWallet();
        }
      }
    };

    /* Auth checks */

    // Run validation immediately on page load
    validateAuth();

    // Set up regular auth checks (1 minute in production, 30 seconds in development)
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
  }, [checkAuth, user]);

  // Privy configuration
  const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || '';
  const privyConfig: PrivyClientConfig = {
    loginMethods: [
      'email',
      'wallet',
      'google',
      'twitter',
      'sms',
      'passkey',
    ],
    appearance: {
      theme: 'dark',
      accentColor: '#5865F2',
    },
  };      

  // Create a connection to use with Solana wallet adapter - using official Solana cluster API
  const solanaEndpoint = clusterApiUrl('mainnet-beta');
  
  // DegenDuel entry
  return (
    <Router>
      <ConnectionProvider endpoint={solanaEndpoint}>
        <SolanaWalletProvider {...walletConfigSolana}>
          {env.USE_JUPITER_WALLET && typeof window !== 'undefined' && window.hasOwnProperty('solana') ? (
            // With Jupiter WalletProvider - only if env flag is true AND window.solana exists
            <WalletProvider 
              wallets={walletAdapters}
              autoConnect={false}
            >
              <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
            <PrivyAuthProvider>
              <AuthProvider>
                <TwitterAuthProvider>
                  <InviteSystemProvider>
                    <AffiliateSystemProvider>
                      <WebSocketProvider>
                        <TokenDataProvider>
                          <ToastProvider>
                            <div className="min-h-screen flex flex-col">
                              <ToastListener />
                              {user?.is_superadmin && <UiDebugPanel />}
                              {user?.is_superadmin && <ServiceDebugPanel />}
                              {user?.is_superadmin && <GameDebugPanel />}
                              <MovingBackground />
                              <Header />
                              <EdgeToEdgeTicker />
                              <ServerDownBanner />
                              <main className="flex-1 pb-12">
                                <Routes>
                                  <Route path="/" element={<LandingPage />} />
                                  <Route
                                    path="/join"
                                    element={<PreserveQueryParamsRedirect to="/" />}
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
                                        <TokensPage />
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
                                        <Suspense fallback={<div>Loading...</div>}>
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
                                    path="/admin/chat-dashboard"
                                    element={
                                      <AdminRoute>
                                        <Suspense fallback={<div>Loading...</div>}>
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
                                        <Suspense fallback={<div>Loading...</div>}>
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
                                        <Suspense fallback={<div>Loading...</div>}>
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
                                        <Suspense fallback={<div>Loading...</div>}>
                                          <AiTesting />
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
                                  <Route path="/blinks/*" element={<></>} />
                                  <Route path="/websocket-api" element={<MaintenanceGuard><WebSocketAPIPage /></MaintenanceGuard>} />
                                  <Route path="*" element={<NotFound />} />
                                  <Route path="/banned" element={<BannedUser />} />
                                  <Route path="/banned-ip" element={<BannedIP />} />
                                  <Route path="/maintenance" element={<Maintenance />} />
                                  <Route path="/examples/contest-chat" element={
                                    <Suspense fallback={<div>Loading...</div>}>
                                      <ContestChatExample />
                                    </Suspense>
                                  } />
                                </Routes>
                              </main>
                              <Footer />
                              {user && <ContestChatManager />}
                              <AchievementNotification />
                              <InviteWelcomeModal />
                              <BlinkResolver />
                              <ToastContainer />
                            </div>
                          </ToastProvider>
                        </TokenDataProvider>
                      </WebSocketProvider>
                    </AffiliateSystemProvider>
                  </InviteSystemProvider>
                </TwitterAuthProvider>
              </AuthProvider>
            </PrivyAuthProvider>
          </PrivyProvider>
        </WalletProvider>
      ) : (
        // Without WalletProvider (original structure)
        <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
          <PrivyAuthProvider>
            <AuthProvider>
              <TwitterAuthProvider>
                <InviteSystemProvider>
                  <AffiliateSystemProvider>
                    <WebSocketProvider>
                      <TokenDataProvider>
                        <ToastProvider>
                          <div className="min-h-screen flex flex-col">
                            <ToastListener />
                            {user?.is_superadmin && <UiDebugPanel />}
                            {user?.is_superadmin && <ServiceDebugPanel />}
                            {user?.is_superadmin && <GameDebugPanel />}
                            <MovingBackground />
                            <Header />
                            <EdgeToEdgeTicker />
                            <ServerDownBanner />
                            <main className="flex-1 pb-12">
                              <Routes>
                                <Route path="/" element={<LandingPage />} />
                                <Route
                                  path="/join"
                                  element={<PreserveQueryParamsRedirect to="/" />}
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
                                      <TokensPage />
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
                                      <Suspense fallback={<div>Loading...</div>}>
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
                                  path="/admin/chat-dashboard"
                                  element={
                                    <AdminRoute>
                                      <Suspense fallback={<div>Loading...</div>}>
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
                                      <Suspense fallback={<div>Loading...</div>}>
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
                                      <Suspense fallback={<div>Loading...</div>}>
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
                                      <Suspense fallback={<div>Loading...</div>}>
                                        <AiTesting />
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
                                <Route path="/blinks/*" element={<></>} />
                                <Route path="/websocket-api" element={<MaintenanceGuard><WebSocketAPIPage /></MaintenanceGuard>} />
                                <Route path="*" element={<NotFound />} />
                                <Route path="/banned" element={<BannedUser />} />
                                <Route path="/banned-ip" element={<BannedIP />} />
                                <Route path="/maintenance" element={<Maintenance />} />
                                <Route path="/examples/contest-chat" element={
                                  <Suspense fallback={<div>Loading...</div>}>
                                    <ContestChatExample />
                                  </Suspense>
                                } />
                              </Routes>
                            </main>
                            <Footer />
                            {user && <ContestChatManager />}
                            <AchievementNotification />
                            <InviteWelcomeModal />
                            <BlinkResolver />
                            <ToastContainer />
                          </div>
                        </ToastProvider>
                      </TokenDataProvider>
                    </WebSocketProvider>
                  </AffiliateSystemProvider>
                </InviteSystemProvider>
              </TwitterAuthProvider>
            </AuthProvider>
          </PrivyAuthProvider>
        </PrivyProvider>
      )}
        </SolanaWalletProvider>
      </ConnectionProvider>
    </Router>
  );
};
