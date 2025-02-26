// src/pages/superadmin/SuperAdminDashboard.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import CircuitBreakerPanel from "../../components/admin/CircuitBreakerPanel";
import { FaucetManager } from "../../components/admin/FaucetManager";
import { LiveUserActivityMap } from "../../components/admin/LiveUserActivityMap";
import { LogViewer } from "../../components/admin/LogViewer";
import { SpyPanel } from "../../components/admin/SpyPanel";
import { VanityPool } from "../../components/admin/VanityPool";
import { SuperAdminWalletManagement } from "../../components/admin/SuperAdminWalletManagement";
import { BackgroundEffects } from "../../components/animated-background/BackgroundEffects";
import { ContestProvider } from "../../components/ApiPlaygroundParts/ContestContext";
import { ContestsList } from "../../components/ApiPlaygroundParts/ContestsList";
import { EndContest } from "../../components/ApiPlaygroundParts/EndContest";
import { StartContest } from "../../components/ApiPlaygroundParts/StartContest";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";

export const SuperAdminDashboard: React.FC = () => {
  const { maintenanceMode, setMaintenanceMode, user } = useStore();
  const [maintenanceDuration, setMaintenanceDuration] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState<boolean>(false);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;
  //const [selectedUser, setSelectedUser] = useState<User | null>(null);
  //const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  //const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

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

  // Define superadmin sections with enhanced capabilities
  const superadminSections = [
    {
      id: "control-hub",
      title: "Control Hub",
      icon: "🎛️",
      description: "Master control panel for all system operations",
      link: "/superadmin/control-hub",
      color: "brand",
      badge: "MASTER",
    },
    {
      id: "websocket",
      title: "WebSocket Monitor",
      icon: "🔌",
      description: "Advanced WebSocket monitoring and debugging",
      link: "/superadmin/websocket-monitor",
      color: "cyber",
      badge: "LIVE",
    },
    {
      id: "circuit-breaker",
      title: "Circuit Monitor (Deprecated)",
      icon: "⚡",
      description: "Monitor and manage system circuit breakers - Use SkyDuel instead",
      component: (
        <div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4 text-red-400">
            This component is deprecated. Please use the SkyDuel Console with Circuit View instead.
          </div>
          <CircuitBreakerPanel />
        </div>
      ),
      color: "yellow",
      badge: "DEPRECATED",
    },
    {
      id: "activity",
      title: "Live Activity",
      icon: "👥",
      description: "Real-time user activity monitoring",
      component: <LiveUserActivityMap />,
      color: "emerald",
      badge: "REAL-TIME",
    },
    {
      id: "spy",
      title: "User Spy",
      icon: "🔍",
      description: "Advanced user monitoring and debugging",
      component: <SpyPanel />,
      color: "purple",
      badge: "ADMIN",
    },
    {
      id: "logs",
      title: "System Logs",
      icon: "📋",
      description: "View and analyze system logs",
      component: <LogViewer />,
      color: "blue",
      badge: "DEBUG",
    },
    {
      id: "faucet",
      title: "Faucet Manager",
      icon: "💧",
      description: "Manage test token distribution",
      component: <FaucetManager />,
      color: "cyan",
      badge: "TOKENS",
    },
    {
      id: "wallet",
      title: "Wallet Management",
      icon: "🔑",
      description: "Generate and manage system wallets",
      component: <SuperAdminWalletManagement />,
      color: "pink",
      badge: "SECURE",
    },
    {
      id: "vanity",
      title: "Vanity Pool",
      icon: "✨",
      description: "Manage vanity address generation",
      component: <VanityPool />,
      color: "indigo",
      badge: "POOL",
    },
    {
      id: "contests",
      title: "Contest Control",
      icon: "🏆",
      description: "Advanced contest management",
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-dark-300/30 rounded-lg p-4">
              <StartContest />
            </div>
            <div className="bg-dark-300/30 rounded-lg p-4">
              <EndContest />
            </div>
          </div>
          <ContestsList />
        </div>
      ),
      color: "amber",
      badge: "MANAGE",
    },
  ];

  return (
    <ContestProvider>
      {/* Add BackgroundEffects for visual consistency with other pages */}
      <BackgroundEffects />
      
      <div className="container mx-auto p-6 space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-cyber tracking-wider bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              SUPERADMIN CONTROL CENTER
            </h1>
            <p className="text-gray-400 mt-2 font-mono">
              AUTHORIZATION_LEVEL: SUPERADMIN_CLEARANCE
            </p>
          </div>
          <div className="text-brand-400 text-4xl animate-pulse">⚡</div>
        </div>

        {/* Maintenance Mode Control */}
        <div className="bg-dark-200/50 backdrop-blur-lg p-8 rounded-lg border border-brand-500/20 relative overflow-hidden">
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
                maintenanceMode ? "bg-red-500 animate-pulse" : "bg-green-500"
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

        {/* Quick Actions Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/admin/skyduel"
            className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border-2 border-purple-500/30 hover:bg-dark-300/50 hover:border-purple-500/50 transition-all duration-300 group relative overflow-hidden shadow-lg"
          >
            <div className="absolute -top-1 -right-1">
              <div className="px-2 py-0.5 text-xs font-bold rounded-md bg-purple-500/30 text-purple-200 font-mono">
                NEW
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-3xl">⚡</span>
              <span className="text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                →
              </span>
            </div>
            <h3 className="text-base font-bold text-purple-200 mt-2">
              SkyDuel Console
            </h3>
            <p className="text-xs text-purple-300/80 mt-1">Unified service management</p>
          </Link>
          
          <Link
            to="/superadmin/wallet-monitoring"
            className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border-2 border-blue-500/30 hover:bg-dark-300/50 hover:border-blue-500/50 transition-all duration-300 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">👁️</span>
              <span className="text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                →
              </span>
            </div>
            <h3 className="text-base font-bold text-blue-200 mt-2">
              Wallet Monitoring
            </h3>
            <p className="text-xs text-blue-300/80 mt-1">Transaction tracking</p>
          </Link>
          
          <Link
            to="/api-playground"
            className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border-2 border-cyan-500/30 hover:bg-dark-300/50 hover:border-cyan-500/50 transition-all duration-300 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">🧪</span>
              <span className="text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                →
              </span>
            </div>
            <h3 className="text-base font-bold text-cyan-200 mt-2">
              API Playground
            </h3>
            <p className="text-xs text-cyan-300/80 mt-1">API testing environment</p>
          </Link>
          
          <Link
            to="/wss-playground"
            className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border-2 border-emerald-500/30 hover:bg-dark-300/50 hover:border-emerald-500/50 transition-all duration-300 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">🔌</span>
              <span className="text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity text-lg">
                →
              </span>
            </div>
            <h3 className="text-base font-bold text-emerald-200 mt-2">
              WSS Playground
            </h3>
            <p className="text-xs text-emerald-300/80 mt-1">WebSocket testing</p>
          </Link>
        </div>
        
        {/* Secondary Actions */}
        <div className="grid grid-cols-3 gap-4">
          <Link
            to="/amm-sim"
            className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border-2 border-pink-500/30 hover:bg-dark-300/50 hover:border-pink-500/50 transition-all duration-300 group shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">📊</span>
              <span className="text-pink-300 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </div>
            <h3 className="text-sm font-bold text-pink-200 mt-2">
              AMM Simulator
            </h3>
          </Link>
          
          <Link
            to="/superadmin/switchboard"
            className="bg-dark-300/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30 hover:bg-dark-300/70 transition-all duration-300 group relative opacity-60 grayscale"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">🔄</span>
              <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity line-through">
                →
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-400 mt-2 line-through">
              Service Switchboard
            </h3>
            <div className="text-xs text-red-400/80 mt-1">Deprecated</div>
          </Link>
          
          <Link
            to="/superadmin/circuit-breaker"
            className="bg-dark-300/50 backdrop-blur-sm rounded-xl p-4 border border-gray-600/30 hover:bg-dark-300/70 transition-all duration-300 group relative opacity-60 grayscale"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">⚡</span>
              <span className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity line-through">
                →
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-400 mt-2 line-through">
              Circuit Monitor
            </h3>
            <div className="text-xs text-red-400/80 mt-1">Deprecated</div>
          </Link>
        </div>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {superadminSections.map((section) => (
            <motion.div
              key={section.id}
              className={`
                bg-dark-200/70 backdrop-blur-lg rounded-xl border-2 shadow-lg
                ${selectedSection === section.id 
                  ? `border-${section.color}-500/50 shadow-${section.color}-500/10` 
                  : `border-${section.color}-500/30 hover:border-${section.color}-500/50`}
                transition-all duration-300 group relative
                ${
                  selectedSection === section.id && section.id === 'wallet' && expandedView
                    ? 'col-span-full md:col-span-full lg:col-span-full'
                    : ''
                }
              `}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              {/* Badge - Only show for non-deprecated items */}
              {section.badge && section.badge !== "DEPRECATED" && (
                <div className="absolute -top-1 -right-1">
                  <div
                    className={`
                    px-2 py-0.5 text-xs font-bold rounded-md
                    bg-${section.color}-500/30 text-${section.color}-200
                    font-mono
                  `}
                  >
                    {section.badge}
                  </div>
                </div>
              )}

              {section.link ? (
                <Link to={section.link} className="block p-6 h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className={`text-3xl mb-3 text-${section.color}-300 group-hover:scale-110 transition-transform`}>{section.icon}</div>
                      <h3
                        className={`text-xl font-bold text-${section.color}-200 mb-2`}
                      >
                        {section.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {section.description}
                      </p>
                    </div>
                    <div
                      className={`text-${section.color}-300 text-lg opacity-0 group-hover:opacity-100 transition-opacity`}
                    >
                      →
                    </div>
                  </div>
                </Link>
              ) : (
                <button
                  onClick={() =>
                    setSelectedSection(
                      selectedSection === section.id ? null : section.id
                    )
                  }
                  className="block w-full p-6 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className={`text-3xl mb-3 text-${section.color}-300 group-hover:scale-110 transition-transform`}>{section.icon}</div>
                      <h3
                        className={`text-xl font-bold text-${section.color}-200 mb-2`}
                      >
                        {section.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {section.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedSection === section.id && section.id === 'wallet' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedView(!expandedView);
                          }}
                          className={`text-${section.color}-200 px-2 py-1 text-xs rounded-md border-2 border-${section.color}-500/30 bg-dark-300/80 hover:bg-dark-300/90`}
                        >
                          {expandedView ? 'Compact View' : 'Expand View'}
                        </button>
                      )}
                      <div
                        className={`text-${section.color}-300 text-lg transform transition-all ${
                          selectedSection === section.id ? "rotate-180" : ""
                        }`}
                      >
                        ↓
                      </div>
                    </div>
                  </div>
                </button>
              )}

              {/* Expandable Content */}
              {selectedSection === section.id && section.component && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 pb-6"
                >
                  <div className="pt-4 border-t border-dark-300">
                    {section.component}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </ContestProvider>
  );
};
