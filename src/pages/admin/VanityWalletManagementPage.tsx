import { Eye, Settings, Shield } from "lucide-react";
import React, { useState } from "react";
import { VanityWalletBatchCreate } from "../../components/admin/VanityWalletBatchCreate";
import { VanityWalletCreate } from "../../components/admin/VanityWalletCreate";
import { VanityWalletDashboard } from "../../components/admin/VanityWalletDashboard";
import { VanityWalletList } from "../../components/admin/VanityWalletManagement";
import { VanityWalletPool } from "../../components/admin/VanityWalletPool";
import { VanityWalletSummary } from "../../components/admin/VanityWalletSummary";
import { authService } from "../../services/AuthService";
import { useStore } from "../../store/useStore";

enum CreateMode {
  SINGLE = "single",
  BATCH = "batch",
}

const VanityWalletManagementPage: React.FC = () => {
  const { user } = useStore();
  const [createMode, setCreateMode] = useState<CreateMode>(CreateMode.SINGLE);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check user permissions
  const isAdmin = authService.hasRole('admin');
  const isSuperAdmin = authService.hasRole('superadmin');

  const handleCreateSuccess = () => {
    // Trigger a refresh of the list and summary when a new wallet is created
    setRefreshTrigger(prev => prev + 1);
  };

  // If user doesn't have at least admin access, show access denied
  if (!isAdmin) {
    return (
      <div className="p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-400 mb-6">
              This page requires admin-level access to the vanity wallet management system.
            </p>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="text-sm text-gray-400">
                <div>Your role: <span className="text-gray-300">{user?.role || 'Unknown'}</span></div>
                <div>Required: <span className="text-red-400">admin</span> or <span className="text-red-400">superadmin</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-100">Vanity Wallet Management</h1>
          <div className="flex items-center gap-2">
            {isSuperAdmin ? (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Super Admin Access
              </span>
            ) : (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Admin Access (Read-Only)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Access Level Information */}
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Access Level Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="text-gray-400 mb-2">Available to you (Admin):</h4>
            <ul className="space-y-1 text-gray-500">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                View dashboard and analytics
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                List and monitor vanity wallets
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Generator status monitoring
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Pool statistics and alerts
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-gray-400 mb-2">Super Admin Only:</h4>
            <ul className="space-y-1 text-gray-500">
              <li className="flex items-center gap-2">
                <span className={`w-2 h-2 ${isSuperAdmin ? 'bg-green-400' : 'bg-red-400'} rounded-full`}></span>
                Create vanity wallet requests
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-2 h-2 ${isSuperAdmin ? 'bg-green-400' : 'bg-red-400'} rounded-full`}></span>
                Cancel running jobs
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-2 h-2 ${isSuperAdmin ? 'bg-green-400' : 'bg-red-400'} rounded-full`}></span>
                Batch wallet creation
              </li>
              <li className="flex items-center gap-2">
                <span className={`w-2 h-2 ${isSuperAdmin ? 'bg-green-400' : 'bg-red-400'} rounded-full`}></span>
                System health controls
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Real-time Dashboard - Available to all admins */}
      <div className="mb-8">
        <VanityWalletDashboard />
      </div>
      
      {/* Summary and Pool Statistics - Available to all admins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Summary Panel */}
        <VanityWalletSummary key={`summary-${refreshTrigger}`} />
        
        {/* Pool Panel */}
        <VanityWalletPool key={`pool-${refreshTrigger}`} autoRefresh={false} />
      </div>
      
      {/* Creation Controls - Super Admin Only */}
      {isSuperAdmin ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-medium text-gray-100">Vanity Wallet Creation</h2>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
              Super Admin Access ✓
            </span>
          </div>
          
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
      ) : (
        <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-medium text-gray-100">Vanity Wallet Creation</h2>
            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
              Super Admin Only
            </span>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-yellow-400" />
              <h4 className="text-sm font-medium text-yellow-400">Restricted Feature</h4>
            </div>
            <p className="text-sm text-gray-400 mb-2">
              Creating and managing vanity wallets requires Super Admin permissions.
            </p>
            <p className="text-xs text-gray-500">
              Contact your system administrator if you need access to wallet creation features.
            </p>
          </div>
        </div>
      )}
      
      {/* Wallets List - Available to all admins */}
      <VanityWalletList key={`list-${refreshTrigger}`} />
    </div>
  );
};

export default VanityWalletManagementPage;