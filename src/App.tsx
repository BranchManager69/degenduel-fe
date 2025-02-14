// src/App.tsx

import React, { useEffect } from "react";
/* Router */
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
/* Toast */
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
/* Hooks */
import { useAuth } from "./hooks/useAuth";
/* Components */
////import { DebugPanel } from "./components/debug/DebugPanel";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { ServiceStatusBanner } from "./components/layout/ServiceStatusBanner";
import { ReferralWelcomeModal } from "./components/modals/ReferralWelcomeModal";
import { AdminRoute } from "./components/routes/AdminRoute";
import { AuthenticatedRoute } from "./components/routes/AuthenticatedRoute";
import { MaintenanceGuard } from "./components/routes/MaintenanceGuard";
import { SuperAdminRoute } from "./components/routes/SuperAdminRoute";
import { MovingBackground } from "./components/ui/MovingBackground";
import { ReferralProvider } from "./hooks/useReferral";
/* authenticated pages */
import { TokenSelection } from "./pages/authenticated/PortfolioTokenSelectionPage";
import { Profile } from "./pages/authenticated/Profile";
import { ReferralPage } from "./pages/authenticated/ReferralPage";
/* public pages */
import { ContestBrowser } from "./pages/public/contests/ContestBrowserPage";
import { ContestDetails } from "./pages/public/contests/ContestDetailPage";
import { ContestLobby } from "./pages/public/contests/ContestLobbyPage";
import { ContestResults } from "./pages/public/contests/ContestResultsPage";
import { Contact } from "./pages/public/general/Contact";
import { FAQ } from "./pages/public/general/FAQ";
import { HowItWorks } from "./pages/public/general/HowItWorks";
import { LandingPage } from "./pages/public/general/LandingPage";
import { ContestPerformance } from "./pages/public/leaderboards/ContestPerformanceRankings";
import { GlobalRankings } from "./pages/public/leaderboards/GlobalRankings";
import { TokensPage } from "./pages/public/tokens/TokensPage";
/* some extra pages */
import { BannedIP } from "./pages/public/general/BannedIP";
import { BannedUser } from "./pages/public/general/BannedUser";
import { Maintenance } from "./pages/public/general/Maintenance";
import { NotFound } from "./pages/public/general/NotFound";
import { PublicProfile } from "./pages/public/general/PublicProfile";
/* admin pages */
import { AdminDashboard } from "./pages/admin/AdminDashboard";
/* superadmin pages */
import AmmSim from "./pages/superadmin/AmmSim";
import ApiPlayground from "./pages/superadmin/ApiPlayground";
import CircuitBreakerPage from "./pages/superadmin/CircuitBreakerPage";
import { ControlPanelHub } from "./pages/superadmin/ControlPanelHub";
import { ServiceControlPage } from "./pages/superadmin/ServiceControlPage";
import { ServiceSwitchboard } from "./pages/superadmin/ServiceSwitchboard";
import { SuperAdminDashboard } from "./pages/superadmin/SuperAdminDashboard";
import { WssPlayground } from "./pages/superadmin/WssPlayground";
/* themes */
import "./styles/color-schemes.css";

// Test HMR
//console.log("[Debug] Testing HMR - " + new Date().toISOString());

export const App: React.FC = () => {
  const { checkAuth } = useAuth();

  useEffect(() => {
    // (is the sheer amount of auth checks needed?)

    // Check auth every 20 seconds in production, 10 in development
    const checkInterval = import.meta.env.PROD ? 20 * 1000 : 10 * 1000;
    const authCheckInterval = setInterval(checkAuth, checkInterval);

    // Check auth on page load
    checkAuth();

    // Check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAuth();
      }
    };

    // Check when online status changes
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        checkAuth();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnlineStatus);

    // Cleanup
    return () => {
      clearInterval(authCheckInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnlineStatus);
    };
  }, [checkAuth]);

  return (
    <Router>
      <ReferralProvider>
        {/* Parent Container */}
        <div className="min-h-screen flex flex-col relative">
          {/* Animated Background */}
          <MovingBackground />

          {/* Service Status Banner (Moved to Footer) */}
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

              {/* Contest Browser */}
              <Route path="/contests" element={<ContestBrowser />} />

              {/* Tokens Page */}
              <Route path="/tokens" element={<TokensPage />} />

              {/* Contest Details */}
              <Route path="/contests/:id" element={<ContestDetails />} />

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

              {/* Contest Live In-Game Lobby */}
              <Route
                path="/contests/:id/live"
                element={
                  <AuthenticatedRoute>
                    <MaintenanceGuard>
                      <ContestLobby />{" "}
                    </MaintenanceGuard>
                  </AuthenticatedRoute>
                }
              />

              {/* Contest Results */}
              <Route
                path="/contests/:id/results"
                element={
                  <AuthenticatedRoute>
                    <MaintenanceGuard>
                      <ContestResults />{" "}
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

          {/* Debug Panel */}
          {/* <DebugPanel /> */}

          {/* Modals and Overlays */}
          <ReferralWelcomeModal />
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

          {/* Service Status Banner (consider deleting, moving, or reusing for general non-MM server issues) */}
          <ServiceStatusBanner />
        </div>
      </ReferralProvider>
    </Router>
  );
};
