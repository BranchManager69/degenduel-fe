import { useState } from 'react';
import { useSolanaKitWallet } from '../../hooks/wallet/useSolanaKitWallet';
import { User } from '../../types/user';
import { toast } from '../toast';

interface CreditConfig {
  tokens_per_credit: number;
  token_symbol: string;
  token_address?: string;
  purchase_enabled: boolean;
}

interface CreditPurchaseProps {
  user: User;
  config: CreditConfig;
  onPurchaseComplete: () => void;
}

export default function CreditPurchase({ user, config, onPurchaseComplete }: CreditPurchaseProps) {
  const { publicKey, isConnected, signAndSendBlinkTransaction } = useSolanaKitWallet();
  const [purchasing, setPurchasing] = useState(false);
  const [creditsDesired, setCreditsDesired] = useState(1);

  const handlePurchase = async () => {
    if (!isConnected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setPurchasing(true);
    try {
      const tokensRequired = config.tokens_per_credit * creditsDesired;

      // Step 1: Request transaction from blink API
      const response = await fetch('/api/blinks/purchase-contest-credit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(user as any).ddJwt}`
        },
        body: JSON.stringify({
          account: publicKey.toString(),
          params: {
            tokenAmount: tokensRequired.toString(),
            creditAmount: creditsDesired.toString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate transaction: ${response.statusText}`);
      }

      const transactionData = await response.json();
      const { transaction } = transactionData;

      // Step 2: Sign and send transaction
      const signature = await signAndSendBlinkTransaction(transaction);

      // Step 3: Call backend to process purchase
      const purchaseResponse = await fetch('/api/contests/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(user as any).ddJwt}`
        },
        body: JSON.stringify({
          transaction_signature: signature,
          token_amount: tokensRequired,
          credits_requested: creditsDesired
        })
      });

      const purchaseData = await purchaseResponse.json();

      if (purchaseData.success) {
        toast.success(`Successfully purchased ${creditsDesired} credit(s)!`);
        onPurchaseComplete();
        setCreditsDesired(1); // Reset form
      } else {
        toast.error(`Purchase failed: ${purchaseData.error}`);
      }

    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Purchase Credits</h2>

      <div className="bg-indigo-900/20 border border-indigo-600/30 rounded-lg p-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-400 mb-2">
            {config.tokens_per_credit.toLocaleString()} {config.token_symbol} = 1 Credit
          </div>
          <div className="text-sm text-gray-400">
            {config.token_address ? `Token: ${config.token_address}` : 'Token will be available after launch'}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Credits to Purchase:
          </label>
          <input 
            type="number" 
            min="1" 
            max="10" 
            value={creditsDesired}
            onChange={(e) => setCreditsDesired(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Total Cost:</span>
            <span className="text-xl font-bold text-white">
              {(config.tokens_per_credit * creditsDesired).toLocaleString()} {config.token_symbol}
            </span>
          </div>
        </div>

        <button 
          onClick={handlePurchase}
          disabled={purchasing || !isConnected || !config.purchase_enabled}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors"
        >
          {purchasing ? 'Processing...' : `Purchase ${creditsDesired} Credit${creditsDesired > 1 ? 's' : ''}`}
        </button>

        {!isConnected && (
          <div className="text-center text-yellow-400 text-sm">
            Please connect your wallet to purchase credits
          </div>
        )}

        {!config.purchase_enabled && (
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
            <div className="text-yellow-400 text-sm text-center">
              Credits will be available soon via Believe Burn API.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}