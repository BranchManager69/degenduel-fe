import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, MousePointer2, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import { sleep } from './utils';
import { WalletCard } from './components/WalletCard';
import { SummaryPanel } from './components/SummaryPanel';
import { WealthDistribution } from './components/WealthDistribution';
import { TransactionPanel } from './components/TransactionPanel';
import { useTimeSeriesData } from './hooks/useTimeSeriesData';
import type { WalletWithHistory, Transaction, TransactionMode } from './types';
import { TOKEN_TICKER, calculateTokenValue, TOKEN_PRICE, calculateSolCost, SOL_TO_USD, formatUsd, calculateMarketCap, formatSol, TOTAL_SUPPLY } from './config';
import { distributeAmount } from './utils';

// Mock data - replace with real wallet data later
const initialWallets: WalletWithHistory[] = [
  {
    id: '1',
    name: 'Main Wallet',
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
  }
];

function App() {
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
    }});

    // Add to master log
    setMasterLog(prev => [...prev, ...transactions]);
    
    // Set all selected wallets to pending
    setWallets(prev => prev.map(wallet => {
      if (!wallet.selected) return wallet;
      const walletTx = transactions.find(tx => tx.walletName === wallet.name);
      return {
        ...wallet,
        transactionStatus: 'pending',
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
              tx.id === transaction.id ? { ...tx, status: 'confirmed' } : tx
            );

            return {
              ...w,
              tokenBalance,
              solBalance,
              tokenValue,
              transactionStatus: 'confirmed',
              selected: false,
              transactions: updatedTransactions
            };
          }));
          
          // Update master log
          setMasterLog(prev => prev.map(tx =>
            tx.id === transaction.id ? { ...tx, status: 'confirmed' } : tx
          ));
        } else {
          // Mark as failed
          setWallets(prev => prev.map(w => {
            if (w.id !== wallet.id) return w;
            const updatedTransactions = w.transactions?.map(tx =>
              tx.id === transaction.id ? { ...tx, status: 'failed' } : tx
            );
            return {
              ...w,
              transactionStatus: 'failed',
              selected: false,
              transactions: updatedTransactions
            };
          }));
          
          // Update master log
          setMasterLog(prev => prev.map(tx =>
            tx.id === transaction.id ? { ...tx, status: 'failed' } : tx
          ));
        }
      } catch (error) {
        // Handle any errors
        setWallets(prev => prev.map(w => {
          if (w.id !== wallet.id) return w;
          const updatedTransactions = w.transactions?.map(tx =>
            tx.id === transaction.id ? { ...tx, status: 'failed' } : tx
          );
          return {
            ...w,
            transactionStatus: 'failed',
            selected: false,
            transactions: updatedTransactions
          };
        }));
        
        // Update master log
        setMasterLog(prev => prev.map(tx =>
          tx.id === transaction.id ? { ...tx, status: 'failed' } : tx
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
    const newWallet: Wallet = {
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
    <div className="min-h-screen bg-gray-100">
      {/* Fixed Market Info Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-6xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Wallet Dashboard</h1>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">MC:</span>
                <span className="font-medium">{formatUsd(calculateMarketCap().usd)}</span>
                <span className="text-gray-500 text-xs">({formatSol(calculateMarketCap().sol)})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{TOKEN_TICKER}:</span>
                <span className="font-medium">{formatUsd((TOKEN_PRICE * SOL_TO_USD).toFixed(4))}</span>
                <span className="text-gray-500 text-xs">({TOKEN_PRICE} SOL)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">SOL:</span>
                <span className="font-medium">{formatUsd(SOL_TO_USD.toString())}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-16 pb-6 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <WealthDistribution wallets={wallets} showSummary={true} />
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              isMultiSelectMode 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            <MousePointer2 className="w-5 h-5" />
            {isMultiSelectMode ? 'Exit Selection' : 'Select Multiple'}
          </button>
          <button
            onClick={handleAddWallet}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
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
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            ref={selectionRef}
            className={`absolute border-2 border-indigo-500 bg-indigo-500/20 pointer-events-none ${
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
                  const updateRect = () => {
                    if (element) {
                      walletsRef.current.set(wallet.id, element.getBoundingClientRect());
                    }
                  };
                  updateRect();
                  window.addEventListener('resize', updateRect);
                  return () => window.removeEventListener('resize', updateRect);
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
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Wallet</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-right py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {masterLog.slice().reverse().map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{tx.walletName}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 ${
                        tx.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {tx.type === 'BUY' ? (
                          <ArrowDownCircle className="w-4 h-4" />
                        ) : (
                          <ArrowUpCircle className="w-4 h-4" />
                        )}
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {tx.amount} {TOKEN_TICKER}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`inline-flex items-center gap-1 ${
                        tx.status === 'confirmed' ? 'text-green-600' :
                        tx.status === 'failed' ? 'text-red-600' :
                        'text-yellow-600'
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Historical Data</h2>
          <div className="overflow-x-auto whitespace-nowrap">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 whitespace-nowrap">Time</th>
                  <th className="text-right py-3 px-4 whitespace-nowrap">Market Cap (USD)</th>
                  <th className="text-right py-3 px-4 whitespace-nowrap">Portfolio Value</th>
                  <th className="text-right py-3 px-4 whitespace-nowrap">Token %</th>
                  <th className="text-right py-3 px-4 whitespace-nowrap">SOL %</th>
                  <th className="text-right py-3 px-4 whitespace-nowrap">% of Supply</th>
                </tr>
              </thead>
              <tbody>
                {timeSeriesData.slice().reverse().map((point, i) => (
                  <tr key={point.timestamp} className={`border-b border-gray-100 ${i === 0 ? 'bg-indigo-50' : ''}`}>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {new Date(point.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                      {formatUsd(point.marketCap.usd.toString())}
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                      {formatUsd(point.portfolioValue.usd.toString())}
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                      {((point.totalTokens * point.tokenPrice.sol) / point.portfolioValue.sol * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                      {((point.totalSol) / point.portfolioValue.sol * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                      {((point.totalTokens / TOTAL_SUPPLY) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;