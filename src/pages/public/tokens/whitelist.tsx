import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  CharacterRoom,
  UNSAFE_initAccessToken,
} from "@virtual-protocol/react-virtual-ai";
import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { BackgroundEffects } from "../../../components/animated-background/BackgroundEffects";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { TOKEN_SUBMISSION_COST, TREASURY_WALLET } from "../../../config/config";
import { useStore } from "../../../store/useStore";
// Provide types for window.solana
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      signMessage: (
        message: Uint8Array,
        encoding: string
      ) => Promise<{ signature: Uint8Array }>;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
      publicKey?: { toString: () => string };
    };
  }
}

const BASE_SUBMISSION_COST = TOKEN_SUBMISSION_COST;
const RECIPIENT_WALLET = new PublicKey(TREASURY_WALLET);
const RPC_ENDPOINT =
  import.meta.env.VITE_SOLANA_RPC_MAINNET ||
  "https://api.mainnet-beta.solana.com";

// Maximum discount percentage (cap at 50%)
const MAX_DISCOUNT_PERCENT = 50;

export const TokenWhitelistPage: React.FC = () => {
  const { user, connectWallet, achievements } = useStore();
  const [contractAddress, setContractAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const walletAddress = user?.wallet_address;
  const isConnected = !!walletAddress;

  // Calculate discount based on user level
  const { discountPercent, finalCost } = useMemo(() => {
    // Default values if user is not connected or no level data
    if (!isConnected || !achievements.userProgress) {
      return { discountPercent: 0, finalCost: BASE_SUBMISSION_COST };
    }

    // Calculate discount: 1% per level, capped at MAX_DISCOUNT_PERCENT
    const userLevel = achievements.userProgress.level;
    const discountPercent = Math.min(userLevel, MAX_DISCOUNT_PERCENT);

    // Calculate final cost with discount
    const discountMultiplier = (100 - discountPercent) / 100;
    const finalCost = BASE_SUBMISSION_COST * discountMultiplier;

    // Round to 2 decimal places for display
    return {
      discountPercent,
      finalCost: Math.max(finalCost, 0.01), // Ensure minimum cost of 0.01 SOL
    };
  }, [isConnected, achievements.userProgress]);

  const handleSubmit = async () => {
    if (!isConnected) {
      toast("Please connect your wallet to continue", {
        icon: "👛",
        style: {
          background: "#333",
          color: "#fff",
        },
      });

      try {
        // Use the global connectWallet function from store
        await connectWallet();
        return; // Return after connecting since we need to let state update
      } catch (err) {
        console.error("Failed to connect wallet:", err);
        return;
      }
    }

    if (!contractAddress) {
      toast.error("Please enter a token address!");
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Create and send payment transaction
      const connection = new Connection(RPC_ENDPOINT, "confirmed");
      const { blockhash } = await connection.getLatestBlockhash("finalized");

      // Get the user's public key
      const walletPublicKey = new PublicKey(walletAddress);

      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPublicKey;

      // Add transfer instruction with discounted amount
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: RECIPIENT_WALLET,
          lamports: finalCost * 1e9, // Convert SOL to lamports with discount applied
        })
      );

      // Check if window.solana is available for transaction signing
      if (!window.solana?.signTransaction) {
        throw new Error("Wallet does not support transaction signing");
      }

      // Sign and send transaction
      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature);
      if (confirmation.value.err) {
        throw new Error("Transaction failed!");
      }

      // 2. Submit to our API with the new endpoint
      const response = await fetch(
        "https://data.degenduel.me/api/tokens/add-to-whitelist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.jwt || ""}`, // Send JWT for server-side authentication
          },
          body: JSON.stringify({
            contractAddress,
            chain: "SOLANA",
            transactionSignature: signature,
            // Don't send client-calculated discount - server will verify user level and calculate discount
            // The server should verify:
            // 1. That the transaction amount matches what's expected for the user's level
            // 2. That the transaction was successful and sent to the correct wallet
          }),
          credentials: "include",
        }
      );

      console.log(response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `API Error: ${response.status} ${response.statusText}`
        );
      }

      // 3. Show success and redirect
      toast.success(
        `Successfully submitted token! It will be available in games shortly.`,
        {
          duration: 5000,
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #262626",
          },
        }
      );

      // Add delay before navigation
      setTimeout(() => {
        navigate("/tokens");
      }, 5000);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit token"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <BackgroundEffects />

      {/* Content Section */}
      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-white">List Your Token</h1>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Get your token listed on DegenDuel for immediate exposure and
                inclusion in our games. Your token will be tracked and available
                for all players to use in their portfolios.
              </p>
            </div>

            {/* Main Card */}
            <Card className="bg-dark-200/50 backdrop-blur-sm p-6">
              <div className="space-y-6">
                {/* Benefits Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-dark-300/30 rounded-lg p-4">
                    <h3 className="text-brand-400 font-bold mb-2">
                      Instant Listing
                    </h3>
                    <p className="text-sm text-gray-400">
                      Your token will be immediately added to our tracking
                      system and available in games
                    </p>
                  </div>
                  <div className="bg-dark-300/30 rounded-lg p-4">
                    <h3 className="text-brand-400 font-bold mb-2">
                      Increased Visibility
                    </h3>
                    <p className="text-sm text-gray-400">
                      Expose your token to active traders and gaming enthusiasts
                    </p>
                  </div>
                  <div className="bg-dark-300/30 rounded-lg p-4">
                    <h3 className="text-brand-400 font-bold mb-2">
                      Real-time Tracking
                    </h3>
                    <p className="text-sm text-gray-400">
                      Get comprehensive market data and analytics for your token
                    </p>
                  </div>
                </div>

                {/* Submission Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Token Contract Address
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter Solana token address..."
                      value={contractAddress}
                      onChange={(e) => setContractAddress(e.target.value)}
                      className="w-full bg-dark-300/30 border-dark-300"
                    />
                  </div>

                  <div className="bg-dark-300/30 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Listing Fee</span>
                      <div className="text-right">
                        <span className="text-white font-bold">
                          {finalCost.toFixed(2)} SOL
                        </span>
                        {discountPercent > 0 && (
                          <div className="text-xs text-brand-400">
                            {discountPercent}% level discount applied!
                          </div>
                        )}
                      </div>
                    </div>

                    {isConnected && achievements.userProgress && (
                      <div className="mt-2 text-xs text-gray-400 flex justify-between">
                        <span>
                          Your level: {achievements.userProgress.level}
                        </span>
                        <span>Base price: {BASE_SUBMISSION_COST} SOL</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : !isConnected ? (
                      "Connect Wallet & Submit"
                    ) : (
                      "Submit Token"
                    )}
                  </Button>
                </div>

                {/* Terms and Info */}
                <div className="text-sm text-gray-500 space-y-2">
                  <p>
                    • Tokens are reviewed for basic compatibility but listing is
                    not an endorsement
                  </p>
                  <p>
                    • The listing fee is non-refundable and helps maintain our
                    services
                  </p>
                  <p>• Currently accepting Solana tokens only</p>
                  <p>
                    • Higher user levels receive discounts on listing fees (1%
                    per level)
                  </p>
                </div>
              </div>
            </Card>
            <div className="mt-8">
              <CharacterRoom
                initAccessToken={UNSAFE_initAccessToken}
                userName="Branch"
                virtualId={1}
                virtualName="Virtual Branch"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
