import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { ActivityMonitor } from "../../components/admin/ActivityMonitor";
import { BalanceManager } from "../../components/admin/BalanceManager";
import { LogViewer } from "../../components/admin/LogViewer";
import { ddApi } from "../../services/dd-api";

type TabType = "system" | "database" | "tools" | "monitoring" | "token-sync";

interface ReseedPhase {
  name: string;
  label: string;
  description: string;
  dependencies: string[];
  status: "pending" | "completed" | "failed" | "running";
  timestamp?: string;
}

interface ReseedStatus {
  currentPhase: string | null;
  completedPhases: string[];
  availablePhases: string[];
  lastUpdate: string;
}

interface TokenSyncStats {
  lastSyncTime: string;
  syncDuration: number;
  totalTokens: number;
  created: number;
  updated: number;
  unchanged: number;
  failed: number;
  consecutiveFailures: number;
  averageSyncTime: number;
  successRate: number;
}

interface ValidationStats {
  total: number;
  byType: {
    missingMetadata: number;
    invalidPrice: number;
    invalidMarketCap: number;
    invalidVolume: number;
    invalidLiquidity: number;
    malformedSocials: number;
  };
}

interface MetadataQuality {
  overall: number;
  byField: {
    images: number;
    socials: number;
    websites: number;
    description: number;
    marketData: number;
  };
  recommendations: Array<{
    field: string;
    score: number;
    suggestion: string;
  }>;
}

interface TokenSyncHealth {
  status: "healthy" | "degraded" | "critical";
  lastCheck: string;
  issues: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    message: string;
  }>;
  metrics: {
    responseTime: number;
    errorRate: number;
    dataFreshness: number;
  };
}

export const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("system");
  const [isConfirmingReseed, setIsConfirmingReseed] = useState<string | null>(
    null
  );
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedStatus, setReseedStatus] = useState<ReseedStatus | null>(null);
  const [statusPolling, setStatusPolling] = useState<number | null>(null);
  const [phases, setPhases] = useState<
    (ReseedPhase & { step: number; group: string })[]
  >([
    {
      name: "clear",
      label: "Clear Data",
      description: "Clears all existing data from the database",
      dependencies: [],
      status: "pending",
      step: 1,
      group: "preparation",
    },
    {
      name: "tokens",
      label: "Token Data",
      description: "Seeds initial token data",
      dependencies: ["clear"],
      status: "pending",
      step: 2,
      group: "core-data",
    },
    {
      name: "achievements",
      label: "Achievements",
      description: "Seeds achievement definitions",
      dependencies: ["clear"],
      status: "pending",
      step: 2,
      group: "core-data",
    },
    {
      name: "user_levels",
      label: "User Levels",
      description: "Seeds user level definitions",
      dependencies: ["clear"],
      status: "pending",
      step: 2,
      group: "core-data",
    },
    {
      name: "users",
      label: "Users",
      description: "Seeds initial user accounts",
      dependencies: ["clear", "user_levels"],
      status: "pending",
      step: 3,
      group: "user-data",
    },
    {
      name: "contests",
      label: "Contests",
      description: "Seeds contest data",
      dependencies: ["clear", "users"],
      status: "pending",
      step: 4,
      group: "contest-data",
    },
    {
      name: "participants",
      label: "Participants",
      description: "Seeds contest participant data",
      dependencies: ["clear", "users", "contests"],
      status: "pending",
      step: 5,
      group: "contest-data",
    },
    {
      name: "portfolios",
      label: "Portfolios",
      description: "Seeds portfolio data",
      dependencies: ["clear", "users", "tokens", "contests"],
      status: "pending",
      step: 5,
      group: "contest-data",
    },
  ]);
  const [tokenSyncStats, setTokenSyncStats] = useState<TokenSyncStats | null>(
    null
  );
  const [validationStats, setValidationStats] =
    useState<ValidationStats | null>(null);
  const [metadataQuality, setMetadataQuality] =
    useState<MetadataQuality | null>(null);
  const [syncHealth, setSyncHealth] = useState<TokenSyncHealth | null>(null);
  const [syncStatsLoading, setSyncStatsLoading] = useState(false);
  const [syncStatsError, setSyncStatsError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReseedStatus = async () => {
    try {
      const response = await ddApi.fetch("/superadmin/reseed-status");
      const status = await response.json();

      // Validate the response structure
      if (!status || typeof status !== "object") {
        throw new Error("Invalid response format");
      }

      // Ensure required properties exist with default values if missing
      const validatedStatus = {
        currentPhase: status.currentPhase || null,
        completedPhases: Array.isArray(status.completedPhases)
          ? status.completedPhases
          : [],
        availablePhases: Array.isArray(status.availablePhases)
          ? status.availablePhases
          : [],
        lastUpdate: status.lastUpdate || new Date().toISOString(),
      };

      setReseedStatus(validatedStatus);

      // Update phase statuses
      setPhases((prevPhases) =>
        prevPhases.map((phase) => ({
          ...phase,
          status: validatedStatus.completedPhases.includes(phase.name)
            ? "completed"
            : phase.name === validatedStatus.currentPhase
            ? "running"
            : "pending",
          timestamp: validatedStatus.lastUpdate,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch reseed status:", error);
      toast.error("Failed to fetch reseeding status");
    }
  };

  useEffect(() => {
    if (activeTab === "database") {
      fetchReseedStatus();
      const interval = setInterval(fetchReseedStatus, 5000);
      setStatusPolling(interval);
      return () => {
        clearInterval(interval);
        setStatusPolling(null);
      };
    } else if (statusPolling) {
      clearInterval(statusPolling);
      setStatusPolling(null);
    }
  }, [activeTab]);

  const fetchTokenSyncData = async () => {
    if (activeTab !== "token-sync") return;

    setSyncStatsLoading(!tokenSyncStats); // Only show full loading state on first load
    setIsRefreshing(!!tokenSyncStats); // Show refresh indicator if we already have data
    setSyncStatsError(null);

    try {
      const [statusRes, validationRes, qualityRes, healthRes] =
        await Promise.all([
          fetch("/api/admin/token-sync/status"),
          fetch("/api/admin/token-sync/validation-stats"),
          fetch("/api/admin/token-sync/metadata-quality"),
          fetch("/api/admin/token-sync/health"),
        ]);

      if (
        !statusRes.ok ||
        !validationRes.ok ||
        !qualityRes.ok ||
        !healthRes.ok
      ) {
        throw new Error("One or more API endpoints returned an error");
      }

      const [status, validation, quality, health] = await Promise.all([
        statusRes.json(),
        validationRes.json(),
        qualityRes.json(),
        healthRes.json(),
      ]);

      // Ensure metrics object exists with default values
      const validatedHealth = {
        ...health,
        metrics: {
          responseTime: 0,
          errorRate: 0,
          dataFreshness: 0,
          ...(health?.metrics || {}),
        },
      };

      setTokenSyncStats(status);
      setValidationStats(validation);
      setMetadataQuality(quality);
      setSyncHealth(validatedHealth);
    } catch (error) {
      setSyncStatsError(
        error instanceof Error
          ? error.message
          : "Failed to fetch token sync data"
      );
      console.error("Token sync data fetch error:", error);
    } finally {
      setSyncStatsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTokenSyncData();

    // Poll every 30 seconds when the token-sync tab is active
    const interval = setInterval(fetchTokenSyncData, 30000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const handlePhaseExecution = async (
    phase: string,
    isRollback: boolean = false
  ) => {
    if (!isConfirmingReseed) {
      setIsConfirmingReseed(phase);
      return;
    }

    if (isConfirmingReseed !== phase) {
      return;
    }

    try {
      setReseedLoading(true);
      const endpoint = isRollback
        ? `/superadmin/reseed-rollback/${phase}`
        : `/superadmin/reseed-database/${phase}`;

      await ddApi.fetch(endpoint, { method: "POST" });

      toast.success(
        `Successfully ${
          isRollback ? "rolled back" : "completed"
        } phase: ${phase}`
      );
      fetchReseedStatus();
    } catch (error) {
      console.error(
        `Failed to ${isRollback ? "rollback" : "execute"} phase:`,
        error
      );
      toast.error(
        `Failed to ${
          isRollback ? "rollback" : "execute"
        } phase. Check console for details.`
      );
    } finally {
      setReseedLoading(false);
      setIsConfirmingReseed(null);
    }
  };

  const canExecutePhase = (phase: ReseedPhase): boolean => {
    if (!reseedStatus) return false;
    return phase.dependencies.every((dep) =>
      reseedStatus.completedPhases.includes(dep)
    );
  };

  const canRollbackPhase = (phase: ReseedPhase): boolean => {
    if (!reseedStatus) return false;
    // Can only rollback if no other completed phases depend on this one
    return (
      reseedStatus.completedPhases.includes(phase.name) &&
      !phases.some(
        (p) =>
          p.dependencies.includes(phase.name) &&
          reseedStatus.completedPhases.includes(p.name)
      )
    );
  };

  /*
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "system", label: "System", icon: "⚙️" },
    { id: "database", label: "Database", icon: "🗄️" },
    { id: "monitoring", label: "Monitoring", icon: "📊" },
    { id: "tools", label: "Tools", icon: "🛠️" },
  ];
  */

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-4">
          SuperAdmin Dashboard
        </h1>
        <p className="text-gray-400">
          You are God of all things DegenDuel. Use these tools wisely or suffer
          the consequences.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-dark-300">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab("system")}
            className={`px-4 py-2 font-medium ${
              activeTab === "system"
                ? "text-brand-400 border-b-2 border-brand-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            System
          </button>
          <button
            onClick={() => setActiveTab("database")}
            className={`px-4 py-2 font-medium ${
              activeTab === "database"
                ? "text-brand-400 border-b-2 border-brand-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Database
          </button>
          <button
            onClick={() => setActiveTab("token-sync")}
            className={`px-4 py-2 font-medium ${
              activeTab === "token-sync"
                ? "text-brand-400 border-b-2 border-brand-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Token Sync
          </button>
          <button
            onClick={() => setActiveTab("tools")}
            className={`px-4 py-2 font-medium ${
              activeTab === "tools"
                ? "text-brand-400 border-b-2 border-brand-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Tools
          </button>
          <button
            onClick={() => setActiveTab("monitoring")}
            className={`px-4 py-2 font-medium ${
              activeTab === "monitoring"
                ? "text-brand-400 border-b-2 border-brand-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Monitoring
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-dark-200 border border-dark-300 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-400/5 via-transparent to-transparent pointer-events-none" />

        {/* System Tab */}
        <div
          className={`
          transition-all duration-300 ease-in-out
          ${
            activeTab === "system"
              ? "opacity-100 transform translate-x-0"
              : "opacity-0 absolute inset-0 translate-x-4"
          }
        `}
        >
          {activeTab === "system" && (
            <div className="p-6">
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
            </div>
          )}
        </div>

        {/* Database Tab */}
        <div
          className={`
          transition-all duration-300 ease-in-out
          ${
            activeTab === "database"
              ? "opacity-100 transform translate-x-0"
              : "opacity-0 absolute inset-0 translate-x-4"
          }
        `}
        >
          {activeTab === "database" && (
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <span className="text-xl">🗄️</span>
                    Database Operations
                  </h2>

                  {/* Status Overview */}
                  <div className="bg-dark-300/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-100">
                        Reseeding Status
                      </h3>
                      <div className="text-sm text-gray-400">
                        Last Updated:{" "}
                        {reseedStatus?.lastUpdate
                          ? new Date(reseedStatus.lastUpdate).toLocaleString()
                          : "Never"}
                      </div>
                    </div>

                    {/* Phase Grid */}
                    <div className="space-y-8">
                      {/* Group phases by step */}
                      {Array.from(new Set(phases.map((p) => p.step)))
                        .sort((a, b) => a - b)
                        .map((step) => {
                          const stepPhases = phases.filter(
                            (p) => p.step === step
                          );
                          const groups = Array.from(
                            new Set(stepPhases.map((p) => p.group))
                          );

                          return (
                            <div key={step} className="space-y-4">
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dark-300 flex items-center justify-center text-brand-400 font-bold">
                                  {step}
                                </div>
                                <h3 className="text-lg font-medium text-gray-100">
                                  Step {step}:{" "}
                                  {groups
                                    .map((g) =>
                                      g
                                        .split("-")
                                        .map(
                                          (word) =>
                                            word.charAt(0).toUpperCase() +
                                            word.slice(1)
                                        )
                                        .join(" ")
                                    )
                                    .join(" & ")}
                                </h3>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-10">
                                {stepPhases.map((phase) => (
                                  <div
                                    key={phase.name}
                                    className={`
                                    p-4 rounded-lg border
                                    ${
                                      phase.status === "completed"
                                        ? "bg-green-500/10 border-green-500/30"
                                        : phase.status === "running"
                                        ? "bg-blue-500/10 border-blue-500/30 animate-pulse"
                                        : canExecutePhase(phase)
                                        ? "bg-dark-400/30 border-dark-400 ring-2 ring-brand-500/50"
                                        : "bg-dark-400/30 border-dark-400 opacity-50"
                                    }
                                  `}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h4 className="font-medium text-gray-100 flex items-center gap-2">
                                          {phase.label}
                                          {phase.status === "completed" && (
                                            <span className="text-green-400">
                                              ✓
                                            </span>
                                          )}
                                          {phase.status === "running" && (
                                            <span className="text-blue-400">
                                              ⟳
                                            </span>
                                          )}
                                        </h4>
                                        <p className="text-sm text-gray-400 mt-1">
                                          {phase.description}
                                        </p>

                                        {/* Dependencies */}
                                        {phase.dependencies.length > 0 && (
                                          <div className="mt-2">
                                            <p className="text-xs text-gray-500">
                                              Requires:{" "}
                                              {phase.dependencies.join(", ")}
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex gap-2">
                                        {/* Execute Phase Button */}
                                        <button
                                          onClick={() =>
                                            handlePhaseExecution(phase.name)
                                          }
                                          disabled={
                                            reseedLoading ||
                                            !canExecutePhase(phase) ||
                                            phase.status === "completed"
                                          }
                                          className={`
                                          px-3 py-1 rounded text-sm font-medium
                                          ${
                                            isConfirmingReseed === phase.name
                                              ? "bg-brand-500 hover:bg-brand-600 text-white"
                                              : canExecutePhase(phase) &&
                                                phase.status !== "completed"
                                              ? "bg-brand-500/20 hover:bg-brand-500/30 text-brand-300"
                                              : "bg-dark-400 hover:bg-dark-500 text-gray-200"
                                          }
                                          disabled:opacity-50 disabled:cursor-not-allowed
                                          transition-all duration-200
                                        `}
                                        >
                                          {reseedLoading &&
                                          isConfirmingReseed === phase.name
                                            ? "Running..."
                                            : isConfirmingReseed === phase.name
                                            ? "Confirm"
                                            : "Execute"}
                                        </button>

                                        {/* Rollback Button */}
                                        {phase.status === "completed" && (
                                          <button
                                            onClick={() =>
                                              handlePhaseExecution(
                                                phase.name,
                                                true
                                              )
                                            }
                                            disabled={
                                              reseedLoading ||
                                              !canRollbackPhase(phase)
                                            }
                                            className={`
                                            px-3 py-1 rounded text-sm font-medium
                                            ${
                                              isConfirmingReseed ===
                                              `${phase.name}_rollback`
                                                ? "bg-red-500 hover:bg-red-600 text-white"
                                                : "bg-dark-400 hover:bg-dark-500 text-gray-200"
                                            }
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                            transition-all duration-200
                                          `}
                                          >
                                            {reseedLoading &&
                                            isConfirmingReseed ===
                                              `${phase.name}_rollback`
                                              ? "Rolling Back..."
                                              : isConfirmingReseed ===
                                                `${phase.name}_rollback`
                                              ? "Confirm Rollback"
                                              : "Rollback"}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Token Sync Tab */}
        {activeTab === "token-sync" && (
          <div className="space-y-6 p-6">
            {/* Header with Refresh Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-100">
                Token Sync Monitoring
              </h2>
              <button
                onClick={fetchTokenSyncData}
                disabled={syncStatsLoading || isRefreshing}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isRefreshing
                    ? "bg-brand-500/50 cursor-wait"
                    : "bg-brand-500 hover:bg-brand-600"
                } text-white transition-colors`}
              >
                <svg
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>

            {/* Health Status Card */}
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                Sync Health Status
              </h2>
              {syncStatsLoading && !tokenSyncStats ? (
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-dark-300 rounded w-3/4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-dark-300 rounded"></div>
                      <div className="h-4 bg-dark-300 rounded w-5/6"></div>
                    </div>
                  </div>
                </div>
              ) : syncStatsError ? (
                <div className="text-red-400 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="font-medium mb-1">
                    Error fetching sync data:
                  </div>
                  {syncStatsError}
                </div>
              ) : syncHealth ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    className={`p-4 rounded-lg ${
                      syncHealth.status === "healthy"
                        ? "bg-green-500/20 border-green-500/50"
                        : syncHealth.status === "degraded"
                        ? "bg-yellow-500/20 border-yellow-500/50"
                        : "bg-red-500/20 border-red-500/50"
                    } border relative group`}
                    title="Overall health status of the token sync system"
                  >
                    <div className="text-sm text-gray-400">Status</div>
                    <div
                      className={`text-lg font-semibold ${
                        syncHealth.status === "healthy"
                          ? "text-green-400"
                          : syncHealth.status === "degraded"
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {syncHealth.status.charAt(0).toUpperCase() +
                        syncHealth.status.slice(1)}
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-lg bg-dark-300/50 border border-dark-400 relative group"
                    title="Average time taken to process API requests"
                  >
                    <div className="text-sm text-gray-400">Response Time</div>
                    <div className="text-lg font-semibold text-gray-100">
                      {syncHealth.metrics?.responseTime
                        ? `${syncHealth.metrics.responseTime.toFixed(2)}ms`
                        : "N/A"}
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-lg bg-dark-300/50 border border-dark-400 relative group"
                    title="Percentage of failed API requests in the last hour"
                  >
                    <div className="text-sm text-gray-400">Error Rate</div>
                    <div className="text-lg font-semibold text-gray-100">
                      {syncHealth.metrics?.errorRate
                        ? `${(syncHealth.metrics.errorRate * 100).toFixed(2)}%`
                        : "N/A"}
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-lg bg-dark-300/50 border border-dark-400 relative group"
                    title="Time since the last successful data update"
                  >
                    <div className="text-sm text-gray-400">Data Freshness</div>
                    <div className="text-lg font-semibold text-gray-100">
                      {Math.round(
                        (syncHealth.metrics?.dataFreshness ?? 0) / 60
                      )}{" "}
                      min
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Sync Statistics Card */}
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                Sync Statistics
              </h2>
              {tokenSyncStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    className="p-4 rounded-lg bg-dark-300/50 border border-dark-400 relative group"
                    title="Total number of tokens being tracked"
                  >
                    <div className="text-sm text-gray-400">Total Tokens</div>
                    <div className="text-lg font-semibold text-gray-100">
                      {tokenSyncStats.totalTokens}
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-lg bg-dark-300/50 border border-dark-400 relative group"
                    title="Percentage of successful sync operations"
                  >
                    <div className="text-sm text-gray-400">Success Rate</div>
                    <div className="text-lg font-semibold text-gray-100">
                      {tokenSyncStats?.successRate
                        ? `${(tokenSyncStats.successRate * 100).toFixed(2)}%`
                        : "N/A"}
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-lg bg-dark-300/50 border border-dark-400 relative group"
                    title="Average time taken to sync all tokens"
                  >
                    <div className="text-sm text-gray-400">Avg Sync Time</div>
                    <div className="text-lg font-semibold text-gray-100">
                      {tokenSyncStats?.averageSyncTime
                        ? `${tokenSyncStats.averageSyncTime.toFixed(2)}s`
                        : "N/A"}
                    </div>
                  </div>

                  <div
                    className="p-4 rounded-lg bg-dark-300/50 border border-dark-400 relative group"
                    title="Time of the most recent sync operation"
                  >
                    <div className="text-sm text-gray-400">Last Sync</div>
                    <div className="text-lg font-semibold text-gray-100">
                      {new Date(
                        tokenSyncStats.lastSyncTime
                      ).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Validation Stats Card */}
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                Validation Statistics
              </h2>
              {validationStats?.byType ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(validationStats.byType).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="p-4 rounded-lg bg-dark-300/50 border border-dark-400 relative group"
                        title={`Number of ${type
                          .replace(/([A-Z])/g, " $1")
                          .toLowerCase()} issues`}
                      >
                        <div className="text-sm text-gray-400">
                          {type.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                        <div className="text-lg font-semibold text-gray-100">
                          {count}
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : null}
            </div>

            {/* Metadata Quality Card */}
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-6 border border-dark-300">
              <h2 className="text-xl font-semibold text-gray-100 mb-4">
                Metadata Quality
              </h2>
              {metadataQuality?.byField ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {Object.entries(metadataQuality.byField).map(
                      ([field, score]) => (
                        <div
                          key={field}
                          className="p-4 rounded-lg bg-dark-300/50 border border-dark-400 relative group"
                          title={`Quality score for ${field
                            .replace(/([A-Z])/g, " $1")
                            .toLowerCase()} data`}
                        >
                          <div className="text-sm text-gray-400">
                            {field.replace(/([A-Z])/g, " $1").trim()}
                          </div>
                          <div className="text-lg font-semibold text-gray-100">
                            {score ? `${(score * 100).toFixed(1)}%` : "N/A"}
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* Recommendations */}
                  {metadataQuality.recommendations?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-200 mb-3">
                        Recommendations
                      </h3>
                      <div className="space-y-3">
                        {metadataQuality.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-lg bg-dark-300/50 border border-dark-400"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-300">
                                {rec.field}
                              </span>
                              <span className="text-sm text-gray-400">
                                Score: {(rec.score * 100).toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              {rec.suggestion}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  No metadata quality data available
                </div>
              )}
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        <div
          className={`
          transition-all duration-300 ease-in-out
          ${
            activeTab === "monitoring"
              ? "opacity-100 transform translate-x-0"
              : "opacity-0 absolute inset-0 translate-x-4"
          }
        `}
        >
          {activeTab === "monitoring" && (
            <div className="p-6">
              <div className="space-y-6">
                {/* Activity Monitor */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    Activity Monitor
                  </h2>
                  <ActivityMonitor limit={10} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tools Tab */}
        <div
          className={`
          transition-all duration-300 ease-in-out
          ${
            activeTab === "tools"
              ? "opacity-100 transform translate-x-0"
              : "opacity-0 absolute inset-0 translate-x-4"
          }
        `}
        >
          {activeTab === "tools" && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* AMM Simulator Card */}
                <Link
                  to="/amm-sim"
                  className="bg-dark-300/30 p-6 rounded-lg hover:bg-dark-300/50 transition-colors border border-dark-300 group"
                >
                  <h2 className="text-xl font-semibold text-gray-100 mb-2 group-hover:text-brand-400 transition-colors">
                    Launch Sim
                  </h2>
                  <p className="text-gray-400">
                    Simulate the DUEL token launch and start counting those
                    hypothetical profits.
                  </p>
                </Link>

                {/* API Playground Card */}
                <Link
                  to="/api-playground"
                  className="bg-dark-300/30 p-6 rounded-lg hover:bg-dark-300/50 transition-colors border border-dark-300 group"
                >
                  <h2 className="text-xl font-semibold text-gray-100 mb-2 group-hover:text-brand-400 transition-colors">
                    API Playground
                  </h2>
                  <p className="text-gray-400">
                    Manually call API endpoints, totally willy-nilly.
                  </p>
                </Link>

                {/* Test Environment Card */}
                <Link
                  to="/test"
                  className="bg-dark-300/30 p-6 rounded-lg hover:bg-dark-300/50 transition-colors border border-dark-300 group"
                >
                  <h2 className="text-xl font-semibold text-gray-100 mb-2 group-hover:text-brand-400 transition-colors">
                    Test Page
                  </h2>
                  <p className="text-gray-400">
                    Blank spot for some future shit.
                  </p>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
