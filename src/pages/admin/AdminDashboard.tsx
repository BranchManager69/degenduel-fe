// src/pages/AdminDashboard.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ActivityMonitor } from "../../components/admin/ActivityMonitor";
import { BalanceManager } from "../../components/admin/BalanceManager";
import WalletReclaimFunds from "../../components/admin/WalletReclaimFunds";
import { BackgroundEffects } from "../../components/animated-background/BackgroundEffects";
import { ContestProvider } from "../../components/ApiPlaygroundParts/ContestContext";
import { ContestsList } from "../../components/ApiPlaygroundParts/ContestsList";
import { EndContest } from "../../components/ApiPlaygroundParts/EndContest";
import { StartContest } from "../../components/ApiPlaygroundParts/StartContest";
import { UserDetail } from "../../components/ApiPlaygroundParts/UserDetail";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";

// Add new interface for system alerts
interface SystemAlert {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: Date;
  details?: Record<string, any>;
}

export const AdminDashboard: React.FC = () => {
  const { maintenanceMode, setMaintenanceMode, user } = useStore();
  const [maintenanceDuration, setMaintenanceDuration] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Constants for retry logic
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds between retries

  const toggleMaintenanceMode = async () => {
    try {
      setError(null);
      setIsTogglingMaintenance(true);
      const newState = !maintenanceMode;
      const timestamp = new Date().toISOString();

      // First try to toggle maintenance mode with consolidated settings
      const response = await ddApi.admin.setMaintenanceMode(newState);

      if (!response.ok) {
        throw new Error(
          `Failed to ${newState ? "enable" : "disable"} maintenance mode`
        );
      }

      // If enabling maintenance mode, update settings
      if (newState) {
        try {
          await ddApi.fetch("/admin/maintenance", {
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

      // Reset retry count on success
      setRetryAttempt(0);
      setMaintenanceMode(newState);

      // Add a small delay before reload to ensure state is saved
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.reload();
    } catch (err) {
      console.error("Failed to toggle maintenance mode:", err);

      // Handle retry logic for disabling maintenance mode
      if (!maintenanceMode && retryAttempt < MAX_RETRIES) {
        setError(
          `Failed to disable maintenance mode. Retrying in ${
            RETRY_DELAY / 1000
          } seconds... ` + `(Attempt ${retryAttempt + 1}/${MAX_RETRIES})`
        );

        setTimeout(() => {
          setRetryAttempt((prev) => prev + 1);
          toggleMaintenanceMode();
        }, RETRY_DELAY);
      } else {
        setError(
          `Failed to ${
            maintenanceMode ? "disable" : "enable"
          } maintenance mode. ` +
            (err instanceof Error && err.message.includes("network")
              ? "Please check your network connection."
              : "Please try again in a few seconds.")
        );
        setRetryAttempt(0);
      }
    } finally {
      setIsTogglingMaintenance(false);
    }
  };

  // Fetch current duration when component mounts
  useEffect(() => {
    const fetchDuration = async () => {
      try {
        const response = await ddApi.fetch("/admin/maintenance/settings");
        if (!response.ok) {
          // If settings don't exist yet, that's okay - we'll use defaults
          if (response.status === 404) {
            return;
          }
          throw new Error("Failed to fetch maintenance settings");
        }
        const settings = await response.json();
        const duration = settings.find(
          (s: any) => s.key === "maintenance_estimated_duration"
        )?.value;
        if (duration) {
          setMaintenanceDuration(parseInt(duration));
        }
      } catch (err) {
        console.error("Failed to fetch maintenance duration:", err);
        // Don't show error to user for this - we'll just use defaults
      }
    };

    fetchDuration();
  }, []);

  // Add system alert handler
  const addSystemAlert = (alert: Omit<SystemAlert, "id" | "timestamp">) => {
    setSystemAlerts((prev) =>
      [
        {
          ...alert,
          id: Math.random().toString(36).substring(7),
          timestamp: new Date(),
        },
        ...prev,
      ].slice(0, 10)
    ); // Keep only last 10 alerts
  };

  // Listen for circuit breaker events
  useEffect(() => {
    const handleCircuitBreaker = (event: CustomEvent<any>) => {
      const { service, state, details } = event.detail;
      addSystemAlert({
        type: "error",
        title: "Circuit Breaker Activated",
        message: `Service ${service} has been ${
          state === "open" ? "suspended" : "degraded"
        } due to multiple failures.`,
        details: {
          service,
          state,
          ...details,
          timestamp: new Date().toISOString(),
        },
      });
    };

    window.addEventListener(
      "circuit-breaker",
      handleCircuitBreaker as EventListener
    );
    return () => {
      window.removeEventListener(
        "circuit-breaker",
        handleCircuitBreaker as EventListener
      );
    };
  }, []);

  // Define admin sections
  const adminSections = [
    {
      id: "balance",
      title: "Balance Management",
      icon: "💰",
      description: "Manage user balances and transactions",
      component: <BalanceManager />,
      color: "brand",
    },
    {
      id: "wallet-reclaim",
      title: "Reclaim Unused Funds",
      icon: "💸",
      description: "Reclaim unused funds from contest wallets",
      component: <WalletReclaimFunds />,
      color: "green",
    },
    {
      id: "system-reports",
      title: "System Reports",
      icon: "📊",
      description: "View and generate system health reports",
      link: "/admin/system-reports",
      color: "purple",
    },
    {
      id: "websocket-hub",
      title: "WebSocket Hub",
      icon: "🌐",
      description: "Central access point for all WebSocket tools",
      link: "/websocket-hub",
      color: "blue",
    },
    {
      id: "websocket",
      title: "WebSocket Testing",
      icon: "🔌",
      description: "Monitor and test WebSocket connections",
      link: "/connection-debugger",
      color: "cyber",
    },
    {
      id: "chat-dashboard",
      title: "Chat Dashboard",
      icon: "💬",
      description:
        "Monitor contest chats without being visible to participants",
      link: "/admin/chat-dashboard",
      color: "red",
    },
    {
      id: "contests",
      title: "Contest Management",
      icon: "🏆",
      description: "Create and manage contests",
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
      color: "yellow",
    },
    {
      id: "users",
      title: "User Management",
      icon: "👥",
      description: "View and manage user accounts",
      component: <UserDetail />,
      color: "purple",
    },
    {
      id: "activity",
      title: "Activity Monitor",
      icon: "📈",
      description: "Track system activities and events",
      component: <ActivityMonitor limit={10} />,
      color: "emerald",
    },
    {
      id: "ip-ban",
      title: "IP Ban Management",
      icon: "🛡️",
      description: "Manage banned IP addresses and check IP status",
      link: "/admin/ip-ban",
      color: "red",
    },
    {
      id: "transactions",
      title: "Transaction History",
      icon: "📝",
      description: "View and manage transactions",
      link: "/transactions",
      color: "blue",
    },
    {
      id: "achievements",
      title: "Achievement Testing",
      icon: "🎯",
      description: "Test and manage achievements",
      link: "/achievement-test",
      color: "pink",
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
            <h1 className="text-3xl font-bold text-gray-100">
              Admin Control Center
            </h1>
            <p className="text-gray-400 mt-2">
              System management and monitoring interface
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/admin/ip-ban"
              className="flex items-center gap-2 bg-red-500/30 px-4 py-2.5 rounded-xl hover:bg-red-500/40 transition-all border-2 border-red-500/40 shadow-lg hover:shadow-red-500/20 group relative"
            >
              <div className="absolute -top-2 -left-2">
                <div className="px-2 py-0.5 text-xs font-bold rounded-md bg-red-500/30 text-red-100 font-mono">
                  NEW
                </div>
              </div>
              <div className="text-red-300 text-xl group-hover:scale-110 transition-transform">
                🛡️
              </div>
              <span className="text-red-100 font-semibold group-hover:text-white transition-colors">
                IP Ban Management
              </span>
              <div className="ml-2 text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </Link>
            <Link
              to="/admin/chat-dashboard"
              className="flex items-center gap-2 bg-red-500/30 px-4 py-2.5 rounded-xl hover:bg-red-500/40 transition-all border-2 border-red-500/40 shadow-lg hover:shadow-red-500/20 group relative"
            >
              <div className="text-red-300 text-xl group-hover:scale-110 transition-transform">
                💬
              </div>
              <span className="text-red-100 font-semibold group-hover:text-white transition-colors">
                Chat Dashboard
              </span>
              <div className="ml-2 text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </Link>
            <Link
              to="/websocket-hub"
              className="flex items-center gap-2 bg-blue-500/30 px-4 py-2.5 rounded-xl hover:bg-blue-500/40 transition-all border-2 border-blue-500/40 shadow-lg hover:shadow-blue-500/20 group relative"
            >
              <div className="text-blue-300 text-xl group-hover:scale-110 transition-transform">
                🔌
              </div>
              <span className="text-blue-100 font-semibold group-hover:text-white transition-colors">
                WebSocket Hub
              </span>
              <div className="ml-2 text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </Link>
            <Link
              to="/connection-debugger"
              className="flex items-center gap-2 bg-cyber-500/30 px-4 py-2.5 rounded-xl hover:bg-cyber-500/40 transition-all border-2 border-cyber-500/40 shadow-lg hover:shadow-cyber-500/20 group relative"
            >
              <div className="text-cyber-300 text-xl group-hover:scale-110 transition-transform">
                🔌
              </div>
              <span className="text-cyber-100 font-semibold group-hover:text-white transition-colors">
                Connection Debugger
              </span>
              <div className="ml-2 text-cyber-300 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </Link>
            <Link
              to="/admin/skyduel"
              className="flex items-center gap-2 bg-purple-500/30 px-4 py-2.5 rounded-xl hover:bg-purple-500/40 transition-all border-2 border-purple-500/40 shadow-lg hover:shadow-purple-500/20 group relative"
            >
              <div className="absolute -top-2 -left-2">
                <div className="px-2 py-0.5 text-xs font-bold rounded-md bg-purple-500/30 text-purple-100 font-mono">
                  NEW
                </div>
              </div>
              <div className="text-purple-300 text-xl group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <span className="text-purple-100 font-semibold group-hover:text-white transition-colors">
                SkyDuel Console
              </span>
              <div className="ml-2 text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </Link>
          </div>
        </div>

        {/* System Alerts */}
        <AnimatePresence>
          {systemAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-dark-200/50 backdrop-blur-lg p-6 rounded-lg border border-brand-500/20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-100">
                    System Alerts
                  </h2>
                  <button
                    onClick={() => setSystemAlerts([])}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-4">
                  {systemAlerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`
                        p-4 rounded-lg border
                        ${
                          alert.type === "error"
                            ? "bg-red-500/10 border-red-500/20"
                            : ""
                        }
                        ${
                          alert.type === "warning"
                            ? "bg-yellow-500/10 border-yellow-500/20"
                            : ""
                        }
                        ${
                          alert.type === "info"
                            ? "bg-blue-500/10 border-blue-500/20"
                            : ""
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`
                          mt-1 text-xl
                          ${alert.type === "error" ? "text-red-400" : ""}
                          ${alert.type === "warning" ? "text-yellow-400" : ""}
                          ${alert.type === "info" ? "text-blue-400" : ""}
                        `}
                        >
                          {alert.type === "error"
                            ? "⚠"
                            : alert.type === "warning"
                            ? "⚡"
                            : "ℹ"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3
                              className={`
                              font-medium
                              ${alert.type === "error" ? "text-red-400" : ""}
                              ${
                                alert.type === "warning"
                                  ? "text-yellow-400"
                                  : ""
                              }
                              ${alert.type === "info" ? "text-blue-400" : ""}
                            `}
                            >
                              {alert.title}
                            </h3>
                            <span className="text-xs text-gray-500">
                              {alert.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-300 mt-1">{alert.message}</p>
                          {alert.details && (
                            <div className="mt-2 text-sm font-mono bg-dark-300/50 rounded p-2">
                              <pre className="whitespace-pre-wrap break-words">
                                {JSON.stringify(alert.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            setSystemAlerts((prev) =>
                              prev.filter((a) => a.id !== alert.id)
                            )
                          }
                          className="text-gray-500 hover:text-gray-400"
                        >
                          ×
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Maintenance Mode Control */}
        <div className="bg-dark-200/50 backdrop-blur-lg p-8 rounded-lg border border-brand-500/20 relative overflow-hidden">
          <div className="relative">
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

            {/* Error Display */}
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
              className="w-full group relative"
            >
              <motion.div
                className={`
                  relative overflow-hidden rounded-lg border-2 
                  ${
                    maintenanceMode
                      ? "border-red-500/50 bg-red-500/10 hover:bg-red-500/20"
                      : "border-green-500/50 bg-green-500/10 hover:bg-green-500/20"
                  }
                  ${isTogglingMaintenance ? "opacity-75" : ""}
                  transition-all duration-300
                `}
              >
                {/* Key Lock Effect */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <div
                    className={`
                    w-6 h-6 rounded-full border-2 
                    ${maintenanceMode ? "border-red-500" : "border-green-500"}
                    transition-colors duration-300
                  `}
                  >
                    <div
                      className={`
                      w-1 h-3 
                      ${maintenanceMode ? "bg-red-500" : "bg-green-500"}
                      transition-colors duration-300
                      absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2
                    `}
                    />
                  </div>
                </div>

                {/* Button Content */}
                <div className="px-6 py-4 pl-12">
                  <div className="font-cyber tracking-wider text-lg">
                    {isTogglingMaintenance ? (
                      <span className="text-brand-400 animate-pulse">
                        {maintenanceMode ? "DEACTIVATING..." : "INITIATING..."}
                      </span>
                    ) : maintenanceMode ? (
                      <span className="text-red-400 group-hover:text-red-300">
                        DEACTIVATE MAINTENANCE
                      </span>
                    ) : (
                      <span className="text-green-400 group-hover:text-green-300">
                        INITIATE MAINTENANCE
                      </span>
                    )}
                  </div>
                </div>

                {/* Scan Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </motion.div>

              {/* Power Indicator */}
              <div className="absolute -right-3 top-1/2 -translate-y-1/2">
                <div
                  className={`
                  w-6 h-6 rounded-full 
                  ${
                    maintenanceMode
                      ? "bg-red-500 animate-pulse shadow-lg shadow-red-500/50"
                      : "bg-green-500 shadow-lg shadow-green-500/50"
                  }
                  transition-colors duration-300
                `}
                />
              </div>
            </button>
          </div>
        </div>

        {/* System Reports Button */}
        <Link
          to="/admin/system-reports"
          className="block bg-dark-200/70 backdrop-blur-lg p-6 rounded-lg border-2 border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 relative overflow-hidden group shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.15)_0%,transparent_60%)]" />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl text-purple-400 group-hover:scale-110 transition-transform duration-300">
                📊
              </div>
              <div>
                <h3 className="text-xl font-bold text-purple-200 mb-1 font-heading">
                  System Reports
                </h3>
                <p className="text-purple-300/80">
                  View service health and database metrics
                </p>
              </div>
            </div>

            <div className="bg-purple-500/20 p-3 rounded-full group-hover:bg-purple-500/30 transition-colors">
              <svg
                className="w-6 h-6 text-purple-300 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-dark-300/50 rounded-lg p-3 border border-purple-500/20">
              <div className="text-xs text-purple-300/70 mb-1">
                Service Health
              </div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <span className="text-green-300 text-sm">Monitoring</span>
              </div>
            </div>

            <div className="bg-dark-300/50 rounded-lg p-3 border border-purple-500/20">
              <div className="text-xs text-purple-300/70 mb-1">Database</div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-blue-300 text-sm">Metrics</span>
              </div>
            </div>

            <div className="bg-dark-300/50 rounded-lg p-3 border border-purple-500/20">
              <div className="text-xs text-purple-300/70 mb-1">AI Analysis</div>
              <div className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-amber-500 mr-2"></div>
                <span className="text-amber-300 text-sm">Available</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <motion.div
              key={section.id}
              className={`
                bg-dark-200/70 backdrop-blur-lg rounded-xl border-2
                ${
                  selectedSection === section.id
                    ? `border-${section.color}-500/50 shadow-lg shadow-${section.color}-500/10`
                    : `border-${section.color}-500/30 hover:border-${section.color}-500/50`
                }
                transition-all duration-300 group
              `}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              {section.link ? (
                <Link to={section.link} className="block p-6 h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <div
                        className={`text-3xl mb-3 text-${section.color}-300 group-hover:scale-110 transition-transform`}
                      >
                        {section.icon}
                      </div>
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
                      <div
                        className={`text-3xl mb-3 text-${section.color}-300 group-hover:scale-110 transition-transform`}
                      >
                        {section.icon}
                      </div>
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
                      className={`text-${
                        section.color
                      }-300 text-lg transform transition-all ${
                        selectedSection === section.id ? "rotate-180" : ""
                      }`}
                    >
                      ↓
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
