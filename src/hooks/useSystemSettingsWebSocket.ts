// src/hooks/useSystemSettingsWebSocket.ts

/**
 * This hook is used to get the system settings from the admin API.
 * It uses a WebSocket connection to get the settings and a fallback to the Admin API if the WebSocket connection fails.
 *
 * @returns {Object} An object containing the system settings, loading state, error state, and a function to refresh the settings.
 */

import { useEffect, useState } from "react";
import { WS_URL } from "../config/config";
import { useBaseWebSocket } from "./useBaseWebSocket";

// SPECIFICALLY FOR BACKGROUND SCENE SETTINGS
interface SystemSettings {
  background_scene?:
    | string
    | {
        enabled: boolean;
        scenes: Array<{
          name: string;
          enabled: boolean;
          zIndex: number;
          blendMode: string;
        }>;
      };
  [key: string]: any;
}

export function useSystemSettingsWebSocket() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Use the proper WebSocket URL from config
  //const { WS_URL } = require("../config/config"); // Moved to imports (top of file)

  // Connect to the admin WebSocket endpoint
  const { wsRef, status } = useBaseWebSocket({
    url: WS_URL,
    endpoint: "/api/admin/system-settings",
    socketType: "system-settings",
    onMessage: (message) => {
      try {
        // Only process relevant messages
        if (message.type === "SYSTEM_SETTINGS_UPDATE") {
          console.log("Received system settings update:", message.data);
          setSettings(message.data);
          setLoading(false);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error("Error processing system settings update:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      }
    },
  });

  // Request settings when connection is established
  useEffect(() => {
    const requestSettings = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN && loading) {
        wsRef.current.send(
          JSON.stringify({
            type: "GET_SYSTEM_SETTINGS",
            timestamp: Date.now(),
          })
        );
      }
    };

    if (status === "online") {
      requestSettings();
    }
  }, [status, loading, wsRef]);

  // Fallback to REST API if WebSocket fails
  useEffect(() => {
    // Only use fallback if WebSocket is not connected after a timeout
    const fallbackTimer = setTimeout(async () => {
      if (loading && status !== "online") {
        try {
          console.log(
            "WebSocket fallback: Fetching system settings via Admin API"
          );
          const { admin } = await import("../services/api/admin");
          const data = await admin.getSystemSettings();
          setSettings(data);
          setLastUpdated(new Date());
        } catch (err) {
          console.error("Fallback fetch error:", err);
          setError(err instanceof Error ? err : new Error("Unknown error"));
        } finally {
          setLoading(false);
        }
      }
    }, 3000); // 3 second timeout before fallback

    return () => clearTimeout(fallbackTimer);
  }, [loading, status]);

  // Safety: Add function to manually refresh settings
  const refreshSettings = () => {
    setLoading(true);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "GET_SYSTEM_SETTINGS",
          timestamp: Date.now(),
        })
      );
    } else {
      // Fallback to API if WebSocket is not connected
      import("../services/api/admin")
        .then(({ admin }) => admin.getSystemSettings())
        .then((data) => {
          setSettings(data);
          setLastUpdated(new Date());
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setLoading(false);
        });
    }
  };

  // Utility method to update background scene settings
  const updateBackgroundScene = async (value: any) => {
    try {
      setLoading(true);
      const { admin } = await import("../services/api/admin");
      const result = await admin.updateSystemSettings(
        "background_scene",
        value
      );
      setSettings((prev) =>
        prev
          ? { ...prev, background_scene: value }
          : { background_scene: value }
      );
      setLastUpdated(new Date());
      setLoading(false);
      return result;
    } catch (err) {
      console.error("Error updating background scene:", err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
      setLoading(false);
      throw err;
    }
  };

  return {
    settings,
    loading,
    error,
    lastUpdated,
    refreshSettings,
    updateBackgroundScene,
  };
}
