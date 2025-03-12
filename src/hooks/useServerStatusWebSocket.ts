// src/hooks/useServerStatusWebSocket.ts

import { useState, useEffect } from "react";

import { useBaseWebSocket } from "./useBaseWebSocket";
import { ddApi } from "../services/dd-api";
import { useStore } from "../store/useStore";

export type ServerStatus = "online" | "maintenance" | "offline" | "error";

interface ServerStatusData {
  status: ServerStatus;
  message: string;
  timestamp: string;
  lastChecked: string;
}

/**
 * Hook for monitoring server status via WebSocket with HTTP fallback
 * Uses the new v69 Monitor WebSocket endpoint for real-time status updates
 */
export function useServerStatusWebSocket() {
  const [statusData, setStatusData] = useState<ServerStatusData>({
    status: "online",
    message: "Connecting to server...",
    timestamp: new Date().toISOString(),
    lastChecked: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const { maintenanceMode } = useStore();

  // If maintenance mode is active in the store, always show maintenance status
  useEffect(() => {
    if (maintenanceMode) {
      setStatusData((prevData) => ({
        ...prevData,
        status: "maintenance",
        message: "System is in scheduled maintenance mode",
        lastChecked: new Date().toISOString(),
      }));
    }
  }, [maintenanceMode]);

  // Message handler for WebSocket data
  const handleMessage = (message: any) => {
    try {
      // Only process relevant status update messages
      if (message.type === "SERVER_STATUS_UPDATE" && message.data) {
        const { status, message: statusMessage, timestamp } = message.data;

        // Update status with the data from the WebSocket
        setStatusData({
          status: status as ServerStatus,
          message: statusMessage || getDefaultMessage(status as ServerStatus),
          timestamp,
          lastChecked: new Date().toISOString(),
        });

        setLoading(false);
      }
    } catch (err) {
      console.error("Error processing server status update:", err);
      setStatusData((prevData) => ({
        ...prevData,
        status: "error",
        message: "Error processing status data",
        lastChecked: new Date().toISOString(),
      }));
    }
  };

  // Handle WebSocket errors
  const handleError = (error: Error) => {
    console.warn("Server status WebSocket error:", error);

    // If we get a WebSocket error, don't immediately set status to error
    // Instead, fall back to HTTP polling in the useEffect below
  };

  // Connect to the status WebSocket using v69 endpoint
  const { status: socketStatus } = useBaseWebSocket({
    url: "", // Base URL will be determined by useBaseWebSocket
    endpoint: "/api/v69/ws/monitor",
    socketType: "server-status",
    onMessage: handleMessage,
    onError: handleError,
    heartbeatInterval: 30000, // 30-second heartbeat to keep connection alive
    maxReconnectAttempts: 5,
    reconnectBackoff: true,
    requiresAuth: false, // Status information should be public, no auth needed
  });

  // Fallback HTTP polling when WebSocket is not available
  useEffect(() => {
    // Skip if WebSocket is connected
    if (socketStatus === "online" || maintenanceMode) {
      return;
    }

    // Define the polling function
    const checkServerStatus = async () => {
      try {
        const response = await ddApi.fetch("/status");

        // Update status based on response
        if (response.status === 503) {
          setStatusData({
            status: "maintenance",
            message: "System is in scheduled maintenance mode",
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        } else {
          setStatusData({
            status: "online",
            message: "Server is operating normally",
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        }
      } catch (err) {
        // Differentiate between complete offline and other errors
        if (err instanceof Error && err.message.includes("Failed to fetch")) {
          setStatusData({
            status: "offline",
            message: "Unable to connect to server",
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        } else if (err instanceof Error && err.message.includes("503")) {
          setStatusData({
            status: "maintenance",
            message: "System is in scheduled maintenance mode",
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        } else {
          setStatusData({
            status: "error",
            message: "Server is experiencing issues",
            timestamp: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
          });
        }
        console.error("Failed to check server status:", err);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkServerStatus();

    // Polling interval - 5 seconds when offline, 30 seconds when online
    const interval = setInterval(
      checkServerStatus,
      statusData.status === "offline" || statusData.status === "error"
        ? 5000
        : 30000,
    );

    return () => clearInterval(interval);
  }, [socketStatus, statusData.status, maintenanceMode]);

  // Utility function to get default status messages
  const getDefaultMessage = (status: ServerStatus): string => {
    switch (status) {
      case "online":
        return "Server is operating normally";
      case "maintenance":
        return "System is in scheduled maintenance mode";
      case "offline":
        return "Unable to connect to server";
      case "error":
        return "Server is experiencing issues";
      default:
        return "Unknown server status";
    }
  };

  return {
    status: statusData.status,
    message: statusData.message,
    timestamp: statusData.timestamp,
    lastChecked: statusData.lastChecked,
    loading,
    isWebSocketConnected: socketStatus === "online",
  };
}
