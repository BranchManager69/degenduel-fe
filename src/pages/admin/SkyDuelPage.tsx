import React, { useEffect, useState } from "react";

import { SkyDuelDashboard } from "../../components/admin/skyduel/SkyDuelDashboard";
import SkyDuelDebugPanel from "../../components/debug/websocket/SkyDuelDebugPanel";
import { useAuth } from "../../hooks/useAuth";
import { useSkyDuelWebSocket } from "../../hooks/websocket/useSkyDuelWebSocket";
import { useStore } from "../../store/useStore";

export const SkyDuelPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(true); // Debug shown by default for SkyDuel admin page
  const skyDuelSocket = useSkyDuelWebSocket();
  const { isAdmin } = useAuth();
  const { addServiceAlert } = useStore();

  useEffect(() => {
    // Check if user has admin permissions
    if (!isAdmin()) {
      window.location.href = "/";
      return;
    }

    // Initialize connection
    setLoading(false);

    // Connection status notification
    if (skyDuelSocket.isConnected) {
      addServiceAlert("info", "Connected to SkyDuel WebSocket (v69 Unified System)");
    } else {
      addServiceAlert("warning", "Not connected to SkyDuel WebSocket - attempting connection");
    }

    // Cleanup on unmount
    return () => {
      if (skyDuelSocket && skyDuelSocket.close) {
        skyDuelSocket.close();
      }
    };
  }, [isAdmin, skyDuelSocket, addServiceAlert]);

  // Handle connection status changes
  useEffect(() => {
    if (skyDuelSocket.isConnected) {
      addServiceAlert("info", "SkyDuel WebSocket connected successfully");
    } else if (skyDuelSocket.error) {
      addServiceAlert("error", `SkyDuel WebSocket error: ${skyDuelSocket.error}`);
    }
  }, [skyDuelSocket.isConnected, skyDuelSocket.error, addServiceAlert]);

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

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <header className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-brand-100 flex items-center">
              <span className="text-brand-400 mr-2">⚡</span>
              SkyDuel
              <span className="text-brand-400 ml-2">⚡</span>
              <span className="text-sm font-normal text-brand-300 ml-4">
                Unified Service Management (v69)
              </span>
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => skyDuelSocket.sendCommand("refresh")}
                className="px-3 py-1 bg-brand-600 text-white rounded hover:bg-brand-500 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`px-3 py-1 rounded transition-colors ${
                  showDebug
                    ? "bg-amber-500 text-white hover:bg-amber-400"
                    : "bg-dark-700 text-gray-300 hover:bg-dark-600"
                }`}
              >
                {showDebug ? "Hide Debug" : "Show Debug"}
              </button>
            </div>
          </div>
          <p className="text-gray-400 text-sm">
            Monitor and manage all DegenDuel services through a unified
            dashboard.
          </p>
          <div className="mt-2 text-xs text-amber-400 flex items-center">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${skyDuelSocket.isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            <span>
              WebSocket Status: {skyDuelSocket.isConnected ? 'Connected' : 'Disconnected'} 
              {skyDuelSocket.lastUpdate && ` (Last update: ${new Date(skyDuelSocket.lastUpdate).toLocaleTimeString()})`}
            </span>
          </div>
        </header>

        {/* Debug Panel - Visible by default */}
        {showDebug && (
          <div className="mb-8 bg-dark-850/90 backdrop-blur-sm border border-dark-700 rounded-lg p-4 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-brand-300">WebSocket Debug (v69 Unified System)</h3>
            </div>
            <div className="p-4 bg-dark-900/80 rounded border border-dark-700 overflow-auto">
              <SkyDuelDebugPanel />
            </div>
            <div className="mt-4 bg-dark-900/80 p-3 rounded border border-dark-700">
              <h4 className="font-semibold text-amber-400 mb-2">Connection Details</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li><span className="text-gray-400">Topic:</span> skyduel</li>
                <li><span className="text-gray-400">Endpoint:</span> /api/v69/ws</li>
                <li><span className="text-gray-400">Auth Required:</span> Yes (Admin role)</li>
                <li><span className="text-gray-400">Status:</span> <span className={skyDuelSocket.isConnected ? 'text-emerald-400' : 'text-red-400'}>
                  {skyDuelSocket.isConnected ? 'Connected' : 'Disconnected'}
                </span></li>
                {skyDuelSocket.error && (
                  <li><span className="text-gray-400">Error:</span> <span className="text-red-400">{skyDuelSocket.error}</span></li>
                )}
              </ul>
            </div>
          </div>
        )}

        <SkyDuelDashboard socket={skyDuelSocket} />
      </div>
    </div>
  );
};

export default SkyDuelPage;
