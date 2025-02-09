// src/pages/AdminDashboard.tsx

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { ActivityMonitor } from "../../components/admin/ActivityMonitor";
import { BalanceManager } from "../../components/admin/BalanceManager";
import { ContestProvider } from "../../components/ApiPlaygroundParts/ContestContext";
import { ContestsList } from "../../components/ApiPlaygroundParts/ContestsList";
import { EndContest } from "../../components/ApiPlaygroundParts/EndContest";
import { StartContest } from "../../components/ApiPlaygroundParts/StartContest";
import { UserDetail } from "../../components/ApiPlaygroundParts/UserDetail";
import { CreateContestButton } from "../../components/contests/browser/CreateContestButton";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";

type TabType = "overview" | "contests" | "users" | "activity";

export const AdminDashboard: React.FC = () => {
  const { maintenanceMode, setMaintenanceMode } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [maintenanceDuration, setMaintenanceDuration] = useState<number>(15); // Default 15 minutes
  const [error, setError] = useState<string | null>(null);

  const toggleMaintenanceMode = async () => {
    try {
      // Optimistically update UI first
      const newState = !maintenanceMode;
      setMaintenanceMode(newState);

      // If enabling maintenance mode, set initial settings first
      if (newState) {
        try {
          await ddApi.fetch("/api/system/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([
              {
                key: "maintenance_start_time",
                value: new Date().toISOString(),
                description: "Time when maintenance mode was enabled",
              },
              {
                key: "maintenance_estimated_duration",
                value: "15",
                description: "Estimated maintenance duration in minutes",
              },
            ]),
          });
        } catch (err) {
          console.warn(
            "Failed to set initial maintenance settings, will retry"
          );
        }
      }

      // Toggle maintenance mode
      const response = await ddApi.admin.setMaintenanceMode(newState);

      if (!response.ok) {
        // Revert UI if failed
        setMaintenanceMode(!newState);
        throw new Error(
          `Failed to ${newState ? "enable" : "disable"} maintenance mode`
        );
      }

      // Force reload app state after successful toggle
      window.location.reload();
    } catch (err) {
      console.error("Failed to toggle maintenance mode:", err);
      setError(
        `Failed to ${maintenanceMode ? "disable" : "enable"} maintenance mode`
      );
    }
  };

  // Fetch current duration when component mounts
  useEffect(() => {
    const fetchDuration = async () => {
      try {
        const response = await ddApi.fetch("/api/system/settings");
        if (!response.ok) {
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
      }
    };

    fetchDuration();
  }, []);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "contests", label: "Contests", icon: "🏆" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "activity", label: "Activity", icon: "📈" },
  ];

  return (
    <ContestProvider>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-4">Admin Panel</h1>
          <p className="text-gray-400">
            Manage user balances, contests, and monitor system activities.
          </p>
        </div>

        {/* Maintenance Mode Control Center */}
        <div className="bg-dark-200/50 backdrop-blur-lg p-8 rounded-lg border border-brand-500/20 mb-8 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-dark-300/50 via-dark-200/50 to-dark-300/50" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.1)_0%,transparent_70%)] animate-pulse-slow" />
            {maintenanceMode && (
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-red-500/5 animate-pulse-slow" />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(-45deg, transparent 0, transparent 20px, rgba(239,68,68,0.1) 20px, rgba(239,68,68,0.1) 40px)",
                    backgroundSize: "200% 200%",
                    animation: "gradient-shift 10s linear infinite",
                  }}
                />
              </div>
            )}
          </div>

          <div className="relative">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold font-cyber tracking-wider text-gray-200 mb-2">
                SYSTEM CONTROL CENTER
              </h2>
              <div className="text-sm text-gray-400 font-mono">
                AUTHORIZATION LEVEL: ADMIN_CLEARANCE
              </div>
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6"
                >
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <div className="text-red-400 mt-0.5">⚠</div>
                      <div className="flex-1">
                        <div className="text-red-400 font-medium">
                          Control Center Error
                        </div>
                        <div className="text-red-400/90 text-sm">{error}</div>
                      </div>
                      <button
                        onClick={() => setError(null)}
                        className="text-red-400/50 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Control Panel */}
            <div className="flex items-stretch gap-8">
              {/* Status Panel */}
              <div className="flex-1 bg-dark-300/50 rounded-lg p-6 border border-brand-500/20">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        maintenanceMode
                          ? "bg-red-500 animate-pulse"
                          : "bg-green-500"
                      }`}
                    />
                    <span className="font-mono text-sm text-gray-300">
                      SYSTEM STATUS:{" "}
                      {maintenanceMode ? "MAINTENANCE_MODE" : "OPERATIONAL"}
                    </span>
                  </div>

                  <div className="font-mono text-xs text-gray-400 leading-relaxed">
                    {maintenanceMode ? (
                      <>
                        <div>⚠ All non-admin access restricted</div>
                        <div>⚠ Trading operations suspended</div>
                        <div>⚠ Contest entries blocked</div>
                      </>
                    ) : (
                      <>
                        <div>✓ All systems operational</div>
                        <div>✓ Trading enabled</div>
                        <div>✓ Contest entries allowed</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Control Switch */}
              <div className="w-96 bg-dark-300/50 rounded-lg p-6 border border-brand-500/20">
                <div className="text-center space-y-6">
                  {/* Duration Setting (only shown when system is live) */}
                  <AnimatePresence>
                    {!maintenanceMode && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
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

                  {/* The Epic Switch */}
                  <button
                    onClick={toggleMaintenanceMode}
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
                        transition-colors duration-300
                      `}
                    >
                      {/* Key Lock Effect */}
                      <div className="absolute left-4 top-1/2 -translate-y-1/2">
                        <div
                          className={`
                          w-6 h-6 rounded-full border-2 
                          ${
                            maintenanceMode
                              ? "border-red-500"
                              : "border-green-500"
                          }
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
                          {maintenanceMode ? (
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
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 relative">
            <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-dark-300/0 via-dark-300 to-dark-300/0" />
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative z-20 px-6 py-3 text-sm font-medium 
                  transition-all duration-300 ease-in-out
                  group
                  ${
                    activeTab === tab.id
                      ? "text-brand-400 bg-dark-200/50 border-x border-t border-dark-300"
                      : "text-gray-400 hover:text-gray-300"
                  }
                  rounded-t-lg
                  hover:bg-dark-200/30
                  focus:outline-none focus:ring-2 focus:ring-brand-400/50 focus:ring-offset-2 focus:ring-offset-dark-100
                `}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <span
                    className={`text-lg transition-transform duration-300 ${
                      activeTab === tab.id
                        ? "transform scale-110"
                        : "group-hover:scale-110"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span className="relative">
                    {tab.label}
                    <div
                      className={`
                      absolute -bottom-1 left-0 w-full h-0.5
                      bg-brand-400 transform origin-left
                      transition-transform duration-300
                      ${activeTab === tab.id ? "scale-x-100" : "scale-x-0"}
                    `}
                    />
                  </span>
                </div>
                {activeTab === tab.id && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 animate-gradient-x" />
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-400/0 via-brand-400 to-brand-400/0" />
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Container */}
        <div className="bg-dark-200 border border-dark-300 rounded-lg relative">
          {/* Overview Tab */}
          <div
            className={`
              relative z-10
              transition-all duration-300 ease-in-out
              ${activeTab === "overview" ? "block" : "hidden"}
            `}
          >
            {activeTab === "overview" && (
              <div className="p-6 relative">
                <div className="space-y-6">
                  {/* Balance Manager */}
                  <div className="relative z-10">
                    <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                      <span className="text-xl">💰</span>
                      Balance Management
                    </h2>
                    <div className="relative z-10">
                      <BalanceManager />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contests Tab */}
          <div
            className={`
              relative z-10
              transition-all duration-300 ease-in-out
              ${activeTab === "contests" ? "block" : "hidden"}
            `}
          >
            {activeTab === "contests" && (
              <div className="p-6 relative">
                <div className="space-y-6">
                  {/* Contest Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-dark-300/30 rounded-lg p-4 relative z-10">
                      <StartContest />
                    </div>
                    <div className="bg-dark-300/30 rounded-lg p-4 relative z-10">
                      <EndContest />
                    </div>
                  </div>

                  {/* Create Contest Button */}
                  <div className="flex justify-end relative z-10">
                    <CreateContestButton />
                  </div>

                  {/* Contest List */}
                  <div className="relative z-10">
                    <h3 className="text-lg font-medium text-gray-100 mb-4">
                      Contest Overview
                    </h3>
                    <ContestsList />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Users Tab */}
          <div
            className={`
              relative z-10
              transition-all duration-300 ease-in-out
              ${activeTab === "users" ? "block" : "hidden"}
            `}
          >
            {activeTab === "users" && (
              <div className="p-6 relative">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <span className="text-xl">👥</span>
                    User Management
                  </h2>
                  <div className="relative z-10">
                    <UserDetail />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Activity Tab */}
          <div
            className={`
              relative z-10
              transition-all duration-300 ease-in-out
              ${activeTab === "activity" ? "block" : "hidden"}
            `}
          >
            {activeTab === "activity" && (
              <div className="p-6 relative">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <span className="text-xl">📈</span>
                    Activity Monitor
                  </h2>
                  <div className="relative z-10">
                    <ActivityMonitor limit={10} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ContestProvider>
  );
};
