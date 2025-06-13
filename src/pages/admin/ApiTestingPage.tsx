import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Copy,
  DollarSign,
  RefreshCw,
  Search,
  TrendingUp,
  X,
  XCircle,
  Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { TokenSearch } from '../../components/common/TokenSearch';
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';
import {
  apiTestingService
} from '../../services/apiTestingService';
import { SearchToken } from '../../types';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'success' | 'error';
  response?: any;
  error?: string;
  timestamp: Date;
  duration?: number;
}

const ApiTestingPage: React.FC = () => {
  const { isAdministrator } = useMigratedAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Selected tokens for easier testing
  const [selectedInputToken, setSelectedInputToken] = useState<SearchToken | null>({
    id: 1,
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    image_url: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    decimals: 9,
    is_active: true,
    created_at: '',
    updated_at: '',
    price: 0,
    change_24h: 0,
    market_cap: 0,
    volume_24h: 0,
    price_updated_at: null
  });

  const [selectedOutputToken, setSelectedOutputToken] = useState<SearchToken | null>({
    id: 2,
    address: 'F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX',
    symbol: 'TARGET',
    name: 'Target Token',
    image_url: null,
    decimals: 6,
    is_active: true,
    created_at: '',
    updated_at: '',
    price: 0,
    change_24h: 0,
    market_cap: 0,
    volume_24h: 0,
    price_updated_at: null
  });

  const [selectedTokensForPrices, setSelectedTokensForPrices] = useState<SearchToken[]>([
    {
      id: 1,
      address: 'So11111111111111111111111111111111111111112',
      symbol: 'SOL',
      name: 'Solana',
      image_url: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
      decimals: 9,
      is_active: true,
      created_at: '',
      updated_at: '',
      price: 0,
      change_24h: 0,
      market_cap: 0,
      volume_24h: 0,
      price_updated_at: null
    },
    {
      id: 2,
      address: 'F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX',
      symbol: 'TARGET',
      name: 'Target Token',
      image_url: null,
      decimals: 6,
      is_active: true,
      created_at: '',
      updated_at: '',
      price: 0,
      change_24h: 0,
      market_cap: 0,
      volume_24h: 0,
      price_updated_at: null
    }
  ]);

  // Form states for different endpoints
  const [swapQuoteForm, setSwapQuoteForm] = useState({
    amount: 1000000, // 1 SOL in lamports
    slippageBps: 50
  });

    const [ultraOrderForm, setUltraOrderForm] = useState({
    amount: 1000000,
    walletId: 'test-wallet-1'
  });

  // Add back the missing variables needed for swap trading tests
  const [walletBalancesForm] = useState({
    walletId: 'test-wallet-1'
  });

  

  const [transactionForm, setTransactionForm] = useState({
    signature: '5h8BFH1LLB82ozlyS6N3k64St8abR38YLjMLYGpZ8NrH9AqNiQVZKZBJ4fnyQ7H8V8PaKQ7Ns4fLXoTNMqAhL9PZ'
  });

  const [batchTransactionsForm, setBatchTransactionsForm] = useState({
    signatures: '5h8BFH1LLB82ozlyS6N3k64St8abR38YLjMLYGpZ8NrH9AqNiQVZKZBJ4fnyQ7H8V8PaKQ7Ns4fLXoTNMqAhL9PZ,2h5BFH1LLB82ozlyS6N3k64St8abR38YLjMLYGpZ8NrH9AqNiQVZKZBJ4fnyQ7H8V8PaKQ7Ns4fLXoTNMqAhL9PZ'
  });

  const addTestResult = (result: Omit<TestResult, 'timestamp'>) => {
    setTestResults(prev => [
      { ...result, timestamp: new Date() },
      ...prev.slice(0, 49) // Keep only last 50 results
    ]);
  };

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    const startTime = Date.now();
    const testId = `${testName}-${Date.now()}`;
    
    addTestResult({
      id: testId,
      name: testName,
      status: 'pending'
    });

    try {
      const response = await testFunction();
      const duration = Date.now() - startTime;
      
      setTestResults(prev => prev.map(result => 
        result.id === testId
          ? { ...result, status: 'success', response, duration }
          : result
      ));
    } catch (error) {
      const duration = Date.now() - startTime;
      
      setTestResults(prev => prev.map(result => 
        result.id === testId
          ? { 
              ...result, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error',
              duration 
            }
          : result
      ));
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    try {
      // Admin Swap Trading Tests
      await runTest('Swap Trading Status', () => apiTestingService.getSwapTradingStatus());
      
      if (selectedInputToken && selectedOutputToken) {
        await runTest('Get Swap Quote', () => apiTestingService.getSwapQuote({
          inputMint: selectedInputToken.address,
          outputMint: selectedOutputToken.address,
          amount: swapQuoteForm.amount,
          slippageBps: swapQuoteForm.slippageBps
        }));
        
        await runTest('Create Ultra Order', () => apiTestingService.createUltraOrder({
          inputMint: selectedInputToken.address,
          outputMint: selectedOutputToken.address,
          amount: ultraOrderForm.amount,
          walletId: ultraOrderForm.walletId
        }));
      }
      
      if (selectedTokensForPrices.length > 0) {
        const tokenAddresses = selectedTokensForPrices.map(t => t.address).join(',');
        await runTest('Get Token Prices', () => apiTestingService.getTokenPrices(tokenAddresses));
      }
      
      await runTest('Get Wallet Balances', () => apiTestingService.getWalletBalances(walletBalancesForm.walletId));
      
      // Transaction Parsing Tests
      if (transactionForm.signature) {
        await runTest('Parse Transaction', () => apiTestingService.parseTransaction(transactionForm.signature));
        await runTest('Parse Swap Transaction', () => apiTestingService.parseSwapTransaction(transactionForm.signature));
      }
      
      if (batchTransactionsForm.signatures) {
        const signatures = batchTransactionsForm.signatures.split(',').map(s => s.trim()).filter(s => s);
        await runTest('Parse Multiple Transactions', () => 
          apiTestingService.parseMultipleTransactions({ signatures })
        );
      }
      
    } finally {
      setIsRunning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'success':
        return 'border-green-500/30 bg-green-500/5';
      case 'error':
        return 'border-red-500/30 bg-red-500/5';
    }
  };

  const handleTokenSelect = (token: SearchToken, type: 'input' | 'output') => {
    if (type === 'input') {
      setSelectedInputToken(token);
    } else {
      setSelectedOutputToken(token);
    }
  };

  const handleTokenPriceSelect = (token: SearchToken) => {
    if (!selectedTokensForPrices.find(t => t.address === token.address)) {
      setSelectedTokensForPrices(prev => [...prev, token]);
    }
  };

  const removeTokenFromPrices = (address: string) => {
    setSelectedTokensForPrices(prev => prev.filter(t => t.address !== address));
  };

  if (!isAdministrator) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-400" />
            API Testing Dashboard
          </h1>
          <p className="text-gray-400">
            Test admin swap trading and transaction parsing endpoints with smart token search
          </p>
        </div>

        {/* API Status Overview */}
        <div className="mb-8 bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-400" />
            API Testing Dashboard
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold text-white">Admin Swap Trading APIs</h3>
              </div>
              <p className="text-yellow-300 text-sm mb-2">⚠️ Testing Enabled</p>
              <p className="text-gray-400 text-xs">Pre-configured for SOL → F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX swap testing.</p>
              <div className="mt-2 text-xs text-gray-500">
                8 endpoints: status, quote, ultra/order, ultra/execute, swap/execute, batch/quotes, prices, balances
              </div>
            </div>
            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-white">Transaction Parsing APIs</h3>
              </div>
              <p className="text-green-300 text-sm mb-2">✅ Fully Operational</p>
              <p className="text-gray-400 text-xs">Public endpoints working correctly with proper authentication.</p>
              <div className="mt-2 text-xs text-gray-500">
                3 endpoints: parse-transaction, parse-swap, parse-transactions (batch)
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Run Tests Button */}
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mb-4"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Run All Tests
                  </>
                )}
              </button>
              
              {/* Individual Test Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => runTest('Swap Trading Status', () => apiTestingService.getSwapTradingStatus())}
                  disabled={isRunning}
                  className="w-full bg-dark-700 hover:bg-dark-600 disabled:opacity-50 text-white text-sm py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Test Status
                </button>
                
                {selectedInputToken && selectedOutputToken && (
                  <button
                    onClick={() => runTest('Get Swap Quote', () => apiTestingService.getSwapQuote({
                      inputMint: selectedInputToken.address,
                      outputMint: selectedOutputToken.address,
                      amount: swapQuoteForm.amount,
                      slippageBps: swapQuoteForm.slippageBps
                    }))}
                    disabled={isRunning}
                    className="w-full bg-dark-700 hover:bg-dark-600 disabled:opacity-50 text-white text-sm py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Test Quote
                  </button>
                )}
                
                {selectedTokensForPrices.length > 0 && (
                  <button
                    onClick={() => {
                      const tokenAddresses = selectedTokensForPrices.map(t => t.address).join(',');
                      runTest('Get Token Prices', () => apiTestingService.getTokenPrices(tokenAddresses));
                    }}
                    disabled={isRunning}
                    className="w-full bg-dark-700 hover:bg-dark-600 disabled:opacity-50 text-white text-sm py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Test Prices
                  </button>
                )}
                
                {transactionForm.signature && (
                  <>
                    <button
                      onClick={() => runTest('Parse Transaction', () => apiTestingService.parseTransaction(transactionForm.signature))}
                      disabled={isRunning}
                      className="w-full bg-green-700/20 border border-green-500/30 hover:bg-green-600/30 disabled:opacity-50 text-green-400 text-sm py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Parse Transaction
                    </button>
                    <button
                      onClick={() => runTest('Parse Swap Transaction', () => apiTestingService.parseSwapTransaction(transactionForm.signature))}
                      disabled={isRunning}
                      className="w-full bg-green-700/20 border border-green-500/30 hover:bg-green-600/30 disabled:opacity-50 text-green-400 text-sm py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Parse Swap TX
                    </button>
                  </>
                )}
                
                {batchTransactionsForm.signatures && (
                  <button
                    onClick={() => {
                      const signatures = batchTransactionsForm.signatures.split(',').map(s => s.trim()).filter(s => s);
                      runTest('Parse Multiple Transactions', () => 
                        apiTestingService.parseMultipleTransactions({ signatures })
                      );
                    }}
                    disabled={isRunning}
                    className="w-full bg-blue-700/20 border border-blue-500/30 hover:bg-blue-600/30 disabled:opacity-50 text-blue-400 text-sm py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Parse Batch
                  </button>
                )}
              </div>
            </div>

            {/* Token Selection */}
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-400" />
                Token Selection
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Input Token</label>
                  {selectedInputToken ? (
                    <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg border border-dark-600">
                      {selectedInputToken.image_url && (
                        <img src={selectedInputToken.image_url} alt={selectedInputToken.symbol || ''} className="w-6 h-6 rounded-full" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{selectedInputToken.symbol}</div>
                        <div className="text-xs text-gray-400">{selectedInputToken.name}</div>
                      </div>
                      <button
                        onClick={() => setSelectedInputToken(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <TokenSearch
                      onSelectToken={(token) => handleTokenSelect(token, 'input')}
                      placeholder="Search for input token..."
                      variant="minimal"
                    />
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Output Token</label>
                  {selectedOutputToken ? (
                    <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-lg border border-dark-600">
                      {selectedOutputToken.image_url && (
                        <img src={selectedOutputToken.image_url} alt={selectedOutputToken.symbol || ''} className="w-6 h-6 rounded-full" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{selectedOutputToken.symbol}</div>
                        <div className="text-xs text-gray-400">{selectedOutputToken.name}</div>
                      </div>
                      <button
                        onClick={() => setSelectedOutputToken(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <TokenSearch
                      onSelectToken={(token) => handleTokenSelect(token, 'output')}
                      placeholder="Search for output token..."
                      variant="minimal"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Swap Parameters */}
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                Swap Parameters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount (lamports)</label>
                  <input
                    type="number"
                    value={swapQuoteForm.amount}
                    onChange={(e) => setSwapQuoteForm(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Amount in lamports"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Slippage (BPS)</label>
                  <input
                    type="number"
                    value={swapQuoteForm.slippageBps}
                    onChange={(e) => setSwapQuoteForm(prev => ({ ...prev, slippageBps: parseInt(e.target.value) || 50 }))}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Slippage in basis points"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Wallet ID (Ultra Orders)</label>
                  <input
                    type="text"
                    value={ultraOrderForm.walletId}
                    onChange={(e) => setUltraOrderForm(prev => ({ ...prev, walletId: e.target.value }))}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Wallet ID for Ultra orders"
                  />
                </div>
              </div>
            </div>

            {/* Token Prices */}
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-400" />
                Token Prices
              </h3>
              <div className="space-y-4">
                <TokenSearch
                  onSelectToken={handleTokenPriceSelect}
                  placeholder="Search and add tokens for price testing..."
                  variant="minimal"
                />
                
                {selectedTokensForPrices.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Selected Tokens:</label>
                    {selectedTokensForPrices.map((token) => (
                      <div key={token.address} className="flex items-center gap-3 p-2 bg-dark-700 rounded-lg border border-dark-600">
                        {token.image_url && (
                          <img src={token.image_url} alt={token.symbol || ''} className="w-5 h-5 rounded-full" />
                        )}
                        <div className="flex-1 text-sm">
                          <div className="font-medium">{token.symbol}</div>
                        </div>
                        <button
                          onClick={() => removeTokenFromPrices(token.address)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Parsing */}
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" />
                Transaction Parsing
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Signature</label>
                  <input
                    type="text"
                    value={transactionForm.signature}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, signature: e.target.value }))}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Transaction signature"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Batch Signatures</label>
                  <textarea
                    value={batchTransactionsForm.signatures}
                    onChange={(e) => setBatchTransactionsForm(prev => ({ ...prev, signatures: e.target.value }))}
                    className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    placeholder="Comma-separated transaction signatures"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Test Results
              </h3>
              
              {testResults.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tests run yet. Select some tokens and click "Run All Tests" to begin.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {testResults.map((result) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.status)}
                          <span className="font-medium">{result.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          {result.duration && (
                            <span>{result.duration}ms</span>
                          )}
                          <span>{result.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                      
                      {result.error && (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-2">
                          <p className="text-red-400 text-sm">{result.error}</p>
                        </div>
                      )}
                      
                      {result.response && (
                        <div className="bg-dark-900/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400 uppercase tracking-wide">Response</span>
                            <button
                              onClick={() => copyToClipboard(formatJson(result.response))}
                              className="text-gray-400 hover:text-white transition-colors"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                          <pre className="text-xs text-gray-300 overflow-x-auto">
                            {formatJson(result.response)}
                          </pre>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTestingPage; 