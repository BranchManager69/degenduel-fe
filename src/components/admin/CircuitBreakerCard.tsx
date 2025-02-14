import React from "react";

export interface CircuitBreakerCardProps {
  service: {
    name: string;
    status: "healthy" | "degraded" | "failed";
    circuit: {
      state: "closed" | "open" | "half-open";
      failureCount: number;
      lastFailure: string | null;
      recoveryAttempts: number;
    };
    config?: {
      failureThreshold: number;
      recoveryTimeout: number;
      requestLimit: number;
    };
  };
}

const CircuitBreakerCard: React.FC<CircuitBreakerCardProps> = ({ service }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "degraded":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
      case "failed":
        return "bg-red-500/10 border-red-500/20 text-red-400";
      default:
        return "bg-gray-500/10 border-gray-500/20 text-gray-400";
    }
  };

  const getCircuitIcon = (state: string) => {
    switch (state) {
      case "closed":
        return "✓";
      case "half-open":
        return "↻";
      case "open":
        return "✕";
      default:
        return "⚠";
    }
  };

  const getFailureProgress = () => {
    if (!service.config?.failureThreshold) return 0;
    return (
      (service.circuit.failureCount / service.config.failureThreshold) * 100
    );
  };

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-200">
            {service.name}
          </h3>
          <span
            className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${getStatusColor(service.status)}
          `}
          >
            {service.status.toUpperCase()}
          </span>
        </div>

        <div className="space-y-4">
          {/* Circuit State */}
          <div>
            <span className="text-sm text-gray-400">Circuit State</span>
            <div className="flex items-center mt-1">
              <span className="text-lg mr-2">
                {getCircuitIcon(service.circuit.state)}
              </span>
              <span className="text-sm text-gray-300">
                {service.circuit.state.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Failure Count */}
          <div>
            <span className="text-sm text-gray-400">Failure Count</span>
            <div className="mt-1">
              <div className="text-sm text-gray-300 mb-1">
                {service.circuit.failureCount} /{" "}
                {service.config?.failureThreshold || "∞"}
              </div>
              <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    service.circuit.failureCount > 0
                      ? "bg-red-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${getFailureProgress()}%` }}
                />
              </div>
            </div>
          </div>

          {/* Last Failure */}
          {service.circuit.lastFailure && (
            <div>
              <span className="text-sm text-gray-400">Last Failure</span>
              <div className="text-sm text-gray-300 mt-1">
                {new Date(service.circuit.lastFailure).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CircuitBreakerCard;
