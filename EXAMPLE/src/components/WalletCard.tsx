import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X, Wallet as WalletIcon, Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { WalletWithHistory } from '../types';
import { formatToken, formatSol, TOKEN_TICKER, calculateUsdValue, formatUsd, TOTAL_SUPPLY } from '../config';

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
      className={`wallet-card p-4 rounded-lg shadow-md transition-all duration-300 ${
        wallet.transactionStatus === 'pending' ? 'bg-yellow-50 border-2 border-yellow-500' :
        wallet.transactionStatus === 'confirmed' ? 'bg-green-50 border-2 border-green-500' :
        wallet.transactionStatus === 'failed' ? 'bg-red-50 border-2 border-red-500' :
        wallet.selected ? 'bg-indigo-50 border-2 border-indigo-500' : 
        'bg-white border border-gray-200'
      } ${isMultiSelectMode ? 'cursor-default' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <WalletIcon className={`w-5 h-5 ${
            wallet.transactionStatus === 'pending' ? 'text-yellow-600' :
            wallet.transactionStatus === 'confirmed' ? 'text-green-600' :
            wallet.transactionStatus === 'failed' ? 'text-red-600' :
            'text-indigo-600'
          }`} />
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="px-2 py-1 border rounded text-sm"
                autoFocus
              />
              <button
                onClick={handleRename}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancel}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium">{wallet.name}</span>
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-500 hover:text-gray-700"
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <p className="text-gray-500 font-mono">{wallet.address}</p>
          {wallet.transactionStatus && (
            <div className={`flex items-center gap-2 text-sm ${
              wallet.transactionStatus === 'pending' ? 'text-yellow-600' :
              wallet.transactionStatus === 'confirmed' ? 'text-green-600' :
              'text-red-600'
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
            <p className="text-gray-600 mb-1">Token Balance</p>
            <p className="text-gray-900 font-medium">{formatToken(wallet.tokenBalance)}</p>
            <div className="text-gray-500 text-xs space-y-1">
              <p>≈ {formatSol(wallet.tokenValue)} ({formatUsd(calculateUsdValue(wallet.tokenValue))})</p>
              <p>{((parseFloat(wallet.tokenBalance) / TOTAL_SUPPLY) * 100).toFixed(2)}% of supply</p>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-600 mb-1">SOL Balance</p>
            <p className="text-gray-900 font-medium">{formatSol(wallet.solBalance)}</p>
            <p className="text-gray-500 text-xs">≈ {formatUsd(calculateUsdValue(wallet.solBalance))}</p>
          </div>
        </div>
        <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600"
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
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-gray-600 mb-2">Recent Transactions</p>
            <div className="space-y-2">
              {wallet.transactions.slice(-3).reverse().map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {tx.type === 'BUY' ? (
                      <ArrowDownCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowUpCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={tx.type === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                      {tx.type}
                    </span>
                  </div>
                  <span className="font-mono">{tx.amount} {TOKEN_TICKER}</span>
                  <span className={`${
                    tx.status === 'confirmed' ? 'text-green-600' :
                    tx.status === 'failed' ? 'text-red-600' :
                    'text-yellow-600'
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