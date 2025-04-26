import React, { useState } from "react";

import { useSkyDuelWebSocket } from "../../../hooks/websocket/useSkyDuelWebSocket";
import { useStore } from "../../../store/useStore";

interface ServiceControlsProps {
  nodeId: string;
  socket: ReturnType<typeof useSkyDuelWebSocket>;
}

export const ServiceControls: React.FC<ServiceControlsProps> = ({
  nodeId,
  socket,
}) => {
  const { skyDuel } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);

  // Find the selected node
  const node = skyDuel.nodes.find((n) => n.id === nodeId);

  if (!node) return null;

  const handleCommand = async (command: string) => {
    try {
      setIsLoading(true);
      setOperation(command);

      const success = await socket.sendCommand(command, { nodeId });

      if (!success) {
        throw new Error("Failed to send command");
      }

      // Wait for a moment to allow the command to be processed
      setTimeout(() => {
        setIsLoading(false);
        setOperation(null);
      }, 1500);
    } catch (error) {
      console.error(`Failed to execute command ${command}:`, error);
      setIsLoading(false);
      setOperation(null);
    }
  };

  const canRestart = node.status !== "restarting";
  const canStop = node.status === "online" || node.status === "degraded";
  const canStart = node.status === "offline";

  return (
    <div className="mt-6 border-t border-dark-600 pt-4">
      <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-3">
        Controls
      </h4>

      <div className="grid grid-cols-3 gap-3">
        <button
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            canRestart
              ? "bg-brand-500 hover:bg-brand-600 text-white"
              : "bg-dark-600 text-gray-500 cursor-not-allowed"
          } ${isLoading && operation === "restart" ? "opacity-75 cursor-wait" : ""}`}
          onClick={() => canRestart && handleCommand("restart")}
          disabled={!canRestart || isLoading}
        >
          {isLoading && operation === "restart" ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Restarting...
            </span>
          ) : (
            "Restart"
          )}
        </button>

        <button
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            canStop
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-dark-600 text-gray-500 cursor-not-allowed"
          } ${isLoading && operation === "stop" ? "opacity-75 cursor-wait" : ""}`}
          onClick={() => canStop && handleCommand("stop")}
          disabled={!canStop || isLoading}
        >
          {isLoading && operation === "stop" ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Stopping...
            </span>
          ) : (
            "Stop"
          )}
        </button>

        <button
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            canStart
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-dark-600 text-gray-500 cursor-not-allowed"
          } ${isLoading && operation === "start" ? "opacity-75 cursor-wait" : ""}`}
          onClick={() => canStart && handleCommand("start")}
          disabled={!canStart || isLoading}
        >
          {isLoading && operation === "start" ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Starting...
            </span>
          ) : (
            "Start"
          )}
        </button>
      </div>

      {/* Additional command buttons */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <button
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-indigo-500 hover:bg-indigo-600 text-white ${
            isLoading && operation === "diagnose"
              ? "opacity-75 cursor-wait"
              : ""
          }`}
          onClick={() => handleCommand("diagnose")}
          disabled={isLoading}
        >
          {isLoading && operation === "diagnose" ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Diagnosing...
            </span>
          ) : (
            "Diagnose Issues"
          )}
        </button>

        <button
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-violet-500 hover:bg-violet-600 text-white ${
            isLoading && operation === "reset" ? "opacity-75 cursor-wait" : ""
          }`}
          onClick={() => handleCommand("reset")}
          disabled={isLoading}
        >
          {isLoading && operation === "reset" ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Resetting...
            </span>
          ) : (
            "Reset Metrics"
          )}
        </button>

        <button
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-blue-500 hover:bg-blue-600 text-white ${
            isLoading && operation === "logs" ? "opacity-75 cursor-wait" : ""
          }`}
          onClick={() => handleCommand("logs")}
          disabled={isLoading}
        >
          {isLoading && operation === "logs" ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Fetching...
            </span>
          ) : (
            "View Logs"
          )}
        </button>

        <button
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-rose-500 hover:bg-rose-600 text-white ${
            isLoading && operation === "clear_alerts"
              ? "opacity-75 cursor-wait"
              : ""
          }`}
          onClick={() => handleCommand("clear_alerts")}
          disabled={isLoading}
        >
          {isLoading && operation === "clear_alerts" ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Clearing...
            </span>
          ) : (
            "Clear Alerts"
          )}
        </button>
      </div>
    </div>
  );
};
