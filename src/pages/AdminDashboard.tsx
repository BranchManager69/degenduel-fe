// src/pages/AdminDashboard.tsx
import React from "react";
import { ActivityMonitor } from "../components/admin/ActivityMonitor";
import { BalanceManager } from "../components/admin/BalanceManager";
import { ContestProvider } from "../components/ApiPlaygroundParts/ContestContext";
import { ContestsList } from "../components/ApiPlaygroundParts/ContestsList";
import { EndContest } from "../components/ApiPlaygroundParts/EndContest";
import { StartContest } from "../components/ApiPlaygroundParts/StartContest";
import { UserDetail } from "../components/ApiPlaygroundParts/UserDetail";

export const AdminDashboard: React.FC = () => {
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

        {/* Activity Monitor Section */}
        <div className="mb-6">
          <ActivityMonitor limit={5} />
        </div>

        {/* Balance Manager Section */}
        <div className="mb-8">
          <BalanceManager />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Management Card */}
          <div className="bg-dark-200 p-6 rounded-lg border border-dark-300">
            <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
              <span className="text-xl">👥</span>
              User Management
            </h2>
            <div className="space-y-4">
              <UserDetail />
            </div>
          </div>

          {/* Reports & Analytics Card */}
          <div className="bg-dark-200 p-6 rounded-lg border border-dark-300">
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
