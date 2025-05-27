import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUnifiedWebSocket } from "../../hooks/websocket/useUnifiedWebSocket";
import { DDExtendedMessageType } from "../../hooks/websocket/types";
import { useStore } from "../../store/useStore";
import CommandPalette from "../../components/admin/CommandPalette";
import VolumeBotToolsCenter from "../../components/admin/VolumeBotToolsCenter";

export interface AdminWallet {
  id: string;
  public_key: string;
  label: string;
  status: string;
  created_at: string;
  metadata: any;
  // Extended fields for UI
  balance_sol?: number;
  balance_usd?: number;
  token_count?: number;
  last_activity?: string;
  wallet_address?: string;
  name?: string;
}

interface WalletCardProps {
  wallet: AdminWallet;
  isSelected: boolean;
  onSelect: (id: string, isSelected: boolean) => void;
  onDoubleClick: (wallet: AdminWallet) => void;
}

const WalletCard: React.FC<WalletCardProps> = ({ wallet, isSelected, onSelect, onDoubleClick }) => {
  return (
    <motion.div
      className={`
        relative bg-dark-200/75 backdrop-blur-lg border-2 rounded-lg p-4 cursor-pointer
        transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1
        ${isSelected 
          ? 'border-brand-500/80 shadow-brand-500/30 bg-brand-900/20' 
          : 'border-gray-600/40 hover:border-brand-400/60'
        }
      `}
      onClick={() => onSelect(wallet.id, !isSelected)}
      onDoubleClick={() => onDoubleClick(wallet)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Selection indicator */}
      <div className={`
        absolute top-2 right-2 w-4 h-4 rounded-full border-2 
        ${isSelected 
          ? 'bg-brand-500 border-brand-400' 
          : 'border-gray-500 hover:border-brand-400'
        }
        transition-colors duration-200
      `}>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 bg-white rounded-full absolute top-0.5 left-0.5"
          />
        )}
      </div>

      {/* Status indicator */}
      <div className={`
        absolute top-2 left-2 w-3 h-3 rounded-full
        ${wallet.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}
      `} />

      {/* Wallet Info */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-mono text-sm text-gray-300 truncate">
            {wallet.label || `${wallet.public_key.slice(0, 6)}...${wallet.public_key.slice(-4)}`}
          </h3>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Address</span>
            <span className="text-brand-300 font-mono">{wallet.public_key.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">SOL</span>
            <span className="text-green-400 font-mono">
              {wallet.balance_sol !== undefined ? wallet.balance_sol.toFixed(4) : 'Loading...'}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Tokens</span>
            <span className="text-purple-400 font-mono">
              {wallet.token_count !== undefined ? wallet.token_count : '-'}
            </span>
          </div>
        </div>

        {/* Created date */}
        <div className="mt-2 text-xs text-gray-500 truncate">
          {new Date(wallet.created_at).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  );
};

const AdminWalletDashboard: React.FC = () => {
  const { user } = useStore();
  
  // State
  const [wallets, setWallets] = useState<AdminWallet[]>([]);
  const [selectedWallets, setSelectedWallets] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'balance' | 'activity' | 'tokens'>('balance');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isJumblerOpen, setIsJumblerOpen] = useState(false);
  const [isJumbling, setIsJumbling] = useState(false);
  const [jumbleProgress, setJumbleProgress] = useState<any>(null);
  const [isDispersing, setIsDispersing] = useState(false);
  const [disperseProgress, setDisperseProgress] = useState<any>(null);
  const [isJupiterSwapping, setIsJupiterSwapping] = useState(false);
  const [jupiterSwapProgress, setJupiterSwapProgress] = useState<any>(null);

  // WebSocket connection for admin wallet operations
  const { sendMessage, isConnected } = useUnifiedWebSocket(
    'admin-wallet-dashboard',
    [DDExtendedMessageType.DATA, DDExtendedMessageType.SYSTEM, DDExtendedMessageType.ERROR],
    (message) => {
      console.log('Admin wallet message received:', message);
      
      if (message.topic === 'admin') {
        switch (message.action) {
          case 'getAdminWallets':
            if (message.data?.wallets) {
              setWallets(message.data.wallets.map((wallet: AdminWallet) => ({
                ...wallet,
                wallet_address: wallet.public_key,
                name: wallet.label
              })));
              setIsLoading(false);
              // Start fetching balances for each wallet
              message.data.wallets.forEach((wallet: AdminWallet) => {
                fetchWalletBalance(wallet.id);
              });
            }
            break;
          
          case 'getWalletBalance':
            if (message.data?.walletId && message.data?.balance) {
              setWallets(prev => prev.map(wallet => 
                wallet.id === message.data.walletId 
                  ? { 
                      ...wallet, 
                      balance_sol: message.data.balance.sol,
                      token_count: message.data.balance.tokens?.length || 0
                    }
                  : wallet
              ));
            }
            break;
            
          case 'transferSOL':
          case 'transferToken':
          case 'batchTransferSOL':
          case 'batchTransferToken':
            if (message.data?.success) {
              // Refresh wallet balance after successful transfer
              if (message.data.walletId) {
                fetchWalletBalance(message.data.walletId);
              }
            }
            break;

          case 'jumbleWallets':
            if (message.data?.success) {
              console.log('Jumble completed successfully:', message.data);
              setIsJumbling(false);
              setJumbleProgress(null);
              // Refresh all wallet balances after jumbling
              wallets.forEach(wallet => fetchWalletBalance(wallet.id));
            } else if (message.data?.error) {
              console.error('Jumble failed:', message.data.error);
              setIsJumbling(false);
              setJumbleProgress(null);
            }
            break;

          case 'jumbleProgress':
            setJumbleProgress(message.data);
            if (message.data?.phase === 'complete') {
              setIsJumbling(false);
              // Refresh balances when complete
              setTimeout(() => {
                wallets.forEach(wallet => fetchWalletBalance(wallet.id));
              }, 1000);
            }
            break;

          case 'disperseWallets':
            if (message.data?.success) {
              console.log('Disperse completed successfully:', message.data);
              setIsDispersing(false);
              setDisperseProgress(null);
              // Refresh all wallet balances after dispersing
              wallets.forEach(wallet => fetchWalletBalance(wallet.id));
            } else if (message.data?.error) {
              console.error('Disperse failed:', message.data.error);
              setIsDispersing(false);
              setDisperseProgress(null);
            }
            break;

          case 'disperseProgress':
            setDisperseProgress(message.data);
            if (message.data?.phase === 'complete') {
              setIsDispersing(false);
              // Refresh balances when complete
              setTimeout(() => {
                wallets.forEach(wallet => fetchWalletBalance(wallet.id));
              }, 1000);
            }
            break;

          case 'jupiterSwap':
            if (message.data?.success) {
              console.log('Jupiter swap completed successfully:', message.data);
              setIsJupiterSwapping(false);
              setJupiterSwapProgress(null);
              // Refresh all wallet balances after swapping
              wallets.forEach(wallet => fetchWalletBalance(wallet.id));
            } else if (message.data?.error) {
              console.error('Jupiter swap failed:', message.data.error);
              setIsJupiterSwapping(false);
              setJupiterSwapProgress(null);
            }
            break;

          case 'jupiterSwapProgress':
            setJupiterSwapProgress(message.data);
            if (message.data?.phase === 'complete') {
              setIsJupiterSwapping(false);
              // Refresh balances when complete
              setTimeout(() => {
                wallets.forEach(wallet => fetchWalletBalance(wallet.id));
              }, 1000);
            }
            break;
        }
      }
    },
    ['admin']
  );
  
  // Selection drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [dragEnd, setDragEnd] = useState<{x: number, y: number} | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch admin wallets on component mount
  useEffect(() => {
    if (isConnected) {
      sendMessage({
        type: 'REQUEST',
        topic: 'admin',
        action: 'getAdminWallets',
        requestId: `get-wallets-${Date.now()}`
      });
    }
  }, [isConnected, sendMessage]);

  // Helper function to fetch wallet balance
  const fetchWalletBalance = useCallback((walletId: string) => {
    if (isConnected) {
      sendMessage({
        type: 'REQUEST',
        topic: 'admin',
        action: 'getWalletBalance',
        data: { walletId },
        requestId: `balance-${walletId}-${Date.now()}`
      });
    }
  }, [isConnected, sendMessage]);

  // Cmd+K keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Selection handlers
  const handleWalletSelect = useCallback((walletId: string, isSelected: boolean) => {
    setSelectedWallets(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(walletId);
      } else {
        newSet.delete(walletId);
      }
      return newSet;
    });
  }, []);

  // Filter and sort wallets
  const filteredWallets = wallets
    .filter(wallet => 
      wallet.public_key.toLowerCase().includes(searchFilter.toLowerCase()) ||
      wallet.label?.toLowerCase().includes(searchFilter.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'balance':
          return (b.balance_sol || 0) - (a.balance_sol || 0);
        case 'activity':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'tokens':
          return (b.token_count || 0) - (a.token_count || 0);
        default:
          return 0;
      }
    });

  const handleSelectAll = useCallback(() => {
    setSelectedWallets(new Set(filteredWallets.map(w => w.id)));
  }, [filteredWallets]);

  const handleDeselectAll = useCallback(() => {
    setSelectedWallets(new Set());
  }, []);

  // Command palette selection handler
  const handleCommandPaletteSelection = useCallback((walletIds: string[]) => {
    setSelectedWallets(new Set(walletIds));
  }, []);

  const handleWalletDoubleClick = useCallback((wallet: AdminWallet) => {
    // Open detailed wallet view or operations modal
    console.log('Double clicked wallet:', wallet);
  }, []);

  // Drag selection handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) return; // Don't start drag if modifier keys
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    });
    setDragEnd(null);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDragEnd({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEnd) {
      // Calculate selection rectangle and select wallets within it
      // This would need more complex implementation with element positions
      console.log('Drag selection completed');
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd]);

  // Jumble function
  const handleJumble = useCallback((walletIds: string[], rounds: number, minSol: number) => {
    if (!isConnected) return;
    
    setIsJumbling(true);
    setJumbleProgress({ phase: 'collecting_balances', status: 'Initializing jumble...' });
    
    sendMessage({
      type: 'REQUEST',
      topic: 'admin',
      action: 'jumbleWallets',
      data: {
        walletIds,
        jumbleRounds: rounds,
        minSolPerWallet: minSol
      },
      requestId: `jumble-${Date.now()}`
    });
  }, [isConnected, sendMessage]);

  // Disperse function
  const handleDisperse = useCallback((sourceWalletId: string, targetWalletIds: string[], amountPerWallet: number) => {
    if (!isConnected) return;
    
    setIsDispersing(true);
    setDisperseProgress({ phase: 'validating', status: 'Validating disperse operation...' });
    
    sendMessage({
      type: 'REQUEST',
      topic: 'admin',
      action: 'disperseWallets',
      data: {
        sourceWalletId,
        targetWalletIds,
        amountPerWallet
      },
      requestId: `disperse-${Date.now()}`
    });
  }, [isConnected, sendMessage]);

  // Jupiter Swap function
  const handleJupiterSwap = useCallback((walletIds: string[], inputMint: string, outputMint: string, amount: number, slippageBps: number) => {
    if (!isConnected) return;
    
    setIsJupiterSwapping(true);
    setJupiterSwapProgress({ phase: 'getting_quotes', status: 'Getting Jupiter quotes...' });
    
    sendMessage({
      type: 'REQUEST',
      topic: 'admin',
      action: 'jupiterSwap',
      data: {
        walletIds,
        inputMint,
        outputMint,
        amount,
        slippageBps
      },
      requestId: `jupiter-swap-${Date.now()}`
    });
  }, [isConnected, sendMessage]);

  // Bulk operations
  const handleBulkOperation = useCallback((operation: string) => {
    const selectedWalletData = wallets.filter(w => selectedWallets.has(w.id));
    console.log(`Performing ${operation} on`, selectedWalletData);
    
    switch (operation) {
      case 'consolidate':
        console.log('Consolidate operation would combine balances into a main wallet');
        break;
      case 'sweep':
        console.log('Sweep operation would collect dust tokens');
        break;
      case 'batch_send':
        console.log('Batch send operation would open a modal for multiple transfers');
        break;
      case 'jumble':
        setIsJumblerOpen(true);
        break;
    }
  }, [selectedWallets, wallets]);

  // Transfer operations (available for future modals/operations)
  const transferSOL = useCallback((walletId: string, toAddress: string, amount: number, description?: string) => {
    if (isConnected) {
      sendMessage({
        type: 'REQUEST',
        topic: 'admin',
        action: 'transferSOL',
        data: {
          walletId,
          toAddress,
          amount,
          description
        },
        requestId: `transfer-sol-${walletId}-${Date.now()}`
      });
    }
  }, [isConnected, sendMessage]);

  const transferToken = useCallback((walletId: string, toAddress: string, mint: string, amount: number, description?: string) => {
    if (isConnected) {
      sendMessage({
        type: 'REQUEST',
        topic: 'admin',
        action: 'transferToken',
        data: {
          walletId,
          toAddress,
          mint,
          amount,
          description
        },
        requestId: `transfer-token-${walletId}-${Date.now()}`
      });
    }
  }, [isConnected, sendMessage]);

  // Suppress unused variable warnings for transfer functions
  void transferSOL;
  void transferToken;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-gray-400 font-mono">Loading admin wallets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pb-32">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-cyber tracking-wider bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
            ADMIN WALLET DASHBOARD
          </h1>
          <p className="text-gray-400 mt-1 font-mono">
            CUSTODIAL_WALLET_MANAGEMENT_INTERFACE • {wallets.length} WALLETS
          </p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs font-mono text-gray-400">
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Search and filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search wallets by address or label..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-dark-200/50 border border-gray-600/40 rounded-lg px-4 py-2 text-gray-300 font-mono focus:border-brand-400 focus:outline-none"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-dark-200/50 border border-gray-600/40 rounded-lg px-4 py-2 text-gray-300 font-mono focus:border-brand-400 focus:outline-none"
          >
            <option value="balance">Sort by Balance</option>
            <option value="activity">Sort by Activity</option>
            <option value="tokens">Sort by Token Count</option>
          </select>
        </div>

        {/* Selection controls */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300 font-mono text-sm hover:bg-purple-500/30 transition-colors flex items-center gap-2"
          >
            <span>⌘</span> Command Palette <span className="text-xs opacity-70">(Cmd+K)</span>
          </button>

          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-brand-500/20 border border-brand-500/40 rounded-lg text-brand-300 font-mono text-sm hover:bg-brand-500/30 transition-colors"
          >
            Select All ({filteredWallets.length})
          </button>
          
          <button
            onClick={handleDeselectAll}
            className="px-4 py-2 bg-gray-500/20 border border-gray-500/40 rounded-lg text-gray-300 font-mono text-sm hover:bg-gray-500/30 transition-colors"
          >
            Deselect All
          </button>

          {selectedWallets.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkOperation('consolidate')}
                className="px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-lg text-green-300 font-mono text-sm hover:bg-green-500/30 transition-colors"
              >
                Consolidate ({selectedWallets.size})
              </button>
              
              <button
                onClick={() => handleBulkOperation('sweep')}
                className="px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300 font-mono text-sm hover:bg-purple-500/30 transition-colors"
              >
                Sweep Dust ({selectedWallets.size})
              </button>
              
              <button
                onClick={() => handleBulkOperation('batch_send')}
                className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-300 font-mono text-sm hover:bg-blue-500/30 transition-colors"
              >
                Batch Send ({selectedWallets.size})
              </button>

              <button
                onClick={() => handleBulkOperation('jumble')}
                className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-lg text-purple-300 font-mono text-sm hover:from-purple-500/30 hover:to-pink-500/30 transition-all flex items-center gap-1"
              >
                🚀 Volume Bot ({selectedWallets.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-dark-200/50 rounded-lg p-4 border border-gray-600/40">
          <div className="text-xs text-gray-400 mb-1">Total Wallets</div>
          <div className="text-xl font-mono text-brand-300">{wallets.length}</div>
        </div>
        
        <div className="bg-dark-200/50 rounded-lg p-4 border border-gray-600/40">
          <div className="text-xs text-gray-400 mb-1">Selected</div>
          <div className="text-xl font-mono text-purple-300">{selectedWallets.size}</div>
        </div>
        
        <div className="bg-dark-200/50 rounded-lg p-4 border border-gray-600/40">
          <div className="text-xs text-gray-400 mb-1">Total SOL</div>
          <div className="text-xl font-mono text-green-300">
            {wallets.reduce((sum, w) => sum + (w.balance_sol || 0), 0).toFixed(4)}
          </div>
        </div>
        
        <div className="bg-dark-200/50 rounded-lg p-4 border border-gray-600/40">
          <div className="text-xs text-gray-400 mb-1">Loaded Balances</div>
          <div className="text-xl font-mono text-yellow-300">
            {wallets.filter(w => w.balance_sol !== undefined).length}/{wallets.length}
          </div>
        </div>
      </div>

      {/* Wallet Grid */}
      <div
        ref={containerRef}
        className="relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Drag selection overlay */}
        {isDragging && dragStart && dragEnd && (
          <div
            className="absolute bg-brand-500/20 border-2 border-brand-500/60 pointer-events-none z-10"
            style={{
              left: Math.min(dragStart.x, dragEnd.x),
              top: Math.min(dragStart.y, dragEnd.y),
              width: Math.abs(dragEnd.x - dragStart.x),
              height: Math.abs(dragEnd.y - dragStart.y),
            }}
          />
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
          <AnimatePresence>
            {filteredWallets.map((wallet) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                isSelected={selectedWallets.has(wallet.id)}
                onSelect={handleWalletSelect}
                onDoubleClick={handleWalletDoubleClick}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Help text */}
      <div className="mt-8 text-center text-gray-500 font-mono text-sm">
        <p>Click to select • Ctrl+Click for multi-select • Cmd+K for commands • Double-click for operations</p>
        {!isConnected && (
          <p className="mt-2 text-red-400">⚠ WebSocket disconnected - wallet operations unavailable</p>
        )}
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        wallets={wallets}
        onSelectWallets={handleCommandPaletteSelection}
      />

      {/* Volume Bot Tools Center */}
      <VolumeBotToolsCenter
        isOpen={isJumblerOpen}
        onClose={() => setIsJumblerOpen(false)}
        selectedWallets={wallets.filter(w => selectedWallets.has(w.id))}
        onJumble={handleJumble}
        onDisperse={handleDisperse}
        onJupiterSwap={handleJupiterSwap}
        isConnected={isConnected}
        userRole={(user as any)?.is_superadmin ? 'superadmin' : 'admin'}
        jumbleProgress={jumbleProgress}
        disperseProgress={disperseProgress}
        jupiterSwapProgress={jupiterSwapProgress}
        isJumbling={isJumbling}
        isDispersing={isDispersing}
        isJupiterSwapping={isJupiterSwapping}
      />
    </div>
  );
};

export default AdminWalletDashboard;