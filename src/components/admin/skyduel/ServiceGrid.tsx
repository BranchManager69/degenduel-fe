import React from "react";

import { useStore } from "../../../store/useStore";
import { NodeStatus, NodeType, ServiceNode } from "./types";

export const ServiceGrid: React.FC = () => {
  const { skyDuel, setSkyDuelSelectedNode } = useStore();

  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case "online":
        return "border-emerald-500 bg-emerald-500/10";
      case "degraded":
      case "warning":
        return "border-amber-500 bg-amber-500/10";
      case "offline":
      case "error":
        return "border-red-500 bg-red-500/10";
      case "restarting":
        return "border-blue-500 bg-blue-500/10";
      default:
        const _exhaustiveCheck: never = status;
        console.warn(`Unknown node status: ${_exhaustiveCheck}`);
        return "border-gray-500 bg-gray-500/10";
    }
  };

  const getStatusDot = (status: NodeStatus) => {
    switch (status) {
      case "online":
        return "bg-emerald-500";
      case "degraded":
      case "warning":
        return "bg-amber-500";
      case "offline":
      case "error":
        return "bg-red-500";
      case "restarting":
        return "bg-blue-500";
      default:
        const _exhaustiveCheck: never = status;
        console.warn(`Unknown node status: ${_exhaustiveCheck}`);
        return "bg-gray-500";
    }
  };

  const getNodeTypeIcon = (type: NodeType) => {
    switch (type) {
      case "api":
        return "🔌";
      case "worker":
        return "⚙️";
      case "websocket":
        return "🔄";
      case "database":
        return "🗄️";
      case "cache":
        return "⚡";
      case "queue":
        return "📦";
      case "gateway":
        return "🚪";
      case "infrastructure":
        return "🏗️";
      case "service":
        return "🛠️";
      default:
        const _exhaustiveCheck: never = type;
        console.warn(`Unknown node type: ${_exhaustiveCheck}`);
        return "📦";
    }
  };

  const groupedNodes = skyDuel.nodes.reduce(
    (acc, node) => {
      const nodeTypeKey = node.type as string;
      if (!acc[nodeTypeKey]) {
        acc[nodeTypeKey] = [];
      }
      acc[nodeTypeKey].push(node);
      return acc;
    },
    {} as Record<string, ServiceNode[]>
  );

  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className="h-full overflow-auto">
      {Object.entries(groupedNodes).map(([type, nodesOfType]) => (
        <div key={type} className="mb-6">
          <h3 className="text-lg font-semibold text-brand-100 mb-3 flex items-center">
            <span className="mr-2">
              {getNodeTypeIcon(type as NodeType)}
            </span>
            {type.charAt(0).toUpperCase() + type.slice(1)} Services
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {nodesOfType.map((node) => (
              <div
                key={node.id}
                className={`rounded-lg border ${getStatusColor(node.status)} p-4 transition-all hover:scale-[1.02] cursor-pointer ${
                  node.id === skyDuel.selectedNode
                    ? "ring-2 ring-brand-400"
                    : ""
                }`}
                onClick={() => setSkyDuelSelectedNode(node.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${getStatusDot(node.status)}`}
                      ></div>
                      <h4 className="font-medium text-brand-100">
                        {node.name}
                      </h4>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ID: {node.id}
                    </div>
                  </div>
                  <div className="text-sm font-medium px-2 py-1 rounded bg-dark-700 text-brand-300">
                    {node.health}% Health
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">CPU:</div>
                  <div className="text-right text-brand-300">
                    {node.metrics.cpu}%
                  </div>

                  <div className="text-gray-400">Memory:</div>
                  <div className="text-right text-brand-300">
                    {node.metrics.memory}%
                  </div>

                  <div className="text-gray-400">Uptime:</div>
                  <div className="text-right text-brand-300">
                    {formatUptime(node.uptime)}
                  </div>

                  <div className="text-gray-400">Connections:</div>
                  <div className="text-right text-brand-300">
                    {node.metrics.connections}
                  </div>

                  <div className="text-gray-400">Error Rate:</div>
                  <div className="text-right text-brand-300">
                    {node.metrics.errorRate}%
                  </div>
                </div>

                {node.alerts.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-dark-600">
                    <div className="text-xs font-medium text-amber-400 mb-1">
                      {node.alerts.length} Alert
                      {node.alerts.length > 1 ? "s" : ""}
                    </div>
                    <div className="text-xs text-amber-300/80 truncate">
                      {node.alerts[0].message}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
