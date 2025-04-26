import { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Wallet, ArrowRightLeft, SplitSquareHorizontal, Percent, Shuffle } from 'lucide-react';
import type { Transaction, TransactionMode } from './types';
import { TOKEN_TICKER, calculateSolCost, calculateUsdValue, formatUsd } from './config';

interface TransactionPanelProps {
  onTransaction: (type: Transaction['type'], amount: string, mode: TransactionMode) => void;
}

export function TransactionPanel({ onTransaction }: TransactionPanelProps) {
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<TransactionMode>('equal');
  const solCost = amount ? calculateSolCost(amount) : '0';

  const modes = [
    { id: 'equal', label: 'Equal Split', icon: SplitSquareHorizontal, 
      description: 'Split the total amount equally between selected wallets' },
    { id: 'proportional', label: 'By Balance', icon: Percent,
      description: 'Distribute proportionally to current wallet balances' },
    { id: 'random', label: 'Random', icon: Shuffle,
      description: 'Randomly distribute the total amount' }
  ] as const;

  const handleTransaction = (type: Transaction['type']) => {
    if (!amount) return;
    onTransaction(type, amount, mode);
    setAmount('');
  };

  return (
    <div 
      className="fixed bottom-6 right-6 bg-dark-200/80 backdrop-blur-lg rounded-lg shadow-xl p-4 w-[500px] border border-brand-500/20 transition-all duration-300 transform"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-brand-500/10 rounded-lg">
          <Wallet className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-200">Quick Trade Selected Wallets</h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
            <ArrowRightLeft className="w-4 h-4" />
            <span>
              {amount 
                ? `${amount} ${TOKEN_TICKER} = ${solCost} SOL (${formatUsd(calculateUsdValue(solCost))})`
                : 'Enter amount to see conversion'
              }
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
              mode === m.id
                ? 'bg-brand-500/20 text-brand-400'
                : 'bg-dark-300 text-gray-400 hover:bg-dark-400'
            }`}
          >
            <m.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{m.label}</span>
          </button>
        ))}
      </div>
      
      <div className="text-sm text-gray-500 mb-4">
        {modes.find(m => m.id === mode)?.description}
      </div>

      <div className="flex gap-3">
        <input
          type="number"
          value={amount}
          min="0"
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount..."
          className="flex-1 px-4 py-2 text-lg bg-dark-400 border border-dark-500 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        <button
          onClick={() => handleTransaction('BUY')}
          disabled={!amount}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowDownCircle className="w-5 h-5" />
          Buy
        </button>
        <button
          onClick={() => handleTransaction('SELL')}
          disabled={!amount}
          className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowUpCircle className="w-5 h-5" />
          Sell
        </button>
      </div>
    </div>
  );
}