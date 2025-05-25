// src/pages/superadmin/SuperAdminDashboard.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AdminLogsPanel from "../../components/admin/AdminLogsPanel";
import { LiveUserActivityMap } from "../../components/admin/LiveUserActivityMap";
import { LogViewer } from "../../components/admin/LogViewer";
import { SpyPanel } from "../../components/admin/SpyPanel";
import { SuperAdminWalletManagement } from "../../components/admin/SuperAdminWalletManagement";
import { VanityPool } from "../../components/admin/VanityPool";
import WalletBalanceAnalytics from "../../components/admin/WalletBalanceAnalytics";
import WebSocketConnectionPanel from "../../components/admin/WebSocketConnectionPanel";
import { ContestProvider } from "../../components/ApiPlaygroundParts/ContestContext";
import { ContestsList } from "../../components/ApiPlaygroundParts/ContestsList";
import { EndContest } from "../../components/ApiPlaygroundParts/EndContest";
import { StartContest } from "../../components/ApiPlaygroundParts/StartContest";
import { LazyLoad } from "../../components/shared/LazyLoad";
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

export const SuperAdminDashboard: React.FC = () => {
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
          `Failed to ${newState ? "enable" : "disable"} maintenance mode`,
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
            err,
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
          } seconds... ` + `(Attempt ${retryAttempt + 1}/${MAX_RETRIES})`,
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
              : "Please try again in a few seconds."),
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
          (s: any) => s.key === "maintenance_estimated_duration",
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
      ].slice(0, 10),
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
      handleCircuitBreaker as EventListener,
    );
    return () => {
      window.removeEventListener(
        "circuit-breaker",
        handleCircuitBreaker as EventListener,
      );
    };
  }, []);

  // Define superadmin sections with category grouping
  const superadminSections = [
    // Advanced Management
    {
      id: "control-hub",
      title: "Control Hub",
      icon: "🎛️",
      description: "Master control panel for all system operations",
      link: "/superadmin/control-hub",
      color: "brand",
      category: "Advanced-Management"
    },
    {
      id: "service-control",
      title: "Service Command Center",
      icon: "⚙️",
      description: "Manage all system services from a central console",
      link: "/superadmin/service-control",
      color: "indigo",
      category: "Advanced-Management"
    },
    {
      id: "skyduel",
      title: "SkyDuel Console",
      icon: "⚡",
      description: "Advanced service monitoring and circuit management",
      link: "/admin/skyduel",
      color: "purple",
      category: "Advanced-Management"
    },
    
    // Monitoring & Analysis
    {
      id: "activity",
      title: "Live Activity",
      icon: "👥",
      description: "Real-time user activity monitoring",
      component: <LiveUserActivityMap />,
      color: "emerald",
      category: "Monitoring"
    },
    {
      id: "websocket",
      title: "WebSocket Monitor",
      icon: "🔌",
      description: "Advanced WebSocket monitoring and debugging",
      link: "/superadmin/websocket-monitor",
      color: "cyber",
      category: "Monitoring"
    },
    {
      id: "logs",
      title: "System Logs",
      icon: "📋",
      description: "View and analyze system logs",
      component: <LogViewer />,
      color: "blue",
      category: "Monitoring"
    },
    {
      id: "spy",
      title: "User Spy",
      icon: "🔍",
      description: "Advanced user monitoring and debugging",
      component: <SpyPanel />,
      color: "purple",
      category: "Monitoring"
    },
    
    // Special Tools
    {
      id: "ai-testing",
      title: "AI Testing Panel",
      icon: "🧠",
      description: "Test and debug AI responses with different prompts and models",
      link: "/superadmin/ai-testing",
      color: "indigo",
      category: "Tools"
    },
    {
      id: "wallet-monitoring",
      title: "Wallet Monitoring",
      icon: "👁️",
      description: "Advanced wallet monitoring and transaction tracking",
      link: "/superadmin/wallet-monitoring",
      color: "blue",
      category: "Tools"
    },
    {
      id: "api-playground",
      title: "API Playground",
      icon: "🧪",
      description: "Advanced API testing environment",
      link: "/api-playground",
      color: "cyan",
      category: "Tools"
    },
    {
      id: "wss-playground",
      title: "WSS Playground",
      icon: "🔌",
      description: "Advanced WebSocket testing environment",
      link: "/wss-playground",
      color: "emerald",
      category: "Tools"
    },
    {
      id: "liquidity-simulator",
      title: "Liquidity Simulator",
      icon: "💰",
      description: "Simulate token liquidation strategies with real-time analysis",
      link: "/superadmin/liquidity-simulator",
      color: "cyber",
      category: "Tools"
    },
    {
      id: "amm-sim",
      title: "AMM Simulator",
      icon: "📊",
      description: "Simulate AMM behavior and trade impacts",
      link: "/amm-sim",
      color: "pink",
      category: "Tools"
    },
    
    // Wallet Management
    {
      id: "wallet",
      title: "Master Wallet Management",
      icon: "🔑",
      description: "Generate and manage system wallets with elevated privileges",
      component: <SuperAdminWalletManagement />,
      color: "pink",
      category: "Wallet"
    },
    {
      id: "wallet-analytics",
      title: "Wallet Analytics",
      icon: "📈",
      description: "Comprehensive wallet analytics and visualizations",
      component: <WalletBalanceAnalytics />,
      color: "emerald",
      category: "Wallet"
    },
    {
      id: "vanity",
      title: "Vanity Pool",
      icon: "✨",
      description: "Manage vanity address generation",
      component: <VanityPool />,
      color: "indigo",
      category: "Wallet"
    },
    
    // Contest Management
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
      category: "Contest"
    },
    {
      id: "chat-dashboard",
      title: "Chat Dashboard",
      icon: "💬",
      description: "Monitor and manage all contest chats from a single interface",
      link: "/admin/chat-dashboard",
      color: "cyan",
      category: "Contest"
    }
  ];

  return (
    <ContestProvider>
      <div data-testid="superadmin-dashboard">

      <div className="container mx-auto p-6 space-y-8 relative z-10">
        {/* Header with animated gradient */}
        <div className="flex items-center justify-between">
          <div className="relative group">
            <h1 className="text-3xl font-display text-gray-100 relative">
              <span className="bg-gradient-to-r from-brand-400 via-cyber-400 to-brand-500 bg-clip-text text-transparent animate-gradientX">
                SuperAdmin Control Center
              </span>
              <span className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-brand-400 via-cyber-400 to-brand-500 transform opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </h1>
            <p className="text-gray-400 mt-2 font-mono text-sm">
              AUTHORIZATION_LEVEL: SUPERADMIN_CLEARANCE
              <span className="inline-block ml-1 w-2 h-4 bg-cyber-500 opacity-80 animate-pulse"></span>
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/admin/contest-scheduler"
              className="flex items-center gap-2 bg-yellow-500/30 px-4 py-2.5 rounded-xl hover:bg-yellow-500/40 transition-all border-2 border-yellow-500/40 shadow-lg hover:shadow-yellow-500/20 group relative"
            >
              <div className="text-yellow-300 text-xl group-hover:scale-110 transition-transform">
                🔄
              </div>
              <span className="text-yellow-100 font-semibold group-hover:text-white transition-colors">
                Contest Scheduler
              </span>
              <div className="ml-2 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </div>
            </Link>
          </div>
        </div>

        {/* System Alerts */}
        <AnimatePresence>
          {systemAlerts.length > 0 && (
            <LazyLoad
              placeholder={
                <div className="animate-pulse bg-dark-200/30 h-16 w-full rounded-lg border border-brand-500/10"></div>
              }
              rootMargin="150px"
            >
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
                                prev.filter((a) => a.id !== alert.id),
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
            </LazyLoad>
          )}
        </AnimatePresence>

        {/* Dashboard Layout - main content and admin logs panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content - 75% width on desktop */}
          <div className="lg:col-span-3 space-y-6">
            {/* Maintenance Mode Control */}
            <LazyLoad 
              placeholder={
                <div className="animate-pulse bg-dark-200/30 h-40 rounded-lg border border-dark-300"></div>
              }
              rootMargin="100px"
            >
              <div className="bg-dark-200/50 backdrop-blur-sm border border-dark-300 p-8 rounded-lg relative overflow-hidden">
                {/* Top horizontal scanner line animation */}
                <div className="absolute inset-0 h-px w-full bg-cyber-400/30 animate-scan-fast"></div>
                
                {/* Vertical scan line */}
                <div className="absolute inset-0 w-px h-full bg-cyber-400/10 animate-cyber-scan"></div>
                
                {/* Background subtle gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-dark-100/5 to-dark-300/10 pointer-events-none"></div>
                
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
                              Math.max(1, parseInt(e.target.value) || 1),
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
            </LazyLoad>

            {/* Advanced Management Section */}
            <LazyLoad 
              placeholder={
                <div className="mb-8">
                  <div className="animate-pulse bg-dark-300/30 h-8 w-48 rounded mb-6"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse bg-dark-200/40 h-40 rounded-lg border border-cyber-500/10"></div>
                    ))}
                  </div>
                </div>
              }
              rootMargin="200px"
            >
              <div className="mb-8">
                <h2 className="text-xl font-display mb-3 relative group">
                  <span className="bg-gradient-to-r from-cyber-400 to-cyber-600 bg-clip-text text-transparent animate-gradientX">
                    Advanced Management
                  </span>
                  <span className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-cyber-400 to-cyber-600 transform opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {superadminSections
                    .filter(section => section.category === "Advanced-Management")
                    .map((section) => (
                      <motion.div
                        key={section.id}
                        className={`
                          bg-dark-200/75 backdrop-blur-lg border-2
                          ${
                            selectedSection === section.id
                              ? `border-${section.color}-500/60 shadow-lg shadow-${section.color}-500/20`
                              : `border-${section.color}-500/40 hover:border-${section.color}-500/60`
                          }
                          p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${section.color}-500/20
                        `}
                        whileHover={{ scale: 1.02, y: -4 }}
                      >
                        {/* Scanner line effect */}
                        <div className={`absolute inset-0 h-px w-full bg-${section.color}-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out`}></div>
                        
                        {/* Card content rendering */}
                        {section.link ? (
                          <Link to={section.link} className="block h-full">
                            <div className="flex items-center mb-3">
                              <div className={`text-2xl text-${section.color}-300 mr-3 group-hover:scale-110 transition-transform duration-300`}>
                                {section.icon}
                              </div>
                              <h3 className={`text-lg font-bold text-${section.color}-300 font-display tracking-wide`}>
                                {section.title}
                              </h3>
                            </div>
                            
                            {/* Divider that matches the card's color theme */}
                            <div className={`w-1/3 h-px bg-gradient-to-r from-${section.color}-500/70 to-transparent mb-3`}></div>
                            
                            {/* Enhanced description with better formatting */}
                            <p className="text-gray-300 text-sm font-mono">
                              <span className={`text-${section.color}-200`}>→</span> {section.description}
                            </p>
                            
                            {/* Corner accent - sharper edge */}
                            <div className="absolute -bottom-0 -right-0 w-8 h-8">
                              <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-${section.color}-500/70`}></div>
                            </div>
                          </Link>
                        ) : (
                          <button
                            onClick={() =>
                              setSelectedSection(
                                selectedSection === section.id ? null : section.id,
                              )
                            }
                            data-section-id={section.id}
                            className="block w-full text-left"
                          >
                            <div className="flex items-center mb-3">
                              <div className={`text-2xl text-${section.color}-300 mr-3 group-hover:scale-110 transition-transform duration-300`}>
                                {section.icon}
                              </div>
                              <h3 className={`text-lg font-bold text-${section.color}-300 font-display tracking-wide`}>
                                {section.title}
                              </h3>
                            </div>
                            
                            {/* Divider that matches the card's color theme */}
                            <div className={`w-1/3 h-px bg-gradient-to-r from-${section.color}-500/70 to-transparent mb-3`}></div>
                            
                            {/* Enhanced description with better formatting */}
                            <p className="text-gray-300 text-sm font-mono">
                              <span className={`text-${section.color}-200`}>→</span> {section.description}
                            </p>
                            
                            {/* Toggle indicator */}
                            <div className={`absolute top-4 right-4 text-${section.color}-300 text-lg transform transition-all ${selectedSection === section.id ? "rotate-180" : ""}`}>
                              ↓
                            </div>
                            
                            {/* Corner accent - sharper edge */}
                            <div className="absolute -bottom-0 -right-0 w-8 h-8">
                              <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-${section.color}-500/70`}></div>
                            </div>
                          </button>
                        )}
                        
                        {/* Expandable Content */}
                        {selectedSection === section.id && section.component && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4"
                          >
                            <div className="pt-4 border-t border-dark-300">
                              <LazyLoad
                                placeholder={<div className="animate-pulse bg-dark-300/20 h-40 w-full rounded"></div>}
                              >
                                {section.component}
                              </LazyLoad>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                </div>
              </div>
            </LazyLoad>

            {/* Monitoring & Analysis Section */}
            <LazyLoad 
              placeholder={
                <div className="mb-8">
                  <div className="animate-pulse bg-dark-300/30 h-8 w-48 rounded mb-6"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="animate-pulse bg-dark-200/40 h-40 rounded-lg border border-emerald-500/10"></div>
                    ))}
                  </div>
                </div>
              }
              rootMargin="250px"
            >
              <div className="mb-8">
                <h2 className="text-xl font-display mb-3 relative group">
                  <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent animate-gradientX">
                    Monitoring & Analysis
                  </span>
                  <span className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-emerald-400 to-emerald-600 transform opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {superadminSections
                    .filter(section => section.category === "Monitoring")
                    .map((section) => (
                      <motion.div
                        key={section.id}
                        className={`
                          bg-dark-200/75 backdrop-blur-lg border-2
                          ${
                            selectedSection === section.id
                              ? `border-${section.color}-500/60 shadow-lg shadow-${section.color}-500/20`
                              : `border-${section.color}-500/40 hover:border-${section.color}-500/60`
                          }
                          p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${section.color}-500/20
                        `}
                        whileHover={{ scale: 1.02, y: -4 }}
                      >
                        {/* Scanner line effect */}
                        <div className={`absolute inset-0 h-px w-full bg-${section.color}-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out`}></div>
                        
                        {/* Card content rendering */}
                        {section.link ? (
                          <Link to={section.link} className="block h-full">
                            <div className="flex items-center mb-3">
                              <div className={`text-2xl text-${section.color}-300 mr-3 group-hover:scale-110 transition-transform duration-300`}>
                                {section.icon}
                              </div>
                              <h3 className={`text-lg font-bold text-${section.color}-300 font-display tracking-wide`}>
                                {section.title}
                              </h3>
                            </div>
                            
                            {/* Divider that matches the card's color theme */}
                            <div className={`w-1/3 h-px bg-gradient-to-r from-${section.color}-500/70 to-transparent mb-3`}></div>
                            
                            {/* Enhanced description with better formatting */}
                            <p className="text-gray-300 text-sm font-mono">
                              <span className={`text-${section.color}-200`}>→</span> {section.description}
                            </p>
                            
                            {/* Corner accent - sharper edge */}
                            <div className="absolute -bottom-0 -right-0 w-8 h-8">
                              <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-${section.color}-500/70`}></div>
                            </div>
                          </Link>
                        ) : (
                          <button
                            onClick={() =>
                              setSelectedSection(
                                selectedSection === section.id ? null : section.id,
                              )
                            }
                            data-section-id={section.id}
                            className="block w-full text-left"
                          >
                            <div className="flex items-center mb-3">
                              <div className={`text-2xl text-${section.color}-300 mr-3 group-hover:scale-110 transition-transform duration-300`}>
                                {section.icon}
                              </div>
                              <h3 className={`text-lg font-bold text-${section.color}-300 font-display tracking-wide`}>
                                {section.title}
                              </h3>
                            </div>
                            
                            {/* Divider that matches the card's color theme */}
                            <div className={`w-1/3 h-px bg-gradient-to-r from-${section.color}-500/70 to-transparent mb-3`}></div>
                            
                            {/* Enhanced description with better formatting */}
                            <p className="text-gray-300 text-sm font-mono">
                              <span className={`text-${section.color}-200`}>→</span> {section.description}
                            </p>
                            
                            {/* Toggle indicator */}
                            <div className={`absolute top-4 right-4 text-${section.color}-300 text-lg transform transition-all ${selectedSection === section.id ? "rotate-180" : ""}`}>
                              ↓
                            </div>
                            
                            {/* Corner accent - sharper edge */}
                            <div className="absolute -bottom-0 -right-0 w-8 h-8">
                              <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-${section.color}-500/70`}></div>
                            </div>
                          </button>
                        )}
                        
                        {/* Expandable Content */}
                        {selectedSection === section.id && section.component && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4"
                          >
                            <div className="pt-4 border-t border-dark-300">
                              <LazyLoad
                                placeholder={<div className="animate-pulse bg-dark-300/20 h-40 w-full rounded"></div>}
                              >
                                {section.component}
                              </LazyLoad>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                </div>
              </div>
            </LazyLoad>

            {/* Wallet Management Section */}
            <LazyLoad 
              placeholder={
                <div className="mb-8">
                  <div className="animate-pulse bg-dark-300/30 h-8 w-48 rounded mb-6"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse bg-dark-200/40 h-40 rounded-lg border border-pink-500/10"></div>
                    ))}
                  </div>
                </div>
              }
              rootMargin="300px"
            >
              <div className="mb-8">
                <h2 className="text-xl font-display mb-3 relative group">
                  <span className="bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent animate-gradientX">
                    Wallet Management
                  </span>
                  <span className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-pink-400 to-pink-600 transform opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {superadminSections
                    .filter(section => section.category === "Wallet")
                    .map((section) => (
                      <motion.div
                        key={section.id}
                        className={`
                          bg-dark-200/75 backdrop-blur-lg border-2
                          ${
                            selectedSection === section.id
                              ? `border-${section.color}-500/60 shadow-lg shadow-${section.color}-500/20`
                              : `border-${section.color}-500/40 hover:border-${section.color}-500/60`
                          }
                          p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${section.color}-500/20
                          ${selectedSection === section.id && section.id === "wallet" ? "md:col-span-2 lg:col-span-3" : ""}
                        `}
                        whileHover={{ scale: 1.02, y: -4 }}
                      >
                        {/* Scanner line effect */}
                        <div className={`absolute inset-0 h-px w-full bg-${section.color}-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out`}></div>
                        
                        {/* Card content rendering */}
                        {section.link ? (
                          <Link to={section.link} className="block h-full">
                            <div className="flex items-center mb-3">
                              <div className={`text-2xl text-${section.color}-300 mr-3 group-hover:scale-110 transition-transform duration-300`}>
                                {section.icon}
                              </div>
                              <h3 className={`text-lg font-bold text-${section.color}-300 font-display tracking-wide`}>
                                {section.title}
                              </h3>
                            </div>
                            
                            {/* Divider that matches the card's color theme */}
                            <div className={`w-1/3 h-px bg-gradient-to-r from-${section.color}-500/70 to-transparent mb-3`}></div>
                            
                            {/* Enhanced description with better formatting */}
                            <p className="text-gray-300 text-sm font-mono">
                              <span className={`text-${section.color}-200`}>→</span> {section.description}
                            </p>
                            
                            {/* Corner accent - sharper edge */}
                            <div className="absolute -bottom-0 -right-0 w-8 h-8">
                              <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-${section.color}-500/70`}></div>
                            </div>
                          </Link>
                        ) : (
                          <button
                            onClick={() =>
                              setSelectedSection(
                                selectedSection === section.id ? null : section.id,
                              )
                            }
                            data-section-id={section.id}
                            className="block w-full text-left"
                          >
                            <div className="flex items-center mb-3">
                              <div className={`text-2xl text-${section.color}-300 mr-3 group-hover:scale-110 transition-transform duration-300`}>
                                {section.icon}
                              </div>
                              <h3 className={`text-lg font-bold text-${section.color}-300 font-display tracking-wide`}>
                                {section.title}
                              </h3>
                            </div>
                            
                            {/* Divider that matches the card's color theme */}
                            <div className={`w-1/3 h-px bg-gradient-to-r from-${section.color}-500/70 to-transparent mb-3`}></div>
                            
                            {/* Enhanced description with better formatting */}
                            <p className="text-gray-300 text-sm font-mono">
                              <span className={`text-${section.color}-200`}>→</span> {section.description}
                            </p>
                            
                            {/* Toggle indicator */}
                            <div className={`absolute top-4 right-4 text-${section.color}-300 text-lg transform transition-all ${selectedSection === section.id ? "rotate-180" : ""}`}>
                              ↓
                            </div>
                            
                            {/* Corner accent - sharper edge */}
                            <div className="absolute -bottom-0 -right-0 w-8 h-8">
                              <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-${section.color}-500/70`}></div>
                            </div>
                          </button>
                        )}
                        
                        {/* Expandable Content */}
                        {selectedSection === section.id && section.component && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4"
                          >
                            <div className="pt-4 border-t border-dark-300">
                              <LazyLoad
                                placeholder={<div className="animate-pulse bg-dark-300/20 h-40 w-full rounded"></div>}
                              >
                                {section.component}
                              </LazyLoad>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                </div>
              </div>
            </LazyLoad>

            {/* Special Tools Container */}
            <LazyLoad 
              placeholder={
                <div className="mb-8">
                  <div className="animate-pulse bg-dark-300/30 h-8 w-48 rounded mb-6"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="animate-pulse bg-dark-200/40 h-40 rounded-lg border border-indigo-500/10"></div>
                    ))}
                  </div>
                </div>
              }
              rootMargin="350px"
            >
              <div className="mb-8">
                
                {/* Special Tools Header */}
                <h2 className="text-xl font-display mb-3 relative group">
                  <span className="bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent animate-gradientX">
                    Special Tools
                  </span>
                  <span className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-indigo-400 to-indigo-600 transform opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* Liquidity Simulator Card */}
                  <motion.div
                    className="bg-dark-200/75 backdrop-blur-lg border-2 border-green-500/40 hover:border-green-500/60 p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/20"
                    whileHover={{ scale: 1.02, y: -4 }}
                  >

                    {/* Link to Liquidity Simulator */}
                    <Link to="/admin/liq-sim" className="block h-full">

                      {/* Header */}
                      <div className="flex items-center mb-3">
                        
                        {/* Icon */}
                        <div className="text-2xl text-green-300 mr-3 group-hover:scale-110 transition-transform duration-300">
                          💰
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-lg font-bold text-green-300 font-display tracking-wide">
                          Liquidity Simulator
                        </h3>

                      </div>
                      
                      {/* Divider */}
                      <div className="w-1/3 h-px bg-gradient-to-r from-green-500/70 to-transparent mb-3"></div>
                      
                      {/* Description */}
                      <p className="text-gray-300 text-sm font-mono">
                        <span className="text-green-200">→</span> Simulate token liquidation strategies
                      </p>
                      
                      {/* Corner accent - sharper edge */}
                      <div className="absolute -bottom-0 -right-0 w-8 h-8">
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-green-500/70"></div>
                      </div>
                    
                    </Link>

                  </motion.div>
                  
                  {/* Special Tools Cards */}
                  {superadminSections
                    .filter(section => section.category === "Tools")
                    .map((section) => (

                      // Create card for each section
                      <motion.div
                        key={section.id}
                        className={`
                          bg-dark-200/75 backdrop-blur-lg border-2
                          ${
                            selectedSection === section.id
                              ? `border-${section.color}-500/60 shadow-lg shadow-${section.color}-500/20`
                              : `border-${section.color}-500/40 hover:border-${section.color}-500/60`
                          }
                          p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${section.color}-500/20
                        `}
                        whileHover={{ scale: 1.02, y: -4 }}
                      >
                        {/* Scanner line effect */}
                        <div className={`absolute inset-0 h-px w-full bg-${section.color}-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out`}></div>
                        
                        {/* Card content rendering - Link */}
                        {section.link ? (
                          
                          // Link to section
                          <Link to={section.link} className="block h-full">
                            
                            {/* Header */}
                            <div className="flex items-center mb-3">
                              <div className={`text-2xl text-${section.color}-300 mr-3 group-hover:scale-110 transition-transform duration-300`}>
                                {section.icon}
                              </div>
                              <h3 className={`text-lg font-bold text-${section.color}-300 font-display tracking-wide`}>
                                {section.title}
                              </h3>
                            </div>
                            
                            {/* Divider that matches the card's color theme */}
                            <div className={`w-1/3 h-px bg-gradient-to-r from-${section.color}-500/70 to-transparent mb-3`}></div>
                            
                            {/* Enhanced description with better formatting */}
                            <p className="text-gray-300 text-sm font-mono">
                              <span className={`text-${section.color}-200`}>→</span> {section.description}
                            </p>
                            
                            {/* Corner accent - sharper edge */}
                            <div className="absolute -bottom-0 -right-0 w-8 h-8">
                              <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-${section.color}-500/70`}></div>
                            </div>
                          </Link>

                        ) : (

                          // Button for non-link sections
                          <button
                            onClick={() =>
                              setSelectedSection(
                                selectedSection === section.id ? null : section.id,
                              )
                            }
                            data-section-id={section.id}
                            className="block w-full text-left"
                          >
                            {/* Card content rendering - Header */}
                            <div className="flex items-center mb-3">
                              <div className={`text-2xl text-${section.color}-300 mr-3 group-hover:scale-110 transition-transform duration-300`}>
                                {section.icon}
                              </div>
                              <h3 className={`text-lg font-bold text-${section.color}-300 font-display tracking-wide`}>
                                {section.title}
                              </h3>
                            </div>
                            
                            {/* Divider that matches the card's color theme */}
                            <div className={`w-1/3 h-px bg-gradient-to-r from-${section.color}-500/70 to-transparent mb-3`}></div>
                            
                            {/* Enhanced description with better formatting */}
                            <p className="text-gray-300 text-sm font-mono">
                              <span className={`text-${section.color}-200`}>→</span> {section.description}
                            </p>
                            
                            {/* Toggle indicator */}
                            <div className={`absolute top-4 right-4 text-${section.color}-300 text-lg transform transition-all ${selectedSection === section.id ? "rotate-180" : ""}`}>
                              ↓
                            </div>
                            
                            {/* Corner accent - sharper edge */}
                            <div className="absolute -bottom-0 -right-0 w-8 h-8">
                              <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-${section.color}-500/70`}></div>
                            </div>

                          </button>

                        )}
                        
                        {/* Expandable Content */}
                        {selectedSection === section.id && section.component && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4"
                          >
                            <div className="pt-4 border-t border-dark-300">
                              <LazyLoad
                                placeholder={<div className="animate-pulse bg-dark-300/20 h-40 w-full rounded"></div>}
                              >
                                {section.component}
                              </LazyLoad>
                            </div>
                          </motion.div>
                        )}

                      </motion.div>

                    ))}
                </div>
              </div>
            </LazyLoad>

            {/* Contest Management Section */}
            <LazyLoad 
              placeholder={
                <div className="mb-8">
                  <div className="animate-pulse bg-dark-300/30 h-8 w-48 rounded mb-6"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2].map(i => (
                      <div key={i} className="animate-pulse bg-dark-200/40 h-40 rounded-lg border border-amber-500/10"></div>
                    ))}
                  </div>
                </div>
              }
              rootMargin="400px"
            >
              <div className="mb-8">
                {/* Contest Management Header */}
                <h2 className="text-xl font-display mb-3 relative group">
                  <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent animate-gradientX">
                    Contest Management
                  </span>
                  <span className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-amber-400 to-amber-600 transform opacity-0 group-hover:opacity-100 transition-opacity"></span>
                </h2>
                
                {/* Contest Management Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {superadminSections
                    .filter(section => section.category === "Contest")
                    .map((section) => (
                      <motion.div
                        key={section.id}
                        className={`
                          bg-dark-200/75 backdrop-blur-lg border-2
                          ${
                            selectedSection === section.id
                              ? `border-${section.color}-500/60 shadow-lg shadow-${section.color}-500/20`
                              : `border-${section.color}-500/40 hover:border-${section.color}-500/60`
                          }
                          p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${section.color}-500/20
                          ${selectedSection === section.id && section.id === "contests" ? "md:col-span-2 lg:col-span-3" : ""}
                        `}
                        whileHover={{ scale: 1.02, y: -4 }}
                      >
                        {/* Scanner line effect */}
                        <div className={`absolute inset-0 h-px w-full bg-${section.color}-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out`}></div>
                        
                        {/* Card content rendering */}
                        {section.link ? (
                          <Link to={section.link} className="block h-full">
                            <div className="flex items-center mb-3">
                              <div className={`text-2xl text-${section.color}-300 mr-3 group-hover:scale-110 transition-transform duration-300`}>
                                {section.icon}
                              </div>
                              <h3 className={`text-lg font-bold text-${section.color}-300 font-display tracking-wide`}>
                                {section.title}
                              </h3>
                            </div>
                            
                            {/* Divider that matches the card's color theme */}
                            <div className={`w-1/3 h-px bg-gradient-to-r from-${section.color}-500/70 to-transparent mb-3`}></div>
                            
                            {/* Enhanced description with better formatting */}
                            <p className="text-gray-300 text-sm font-mono">
                              <span className={`text-${section.color}-200`}>→</span> {section.description}
                            </p>
                            
                            {/* Corner accent - sharper edge */}
                            <div className="absolute -bottom-0 -right-0 w-8 h-8">
                              <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-${section.color}-500/70`}></div>
                            </div>
                          </Link>
                        ) : (
                          <button
                            onClick={() =>
                              setSelectedSection(
                                selectedSection === section.id ? null : section.id,
                              )
                            }
                            data-section-id={section.id}
                            className="block w-full text-left"
                          >
                            <div className="flex items-center mb-3">
                              <div className={`text-2xl text-${section.color}-300 mr-3 group-hover:scale-110 transition-transform duration-300`}>
                                {section.icon}
                              </div>
                              <h3 className={`text-lg font-bold text-${section.color}-300 font-display tracking-wide`}>
                                {section.title}
                              </h3>
                            </div>
                            
                            {/* Divider that matches the card's color theme */}
                            <div className={`w-1/3 h-px bg-gradient-to-r from-${section.color}-500/70 to-transparent mb-3`}></div>
                            
                            {/* Enhanced description with better formatting */}
                            <p className="text-gray-300 text-sm font-mono">
                              <span className={`text-${section.color}-200`}>→</span> {section.description}
                            </p>
                            
                            {/* Toggle indicator */}
                            <div className={`absolute top-4 right-4 text-${section.color}-300 text-lg transform transition-all ${selectedSection === section.id ? "rotate-180" : ""}`}>
                              ↓
                            </div>
                            
                            {/* Corner accent - sharper edge */}
                            <div className="absolute -bottom-0 -right-0 w-8 h-8">
                              <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-${section.color}-500/70`}></div>
                            </div>
                          </button>
                        )}
                        
                        {/* Expandable Content */}
                        {selectedSection === section.id && section.component && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4"
                          >
                            <div className="pt-4 border-t border-dark-300">
                              <LazyLoad
                                placeholder={<div className="animate-pulse bg-dark-300/20 h-40 w-full rounded"></div>}
                              >
                                {section.component}
                              </LazyLoad>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                </div>    
              </div>
            </LazyLoad>

          </div>

          {/* Monitor Panels - 25% width on desktop, full width on mobile */}
          <div className="lg:col-span-1">
            
            {/* Monitor Panels Container (Admin Logs, Active WebSocket Connections) */}
            <div className="sticky top-6 space-y-6 max-h-screen overflow-hidden">
              
              {/* Admin Logs Monitoring Panel */}
              <LazyLoad
                placeholder={
                  <div className="animate-pulse">
                    <div className="bg-dark-300/30 h-10 w-full rounded-t-lg"></div>
                    <div className="bg-dark-200/40 p-4 rounded-b-lg space-y-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-dark-300/20 h-16 rounded"></div>
                      ))}
                    </div>
                  </div>
                }
                rootMargin="50px" // Smaller margin as this is typically visible at page load
              >
                {/* Admin Logs */}
                <AdminLogsPanel />
              </LazyLoad>
              
              {/* WebSocket Connections Monitoring Panel */}
              <LazyLoad
                placeholder={
                  <div className="animate-pulse">
                    <div className="bg-dark-300/30 h-10 w-full rounded-t-lg"></div>
                    <div className="bg-dark-200/40 p-4 rounded-b-lg space-y-3">
                      {[1, 2].map(i => (
                        <div key={i} className="bg-dark-300/20 h-16 rounded"></div>
                      ))}
                    </div>
                  </div>
                }
                rootMargin="100px"
              >
                {/* WebSocket Connections */}
                <WebSocketConnectionPanel />
              </LazyLoad>

            </div>

          </div>

        </div>
      </div>
      </div>
    </ContestProvider>
  );
};