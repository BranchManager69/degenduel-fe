import React, { useEffect } from "react";

import { useCircuitBreakerSocket } from "../../hooks/websocket/legacy/useCircuitBreakerSocket";
import { useStore } from "../../store/useStore";
import CircuitBreakerCard from "./CircuitBreakerCard";

const CircuitBreakerPanel: React.FC = () => {
  const { circuitBreaker, setCircuitBreakerState, addCircuitAlert } =
    useStore();
  useCircuitBreakerSocket();

  useEffect(() => {
    // Initial state fetch
    fetch(`${process.env.REACT_APP_API_URL}/admin/circuit-breaker/states`)
      .then((res) => res.json())
      .then((data) => setCircuitBreakerState(data))
      .catch((error) => {
        console.error("Failed to fetch circuit breaker states:", error);
        addCircuitAlert({
          type: "error",
          title: "Connection Error",
          message: "Failed to fetch circuit breaker states",
        });
      });
  }, []);

  return (
    <div>
      {circuitBreaker.systemHealth && (
        <div
          className={`
          mb-6 p-4 rounded-lg border
          ${
            circuitBreaker.systemHealth.status === "operational"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : circuitBreaker.systemHealth.status === "degraded"
                ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
          }
        `}
        >
          <div className="flex items-center justify-between">
            <span>
              System Status: {circuitBreaker.systemHealth.status.toUpperCase()}
            </span>
            {circuitBreaker.systemHealth.activeIncidents > 0 && (
              <span className="text-sm">
                Active Incidents: {circuitBreaker.systemHealth.activeIncidents}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {circuitBreaker.services.map((service) => (
          <CircuitBreakerCard key={service.name} service={service} />
        ))}
      </div>
    </div>
  );
};

export default CircuitBreakerPanel;
