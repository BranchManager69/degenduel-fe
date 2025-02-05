// src/pages/AdminDashboard.tsx
import React from "react";
import { toast } from "react-hot-toast";
import { ActivityMonitor } from "../../components/admin/ActivityMonitor";
import { BalanceManager } from "../../components/admin/BalanceManager";
import { ContestProvider } from "../../components/ApiPlaygroundParts/ContestContext";
import { ContestsList } from "../../components/ApiPlaygroundParts/ContestsList";
import { EndContest } from "../../components/ApiPlaygroundParts/EndContest";
import { StartContest } from "../../components/ApiPlaygroundParts/StartContest";
import { UserDetail } from "../../components/ApiPlaygroundParts/UserDetail";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";

export const AdminDashboard: React.FC = () => {
  const { maintenanceMode, setMaintenanceMode } = useStore();

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

  return (
    <ContestProvider>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-4">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Manage user balances, contests, and monitor system activities.
          </p>
        </div>

        {/* Maintenance Mode Section */}
        <div className="bg-dark-200/50 backdrop-blur-lg p-6 rounded-lg border border-brand-500/20 mb-8">
          <h2 className="text-xl font-heading text-brand-400 mb-4">
            System Status
          </h2>

          <div className="flex items-center justify-between p-4 bg-dark-300/50 rounded-lg">
            <div>
              <h3 className="text-lg text-gray-200 mb-1">Maintenance Mode</h3>
              <p className="text-sm text-gray-400">
                {maintenanceMode
                  ? "Site is currently in maintenance mode. Only admins can access protected routes."
                  : "Site is operating normally."}
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
              {maintenanceMode
                ? "Disable Maintenance Mode"
                : "Enable Maintenance Mode"}
            </button>
          </div>
        </div>

        {/* Contest Management Section */}
        <div className="mb-8">
          <div className="bg-dark-200 border border-dark-300 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-dark-300">
              <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <span className="text-xl">🏆</span>
                Contest Management
              </h2>
            </div>

            {/* Contest Actions - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div className="bg-dark-300/30 rounded-lg p-4">
                <StartContest />
              </div>
              <div className="bg-dark-300/30 rounded-lg p-4">
                <EndContest />
              </div>
            </div>

            {/* Contest List - Below */}
            <div className="border-t border-dark-300 p-6">
              <h3 className="text-lg font-medium text-gray-100 mb-4">
                Contest Overview
              </h3>
              <ContestsList />
            </div>
          </div>
        </div>

        {/* User Management Section - Full Width */}
        <div className="mb-8">
          <div className="bg-dark-200 border border-dark-300 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <span className="text-xl">👥</span>
              User Management
            </h2>
            <div className="space-y-4">
              <UserDetail />
            </div>
          </div>
        </div>

        {/* Balance Manager Section */}
        <div className="mb-8">
          <BalanceManager />
        </div>

        {/* Activity Monitor Section */}
        <div className="mb-8">
          <ActivityMonitor limit={5} />
        </div>

        {/* Reports & Analytics Section */}
        <div className="mb-8">
          <div className="bg-dark-200 border border-dark-300 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-2 flex items-center gap-2">
              <span className="text-xl">📊</span>
              Reports & Analytics
            </h2>
            <p className="text-gray-400">
              View contest statistics and user participation metrics.
            </p>
            <div className="mt-4 text-gray-500">Coming soon</div>
          </div>
        </div>
      </div>
    </ContestProvider>
  );
};
