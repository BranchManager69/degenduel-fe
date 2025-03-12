import React from "react";

import CircuitBreakerPanel from "../../components/admin/CircuitBreakerPanel";

const CircuitBreakerPage: React.FC = () => {
  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">
          Circuit Breaker Monitor
        </h1>
        <p className="text-gray-400 mt-2">
          Real-time system protection and performance monitoring
        </p>
      </div>

      <CircuitBreakerPanel />
    </div>
  );
};

export default CircuitBreakerPage;
