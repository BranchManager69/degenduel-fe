import React from "react";
import { WalletTraderDashboard } from "../../components/admin/WalletTraderDashboard";

export const WalletManagementPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-cyber tracking-wider bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
            WALLET MANAGEMENT DASHBOARD
          </h1>
          <p className="text-gray-400 mt-1 font-mono">
            ADMIN_WALLET_TRADE_INTERFACE
          </p>
        </div>
      </div>
      <WalletTraderDashboard />
    </div>
  );
};

export default WalletManagementPage;