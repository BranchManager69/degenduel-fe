import React, { useEffect, useState } from "react";
import { BackgroundEffects } from "../../components/animated-background/BackgroundEffects";
import { SkyDuelDashboard } from "../../components/admin/skyduel/SkyDuelDashboard";
import { useSkyDuelWebSocket } from "../../hooks/useSkyDuelWebSocket";
import { useStore } from "../../store/useStore";

export const SkyDuelPage: React.FC = () => {
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const skyDuelSocket = useSkyDuelWebSocket();

  useEffect(() => {
    if (!user) return;
    
    // Check if user has admin permissions
    const isAdmin = user.role === "admin" || user.role === "superadmin";
    if (!isAdmin) {
      window.location.href = "/";
      return;
    }
    
    // Initialize connection
    setLoading(false);
    
    // Cleanup on unmount
    return () => {
      skyDuelSocket.close();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-dark-900 to-dark-950">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="mt-4 text-brand-100">Loading SkyDuel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 via-dark-900 to-dark-950 text-white">
      {/* Background visualization */}
      <BackgroundEffects />
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-brand-100 flex items-center">
              <span className="text-brand-400 mr-2">⚡</span>
              SkyDuel
              <span className="text-brand-400 ml-2">⚡</span>
              <span className="text-sm font-normal text-brand-300 ml-4">
                Unified Service Management
              </span>
            </h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => skyDuelSocket.sendCommand("refresh")}
                className="px-3 py-1 bg-brand-600 text-white rounded hover:bg-brand-500 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Monitor and manage all DegenDuel services through a unified dashboard.
          </p>
        </header>
        
        <SkyDuelDashboard socket={skyDuelSocket} />
      </div>
    </div>
  );
};

export default SkyDuelPage;