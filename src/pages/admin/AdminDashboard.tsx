// src/pages/AdminDashboard.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ActivityMonitor } from "../../components/admin/ActivityMonitor";
import AdminLogsPanel from "../../components/admin/AdminLogsPanel";
import { BalanceManager } from "../../components/admin/BalanceManager";
import { SystemNoticesManager } from "../../components/admin/SystemNoticesManager";
import { TokenActivationManager } from "../../components/admin/TokenActivationManager";
import WalletReclaimFunds from "../../components/admin/WalletReclaimFunds";
import { ContestProvider } from "../../components/ApiPlaygroundParts/ContestContext";
import { ContestsList } from "../../components/ApiPlaygroundParts/ContestsList";
import { EndContest } from "../../components/ApiPlaygroundParts/EndContest";
import { StartContest } from "../../components/ApiPlaygroundParts/StartContest";
import { UserDetail } from "../../components/ApiPlaygroundParts/UserDetail";
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

export const AdminDashboard: React.FC = () => {
  const { maintenanceMode, setMaintenanceMode, user } = useStore();
  const [maintenanceDuration, setMaintenanceDuration] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  // Collapsible section states - all collapsed by default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    tokenActivation: false,
    launchpad: false,
    mediaMaker: false,
    maintenance: false,
    systemNotices: false,
    systemReports: false,
    adminTools: false
  });

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

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

  // Define admin sections with category grouping
  const adminSections = [
    // User Wallet Analysis - TOP PRIORITY
    {
      id: "user-wallet-analysis",
      title: "User Wallet Analysis",
      icon: "🔍",
      description: "Analyze any user's wallet holdings and portfolio",
      link: "/user-wallet-analysis",
      color: "cyan",
      category: "Top-Priority"
    },
    
    // User section
    {
      id: "users",
      title: "User Management",
      icon: "👥",
      description: "View and manage user accounts",
      component: <UserDetail />,
      color: "purple",
      category: "User"
    },
    {
      id: "ip-ban",
      title: "IP Ban Management",
      icon: "🛡️",
      description: "Manage banned IP addresses and check IP status",
      link: "/admin/ip-ban",
      color: "red",
      category: "User"
    },
    
    // Contest section
    {
      id: "contests",
      title: "Contest Control",
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
      category: "Contest"
    },
    {
      id: "chat-dashboard",
      title: "Chat Dashboard",
      icon: "💬",
      description: "Monitor contest chats without being visible to participants",
      link: "/admin/chat-dashboard",
      color: "red",
      category: "Contest"
    },
    {
      id: "wallet-reclaim",
      title: "Reclaim Contest Funds",
      icon: "💸",
      description: "Reclaim unused funds from contest wallets",
      component: <WalletReclaimFunds />,
      color: "green",
      category: "Contest"
    },
    {
      id: "contest-scheduler",
      title: "Contest Scheduler",
      icon: "🔄",
      description: "Schedule and manage automated contest creation",
      link: "/admin/contest-scheduler",
      color: "yellow",
      category: "Contest"
    },
    
    // Financial section
    {
      id: "balance",
      title: "Balance Management",
      icon: "💰",
      description: "Manage user balances and transactions",
      component: <BalanceManager />,
      color: "brand",
      category: "Financial"
    },
    {
      id: "transactions",
      title: "Transaction History",
      icon: "📝",
      description: "View and manage transactions",
      link: "/transactions",
      color: "blue",
      category: "Financial"
    },

    // System section - Core
    {
      id: "activity",
      title: "Activity Monitor",
      icon: "📈",
      description: "Track system activities and events",
      component: <ActivityMonitor limit={10} />,
      color: "emerald",
      category: "System-Core"
    },
    {
      id: "token-data-control",
      title: "Token Data Control Center",
      icon: "🎯",
      description: "Control which tokens appear in game - the brain of our system",
      link: "/admin/token-data-control",
      color: "brand",
      category: "System-Core",
      isNew: true
    },
    {
      id: "system-reports",
      title: "System Reports",
      icon: "📊",
      description: "View and generate system health reports",
      link: "/admin/system-reports",
      color: "purple",
      category: "System-Core"
    },
    {
      id: "client-errors",
      title: "Client Error Management",
      icon: "🐛",
      description: "Track and resolve client-side errors",
      link: "/admin/client-errors",
      color: "red",
      category: "System-Core",
      isNew: true
    },
    
    // System section - Testing & Playground
    {
      id: "auth-system-test",
      title: "Auth System Migration",
      icon: "🔐",
      description: "Test and compare old and new auth systems",
      link: "/admin/auth-system-test",
      color: "indigo",
      category: "System-Testing",
      isNew: true
    },
    {
      id: "websocket-hub",
      title: "WebSocket Hub",
      icon: "🌐",
      description: "Central access point for all WebSocket tools",
      link: "/websocket-hub",
      color: "blue",
      category: "System-Testing"
    },
    {
      id: "websocket",
      title: "WebSocket Testing",
      icon: "🔌",
      description: "Monitor and test WebSocket connections",
      link: "/connection-debugger",
      color: "cyber",
      category: "System-Testing"
    },
    {
      id: "achievements",
      title: "Achievement Testing",
      icon: "🎯",
      description: "Test and manage achievements",
      link: "/achievement-test",
      color: "pink",
      category: "System-Testing"
    },
    {
      id: "api-testing",
      title: "API Testing Dashboard",
      icon: "🚀",
      description: "Test admin swap trading and transaction parsing endpoints",
      link: "/admin/api-testing",
      color: "cyan",
      category: "System-Testing",
      isNew: true
    },
    {
      id: "ai-testing",
      title: "AI Testing",
      icon: "🤖",
      description: "Test AI features and integrations",
      link: "/admin/ai-testing",
      color: "purple",
      category: "System-Testing"
    },
    {
      id: "skyduel",
      title: "SkyDuel Management",
      icon: "✈️",
      description: "Manage SkyDuel game settings and data",
      link: "/admin/skyduel",
      color: "sky",
      category: "System-Testing"
    },
    {
      id: "token-sync-test",
      title: "Token Sync Testing",
      icon: "🔄",
      description: "Test token synchronization processes",
      link: "/admin/token-sync-test",
      color: "amber",
      category: "System-Testing"
    },
    {
      id: "contest-image-browser",
      title: "Contest Image Browser",
      icon: "🇺",
      description: "Browse and manage contest images",
      link: "/admin/contest-image-browser",
      color: "pink",
      category: "Contest"
    },
    {
      id: "media-maker",
      title: "Media Maker",
      icon: "🎨",
      description: "Create marketing graphics and social media content",
      link: "/media-maker",
      color: "purple",
      category: "Contest"
    },
    
    // Wallet section
    {
      id: "wallet-monitoring",
      title: "Wallet Monitoring",
      icon: "💰",
      description: "Track wallet balances and transactions",
      link: "/admin/wallet-monitoring",
      color: "brand",
      category: "Wallet"
    },
    {
      id: "admin-wallet-dashboard",
      title: "Admin Wallet Dashboard",
      icon: "🏦",
      description: "Manage custodial wallets with bulk operations",
      link: "/admin/wallet-dashboard",
      color: "purple",
      category: "Wallet"
    },
    {
      id: "wallet-management",
      title: "Wallet Management",
      icon: "💳",
      description: "Manage user wallets and permissions",
      link: "/admin/wallet-management",
      color: "blue",
      category: "Wallet"
    },
    {
      id: "liquidity-simulator",
      title: "Liquidity Simulator",
      icon: "💧",
      description: "Simulate token liquidation strategies",
      link: "/admin/liq-sim",
      color: "green",
      category: "Wallet"
    },
    {
      id: "vanity-wallets",
      title: "Vanity Wallet Management",
      icon: "✨",
      description: "Create and manage vanity wallet addresses",
      link: "/admin/vanity-wallets",
      color: "indigo",
      category: "Wallet"
    }
  ];

  return (
    <ContestProvider>
      <div data-testid="admin-dashboard">

      <div className="container mx-auto p-4 sm:p-6 space-y-6 relative z-10 pb-8">
        {/* Header with animated gradient */}
        <div className="flex items-center justify-between">
          <div className="relative group">
            <h1 className="text-3xl font-display text-gray-100 relative">
              <span className="bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent animate-gradientX">
                Admin Control Center
              </span>
              <span className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-brand-400 to-cyber-400 transform opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </h1>
            <p className="text-gray-400 mt-2 font-mono text-sm">
              System management and monitoring interface
              <span className="inline-block ml-1 w-2 h-4 bg-brand-500 opacity-80 animate-pulse"></span>
            </p>
          </div>
        </div>

        {/* System Alerts */}
        <AnimatePresence>
          {systemAlerts.length > 0 && (
            <LazyLoad
              placeholder={
                <div className="animate-pulse bg-dark-200/30 h-16 w-full rounded-lg border border-dark-300/30"></div>
              }
              rootMargin="75px"
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-dark-200/50 backdrop-blur-lg p-6 rounded-lg border border-dark-300/50">
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

        {/* Token God View Link - NEW PROMINENT FEATURE */}
        <div className="mb-6">
          <Link
            to="/token-god-view"
            className="block bg-gradient-to-r from-brand-500/20 to-cyber-500/20 backdrop-blur-lg rounded-lg border border-brand-500/40 hover:border-brand-500/60 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/20"
          >
            <div className="px-6 py-4 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="text-2xl">🚀</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent font-heading">
                    Token God View
                  </h3>
                  <p className="text-sm text-brand-300/80">
                    Comprehensive token analytics and discovery platform
                  </p>
                </div>
              </div>
              <div className="text-brand-400 group-hover:translate-x-1 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Critical Token Management Section - PROMINENT FEATURE */}
        <div className="mb-6">
          <div className="bg-dark-200/50 backdrop-blur-lg rounded-lg border border-dark-300/50 overflow-hidden">
            <button
              onClick={() => toggleSection('tokenActivation')}
              className="w-full px-6 py-4 bg-dark-300/30 hover:bg-dark-300/50 transition-all duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎯</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-brand-200 font-heading">
                    Token Activation Manager
                  </h3>
                  <p className="text-sm text-brand-300/80">
                    Control which tokens appear in the game
                  </p>
                </div>
              </div>
              <div className={`text-brand-300 text-xl transform transition-transform duration-300 ${
                expandedSections.tokenActivation ? 'rotate-180' : ''
              }`}>
                ↓
              </div>
            </button>
            
            <AnimatePresence>
              {expandedSections.tokenActivation && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 border-t border-dark-300/30">
                    <TokenActivationManager />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* WIN TO LAUNCH Section - PROMINENT FEATURE */}
        <div className="mb-6">
          <div className="bg-dark-200/50 backdrop-blur-lg rounded-lg border border-dark-300/50 overflow-hidden">
            <Link
              to="/launchpad"
              className="w-full px-6 py-4 bg-dark-300/30 hover:bg-cyan-500/20 transition-all duration-300 flex items-center gap-3 group"
            >
              <div className="text-2xl">🚀</div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-cyan-200 font-heading">
                  WIN TO LAUNCH
                </h3>
                <p className="text-sm text-cyan-300/80">
                  Launch your token on Solana with Jupiter's Dynamic Bonding Curves
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Media Maker Section - PROMINENT FEATURE */}
        <div className="mb-6">
          <div className="bg-dark-200/50 backdrop-blur-lg rounded-lg border border-dark-300/50 overflow-hidden">
            <div className="flex">
              <Link
                to="/media-maker"
                className="flex-1 px-6 py-4 bg-dark-300/30 hover:bg-purple-500/20 transition-all duration-300 flex items-center gap-3 group"
              >
                <div className="text-2xl">🎨</div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-purple-200 font-heading">
                    Media Maker
                  </h3>
                  <p className="text-sm text-purple-300/80">
                    Create marketing graphics and social media content
                  </p>
                </div>
              </Link>
              <button
                onClick={() => toggleSection('mediaMaker')}
                className="px-4 py-4 bg-dark-300/30 hover:bg-dark-300/50 transition-all duration-300 border-l border-dark-300/50"
              >
                <div className={`text-purple-300 text-xl transform transition-transform duration-300 ${
                  expandedSections.mediaMaker ? 'rotate-180' : ''
                }`}>
                  ↓
                </div>
              </button>
            </div>
            
            <AnimatePresence>
              {expandedSections.mediaMaker && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-6 border-t border-dark-300/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-dark-300/50 rounded-lg p-3 border border-purple-500/20">
                        <div className="text-xs text-purple-300/70 mb-1">
                          Text Overlays
                        </div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-green-300 text-sm">Ready</span>
                        </div>
                      </div>

                      <div className="bg-dark-300/50 rounded-lg p-3 border border-purple-500/20">
                        <div className="text-xs text-purple-300/70 mb-1">Logo Positioning</div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-blue-300 text-sm">Active</span>
                        </div>
                      </div>

                      <div className="bg-dark-300/50 rounded-lg p-3 border border-purple-500/20">
                        <div className="text-xs text-purple-300/70 mb-1">Screenshot</div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-amber-500 mr-2"></div>
                          <span className="text-amber-300 text-sm">Capture</span>
                        </div>
                      </div>

                      <div className="bg-dark-300/50 rounded-lg p-3 border border-purple-500/20">
                        <div className="text-xs text-purple-300/70 mb-1">Custom Upload</div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-cyan-500 mr-2"></div>
                          <span className="text-cyan-300 text-sm">Enabled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Dashboard Layout - main content and admin logs panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Main content - 75% width on desktop */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-6">
            {/* Maintenance Mode Control */}
            <div className="bg-dark-200/50 backdrop-blur-lg rounded-lg border border-dark-300/50 overflow-hidden">
              <button
                onClick={() => toggleSection('maintenance')}
                className="w-full px-6 py-4 bg-dark-300/30 hover:bg-dark-300/50 transition-all duration-300 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex-shrink-0 ${
                    maintenanceMode ? "bg-red-500 animate-pulse" : "bg-green-500"
                  }`} />
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-red-200 font-cyber tracking-wider">
                      MAINTENANCE MODE
                    </h3>
                    <p className="text-sm text-red-300/80 font-mono">
                      {maintenanceMode ? 'SYSTEM OFFLINE' : 'SYSTEM ONLINE'}
                    </p>
                  </div>
                </div>
                <div className={`text-red-300 text-xl transform transition-transform duration-300 ${
                  expandedSections.maintenance ? 'rotate-180' : ''
                }`}>
                  ↓
                </div>
              </button>
              
              <AnimatePresence>
                {expandedSections.maintenance && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 sm:p-6 border-t border-dark-300/30">
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
                              className="w-full bg-dark-200/50 border border-dark-300/50 rounded px-3 py-2 text-gray-300 font-mono text-center"
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* System Notices Management */}
            <div className="bg-dark-200/50 backdrop-blur-lg rounded-lg border border-dark-300/50 overflow-hidden">
              <button
                onClick={() => toggleSection('systemNotices')}
                className="w-full px-6 py-4 bg-dark-300/30 hover:bg-dark-300/50 transition-all duration-300 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📢</div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-amber-200 font-heading">
                      System Notices Manager
                    </h3>
                    <p className="text-sm text-amber-300/80">
                      Manage system-wide notices and announcements
                    </p>
                  </div>
                </div>
                <div className={`text-amber-300 text-xl transform transition-transform duration-300 ${
                  expandedSections.systemNotices ? 'rotate-180' : ''
                }`}>
                  ↓
                </div>
              </button>
              
              <AnimatePresence>
                {expandedSections.systemNotices && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 border-t border-dark-300/30">
                      <SystemNoticesManager />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* System Reports Section */}
            <div className="bg-dark-200/50 backdrop-blur-lg rounded-lg border border-dark-300/50 overflow-hidden">
              <div className="flex">
                <Link
                  to="/admin/system-reports"
                  className="flex-1 px-6 py-4 bg-dark-300/30 hover:bg-purple-500/20 transition-all duration-300 flex items-center gap-3 group"
                >
                  <div className="text-2xl">📊</div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-purple-200 font-heading">
                      System Reports
                    </h3>
                    <p className="text-sm text-purple-300/80">
                      View service health and database metrics
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => toggleSection('systemReports')}
                  className="px-4 py-4 bg-dark-300/30 hover:bg-dark-300/50 transition-all duration-300 border-l border-dark-300/50"
                >
                  <div className={`text-purple-300 text-xl transform transition-transform duration-300 ${
                    expandedSections.systemReports ? 'rotate-180' : ''
                  }`}>
                    ↓
                  </div>
                </button>
              </div>
              
              <AnimatePresence>
                {expandedSections.systemReports && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 border-t border-dark-300/30">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* All Admin Tools - Collapsible Container */}
            <div className="bg-dark-200/50 backdrop-blur-lg rounded-lg border border-dark-300/50 overflow-hidden">
              <button
                onClick={() => toggleSection('adminTools')}
                className="w-full px-6 py-4 bg-dark-300/30 hover:bg-dark-300/50 transition-all duration-300 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🛠️</div>
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-gray-200 font-heading">
                      Admin Tools
                    </h3>
                    <p className="text-sm text-gray-300/80">
                      {adminSections.length} tools across {Array.from(new Set(adminSections.map(s => s.category))).length} categories
                    </p>
                  </div>
                </div>
                <div className={`text-gray-300 text-xl transform transition-transform duration-300 ${
                  expandedSections.adminTools ? 'rotate-180' : ''
                }`}>
                  ↓
                </div>
              </button>
              
              <AnimatePresence>
                {expandedSections.adminTools && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 border-t border-dark-300/30">
                      {/* Group tools by category */}
                      {['Top-Priority', 'User', 'Contest', 'Financial', 'System-Core', 'System-Testing', 'Wallet'].map((category) => {
                        const categoryTools = adminSections.filter(section => section.category === category);
                        if (categoryTools.length === 0) return null;
                        
                        const getCategoryInfo = (cat: string) => {
                          switch (cat) {
                            case 'Top-Priority': return { icon: '⭐', color: 'cyan', name: 'Top Priority' };
                            case 'User': return { icon: '👥', color: 'purple', name: 'User Management' };
                            case 'Contest': return { icon: '🏆', color: 'yellow', name: 'Contest Management' };
                            case 'Financial': return { icon: '💰', color: 'green', name: 'Financial Operations' };
                            case 'System-Core': return { icon: '⚙️', color: 'blue', name: 'System Core' };
                            case 'System-Testing': return { icon: '🧪', color: 'pink', name: 'Testing & Playground' };
                            case 'Wallet': return { icon: '💳', color: 'indigo', name: 'Wallet Management' };
                            default: return { icon: '🔧', color: 'gray', name: cat };
                          }
                        };
                        
                        const categoryInfo = getCategoryInfo(category);
                        
                        return (
                          <div key={category} className="mb-6 last:mb-0">
                            <h4 className={`text-sm font-bold text-${categoryInfo.color}-300 mb-3 flex items-center gap-2`}>
                              <span>{categoryInfo.icon}</span>
                              {categoryInfo.name} ({categoryTools.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {categoryTools.map((section) => (
                                <motion.div
                                  key={section.id}
                                  className={`
                                    bg-dark-200/75 backdrop-blur-lg border-2
                                    ${
                                      selectedSection === section.id
                                        ? `border-dark-300/70 shadow-lg shadow-${section.color}-500/20`
                                        : `border-dark-300/50 hover:border-dark-300/70`
                                    }
                                    p-3 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${section.color}-500/20
                                  `}
                                  whileHover={{ scale: 1.02, y: -2 }}
                                >
                                  <div className={`absolute inset-0 h-px w-full bg-${section.color}-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out`}></div>
                                  
                                  {section.isNew && (
                                    <div className="absolute -top-2 -right-2 z-10">
                                      <div className="px-2 py-0.5 text-xs font-bold rounded-md bg-brand-500/30 text-brand-100 font-mono">
                                        NEW
                                      </div>
                                    </div>
                                  )}
                                  
                                  {section.link ? (
                                    <Link to={section.link} className="block h-full">
                                      <div className="flex items-center mb-2">
                                        <div className={`text-xl text-${section.color}-300 mr-2 group-hover:scale-110 transition-transform duration-300`}>
                                          {section.icon}
                                        </div>
                                        <h3 className={`text-sm font-bold text-${section.color}-300 font-display tracking-wide`}>
                                          {section.title}
                                        </h3>
                                      </div>
                                      
                                      <div className={`w-1/3 h-px bg-gradient-to-r from-${section.color}-500/70 to-transparent mb-2`}></div>
                                      
                                      <p className="text-gray-300 text-xs font-mono">
                                        <span className={`text-${section.color}-200`}>→</span> {section.description}
                                      </p>
                                      
                                      <div className="absolute -bottom-0 -right-0 w-6 h-6">
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-${section.color}-500/70`}></div>
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
                                      <div className="flex items-center mb-2">
                                        <div className={`text-xl text-${section.color}-300 mr-2 group-hover:scale-110 transition-transform duration-300`}>
                                          {section.icon}
                                        </div>
                                        <h3 className={`text-sm font-bold text-${section.color}-300 font-display tracking-wide`}>
                                          {section.title}
                                        </h3>
                                      </div>
                                      
                                      <div className={`w-1/3 h-px bg-gradient-to-r from-${section.color}-500/70 to-transparent mb-2`}></div>
                                      
                                      <p className="text-gray-300 text-xs font-mono">
                                        <span className={`text-${section.color}-200`}>→</span> {section.description}
                                      </p>
                                      
                                      <div className={`absolute top-3 right-3 text-${section.color}-300 text-sm transform transition-all ${selectedSection === section.id ? "rotate-180" : ""}`}>
                                        ↓
                                      </div>
                                      
                                      <div className="absolute -bottom-0 -right-0 w-6 h-6">
                                        <div className={`absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-${section.color}-500/70`}></div>
                                      </div>
                                    </button>
                                  )}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Expandable Content for selected items */}
                      <AnimatePresence>
                        {selectedSection && adminSections.find(s => s.id === selectedSection)?.component && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4"
                          >
                            <div className="pt-4 border-t border-dark-300">
                              {adminSections.find(s => s.id === selectedSection)?.component}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Admin Logs Panel & Token Discovery - 25% width on desktop, full width on mobile */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4 lg:space-y-6 max-h-screen overflow-y-auto">
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
                rootMargin="50px"
              >
                <AdminLogsPanel />
              </LazyLoad>
            </div>
          </div>
        </div>
      </div>
      </div>
    </ContestProvider>
  );
};
