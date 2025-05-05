// src/components/admin/WebSocketPanel.tsx

import React, { useEffect } from "react";

import { useWebSocketMonitor } from "../../hooks/utilities/legacy/useWebSocketMonitor";
import { useStore } from "../../store/useStore";
import { WebSocketCard } from "./WebSocketCard";

const WebSocketPanel: React.FC = () => {
  const { webSocket, setWebSocketState, addWebSocketAlert } = useStore();
  useWebSocketMonitor();

  useEffect(() => {
    // Initial state fetch
    fetch("/api/superadmin/websocket/states")
      .then((res) => res.json())
      .then((data) => setWebSocketState(data))
      .catch((error) => {
        console.error("Failed to fetch WebSocket states:", error);
        addWebSocketAlert({
          type: "error",
          title: "Connection Error",
          message: "Failed to fetch WebSocket states",
        });
      });
  }, []);

  return (
    <div>
      {webSocket.systemHealth && (
        <div
          className={`
            mb-6 p-4 rounded-lg border
            ${
              webSocket.systemHealth.status === "operational"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : webSocket.systemHealth.status === "degraded"
                  ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
            }
          `}
        >
          <div className="flex items-center justify-between">
            <span>
              WebSocket Status: {webSocket.systemHealth.status.toUpperCase()}
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                Active Connections: {webSocket.systemHealth.activeConnections}
              </span>
              <span className="text-sm">
                Message Rate: {webSocket.systemHealth.messageRate}/s
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {webSocket.services.map((service) => (
          <WebSocketCard key={service.name} service={service} />
        ))}
      </div>
    </div>
  );
};

export default WebSocketPanel;
