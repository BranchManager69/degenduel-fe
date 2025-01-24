import React from "react";
import { Link } from "react-router-dom";

export const SuperAdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          SuperAdmin Dashboard
        </h1>
        <p className="text-gray-400">
          Manage system-wide settings and access advanced tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* AMM Simulator Card */}
        <Link
          to="/amm-sim"
          className="bg-dark-800 p-6 rounded-lg hover:bg-dark-700 transition-colors"
        >
          <h2 className="text-xl font-semibold text-primary mb-2">
            AMM Simulator
          </h2>
          <p className="text-gray-400">
            Test and simulate AMM behavior with various parameters.
          </p>
        </Link>

        {/* API Playground Card */}
        <Link
          to="/api-playground"
          className="bg-dark-800 p-6 rounded-lg hover:bg-dark-700 transition-colors"
        >
          <h2 className="text-xl font-semibold text-primary mb-2">
            API Playground
          </h2>
          <p className="text-gray-400">
            Test API endpoints and manage system integrations.
          </p>
        </Link>

        {/* Test Environment Card */}
        <Link
          to="/test"
          className="bg-dark-800 p-6 rounded-lg hover:bg-dark-700 transition-colors"
        >
          <h2 className="text-xl font-semibold text-primary mb-2">
            Test Environment
          </h2>
          <p className="text-gray-400">
            Access the testing environment for development.
          </p>
        </Link>
      </div>
    </div>
  );
};
