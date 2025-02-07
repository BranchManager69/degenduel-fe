// src/pages/superadmin/SuperAdminDashboard.tsx

import React, { useState } from "react";
import { BalanceManager } from "../../components/admin/BalanceManager";
import { FaucetManager } from "../../components/admin/FaucetManager";
import { LogViewer } from "../../components/admin/LogViewer";
import { SpyPanel } from "../../components/admin/SpyPanel";
import { VanityPool } from "../../components/admin/VanityPool";
import { WalletManagement } from "../../components/admin/WalletManagement";

type TabType =
  | "system"
  | "spy"
  | "faucet-mgr"
  | "wallet-gen"
  | "vanity"
  | "reseed";

export const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("system");

  return (
    <div className="min-h-screen bg-dark-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-dark-300">
            <nav className="-mb-px flex">
              {/* Tabs */}
              {[
                { key: "system", label: "Sys. Logs" },
                { key: "spy", label: "User Spy" },
                { key: "faucet-mgr", label: "Faucet Mgr." },
                { key: "wallet-gen", label: "Wallet Gen." },
                { key: "vanity", label: "Vanity Pool" },
                { key: "reseed", label: "Reseed DB" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as TabType)}
                  className={`${
                    activeTab === key
                      ? "border-brand-500 text-brand-400"
                      : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm focus:outline-none transition-colors duration-200`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "spy" ? (
              <SpyPanel />
            ) : activeTab === "system" ? (
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
            ) : activeTab === "vanity" ? (
              <VanityPool />
            ) : activeTab === "wallet-gen" ? (
              <WalletManagement />
            ) : activeTab === "faucet-mgr" ? (
              <FaucetManager />
            ) : activeTab === "reseed" ? (
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-100 mb-4">
                  Database Reseed
                </h2>
                <p className="text-gray-400">
                  Database reseed interface coming soon...
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
