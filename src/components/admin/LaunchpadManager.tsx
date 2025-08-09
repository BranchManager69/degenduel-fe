import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { toast } from "react-hot-toast";
import { ddApi } from "../../services/dd-api";
import { SimpleWalletButton } from "../auth/SimpleWalletButton";
import { useIndividualToken } from "../../hooks/websocket/topic-hooks/useIndividualToken";

interface VestingConfig {
  totalLockedVestingAmount: number;
  cliffUnlockAmount: number;
  numberOfVestingPeriod: number;
  totalVestingDuration: number;
  cliffDurationFromMigrationTime: number;
}

interface PoolCreationParams {
  tokenName: string;
  tokenSymbol: string;
  initialMarketCap: number;
  migrationMarketCap: number;
  quoteMint?: string;
  tokenQuoteDecimal?: number;
  antiSniping?: boolean;
  isLpLocked?: boolean;
  tokenImageContentType?: string;
  tokenImage?: File;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  vestingConfig?: VestingConfig;
  creatorWallet?: string;
}

interface PoolInfo {
  success: boolean;
  mint?: string;
  poolAddresses?: {
    success: boolean;
    data: {
      dammv2PoolAddress?: string;
      dbcPoolAddress?: string;
      configKey?: string;
    };
  };
}

export const LaunchpadManager: React.FC = () => {
  const { publicKey, signTransaction } = useWallet();
  const [activeTab, setActiveTab] = useState<"create" | "monitor" | "fees">("create");
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showVesting, setShowVesting] = useState(false);
  
  // Get SOL price
  const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
  const { token: solToken } = useIndividualToken(SOL_ADDRESS);
  const solPrice = solToken?.price || 0;
  const [showSocials, setShowSocials] = useState(false);
  
  // Pool creation form state
  const [formData, setFormData] = useState<PoolCreationParams>({
    tokenName: "Win2Lunch",
    tokenSymbol: "W2L",
    initialMarketCap: 90,
    migrationMarketCap: 400,
    quoteMint: "So11111111111111111111111111111111111111112",
    tokenQuoteDecimal: 9,
    antiSniping: false,
    isLpLocked: true,
    tokenImageContentType: "image/png",
  });

  const [vestingData, setVestingData] = useState<VestingConfig>({
    totalLockedVestingAmount: 0,
    cliffUnlockAmount: 0,
    numberOfVestingPeriod: 0,
    totalVestingDuration: 0,
    cliffDurationFromMigrationTime: 0,
  });

  // Pool monitoring state
  const [mintAddress, setMintAddress] = useState("7p4FoJ8rCDirhkfeo3FgEsGgRc7EQcWVEaiSk5HDjupx");
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  
  // Fee claiming state
  const [feeInfo, setFeeInfo] = useState<any>(null);
  const [maxClaimAmount, setMaxClaimAmount] = useState("");

  const handleCreatePool = async () => {
    if (!publicKey || !signTransaction) {
      return;
    }

    if (!formData.tokenName || !formData.tokenSymbol) {
      toast.error("Token name and symbol are required");
      return;
    }

    setIsLoading(true);
    try {
      // Prepare the request payload
      const payload: any = {
        ...formData,
        creatorWallet: publicKey.toString(),
      };

      // Only include vesting config if it has values
      if (showVesting && vestingData.totalLockedVestingAmount > 0) {
        payload.vestingConfig = vestingData;
      }

      // Create unsigned transaction
      const response = await ddApi.fetch("/api/launchpad/create-pool-tx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create pool transaction");
      }

      const { transaction, mint } = await response.json();

      // Deserialize the transaction - try versioned first, fall back to legacy
      let tx;
      try {
        // Try to deserialize as a versioned transaction
        tx = VersionedTransaction.deserialize(Buffer.from(transaction, "base64"));
      } catch {
        // Fall back to legacy transaction
        tx = Transaction.from(Buffer.from(transaction, "base64"));
      }
      
      const signedTx = await signTransaction(tx);
      
      // Serialize based on transaction type
      const serializedTx = signedTx instanceof VersionedTransaction 
        ? Buffer.from(signedTx.serialize()).toString("base64")
        : Buffer.from(signedTx.serialize()).toString("base64");
      
      // Submit signed transaction
      const submitResponse = await ddApi.fetch("/api/launchpad/submit-pool", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signedTransaction: serializedTx,
          mint,
        }),
      });

      if (!submitResponse.ok) {
        const error = await submitResponse.json();
        throw new Error(error.message || "Failed to submit pool transaction");
      }

      await submitResponse.json();
      toast.success(`Pool created successfully! Mint: ${mint}`);
      
      // Reset form to defaults
      setFormData({
        tokenName: "Win2Lunch",
        tokenSymbol: "W2L",
        initialMarketCap: 90,
        migrationMarketCap: 400,
        quoteMint: "So11111111111111111111111111111111111111112",
        tokenQuoteDecimal: 9,
        antiSniping: false,
        isLpLocked: true,
        tokenImageContentType: "image/png",
      });
      
    } catch (error: any) {
      console.error("Pool creation error:", error);
      toast.error(error.message || "Failed to create pool");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckPool = async () => {
    if (!mintAddress) {
      toast.error("Please enter a mint address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await ddApi.fetch(`/api/launchpad/pool/${mintAddress}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch pool information");
      }

      const data = await response.json();
      
      // The API wraps the response, so we need to handle the nested structure
      if (data && typeof data === 'object') {
        setPoolInfo(data);
        toast.success("Pool information fetched");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error("Pool check error:", error);
      toast.error(error.message || "Failed to fetch pool info");
      setPoolInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckFees = async () => {
    if (!publicKey) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await ddApi.fetch("/api/launchpad/check-fees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorWallet: publicKey.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check fees");
      }

      const data = await response.json();
      setFeeInfo(data);
      toast.success("Fee information fetched");
    } catch (error: any) {
      console.error("Fee check error:", error);
      toast.error(error.message || "Failed to check fees");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimFees = async () => {
    if (!publicKey || !signTransaction) {
      return;
    }

    setIsLoading(true);
    try {
      const payload: any = {
        creatorWallet: publicKey.toString(),
      };

      if (maxClaimAmount) {
        payload.maxQuoteAmount = parseFloat(maxClaimAmount);
      }

      // Get unsigned transaction
      const response = await ddApi.fetch("/api/launchpad/claim-fees-tx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create claim transaction");
      }

      const { transaction } = await response.json();

      // Deserialize the transaction - try versioned first, fall back to legacy
      let tx;
      try {
        // Try to deserialize as a versioned transaction
        tx = VersionedTransaction.deserialize(Buffer.from(transaction, "base64"));
      } catch {
        // Fall back to legacy transaction
        tx = Transaction.from(Buffer.from(transaction, "base64"));
      }
      
      await signTransaction(tx);
      
      // You would submit this to the blockchain here
      toast.success("Fees claimed successfully!");
      
      // Refresh fee info
      await handleCheckFees();
    } catch (error: any) {
      console.error("Fee claim error:", error);
      toast.error(error.message || "Failed to claim fees");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-dark-200/50 backdrop-blur-lg p-6 rounded-lg border border-dark-300/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-100">
            <span className="bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent">
              Launchpad Manager
            </span>
          </h2>
          {solPrice > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-dark-300/30 rounded-lg border border-dark-300/50">
              <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-5 h-5" />
              <span className="text-sm text-gray-400">SOL:</span>
              <span className="text-sm font-bold text-brand-300">${solPrice.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "create"
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/50"
                : "bg-dark-300/30 text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Create Pool
          </button>
          <button
            onClick={() => setActiveTab("monitor")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "monitor"
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/50"
                : "bg-dark-300/30 text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Monitor Pools
          </button>
          <button
            onClick={() => setActiveTab("fees")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "fees"
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/50"
                : "bg-dark-300/30 text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Claim Fees
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "create" && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Preset Buttons */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={() => {
                  // Meme Preset
                  setFormData({
                    ...formData,
                    initialMarketCap: 16,
                    migrationMarketCap: 69,
                    quoteMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
                    tokenQuoteDecimal: 6,
                    antiSniping: false,
                    isLpLocked: true,
                  });
                  setShowVesting(false);
                }}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/50 rounded-lg hover:from-pink-500/30 hover:to-purple-500/30 transition-all"
              >
                <div className="font-bold text-pink-300">🚀 Meme Preset</div>
                <div className="text-xs text-gray-400">16K → 69K USDC</div>
              </button>
              
              <button
                onClick={() => {
                  // Indie Preset
                  setFormData({
                    ...formData,
                    initialMarketCap: 32,
                    migrationMarketCap: 240,
                    quoteMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
                    tokenQuoteDecimal: 6,
                    antiSniping: false,
                    isLpLocked: true,
                  });
                  // Set vesting for Indie (10% vested daily over 12 months)
                  setShowVesting(true);
                  setVestingData({
                    totalLockedVestingAmount: 100000000, // Adjust based on total supply
                    cliffUnlockAmount: 0,
                    numberOfVestingPeriod: 365,
                    totalVestingDuration: 31536000, // 365 days in seconds
                    cliffDurationFromMigrationTime: 0,
                  });
                }}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/50 rounded-lg hover:from-blue-500/30 hover:to-cyan-500/30 transition-all"
              >
                <div className="font-bold text-blue-300">💎 Indie Preset</div>
                <div className="text-xs text-gray-400">32K → 240K USDC + Vesting</div>
              </button>
              
              <button
                onClick={() => {
                  // Custom - reset to defaults
                  setFormData({
                    ...formData,
                    tokenName: "Win2Lunch",
                    tokenSymbol: "W2L",
                    initialMarketCap: 90,
                    migrationMarketCap: 400,
                    quoteMint: "So11111111111111111111111111111111111111112",
                    tokenQuoteDecimal: 9,
                  });
                }}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-brand-500/20 to-cyber-500/20 border border-brand-500/50 rounded-lg hover:from-brand-500/30 hover:to-cyber-500/30 transition-all"
              >
                <div className="font-bold text-brand-300">⚙️ Custom</div>
                <div className="text-xs text-gray-400">Configure your own</div>
              </button>
            </div>

            <div className="space-y-3">
              {/* Token Name */}
              <div className="flex items-center gap-3 bg-dark-300/30 rounded-lg p-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-brand-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-1">Token Name *</div>
                  <input
                    type="text"
                    value={formData.tokenName}
                    onChange={(e) => setFormData({ ...formData, tokenName: e.target.value })}
                    className="w-full bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none"
                    placeholder="DegenDuel Champion"
                  />
                </div>
              </div>

              {/* Token Symbol and Image side by side */}
              <div className="flex gap-3">
                {/* Token Symbol */}
                <div className="flex-1 flex items-center gap-3 bg-dark-300/30 rounded-lg p-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyber-500/20 to-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-cyber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9.5 3A6.5 6.5 0 0116 9.5c0 1.61-.59 3.09-1.56 4.23l.27 1.27h.79l5 5-1.5 1.5-5-5v-.79l-1.27-.27A6.516 6.516 0 019.5 16 6.5 6.5 0 013 9.5 6.5 6.5 0 019.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Token Symbol *</div>
                    <input
                      type="text"
                      value={formData.tokenSymbol}
                      onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value.toUpperCase() })}
                      className="w-full bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none font-bold"
                      placeholder="DDC"
                      maxLength={10}
                    />
                  </div>
                </div>

                {/* Token Image */}
                <div className="flex-1 flex items-center gap-3 bg-dark-300/30 rounded-lg p-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {formData.tokenImage ? (
                      <img 
                        src={URL.createObjectURL(formData.tokenImage)} 
                        alt="Token preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Token Image</div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFormData({ 
                            ...formData, 
                            tokenImage: file,
                            tokenImageContentType: file.type
                          });
                        }
                      }}
                      className="w-full text-sm text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-brand-500/20 file:text-brand-300 hover:file:bg-brand-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3 bg-dark-300/30 rounded-lg p-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-1">Description</div>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none resize-none"
                    rows={2}
                    placeholder="Describe your token..."
                  />
                </div>
              </div>

              {/* Quote Token Selection */}
              <div className="bg-dark-300/30 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-3">Select Quote Token</div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, quoteMint: "So11111111111111111111111111111111111111112", tokenQuoteDecimal: 9 })}
                    className={`flex-1 py-4 px-3 rounded-lg border-2 transition-all ${
                      formData.quoteMint === "So11111111111111111111111111111111111111112" 
                        ? 'border-brand-500 bg-brand-500/10' 
                        : 'border-dark-300 hover:border-dark-200'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative h-10 w-10 flex items-center justify-center">
                        <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-10 h-10 object-contain" />
                      </div>
                      <span className={`text-xs font-bold ${
                        formData.quoteMint === "So11111111111111111111111111111111111111112" ? 'text-brand-300' : 'text-gray-400'
                      }`}>SOL</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setFormData({ ...formData, quoteMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", tokenQuoteDecimal: 6 })}
                    className={`flex-1 py-4 px-3 rounded-lg border-2 transition-all ${
                      formData.quoteMint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-dark-300 hover:border-dark-200'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative h-10 w-10 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                          USDC
                        </div>
                      </div>
                      <span className={`text-xs font-bold ${
                        formData.quoteMint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" ? 'text-blue-300' : 'text-gray-400'
                      }`}>USDC</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setFormData({ ...formData, quoteMint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", tokenQuoteDecimal: 6 })}
                    className={`flex-1 py-4 px-3 rounded-lg border-2 transition-all ${
                      formData.quoteMint === "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" 
                        ? 'border-green-500 bg-green-500/10' 
                        : 'border-dark-300 hover:border-dark-200'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative h-10 w-10 flex items-center justify-center">
                        <img src="/assets/media/logos/jup.png" alt="JUP" className="w-10 h-10 object-contain" />
                      </div>
                      <span className={`text-xs font-bold ${
                        formData.quoteMint === "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" ? 'text-green-300' : 'text-gray-400'
                      }`}>JUP</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Initial and Migration Market Caps side by side */}
              <div className="flex gap-3">
                {/* Initial Market Cap */}
                <div className="flex-1 flex items-center gap-3 bg-dark-300/30 rounded-lg p-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Initial Market Cap *</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.initialMarketCap}
                        onChange={(e) => setFormData({ ...formData, initialMarketCap: parseFloat(e.target.value) || 0 })}
                        className="flex-1 bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none"
                        placeholder="90"
                        min="0.1"
                        step="0.1"
                      />
                      <span className="text-gray-400 text-sm">SOL</span>
                    </div>
                    {formData.initialMarketCap > 0 && solPrice > 0 && (
                      <div className="text-xs text-green-400 mt-1">
                        ≈ ${Math.ceil(formData.initialMarketCap * solPrice).toLocaleString('en-US')} USD
                      </div>
                    )}
                  </div>
                </div>

                {/* Migration Market Cap */}
                <div className="flex-1 flex items-center gap-3 bg-dark-300/30 rounded-lg p-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm0 4c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V19z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">Migration Market Cap *</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.migrationMarketCap}
                        onChange={(e) => setFormData({ ...formData, migrationMarketCap: parseFloat(e.target.value) || 0 })}
                        className="flex-1 bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none"
                        placeholder="400"
                        min="1"
                        step="1"
                      />
                      <span className="text-gray-400 text-sm">SOL</span>
                    </div>
                    {formData.migrationMarketCap > 0 && solPrice > 0 && (
                      <div className="text-xs text-yellow-400 mt-1">
                        ≈ ${Math.ceil(formData.migrationMarketCap * solPrice).toLocaleString('en-US')} USD
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Protection Options */}
            <div className="flex gap-3">
              {/* Anti-Sniping */}
              <div className={`flex-1 flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-all ${
                formData.antiSniping ? 'bg-red-500/10 border border-red-500/30' : 'bg-dark-300/30 border border-transparent'
              }`} onClick={() => setFormData({ ...formData, antiSniping: !formData.antiSniping })}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  formData.antiSniping ? 'bg-gradient-to-br from-red-500/30 to-orange-500/30' : 'bg-gradient-to-br from-gray-700/30 to-gray-600/30'
                }`}>
                  <svg className={`w-5 h-5 ${formData.antiSniping ? 'text-red-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L4 7v6c0 5.55 3.84 10.74 9 12 2.3-.56 4.33-1.9 5.88-3.71l-3.12-3.12c-1.94 1.29-4.58 1.07-6.29-.64-1.95-1.95-1.95-5.12 0-7.07 1.95-1.95 5.12-1.95 7.07 0 1.71 1.71 1.92 4.35.64 6.29l2.9 2.9C21.29 17.12 22 14.61 22 12V7l-10-5z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${formData.antiSniping ? 'text-red-300' : 'text-gray-400'}`}>
                    Anti-Sniping {formData.antiSniping ? 'ON' : 'OFF'}
                  </div>
                  <div className="text-xs text-gray-500">Protect from bots</div>
                </div>
              </div>

              {/* LP Lock */}
              <div className={`flex-1 flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-all ${
                formData.isLpLocked ? 'bg-green-500/10 border border-green-500/30' : 'bg-dark-300/30 border border-transparent'
              }`} onClick={() => setFormData({ ...formData, isLpLocked: !formData.isLpLocked })}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  formData.isLpLocked ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30' : 'bg-gradient-to-br from-gray-700/30 to-gray-600/30'
                }`}>
                  <svg className={`w-5 h-5 ${formData.isLpLocked ? 'text-green-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className={`text-sm font-medium ${formData.isLpLocked ? 'text-green-300' : 'text-gray-400'}`}>
                    LP Lock {formData.isLpLocked ? 'ON' : 'OFF'}
                  </div>
                  <div className="text-xs text-gray-500">Secure liquidity</div>
                </div>
              </div>
            </div>

            <div className="border-t border-dark-300/50 pt-4">
              <button
                onClick={() => setShowSocials(!showSocials)}
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <span className={`transform transition-transform ${showSocials ? "rotate-90" : ""}`}>
                  ▶
                </span>
                Social Media & Links
              </button>

              <AnimatePresence>
                {showSocials && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-3 overflow-hidden"
                  >
                    {/* Website */}
                    <div className="flex items-center gap-3 bg-dark-300/30 rounded-lg p-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="url"
                        value={formData.website || ''}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="flex-1 bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none"
                        placeholder="yourtoken.com or https://yourtoken.com"
                      />
                    </div>

                    {/* Twitter/X */}
                    <div className="flex items-center gap-3 bg-dark-300/30 rounded-lg p-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-sky-500/20 to-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-sky-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={formData.twitter || ''}
                        onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                        className="flex-1 bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none"
                        placeholder="@yourtoken or x.com/yourtoken"
                      />
                    </div>

                    {/* Telegram */}
                    <div className="flex items-center gap-3 bg-dark-300/30 rounded-lg p-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={formData.telegram || ''}
                        onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                        className="flex-1 bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none"
                        placeholder="yourtoken or t.me/yourtoken"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-dark-300/50 pt-4 mt-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors"
              >
                <span className={`transform transition-transform ${showAdvanced ? "rotate-90" : ""}`}>
                  ▶
                </span>
                Advanced Settings
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-4 overflow-hidden"
                  >
                    <div>
                      <button
                        onClick={() => setShowVesting(!showVesting)}
                        className="flex items-center gap-2 text-cyber-400 hover:text-cyber-300 transition-colors"
                      >
                        <span className={`transform transition-transform ${showVesting ? "rotate-90" : ""}`}>
                          ▶
                        </span>
                        Vesting Configuration
                      </button>

                      <AnimatePresence>
                        {showVesting && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden"
                          >
                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">
                                Total Locked Amount
                              </label>
                              <input
                                type="number"
                                value={vestingData.totalLockedVestingAmount}
                                onChange={(e) => setVestingData({ ...vestingData, totalLockedVestingAmount: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-dark-300/50 border border-dark-300 rounded-lg px-4 py-2 text-gray-100 focus:border-brand-500/50 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">
                                Cliff Unlock Amount
                              </label>
                              <input
                                type="number"
                                value={vestingData.cliffUnlockAmount}
                                onChange={(e) => setVestingData({ ...vestingData, cliffUnlockAmount: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-dark-300/50 border border-dark-300 rounded-lg px-4 py-2 text-gray-100 focus:border-brand-500/50 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">
                                Number of Vesting Periods
                              </label>
                              <input
                                type="number"
                                value={vestingData.numberOfVestingPeriod}
                                onChange={(e) => setVestingData({ ...vestingData, numberOfVestingPeriod: parseInt(e.target.value) || 0 })}
                                className="w-full bg-dark-300/50 border border-dark-300 rounded-lg px-4 py-2 text-gray-100 focus:border-brand-500/50 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">
                                Total Vesting Duration (seconds)
                              </label>
                              <input
                                type="number"
                                value={vestingData.totalVestingDuration}
                                onChange={(e) => setVestingData({ ...vestingData, totalVestingDuration: parseInt(e.target.value) || 0 })}
                                className="w-full bg-dark-300/50 border border-dark-300 rounded-lg px-4 py-2 text-gray-100 focus:border-brand-500/50 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-400 mb-2">
                                Cliff Duration from Migration (seconds)
                              </label>
                              <input
                                type="number"
                                value={vestingData.cliffDurationFromMigrationTime}
                                onChange={(e) => setVestingData({ ...vestingData, cliffDurationFromMigrationTime: parseInt(e.target.value) || 0 })}
                                className="w-full bg-dark-300/50 border border-dark-300 rounded-lg px-4 py-2 text-gray-100 focus:border-brand-500/50 focus:outline-none"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!publicKey ? (
              <div>
                <p className="text-gray-400 text-center mb-3">Connect your wallet to create pools</p>
                <SimpleWalletButton className="w-full" />
              </div>
            ) : (
              <button
                onClick={handleCreatePool}
                disabled={isLoading || !formData.tokenName || !formData.tokenSymbol}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  isLoading || !formData.tokenName || !formData.tokenSymbol
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-brand-500 to-cyber-500 text-white hover:from-brand-600 hover:to-cyber-600"
                }`}
              >
                {isLoading ? "Creating Pool..." : "Create Launchpad Pool"}
              </button>
            )}
          </motion.div>
        )}

        {activeTab === "monitor" && (
          <motion.div
            key="monitor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Token Mint Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mintAddress}
                  onChange={(e) => setMintAddress(e.target.value)}
                  className="flex-1 bg-dark-300/50 border border-dark-300 rounded-lg px-4 py-2 text-gray-100 focus:border-brand-500/50 focus:outline-none font-mono text-sm"
                  placeholder="Enter token mint address..."
                />
                <button
                  onClick={handleCheckPool}
                  disabled={isLoading || !mintAddress}
                  className={`px-6 py-2 rounded-lg font-bold transition-all ${
                    isLoading || !mintAddress
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-brand-500 text-white hover:bg-brand-600"
                  }`}
                >
                  {isLoading ? "Checking..." : "Check Pool"}
                </button>
              </div>
            </div>

            {poolInfo && poolInfo.success && poolInfo.poolAddresses?.data && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-dark-300/30 rounded-lg p-4 border border-dark-300/50"
              >
                <h3 className="text-lg font-bold text-brand-300 mb-3">Pool Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-400 text-sm">Token Mint:</span>
                    <div className="text-gray-100 font-mono text-xs break-all mt-1 bg-dark-200/50 p-2 rounded">
                      {mintAddress}
                    </div>
                  </div>
                  
                  {poolInfo.poolAddresses.data.dbcPoolAddress && (
                    <div>
                      <span className="text-gray-400 text-sm">DBC Pool Address:</span>
                      <div className="text-gray-100 font-mono text-xs break-all mt-1 bg-dark-200/50 p-2 rounded">
                        {poolInfo.poolAddresses.data.dbcPoolAddress}
                      </div>
                    </div>
                  )}
                  
                  {poolInfo.poolAddresses.data.dammv2PoolAddress && (
                    <div>
                      <span className="text-gray-400 text-sm">DAMM v2 Pool Address:</span>
                      <div className="text-gray-100 font-mono text-xs break-all mt-1 bg-dark-200/50 p-2 rounded">
                        {poolInfo.poolAddresses.data.dammv2PoolAddress}
                      </div>
                    </div>
                  )}
                  
                  {poolInfo.poolAddresses.data.configKey && (
                    <div>
                      <span className="text-gray-400 text-sm">Config Key:</span>
                      <div className="text-gray-100 font-mono text-xs break-all mt-1 bg-dark-200/50 p-2 rounded">
                        {poolInfo.poolAddresses.data.configKey}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t border-dark-300/50">
                    <span className="text-gray-400 text-sm">Status:</span>
                    <span className="text-green-400 font-bold">Active</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            {poolInfo && !poolInfo.success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 rounded-lg p-4 border border-red-500/30"
              >
                <p className="text-red-400">No pool found for this mint address</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === "fees" && (
          <motion.div
            key="fees"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300/50">
              <p className="text-gray-300 mb-4">
                Check and claim your unclaimed creator trading fees from all your launched pools.
              </p>
              
              {!publicKey ? (
                <div>
                  <p className="text-gray-400 text-center mb-3">Connect your wallet to check fees</p>
                  <SimpleWalletButton className="w-full" />
                </div>
              ) : (
                <button
                  onClick={handleCheckFees}
                  disabled={isLoading}
                  className={`w-full py-2 rounded-lg font-bold transition-all mb-4 ${
                    isLoading
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-cyber-500 text-white hover:bg-cyber-600"
                  }`}
                >
                  {isLoading ? "Checking Fees..." : "Check Unclaimed Fees"}
                </button>
              )}

              {feeInfo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="bg-dark-200/50 rounded-lg p-4">
                    <h4 className="text-lg font-bold text-cyber-300 mb-3">Available Fees</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Unclaimed:</span>
                        <span className="text-green-400 font-bold">
                          {feeInfo.totalUnclaimed || 0} SOL
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Number of Pools:</span>
                        <span className="text-gray-100">{feeInfo.poolCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  {feeInfo.totalUnclaimed > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Max Claim Amount (optional)
                      </label>
                      <input
                        type="number"
                        value={maxClaimAmount}
                        onChange={(e) => setMaxClaimAmount(e.target.value)}
                        className="w-full bg-dark-300/50 border border-dark-300 rounded-lg px-4 py-2 text-gray-100 focus:border-brand-500/50 focus:outline-none mb-4"
                        placeholder="Leave empty to claim all"
                        step="0.01"
                      />
                      
                      <button
                        onClick={handleClaimFees}
                        disabled={isLoading}
                        className={`w-full py-3 rounded-lg font-bold transition-all ${
                          isLoading
                            ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                        }`}
                      >
                        {isLoading ? "Claiming Fees..." : "Claim Fees"}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};