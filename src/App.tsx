// src/App.tsx

import React, { lazy, useEffect } from "react";
/* Router */
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
/* Toast */
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
/* Hooks */
import { useAuth } from "./hooks/useAuth";
import { useStore } from "./store/useStore";
/* Components */
import { WebSocketManager } from "./components/core/WebSocketManager";
import { GameDebugPanel } from "./components/debug/game/GameDebugPanel";
import { ServiceDebugPanel } from "./components/debug/ServiceDebugPanel";
import { UiDebugPanel } from "./components/debug/ui/UiDebugPanel";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { ServerDownBanner } from "./components/layout/ServerDownBanner";
import { ReferralWelcomeModal } from "./components/modals/ReferralWelcomeModal";
import { AdminRoute } from "./components/routes/AdminRoute";
import { AuthenticatedRoute } from "./components/routes/AuthenticatedRoute";
import { MaintenanceGuard } from "./components/routes/MaintenanceGuard";
import { SuperAdminRoute } from "./components/routes/SuperAdminRoute";
import { MovingBackground } from "./components/ui/MovingBackground";
import { ReferralProvider } from "./hooks/useReferral";
/* Contexts */
import { TokenDataProvider } from "./contexts/TokenDataContext";
/* Pages */
import { AchievementNotification } from "./components/achievements/AchievementNotification";
import { ContestChatManager } from "./components/contest-chat/ContestChatManager";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AiTesting } from "./pages/admin/AiTesting";
import { ConnectionDebugger } from "./pages/admin/ConnectionDebugger";
import { SkyDuelPage } from "./pages/admin/SkyDuelPage";
import { SystemReports } from "./pages/admin/SystemReports";
import WebSocketHub from "./pages/admin/WebSocketHub";
import { TokenSelection } from "./pages/authenticated/PortfolioTokenSelectionPage";
import { Profile } from "./pages/authenticated/PrivateProfilePage";
import { ReferralPage } from "./pages/authenticated/ReferralPage";
import NotificationsPage from "./pages/authenticated/NotificationsPage";
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
import { Maintenance } from "./pages/public/general/Maintenance";
import { NotFound } from "./pages/public/general/NotFound";
import { PublicProfile } from "./pages/public/general/PublicProfile";
import { ContestPerformance } from "./pages/public/leaderboards/ContestPerformanceRankings";
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
import "./styles/color-schemes.css";

// Test HMR
//console.log("[Debug] Testing HMR - " + new Date().toISOString());
const AdminChatDashboard = lazy(
  () => import("./pages/admin/AdminChatDashboard")
);

export const App: React.FC = () => {
  const { checkAuth } = useAuth();
  const { user } = useStore();

  useEffect(() => {
    // Only set up auth checks if we don't have a user
    if (!user) {
      // Check auth every 60 seconds in production, 30 in development
      const checkInterval = import.meta.env.PROD ? 60 * 1000 : 30 * 1000;
      const authCheckInterval = setInterval(checkAuth, checkInterval);

      // Debounced handlers for visibility and online status
      let visibilityTimeout: NodeJS.Timeout;
      let onlineTimeout: NodeJS.Timeout;

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible" && !user) {
          // Clear any existing timeout
          clearTimeout(visibilityTimeout);
          // Wait 2 seconds before checking auth
          visibilityTimeout = setTimeout(checkAuth, 2000);
        }
      };

      const handleOnlineStatus = () => {
        if (navigator.onLine && !user) {
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
          handleVisibilityChange
        );
        window.removeEventListener("online", handleOnlineStatus);
      };
    }
  }, [checkAuth, user]);

  return (
    <Router>
      <ReferralProvider>
        <TokenDataProvider>
          <div className="min-h-screen flex flex-col relative">
            {/* Add WebSocketManager at the root */}
            <WebSocketManager />

            {/* Debug Panels */}
            {user?.is_superadmin && <UiDebugPanel />}
            {user?.is_superadmin && <ServiceDebugPanel />}
            {user?.is_superadmin && <GameDebugPanel />}

            {/* CSS-based animated background - lightweight so we can keep this enabled */}
            <MovingBackground />

            {/* Server Down Banner */}
            <ServerDownBanner />
            {/* Service Status Banner (MOVED) */}
            {/* <ServiceStatusBanner /> */}

            {/* Header */}
            <Header />

            {/* Main Content */}
            <main className="flex-1 relative">
              {/* Routes */}
              <Routes>
                {/* PUBLIC ROUTES */}

                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* Referral Join Route */}
                {/*     Redirects to landing page; this is part of referral links before stripping the referral code and /join from the URL. When the user clicks on a referral link and accesses /join (as opposed to navigating to the landing page directly), the user will be presented with a Welcome modal atop the landing page in which they are given the opportunity to connect their wallet (a.k.a. register) which immediately credits the referrer with the appropriate referral benefits. */}
                <Route path="/join" element={<Navigate to="/" replace />} />

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

                {/* NOTE: We need to overhaul Leaderboards. We totally ignore the LEVEL SYSTEM!!! XP!!! ACHIEVEMENTS!!! */}

                {/* Leaderboards Landing Page */}
                <Route path="/leaderboards" element={<LeaderboardLanding />} />

                {/* "Degen Rankings" Leaderboard */}
                <Route
                  path="/rankings/performance"
                  element={<ContestPerformance />}
                />

                {/* "Global Rankings" Leaderboard */}
                <Route path="/rankings/global" element={<GlobalRankings />} />

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

                {/* Super Admin Chat Example - REPLACED with unified AdminChatDashboard */}
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

                {/* Admin Chat Dashboard - Accessible to both admins and superadmins */}
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

                {/* Services Control Panel - DEPRECATED: Use SkyDuel instead */}
                <Route
                  path="/superadmin/services"
                  element={
                    <SuperAdminRoute>
                      <ServiceControlPage />
                    </SuperAdminRoute>
                  }
                />

                {/* Service Switchboard - DEPRECATED: Use SkyDuel instead */}
                <Route
                  path="/superadmin/switchboard"
                  element={
                    <SuperAdminRoute>
                      <ServiceSwitchboard />
                    </SuperAdminRoute>
                  }
                />

                {/* Circuit Breaker Panel - DEPRECATED: Use SkyDuel Circuit View instead */}
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

                {/* Legacy route for backward compatibility */}
                <Route
                  path="/superadmin/websocket-monitor"
                  element={
                    <Navigate to="/superadmin/service-command-center" replace />
                  }
                />

                {/* API Playground */}
                <Route
                  path="/api-playground"
                  element={
                    <SuperAdminRoute>
                      <ApiPlayground />
                    </SuperAdminRoute>
                  }
                />

                {/* WSS Playground */}
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

                {/* Legacy routes for backward compatibility */}
                <Route
                  path="/websocket-test"
                  element={<Navigate to="/connection-debugger" replace />}
                />
                <Route
                  path="/websocket-dashboard"
                  element={<Navigate to="/connection-debugger" replace />}
                />

                {/* AMM Simulation */}
                <Route
                  path="/amm-sim"
                  element={
                    <SuperAdminRoute>
                      <AmmSim />
                    </SuperAdminRoute>
                  }
                />

                {/* MISC ROUTES */}

                {/* 404 Page */}
                <Route path="*" element={<NotFound />} />
                {/* Banned User */}
                <Route path="/banned" element={<BannedUser />} />
                {/* Banned IP */}
                <Route path="/banned-ip" element={<BannedIP />} />
                {/* Maintenance Mode */}
                <Route path="/maintenance" element={<Maintenance />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />

            {/* Contest Chat Manager - Only show for authenticated users */}
            {user && <ContestChatManager />}

            {/* Modals and Overlays */}
            <ReferralWelcomeModal />

            {/* Toast Notifications */}
            <Toaster position="top-right" />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />

            <AchievementNotification />
          </div>
        </TokenDataProvider>
      </ReferralProvider>
    </Router>
  );
};
