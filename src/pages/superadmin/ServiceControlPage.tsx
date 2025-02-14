// src/pages/superadmin/ServiceControlPage.tsx

import { motion } from "framer-motion";
import React, { useState } from "react";
import styled from "styled-components";

// Types
interface ServiceState {
  enabled: boolean;
  running: boolean;
  last_started: string | null;
  last_check?: string;
  status: string;
  config: any;
}

interface ServiceStates {
  [key: string]: ServiceState;
}

// Styled Components (using your dark theme)
const SwitchContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120px;
  margin: 15px;
  perspective: 1000px;
`;

const SwitchBase = styled.div`
  width: 60px;
  height: 100px;
  background: var(--color-dark-200);
  border-radius: 10px;
  box-shadow: inset 0 -2px 10px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
  cursor: pointer;
  border: 1px solid var(--color-dark-300);
`;

const LED = styled.div<{ $active: boolean }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin: 5px 0;
  background: ${(props: { $active: boolean }) =>
    props.$active ? "#48BB78" : "#F56565"};
  box-shadow: ${(props: { $active: boolean }) =>
    props.$active
      ? "0 0 10px #48BB78, 0 0 5px #48BB78"
      : "0 0 10px #F56565, 0 0 5px #F56565"};
`;

const SwitchLever = styled(motion.div)`
  width: 40px;
  height: 60px;
  background: linear-gradient(
    to right,
    var(--color-dark-300),
    var(--color-dark-400)
  );
  border-radius: 5px;
  margin-top: 5px;
  box-shadow: -1px 0 2px rgba(0, 0, 0, 0.2), 1px 0 2px rgba(255, 255, 255, 0.1);
`;

export const ServiceControlPage: React.FC = () => {
  const [services, setServices] = useState<ServiceStates>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggleLoading, setToggleLoading] = useState("");

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/superadmin/services/states");
      const data = await response.json();
      if (data.success) {
        setServices(data.services);
        setError(null);
      } else {
        setError("Failed to fetch service states");
      }
    } catch (err) {
      setError("Error connecting to server");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (serviceName: string) => {
    setToggleLoading(serviceName);
    try {
      const response = await fetch(
        `/api/superadmin/services/${serviceName}/toggle`,
        {
          method: "POST",
        }
      );
      const data = await response.json();
      if (data.success) {
        setServices((prev) => ({
          ...prev,
          [serviceName]: data.state,
        }));
      } else {
        setError("Failed to toggle service");
      }
    } catch (err) {
      setError("Error toggling service");
      console.error("Error:", err);
    } finally {
      setToggleLoading("");
    }
  };

  React.useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
        <h2 className="text-red-400 font-bold text-lg mb-2">
          ⚠️ Deprecated Component
        </h2>
        <p className="text-gray-300">
          This service control interface is deprecated. Please use the new{" "}
          <a
            href="/superadmin/switchboard"
            className="text-brand-400 hover:text-brand-300 underline"
          >
            Service Switchboard
          </a>{" "}
          instead, which provides improved monitoring and real-time updates.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-100">
          Service Control Panel
        </h1>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      )}

      {!loading && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
              <div className="text-sm text-gray-400">Active Services</div>
              <div className="text-xl font-semibold text-gray-100">
                {Object.values(services).filter((s) => s.enabled).length}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                of {Object.keys(services).length} total
              </div>
            </div>
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-dark-300">
              <div className="text-sm text-gray-400">Last Update</div>
              <div className="text-xl font-semibold text-gray-100">
                {new Date().toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Auto-updates every 30s
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="text-red-400">{error}</div>
            </div>
          )}

          {/* Switchboard */}
          <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-300">
            <div className="p-4 border-b border-dark-300">
              <h2 className="text-xl font-semibold text-gray-100">
                Service Switchboard
              </h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
                {Object.entries(services).map(([name, state]) => (
                  <SwitchContainer key={name}>
                    <SwitchBase
                      onClick={() => !toggleLoading && handleToggle(name)}
                    >
                      <LED $active={state.enabled} />
                      <SwitchLever
                        animate={{
                          y: state.enabled ? -20 : 20,
                          rotateX: state.enabled ? -20 : 20,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 20,
                        }}
                        style={{ originY: 0.5 }}
                      />
                    </SwitchBase>
                    <div className="text-sm text-gray-400 text-center mt-2">
                      {name.replace(/_/g, " ").replace("service", "").trim()}
                    </div>
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {state.status}
                    </div>
                  </SwitchContainer>
                ))}
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-dark-300">
            <div className="p-4 border-b border-dark-300">
              <h2 className="text-xl font-semibold text-gray-100">
                Service Details
              </h2>
            </div>
            <div className="divide-y divide-dark-300">
              {Object.entries(services).map(([name, state]) => (
                <div
                  key={name}
                  className="p-4 hover:bg-dark-300/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-200">{name}</span>
                    <span
                      className={`text-sm ${
                        state.enabled ? "text-brand-400" : "text-red-400"
                      }`}
                    >
                      {state.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Last Started:{" "}
                    {state.last_started
                      ? new Date(state.last_started).toLocaleString()
                      : "Never"}
                  </div>
                  {state.last_check && (
                    <div className="text-sm text-gray-400">
                      Last Check: {new Date(state.last_check).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
