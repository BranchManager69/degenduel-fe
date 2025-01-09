import React from "react";
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

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-dark-100">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/contests" element={<ContestBrowser />} />
            <Route path="/contests/:id" element={<ContestDetails />} />
            <Route
              path="/contests/:id/select-tokens"
              element={<TokenSelection />}
            />
            <Route path="/contests/:id/live" element={<LiveContest />} />
            <Route path="/contests/:id/results" element={<Results />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/test" element={<TestPage />} />
          </Routes>
        </main>
        <Footer />
        <DebugPanel />
        <ToastContainer />
      </div>
    </Router>
  );
};
