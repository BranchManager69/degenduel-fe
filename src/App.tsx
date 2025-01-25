import React from "react";
import { Toaster } from "react-hot-toast";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DebugPanel } from "./components/debug/DebugPanel";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { AdminRoute } from "./components/routes/AdminRoute";
import { AuthenticatedRoute } from "./components/routes/AuthenticatedRoute";
import { SuperAdminRoute } from "./components/routes/SuperAdminRoute";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Contact } from "./pages/Contact";
import { ContestBrowser } from "./pages/ContestBrowser";
import { ContestDetails } from "./pages/ContestDetails";
import { ContestPerformance } from "./pages/ContestPerformance";
import { FAQ } from "./pages/FAQ";
import { GlobalRankings } from "./pages/GlobalRankings";
import { HowItWorks } from "./pages/HowItWorks";
import { LandingPage } from "./pages/LandingPage";
import { LiveContest } from "./pages/LiveContest";
import { Profile } from "./pages/Profile";
import { Results } from "./pages/Results";
import { SuperAdminDashboard } from "./pages/SuperAdminDashboard";
import { TestPage } from "./pages/TestPage";
import { TokenSelection } from "./pages/TokenSelection";
import "./styles/debug.css";
/* Extra Pages */
// API Playground
import ApiPlayground from "./pages/ApiPlayground";
// AMM Simulation
import AmmSim from "./pages/AmmSim";

// Test HMR
console.log("Testing HMR again - " + new Date().toISOString());

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-dark-100">
        <Header />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/contests" element={<ContestBrowser />} />
            <Route path="/contests/:id" element={<ContestDetails />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/rankings/global" element={<GlobalRankings />} />
            <Route
              path="/rankings/performance"
              element={<ContestPerformance />}
            />

            {/* Authenticated Routes */}
            <Route
              path="/profile"
              element={
                <AuthenticatedRoute>
                  <Profile />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/contests/:id/select-tokens"
              element={
                <AuthenticatedRoute>
                  <TokenSelection />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/contests/:id/live"
              element={
                <AuthenticatedRoute>
                  <LiveContest />
                </AuthenticatedRoute>
              }
            />
            <Route
              path="/contests/:id/results"
              element={
                <AuthenticatedRoute>
                  <Results />
                </AuthenticatedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* SuperAdmin Routes */}
            <Route
              path="/superadmin"
              element={
                <SuperAdminRoute>
                  <SuperAdminDashboard />
                </SuperAdminRoute>
              }
            />
            <Route
              path="/test"
              element={
                <SuperAdminRoute>
                  <TestPage />
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
              path="/api-playground"
              element={
                <SuperAdminRoute>
                  <ApiPlayground />
                </SuperAdminRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
        <DebugPanel />
        <ToastContainer />
        <Toaster />
      </div>
    </Router>
  );
};
