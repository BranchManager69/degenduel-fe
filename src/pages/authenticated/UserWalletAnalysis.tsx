import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../../store/useStore';

interface User {
  user_id: number;
  wallet_address: string;
  nickname: string;
  username?: string;
  balance: number;
  balance_formatted: string;
  db_balance: number;
  rank: number;
  percentage: number;
  percentage_formatted: string;
  share_of_total: number;
  admin_label?: string;
}

interface WalletAnalysisData {
  tokens: any[];
  portfolio: {
    totalValue: number;
    totalRealizableValue: number;
    deploymentRatio: number;
  };
}

const UserWalletAnalysis: React.FC = () => {
  const { user } = useStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [analysisData, setAnalysisData] = useState<{[key: string]: WalletAnalysisData}>({});
  const [isAnalyzing, setIsAnalyzing] = useState<{[key: string]: boolean}>({});
  const [analysisError, setAnalysisError] = useState<{[key: string]: string}>({});
  const [editingLabel, setEditingLabel] = useState<{[key: string]: string}>({});
  const [savingLabel, setSavingLabel] = useState<{[key: string]: boolean}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterByLabel, setFilterByLabel] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Fetch all users with DUEL holdings
  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await axios.get('/api/duel-token-balances');
      
      if (response.data?.success && response.data?.data?.holders) {
        console.log('Users data:', response.data.data.holders.slice(0, 2)); // Debug first 2 users
        setUsers(response.data.data.holders);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.user_id === user.user_id);
      if (isSelected) {
        return prev.filter(u => u.user_id !== user.user_id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Analyze a specific user's wallet
  const analyzeUserWallet = async (user: User) => {
    const userId = user.user_id.toString();
    try {
      setIsAnalyzing(prev => ({ ...prev, [userId]: true }));
      setAnalysisError(prev => ({ ...prev, [userId]: '' }));
      
      const response = await axios.get(`/api/wallet-analysis/${user.wallet_address}`);
      
      if (response.data) {
        setAnalysisData(prev => ({ ...prev, [userId]: response.data }));
      }
    } catch (error: any) {
      console.error('Error analyzing wallet:', error);
      setAnalysisError(prev => ({ 
        ...prev, 
        [userId]: error?.response?.data?.message || 'Failed to analyze wallet' 
      }));
    } finally {
      setIsAnalyzing(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Analyze all selected users with throttling
  const analyzeSelectedUsers = () => {
    const usersToAnalyze = selectedUsers.filter(user => {
      const userId = user.user_id.toString();
      return !analysisData[userId] && !isAnalyzing[userId];
    });

    // Throttle requests - start one every 300ms
    usersToAnalyze.forEach((user, index) => {
      setTimeout(() => {
        analyzeUserWallet(user);
      }, index * 300);
    });
  };

  // Save user label
  const saveUserLabel = async (userId: number, label: string) => {
    const userIdStr = userId.toString();
    try {
      setSavingLabel(prev => ({ ...prev, [userIdStr]: true }));
      
      const response = await axios.put(`/api/admin/user-labels/${userId}`, { label });
      
      if (response.data?.success) {
        // Update the user in the list with new label
        setUsers(prev => prev.map(u => 
          u.user_id === userId ? { ...u, admin_label: label } : u
        ));
        // Clear editing state
        setEditingLabel(prev => {
          const newState = { ...prev };
          delete newState[userIdStr];
          return newState;
        });
      }
    } catch (error) {
      console.error('Error saving label:', error);
    } finally {
      setSavingLabel(prev => ({ ...prev, [userIdStr]: false }));
    }
  };

  // Delete user label
  const deleteUserLabel = async (userId: number) => {
    try {
      const response = await axios.delete(`/api/admin/user-labels/${userId}`);
      
      if (response.data?.success) {
        // Update the user in the list to remove label
        setUsers(prev => prev.map(u => 
          u.user_id === userId ? { ...u, admin_label: undefined } : u
        ));
      }
    } catch (error) {
      console.error('Error deleting label:', error);
    }
  };

  // Apply bulk labels to selected users
  const applyBulkLabel = async (label: string) => {
    if (!selectedUsers.length) return;
    
    try {
      const updates = selectedUsers.map(u => ({
        userId: u.user_id,
        label
      }));
      
      const response = await axios.post('/api/admin/user-labels/bulk', { updates });
      
      if (response.data?.success) {
        // Update all selected users with the new label
        const selectedIds = new Set(selectedUsers.map(u => u.user_id));
        setUsers(prev => prev.map(u => 
          selectedIds.has(u.user_id) ? { ...u, admin_label: label } : u
        ));
      }
    } catch (error) {
      console.error('Error applying bulk labels:', error);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    const matchesBasic = 
      user.wallet_address.toLowerCase().includes(term) ||
      user.nickname?.toLowerCase().includes(term) ||
      user.username?.toLowerCase().includes(term) ||
      user.admin_label?.toLowerCase().includes(term);
    
    if (filterByLabel) {
      return user.admin_label?.toLowerCase().includes(term);
    }
    
    return matchesBasic;
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Non-admin redirect message
  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Admin Access Required</h2>
          <p className="text-gray-400">This page is restricted to administrators only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">User Wallet Analysis</h1>
        <p className="text-gray-400">Click on users to select them, then analyze their wallets</p>
        
        {/* Search and Filter */}
        <div className="mt-4 flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by wallet, name, or label..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-dark-300 border border-gray-700 rounded text-white placeholder-gray-500 flex-1 max-w-md"
          />
          <label className="flex items-center gap-2 text-sm text-gray-400">
            <input
              type="checkbox"
              checked={filterByLabel}
              onChange={(e) => setFilterByLabel(e.target.checked)}
              className="rounded border-gray-600 bg-dark-300"
            />
            Labels only
          </label>
        </div>
        
        {selectedUsers.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-4">
              <span className="text-brand-400">{selectedUsers.length} user(s) selected</span>
              <button
                onClick={analyzeSelectedUsers}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded transition-colors"
              >
                Analyze Selected ({selectedUsers.length})
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
              >
                Clear Selection
              </button>
            </div>
            
            {/* Bulk Label Operations */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Apply label to selected users..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    applyBulkLabel(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="px-3 py-1.5 bg-dark-300 border border-gray-700 rounded text-sm text-white placeholder-gray-500"
              />
              <span className="text-xs text-gray-500">Press Enter to apply</span>
            </div>
          </div>
        )}
      </div>

      {/* Users Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">DUEL Holders</h2>
          
          {isLoadingUsers ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-brand-400 border-t-transparent mb-4"></div>
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3">
              {filteredUsers.map((user) => {
                if (!user.user_id) return null;
                const isSelected = selectedUsers.some(u => u.user_id === user.user_id);
                const userId = user.user_id.toString();
                const userIsAnalyzing = Boolean(isAnalyzing[userId]);
                
                return (
                  <div
                    key={user.user_id}
                    className={`p-1 rounded-lg border-2 transition-all cursor-pointer aspect-square flex flex-col justify-between relative ${
                      isSelected
                        ? 'bg-brand-500/20 border-brand-500 shadow-lg shadow-brand-500/20'
                        : 'bg-dark-300/30 border-gray-700 hover:bg-dark-300/50 hover:border-gray-600'
                    }`}
                    onClick={() => toggleUserSelection(user)}
                  >
                    {/* Rank badge - top left corner */}
                    <div className="absolute top-1 left-1 z-10">
                      <span className="text-[8px] px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded font-bold">
                        #{user.rank}
                      </span>
                    </div>

                    {/* Sync indicator - top right corner */}
                    {user.db_balance !== user.balance && (
                      <div className="absolute top-1 right-1 z-10">
                        <span className="text-[8px] px-1 py-0.5 bg-red-500/20 text-red-400 rounded">
                          SYNC
                        </span>
                      </div>
                    )}
                    
                    {/* Label indicator/editor */}
                    {(user.admin_label || editingLabel[userId]) && (
                      <div className="absolute top-6 left-1 right-1 z-10">
                        {editingLabel[userId] !== undefined ? (
                          <input
                            type="text"
                            value={editingLabel[userId]}
                            onChange={(e) => setEditingLabel(prev => ({ ...prev, [userId]: e.target.value }))}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') {
                                saveUserLabel(user.user_id, editingLabel[userId]);
                              } else if (e.key === 'Escape') {
                                setEditingLabel(prev => {
                                  const newState = { ...prev };
                                  delete newState[userId];
                                  return newState;
                                });
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-[8px] px-1 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded"
                            placeholder="Label..."
                            autoFocus
                          />
                        ) : (
                          <div
                            className="text-[8px] px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded cursor-pointer hover:bg-blue-500/30 truncate"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLabel(prev => ({ ...prev, [userId]: user.admin_label || '' }));
                            }}
                            title="Click to edit label"
                          >
                            {savingLabel[userId] ? '...' : user.admin_label}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 rounded-full flex items-center justify-center z-20">
                        <span className="text-white text-[8px]">✓</span>
                      </div>
                    )}
                    
                    {/* Loading indicator */}
                    {userIsAnalyzing && (
                      <div className="absolute inset-0 bg-dark-500/50 rounded-lg flex items-center justify-center z-30">
                        <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    
                    <div className="flex-1 min-h-0 overflow-hidden p-1 pt-4" style={{ paddingTop: user.admin_label || editingLabel[userId] ? '28px' : '16px' }}>
                      
                      {/* Name */}
                      <h3 className="text-[10px] font-medium text-white truncate mb-1">
                        {user.nickname || user.username || `User #${user.user_id}`}
                      </h3>
                      
                      {/* Username if different from nickname */}
                      {user.username && user.username !== user.nickname && (
                        <p className="text-[8px] text-gray-500 truncate mb-1">
                          @{user.username}
                        </p>
                      )}
                      
                      {/* Wallet */}
                      <div 
                        className="text-[8px] text-gray-400 font-mono truncate cursor-pointer hover:text-brand-400 mb-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(user.wallet_address);
                        }}
                        title={`Click to copy: ${user.wallet_address}`}
                      >
                        {user.wallet_address.slice(0, 4)}...{user.wallet_address.slice(-4)}
                      </div>
                      
                      {/* Balance info */}
                      <div className="text-center space-y-0.5">
                        <p className="text-[10px] text-white font-semibold">
                          {(user.balance * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[9px] text-gray-400">
                          {user.percentage_formatted}
                        </p>
                        {user.db_balance !== user.balance && (
                          <p className="text-[8px] text-red-400">
                            DB: {(user.db_balance * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Bottom actions */}
                    <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                      <a
                        href={`https://solscan.io/account/${user.wallet_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[8px] text-gray-500 hover:text-blue-400 transition-colors"
                        title="View on Solscan"
                      >
                        📊
                      </a>
                      {!user.admin_label && !editingLabel[userId] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLabel(prev => ({ ...prev, [userId]: '' }));
                          }}
                          className="text-[8px] text-gray-500 hover:text-brand-400 transition-colors"
                          title="Add label"
                        >
                          +
                        </button>
                      )}
                      {user.admin_label && !editingLabel[userId] && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Remove label?')) {
                              deleteUserLabel(user.user_id);
                            }
                          }}
                          className="text-[8px] text-gray-500 hover:text-red-400 transition-colors"
                          title="Remove label"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {selectedUsers.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Analysis Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedUsers.map((user) => {
                const userId = user.user_id.toString();
                const userAnalysis = analysisData[userId];
                const userIsAnalyzing = isAnalyzing[userId];
                const userError = analysisError[userId];
                
                return (
                  <div key={user.user_id} className="bg-dark-300/30 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {user.nickname || user.username || `User #${user.user_id}`}
                      </h3>
                      <button
                        onClick={() => setSelectedUsers(prev => prev.filter(u => u.user_id !== user.user_id))}
                        className="text-gray-400 hover:text-red-400 transition-colors text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    
                    {userIsAnalyzing ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand-400 border-t-transparent mb-2"></div>
                        <p className="text-gray-400 text-sm">Analyzing wallet...</p>
                      </div>
                    ) : userError ? (
                      <div className="text-center py-8">
                        <p className="text-red-400 text-xs mb-2">{userError}</p>
                        <button
                          onClick={() => analyzeUserWallet(user)}
                          className="px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white text-xs rounded transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    ) : userAnalysis ? (
                      <div>
                        {/* Portfolio Summary */}
                        <div className="mb-4 p-3 bg-dark-400/50 rounded-lg">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-gray-500">Total Value</p>
                              <p className="text-sm font-semibold text-white">
                                ${userAnalysis.portfolio.totalValue.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Deployed</p>
                              <p className="text-sm font-semibold text-white">
                                {userAnalysis.portfolio.deploymentRatio.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Token Holdings */}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userAnalysis.tokens.slice(0, 5).map((token, index) => (
                            <div key={index} className="p-2 bg-dark-400/30 rounded">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-xs font-medium text-white">{token.symbol}</p>
                                  <p className="text-[10px] text-gray-400 truncate">{token.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-white">${token.value.toFixed(0)}</p>
                                  <p className="text-[10px] text-gray-400">
                                    {token.balance < 1000000 
                                      ? token.balance.toFixed(0)
                                      : `${(token.balance / 1000000).toFixed(1)}M`
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {userAnalysis.tokens.length > 5 && (
                            <p className="text-xs text-gray-500 text-center">
                              +{userAnalysis.tokens.length - 5} more tokens
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <button
                          onClick={() => analyzeUserWallet(user)}
                          className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded transition-colors"
                        >
                          Analyze Wallet
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
};

export default UserWalletAnalysis;