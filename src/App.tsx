// src/App.tsx

import React, { lazy, useEffect } from "react";
/* Router */
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
// Example pages
import ContestChatExample from "./pages/examples/ContestChatExample";

// Helper component to redirect while preserving query parameters
const PreserveQueryParamsRedirect = ({ to }: { to: string }) => {
  const location = useLocation();
  // Preserve all query parameters by appending the search string to the destination
  return <Navigate to={`${to}${location.search}`} replace />;
};
/* Toast - New Unified System */
/* Hooks */
/* Components */
import { AchievementNotification } from "./components/achievements/AchievementNotification";
import { ContestChatManager } from "./components/contest-chat/ContestChatManager";
// WebSocketManager is now provided by WebSocketProvider
import { GameDebugPanel } from "./components/debug/game/GameDebugPanel";
import { ServiceDebugPanel } from "./components/debug/ServiceDebugPanel";
import { UiDebugPanel } from "./components/debug/ui/UiDebugPanel";
import { EdgeToEdgeTicker } from "./components/layout/EdgeToEdgeTicker";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { ServerDownBanner } from "./components/layout/ServerDownBanner";
import { ReferralWelcomeModal } from "./components/modals/ReferralWelcomeModal";
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
/* WebSocket */
// Import WebSocketManager from the unified WebSocket system
import { WebSocketManager } from './hooks/websocket';
/* Hooks */
import { useAuth } from "./hooks/useAuth";
import { ReferralProvider } from "./hooks/useReferral";
import { useScrollbarVisibility } from "./hooks/useScrollbarVisibility";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AiTesting } from "./pages/admin/AiTesting";
import { ConnectionDebugger } from "./pages/admin/ConnectionDebugger";
import IpBanManagementPage from "./pages/admin/ip-ban/IpBanManagementPage";
import LogForwarderDebug from "./pages/admin/LogForwarderDebug";
import { SkyDuelPage } from "./pages/admin/SkyDuelPage";
import ClientErrorsPage from "./pages/admin/ClientErrorsPage";
import { SystemReports } from "./pages/admin/SystemReports";
import WebSocketHub from "./pages/admin/WebSocketHub";
import MyContestsPage from "./pages/authenticated/MyContestsPage";
import MyPortfoliosPage from "./pages/authenticated/MyPortfoliosPage";
import NotificationsPage from "./pages/authenticated/NotificationsPage";
import { TokenSelection } from "./pages/authenticated/PortfolioTokenSelectionPage";
import { Profile } from "./pages/authenticated/PrivateProfilePage";
import { ReferralPage } from "./pages/authenticated/ReferralPage";
import { ContestBrowser } from "./pages/public/contests/ContestBrowserPage";
import { ContestDetails } from "./pages/public/contests/ContestDetailPage";
import { ContestLobby } from "./pages/public/contests/ContestLobbyPage";
import { ContestResults } from "./pages/public/contests/ContestResultsPage";
import { VirtualAgentPage } from "./pages/public/game/VirtualAgent";
import { BannedIP } from "./pages/public/general/BannedIP";
import { BannedUser } from "./pages/public/general/BannedUser";
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
import { TokenWhitelistPage } from "./pages/public/tokens/whitelist";
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

// Test HMR
//console.log("[Debug] Testing HMR - " + new Date().toISOString());
const AdminChatDashboard = lazy(
  () => import("./pages/admin/AdminChatDashboard"),
);

export const App: React.FC = () => {
  const { checkAuth } = useAuth();
  const { user } = useStore();
  
  // Initialize scrollbar visibility
  useScrollbarVisibility();

  useEffect(() => {
    // Always validate auth on startup, regardless of stored user state
    const validateAuth = async () => {
      console.log("[Auth] Validating authentication status on app startup");
      try {
        await checkAuth();
      } catch (error) {
        console.error("[Auth] Failed to validate authentication:", error);
        // If validation fails and we have a stored user, clear it
        if (user) {
          console.log("[Auth] Stored user found but validation failed, logging out");
          useStore.getState().disconnectWallet();
        }
      }
    };

    // Run validation immediately on page load
    validateAuth();

    // Set up regular auth checks
    const checkInterval = import.meta.env.PROD ? 60 * 1000 : 30 * 1000;
    const authCheckInterval = setInterval(checkAuth, checkInterval);

    // Debounced handlers for visibility and online status
    let visibilityTimeout: NodeJS.Timeout;
    let onlineTimeout: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Clear any existing timeout
        clearTimeout(visibilityTimeout);
        // Wait 2 seconds before checking auth
        visibilityTimeout = setTimeout(checkAuth, 2000);
      }
    };

    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        // Clear any existing timeout
        clearTimeout(onlineTimeout);
        // Wait 2 seconds before checking auth
        onlineTimeout = setTimeout(checkAuth, 2000);
      }
    };

    // Add event listeners for auth checks
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnlineStatus);

    // Cleanup
    return () => {
      clearInterval(authCheckInterval);
      clearTimeout(visibilityTimeout);
      clearTimeout(onlineTimeout);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      window.removeEventListener("online", handleOnlineStatus);
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

  return (
    <Router>
      {/* Privy SDK Provider */}
      <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
        {/* Our Privy Auth Provider that integrates with our backend */}
        <PrivyAuthProvider>
          {/* Auth Provider */}
          <AuthProvider>
          {/* Referral Provider */}
          <ReferralProvider>
            {/* Token Data Provider */}
            <TokenDataProvider>
                {/* Toast Provider */}
                <ToastProvider>
              {/* Main container */}
              <div className="min-h-screen flex flex-col">
                {/* Unified WebSocketManager - centralized WebSocket connection */}
                <WebSocketManager />
                
                {/* Toast event listener for global toast notifications */}
                <ToastListener />

                {/* Debug Panels (superadmin only) */}
                {user?.is_superadmin && <UiDebugPanel />}
                {user?.is_superadmin && <ServiceDebugPanel />}
                {user?.is_superadmin && <GameDebugPanel />}

                {/* CSS-based animated background (lightweight, keep this enabled) */}
                <MovingBackground />

                {/* Header */}
                <Header />

                {/* Edge-to-Edge Ticker - Full width between header and content */}
                <EdgeToEdgeTicker />

                {/* Server Down Banner */}
                <ServerDownBanner />
                {/* Service Status Banner (MOVED) */}
                {/* <ServiceStatusBanner /> */}

                {/* Main Content */}
                <main className="flex-1 pb-12">
                  {/* Routes */}
                  <Routes>
                    {/* PUBLIC ROUTES */}

                    {/* Landing Page */}
                    <Route path="/" element={<LandingPage />} />

                    {/* Referral Join Route */}
                    {/* Redirects to landing page while preserving query parameters, especially the "ref" parameter
                      When the user clicks on a referral link and accesses /join?ref=CODE (as opposed to navigating
                      to the landing page directly), the user will be presented with a Welcome modal atop the landing
                      page in which they are given the opportunity to connect their wallet (a.k.a. register) which
                      immediately credits the referrer with the appropriate referral benefits. */}
                    <Route
                      path="/join"
                      element={<PreserveQueryParamsRedirect to="/" />}
                    />

                    {/* Contest Browser */}
                    <Route
                      path="/contests"
                      element={
                        <MaintenanceGuard>
                          <ContestBrowser />
                        </MaintenanceGuard>
                      }
                    />

                    {/* Contest Details */}
                    <Route
                      path="/contests/:id"
                      element={
                        <MaintenanceGuard>
                          <ContestDetails />
                        </MaintenanceGuard>
                      }
                    />

                    {/* Contest Lobby (Live Game) */}
                    <Route
                      path="/contests/:id/live"
                      element={
                        <MaintenanceGuard>
                          <ContestLobby />{" "}
                        </MaintenanceGuard>
                      }
                    />

                    {/* Contest Results */}
                    <Route
                      path="/contests/:id/results"
                      element={
                        <MaintenanceGuard>
                          <ContestResults />{" "}
                        </MaintenanceGuard>
                      }
                    />

                    {/* Tokens Page */}
                    <Route
                      path="/tokens"
                      element={
                        <MaintenanceGuard>
                          <TokensPage />
                        </MaintenanceGuard>
                      }
                    />

                    {/* Token Whitelist Page */}
                    <Route
                      path="/tokens/whitelist"
                      element={
                        <MaintenanceGuard>
                          <TokenWhitelistPage />
                        </MaintenanceGuard>
                      }
                    />

                    {/* Virtual Game Agent Page */}
                    <Route
                      path="/game/virtual-agent"
                      element={
                        <MaintenanceGuard>
                          <VirtualAgentPage />
                        </MaintenanceGuard>
                      }
                    />

                    {/* Public Profile Page */}
                    <Route
                      path="/profile/:identifier"
                      element={
                        <MaintenanceGuard>
                          <PublicProfile />
                        </MaintenanceGuard>
                      }
                    />

                    {/* FAQ */}
                    <Route path="/faq" element={<FAQ />} />

                    {/* How It Works */}
                    <Route path="/how-it-works" element={<HowItWorks />} />

                    {/* Contact */}
                    <Route path="/contact" element={<Contact />} />

                    {/* Login Page */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* NOTE: We need to overhaul Leaderboards. We totally ignore the LEVEL SYSTEM!!! XP!!! ACHIEVEMENTS!!! */}

                    {/* Leaderboards Landing Page */}
                    <Route
                      path="/leaderboards"
                      element={<LeaderboardLanding />}
                    />

                    {/* Degen Level Rankings Page - Main entry point for level info */}
                    <Route path="/leaderboard" element={<DegenLevelPage />} />

                    {/* "Degen Rankings" Leaderboard */}
                    <Route
                      path="/rankings/performance"
                      element={<ContestPerformance />}
                    />

                    {/* "Global Rankings" Leaderboard */}
                    <Route
                      path="/rankings/global"
                      element={<GlobalRankings />}
                    />

                    {/* AUTHENTICATED ROUTES */}

                    {/* Profile (own profile) */}
                    <Route
                      path="/me"
                      element={
                        <AuthenticatedRoute>
                          <MaintenanceGuard>
                            <Profile />
                          </MaintenanceGuard>
                        </AuthenticatedRoute>
                      }
                    />

                    {/* Referrals */}
                    {/* NOTE: I really want to change the path to /refer ... but I'm afraid of breaking existing links. */}
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

                    {/* Notifications */}
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

                    {/* My Contests */}
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

                    {/* My Portfolios */}
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

                    {/* Portfolio Token Selection */}
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

                    {/* ADMIN ROUTES */}

                    {/* SkyDuel Service Management */}
                    {/* NOTE: I really want to change the path to /skyduel ... Shouldn't be too hard... */}
                    <Route
                      path="/admin/skyduel"
                      element={
                        <AdminRoute>
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <SkyDuelPage />
                          </React.Suspense>
                        </AdminRoute>
                      }
                    />

                    {/* System Reports */}
                    <Route
                      path="/admin/system-reports"
                      element={
                        <AdminRoute>
                          <SystemReports />
                        </AdminRoute>
                      }
                    />
                    
                    {/* Client Error Management */}
                    <Route
                      path="/admin/client-errors"
                      element={
                        <AdminRoute>
                          <ClientErrorsPage />
                        </AdminRoute>
                      }
                    />

                    {/* Admin Dashboard */}
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      }
                    />

                    {/* SUPERADMIN ROUTES*/}

                    {/* Superadmin Dashboard */}
                    <Route
                      path="/superadmin"
                      element={
                        <SuperAdminRoute>
                          <SuperAdminDashboard />
                        </SuperAdminRoute>
                      }
                    />

                    {/* Wallet Monitoring */}
                    <Route
                      path="/superadmin/wallet-monitoring"
                      element={
                        <SuperAdminRoute>
                          <WalletMonitoring />
                        </SuperAdminRoute>
                      }
                    />

                    {/* Control Panel Hub */}
                    <Route
                      path="/superadmin/control-hub"
                      element={
                        <SuperAdminRoute>
                          <ControlPanelHub />
                        </SuperAdminRoute>
                      }
                    />

                    {/* Super Admin Chat Example */}
                    {/* REPLACED with unified AdminChatDashboard */}
                    <Route
                      path="/superadmin/chat-dashboard"
                      element={
                        <SuperAdminRoute>
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <AdminChatDashboard />
                          </React.Suspense>
                        </SuperAdminRoute>
                      }
                    />

                    {/* IP Ban Management */}
                    <Route
                      path="/admin/ip-ban"
                      element={
                        <AdminRoute>
                          <IpBanManagementPage />
                        </AdminRoute>
                      }
                    />

                    {/* Contest Image Generator */}
                    <Route
                      path="/admin/contest-management/regenerate-image/:contestId"
                      element={
                        <AdminRoute>
                          <div>Contest Image Generator Page</div>
                        </AdminRoute>
                      }
                    />

                    {/* Admin Chat Dashboard */}
                    {/* Accessible to both admins and superadmins */}
                    <Route
                      path="/admin/chat-dashboard"
                      element={
                        <AdminRoute>
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <AdminChatDashboard />
                          </React.Suspense>
                        </AdminRoute>
                      }
                    />

                    {/* Services Control Panel */}
                    {/* DEPRECATED: Use SkyDuel instead */}
                    <Route
                      path="/superadmin/services"
                      element={
                        <SuperAdminRoute>
                          <ServiceControlPage />
                        </SuperAdminRoute>
                      }
                    />

                    {/* Service Switchboard */}
                    {/* DEPRECATED: Use SkyDuel instead */}
                    <Route
                      path="/superadmin/switchboard"
                      element={
                        <SuperAdminRoute>
                          <ServiceSwitchboard />
                        </SuperAdminRoute>
                      }
                    />

                    {/* Circuit Breaker Panel */}
                    {/* DEPRECATED: Use SkyDuel Circuit View instead */}
                    <Route
                      path="/superadmin/circuit-breaker"
                      element={
                        <SuperAdminRoute>
                          <CircuitBreakerPage />
                        </SuperAdminRoute>
                      }
                    />

                    {/* Service Command Center */}
                    <Route
                      path="/superadmin/service-command-center"
                      element={
                        <SuperAdminRoute>
                          <ServiceCommandCenter />
                        </SuperAdminRoute>
                      }
                    />

                    {/* Legacy route to Service Command Center for backward compatibility */}
                    <Route
                      path="/superadmin/websocket-monitor"
                      element={
                        <Navigate
                          to="/superadmin/service-command-center"
                          replace
                        />
                      }
                    />

                    {/* API Playground */}
                    {/* (Mostly deprecated) */}
                    <Route
                      path="/api-playground"
                      element={
                        <SuperAdminRoute>
                          <ApiPlayground />
                        </SuperAdminRoute>
                      }
                    />

                    {/* WSS Playground */}
                    {/* (Don't remember if this is deprecated or not) */}
                    <Route
                      path="/wss-playground"
                      element={
                        <SuperAdminRoute>
                          <WssPlayground />
                        </SuperAdminRoute>
                      }
                    />

                    {/* Connection Debugger */}
                    <Route
                      path="/connection-debugger"
                      element={
                        <AdminRoute>
                          <ConnectionDebugger />
                        </AdminRoute>
                      }
                    />

                    {/* WebSocket Hub - central access point for all WebSocket tools */}
                    {/* (Don't remember if this is deprecated or not) */}
                    <Route
                      path="/websocket-hub"
                      element={
                        <AdminRoute>
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <WebSocketHub />
                          </React.Suspense>
                        </AdminRoute>
                      }
                    />

                    {/* AI Testing Panel */}
                    <Route
                      path="/superadmin/ai-testing"
                      element={
                        <SuperAdminRoute>
                          <React.Suspense fallback={<div>Loading...</div>}>
                            <AiTesting />
                          </React.Suspense>
                        </SuperAdminRoute>
                      }
                    />

                    {/* Legacy routes to Connection Debugger for backward compatibility */}
                    <Route
                      path="/websocket-test"
                      element={<Navigate to="/connection-debugger" replace />}
                    />
                    <Route
                      path="/websocket-dashboard"
                      element={<Navigate to="/connection-debugger" replace />}
                    />

                    {/* AMM Sim */}
                    <Route
                      path="/amm-sim"
                      element={
                        <SuperAdminRoute>
                          <AmmSim />
                        </SuperAdminRoute>
                      }
                    />

                    {/* Client Log Forwarder Debug */}
                    <Route
                      path="/admin/log-forwarder"
                      element={
                        <AdminRoute>
                          <LogForwarderDebug />
                        </AdminRoute>
                      }
                    />

                    {/* MISC ROUTES */}

                    {/* 404 Page */}
                    <Route path="*" element={<NotFound />} />

                    {/* Banned User Page */}
                    <Route path="/banned" element={<BannedUser />} />

                    {/* Banned IP Page */}
                    <Route path="/banned-ip" element={<BannedIP />} />

                    {/* Maintenance Mode Page */}
                    <Route path="/maintenance" element={<Maintenance />} />

                    {/* Examples */}
                    <Route path="/examples/contest-chat" element={
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <ContestChatExample />
                      </React.Suspense>
                    } />
                  </Routes>
                </main>

                {/* Footer */}
                <Footer />

                {/* Contest Chat Manager (authenticated users only) */}
                {user && <ContestChatManager />}

                {/* Modals and Overlays */}
                <ReferralWelcomeModal />

                {/* Toast Notifications now handled by our unified system */}

                {/* Achievement Notification */}
                <AchievementNotification />

                {/* Toast Container */}
                <ToastContainer />
              </div>
            </ToastProvider>
          </TokenDataProvider>
        </ReferralProvider>
      </AuthProvider>
    </PrivyAuthProvider>
    </PrivyProvider>
    </Router>
  );
};
