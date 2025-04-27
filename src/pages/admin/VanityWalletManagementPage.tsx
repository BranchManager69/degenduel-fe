import React, { useState } from "react";
import { VanityWalletList } from "../../components/admin/VanityWalletManagement";
import { VanityWalletCreate } from "../../components/admin/VanityWalletCreate";
import { VanityWalletBatchCreate } from "../../components/admin/VanityWalletBatchCreate";
import { VanityWalletSummary } from "../../components/admin/VanityWalletSummary";
import { VanityWalletPool } from "../../components/admin/VanityWalletPool";
import { VanityWalletDashboard } from "../../components/admin/VanityWalletDashboard";

enum CreateMode {
  SINGLE = "single",
  BATCH = "batch",
}

const VanityWalletManagementPage: React.FC = () => {
  const [createMode, setCreateMode] = useState<CreateMode>(CreateMode.SINGLE);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateSuccess = () => {
    // Trigger a refresh of the list and summary when a new wallet is created
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-2xl font-bold text-gray-100 mb-4 md:mb-0">Vanity Wallet Management</h1>
      </div>
      
      {/* Real-time Dashboard - WebSocket Based */}
      <div className="mb-8">
        <VanityWalletDashboard />
      </div>
      
      {/* Summary and Pool Statistics - API Based */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Summary Panel */}
        <VanityWalletSummary key={`summary-${refreshTrigger}`} />
        
        {/* Pool Panel */}
        <VanityWalletPool key={`pool-${refreshTrigger}`} autoRefresh={false} />
      </div>
      
      {/* Creation Controls */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-dark-300 pb-2">
          <button
            onClick={() => setCreateMode(CreateMode.SINGLE)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              createMode === CreateMode.SINGLE
                ? "bg-brand-500 text-white"
                : "bg-dark-400 text-gray-300 hover:bg-dark-500"
            }`}
          >
            Single Creation
          </button>
          <button
            onClick={() => setCreateMode(CreateMode.BATCH)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              createMode === CreateMode.BATCH
                ? "bg-brand-500 text-white"
                : "bg-dark-400 text-gray-300 hover:bg-dark-500"
            }`}
          >
            Batch Creation
          </button>
        </div>
        
        {createMode === CreateMode.SINGLE ? (
          <VanityWalletCreate onSuccess={handleCreateSuccess} />
        ) : (
          <VanityWalletBatchCreate onSuccess={handleCreateSuccess} />
        )}
      </div>
      
      {/* Wallets List */}
      <VanityWalletList key={`list-${refreshTrigger}`} />
    </div>
  );
};

export default VanityWalletManagementPage;