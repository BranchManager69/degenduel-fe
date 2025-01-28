import React from "react";
import { Link } from "react-router-dom";
import { ActivityMonitor } from "../components/admin/ActivityMonitor";
import { BalanceManager } from "../components/admin/BalanceManager";
import { LogViewer } from "../components/admin/LogViewer";

export const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-4">
          Superadmin Dashboard
        </h1>
        <p className="text-gray-400">
          You are God of all things DegenDuel. Use these tools wisely or suffer
          the consequences.
        </p>
      </div>

      {/* System Logs Section */}
      <div className="mb-8 bg-dark-200 border border-dark-300 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span>
          DegenDuel Logs
        </h2>
        <div className="bg-dark-300/30 rounded-lg">
          <LogViewer />
        </div>
      </div>

      {/* Activity Monitor Section */}
      <div className="mb-6">
        <ActivityMonitor limit={5} />
      </div>

      {/* Balance Manager Section */}
      <div className="mb-8">
        <BalanceManager />
      </div>

      {/* Tools Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AMM Simulator Card */}
        <Link
          to="/amm-sim"
          className="bg-dark-200 p-6 rounded-lg hover:bg-dark-300/70 transition-colors border border-dark-300"
        >
          <h2 className="text-xl font-semibold text-gray-100 mb-2">
            AMM Simulator
          </h2>
          <p className="text-gray-400">
            Simulate DUEL-SOL AMM behavior with advanced parameters.
          </p>
        </Link>

        {/* API Playground Card */}
        <Link
          to="/api-playground"
          className="bg-dark-200 p-6 rounded-lg hover:bg-dark-300/70 transition-colors border border-dark-300"
        >
          <h2 className="text-xl font-semibold text-gray-100 mb-2">
            API Playground
          </h2>
          <p className="text-gray-400">
            Manually call API endpoints willy nilly.
          </p>
        </Link>

        {/* Test Environment Card */}
        <Link
          to="/test"
          className="bg-dark-200 p-6 rounded-lg hover:bg-dark-300/70 transition-colors border border-dark-300"
        >
          <h2 className="text-xl font-semibold text-gray-100 mb-2">
            Test Blank Page
          </h2>
          <p className="text-gray-400">Blank page for some future thingy.</p>
        </Link>
      </div>
    </div>
  );
};
