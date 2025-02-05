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
import { AdminRoute } from "./components/routes/AdminRoute";
import { AuthenticatedRoute } from "./components/routes/AuthenticatedRoute";
import { MaintenanceGuard } from "./components/routes/MaintenanceGuard";
import { SuperAdminRoute } from "./components/routes/SuperAdminRoute";
import { MovingBackground } from "./components/ui/MovingBackground";
/* Pages */
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { LiveContest } from "./pages/authenticated/LiveContest"; // shouldn't this be public?
import { Profile } from "./pages/authenticated/Profile";
import { Results } from "./pages/authenticated/Results";
import { TokenSelection } from "./pages/authenticated/TokenSelection";
import { ContestBrowser } from "./pages/public/ContestBrowserPage";
import { ContestDetails } from "./pages/public/ContestDetailPage";
import { Contact } from "./pages/public/general/Contact";
import { FAQ } from "./pages/public/general/FAQ";
import { HowItWorks } from "./pages/public/general/HowItWorks";
import { LandingPage } from "./pages/public/LandingPage";
import { ContestPerformance } from "./pages/public/leaderboards/ContestPerformanceRankings";
import { GlobalRankings } from "./pages/public/leaderboards/GlobalRankings";
import { TokensPage } from "./pages/public/TokensPage";
import { SuperAdminDashboard } from "./pages/superadmin/SuperAdminDashboard";
import { TestPage } from "./pages/superadmin/TestPage";
/* some superadmin pages */
import AmmSim from "./pages/superadmin/AmmSim";
import ApiPlayground from "./pages/superadmin/ApiPlayground";
/* some extra pages */
import { BannedIP } from "./pages/other/BannedIP";
import { BannedUser } from "./pages/other/BannedUser";
import { Maintenance } from "./pages/other/Maintenance";
import { NotFound } from "./pages/other/NotFound";
/* styles */
import "./styles/color-schemes.css";

// Test HMR
//console.log("[Debug] Testing HMR - " + new Date().toISOString());

export const App: React.FC = () => {
  const { checkAuth } = useAuth();

  useEffect(() => {
    // Check auth every 30 seconds
    const authCheckInterval = setInterval(checkAuth, 1 * 30 * 1000);

    // Also check when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAuth();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(authCheckInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkAuth]);

  return (
    <Router>
      {/* Parent Container */}
      <div className="min-h-screen flex flex-col relative">
        {/* Animated Background */}
        <MovingBackground />

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

            {/* How It Works */}
            <Route path="/how-it-works" element={<HowItWorks />} />

            {/* FAQ */}
            <Route path="/faq" element={<FAQ />} />

            {/* Contact */}
            <Route path="/contact" element={<Contact />} />

            {/* Global Rankings */}
            <Route path="/rankings/global" element={<GlobalRankings />} />

            {/* Contest Performance */}
            <Route
              path="/rankings/performance"
              element={<ContestPerformance />}
            />

            {/* AUTHENTICATED ROUTES - Wrap with MaintenanceGuard */}

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <AuthenticatedRoute>
                  <MaintenanceGuard>
                    <Profile />
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

            {/* Live Contest Page */}
            <Route
              path="/contests/:id/live"
              element={
                <AuthenticatedRoute>
                  <MaintenanceGuard>
                    <LiveContest />
                  </MaintenanceGuard>
                </AuthenticatedRoute>
              }
            />

            {/* Contest Results Page */}
            <Route
              path="/contests/:id/results"
              element={
                <AuthenticatedRoute>
                  <MaintenanceGuard>
                    <Results />
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
