import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';
import NanoLogo from '../../components/logo/NanoLogo';
import MiniLogo from '../../components/logo/MiniLogo';
import axios from 'axios';
import { PieChart, Pie, Cell } from 'recharts';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import toast from 'react-hot-toast';
import { config } from '../../config/config';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';
import { useIndividualToken } from '../../hooks/websocket/topic-hooks/useIndividualToken';

/**
 * Launch Page Component
 * 
 * Handles the token launch with 1-to-1 exchange
 * Two audiences: legacy holders (exchange) and future holders (information)
 * 
 * @created 2025-07-31
 */

// Custom label for percentages inside pie slices
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
  // Don't render label for the transparent slice (last item)
  if (index === 9) return null;
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.8;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="black" 
      textAnchor="middle" 
      dominantBaseline="central"
      fontSize="14"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom label for the first pie chart (always show)
const renderSimpleLabel = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius - 15; // Position near the outer edge, just inside
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central"
      fontSize="12"
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom tooltip for total supply breakdown - commented out since tooltips are removed
/*
const CustomTotalSupplyTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg">
        <div className="text-white font-semibold mb-1">{data.name}</div>
        <div className="text-gray-300 text-sm">{data.value}% of total supply</div>
        <div className="text-gray-400 text-xs mt-1">
          {data.name === 'Supply Vested' && 'Tokens allocated to creator upon bonding'}
          {data.name === 'Bonding Supply' && 'Available for bonding curve purchases'}
          {data.name === 'Migrating Supply' && 'Deposited into liquidity pool upon bonding'}
        </div>
      </div>
    );
  }
  return null;
};

// Custom tooltip for detailed breakdown
const CustomDetailedTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-lg max-w-xs">
        <div className="text-white font-semibold mb-1">{data.name.replace('\n', ' ')}</div>
        <div className="text-gray-300 text-sm">{data.value}% of vested supply</div>
        <div className="text-gray-400 text-xs mt-1">
          {data.name.includes('Treasury') && 'Funds for DAO operations and development'}
          {data.name.includes('Airdrop') && 'Rewards for early supporters and holders'}
          {data.name.includes('Exchange') && 'Reserved for major exchange listings'}
          {data.name.includes('Jupiter') && 'Partnership allocation with Jupiter ecosystem'}
          {data.name.includes('Seeker') && 'Partnership allocation with Seeker ecosystem'}
          {data.name.includes('PSG1') && 'Partnership allocation with PSG1 ecosystem'}
          {data.name.includes('Strategic') && 'Long-term yield generation pool'}
          {data.name.includes('Team') && 'Core team allocation with vesting schedule'}
          {data.name.includes('Development') && 'Ongoing platform development funding'}
          {data.name.includes('Marketing') && 'Community growth and marketing initiatives'}
          {data.name.includes('Contest') && 'Future merit-based rewards system for active players'}
          {data.name.includes('Dev') && 'Developer allocation secured in Jupiter Lock with vesting schedule'}
        </div>
      </div>
    );
  }
  return null;
};
*/

// Animated Number Component with Las Vegas style
const AnimatedNumber: React.FC<{ 
  value: number; 
  duration?: number; 
  className?: string; 
  style?: React.CSSProperties; 
  delay?: number; 
  prefix?: string; 
  suffix?: string; 
  customDisplay?: string;
  alternateDisplay?: string;
  alternateDelay?: number;
}> = ({ value, duration = 2000, className, style, delay = 0, prefix = '', suffix = '', customDisplay, alternateDisplay, alternateDelay }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [showAlternate, setShowAlternate] = useState(false);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const alternateIntervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      setIsAnimating(false);
      return;
    }
    
    const startAnimation = () => {
      setHasStarted(true);
      setIsAnimating(true);
      startTimeRef.current = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        
        // Dramatic easing function with anticipation
        let easedProgress;
        if (progress < 0.1) {
          // Initial slow start with anticipation
          easedProgress = Math.pow(progress * 10, 3) * 0.1;
        } else if (progress < 0.8) {
          // Accelerating middle section
          const adjustedProgress = (progress - 0.1) / 0.7;
          easedProgress = 0.1 + Math.pow(adjustedProgress, 1.5) * 0.7;
        } else {
          // Dramatic final surge
          const adjustedProgress = (progress - 0.8) / 0.2;
          easedProgress = 0.8 + (1 - Math.pow(1 - adjustedProgress, 4)) * 0.2;
        }
        
        const currentValue = Math.floor(value * Math.min(easedProgress, 1));
        
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setDisplayValue(value);
          
          // Start alternating display if configured
          if (alternateDisplay && alternateDelay) {
            setTimeout(() => {
              alternateIntervalRef.current = setInterval(() => {
                setShowAlternate(prev => !prev);
              }, 3000) as unknown as number;
            }, alternateDelay);
          }
        }
      };
      
      rafRef.current = requestAnimationFrame(animate);
    };
    
    if (delay > 0) {
      setHasStarted(false);
      const timeoutId = setTimeout(startAnimation, delay);
      return () => {
        clearTimeout(timeoutId);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        if (alternateIntervalRef.current) {
          clearInterval(alternateIntervalRef.current);
        }
      };
    } else {
      startAnimation();
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        if (alternateIntervalRef.current) {
          clearInterval(alternateIntervalRef.current);
        }
      };
    }
  }, [value, duration, delay]);
  
  if (!hasStarted && delay > 0) {
    return null;
  }
  
  return (
    <span 
      className={`relative ${className || `text-5xl font-black tracking-tight transition-all duration-300 ${
        isAnimating ? 'scale-110' : 'scale-100'
      }`}`}
      style={style || {
        background: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: isAnimating 
          ? '0 0 30px rgba(16, 185, 129, 0.8), 0 0 60px rgba(52, 211, 153, 0.6)' 
          : '0 0 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(52, 211, 153, 0.4)',
        filter: isAnimating ? 'brightness(1.2)' : 'brightness(1)',
      }}
    >
      <span 
        className={`transition-opacity duration-500 ${showAlternate && alternateDisplay ? 'opacity-100' : 'opacity-0'} absolute text-green-400`}
      >
        {alternateDisplay}
      </span>
      <span 
        className={`transition-opacity duration-500 ${showAlternate && alternateDisplay ? 'opacity-0' : 'opacity-100'}`}
      >
        {customDisplay || `${prefix}${displayValue.toLocaleString()}${suffix}`}
      </span>
    </span>
  );
};

const LaunchPage: React.FC = () => {
  const { user } = useStore();
  const isLoggedIn = !!user?.wallet_address;
  const [activeTab, setActiveTab] = useState<'exchange' | 'information'>('information');
  const [walletLoading, setWalletLoading] = useState(false);
  const [oldAmount, setOldAmount] = useState(0);
  const [newAmount, setNewAmount] = useState(0);
  const [hasAirdrop, setHasAirdrop] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [exchangeComplete, setExchangeComplete] = useState(false);
  const [oldDuelSent, setOldDuelSent] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [showReveal, setShowReveal] = useState(false);
  const [showBranchMessage, setShowBranchMessage] = useState(false);
  
  // Wallet adapter for Solana transactions
  const { publicKey, signTransaction, connected, signMessage } = useWallet();
  
  // Auth hook for logging in
  const auth = useMigratedAuth();
  const isAdminOrSuperAdmin = auth.user?.role === 'admin' || auth.user?.role === 'superadmin';
  
  // Get current DUEL token data for market cap calculation
  const OLD_DUEL_ADDRESS = 'F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX';
  const { token: oldDuelToken } = useIndividualToken(OLD_DUEL_ADDRESS);
  
  // Fetch airdrop amount for user
  const fetchAirdropData = async () => {
    if (!user?.wallet_address) return;
    
    setWalletLoading(true);
    try {
      // Check if user has airdrop using public endpoint
      const response = await axios.get(`/api/airdrop/check/${user.wallet_address}`);
      
      if (response.data?.hasAirdrops) {
        setHasAirdrop(true);
        // The API now returns amount (new), oldAmount (total owed), and oldDuelSent (amount paid)
        setNewAmount(response.data.totalAmount || 0);
        setOldAmount(response.data.totalOldAmount || response.data.totalAmount || 0);
        setOldDuelSent(response.data.oldDuelSent || 0);
        
        // Use the status from API response or determine from amounts
        const apiStatus = response.data.status;
        const totalOwed = response.data.totalOldAmount || response.data.totalAmount || 0;
        const amountSent = response.data.oldDuelSent || 0;
        
        if (apiStatus) {
          setPaymentStatus(apiStatus);
          if (apiStatus === 'completed') {
            setExchangeComplete(true);
          }
        } else {
          // Fallback logic if API doesn't return status
          if (amountSent >= totalOwed * 0.99 && totalOwed > 0) {
            setPaymentStatus('completed');
            setExchangeComplete(true);
          } else if (amountSent > 0) {
            setPaymentStatus('processing');
          } else {
            setPaymentStatus('pending');
          }
        }
      } else {
        setHasAirdrop(false);
        setOldAmount(0);
        setNewAmount(0);
        setOldDuelSent(0);
        setPaymentStatus('pending');
      }
    } catch (error: any) {
      console.error('Failed to fetch airdrop data:', error);
      
      // Check if it's a server error (502, 503, etc)
      if (error.response?.status >= 500) {
        toast.error('Server is temporarily unavailable. Please try again later.');
      } else if (error.response?.status === 404) {
        // Only show "no allocation" for actual 404s
        setHasAirdrop(false);
      } else {
        toast.error('Unable to check airdrop status. Please refresh the page.');
      }
      
      setOldAmount(0);
      setNewAmount(0);
      setOldDuelSent(0);
      setPaymentStatus('pending');
    } finally {
      setWalletLoading(false);
    }
  };
  
  // Fetch on mount and when user changes
  useEffect(() => {
    fetchAirdropData();
  }, [user?.wallet_address]);
  
  // Handle the exchange process
  const handleExchange = async () => {
    if (!publicKey || !signTransaction) {
      toast.error('Wallet not connected properly');
      return;
    }
    
    setIsExchanging(true);
    
    try {
      // Create connection to Solana using DegenDuel RPC
      const connection = new Connection(
        config.SOLANA.RPC_BASE_URL,
        'confirmed'
      );
      
      // EXCHANGE WALLET ADDRESS
      const EXCHANGE_WALLET_ADDRESS = 'DEGENhyoeYsnbMmAqzjfXvuupZhdkqosVBS6GmWMGjKK';
      
      // OLD DUEL TOKEN MINT ADDRESS
      const OLD_DUEL_MINT_ADDRESS = 'F4e7axJDGLk5WpNGEL2ZpxTP9STdk7L9iSoJX7utHHHX';
      
      const EXCHANGE_WALLET = new PublicKey(EXCHANGE_WALLET_ADDRESS);
      const OLD_DUEL_MINT = new PublicKey(OLD_DUEL_MINT_ADDRESS);
      
      // Get associated token accounts
      const userTokenAccount = await getAssociatedTokenAddress(
        OLD_DUEL_MINT,
        publicKey
      );
      
      const exchangeTokenAccount = await getAssociatedTokenAddress(
        OLD_DUEL_MINT,
        EXCHANGE_WALLET
      );
      
      // Create transaction
      const transaction = new Transaction();
      
      // Convert amount to raw token units (send remaining amount if partial payment exists)
      const OLD_DUEL_DECIMALS = 9; // Decimals for old DUEL token
      const remainingAmount = Math.max(oldAmount - oldDuelSent, 0);
      const amountInLamports = Math.floor(remainingAmount * Math.pow(10, OLD_DUEL_DECIMALS));
      
      // Add SPL token transfer instruction
      transaction.add(
        createTransferInstruction(
          userTokenAccount,      // Source account
          exchangeTokenAccount,  // Destination account  
          publicKey,            // Owner of source account
          amountInLamports,     // Amount to transfer
          [],                   // No additional signers
          TOKEN_PROGRAM_ID      // SPL Token program
        )
      );
      
      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Sign transaction
      const signedTransaction = await signTransaction(transaction);
      
      // Send transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      toast.success(
        <div>
          <div>Exchange transaction sent!</div>
          <div className="text-xs mt-1">
            <a
              href={`https://solscan.io/tx/${signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View on Solscan
            </a>
          </div>
        </div>
      );
      
      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      });
      
      setExchangeComplete(true);
      setShowConfirmModal(false);
      
      // Refresh airdrop data
      await fetchAirdropData();
      
    } catch (error: any) {
      console.error('Exchange error:', error);
      
      // Check if user rejected/cancelled the transaction
      if (error.message?.includes('User rejected') || 
          error.message?.includes('cancelled') || 
          error.message?.includes('denied') ||
          error.code === 4001) {
        toast.error("Don't get cold feet, you'll regret it!");
      } else {
        toast.error(error.message || 'Exchange failed. Please try again.');
      }
    } finally {
      setIsExchanging(false);
    }
  };
  
  return (
    <>
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-200 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Confirm Airdrop Allocation</h3>
            
            <div className="mb-6 space-y-4">
              <div className="bg-dark-100/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">
                  {paymentStatus === 'processing' ? 'Remaining to send:' : 'You are exchanging:'}
                </p>
                <p className="text-white text-lg font-semibold">
                  {Math.floor(Math.max(oldAmount - oldDuelSent, 0)).toLocaleString()} old DUEL
                </p>
                <p className="text-gray-500 text-xs mt-1">Exchange window open until Aug 6 2025 midnight UTC</p>
                {paymentStatus === 'processing' && (
                  <p className="text-gray-500 text-xs mt-1">
                    Already sent: {Math.floor(oldDuelSent).toLocaleString()} DUEL
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              
              <div className="bg-dark-100/50 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">You will receive:</p>
                <p className="text-green-400 text-lg font-semibold">{Math.floor(newAmount).toLocaleString()} new DUEL</p>
                <p className="text-gray-500 text-xs mt-1">Upon bonding</p>
              </div>
            </div>
            
            <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 mb-6">
              <p className="text-green-400 text-sm">
                <strong>Almost there:</strong> Once you send your old DUEL, you'll receive new tokens after bonding completes.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isExchanging}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExchange}
                disabled={isExchanging}
                className="flex-1 px-4 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExchanging ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm</span>
                    <MiniLogo />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2 sm:gap-4 md:gap-6">
          <div className="scale-100 sm:scale-125 md:scale-150">
            <NanoLogo />
          </div>
          <span className="whitespace-nowrap">Token Launch</span>
        </h1>
      </div>
      
      {/* Hero */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] via-white to-[#14F195]"
            style={{
              textShadow: '0 0 40px rgba(20, 241, 149, 0.5), 0 0 80px rgba(153, 69, 255, 0.3)',
              WebkitTextStroke: '1px rgba(255,255,255,0.1)'
            }}>
            GRAND OPENING
          </span>
        </h2>
        
        {/* Contract Address */}
        <div className="mt-8">
          <button
            onClick={() => {
              navigator.clipboard.writeText('TBA');
              toast.success('Copied to clipboard!');
            }}
            className="group relative inline-flex items-center gap-3 px-6 py-3 rounded-xl
              bg-dark-300/50 hover:bg-dark-300/70 
              border border-gray-700/50 hover:border-gray-600
              transition-all duration-200"
          >
            <span className="text-white font-bold text-lg">DUEL</span>
            <span className="text-gray-400">Contract Address:</span>
            <span className="text-white font-mono text-lg">TBA</span>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-4 flex justify-center items-center gap-4">
          <a
            href="https://dexscreener.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative transition-transform duration-200 hover:scale-110"
          >
            <img
              src="/assets/media/logos/dexscreener.png"
              alt="Dexscreener"
              className="w-10 h-10 object-contain"
            />
          </a>
          
          <a
            href="https://jup.ag/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative transition-transform duration-200 hover:scale-110"
          >
            <img
              src="/assets/media/logos/jup.png"
              alt="Jupiter"
              className="w-10 h-10 object-contain"
            />
          </a>
        </div>
      </div>
      
      {/* Introduction Section */}
      <div className="mb-8 text-center">
        <p className="text-gray-400 text-sm max-w-4xl mx-auto">
          The DUEL token is launching with improved tokenomics designed for long-term sustainability. 
          New participants can join via the <a href="https://jup.ag/studio" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 underline">Jupiter Studio</a> bonding curve or <a href="https://www.meteora.ag/pools" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 underline">Meteora</a> liquidity pool, while legacy holders can migrate their tokens at a 1:0.5 ratio. This launch prioritizes fair distribution, community alignment, and a powerful flywheel over centralization, insiders, or bags for Evelyn.
        </p>
        <p className="text-gray-300 text-sm max-w-4xl mx-auto mt-4">
          We're excited to build alongside Jupiter, the trading infrastructure that powers Solana. Their platform has fundamentally shaped how trading works on-chain, and their launch tools provide the fair distribution model that aligns with our vision.
        </p>
      </div>
      
      {/* Tab Selector */}
      <div className="mb-8 flex justify-center">
        <div className="bg-dark-300/50 rounded-lg p-1 flex gap-1">
          <button
            onClick={() => setActiveTab('exchange')}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'exchange'
                ? 'bg-brand-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
            }`}
          >
            Legacy Holders
          </button>
          <button
            onClick={() => setActiveTab('information')}
            className={`px-6 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === 'information'
                ? 'bg-brand-500 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-dark-200/50'
            }`}
          >
            Learn More
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'exchange' ? (
        <div>
          {isLoggedIn ? (
            <>
              {!showReveal ? (
                /* Reveal Screen */
                <motion.div 
                  className="max-w-2xl mx-auto text-center"
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: "easeOut",
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                >
                  <motion.div 
                    className="bg-gradient-to-br from-purple-900/30 via-purple-800/20 to-purple-900/30 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-12 shadow-2xl"
                    initial={{ boxShadow: "0 0 0px rgba(139, 92, 246, 0)" }}
                    animate={{ 
                      boxShadow: [
                        "0 0 10px rgba(139, 92, 246, 0.2)",
                        "0 0 20px rgba(139, 92, 246, 0.3)",
                        "0 0 10px rgba(139, 92, 246, 0.2)"
                      ]
                    }}
                    transition={{ 
                      boxShadow: { 
                        duration: 3, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }
                    }}
                  >
                    <motion.div 
                      className="mb-8"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                    >
                      <motion.div 
                        className="w-24 h-24 mx-auto mb-6 flex items-center justify-center"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ 
                          delay: 0.5, 
                          duration: 0.8,
                          type: "spring",
                          stiffness: 200,
                          damping: 20
                        }}
                      >
                        <div className="scale-[3]">
                          <MiniLogo />
                        </div>
                      </motion.div>
                      <motion.h3 
                        className="text-4xl font-black mb-4"
                        style={{
                          background: 'linear-gradient(45deg, #10b981, #34d399, #10b981)',
                          backgroundSize: '200% 200%',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          animation: 'gradient-shift 3s ease-in-out infinite'
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                      >
                        ELIGIBLE FOR MIGRATION
                      </motion.h3>
                      <motion.p 
                        className="text-gray-200 text-xl mb-6 font-medium"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9, duration: 0.6 }}
                      >
                        Your bag is about to get an upgrade.
                      </motion.p>
                    </motion.div>
                    
                    <motion.button
                      onClick={() => {
                        setShowBranchMessage(true);
                        setTimeout(() => {
                          setShowReveal(true);
                        }, 2500);
                      }}
                      className="relative px-16 py-5 bg-gradient-to-r from-green-600 via-green-500 to-green-600 hover:from-green-500 hover:via-green-400 hover:to-green-500 text-white font-black text-xl rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-green-500/40 hover:scale-110 active:scale-95 transform"
                      style={{
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        background: 'linear-gradient(135deg, #059669, #10b981, #34d399, #10b981, #059669)',
                        backgroundSize: '300% 300%',
                        animation: 'gradient-shift 4s ease-in-out infinite'
                      }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: 1.1, 
                        duration: 0.6,
                        type: "spring",
                        stiffness: 150,
                        damping: 12
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className={showBranchMessage ? 'opacity-0' : 'opacity-100'}>
                        REVEAL YOUR ALLOCATION
                      </span>
                    </motion.button>
                    
                    {/* Branch Message Animation - Replaces button content */}
                    {showBranchMessage && !showReveal && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ opacity: 0, rotateY: 180 }}
                        animate={{ opacity: 1, rotateY: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      >
                        <motion.p 
                          className="text-green-300 text-xl font-medium text-center px-4"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.8 }}
                        >
                          "Thank you for believing in me" - Branch
                        </motion.p>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  {/* Balance Display */}
                  <div className="mb-8 text-center">
                <p className="text-green-400 mb-2">Your DUEL Airdrop</p>
                <div className="flex flex-col items-center justify-center gap-2">
                  {walletLoading ? (
                    <div className="animate-pulse flex items-center gap-2">
                      <div className="h-8 w-32 bg-gray-700/50 rounded"></div>
                      <NanoLogo />
                    </div>
                  ) : hasAirdrop ? (
                    <>
                      <div className="flex items-center gap-2">
                        <AnimatedNumber value={Math.floor(newAmount)} duration={12000} />
                        <div className="scale-125 ml-2">
                          <NanoLogo />
                        </div>
                      </div>
                      {/* Dollar value estimate */}
                      {newAmount > 0 && (
                        <div className="text-gray-400 text-sm min-h-[20px]">
                          <AnimatedNumber 
                            value={Math.round((newAmount / 1000000000) * 350000)} 
                            duration={7500} 
                            className="text-sm transition-all duration-1000" 
                            style={{
                              textShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
                              filter: 'brightness(1.1)'
                            }} 
                            delay={10000}
                            prefix="≈ $"
                            suffix=" USD upon bonding"
                            alternateDisplay="≈ ∞ if you hold hard"
                            alternateDelay={2000}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-500">
                      <p className="text-lg">No airdrop allocation found</p>
                      <p className="text-sm mt-1">You were not eligible for the snapshot</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Exchange Button */}
              {hasAirdrop && paymentStatus === 'pending' && (
                <motion.div 
                  className="flex justify-center mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 12, duration: 1 }}
                >
                  <button
                    disabled={walletLoading || Math.max(oldAmount - oldDuelSent, 0) === 0}
                    onClick={() => {
                      console.log('Exchange button clicked', {
                        connected,
                        publicKey: publicKey?.toString(),
                        userWallet: user?.wallet_address,
                        signTransaction: !!signTransaction
                      });
                      
                      // Check if wallet is connected
                      if (!connected || !publicKey) {
                        toast.error('Please connect your Solana wallet using the wallet button in the header');
                        return;
                      }
                      
                      // Verify the connected wallet matches the logged-in user's wallet
                      if (publicKey.toString() !== user?.wallet_address) {
                        toast.error(`Please connect the wallet associated with your account: ${user?.wallet_address?.slice(0, 4)}...${user?.wallet_address?.slice(-4)}`);
                        return;
                      }
                      
                      setShowConfirmModal(true);
                    }}
                    className={`px-16 py-4 font-black text-lg rounded-xl transition-all duration-300 shadow-lg uppercase tracking-wider
                      flex items-center justify-center gap-3 ${
                        walletLoading || Math.max(oldAmount - oldDuelSent, 0) === 0
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-800 to-purple-900 hover:from-purple-700 hover:to-purple-800 text-white shadow-purple-800/30 hover:shadow-purple-700/40 hover:scale-105 active:scale-95'
                      }`}
                  >
                  {walletLoading ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                      <span>Loading...</span>
                    </>
                  ) : Math.max(oldAmount - oldDuelSent, 0) === 0 ? (
                    <span>Payment Complete</span>
                  ) : (
                    <>
                      <span>Exchange</span>
                      <MiniLogo />
                      <span>Now</span>
                    </>
                  )}
                </button>
                </motion.div>
              )}

              {/* Payment Progress */}
              {hasAirdrop && (paymentStatus === 'processing' || paymentStatus === 'completed') && (
                <div className="mb-8 max-w-2xl mx-auto">
                  <div className="bg-dark-200/40 rounded-lg p-6 border border-gray-700/30">
                    <h3 className="text-lg font-semibold text-white mb-4 text-center">Payment Progress</h3>
                    
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            paymentStatus === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min((oldDuelSent / oldAmount) * 100, 100)}%` }}
                        ></div>
                      </div>
                      
                      {/* Payment Details */}
                      <div className="flex justify-between items-center text-sm">
                        <div className="text-center">
                          <p className="text-gray-400 mb-1">Sent</p>
                          <p className="text-white font-semibold">
                            {Math.floor(oldDuelSent).toLocaleString()} DUEL
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 mb-1">Remaining</p>
                          <p className={`font-semibold ${
                            paymentStatus === 'completed' ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {Math.floor(Math.max(oldAmount - oldDuelSent, 0)).toLocaleString()} DUEL
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 mb-1">Total Owed</p>
                          <p className="text-white font-semibold">
                            {Math.floor(oldAmount).toLocaleString()} DUEL
                          </p>
                        </div>
                      </div>
                      
                      {/* Status Message */}
                      <div className="text-center">
                        {paymentStatus === 'completed' ? (
                          <p className="text-green-400 text-sm">
                            ✅ Payment complete! Your tokens will be distributed after bonding.
                          </p>
                        ) : (
                          <p className="text-yellow-400 text-sm">
                            🔄 Partial payment received. You can send the remaining amount in batches.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Exchange Component */}
              {hasAirdrop && paymentStatus === 'pending' && (
                <div className="max-w-2xl mx-auto">
                  {/* Wallet connection prompt if not connected */}
                  {!connected && (
                    <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                      <p className="text-yellow-400 text-sm text-center mb-4">
                        Please connect your Solana wallet to proceed with the exchange.
                      </p>
                      <div className="flex justify-center">
                        <WalletMultiButton />
                      </div>
                    </div>
                  )}

                {/* Exchange Details */}
                {hasAirdrop && paymentStatus === 'pending' && (
                  <motion.div 
                    className="mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 12, duration: 1 }}
                  >
                    <div className="flex items-center justify-center gap-8">
                      <div className="text-center">
                        <p className="text-gray-500 text-sm mb-1 whitespace-nowrap">You Send</p>
                        {walletLoading ? (
                          <div className="animate-pulse h-6 w-32 bg-gray-700/50 rounded mx-auto"></div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <p className="text-white font-semibold flex items-center gap-1">
                                {Math.floor(Math.max(oldAmount - oldDuelSent, 0)).toLocaleString()}
                                <MiniLogo />
                              </p>
                              <span className="text-xs text-gray-500">old</span>
                            </div>
                            {oldDuelToken?.market_cap && (
                              <div className="text-gray-500 text-xs mt-1 min-h-[16px]">
                                <AnimatedNumber 
                                  value={Math.round((Math.max(oldAmount - oldDuelSent, 0) / 1000000000) * oldDuelToken.market_cap)} 
                                  duration={7500} 
                                  className="text-xs" 
                                  style={{}} 
                                  delay={10000}
                                  prefix="≈ $"
                                  suffix=" USD"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 text-sm mb-1 whitespace-nowrap">You Receive</p>
                        {walletLoading ? (
                          <div className="animate-pulse h-6 w-32 bg-gray-700/50 rounded mx-auto"></div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <p className="text-green-400 font-semibold flex items-center gap-1">
                                {Math.floor(newAmount).toLocaleString()}
                                <MiniLogo />
                              </p>
                              <span className="text-xs text-gray-500">new</span>
                            </div>
                            <div className="text-gray-400 text-xs mt-1 min-h-[16px]">
                              <AnimatedNumber 
                                value={Math.round((newAmount / 1000000000) * 350000)} 
                                duration={7500} 
                                className="text-xs text-gray-400" 
                                style={{}} 
                                delay={10000}
                                prefix="≈ $"
                                suffix=" USD upon bonding"
                                alternateDisplay="≈ ∞ if you hold hard"
                                alternateDelay={2000}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                  {/* Info Text */}
                  {hasAirdrop && paymentStatus === 'pending' && (
                    <motion.div 
                      className="text-center mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 12, duration: 1 }}
                    >
                      <p className="text-gray-400 text-sm font-semibold">
                        Migration Ratio: 1 old DUEL → 0.5 new DUEL
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
                
                {/* Exchange Complete State */}
                {exchangeComplete && (
                  <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-8">
                      <div className="mb-4">
                        <svg className="w-16 h-16 text-green-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">Exchange Complete!</h3>
                      <p className="text-gray-300 mb-4">
                        You have successfully exchanged your old DUEL tokens.
                      </p>
                      <div className="bg-dark-100/50 rounded-lg p-4 mb-6">
                        <p className="text-gray-400 text-sm mb-1">You received:</p>
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl font-bold text-green-400">
                            {Math.floor(newAmount).toLocaleString()}
                          </span>
                          <span className="text-lg text-gray-400">new DUEL</span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-sm mb-6">
                        Your new DUEL tokens will be distributed after the bonding curve completes.
                      </p>
                      
                      {/* Branch Thank You Message */}
                      <div className="mt-4 p-4 bg-green-900/10 border border-green-700/20 rounded-lg">
                        <p className="text-green-300 text-lg font-medium italic">
                          "Thank you for believing in me" - Branch
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                </motion.div>
              )}
            </>
          ) : (
            /* Not Logged In State */
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-dark-200/60 backdrop-blur-sm rounded-lg border border-gray-700/30 p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Connect Wallet to Exchange Your Tokens
                </h3>
                <p className="text-gray-400 mb-6">
                  Connect your wallet to see your DUEL balance and exchange for the new token
                </p>
                <div className="flex flex-col items-center gap-4">
                  <WalletMultiButton />
                  {connected && publicKey && (
                    <button
                      onClick={async () => {
                        try {
                          const walletAddress = publicKey.toBase58();
                          const signMessageWrapper = async (messageToSign: Uint8Array) => {
                            if (!signMessage) {
                              throw new Error('Wallet signing function not available.');
                            }
                            const signature = await signMessage(messageToSign);
                            return { signature }; 
                          };
                          
                          await auth.loginWithWallet(walletAddress, signMessageWrapper);
                          toast.success('Successfully logged in!');
                        } catch (error) {
                          console.error('Login error:', error);
                          toast.error('Login failed. Please try again.');
                        }
                      }}
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors text-sm"
                    >
                      Sign Message to Login
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Information Tab */
        <div className="max-w-4xl mx-auto">
          {/* Article-style content */}
          <article className="prose prose-invert max-w-none">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <MiniLogo />
              Token Launch Announcement
            </h3>
            
            {/* Official Announcement */}
            <section className="mb-8">
              <p className="text-gray-300 leading-relaxed">
                DegenDuel is officially launching its native token, DUEL, under a newly optimized 
                tokenomics framework and enhanced infrastructure using the <a href="https://jup.ag/studio" target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 underline">Jupiter Studio</a> launchpad. This launch positions DUEL for 
                long-term sustainability, ecosystem depth, and maximum community alignment.
              </p>
            </section>
            
            {/* About DegenDuel */}
            <section className="mb-8">
              <h4 className="text-xl font-semibold text-white mb-4">About DegenDuel</h4>
              <div className="bg-dark-200/40 rounded-lg p-6">
                <p className="text-gray-300 mb-4">
                  DegenDuel is a competitive portfolio game where players build token portfolios and compete for prizes. 
                  With <a href="/wallet" className="text-brand-400 hover:text-brand-300 underline">daily revenue sharing</a> for DUEL holders, live leaderboards, and a proven contest infrastructure, 
                  it's building a sustainable ecosystem for competitive crypto trading.
                </p>
              </div>
            </section>
            
            {/* Tokenomics */}
            <section className="mb-8">
              <h4 className="text-xl font-semibold text-white mb-4 text-center">Tokenomics</h4>
              <div className="flex flex-row items-center justify-center gap-8">
                {/* Combined Nested Pie Chart */}
                <div className="flex-shrink-0">
                    <PieChart width={500} height={500} margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
                      {/* Inner pie - Total Supply Breakdown */}
                      <Pie
                        data={[
                          { name: '', value: 80, color: '#451a64' },
                          { name: '', value: 15, color: '#2d3748' },
                          { name: '', value: 5, color: '#1a202c' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        label={renderSimpleLabel}
                        labelLine={false}
                        isAnimationActive={false}
                      >
                        {['#451a64', '#2d3748', '#1a202c'].map((color, index) => (
                          <Cell key={`total-cell-${index}`} fill={color} stroke="#1a1a1a" strokeWidth={1} />
                        ))}
                      </Pie>
                      
                      {/* Outer donut - Detailed 80% Breakdown */}
                      <Pie
                        data={[
                          { name: 'DUEL DAO\nTreasury', value: 20, color: '#6d28d9' },
                          { name: 'Airdrop to\nOG Holders', value: 20, color: '#a855f7' },
                          { name: 'Exchange Listings\nReserve Fund', value: 10, color: '#7c3aed' },
                          { name: 'Jupiter\nEcosystem Fund', value: 5, color: '#6b21a8' },
                          { name: 'Seeker\nEcosystem Fund', value: 5, color: '#9333ea' },
                          { name: 'PSG1\nEcosystem Fund', value: 5, color: '#8b5cf6' },
                          { name: 'Strategic\nYield Pool', value: 5, color: '#581c87' },
                          { name: 'Contest\nPrize Pool', value: 5, color: '#7e22ce' },
                          { name: 'Dev\n(Vested)', value: 5, color: '#9b4dca' },
                          { name: '', value: 20, color: 'transparent' },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={180}
                        fill="#8884d8"
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        labelLine={false}
                        label={renderCustomizedLabel}
                        isAnimationActive={false}
                      >
                        {[
                          '#6d28d9', '#a855f7', '#7c3aed', '#6b21a8', '#9333ea', 
                          '#8b5cf6', '#581c87', '#7e22ce', '#9b4dca', 'transparent'
                        ].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} stroke={index === 9 ? "none" : "#1a1a1a"} strokeWidth={index === 9 ? 0 : 1} />
                        ))}
                      </Pie>
                      
                      {/* Outer labels */}
                      <Pie
                        data={[
                          { name: 'DUEL DAO\nTreasury', value: 20, color: '#6d28d9' },
                          { name: 'Airdrop to\nOG Holders', value: 20, color: '#581c87' },
                          { name: 'Exchange Listings\nReserve Fund', value: 10, color: '#7c3aed' },
                          { name: 'Jupiter\nEcosystem Fund', value: 5, color: '#6b21a8' },
                          { name: 'Seeker\nEcosystem Fund', value: 5, color: '#9333ea' },
                          { name: 'PSG1\nEcosystem Fund', value: 5, color: '#a855f7' },
                          { name: 'Strategic\nYield Pool', value: 5, color: '#c084fc' },
                          { name: 'Contest\nPrize Pool', value: 5, color: '#8b5cf6' },
                          { name: 'Dev\n(Vested)', value: 5, color: '#9b4dca' },
                          { name: '', value: 20, color: 'transparent' },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, cx, cy, midAngle, outerRadius, index }) => {
                          // Don't show label for transparent slice
                          if (!name || index === 9) return null;
                        
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 30;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        
                        return (
                          <text 
                            x={x} 
                            y={y} 
                            fill="#d1d5db" 
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central"
                            fontSize="11"
                          >
                            {name.split('\n').map((line: string, i: number) => (
                              <tspan key={i} x={x} dy={i === 0 ? 0 : '1.1em'}>{line}</tspan>
                            ))}
                          </text>
                        );
                      }}
                      outerRadius={150}
                      fill="transparent"
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {[
                        '#14F195', '#9945FF', '#F7931A', '#00D4FF', 
                        '#FF006E', '#8B5CF6', '#06FFA5', '#FFE55C', '#94A3B8', 'transparent'
                      ].map((_, index) => (
                        <Cell key={`cell-${index}`} fill="transparent" stroke="none" />
                      ))}
                    </Pie>
                    
                    </PieChart>
                </div>
                
                {/* Legend for inner pie */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm group relative">
                    <div className="w-3 h-3 bg-[#451a64]"></div>
                    <span className="text-gray-400 cursor-help">Supply Vested: 80%</span>
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Tokens from the overall supply of 1B that will be allocated to the creator upon bonding
                      <div className="absolute top-full left-8 -mt-1">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm group relative">
                    <div className="w-3 h-3 bg-[#2d3748]"></div>
                    <span className="text-gray-400 cursor-help">Bonding Supply: 15%</span>
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Tokens sold on the bonding curve before graduation
                      <div className="absolute top-full left-8 -mt-1">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm group relative">
                    <div className="w-3 h-3 bg-[#1a202c]"></div>
                    <span className="text-gray-400 cursor-help">Migrating Supply: 5%</span>
                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Tokens that will be paired with the liquidity raised and deposited into the graduated LP pool
                      <div className="absolute top-full left-8 -mt-1">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Market Cap & Airdrop Info */}
              <div className="mt-1 pt-1 border-t border-gray-700/30">
                <div className={`grid gap-6 ${newAmount > 0 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
                  <div className="text-center">
                    <h5 className="text-sm font-semibold text-gray-400 mb-1">Initial Market Cap</h5>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <p className="text-2xl font-bold text-white">135</p>
                      <svg width="20" height="20" viewBox="0 0 397.7 311.7" className="text-white fill-current">
                        <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 237.9z"/>
                        <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1L333.1 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"/>
                        <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"/>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500">~$60K</p>
                  </div>
                  <div className="text-center">
                    <h5 className="text-sm font-semibold text-gray-400 mb-1">Bonding Market Cap</h5>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <p className="text-2xl font-bold text-white">2,200</p>
                      <svg width="20" height="20" viewBox="0 0 397.7 311.7" className="text-white fill-current">
                        <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 237.9z"/>
                        <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1L333.1 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"/>
                        <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"/>
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500">~$350K</p>
                  </div>
                  {newAmount > 0 && (
                    <div className="text-center">
                      <h5 className="text-sm font-semibold text-gray-400 mb-1">Airdrop Time</h5>
                      <p className="text-lg text-white">After Bonding</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
            
            {/* Key Features */}
            <section className="mb-8">
              <h4 className="text-xl font-semibold text-white mb-4">What's New?</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4">
                  <h5 className="font-semibold text-brand-400 mb-2">
                    Jupiter Studio Launch
                  </h5>
                  <p className="text-gray-400 text-sm">
                    Jupiter's community-first launchpad mechanics ensure organic growth and project success. 
                    Their track record speaks for itself—just ask Raydium.
                  </p>
                </div>
                <div className="p-4">
                  <h5 className="font-semibold text-brand-400 mb-2">
                    Live Infrastructure
                  </h5>
                  <p className="text-gray-400 text-sm">
                    Battle-tested <a href="/contests" className="text-brand-400 hover:text-brand-300 underline">contests</a> are live and fully operational with instant payouts and refunds if unfilled. <a href="/wallet" className="text-brand-400 hover:text-brand-300 underline">Daily revenue sharing</a> airdrop system is ready to distribute rewards.
                  </p>
                </div>
                <div className="p-4">
                  <h5 className="font-semibold text-brand-400 mb-2">
                    Strengthened Team
                  </h5>
                  <p className="text-gray-400 text-sm">
                    New advisory board established with proven crypto and community leaders. 
                    Additional technical talent joining, including more developers, to accelerate execution.
                  </p>
                </div>
                <div className="p-4">
                  <h5 className="font-semibold text-brand-400 mb-2">
                    Vastly Improved Tokenomics
                  </h5>
                  <p className="text-gray-400 text-sm">
                    Clear allocation structure with community-first distribution model. 
                    All tokenomics publicly visible with a more attractive liquidity ratio.
                  </p>
                </div>
              </div>
            </section>
            
            {/* Migration Details */}
            <section className="mb-8">
              <h4 className="text-xl font-semibold text-white mb-4">Migration Details</h4>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">🔄</span>
                  <div>
                    <p className="text-lg font-semibold text-white">1 old DUEL → 0.5 new DUEL</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm">
                  The migration ratio ensures proper value alignment while creating a more sustainable 
                  token economy for long-term growth. Snapshot taken midnight August 4th.
                </p>
              </div>
            </section>
            
            {/* Admin/SuperAdmin Only Section - Bonding Curve Calculations */}
            {isAdminOrSuperAdmin && (
              <section className="mb-8 p-6 bg-gray-900/50 border-2 border-purple-500/30 rounded-lg">
                <h4 className="text-xl font-semibold text-purple-400 mb-4">🔒 Admin: Bonding Curve Calculator</h4>
                
                <div className="space-y-6">
                  {/* Key Formulas */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h5 className="text-lg font-semibold text-white mb-3">Key Formulas</h5>
                    <div className="space-y-2 font-mono text-sm">
                      <p className="text-gray-300">Required SOL = $17,500 / Current_SOL_Price</p>
                      <p className="text-gray-300">Bonding% = 100% - Vested% - Migrating%</p>
                      <p className="text-gray-300">Efficiency ≈ 0.31 - (0.004 × Bonding%)</p>
                      <p className="text-gray-300">Grad_MC = Initial_MC + (Required_SOL / (Bonding% × Efficiency))</p>
                      <p className="text-gray-300">Public_Entry_MC = Initial_MC + (Vested% × (Grad_MC - Initial_MC))</p>
                    </div>
                  </div>

                  {/* Current Scenarios */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 75% Vested Scenario */}
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <h5 className="text-lg font-semibold text-green-400 mb-2">75% Vested Scenario</h5>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-300">Vested: 75% | Bonding: 19.9% | Migrating: 5.1%</p>
                        <p className="text-gray-300">Initial MC: 137.5 SOL</p>
                        <p className="text-gray-300">Graduation MC: 2,050 SOL</p>
                        <p className="text-gray-300">SOL Raised: ~105.43 SOL</p>
                        <p className="text-gray-300">Efficiency: 0.277</p>
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <p className="text-yellow-400 font-semibold">Public Entry: ~1,572 SOL (~$264K)</p>
                          <p className="text-gray-400 text-xs">Public must contribute all 105.43 SOL for 19.9% of tokens</p>
                          <p className="text-blue-400 text-xs font-semibold mt-1">10 SOL buys: 6.32M tokens (0.63%)</p>
                        </div>
                      </div>
                    </div>

                    {/* 76% Vested Scenario */}
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <h5 className="text-lg font-semibold text-blue-400 mb-2">76% Vested Scenario</h5>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-300">Vested: 76% | Bonding: 19.2% | Migrating: 4.8%</p>
                        <p className="text-gray-300">Initial MC: 137.5 SOL</p>
                        <p className="text-gray-300">Graduation MC: 2,200 SOL</p>
                        <p className="text-gray-300">SOL Raised: ~105.6 SOL</p>
                        <p className="text-gray-300">Efficiency: 0.267</p>
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <p className="text-yellow-400 font-semibold">Public Entry: ~1,706 SOL (~$287K)</p>
                          <p className="text-gray-400 text-xs">Public must contribute all 105.6 SOL for 19.2% of tokens</p>
                          <p className="text-blue-400 text-xs font-semibold mt-1">10 SOL buys: 5.83M tokens (0.58%)</p>
                        </div>
                      </div>
                    </div>

                    {/* 80% Vested Scenario */}
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <h5 className="text-lg font-semibold text-red-400 mb-2">80% Vested Scenario</h5>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-300">Vested: 80% | Bonding: 16.4% | Migrating: 3.6%</p>
                        <p className="text-gray-300">Initial MC: 137.5 SOL</p>
                        <p className="text-gray-300">Graduation MC: 2,950 SOL</p>
                        <p className="text-gray-300">SOL Raised: ~104.76 SOL</p>
                        <p className="text-gray-300">Efficiency: 0.227</p>
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <p className="text-yellow-400 font-semibold">Public Entry: ~2,387 SOL (~$401K)</p>
                          <p className="text-gray-400 text-xs">Public must contribute all 104.76 SOL for 16.4% of tokens</p>
                          <p className="text-blue-400 text-xs font-semibold mt-1">10 SOL buys: 4.17M tokens (0.42%)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Insights */}
                  <div className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-lg">
                    <h5 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ Key Insights</h5>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                      <li>Jupiter enforces minimum $17,500 raise requirement</li>
                      <li>Developer allocation is "free" - public pays entire raise amount</li>
                      <li>Higher vested % = higher public entry price for same tokens</li>
                      <li>Jupiter may adjust bonding/migrating ratios to meet constraints</li>
                      <li>Constant product AMM means price increases exponentially</li>
                    </ul>
                  </div>

                  {/* Quick Calculator */}
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <h5 className="text-lg font-semibold text-white mb-3">Quick Reference</h5>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Current SOL Price:</p>
                        <p className="text-white font-mono">$169-171</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Min SOL to Raise:</p>
                        <p className="text-white font-mono">~102.2 SOL</p>
                      </div>
                      <div>
                        <p className="text-gray-400">If 5% → LP at $17.5K:</p>
                        <p className="text-white font-mono">$350K Market Cap</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Formula Check:</p>
                        <p className="text-white font-mono">2,047 SOL @ grad</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
            
          </article>
        </div>
      )}
    </div>
    </>
  );
};

export default LaunchPage;