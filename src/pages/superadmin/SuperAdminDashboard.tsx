// src/pages/superadmin/SuperAdminDashboard.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BalanceManager } from "../../components/admin/BalanceManager";
import CircuitBreakerPanel from "../../components/admin/CircuitBreakerPanel";
import { FaucetManager } from "../../components/admin/FaucetManager";
import { LiveUserActivityMap } from "../../components/admin/LiveUserActivityMap";
import { LogViewer } from "../../components/admin/LogViewer";
import { SpyPanel } from "../../components/admin/SpyPanel";
import { VanityPool } from "../../components/admin/VanityPool";
import { WalletManagement } from "../../components/admin/WalletManagement";
import { ContestProvider } from "../../components/ApiPlaygroundParts/ContestContext";
import { ContestsList } from "../../components/ApiPlaygroundParts/ContestsList";
import { EndContest } from "../../components/ApiPlaygroundParts/EndContest";
import { StartContest } from "../../components/ApiPlaygroundParts/StartContest";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";

type TabType =
  | "system"
  | "spy"
  | "faucet-mgr"
  | "wallet-gen"
  | "vanity"
  | "reseed"
  | "contests"
  | "circuit"
  | "activity"
  | "websocket";

export const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("activity");
  const { maintenanceMode, setMaintenanceMode, user } = useStore();
  const [maintenanceDuration, setMaintenanceDuration] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  const toggleMaintenanceMode = async () => {
    try {
      setError(null);
      setIsTogglingMaintenance(true);
      const newState = !maintenanceMode;
      const timestamp = new Date().toISOString();

      const response = await ddApi.admin.setMaintenanceMode(newState);

      if (!response.ok) {
        throw new Error(
          `Failed to ${newState ? "enable" : "disable"} maintenance mode`
        );
      }

      if (newState) {
        try {
          await ddApi.fetch("/api/admin/maintenance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              enabled: true,
              value: {
                enabled: true,
                updated_by: user?.wallet_address,
                last_enabled: timestamp,
                last_disabled: null,
                settings: {
                  estimated_duration: maintenanceDuration,
                  start_time: timestamp,
                },
              },
            }),
          });
        } catch (err) {
          console.warn(
            "Failed to set maintenance settings, but mode was toggled:",
            err
          );
        }
      }

      setRetryAttempt(0);
      setMaintenanceMode(newState);

      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.reload();
    } catch (err) {
      console.error("Failed to toggle maintenance mode:", err);

      if (!maintenanceMode && retryAttempt < MAX_RETRIES) {
        setError(
          `Failed to disable maintenance mode. Retrying in ${
            RETRY_DELAY / 1000
          } seconds... (Attempt ${retryAttempt + 1}/${MAX_RETRIES})`
        );

        setTimeout(() => {
          setRetryAttempt((prev) => prev + 1);
          toggleMaintenanceMode();
        }, RETRY_DELAY);
      } else {
        setError(
          `Failed to ${
            maintenanceMode ? "disable" : "enable"
          } maintenance mode. ${
            err instanceof Error && err.message.includes("network")
              ? "Please check your network connection."
              : "Please try again in a few seconds."
          }`
        );
        setRetryAttempt(0);
      }
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  return (
    <ContestProvider>
      <div className="min-h-screen bg-dark-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Control Panel Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Control Panel Hub Link */}
            <Link
              to="/superadmin/control-hub"
              className="group relative overflow-hidden bg-dark-200/50 backdrop-blur-lg rounded-lg border border-brand-500/20 hover:bg-dark-200/70 transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">🎛️</span>
                  <div>
                    <h2 className="font-cyber tracking-wider text-2xl bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent">
                      CONTROL HUB
                    </h2>
                    <p className="text-sm text-gray-400 font-mono mt-1">
                      MASTER_CONTROL_PANEL_ACCESS
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 p-4">
                  <span className="text-brand-400 text-lg group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
                {/* Animated gradient border */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/10 to-brand-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            </Link>

            {/* Service Control Panel Link */}
            <Link
              to="/superadmin/services"
              className="group relative overflow-hidden bg-dark-200/50 backdrop-blur-lg rounded-lg border border-brand-500/20 hover:bg-dark-200/70 transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">💻</span>
                  <div>
                    <h2 className="font-cyber tracking-wider text-2xl bg-gradient-to-r from-brand-400 to-brand-500 bg-clip-text text-transparent">
                      SERVICE CONTROL
                    </h2>
                    <p className="text-sm text-gray-400 font-mono mt-1">
                      SYSTEM_SERVICES_MANAGEMENT_INTERFACE
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 p-4">
                  <span className="text-brand-400 text-lg group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
                {/* Animated gradient border */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/10 to-brand-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
            </Link>

            {/* Maintenance Mode Control */}
            <div className="bg-dark-200/50 backdrop-blur-lg rounded-lg border border-brand-500/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-cyber tracking-wider text-2xl bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
                      MAINTENANCE MODE
                    </h2>
                    <p className="text-sm text-gray-400 font-mono mt-1">
                      SYSTEM_MAINTENANCE_CONTROL_INTERFACE
                    </p>
                  </div>
                  <div
                    className={`h-3 w-3 rounded-full ${
                      maintenanceMode
                        ? "bg-red-500 animate-pulse"
                        : "bg-green-500"
                    }`}
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mb-4"
                    >
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Duration Setting (only shown when system is live) */}
                <AnimatePresence>
                  {!maintenanceMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <label className="text-sm text-gray-400 block mb-2 font-mono">
                        ESTIMATED DURATION (MIN)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={maintenanceDuration}
                        onChange={(e) =>
                          setMaintenanceDuration(
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        className="w-full bg-dark-200/50 border border-brand-500/20 rounded px-3 py-2 text-gray-300 font-mono text-center"
                      />
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        ({Math.floor(maintenanceDuration / 60)}h{" "}
                        {maintenanceDuration % 60}m)
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={toggleMaintenanceMode}
                  disabled={isTogglingMaintenance}
                  className={`
                    w-full relative overflow-hidden rounded-lg border-2 
                    ${
                      maintenanceMode
                        ? "border-red-500/50 bg-red-500/10 hover:bg-red-500/20"
                        : "border-green-500/50 bg-green-500/10 hover:bg-green-500/20"
                    }
                    ${isTogglingMaintenance ? "opacity-75" : ""}
                    transition-all duration-300 py-3 px-4 font-cyber tracking-wider
                  `}
                >
                  {isTogglingMaintenance ? (
                    <span className="text-brand-400 animate-pulse">
                      {maintenanceMode ? "DEACTIVATING..." : "INITIATING..."}
                    </span>
                  ) : maintenanceMode ? (
                    <span className="text-red-400">DEACTIVATE MAINTENANCE</span>
                  ) : (
                    <span className="text-green-400">INITIATE MAINTENANCE</span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-dark-300">
              <nav className="-mb-px flex flex-wrap">
                {/* Tabs */}
                {[
                  { key: "activity", label: "Live Activity", icon: "👥" },
                  { key: "websocket", label: "WebSocket Testing", icon: "🔌" },
                  { key: "system", label: "Sys. Logs", icon: "📋" },
                  { key: "circuit", label: "Circuit Monitor", icon: "⚡" },
                  { key: "spy", label: "User Spy", icon: "🔍" },
                  { key: "contests", label: "Contests", icon: "🏆" },
                  { key: "faucet-mgr", label: "Faucet Mgr.", icon: "💧" },
                  { key: "wallet-gen", label: "Wallet Gen.", icon: "🔑" },
                  { key: "vanity", label: "Vanity Pool", icon: "✨" },
                  { key: "reseed", label: "Reseed DB", icon: "🌱" },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as TabType)}
                    className={`${
                      activeTab === key
                        ? "border-brand-500 text-brand-400"
                        : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-200 flex items-center gap-2`}
                  >
                    <span className="text-base">{icon}</span>
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "activity" ? (
                <LiveUserActivityMap />
              ) : activeTab === "websocket" ? (
                <div>
                  <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <span className="text-xl">🔌</span>
                    WebSocket Testing
                  </h2>
                  <Link
                    to="/websocket-test"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 rounded-lg transition-colors duration-200"
                  >
                    <span>Open WebSocket Testing Panel</span>
                    <span className="text-brand-400">→</span>
                  </Link>
                </div>
              ) : activeTab === "spy" ? (
                <SpyPanel />
              ) : activeTab === "system" ? (
                <div className="space-y-6">
                  {/* System Logs */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                      <span className="text-xl">📋</span>
                      System Logs
                    </h2>
                    <div className="bg-dark-300/30 rounded-lg">
                      <LogViewer />
                    </div>
                  </div>

                  {/* Balance Manager */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                      <span className="text-xl">💰</span>
                      Balance Management
                    </h2>
                    <BalanceManager />
                  </div>
                </div>
              ) : activeTab === "circuit" ? (
                <div>
                  <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    Circuit Breaker Monitor
                  </h2>
                  <CircuitBreakerPanel />
                </div>
              ) : activeTab === "contests" ? (
                <div className="space-y-6">
                  {/* Contest Management */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-dark-300/30 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-100 mb-4">
                        Start Contest
                      </h3>
                      <StartContest />
                    </div>
                    <div className="bg-dark-300/30 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-100 mb-4">
                        End Contest
                      </h3>
                      <EndContest />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-100 mb-4">
                      Contest Overview
                    </h3>
                    <ContestsList />
                  </div>
                </div>
              ) : activeTab === "vanity" ? (
                <VanityPool />
              ) : activeTab === "wallet-gen" ? (
                <WalletManagement />
              ) : activeTab === "faucet-mgr" ? (
                <FaucetManager />
              ) : activeTab === "reseed" ? (
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-100 mb-4">
                    Database Reseed
                  </h2>
                  <p className="text-gray-400">
                    Database reseed interface coming soon...
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </ContestProvider>
  );
};
