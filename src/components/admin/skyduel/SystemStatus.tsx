import React from "react";
import type { SkyDuelState } from "./types"; // Import the correct state type

interface SystemStatusProps {
  // Updated to use the systemStatus structure from SkyDuelState
  status: SkyDuelState['systemStatus']; 
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ status }) => {
  const getStatusColor = (overallStatus: "operational" | "degraded" | "critical") => {
    switch (overallStatus) {
      case "operational":
        return "bg-emerald-500";
      case "degraded":
        return "bg-amber-500";
      case "critical": // Changed from "outage"
        return "bg-red-500";
      default:
        // const _exhaustiveCheck: never = overallStatus; // For type checking
        return "bg-gray-500";
    }
  };

  const getStatusText = (overallStatus: "operational" | "degraded" | "critical") => {
    switch (overallStatus) {
      case "operational":
        return "All Systems Operational";
      case "degraded":
        return "Degraded Performance";
      case "critical": // Changed from "System Outage"
        return "Critical System Alert";
      default:
        // const _exhaustiveCheck: never = overallStatus;
        return "Unknown Status";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${getStatusColor(status.overall)}`}
          title={`Overall Status: ${status.overall}`}
        ></div>
        <div className="font-semibold text-brand-100">
          {getStatusText(status.overall)}
        </div>
      </div>

      {/* Removed status.message display as it's not in the new type */}
      {/* Optionally, display service counts from status.services */}
      <div className="text-xs text-gray-400">
        (Online: {status.services.online}, Degraded: {status.services.degraded}, Offline: {status.services.offline})
      </div>
    </div>
  );
};
