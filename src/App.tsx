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
import { DebugPanel } from "./components/debug/DebugPanel";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { ServiceStatusBanner } from "./components/layout/ServiceStatusBanner";
import { AdminRoute } from "./components/routes/AdminRoute";
import { AuthenticatedRoute } from "./components/routes/AuthenticatedRoute";
import { MaintenanceGuard } from "./components/routes/MaintenanceGuard";
import { SuperAdminRoute } from "./components/routes/SuperAdminRoute";
import { MovingBackground } from "./components/ui/MovingBackground";
/* Pages */
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { TokenSelection } from "./pages/authenticated/PortfolioTokenSelectionPage";
import { Profile } from "./pages/authenticated/ProfilePage";
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
import { ServiceControlPage } from "./pages/superadmin/ServiceControlPage";
import { SuperAdminDashboard } from "./pages/superadmin/SuperAdminDashboard";
import { TestPage } from "./pages/superadmin/TestPage";
/* some extra pages */
import { BannedIP } from "./pages/public/general/BannedIP";
import { BannedUser } from "./pages/public/general/BannedUser";
import { Maintenance } from "./pages/public/general/Maintenance";
import { NotFound } from "./pages/public/general/NotFound";
import { PublicProfilePage } from "./pages/public/general/PublicProfilePage";
/* some extra superadmin pages */
import { ReferralPage } from "./pages/authenticated/ReferralPage";
import AmmSim from "./pages/superadmin/AmmSim";
import ApiPlayground from "./pages/superadmin/ApiPlayground";
/* themes */
import "./styles/color-schemes.css";

// Test HMR
//console.log("[Debug] Testing HMR - " + new Date().toISOString());

export const App: React.FC = () => {
  const { checkAuth } = useAuth();

  useEffect(() => {
    // Check auth every 10 seconds in production, 30 in development
    const checkInterval = import.meta.env.PROD ? 10 * 1000 : 30 * 1000;
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
      {/* Parent Container */}
      <div className="min-h-screen flex flex-col relative">
        {/* Animated Background */}
        <MovingBackground />

        {/* Service Status Banner */}
        <ServiceStatusBanner />

        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1 relative">
          {/* Routes */}
          <Routes>
            {/* PUBLIC ROUTES */}

            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Tokens Page */}
            <Route path="/tokens" element={<TokensPage />} />

            {/* Contest Browser */}
            <Route path="/contests" element={<ContestBrowser />} />

            {/* Contest Details */}
            <Route path="/contests/:id" element={<ContestDetails />} />

            {/* Contest Lobby */}
            <Route
              path="/contests/:id/live"
              element={
                <AuthenticatedRoute>
                  <MaintenanceGuard>
                    <ContestLobby />
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
                    <ContestResults />
                  </MaintenanceGuard>
                </AuthenticatedRoute>
              }
            />

            {/* Global Rankings Leaderboard */}
            <Route path="/rankings/global" element={<GlobalRankings />} />

            {/* Degen Rankings Leaderboard */}
            <Route
              path="/rankings/performance"
              element={<ContestPerformance />}
            />

            {/* How It Works */}
            <Route path="/how-it-works" element={<HowItWorks />} />

            {/* FAQ */}
            <Route path="/faq" element={<FAQ />} />

            {/* Contact */}
            <Route path="/contact" element={<Contact />} />

            {/* Public Routes */}
            <Route
              path="/profile/:identifier"
              element={<PublicProfilePage />}
            />

            {/* AUTHENTICATED ROUTES - Wrap with MaintenanceGuard */}

            {/* Profile */}
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

            {/* Services Control Panel*/}
            <Route
              path="/superadmin/services"
              element={
                <SuperAdminRoute>
                  <ServiceControlPage />
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

            {/* API Playground */}
            <Route
              path="/api-playground"
              element={
                <SuperAdminRoute>
                  <ApiPlayground />
                </SuperAdminRoute>
              }
            />

            {/* Test Page */}
            <Route
              path="/test"
              element={
                <SuperAdminRoute>
                  <TestPage />
                </SuperAdminRoute>
              }
            />

            {/* OTHER ROUTES */}

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
        <DebugPanel />

        {/* Toast Container */}
        <ToastContainer />

        {/* Toaster */}
        <Toaster />
      </div>
    </Router>
  );
};
