// src/pages/AdminDashboard.tsx

import React, { useState } from "react";
import { toast } from "react-hot-toast";
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

  const toggleMaintenanceMode = async () => {
    try {
      // Call API to toggle maintenance mode
      await ddApi.admin.setMaintenanceMode(!maintenanceMode);

      // Update local state
      setMaintenanceMode(!maintenanceMode);

      // Show success message
      toast.success(
        `Maintenance mode ${!maintenanceMode ? "enabled" : "disabled"}`
      );
    } catch (error) {
      console.error("Failed to toggle maintenance mode:", error);
      toast.error("Failed to toggle maintenance mode");
    }
  };

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

        {/* Maintenance Mode Banner */}
        <div className="bg-dark-200/50 backdrop-blur-lg p-6 rounded-lg border border-brand-500/20 mb-8">
          <div className="flex items-center justify-between p-4 bg-dark-300/50 rounded-lg">
            <div>
              <h3 className="text-lg text-gray-200 mb-1">Maintenance Mode</h3>
              <p className="text-sm text-gray-400">
                {maintenanceMode
                  ? "DegenDuel is currently in Maintenance Mode. All important pages and actions are unavailable, and you might notice other unexpected behavior on the site."
                  : "DegenDuel is live and operating normally."}
              </p>
            </div>
            <button
              onClick={toggleMaintenanceMode}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                maintenanceMode
                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
                  : "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50"
              }`}
            >
              {maintenanceMode ? "🔓 Unlock Site" : "🔒 Engage Lockdown"}
            </button>
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
