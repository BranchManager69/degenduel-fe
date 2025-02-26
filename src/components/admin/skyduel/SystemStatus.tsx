import React from "react";

interface SystemStatusProps {
  status: {
    overall: "operational" | "degraded" | "outage";
    timestamp: string;
    message: string;
  };
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ status }) => {
  const getStatusColor = (status: "operational" | "degraded" | "outage") => {
    switch (status) {
      case "operational":
        return "bg-emerald-500";
      case "degraded":
        return "bg-amber-500";
      case "outage":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: "operational" | "degraded" | "outage") => {
    switch (status) {
      case "operational":
        return "Operational";
      case "degraded":
        return "Degraded Performance";
      case "outage":
        return "System Outage";
      default:
        return "Unknown Status";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor(status.overall)}`}></div>
        <div className="font-semibold text-brand-100">
          {getStatusText(status.overall)}
        </div>
      </div>
      
      <div className="text-sm text-gray-400">
        {status.message}
      </div>
    </div>
  );
};