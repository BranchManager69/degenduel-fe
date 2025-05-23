import React from "react";

import { useStore } from "../../../store/useStore";
import { NodeStatus, ServiceNode } from "./types";

export const ServiceCircuitView: React.FC = () => {
  const { skyDuel, setSkyDuelSelectedNode } = useStore();

  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case "online":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "degraded":
      case "warning":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "offline":
      case "error":
        return "bg-red-500/10 border-red-500/20 text-red-400";
      case "restarting":
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
      default:
        const _exhaustiveCheck: never = status;
        console.warn(`Unknown node status: ${_exhaustiveCheck}`);
        return "bg-gray-500/10 border-gray-500/20 text-gray-400";
    }
  };

  const getCircuitIcon = (node: ServiceNode) => {
    if (node.status === "offline" || node.status === "error") return "✕";
    if (node.metrics.errorRate > 50) return "↻";
    if (node.metrics.errorRate > 10 || node.status === "warning" || node.status === "degraded") return "⚠";
    return "✓";
  };

  const getCircuitState = (node: ServiceNode): "open" | "half-open" | "degraded" | "closed" => {
    if (node.status === "offline" || node.status === "error") return "open";
    if (node.metrics.errorRate > 50) return "half-open";
    if (node.metrics.errorRate > 10 || node.status === "warning" || node.status === "degraded" || node.status === "restarting") return "degraded";
    return "closed";
  };

  const getCircuitHealthProgress = (node: ServiceNode) => {
    return 100 - Math.min(100, node.metrics.errorRate * 2);
  };

  const sortedNodes: ServiceNode[] = [...skyDuel.nodes].sort((a, b) => {
    const stateOrder = { open: 0, "half-open": 1, degraded: 2, closed: 3 };
    const aState = getCircuitState(a);
    const bState = getCircuitState(b);
    if (stateOrder[aState] !== stateOrder[bState]) {
      return stateOrder[aState] - stateOrder[bState];
    }
    return b.metrics.errorRate - a.metrics.errorRate;
  });

  return (
    <div className="h-full overflow-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-3">
          Circuit Breaker Status
        </h2>

        <div
          className={`p-4 rounded-lg border ${
            skyDuel.systemStatus.overall === "operational"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : skyDuel.systemStatus.overall === "degraded"
                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                : skyDuel.systemStatus.overall === "critical"
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-gray-500/10 border-gray-500/20 text-gray-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  skyDuel.systemStatus.overall === "operational"
                    ? "bg-emerald-500"
                    : skyDuel.systemStatus.overall === "degraded"
                      ? "bg-amber-500"
                      : skyDuel.systemStatus.overall === "critical"
                        ? "bg-red-500"
                        : "bg-gray-500"
                }`}
              ></div>
              <span className="font-medium">
                System Status: {skyDuel.systemStatus.overall.toUpperCase()}
              </span>
            </div>
            <span className="text-sm">
              {skyDuel.nodes.filter((n) => n.status !== "online").length} service(s) in degraded state
            </span>
          </div>
          <div className="text-xs mt-1 text-gray-400">
             (Services: Online: {skyDuel.systemStatus.services.online}, Degraded: {skyDuel.systemStatus.services.degraded}, Offline: {skyDuel.systemStatus.services.offline})
          </div>
        </div>
      </div>

      {/* Circuit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedNodes.map((node) => {
          const circuitState = getCircuitState(node);
          const healthProgress = getCircuitHealthProgress(node);

          return (
            <div
              key={node.id}
              className={`bg-dark-200/50 backdrop-blur-sm rounded-lg border ${
                circuitState === "open"
                  ? "border-red-500/20"
                  : circuitState === "half-open"
                    ? "border-amber-500/20"
                    : circuitState === "degraded"
                      ? "border-yellow-500/20"
                      : "border-brand-500/20"
              } overflow-hidden hover:shadow-lg transition-all cursor-pointer`}
              onClick={() => setSkyDuelSelectedNode(node.id)}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-200">
                    {node.name}
                  </h3>
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(node.status)}`}
                  >
                    {circuitState.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Circuit State */}
                  <div>
                    <span className="text-sm text-gray-400">Circuit State</span>
                    <div className="flex items-center mt-1">
                      <span
                        className={`text-lg mr-2 ${
                          circuitState === "open"
                            ? "text-red-400"
                            : circuitState === "half-open"
                              ? "text-amber-400"
                              : circuitState === "degraded"
                                ? "text-yellow-400"
                                : "text-emerald-400"
                        }`}
                      >
                        {getCircuitIcon(node)}
                      </span>
                      <span className="text-sm text-gray-300">
                        {circuitState.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Circuit Health */}
                  <div>
                    <span className="text-sm text-gray-400">
                      Circuit Health
                    </span>
                    <div className="mt-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300">
                          Error Rate: {node.metrics.errorRate}%
                        </span>
                        <span className="text-sm text-gray-300">
                          {healthProgress}% Healthy
                        </span>
                      </div>
                      <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            healthProgress > 80
                              ? "bg-emerald-500"
                              : healthProgress > 50
                                ? "bg-yellow-500"
                                : healthProgress > 30
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                          }`}
                          style={{ width: `${healthProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Service Stats */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-400">Requests/min:</div>
                    <div className="text-right text-brand-300">
                      {node.metrics.requestsPerMinute}
                    </div>

                    <div className="text-gray-400">CPU:</div>
                    <div className="text-right text-brand-300">
                      {node.metrics.cpu}%
                    </div>

                    <div className="text-gray-400">Memory:</div>
                    <div className="text-right text-brand-300">
                      {node.metrics.memory}%
                    </div>

                    <div className="text-gray-400">Connections:</div>
                    <div className="text-right text-brand-300">
                      {node.metrics.connections}
                    </div>
                  </div>

                  {/* Alerts */}
                  {node.alerts.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-dark-600">
                      <div className="text-xs font-medium text-amber-400 mb-1">
                        {node.alerts.length} Alert
                        {node.alerts.length > 1 ? "s" : ""}
                      </div>
                      <div className="text-xs text-amber-300/80 truncate">
                        Latest: {node.alerts[0].message}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
