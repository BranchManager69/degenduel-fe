import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, MousePointer2, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import type { WalletWithHistory, Transaction, TransactionMode } from './wallet-management/types';
import { WalletCard } from './wallet-management/WalletCard';
import { WealthDistribution } from './wallet-management/WealthDistribution';
import { TransactionPanel } from './wallet-management/TransactionPanel';
import { TimeSeriesChart } from './wallet-management/TimeSeriesChart';
import { useTimeSeriesData } from './wallet-management/hooks/useTimeSeriesData';
import { 
  TOKEN_TICKER, 
  calculateTokenValue, 
  TOKEN_PRICE, 
  calculateSolCost, 
  SOL_TO_USD, 
  formatUsd, 
  calculateMarketCap, 
  formatSol, 
  TOTAL_SUPPLY 
} from './wallet-management/config';
import { sleep, distributeAmount } from './wallet-management/utils';

// Mock data - replace with real wallet API data later
const initialWallets: WalletWithHistory[] = [
  {
    id: '1',
    name: 'Main Treasury',
    address: '0x1234...5678',
    tokenBalance: '1000.00',
    solBalance: '5.5',
    tokenValue: '3.2',
    selected: false
  },
  {
    id: '2',
    name: 'Trading Wallet',
    address: '0x8765...4321',
    tokenBalance: '500.00',
    solBalance: '2.8',
    tokenValue: '1.6',
    selected: false
  },
  {
    id: '3',
    name: 'Contest Pool',
    address: '0xabcd...ef01',
    tokenBalance: '750.00',
    solBalance: '3.9',
    tokenValue: '2.4',
    selected: false
  }
];

export function WalletTraderDashboard() {
  const [wallets, setWallets] = useState<WalletWithHistory[]>(initialWallets);
  const [masterLog, setMasterLog] = useState<Transaction[]>([]);
  const timeSeriesData = useTimeSeriesData(wallets);
  const [isDragging, setIsDragging] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const selectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const walletsRef = useRef(new Map<string, DOMRect>());

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
      if (selectionRef.current) {
        selectionRef.current.style.width = '0';
        selectionRef.current.style.height = '0';
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleRename = (id: string, newName: string) => {
    setWallets(wallets.map(wallet => 
      wallet.id === id ? { ...wallet, name: newName } : wallet
    ));
  };

  const handleToggleSelect = (id: string) => {
    setWallets(wallets.map(wallet =>
      wallet.id === id ? { ...wallet, selected: !wallet.selected } : wallet
    ));
  };

  const handleTransaction = async (type: Transaction['type'], amount: string, mode: TransactionMode = 'equal') => {
    const selectedWallets = wallets.filter(w => w.selected);
    if (selectedWallets.length === 0) return;
    
    const distributions = distributeAmount(
      amount,
      selectedWallets.map(w => w.id),
      mode,
      wallets
    );
    
    // Create transaction objects for each wallet
    const transactions = distributions.map(dist => {
      const wallet = selectedWallets.find(w => w.id === dist.walletId)!;
      return {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type,
        amount: dist.amount,
        walletName: wallet.name,
        status: 'pending' as const,
        timestamp: Date.now()
      };
    });

    // Add to master log
    setMasterLog(prev => [...prev, ...transactions]);
    
    // Set all selected wallets to pending
    setWallets(prev => prev.map(wallet => {
      if (!wallet.selected) return wallet;
      const walletTx = transactions.find(tx => tx.walletName === wallet.name);
      return {
        ...wallet,
        transactionStatus: 'pending' as const,
        transactions: [...(wallet.transactions || []), walletTx!]
      };
    }));

    // Process each wallet's transaction
    for (const wallet of selectedWallets) {
      const transaction = transactions.find(tx => tx.walletName === wallet.name)!;
      try {
        // Simulate transaction confirmation time
        await sleep(Math.random() * 2000 + 1000);
        
        // Simulate 80% success rate
        const success = Math.random() > 0.2;
        
        if (success) {
          // Update wallet with new balance and confirmed status
          setWallets(prev => prev.map(w => {
            if (w.id !== wallet.id) return w;
            
            const tokenBalance = type === 'BUY' 
              ? (parseFloat(w.tokenBalance) + parseFloat(transaction.amount)).toString()
              : (parseFloat(w.tokenBalance) - parseFloat(transaction.amount)).toString();

            // Calculate SOL balance change
            const solCost = calculateSolCost(transaction.amount);
            const solBalance = type === 'BUY'
              ? (parseFloat(w.solBalance) - parseFloat(solCost)).toString()
              : (parseFloat(w.solBalance) + parseFloat(solCost)).toString();
            
            // Calculate new token value based on updated balance
            const tokenValue = calculateTokenValue(tokenBalance);
            
            const updatedTransactions = w.transactions?.map(tx =>
              tx.id === transaction.id ? { ...tx, status: 'confirmed' as const } : tx
            );

            return {
              ...w,
              tokenBalance,
              solBalance,
              tokenValue,
              transactionStatus: 'confirmed' as const,
              selected: false,
              transactions: updatedTransactions
            };
          }));
          
          // Update master log
          setMasterLog(prev => prev.map(tx =>
            tx.id === transaction.id ? { ...tx, status: 'confirmed' as const } : tx
          ));
        } else {
          // Mark as failed
          setWallets(prev => prev.map(w => {
            if (w.id !== wallet.id) return w;
            const updatedTransactions = w.transactions?.map(tx =>
              tx.id === transaction.id ? { ...tx, status: 'failed' as const } : tx
            );
            return {
              ...w,
              transactionStatus: 'failed' as const,
              selected: false,
              transactions: updatedTransactions
            };
          }));
          
          // Update master log
          setMasterLog(prev => prev.map(tx =>
            tx.id === transaction.id ? { ...tx, status: 'failed' as const } : tx
          ));
        }
      } catch (error) {
        // Handle any errors
        setWallets(prev => prev.map(w => {
          if (w.id !== wallet.id) return w;
          const updatedTransactions = w.transactions?.map(tx =>
            tx.id === transaction.id ? { ...tx, status: 'failed' as const } : tx
          );
          return {
            ...w,
            transactionStatus: 'failed' as const,
            selected: false,
            transactions: updatedTransactions
          };
        }));
        
        // Update master log
        setMasterLog(prev => prev.map(tx =>
          tx.id === transaction.id ? { ...tx, status: 'failed' as const } : tx
        ));
      }
    }
    
    // Clear transaction status after 3 seconds
    await sleep(3000);
    setWallets(prev => prev.map(wallet => {
      const { transactionStatus, ...rest } = wallet;
      return rest;
    }));
  };

  const handleAddWallet = () => {
    const newWallet: WalletWithHistory = {
      id: `wallet-${Date.now()}`,
      name: `Wallet ${wallets.length + 1}`,
      address: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 10)}`,
      tokenBalance: '0.00',
      solBalance: '0.00',
      tokenValue: '0.00',
      selected: false,
      transactions: []
    };
    setWallets([...wallets, newWallet]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMultiSelectMode) return;
    if (e.button !== 0) return; // Left click only
    
    const container = containerRef.current?.getBoundingClientRect();
    if (!container) return;
    
    setIsDragging(true);
    // Clear all selections when starting a new drag
    setWallets(wallets.map(wallet => ({ ...wallet, selected: false })));
    
    setDragStart({
      x: e.clientX - container.left,
      y: e.clientY - container.top
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStart || !selectionRef.current || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - container.left;
    const currentY = e.clientY - container.top;

    const left = Math.min(dragStart.x, currentX);
    const top = Math.min(dragStart.y, currentY);
    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);

    selectionRef.current.style.left = `${left}px`;
    selectionRef.current.style.top = `${top}px`;
    selectionRef.current.style.width = `${width}px`;
    selectionRef.current.style.height = `${height}px`;

    // Check for intersections
    const selection = {
      left,
      right: left + width,
      top,
      bottom: top + height
    };

    walletsRef.current.forEach((rect, id) => {
      const walletBox = {
        left: rect.left - container.left,
        right: rect.right - container.left,
        top: rect.top - container.top,
        bottom: rect.bottom - container.top
      };

      const intersects = !(
        selection.left > walletBox.right ||
        selection.right < walletBox.left ||
        selection.top > walletBox.bottom ||
        selection.bottom < walletBox.top
      );

      setWallets(prev => 
        prev.map(wallet => 
          wallet.id === id ? { ...wallet, selected: intersects } : wallet
        )
      );
    });
  }, [isDragging, dragStart, setWallets]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove as any);
      return () => window.removeEventListener('mousemove', handleMouseMove as any);
    }
  }, [isDragging, handleMouseMove]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    if (selectionRef.current) {
      selectionRef.current.style.width = '0';
      selectionRef.current.style.height = '0';
    }
  };

  const selectedWallets = wallets.filter(w => w.selected);
  const [showTransactionPanel, setShowTransactionPanel] = useState(false);

  useEffect(() => {
    setShowTransactionPanel(selectedWallets.length > 0);
  }, [selectedWallets.length]);

  return (
    <div className="space-y-6">
      {/* Market Info Header */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg shadow-md border border-brand-500/20 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-200">Market Information</h2>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">MC:</span>
              <span className="font-medium text-gray-200">{formatUsd(calculateMarketCap().usd)}</span>
              <span className="text-gray-500 text-xs">({formatSol(calculateMarketCap().sol)})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">{TOKEN_TICKER}:</span>
              <span className="font-medium text-gray-200">{formatUsd((TOKEN_PRICE * SOL_TO_USD).toFixed(4))}</span>
              <span className="text-gray-500 text-xs">({TOKEN_PRICE} SOL)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">SOL:</span>
              <span className="font-medium text-gray-200">{formatUsd(SOL_TO_USD.toString())}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg shadow-md border border-brand-500/20 p-6">
        <WealthDistribution wallets={wallets} showSummary={true} />
      </div>

      {/* Historical data visualization - time series chart */}
      {timeSeriesData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg shadow-md border border-brand-500/20 p-6">
            <TimeSeriesChart 
              data={timeSeriesData} 
              title="Portfolio Value Over Time" 
              valueKey={['portfolioValue', 'sol']}
              formatValue={(value) => `${value.toFixed(2)} SOL`}
            />
          </div>
          <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg shadow-md border border-brand-500/20 p-6">
            <TimeSeriesChart 
              data={timeSeriesData} 
              title="Token Supply Owned" 
              valueKey="totalTokens"
              formatValue={(value) => `${value.toFixed(2)} ${TOKEN_TICKER}`}
            />
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            isMultiSelectMode 
              ? 'bg-brand-600 text-white hover:bg-brand-700' 
              : 'bg-dark-300 text-gray-200 hover:bg-dark-400 border border-dark-400'
          }`}
        >
          <MousePointer2 className="w-5 h-5" />
          {isMultiSelectMode ? 'Exit Selection' : 'Select Multiple'}
        </button>
        <button
          onClick={handleAddWallet}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700"
        >
          <Plus className="w-5 h-5" />
          Add Wallet
        </button>
      </div>

      <div
        ref={containerRef}
        className={`relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${
          isMultiSelectMode ? 'select-none cursor-crosshair' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove as any}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={selectionRef}
          className={`absolute border-2 border-brand-500 bg-brand-500/20 pointer-events-none ${
            isDragging ? 'block' : 'hidden'
          }`}
          style={{ width: 0, height: 0 }}
        />
        {wallets.map(wallet => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            onRename={handleRename}
            onToggleSelect={handleToggleSelect}
            onMount={(element) => {
              if (element) {
                walletsRef.current.set(wallet.id, element.getBoundingClientRect());
              }
            }}
            isMultiSelectMode={isMultiSelectMode}
          />
        ))}
      </div>

      {showTransactionPanel && (
        <TransactionPanel onTransaction={handleTransaction} />
      )}
      
      {/* Master Transaction Log */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg shadow-md border border-brand-500/20 p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Transaction History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-400">
                <th className="text-left py-3 px-4 text-gray-400">Time</th>
                <th className="text-left py-3 px-4 text-gray-400">Wallet</th>
                <th className="text-left py-3 px-4 text-gray-400">Type</th>
                <th className="text-right py-3 px-4 text-gray-400">Amount</th>
                <th className="text-right py-3 px-4 text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {masterLog.slice().reverse().map((tx) => (
                <tr key={tx.id} className="border-b border-dark-300">
                  <td className="py-3 px-4 text-gray-400">
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-200">{tx.walletName}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 ${
                      tx.type === 'BUY' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'BUY' ? (
                        <ArrowDownCircle className="w-4 h-4" />
                      ) : (
                        <ArrowUpCircle className="w-4 h-4" />
                      )}
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-200">
                    {tx.amount} {TOKEN_TICKER}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-flex items-center gap-1 ${
                      tx.status === 'confirmed' ? 'text-green-400' :
                      tx.status === 'failed' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {tx.status === 'pending' && (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      )}
                      <span className="capitalize">{tx.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Time Series Data Display */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg shadow-md border border-brand-500/20 p-6">
        <h2 className="text-xl font-semibold text-gray-200 mb-4">Historical Data</h2>
        <div className="overflow-x-auto whitespace-nowrap">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-400">
                <th className="text-left py-3 px-4 text-gray-400 whitespace-nowrap">Time</th>
                <th className="text-right py-3 px-4 text-gray-400 whitespace-nowrap">Market Cap (USD)</th>
                <th className="text-right py-3 px-4 text-gray-400 whitespace-nowrap">Portfolio Value</th>
                <th className="text-right py-3 px-4 text-gray-400 whitespace-nowrap">Token %</th>
                <th className="text-right py-3 px-4 text-gray-400 whitespace-nowrap">SOL %</th>
                <th className="text-right py-3 px-4 text-gray-400 whitespace-nowrap">% of Supply</th>
              </tr>
            </thead>
            <tbody>
              {timeSeriesData.slice().reverse().map((point, i) => (
                <tr key={point.timestamp} className={`border-b border-dark-300 ${i === 0 ? 'bg-dark-300/30' : ''}`}>
                  <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                    {new Date(point.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-200 whitespace-nowrap">
                    {formatUsd(point.marketCap.usd.toString())}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-200 whitespace-nowrap">
                    {formatUsd(point.portfolioValue.usd.toString())}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-200 whitespace-nowrap">
                    {((point.totalTokens * point.tokenPrice.sol) / point.portfolioValue.sol * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-200 whitespace-nowrap">
                    {((point.totalSol) / point.portfolioValue.sol * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-200 whitespace-nowrap">
                    {((point.totalTokens / TOTAL_SUPPLY) * 100).toFixed(4)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}