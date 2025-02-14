import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useStore } from "../../store/useStore";

interface DebugLog {
  id: string;
  timestamp: string;
  type: "connection" | "state" | "alert" | "error" | "metrics";
  message: string;
  details?: any;
}

export const ServiceDebugPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const { serviceState, serviceAlerts } = useStore();

  // Add a log entry
  const addLog = (type: DebugLog["type"], message: string, details?: any) => {
    setLogs((prev) => [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        type,
        message,
        details,
      },
      ...prev.slice(0, 99), // Keep last 100 logs
    ]);
  };

  // Monitor WebSocket events
  useEffect(() => {
    const wsEventCallback = (event: Event) => {
      if (event instanceof CustomEvent) {
        addLog(event.detail.type, event.detail.message, event.detail.data);
      }
    };

    window.addEventListener("serviceWebSocket", wsEventCallback);
    return () =>
      window.removeEventListener("serviceWebSocket", wsEventCallback);
  }, []);

  // Monitor service state changes
  useEffect(() => {
    if (serviceState) {
      addLog("state", "Service state updated", serviceState);
    }
  }, [serviceState]);

  // Monitor service alerts
  useEffect(() => {
    if (serviceAlerts?.length) {
      const lastAlert = serviceAlerts[serviceAlerts.length - 1];
      addLog("alert", lastAlert.message, lastAlert);
    }
  }, [serviceAlerts]);

  const getLogColor = (type: DebugLog["type"]) => {
    switch (type) {
      case "connection":
        return "text-blue-400";
      case "state":
        return "text-green-400";
      case "alert":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      case "metrics":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mb-2 px-4 py-2 bg-dark-200/90 backdrop-blur-sm border border-brand-500/20 rounded-lg text-brand-400 hover:bg-dark-200/70 transition-colors"
      >
        {isExpanded ? "Hide Debug Panel" : "Show Debug Panel"}
      </button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-96 max-h-[600px] bg-dark-200/90 backdrop-blur-sm border border-brand-500/20 rounded-lg overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-brand-500/20">
              <h3 className="text-lg font-semibold text-brand-400">
                Service Monitor Debug
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      serviceState?.status === "online"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm text-gray-400">WebSocket</span>
                </div>
                <div className="text-xs text-gray-500">
                  {logs.length} events logged
                </div>
              </div>
            </div>

            {/* Logs */}
            <div className="overflow-y-auto max-h-[500px] p-4 space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 font-mono text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`${getLogColor(
                        log.type
                      )} font-mono uppercase text-xs`}
                    >
                      {log.type}
                    </span>
                    <span className="text-gray-300">{log.message}</span>
                  </div>
                  {log.details && (
                    <pre className="mt-1 text-xs text-gray-400 bg-dark-300/50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No events logged yet
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-brand-500/20 flex justify-between">
              <button
                onClick={() => setLogs([])}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Clear Logs
              </button>
              <div className="text-xs text-gray-500">
                Last updated:{" "}
                {logs[0]?.timestamp
                  ? new Date(logs[0].timestamp).toLocaleTimeString()
                  : "Never"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
