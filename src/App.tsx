// src/App.tsx

import React, { useEffect } from "react";
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
import { ServiceDebugPanel } from "./components/debug/ServiceDebugPanel";
import { UiDebugPanel } from "./components/debug/UiDebugPanel";
import { WebSocketDebugPanel } from "./components/debug/WebSocketDebugPanel";
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
/* Pages */
import { AchievementNotification } from "./components/achievements/AchievementNotification";
import { ContestChatManager } from "./components/contest/ContestChatManager";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { WebSocketTesting } from "./pages/admin/WebSocketTesting";
import { TokenSelection } from "./pages/authenticated/PortfolioTokenSelectionPage";
import { Profile } from "./pages/authenticated/PrivateProfilePage";
import { ReferralPage } from "./pages/authenticated/ReferralPage";
import { ContestBrowser } from "./pages/public/contests/ContestBrowserPage";
import { ContestDetails } from "./pages/public/contests/ContestDetailPage";
import { ContestLobby } from "./pages/public/contests/ContestLobbyPage";
import { ContestResults } from "./pages/public/contests/ContestResultsPage";
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
import { ServiceControlPage } from "./pages/superadmin/ServiceControlPage";
import { ServiceSwitchboard } from "./pages/superadmin/ServiceSwitchboard";
import { SuperAdminDashboard } from "./pages/superadmin/SuperAdminDashboard";
import { WebSocketMonitoringHub } from "./pages/superadmin/WebSocketMonitoringHub";
import { WssPlayground } from "./pages/superadmin/WssPlayground";
import "./styles/color-schemes.css";

// Test HMR
//console.log("[Debug] Testing HMR - " + new Date().toISOString());

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
        <div className="min-h-screen flex flex-col relative">
          {/* Add WebSocketManager at the root */}
          <WebSocketManager />

          {/* Debug Panels */}
          {user?.is_superadmin && <ServiceDebugPanel />}
          {user?.is_superadmin && <UiDebugPanel />}
          {user?.is_superadmin && <WebSocketDebugPanel />}

          {/* Animated Background */}
          <MovingBackground />

          {/* Service Status Banner (consider deleting or moving and reusing for general non-MM server issues) */}
          {/* <ServiceStatusBanner /> */}

          {/* Server Down Banner */}
          <ServerDownBanner />

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
              <Route
                path="/join"
                element={
                  <MaintenanceGuard>
                    <Navigate to="/" replace />
                  </MaintenanceGuard>
                }
              />

              {/* Contest Browser */}
              <Route path="/contests" element={<ContestBrowser />} />

              {/* Contest Details */}
              <Route path="/contests/:id" element={<ContestDetails />} />

              {/* Contest Lobby */}
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
              <Route path="/tokens" element={<TokensPage />} />
              <Route
                path="/tokens/whitelist"
                element={<TokenWhitelistPage />}
              />

              {/* Public Profile Page */}
              <Route path="/profile/:identifier" element={<PublicProfile />} />

              {/* FAQ */}
              <Route
                path="/faq"
                element={
                  <MaintenanceGuard>
                    <FAQ />
                  </MaintenanceGuard>
                }
              />

              {/* How It Works */}
              <Route
                path="/how-it-works"
                element={
                  <MaintenanceGuard>
                    <HowItWorks />
                  </MaintenanceGuard>
                }
              />

              {/* Contact */}
              <Route
                path="/contact"
                element={
                  <MaintenanceGuard>
                    <Contact />
                  </MaintenanceGuard>
                }
              />

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

              {/* Control Panel Hub */}
              <Route
                path="/superadmin/control-hub"
                element={
                  <SuperAdminRoute>
                    <ControlPanelHub />
                  </SuperAdminRoute>
                }
              />

              {/* Services Control Panel - DEPRECATED: Use ServiceSwitchboard instead */}
              <Route
                path="/superadmin/services"
                element={
                  <SuperAdminRoute>
                    <ServiceControlPage />
                  </SuperAdminRoute>
                }
              />

              {/* Service Switchboard - New implementation */}
              <Route
                path="/superadmin/switchboard"
                element={
                  <SuperAdminRoute>
                    <ServiceSwitchboard />
                  </SuperAdminRoute>
                }
              />

              {/* Circuit Breaker Panel */}
              <Route
                path="/superadmin/circuit-breaker"
                element={
                  <SuperAdminRoute>
                    <CircuitBreakerPage />
                  </SuperAdminRoute>
                }
              />

              {/* WebSocket Monitoring Hub */}
              <Route
                path="/superadmin/websocket-monitor"
                element={
                  <SuperAdminRoute>
                    <WebSocketMonitoringHub />
                  </SuperAdminRoute>
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

              {/* WebSocket Testing */}
              <Route
                path="/websocket-test"
                element={
                  <SuperAdminRoute>
                    <WebSocketTesting />
                  </SuperAdminRoute>
                }
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
      </ReferralProvider>
    </Router>
  );
};
