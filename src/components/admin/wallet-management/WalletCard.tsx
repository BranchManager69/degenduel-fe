import { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X, Wallet as WalletIcon, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { WalletWithHistory } from './types';
import { formatToken, formatSol, TOKEN_TICKER, calculateUsdValue, formatUsd, TOTAL_SUPPLY } from './config';

interface WalletCardProps {
  wallet: WalletWithHistory;
  onRename: (id: string, newName: string) => void;
  onToggleSelect: (id: string) => void;
  onMount: (element: HTMLDivElement | null) => void;
  isMultiSelectMode: boolean;
}

export function WalletCard({ wallet, onRename, onToggleSelect, onMount, isMultiSelectMode }: WalletCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(wallet.name);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMount(cardRef.current);
    const updateRect = () => onMount(cardRef.current);
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [onMount]);

  const handleRename = () => {
    onRename(wallet.id, newName);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNewName(wallet.name);
    setIsEditing(false);
  };

  return (
    <div
      ref={cardRef}
      className={`p-4 rounded-lg transition-all duration-300 ${
        wallet.transactionStatus === 'pending' ? 'bg-dark-300/50 border-2 border-yellow-500/50' :
        wallet.transactionStatus === 'confirmed' ? 'bg-dark-300/50 border-2 border-green-500/50' :
        wallet.transactionStatus === 'failed' ? 'bg-dark-300/50 border-2 border-red-500/50' :
        wallet.selected ? 'bg-dark-300/50 border-2 border-brand-500' : 
        'bg-dark-300/30 border border-dark-400'
      } ${isMultiSelectMode ? 'cursor-default' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <WalletIcon className={`w-5 h-5 ${
            wallet.transactionStatus === 'pending' ? 'text-yellow-400' :
            wallet.transactionStatus === 'confirmed' ? 'text-green-400' :
            wallet.transactionStatus === 'failed' ? 'text-red-400' :
            'text-brand-400'
          }`} />
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-2 py-1 border border-dark-400 bg-dark-400 rounded text-sm text-gray-200"
                autoFocus
              />
              <button
                onClick={handleRename}
                className="text-green-400 hover:text-green-300"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-200">{wallet.name}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-500 hover:text-gray-300"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        {!isMultiSelectMode && (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={wallet.selected}
              onChange={() => onToggleSelect(wallet.id)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-dark-400 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-400/30 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-dark-600 after:border-dark-500 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
          </label>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <p className="text-gray-400 font-mono">{wallet.address}</p>
          {wallet.transactionStatus && (
            <div className={`flex items-center gap-2 text-sm ${
              wallet.transactionStatus === 'pending' ? 'text-yellow-400' :
              wallet.transactionStatus === 'confirmed' ? 'text-green-400' :
              'text-red-400'
            }`}>
              {wallet.transactionStatus === 'pending' && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              <span className="capitalize">{wallet.transactionStatus}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-gray-400 mb-1">Token Balance</p>
            <p className="text-gray-200 font-medium">{formatToken(wallet.tokenBalance)}</p>
            <div className="text-gray-500 text-xs space-y-1">
              <p>≈ {formatSol(wallet.tokenValue)} ({formatUsd(calculateUsdValue(wallet.tokenValue))})</p>
              <p>{((parseFloat(wallet.tokenBalance) / TOTAL_SUPPLY) * 100).toFixed(4)}% of supply</p>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-400 mb-1">SOL Balance</p>
            <p className="text-gray-200 font-medium">{formatSol(wallet.solBalance)}</p>
            <p className="text-gray-500 text-xs">≈ {formatUsd(calculateUsdValue(wallet.solBalance))}</p>
          </div>
        </div>
        <div className="mt-2 h-2 bg-dark-400 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-500"
            style={{ 
              width: `${(parseFloat(wallet.tokenValue) / (parseFloat(wallet.tokenValue) + parseFloat(wallet.solBalance))) * 100}%`
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Token Value</span>
          <span>SOL</span>
        </div>
        
        {/* Transaction History */}
        {wallet.transactions && wallet.transactions.length > 0 && (
          <div className="mt-4 border-t border-dark-400 pt-4">
            <p className="text-gray-400 mb-2">Recent Transactions</p>
            <div className="space-y-2">
              {wallet.transactions.slice(-3).reverse().map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {tx.type === 'BUY' ? (
                      <ArrowDownCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <ArrowUpCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className={tx.type === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                      {tx.type}
                    </span>
                  </div>
                  <span className="font-mono text-gray-300">{tx.amount} {TOKEN_TICKER}</span>
                  <span className={`${
                    tx.status === 'confirmed' ? 'text-green-400' :
                    tx.status === 'failed' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {tx.status === 'pending' && (
                      <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                    )}
                    <span className="capitalize">{tx.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}