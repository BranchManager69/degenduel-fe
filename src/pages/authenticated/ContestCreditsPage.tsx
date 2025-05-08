// src/pages/authenticated/ContestCreditsPage.tsx

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useWebSocket } from "../../contexts/UnifiedWebSocketContext";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { MessageType, SOCKET_TYPES } from "../../hooks/websocket";
import { useStore } from "../../store/useStore";

// Define the contest credit interface
interface ContestCredit {
  id: string;
  userId: string;
  credited_at: string;
  expires_at: string | null;
  used_at: string | null;
  used_for_contest_id: string | null;
  metadata: {
    source: string;
    purchase_id?: string;
    granted_by_admin_id?: string;
    price_paid?: string;
  };
}

// Define the credit statistics interface
interface CreditStats {
  total: number;
  used: number;
  unused: number;
  expiring_soon: number;
}

export const ContestCreditsPage: React.FC = () => {
  const storeUser = useStore(state => state.user);
  const { user: authUser, isAuthenticated } = useMigratedAuth();
  const user = authUser || storeUser;
  const ws = useWebSocket();
  
  const [credits, setCredits] = useState<ContestCredit[]>([]);
  const [creditStats, setCreditStats] = useState<CreditStats>({
    total: 0,
    used: 0,
    unused: 0,
    expiring_soon: 0,
  });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [creditRequirement, setCreditRequirement] = useState<{
    required: number;
    current: number;
  }>({ required: 1, current: 0 });

  // Load user credits on component mount
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // Setup WebSocket listener for credit updates
    const onCreditMessage = (message: any) => {
      if (message.type === 'credit_added' || message.type === 'credit_updated') {
        // Refresh credits
        fetchCredits();
      } else if (message.type === 'credit_expiring') {
        // Show warning without full refresh
        fetchCreditStats();
      }
    };
    
    // Register WebSocket listener for user topic (credits)
    const unregister = ws.registerListener(
      "contest-credits-page",
      [MessageType.DATA as any],
      onCreditMessage,
      [SOCKET_TYPES.NOTIFICATION]
    );
    
    // Initial data fetch
    fetchCredits();
    fetchCreditRequirement();
    
    return () => {
      unregister();
    };
  }, [isAuthenticated, user]);

  // Fetch user's contest credits
  const fetchCredits = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/contests/credits', {
        headers: {
          'Authorization': `Bearer ${user?.jwt || user?.wsToken || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch credits: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setCredits(data.data.credits || []);
        setCreditStats({
          total: data.data.total || 0,
          used: data.data.used || 0,
          unused: data.data.unused || 0,
          expiring_soon: data.data.expiring_soon || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch only credit stats (lighter operation)
  const fetchCreditStats = async () => {
    try {
      const response = await fetch('/api/contests/credits?stats_only=true', {
        headers: {
          'Authorization': `Bearer ${user?.jwt || user?.wsToken || ''}`
        }
      });
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setCreditStats({
          total: data.data.total || 0,
          used: data.data.used || 0,
          unused: data.data.unused || 0,
          expiring_soon: data.data.expiring_soon || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching credit stats:", error);
    }
  };

  // Fetch credit requirement
  const fetchCreditRequirement = async () => {
    try {
      const response = await fetch('/api/contests/check-credit-requirement', {
        headers: {
          'Authorization': `Bearer ${user?.jwt || user?.wsToken || ''}`
        }
      });
      
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setCreditRequirement({
          required: data.data.required || 1,
          current: data.data.current || 0
        });
      }
    } catch (error) {
      console.error("Error fetching credit requirement:", error);
    }
  };

  // Purchase a new credit
  const purchaseCredit = async () => {
    setPurchasing(true);
    setPurchaseError(null);
    
    try {
      const response = await fetch('/api/payments/contest-credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.jwt || user?.wsToken || ''}`
        },
        body: JSON.stringify({
          quantity: 1
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to purchase credit: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        // Refresh credit list
        fetchCredits();
      } else {
        throw new Error(data.message || "Failed to purchase credit");
      }
    } catch (error) {
      console.error("Error purchasing credit:", error);
      setPurchaseError(error instanceof Error ? error.message : "Failed to purchase credit");
    } finally {
      setPurchasing(false);
    }
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate days until expiration
  const getDaysUntilExpiration = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expireDate = new Date(expiresAt);
    const diffTime = expireDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

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

  // Main page content
  return (
    <div className="flex flex-col min-h-screen">
      {/* Content Section */}
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

        {/* Credit Status Card */}
        <Card className="bg-dark-200/50 backdrop-blur-lg border border-brand-500/30 p-6 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-brand-400/5"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-white mb-1">
                  Your Credit Balance
                </h2>
                
                <div className="flex items-center justify-center md:justify-start mb-4">
                  <div className="bg-brand-500/20 px-4 py-2 rounded-full flex items-center">
                    <span className="text-brand-400 font-bold text-2xl mr-2">
                      {creditStats.unused}
                    </span>
                    <span className="text-gray-400">
                      Available Credits
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="bg-dark-300/30 rounded-lg p-3">
                    <h3 className="text-gray-400 text-sm mb-1">Total Credits</h3>
                    <div className="text-white font-bold text-xl">{creditStats.total}</div>
                  </div>
                  
                  <div className="bg-dark-300/30 rounded-lg p-3">
                    <h3 className="text-gray-400 text-sm mb-1">Used Credits</h3>
                    <div className="text-white font-bold text-xl">{creditStats.used}</div>
                  </div>
                  
                  <div className="bg-dark-300/30 rounded-lg p-3">
                    <h3 className="text-gray-400 text-sm mb-1">Expiring Soon</h3>
                    <div className="text-white font-bold text-xl">{creditStats.expiring_soon}</div>
                  </div>
                </div>
                
                {creditRequirement.current < creditRequirement.required && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center">
                      <span className="text-yellow-400 mr-2">⚠️</span>
                      <span className="text-yellow-300">
                        You need {creditRequirement.required - creditRequirement.current} more credit(s) to create a contest.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center">
                <Button 
                  variant="primary" 
                  size="lg" 
                  onClick={purchaseCredit} 
                  disabled={purchasing}
                  className="min-w-[180px]"
                >
                  {purchasing ? "Processing..." : "Purchase Credit"}
                </Button>
                
                {purchaseError && (
                  <p className="text-red-400 text-sm mt-2">{purchaseError}</p>
                )}
                
                <Link to="/contests/browser">
                  <Button 
                    variant="secondary" 
                    size="md" 
                    className="mt-3"
                  >
                    Browse Contests
                  </Button>
                </Link>
                
                <Link to="/contests/create">
                  <Button 
                    variant="secondary" 
                    size="md" 
                    className="mt-3"
                    disabled={creditRequirement.current < creditRequirement.required}
                  >
                    Create Contest
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        {/* Credits List */}
        <Card className="bg-dark-200/50 backdrop-blur-lg border border-brand-500/20 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Your Credits</h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center p-4 rounded-lg bg-dark-300/30"
                >
                  <div className="w-12 h-12 rounded-full bg-dark-300 mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-dark-300 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-dark-300 rounded w-1/3"></div>
                  </div>
                  <div className="w-20 h-8 bg-dark-300 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {credits.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400">You don't have any credits yet.</p>
                  <Button 
                    variant="primary" 
                    size="md" 
                    onClick={purchaseCredit} 
                    className="mt-4"
                    disabled={purchasing}
                  >
                    Purchase Your First Credit
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {credits.map((credit) => {
                    const daysUntilExpiration = credit.expires_at 
                      ? getDaysUntilExpiration(credit.expires_at)
                      : null;
                    
                    const isExpiringSoon = daysUntilExpiration !== null && daysUntilExpiration <= 7;
                    const isUsed = !!credit.used_at;
                    
                    return (
                      <div
                        key={credit.id}
                        className={`flex flex-col md:flex-row md:items-center p-4 rounded-lg ${
                          isUsed 
                            ? "bg-dark-300/30 border border-gray-600/20" 
                            : isExpiringSoon
                              ? "bg-yellow-900/10 border border-yellow-500/20"
                              : "bg-dark-300/30 border border-brand-500/20"
                        } transition-colors`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className={`w-3 h-3 rounded-full mr-2 ${
                              isUsed 
                                ? "bg-gray-500" 
                                : isExpiringSoon
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}></div>
                            <span className="font-semibold text-white">
                              {isUsed 
                                ? "Used Credit" 
                                : isExpiringSoon
                                  ? "Expiring Soon" 
                                  : "Available Credit"
                              }
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-400 space-y-1 ml-5">
                            <p>
                              <span className="text-gray-500 mr-2">Acquired:</span>
                              {formatDate(credit.credited_at)}
                            </p>
                            
                            {credit.expires_at && (
                              <p>
                                <span className="text-gray-500 mr-2">Expires:</span>
                                {formatDate(credit.expires_at)}
                                {isExpiringSoon && !isUsed && (
                                  <span className="text-yellow-400 ml-2">
                                    ({daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''} left)
                                  </span>
                                )}
                              </p>
                            )}
                            
                            {isUsed && credit.used_at && (
                              <p>
                                <span className="text-gray-500 mr-2">Used:</span>
                                {formatDate(credit.used_at)}
                              </p>
                            )}
                            
                            {isUsed && credit.used_for_contest_id && (
                              <p>
                                <span className="text-gray-500 mr-2">Contest:</span>
                                <Link 
                                  to={`/contests/detail/${credit.used_for_contest_id}`}
                                  className="text-brand-400 hover:text-brand-300"
                                >
                                  View Contest
                                </Link>
                              </p>
                            )}
                            
                            <p>
                              <span className="text-gray-500 mr-2">Source:</span>
                              {credit.metadata.source === 'purchase' ? 'Purchased' :
                               credit.metadata.source === 'admin_grant' ? 'Granted by Admin' :
                               credit.metadata.source === 'system' ? 'System Reward' :
                               credit.metadata.source}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0 md:ml-4 flex justify-end">
                          {!isUsed && (
                            <Link to="/contests/create">
                              <Button
                                variant="primary"
                                size="sm"
                              >
                                Use Credit
                              </Button>
                            </Link>
                          )}
                          
                          {isUsed && credit.used_for_contest_id && (
                            <Link to={`/contests/detail/${credit.used_for_contest_id}`}>
                              <Button
                                variant="secondary"
                                size="sm"
                              >
                                View Contest
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </Card>

        {/* FAQ Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-brand-500/20">
              <h3 className="text-lg font-semibold text-white mb-2">What are Contest Credits?</h3>
              <p className="text-gray-400">Contest Credits allow you to create your own custom contests that are available to all DegenDuel users. Each contest creation requires one credit.</p>
            </div>
            
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-brand-500/20">
              <h3 className="text-lg font-semibold text-white mb-2">How do I get more credits?</h3>
              <p className="text-gray-400">You can purchase credits directly from this page. Credits may also be granted for special events, achievements, or promotions.</p>
            </div>
            
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-brand-500/20">
              <h3 className="text-lg font-semibold text-white mb-2">Do credits expire?</h3>
              <p className="text-gray-400">Yes, credits typically expire 90 days after acquisition if not used. Credits marked as "Expiring Soon" have 7 days or less remaining.</p>
            </div>
            
            <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg p-4 border border-brand-500/20">
              <h3 className="text-lg font-semibold text-white mb-2">What happens when I create a contest?</h3>
              <p className="text-gray-400">When you create a contest, you'll use one credit. Your contest will then be available in the public contest browser for other users to join.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};