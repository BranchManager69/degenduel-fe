import React from "react";
import { WalletMonitoringDashboard } from "../../components/admin/WalletMonitoringDashboard";

// Layout
export const WalletMonitoring: React.FC = () => {
  return (
    <div className="p-6">
      <WalletMonitoringDashboard />
    </div>
  );
};

export default WalletMonitoring;