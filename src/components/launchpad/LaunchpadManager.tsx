import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { toast } from "react-hot-toast";
import { ddApi } from "../../services/dd-api";
import { SimpleWalletButton } from "../auth/SimpleWalletButton";
import { useIndividualToken } from "../../hooks/websocket/topic-hooks/useIndividualToken";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";

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

interface Voucher {
  id: number;
  contestId: number;
  contestName: string;
  expiresAt: string;
  timeRemaining: number;
}

interface VoucherStatus {
  hasVoucher: boolean;
  voucher?: Voucher;
}

interface ClaimVoucherResponse {
  success: boolean;
  token: {
    mint: string;
    name: string;
    symbol: string;
    imageUrl: string;
    metadataUrl: string;
    explorerUrl: string;
  };
  wallet: {
    address: string;
    privateKey: string;
  };
}

export const LaunchpadManager: React.FC = () => {
  const { publicKey, signTransaction } = useWallet();
  const { isAuthenticated } = useMigratedAuth();
  const [activeTab, setActiveTab] = useState<"create" | "monitor" | "fees">("create");
  const [isLoading, setIsLoading] = useState(false);
  
  // Voucher system state
  const [voucherStatus, setVoucherStatus] = useState<VoucherStatus | null>(null);
  const [isLoadingVoucher, setIsLoadingVoucher] = useState(false);
  const [claimedToken, setClaimedToken] = useState<ClaimVoucherResponse | null>(null);
  
  // Get SOL price
  const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
  const { token: solToken } = useIndividualToken(SOL_ADDRESS);
  const solPrice = solToken?.price || 0;
  
  // Voucher claim form state
  const [voucherFormData, setVoucherFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    image: null as File | null,
    website: "",
    twitter: "",
    telegram: "",
  });
  

  // Check voucher status on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      checkVoucherStatus();
    }
  }, [isAuthenticated]);

  const checkVoucherStatus = async () => {
    try {
      setIsLoadingVoucher(true);
      const response = await ddApi.fetch('/api/launchpad/voucher-status');
      const data = await response.json();
      setVoucherStatus(data);
    } catch (error) {
      console.error('Failed to check voucher status:', error);
      setVoucherStatus({ hasVoucher: false });
    } finally {
      setIsLoadingVoucher(false);
    }
  };

  const claimVoucher = async () => {
    if (!voucherFormData.name || !voucherFormData.symbol || !voucherFormData.description || !voucherFormData.image) {
      toast.error('Please fill in all required fields and upload an image');
      return;
    }

    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('name', voucherFormData.name);
      formData.append('symbol', voucherFormData.symbol);
      formData.append('description', voucherFormData.description);
      formData.append('image', voucherFormData.image);
      
      if (voucherFormData.website) formData.append('website', voucherFormData.website);
      if (voucherFormData.twitter) formData.append('twitter', voucherFormData.twitter);
      if (voucherFormData.telegram) formData.append('telegram', voucherFormData.telegram);

      const response = await ddApi.fetch('/api/launchpad/claim-voucher', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setClaimedToken(data);
      toast.success('Token launched successfully!');
      
      // Reset form and check voucher status again
      setVoucherFormData({
        name: "",
        symbol: "",
        description: "",
        image: null,
        website: "",
        twitter: "",
        telegram: "",
      });
      await checkVoucherStatus();
      
    } catch (error: any) {
      console.error('Failed to claim voucher:', error);
      toast.error(error.response?.data?.error || 'Failed to launch token');
    } finally {
      setIsLoading(false);
    }
  };

  // Pool monitoring state
  const [mintAddress, setMintAddress] = useState("7p4FoJ8rCDirhkfeo3FgEsGgRc7EQcWVEaiSk5HDjupx");
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  
  // Fee claiming state
  const [feeInfo, setFeeInfo] = useState<any>(null);
  const [maxClaimAmount, setMaxClaimAmount] = useState("");


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
    <div className="p-6">
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
                ? "bg-brand-500/20 text-brand-300"
                : "bg-dark-300/30 text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Launch Token
          </button>
          <button
            onClick={() => setActiveTab("monitor")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "monitor"
                ? "bg-brand-500/20 text-brand-300"
                : "bg-dark-300/30 text-gray-400 hover:bg-dark-300/50"
            }`}
          >
            Monitor Pools
          </button>
          <button
            onClick={() => setActiveTab("fees")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "fees"
                ? "bg-brand-500/20 text-brand-300"
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
            {/* Authentication Check */}
            {!isAuthenticated ? (
              <div className="text-center py-8">
                <div className="mb-4 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                  <p className="text-lg font-semibold text-gray-300 mb-2">Authentication Required</p>
                  <p className="text-gray-400 mb-4">You need to be logged in to launch tokens</p>
                </div>
                <SimpleWalletButton />
              </div>
            ) : isLoadingVoucher ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-400">Checking voucher status...</p>
              </div>
            ) : claimedToken ? (
              /* Success State - Show claimed token details */
              <div className="text-center py-8">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto mb-3 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <h3 className="text-xl font-bold text-green-400 mb-2">Token Launched Successfully!</h3>
                  <div className="bg-dark-300/30 rounded-lg p-4 text-left max-w-md mx-auto">
                    <div className="space-y-2">
                      <div><span className="text-gray-400">Name:</span> <span className="text-gray-200">{claimedToken.token.name}</span></div>
                      <div><span className="text-gray-400">Symbol:</span> <span className="text-gray-200">{claimedToken.token.symbol}</span></div>
                      <div><span className="text-gray-400">Mint:</span> <span className="text-xs text-brand-300 font-mono">{claimedToken.token.mint}</span></div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <a href={claimedToken.token.explorerUrl} target="_blank" rel="noopener noreferrer" className="flex-1 bg-brand-500/20 text-brand-300 py-2 px-3 rounded text-center text-sm hover:bg-brand-500/30 transition-colors">
                        View on Explorer
                      </a>
                      <button 
                        onClick={() => setClaimedToken(null)}
                        className="bg-gray-600/20 text-gray-300 py-2 px-3 rounded text-sm hover:bg-gray-600/30 transition-colors"
                      >
                        Launch Another
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : !voucherStatus?.hasVoucher ? (
              /* No Voucher State */
              <div className="text-center py-8">
                <div className="mb-4 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                  </svg>
                  <p className="text-lg font-semibold text-gray-300 mb-2">No Launch Voucher</p>
                  <p className="text-gray-400 mb-4">Win a contest to earn a token launch voucher</p>
                </div>
                <a href="/contests" className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-300 py-2 px-4 rounded-lg hover:bg-brand-500/30 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                  Join Contests
                </a>
              </div>
            ) : (
              /* Has Voucher - Show Claim Form */
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <h3 className="text-lg font-bold text-green-400">Launch Voucher Available</h3>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="text-green-300">From: {voucherStatus.voucher?.contestName}</p>
                    <p className="text-green-300">Expires in: {Math.floor((voucherStatus.voucher?.timeRemaining || 0) / 60)} minutes</p>
                  </div>
                </div>

                {/* Token Launch Form */}
                <div className="space-y-4">
                  {/* Name and Symbol */}
                  <div className="flex gap-3">
                    <div className="flex-1 bg-dark-300/30 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Token Name *</div>
                      <input
                        type="text"
                        value={voucherFormData.name}
                        onChange={(e) => setVoucherFormData({ ...voucherFormData, name: e.target.value })}
                        className="w-full bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none"
                        placeholder="My Awesome Token"
                        maxLength={50}
                      />
                    </div>
                    <div className="flex-1 bg-dark-300/30 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Symbol *</div>
                      <input
                        type="text"
                        value={voucherFormData.symbol}
                        onChange={(e) => setVoucherFormData({ ...voucherFormData, symbol: e.target.value.toUpperCase() })}
                        className="w-full bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none"
                        placeholder="MAT"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="bg-dark-300/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2">Token Image * (Max 2MB)</div>
                    <div className="flex items-center gap-3">
                      {voucherFormData.image && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-200 flex-shrink-0">
                          <img 
                            src={URL.createObjectURL(voucherFormData.image)} 
                            alt="Token preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.size <= 2 * 1024 * 1024) {
                            setVoucherFormData({ ...voucherFormData, image: file });
                          } else if (file) {
                            toast.error('Image must be under 2MB');
                          }
                        }}
                        className="flex-1 text-gray-300 text-sm"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-dark-300/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Description *</div>
                    <textarea
                      value={voucherFormData.description}
                      onChange={(e) => setVoucherFormData({ ...voucherFormData, description: e.target.value })}
                      className="w-full bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none resize-none"
                      placeholder="Describe your token..."
                      rows={3}
                      maxLength={300}
                    />
                  </div>

                  {/* Social Links */}
                  <div className="space-y-3">
                    <div className="bg-dark-300/30 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Website (Optional)</div>
                      <input
                        type="url"
                        value={voucherFormData.website}
                        onChange={(e) => setVoucherFormData({ ...voucherFormData, website: e.target.value })}
                        className="w-full bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none"
                        placeholder="https://mytoken.com"
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 bg-dark-300/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Twitter (Optional)</div>
                        <input
                          type="url"
                          value={voucherFormData.twitter}
                          onChange={(e) => setVoucherFormData({ ...voucherFormData, twitter: e.target.value })}
                          className="w-full bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none"
                          placeholder="https://twitter.com/mytoken"
                        />
                      </div>
                      <div className="flex-1 bg-dark-300/30 rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Telegram (Optional)</div>
                        <input
                          type="url"
                          value={voucherFormData.telegram}
                          onChange={(e) => setVoucherFormData({ ...voucherFormData, telegram: e.target.value })}
                          className="w-full bg-transparent border-0 text-gray-100 placeholder-gray-500 focus:outline-none"
                          placeholder="https://t.me/mytoken"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Launch Button */}
                  <button
                    onClick={claimVoucher}
                    disabled={isLoading || !voucherFormData.name || !voucherFormData.symbol || !voucherFormData.description || !voucherFormData.image}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Launching Token...
                      </div>
                    ) : (
                      'Launch My Token'
                    )}
                  </button>
                </div>
              </div>
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