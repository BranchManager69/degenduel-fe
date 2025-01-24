// src/pages/AdminDashboard.tsx
import React from "react";

export const AdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Admin Dashboard</h1>
        <p className="text-gray-400">Manage contests and user data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Contest Management Card */}
        <div className="bg-dark-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-primary mb-2">
            Contest Management
          </h2>
          <p className="text-gray-400">
            View and manage active contests, participants, and results.
          </p>
        </div>

        {/* User Management Card */}
        <div className="bg-dark-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-primary mb-2">
            User Management
          </h2>
          <p className="text-gray-400">
            Monitor user activity and manage user accounts.
          </p>
        </div>

        {/* Analytics Card */}
        <div className="bg-dark-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-primary mb-2">Analytics</h2>
          <p className="text-gray-400">
            View platform statistics and performance metrics.
          </p>
        </div>
      </div>
    </div>
  );
};
