import React from "react";
import { Toaster } from "react-hot-toast";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DebugPanel } from "./components/debug/DebugPanel";
import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { AdminDashboard } from "./pages/AdminDashboard";
import { Contact } from "./pages/Contact";
import { ContestBrowser } from "./pages/ContestBrowser";
import { ContestDetails } from "./pages/ContestDetails";
import { FAQ } from "./pages/FAQ";
import { HowItWorks } from "./pages/HowItWorks";
import { LandingPage } from "./pages/LandingPage";
import { LiveContest } from "./pages/LiveContest";
import { Profile } from "./pages/Profile";
import { Results } from "./pages/Results";
import { TestPage } from "./pages/TestPage";
import { TokenSelection } from "./pages/TokenSelection";
import "./styles/debug.css";
/* Extra Pages */
// API Playground
import ApiPlayground from "./pages/ApiPlayground";
// AMM Simulation
import AmmSim from "./pages/AmmSim";

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-dark-100">
        <Header />
        <main className="flex-grow">
          <Routes>
            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />
            {/* Contests */}
            <Route path="/contests" element={<ContestBrowser />} />
            <Route path="/contests/:id" element={<ContestDetails />} />
            <Route
              path="/contests/:id/select-tokens"
              element={<TokenSelection />}
            />
            <Route path="/contests/:id/live" element={<LiveContest />} />
            <Route path="/contests/:id/results" element={<Results />} />
            {/* Profile */}
            <Route path="/profile" element={<Profile />} />

            {/* Admin Dashboard (TODO: NEEDS SUPERADMIN AUTH CHECK) */}
            <Route path="/admin" element={<AdminDashboard />} />

            {/* How It Works */}
            <Route path="/how-it-works" element={<HowItWorks />} />
            {/* FAQ */}
            <Route path="/faq" element={<FAQ />} />
            {/* Contact */}
            <Route path="/contact" element={<Contact />} />

            {/* Test Page (TODO: NEEDS SUPERADMIN AUTH CHECK) */}
            <Route path="/test" element={<TestPage />} />

            {/* AMM Simulation (TODO: NEEDS SUPERADMIN AUTH CHECK) */}
            <Route path="/amm-sim" element={<AmmSim />} />

            {/* API Playground (TODO: NEEDS SUPERADMIN AUTH CHECK) */}
            <Route path="/api-playground" element={<ApiPlayground />} />
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
