import React from "react";

import { ServiceNode } from "../../../hooks/websocket/useSkyDuelWebSocket";
import { useStore } from "../../../store/useStore";

interface ServiceDetailsProps {
  nodeId: string;
}

export const ServiceDetails: React.FC<ServiceDetailsProps> = ({ nodeId }) => {
  const { skyDuel } = useStore();

  // Find the selected node
  const node = skyDuel.nodes.find((n) => n.id === nodeId);

  if (!node) {
    return (
      <div className="p-4 text-center text-gray-400">Service not found</div>
    );
  }

  const getStatusColor = (status: ServiceNode["status"]) => {
    switch (status) {
      case "online":
        return "bg-emerald-500";
      case "degraded":
        return "bg-amber-500";
      case "offline":
        return "bg-red-500";
      case "restarting":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: ServiceNode["status"]) => {
    switch (status) {
      case "online":
        return "Online";
      case "degraded":
        return "Degraded";
      case "offline":
        return "Offline";
      case "restarting":
        return "Restarting";
      default:
        return "Unknown";
    }
  };

  // Format date in a readable format
  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  // Format uptime in human-readable format
  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days} day${days > 1 ? "s" : ""} ${hours} hour${hours > 1 ? "s" : ""}`;
  };

  // Find connected services
  const connectedTo = skyDuel.connections
    .filter((conn) => conn.source === nodeId)
    .map((conn) => {
      const targetNode = skyDuel.nodes.find((n) => n.id === conn.target);
      return {
        connection: conn,
        node: targetNode,
      };
    });

  const connectedFrom = skyDuel.connections
    .filter((conn) => conn.target === nodeId)
    .map((conn) => {
      const sourceNode = skyDuel.nodes.find((n) => n.id === conn.source);
      return {
        connection: conn,
        node: sourceNode,
      };
    });

  // Get connection status color
  const getConnectionStatusColor = (
    status: "active" | "degraded" | "failed",
  ) => {
    switch (status) {
      case "active":
        return "text-emerald-500";
      case "degraded":
        return "text-amber-500";
      case "failed":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-brand-100">{node.name}</h3>
          <div className="text-sm text-gray-400">{node.id}</div>
          <div className="flex items-center mt-1">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(node.status)}`}
            ></div>
            <span className="text-gray-300">{getStatusLabel(node.status)}</span>
          </div>
        </div>
        <div className="px-3 py-1 rounded-lg bg-dark-600 text-brand-300 font-medium capitalize">
          {node.type}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-dark-700/50">
          <div className="text-sm text-gray-400 mb-1">Health Score</div>
          <div className="flex items-center">
            <div className="w-full bg-dark-800 rounded-full h-2 mr-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${node.health}%`,
                  backgroundColor:
                    node.health > 80
                      ? "#22c55e" // Emerald-500
                      : node.health > 50
                        ? "#f59e0b" // Amber-500
                        : "#ef4444", // Red-500
                }}
              ></div>
            </div>
            <span className="text-brand-300 font-medium">{node.health}%</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-dark-700/50">
          <div className="text-sm text-gray-400 mb-1">Uptime</div>
          <div className="text-brand-300 font-medium">
            {formatUptime(node.uptime)}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-2">
          Metrics
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-dark-700/50">
            <div className="text-sm text-gray-400 mb-1">CPU Usage</div>
            <div className="text-brand-300 font-medium">
              {node.metrics.cpu}%
            </div>
          </div>

          <div className="p-3 rounded-lg bg-dark-700/50">
            <div className="text-sm text-gray-400 mb-1">Memory Usage</div>
            <div className="text-brand-300 font-medium">
              {node.metrics.memory}%
            </div>
          </div>

          <div className="p-3 rounded-lg bg-dark-700/50">
            <div className="text-sm text-gray-400 mb-1">Active Connections</div>
            <div className="text-brand-300 font-medium">
              {node.metrics.connections}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-dark-700/50">
            <div className="text-sm text-gray-400 mb-1">
              Requests Per Minute
            </div>
            <div className="text-brand-300 font-medium">
              {node.metrics.requestsPerMinute}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-dark-700/50 col-span-2">
            <div className="text-sm text-gray-400 mb-1">Error Rate</div>
            <div className="flex items-center">
              <div className="w-full bg-dark-800 rounded-full h-2 mr-2">
                <div
                  className="h-2 rounded-full bg-red-500"
                  style={{ width: `${node.metrics.errorRate}%` }}
                ></div>
              </div>
              <span className="text-brand-300 font-medium">
                {node.metrics.errorRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div className="mb-4">
        <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-2">
          Timeline
        </h4>
        <div className="text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">Last Restart:</span>
            <span className="text-gray-300">
              {formatDate(node.lastRestart)}
            </span>
          </div>
        </div>
      </div>

      {/* Connections */}
      <div className="mb-4">
        <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-2">
          Connections ({connectedTo.length + connectedFrom.length})
        </h4>

        {connectedTo.length > 0 && (
          <div className="mb-3">
            <div className="text-sm text-gray-400 mb-1">Outgoing:</div>
            <div className="space-y-2">
              {connectedTo.map(({ connection, node }) => (
                <div
                  key={connection.target}
                  className="flex items-center justify-between p-2 rounded bg-dark-700/50"
                >
                  <div className="flex items-center">
                    <span
                      className={`mr-2 ${getConnectionStatusColor(connection.status)}`}
                    >
                      →
                    </span>
                    <span className="text-gray-300">
                      {node?.name || connection.target}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {connection.latency}ms | {connection.throughput}/s
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {connectedFrom.length > 0 && (
          <div>
            <div className="text-sm text-gray-400 mb-1">Incoming:</div>
            <div className="space-y-2">
              {connectedFrom.map(({ connection, node }) => (
                <div
                  key={connection.source}
                  className="flex items-center justify-between p-2 rounded bg-dark-700/50"
                >
                  <div className="flex items-center">
                    <span
                      className={`mr-2 ${getConnectionStatusColor(connection.status)}`}
                    >
                      ←
                    </span>
                    <span className="text-gray-300">
                      {node?.name || connection.source}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {connection.latency}ms | {connection.throughput}/s
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {connectedTo.length === 0 && connectedFrom.length === 0 && (
          <div className="text-center py-2 text-gray-400 text-sm">
            No connections
          </div>
        )}
      </div>

      {/* Alerts */}
      {node.alerts.length > 0 && (
        <div>
          <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-2">
            Alerts ({node.alerts.length})
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {node.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-2 rounded-lg text-sm ${
                  alert.severity === "critical"
                    ? "bg-red-500/10 border border-red-500/30"
                    : alert.severity === "error"
                      ? "bg-red-500/10 border border-red-500/20"
                      : alert.severity === "warning"
                        ? "bg-amber-500/10 border border-amber-500/20"
                        : "bg-blue-500/10 border border-blue-500/20"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div
                    className={`capitalize font-medium ${
                      alert.severity === "critical" ||
                      alert.severity === "error"
                        ? "text-red-400"
                        : alert.severity === "warning"
                          ? "text-amber-400"
                          : "text-blue-400"
                    }`}
                  >
                    {alert.severity}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-gray-300">{alert.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
