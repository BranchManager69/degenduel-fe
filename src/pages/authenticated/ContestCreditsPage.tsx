import { motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { CreditBalance, CreditPurchase, CreditHistory } from "../../components/contest-credits";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useNotifications } from "../../hooks/websocket/topic-hooks/useNotifications";
import { useStore } from "../../store/useStore";

// Define the credit configuration interface
interface CreditConfig {
  tokens_per_credit: number;
  token_symbol: string;
  token_address?: string;
  purchase_enabled: boolean;
  burn_service_available: boolean;
}

export const ContestCreditsPage: React.FC = () => {
  const storeUser = useStore(state => state.user);
  const { user: authUser, isAuthenticated } = useMigratedAuth();
  const user = authUser || storeUser;
  const { notifications } = useNotifications();
  
  const [config, setConfig] = useState<CreditConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch credit configuration
  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/contests/credits/config');
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error("Error fetching credit config:", error);
      // Set default config for fallback
      setConfig({
        tokens_per_credit: 69420,
        token_symbol: 'DUEL',
        purchase_enabled: false,
        burn_service_available: false
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Listen for credit-related notifications
  useEffect(() => {
    if (!isAuthenticated || !user || !notifications) {
      return;
    }

    // Check for new credit-related notifications and refresh config
    const creditNotifications = notifications.filter(notification => 
      notification.type === 'credit_added' || 
      notification.type === 'credit_updated' ||
      notification.type === 'contest_credit'
    );
    
    if (creditNotifications.length > 0) {
      // Refresh config when credit notifications are received
      fetchConfig();
    }
  }, [notifications, isAuthenticated, user, fetchConfig]);

  // If not authenticated, show login prompt
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative z-10 flex h-[50vh] items-center justify-center"
        >
          <div className="text-center relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
            <h2 className="text-xl font-semibold text-gray-200 group-hover:animate-glitch">
              Connect Your Wallet
            </h2>
            <p className="mt-2 text-gray-400 group-hover:animate-cyber-pulse">
              Connect your wallet to view your contest credits
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Contest Credits</h1>
            <p className="text-gray-400">Loading credit system...</p>
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-800 rounded-lg p-6 h-32" />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col min-h-screen">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative z-10 flex h-[50vh] items-center justify-center"
        >
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-400 mb-2">
              Failed to Load Credit System
            </h2>
            <p className="text-gray-400 mb-4">
              Unable to connect to the credit system. Please try again later.
            </p>
            <Button onClick={fetchConfig}>
              Retry
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main page content
  return (
    <div className="flex flex-col min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Contest Credits
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Credits allow you to create your own custom contests that are available to the public.
            Each contest creation requires one credit.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Credit Balance Section */}
          <CreditBalance user={user} config={config} />

          {/* Purchase Section - Only show if token is live */}
          <CreditPurchase 
            user={user} 
            config={config} 
            onPurchaseComplete={fetchConfig} 
          />
        </div>

        {/* History Section */}
        <CreditHistory user={user} />

        {/* Navigation Links */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link to="/contests">
            <Button variant="secondary" size="md">
              Browse Contests
            </Button>
          </Link>
          <Link to="/contests/create">
            <Button variant="primary" size="md">
              Create Contest
            </Button>
          </Link>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3">What are Contest Credits?</h3>
              <p className="text-gray-400">Contest Credits allow you to create your own custom contests that are available to all DegenDuel users. Each contest creation requires one credit.</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3">How do I get more credits?</h3>
              <p className="text-gray-400">You can purchase credits by burning {config.tokens_per_credit.toLocaleString()} {config.token_symbol} tokens. Credits may also be granted for special events or achievements.</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3">Do credits expire?</h3>
              <p className="text-gray-400">Yes, credits typically expire 90 days after acquisition if not used. Credits marked as "Expiring Soon" have 7 days or less remaining.</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3">What happens when I create a contest?</h3>
              <p className="text-gray-400">When you create a contest, you'll use one credit. Your contest will then be available in the public contest browser for other users to join.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};