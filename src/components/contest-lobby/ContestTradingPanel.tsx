/**
 * Contest Trading Panel
 * 
 * @description In-game trading interface for contests
 * @author BranchManager
 * @created 2025-06-11
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

// Components
import { TokenSearchFixed } from '../common/TokenSearchFixed';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Card } from '../ui/Card';

// Services
import { ddApi } from '../../services/dd-api';
import { formatCurrency } from '../../lib/utils';

// Types
import { SearchToken } from '../../types';

interface TradingPanelProps {
  contestId: string;
  portfolio: any;
  onTradeComplete?: () => void;
}

interface TradeMode {
  action: 'buy' | 'sell';
  token: SearchToken | null;
  amount: string;
  percentage: number;
}

export const ContestTradingPanel: React.FC<TradingPanelProps> = ({
  contestId,
  portfolio,
  onTradeComplete
}) => {
  // State
  const [selectedToken, setSelectedToken] = useState<SearchToken | null>(null);
  const [tradeMode, setTradeMode] = useState<TradeMode>({
    action: 'buy',
    token: null,
    amount: '',
    percentage: 0
  });
  const [isTrading, setIsTrading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Calculate available balance
  const availableBalance = useMemo(() => {
    if (!portfolio) return 0;
    
    // If we have cash balance, use that
    if (portfolio.cash_balance !== undefined) {
      return parseFloat(portfolio.cash_balance);
    }
    
    // Otherwise calculate from total value minus holdings
    const totalValue = parseFloat(portfolio.total_value || '1000');
    const holdingsValue = portfolio.holdings?.reduce((sum: number, holding: any) => {
      return sum + parseFloat(holding.value_usd || '0');
    }, 0) || 0;
    
    return totalValue - holdingsValue;
  }, [portfolio]);
  
  // Current holdings for quick access
  const currentHoldings = useMemo(() => {
    if (!portfolio?.holdings) return [];
    return portfolio.holdings;
  }, [portfolio]);
  
  // Handle token selection from search
  const handleTokenSelect = useCallback((token: SearchToken) => {
    setSelectedToken(token);
    setTradeMode(prev => ({ ...prev, token }));
    
    // Check if we already hold this token
    const existingHolding = currentHoldings.find(
      (h: any) => h.token_address === token.address
    );
    
    if (existingHolding) {
      // Default to sell if we already hold it
      setTradeMode(prev => ({ ...prev, action: 'sell' }));
    }
  }, [currentHoldings]);
  
  // Handle percentage slider
  const handlePercentageChange = useCallback((percentage: number) => {
    setTradeMode(prev => ({ ...prev, percentage }));
    
    if (tradeMode.action === 'buy') {
      // Calculate buy amount based on available balance
      const amount = (availableBalance * percentage / 100).toFixed(2);
      setTradeMode(prev => ({ ...prev, amount }));
    } else {
      // Calculate sell amount based on holding
      const holding = currentHoldings.find(
        (h: any) => h.token_address === selectedToken?.address
      );
      if (holding) {
        const holdingValue = parseFloat(holding.value_usd || '0');
        const amount = (holdingValue * percentage / 100).toFixed(2);
        setTradeMode(prev => ({ ...prev, amount }));
      }
    }
  }, [availableBalance, currentHoldings, selectedToken, tradeMode.action]);
  
  // Execute trade
  const executeTrade = async () => {
    if (!selectedToken || !tradeMode.amount || parseFloat(tradeMode.amount) === 0) {
      toast.error('Please select a token and enter an amount');
      return;
    }
    
    setIsTrading(true);
    try {
      // For now, we'll update the portfolio directly since trade endpoint doesn't exist yet
      // In the future, this will be: await ddApi.contests.executeTrade(contestId, tradeData)
      
      // Calculate new portfolio weights
      const currentPortfolio = await ddApi.portfolio.get(parseInt(contestId));
      const tokens: any[] = currentPortfolio.tokens || [];
      
      if (tradeMode.action === 'buy') {
        // Add or increase position
        const existingIndex = tokens.findIndex(t => t.contractAddress === selectedToken.address);
        if (existingIndex >= 0) {
          // Increase existing position
          tokens[existingIndex].weight += tradeMode.percentage;
        } else {
          // Add new position
          tokens.push({
            symbol: selectedToken.symbol,
            contractAddress: selectedToken.address,
            weight: tradeMode.percentage
          });
        }
      } else {
        // Reduce or remove position
        const existingIndex = tokens.findIndex(t => t.contractAddress === selectedToken.address);
        if (existingIndex >= 0) {
          tokens[existingIndex].weight -= tradeMode.percentage;
          if (tokens[existingIndex].weight <= 0) {
            tokens.splice(existingIndex, 1);
          }
        }
      }
      
      // Normalize weights to 100%
      const totalWeight = tokens.reduce((sum, t) => sum + t.weight, 0);
      if (totalWeight > 0) {
        tokens.forEach(t => {
          t.weight = (t.weight / totalWeight) * 100;
        });
      }
      
      // Update portfolio
      await fetch(`/api/contests/${contestId}/portfolio`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('dd_token')}`
        },
        body: JSON.stringify({ tokens })
      });
      
      toast.success(
        tradeMode.action === 'buy' 
          ? `Bought ${tradeMode.amount} USD of ${selectedToken.symbol}`
          : `Sold ${tradeMode.amount} USD of ${selectedToken.symbol}`
      );
      
      // Reset form
      setSelectedToken(null);
      setTradeMode({ action: 'buy', token: null, amount: '', percentage: 0 });
      setShowConfirmation(false);
      
      // Refresh portfolio
      onTradeComplete?.();
    } catch (error) {
      console.error('Trade failed:', error);
      toast.error('Trade failed. Please try again.');
    } finally {
      setIsTrading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Portfolio Overview</h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <div className="text-sm text-gray-400">Total Value</div>
              <div className="text-2xl font-bold text-gray-100">
                {formatCurrency(portfolio?.total_value || 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Available Cash</div>
              <div className="text-2xl font-bold text-brand-400">
                {formatCurrency(availableBalance)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">P&L</div>
              <div className={`text-2xl font-bold ${
                (portfolio?.profit_loss_percentage || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {portfolio?.profit_loss_percentage || 0}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Holdings</div>
              <div className="text-2xl font-bold text-gray-100">
                {currentHoldings.length}
              </div>
            </div>
          </div>
          
          {/* Current Holdings */}
          {currentHoldings.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Current Holdings</h3>
              <div className="space-y-2">
                {currentHoldings.map((holding: any) => (
                  <div 
                    key={holding.token_address}
                    className="flex items-center justify-between p-3 bg-dark-300/50 rounded-lg cursor-pointer hover:bg-dark-300/70 transition-colors"
                    onClick={() => {
                      const token: SearchToken = {
                        id: 0,
                        address: holding.token_address,
                        symbol: holding.symbol,
                        name: holding.symbol,
                        image_url: null,
                        decimals: 9,
                        is_active: true,
                        created_at: '',
                        updated_at: '',
                        price: 0,
                        change_24h: 0,
                        market_cap: 0,
                        volume_24h: 0,
                        price_updated_at: null
                      };
                      handleTokenSelect(token);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-dark-400 flex items-center justify-center">
                        <span className="text-xs font-bold">{holding.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-200">{holding.symbol}</div>
                        <div className="text-xs text-gray-400">
                          {holding.amount} tokens
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-200">
                        {formatCurrency(holding.value_usd || 0)}
                      </div>
                      <div className={`text-xs ${
                        holding.profit_loss_percentage >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {holding.profit_loss_percentage >= 0 ? '+' : ''}{holding.profit_loss_percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Trading Interface */}
      <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-100 mb-4">Trade Tokens</h2>
          
          {/* Token Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Search Tokens
            </label>
            <TokenSearchFixed
              onSelectToken={handleTokenSelect}
              placeholder="Search by name, symbol, or address..."
              className="w-full"
            />
          </div>
          
          {/* Selected Token */}
          {selectedToken && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between p-4 bg-dark-300/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dark-400 flex items-center justify-center">
                    <span className="text-sm font-bold">{selectedToken.symbol?.slice(0, 3) || '???'}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-200">{selectedToken.symbol}</div>
                    <div className="text-xs text-gray-400">{selectedToken.name}</div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedToken(null);
                    setTradeMode({ action: 'buy', token: null, amount: '', percentage: 0 });
                  }}
                >
                  Clear
                </Button>
              </div>
              
              {/* Buy/Sell Toggle */}
              <div className="flex gap-2">
                <Button
                  className={`flex-1 ${
                    tradeMode.action === 'buy' 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-dark-300/50 text-gray-400'
                  }`}
                  onClick={() => setTradeMode(prev => ({ ...prev, action: 'buy' }))}
                >
                  Buy
                </Button>
                <Button
                  className={`flex-1 ${
                    tradeMode.action === 'sell' 
                      ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                      : 'bg-dark-300/50 text-gray-400'
                  }`}
                  onClick={() => setTradeMode(prev => ({ ...prev, action: 'sell' }))}
                  disabled={!currentHoldings.find((h: any) => h.token_address === selectedToken.address)}
                >
                  Sell
                </Button>
              </div>
              
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Amount (USD)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={tradeMode.amount}
                    onChange={(e) => setTradeMode(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-4 py-2 bg-dark-300/50 border border-dark-400 rounded-lg text-gray-200 focus:outline-none focus:border-brand-500"
                    placeholder="0.00"
                    min="0"
                    max={tradeMode.action === 'buy' ? availableBalance : undefined}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    USD
                  </span>
                </div>
              </div>
              
              {/* Percentage Slider */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Percentage</span>
                  <span className="text-gray-200 font-medium">{tradeMode.percentage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={tradeMode.percentage}
                  onChange={(e) => handlePercentageChange(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>
              
              {/* Execute Trade Button */}
              <Button
                size="lg"
                className={`w-full ${
                  tradeMode.action === 'buy' 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-red-500 hover:bg-red-600'
                }`}
                onClick={() => setShowConfirmation(true)}
                disabled={!tradeMode.amount || parseFloat(tradeMode.amount) === 0 || isTrading}
              >
                {isTrading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  `${tradeMode.action === 'buy' ? 'Buy' : 'Sell'} ${selectedToken.symbol}`
                )}
              </Button>
            </motion.div>
          )}
        </div>
      </Card>
      
      {/* Trade Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && selectedToken && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark-200 rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-100 mb-4">Confirm Trade</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Action</span>
                  <span className={`font-medium ${
                    tradeMode.action === 'buy' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tradeMode.action.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Token</span>
                  <span className="text-gray-200 font-medium">{selectedToken.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-gray-200 font-medium">
                    {formatCurrency(parseFloat(tradeMode.amount))}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </Button>
                <Button
                  className={`flex-1 ${
                    tradeMode.action === 'buy' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  onClick={executeTrade}
                  disabled={isTrading}
                >
                  {isTrading ? <LoadingSpinner size="sm" /> : 'Confirm'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};