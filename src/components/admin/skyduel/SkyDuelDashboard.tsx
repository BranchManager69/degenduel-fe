import React from "react";
import { useSkyDuelWebSocket } from "../../../hooks/useSkyDuelWebSocket";
import { useStore } from "../../../store/useStore";
import { SystemStatus } from "./SystemStatus";
import { ServiceGraph } from "./ServiceGraph";
import { ServiceGrid } from "./ServiceGrid";
import { ServiceList } from "./ServiceList";
import { ServiceCircuitView } from "./ServiceCircuitView";
import { ServiceDetails } from "./ServiceDetails";
import { ServiceControls } from "./ServiceControls";
import { AlertsPanel } from "./AlertsPanel";

interface SkyDuelDashboardProps {
  socket: ReturnType<typeof useSkyDuelWebSocket>;
}

export const SkyDuelDashboard: React.FC<SkyDuelDashboardProps> = ({ socket }) => {
  const { skyDuel, setSkyDuelViewMode } = useStore();
  const { viewMode, selectedNode } = skyDuel;

  // Helper for time formatting
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* System status and view controls - full width */}
      <div className="col-span-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-dark-800/60 backdrop-blur-md p-4 rounded-lg">
          <SystemStatus status={skyDuel.systemStatus} />
          
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400 mr-2">
              Last updated: {formatTime(skyDuel.lastUpdated)}
            </div>
            
            <div className="flex bg-dark-700 rounded-md overflow-hidden">
              <button
                onClick={() => setSkyDuelViewMode("graph")}
                className={`px-3 py-1.5 text-xs ${
                  viewMode === "graph" 
                    ? "bg-brand-500 text-white" 
                    : "text-gray-300 hover:bg-dark-600"
                }`}
              >
                Graph
              </button>
              <button
                onClick={() => setSkyDuelViewMode("grid")}
                className={`px-3 py-1.5 text-xs ${
                  viewMode === "grid" 
                    ? "bg-brand-500 text-white" 
                    : "text-gray-300 hover:bg-dark-600"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setSkyDuelViewMode("list")}
                className={`px-3 py-1.5 text-xs ${
                  viewMode === "list" 
                    ? "bg-brand-500 text-white" 
                    : "text-gray-300 hover:bg-dark-600"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setSkyDuelViewMode("circuit")}
                className={`px-3 py-1.5 text-xs ${
                  viewMode === "circuit" 
                    ? "bg-brand-500 text-white" 
                    : "text-gray-300 hover:bg-dark-600"
                }`}
              >
                Circuit
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content area - changes based on view mode */}
      <div className="col-span-full lg:col-span-8 xl:col-span-9">
        <div className="bg-dark-800/60 backdrop-blur-md rounded-lg p-4 h-[600px]">
          {viewMode === "graph" && <ServiceGraph />}
          {viewMode === "grid" && <ServiceGrid />}
          {viewMode === "list" && <ServiceList />}
          {viewMode === "circuit" && <ServiceCircuitView />}
        </div>
      </div>
      
      {/* Right sidebar - shows details of selected service or alerts */}
      <div className="col-span-full lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
        {/* Service details panel */}
        {selectedNode ? (
          <div className="bg-dark-800/60 backdrop-blur-md rounded-lg p-4">
            <ServiceDetails nodeId={selectedNode} />
            <ServiceControls socket={socket} nodeId={selectedNode} />
          </div>
        ) : (
          <div className="bg-dark-800/60 backdrop-blur-md rounded-lg p-4 text-center text-gray-400 py-8">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg text-brand-100 mb-2">No Service Selected</h3>
            <p className="text-sm">
              Select a service to view details and controls
            </p>
          </div>
        )}
        
        {/* Alerts panel */}
        <div className="bg-dark-800/60 backdrop-blur-md rounded-lg p-4">
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
};