import React, { useEffect, useMemo, useState } from "react";
import {
  FaNetworkWired,
  FaPlay,
  FaProjectDiagram,
  FaStop,
  FaSync,
  FaTimes,
} from "react-icons/fa";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  Handle,
  Node,
  Position,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { WebSocketCard } from "../../components/admin/WebSocketCard";
import { WebSocketDebugPanel } from "../../components/debug/WebSocketDebugPanel";

interface WebSocketService {
  name: string;
  status: "operational" | "degraded" | "error";
  metrics: {
    totalConnections: number;
    activeSubscriptions: number;
    messageCount: number;
    errorCount: number;
    cacheHitRate: number;
    averageLatency: number;
    lastUpdate: string;
  };
  performance: {
    messageRate: number;
    errorRate: number;
    latencyTrend: number[];
  };
  config?: {
    maxMessageSize: number;
    rateLimit: number;
    requireAuth: boolean;
  };
}

// Add type for ServiceNode props
interface ServiceNodeProps {
  data: {
    label: string;
    status: "operational" | "degraded" | "error";
    metrics: string;
  };
}

// Update ServiceNode component with proper typing
const ServiceNode = ({ data }: ServiceNodeProps) => (
  <div
    className={`px-4 py-2 rounded-lg shadow-lg ${
      data.status === "operational"
        ? "bg-green-500/20 border-green-500/30"
        : data.status === "degraded"
        ? "bg-yellow-500/20 border-yellow-500/30"
        : "bg-red-500/20 border-red-500/30"
    } border`}
  >
    <Handle type="target" position={Position.Top} />
    <div className="font-semibold text-gray-100">{data.label}</div>
    <div className="text-xs text-gray-400">{data.metrics}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

// Add this after the imports
interface TransitionTest {
  serviceId: string;
  transitionType:
    | "powerUp"
    | "powerDown"
    | "degrading"
    | "recovering"
    | "failing"
    | "healing";
}

// Add this at the top of the file after imports
const WsLogo: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div
      className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-brand-600 font-display"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      ws://
    </div>
    <h1
      className="text-3xl font-bold text-gray-100"
      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
    >
      monitoring
    </h1>
  </div>
);

// Add ErrorBoundary component
class WebSocketErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[WebSocketMonitoringHub] Error caught by boundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 mb-4">
            An error occurred while rendering the WebSocket monitoring
            interface.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-md text-red-300 text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const WebSocketMonitoringHub: React.FC = () => {
  const [services, setServices] = useState<WebSocketService[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [pendingOperation, setPendingOperation] = useState<string | null>(null);
  const [showDependencies, setShowDependencies] = useState(false);
  const [sortBy, setSortBy] = useState<{
    field: "status" | "lastUpdate" | "errorRate" | "latency";
    direction: "asc" | "desc";
  }>({ field: "status", direction: "desc" });
  const [transitionTest, setTransitionTest] = useState<TransitionTest | null>(
    null
  );

  // Define our WebSocket services
  const webSocketServices = [
    { id: "analytics", name: "Analytics WebSocket" },
    { id: "base", name: "Base WebSocket" },
    { id: "circuit-breaker", name: "Circuit Breaker WebSocket" },
    { id: "contest", name: "Contest WebSocket" },
    { id: "market", name: "Market WebSocket" },
    { id: "monitor", name: "Monitor WebSocket" },
    { id: "wallet", name: "Wallet WebSocket" },
    { id: "portfolio", name: "Portfolio WebSocket" },
  ];

  // Define known service dependencies
  const serviceDependencies = {
    market: ["base"],
    contest: ["market", "base"],
    portfolio: ["market", "wallet"],
    wallet: ["base"],
    analytics: ["market", "contest", "wallet"],
    monitor: ["base"],
    "circuit-breaker": ["base"],
  };

  // Create flow elements from services with proper typing
  const flowElements = useMemo(() => {
    if (!services.length) return { nodes: [], edges: [] };

    const nodes: Node[] = webSocketServices.map((service, index) => {
      const serviceData = services.find((s) =>
        s.name.toLowerCase().includes(service.id)
      ) || {
        status: "error" as const,
        metrics: { averageLatency: 0 },
      };

      return {
        id: service.id,
        type: "serviceNode",
        position: {
          x: (index % 4) * 250 + 100,
          y: Math.floor(index / 4) * 150 + 100,
        },
        data: {
          label: service.name,
          status: serviceData.status,
          metrics: `${serviceData.metrics?.averageLatency}ms`,
        },
      };
    });

    const edges: Edge[] = Object.entries(serviceDependencies).flatMap(
      ([source, targets]) =>
        targets.map((target) => ({
          id: `${source}-${target}`,
          source,
          target,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#4f46e5", strokeWidth: 2, opacity: 0.5 },
        }))
    );

    return { nodes, edges };
  }, [services]);

  // Add nodeTypes for ReactFlow
  const nodeTypes = useMemo(() => ({ serviceNode: ServiceNode }), []);

  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    const fetchServicesStatus = async () => {
      try {
        if (!services.length) {
          setIsLoading(true);
        }

        const response = await fetch("/api/superadmin/websocket/status");

        if (!isMounted) return;

        if (!response.ok) {
          if (response.status === 502) {
            throw new Error(
              "WebSocket monitoring server is currently unavailable"
            );
          }
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();

        if (!isMounted) return;

        if (data.success) {
          setServices((prev) => {
            const hasChanged =
              JSON.stringify(prev) !== JSON.stringify(data.services);
            return hasChanged ? data.services : prev;
          });
          setLastUpdate(new Date());
          setError(null);
          setRetryCount(0);
        } else {
          throw new Error(data.message || "Failed to fetch services status");
        }
      } catch (err) {
        if (!isMounted) return;

        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);

        // Implement exponential backoff for retries
        const nextRetryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        setRetryCount((prev) => prev + 1);

        retryTimeout = setTimeout(() => {
          if (isMounted) {
            fetchServicesStatus();
          }
        }, nextRetryDelay);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchServicesStatus();
    const interval = setInterval(fetchServicesStatus, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearTimeout(retryTimeout);
    };
  }, [retryCount]);

  const handleServiceClick = (serviceId: string) => {
    setSelectedService((prev) => (prev === serviceId ? null : serviceId));
  };

  const selectedServiceData = selectedService
    ? services.find((s) =>
        s.name.toLowerCase().includes(selectedService.toLowerCase())
      )
    : null;

  const handleServiceControl = async (
    serviceId: string,
    action: "start" | "stop" | "restart"
  ) => {
    try {
      setPendingOperation(serviceId);
      const response = await fetch(
        `/api/superadmin/websocket/${serviceId}/${action}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${action} service: ${response.statusText}`);
      }

      // Update local state optimistically
      setServices((prev) =>
        prev.map((service) => {
          if (service.name.toLowerCase().includes(serviceId)) {
            return {
              ...service,
              status: action === "stop" ? "error" : "operational",
            };
          }
          return service;
        })
      );

      // Show success message (you could add a toast notification here)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to control service"
      );
    } finally {
      setPendingOperation(null);
    }
  };

  // Update the detail view to include controls
  const renderServiceControls = (service: WebSocketService) => (
    <div className="flex items-center space-x-4 mt-4 p-4 bg-dark-300/50 rounded-lg">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleServiceControl(
            service.name.toLowerCase().split(" ")[0],
            "start"
          );
        }}
        disabled={pendingOperation === service.name.toLowerCase().split(" ")[0]}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
          service.status === "operational"
            ? "bg-green-500/20 text-green-300 cursor-not-allowed"
            : "bg-green-500/20 hover:bg-green-500/30 text-green-300"
        }`}
      >
        <FaPlay className="w-4 h-4" />
        <span>Start</span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleServiceControl(
            service.name.toLowerCase().split(" ")[0],
            "stop"
          );
        }}
        disabled={pendingOperation === service.name.toLowerCase().split(" ")[0]}
        className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
          service.status === "error"
            ? "bg-red-500/20 text-red-300 cursor-not-allowed"
            : "bg-red-500/20 hover:bg-red-500/30 text-red-300"
        }`}
      >
        <FaStop className="w-4 h-4" />
        <span>Stop</span>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleServiceControl(
            service.name.toLowerCase().split(" ")[0],
            "restart"
          );
        }}
        disabled={pendingOperation === service.name.toLowerCase().split(" ")[0]}
        className="flex items-center space-x-2 px-4 py-2 rounded-md bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300"
      >
        <FaSync className="w-4 h-4" />
        <span>Restart</span>
      </button>

      {pendingOperation === service.name.toLowerCase().split(" ")[0] && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500" />
      )}
    </div>
  );

  // Update the getSortedServices function and modify how we use it
  const getSortedServices = (services: WebSocketService[]) => {
    const servicesWithDefaults = webSocketServices.map((service) => {
      return (
        services.find((s) => s.name.toLowerCase().includes(service.id)) || {
          name: service.name,
          status: "error" as const,
          metrics: {
            totalConnections: 0,
            activeSubscriptions: 0,
            messageCount: 0,
            errorCount: 0,
            cacheHitRate: 0,
            averageLatency: 0,
            lastUpdate: new Date().toISOString(),
          },
          performance: {
            messageRate: 0,
            errorRate: 0,
            latencyTrend: [],
          },
        }
      );
    });

    return [...servicesWithDefaults].sort((a, b) => {
      const direction = sortBy.direction === "asc" ? 1 : -1;

      switch (sortBy.field) {
        case "status":
          const statusOrder = { operational: 0, degraded: 1, error: 2 };
          return (statusOrder[a.status] - statusOrder[b.status]) * direction;
        case "lastUpdate":
          return (
            (new Date(b.metrics.lastUpdate).getTime() -
              new Date(a.metrics.lastUpdate).getTime()) *
            direction
          );
        case "errorRate":
          return (
            (a.performance.errorRate - b.performance.errorRate) * direction
          );
        case "latency":
          return (
            (a.metrics.averageLatency - b.metrics.averageLatency) * direction
          );
        default:
          return 0;
      }
    });
  };

  // Add this before the return statement
  const triggerTransition = (type: TransitionTest["transitionType"]) => {
    // Pick a random service or all services
    const serviceIds = webSocketServices.map((s) => s.id);
    const targetService =
      Math.random() > 0.5
        ? serviceIds[Math.floor(Math.random() * serviceIds.length)]
        : "all";

    setTransitionTest({
      serviceId: targetService,
      transitionType: type,
    });

    // Reset after animation
    setTimeout(() => setTransitionTest(null), 3000);
  };

  // Add this before the Services Grid section in the return statement
  const testControlPanel = (
    <div className="mb-8 bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-brand-500/20">
      <h2 className="text-xl font-bold text-gray-100 mb-4">
        Transition Test Lab 🧪
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <button
          onClick={() => triggerTransition("powerUp")}
          className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 transition-colors"
        >
          Power Up 🚀
        </button>
        <button
          onClick={() => triggerTransition("powerDown")}
          className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors"
        >
          Power Down 💤
        </button>
        <button
          onClick={() => triggerTransition("degrading")}
          className="px-4 py-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 transition-colors"
        >
          Degrading 📉
        </button>
        <button
          onClick={() => triggerTransition("recovering")}
          className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-colors"
        >
          Recovering 🔄
        </button>
        <button
          onClick={() => triggerTransition("failing")}
          className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors"
        >
          Failing 💥
        </button>
        <button
          onClick={() => triggerTransition("healing")}
          className="px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors"
        >
          Healing ✨
        </button>
      </div>
    </div>
  );

  return (
    <WebSocketErrorBoundary>
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <WsLogo />
            <p className="text-gray-400 mt-2">
              Unified interface for all services
              {!error && (
                <span className="ml-2 text-sm">
                  ({lastUpdate.toLocaleTimeString()})
                </span>
              )}
            </p>
          </div>
          <FaNetworkWired className="w-12 h-12 text-brand-400" />
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between backdrop-blur-lg">
            <div>
              <p className="text-red-400">{error}</p>
              {retryCount > 0 && (
                <p className="text-red-400/70 text-sm mt-1">
                  Retrying in {Math.min(Math.pow(2, retryCount), 30)} seconds...
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setRetryCount(0);
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-md text-red-300 text-sm transition-colors"
            >
              Retry Now
            </button>
          </div>
        )}

        {isLoading && !services.length && (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        )}

        {/* Add Dependencies View Toggle */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowDependencies(!showDependencies)}
            className="flex items-center space-x-2 px-4 py-2 rounded-md bg-brand-500/20 hover:bg-brand-500/30 text-brand-300"
          >
            <FaProjectDiagram className="w-4 h-4" />
            <span>{showDependencies ? "Hide" : "Show"} Dependencies</span>
          </button>
        </div>

        {/* Dependencies View */}
        {showDependencies && (
          <div className="mb-8 bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6">
            <h2 className="text-xl font-bold text-gray-100 mb-4">
              Service Dependencies
            </h2>
            <div className="h-[500px]">
              <ReactFlowProvider>
                <ReactFlow
                  nodes={flowElements.nodes}
                  edges={flowElements.edges}
                  nodeTypes={nodeTypes}
                  fitView
                  className="bg-dark-300/30"
                >
                  <Background />
                  <Controls />
                </ReactFlow>
              </ReactFlowProvider>
            </div>
          </div>
        )}

        {/* Selected Service Detail View */}
        {selectedServiceData && (
          <div className="mb-8 bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-100">
                  {selectedServiceData.name} Details
                </h2>
                <p
                  className={`text-sm mt-1 ${
                    selectedServiceData.status === "operational"
                      ? "text-green-400"
                      : selectedServiceData.status === "degraded"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  Status:{" "}
                  {selectedServiceData.status.charAt(0).toUpperCase() +
                    selectedServiceData.status.slice(1)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleServiceClick(selectedServiceData.name);
                }}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>

            {/* Service Controls */}
            {renderServiceControls(selectedServiceData)}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Performance Metrics */}
              <div className="bg-dark-300/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-brand-400 mb-3">
                  Performance
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Message Rate</span>
                    <span className="text-gray-200">
                      {selectedServiceData.performance.messageRate}/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Error Rate</span>
                    <span
                      className={`${
                        selectedServiceData.performance.errorRate > 5
                          ? "text-red-400"
                          : selectedServiceData.performance.errorRate > 1
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {selectedServiceData.performance.errorRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Average Latency</span>
                    <span
                      className={`${
                        selectedServiceData.metrics.averageLatency > 1000
                          ? "text-red-400"
                          : selectedServiceData.metrics.averageLatency > 500
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}
                    >
                      {selectedServiceData.metrics.averageLatency}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Messages</span>
                    <span className="text-gray-200">
                      {selectedServiceData.metrics.messageCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Errors</span>
                    <span className="text-gray-200">
                      {selectedServiceData.metrics.errorCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connection Stats */}
              <div className="bg-dark-300/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-brand-400 mb-3">
                  Connections
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Connections</span>
                    <span className="text-gray-200">
                      {selectedServiceData.metrics.totalConnections.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Subscriptions</span>
                    <span className="text-gray-200">
                      {selectedServiceData.metrics.activeSubscriptions.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cache Hit Rate</span>
                    <span
                      className={`${
                        selectedServiceData.metrics.cacheHitRate > 90
                          ? "text-green-400"
                          : selectedServiceData.metrics.cacheHitRate > 70
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {selectedServiceData.metrics.cacheHitRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Update</span>
                    <span className="text-gray-200">
                      {new Date(
                        selectedServiceData.metrics.lastUpdate
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Connection Rate</span>
                    <span className="text-gray-200">
                      {(
                        (selectedServiceData.metrics.totalConnections /
                          (selectedServiceData.metrics.activeSubscriptions ||
                            1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Health */}
              <div className="bg-dark-300/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-brand-400 mb-3">
                  Service Health
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Message Success Rate</span>
                    <span
                      className={`${
                        100 - selectedServiceData.performance.errorRate > 99
                          ? "text-green-400"
                          : 100 - selectedServiceData.performance.errorRate > 95
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {(
                        100 - selectedServiceData.performance.errorRate
                      ).toFixed(2)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Performance Score</span>
                    <span
                      className={`${
                        selectedServiceData.metrics.averageLatency < 100 &&
                        selectedServiceData.performance.errorRate < 1
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {Math.max(
                        0,
                        100 -
                          selectedServiceData.metrics.averageLatency / 10 -
                          selectedServiceData.performance.errorRate * 10
                      ).toFixed(0)}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Load Factor</span>
                    <span
                      className={`${
                        selectedServiceData.metrics.activeSubscriptions /
                          selectedServiceData.metrics.totalConnections >
                        0.8
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {(
                        (selectedServiceData.metrics.activeSubscriptions /
                          (selectedServiceData.metrics.totalConnections || 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  {selectedServiceData.performance.latencyTrend.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Latency Trend</span>
                      <span className="text-gray-200">
                        {selectedServiceData.performance.latencyTrend
                          .slice(-5)
                          .join(" → ")}
                        ms
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Configuration */}
              {selectedServiceData.config && (
                <div className="bg-dark-300/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-brand-400 mb-3">
                    Configuration
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Message Size</span>
                      <span className="text-gray-200">
                        {(
                          selectedServiceData.config.maxMessageSize / 1024
                        ).toFixed(2)}{" "}
                        KB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rate Limit</span>
                      <span className="text-gray-200">
                        {selectedServiceData.config.rateLimit}/s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Auth Required</span>
                      <span
                        className={`${
                          selectedServiceData.config.requireAuth
                            ? "text-green-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {selectedServiceData.config.requireAuth ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Sort Controls */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-gray-400">Sort by:</span>
            <select
              value={`${sortBy.field}-${sortBy.direction}`}
              onChange={(e) => {
                const [field, direction] = e.target.value.split("-") as [
                  "status" | "lastUpdate" | "errorRate" | "latency",
                  "asc" | "desc"
                ];
                setSortBy({ field, direction });
              }}
              className="bg-dark-300/30 border border-brand-500/20 rounded px-3 py-1 text-gray-200 focus:outline-none focus:border-brand-500/40"
            >
              <option value="status-desc">Status (Critical First)</option>
              <option value="status-asc">Status (Healthy First)</option>
              <option value="lastUpdate-desc">Recently Updated</option>
              <option value="lastUpdate-asc">Least Recently Updated</option>
              <option value="errorRate-desc">Highest Error Rate</option>
              <option value="errorRate-asc">Lowest Error Rate</option>
              <option value="latency-desc">Highest Latency</option>
              <option value="latency-asc">Lowest Latency</option>
            </select>
          </div>
        </div>

        {testControlPanel}

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {getSortedServices(services).map((serviceData) => {
            const service = webSocketServices.find(
              (s) => s.name === serviceData.name
            );
            if (!service) return null;

            return (
              <div
                key={service.id}
                onClick={() => handleServiceClick(service.id)}
                className={`group cursor-pointer transition-all duration-500 ${
                  selectedService === service.id ? "ring-2 ring-brand-500" : ""
                }`}
              >
                <div className="transform transition-all duration-500 group-hover:scale-[1.02] group-hover:-translate-y-1">
                  <WebSocketCard
                    service={serviceData}
                    onPowerAction={() =>
                      handleServiceControl(
                        service.id,
                        serviceData.status === "operational" ? "stop" : "start"
                      )
                    }
                    isDisabled={pendingOperation === service.id}
                    transitionType={
                      transitionTest?.serviceId === "all" ||
                      transitionTest?.serviceId === service.id
                        ? transitionTest.transitionType
                        : undefined
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* System-wide Metrics */}
        <div className="mt-8 bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-brand-400/20">
          <h2 className="text-xl font-bold text-gray-100 mb-4">
            System-wide Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-dark-300/30 rounded-lg p-4">
              <div className="text-sm text-gray-400">
                Total Active Connections
              </div>
              <div className="text-2xl font-bold text-gray-100">
                {services.reduce(
                  (sum, service) => sum + service.metrics.totalConnections,
                  0
                )}
              </div>
            </div>
            <div className="bg-dark-300/30 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Messages/sec</div>
              <div className="text-2xl font-bold text-gray-100">
                {services.reduce(
                  (sum, service) => sum + service.performance.messageRate,
                  0
                )}
              </div>
            </div>
            <div className="bg-dark-300/30 rounded-lg p-4">
              <div className="text-sm text-gray-400">Average Latency</div>
              <div className="text-2xl font-bold text-gray-100">
                {services.length
                  ? (
                      services.reduce(
                        (sum, service) => sum + service.metrics.averageLatency,
                        0
                      ) / services.length
                    ).toFixed(2)
                  : 0}
                ms
              </div>
            </div>
            <div className="bg-dark-300/30 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Errors (24h)</div>
              <div className="text-2xl font-bold text-gray-100">
                {services.reduce(
                  (sum, service) => sum + service.metrics.errorCount,
                  0
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Debug Panel */}
        <WebSocketDebugPanel />
      </div>
    </WebSocketErrorBoundary>
  );
};

export default WebSocketMonitoringHub;
