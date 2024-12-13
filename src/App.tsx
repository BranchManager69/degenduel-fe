import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { ContestBrowser } from './pages/ContestBrowser';
import { ContestDetails } from './pages/ContestDetails';
import { TokenSelection } from './pages/TokenSelection';
import { LiveContest } from './pages/LiveContest';
import { Results } from './pages/Results';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { HowItWorks } from './pages/HowItWorks';
import { FAQ } from './pages/FAQ';
import { Contact } from './pages/Contact';

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
            <Route path="/contests/:id/select-tokens" element={<TokenSelection />} />
            <Route path="/contests/:id/live" element={<LiveContest />} />
            <Route path="/contests/:id/results" element={<Results />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};