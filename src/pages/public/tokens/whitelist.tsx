import { useWallet } from "@solana/wallet-adapter-react";
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
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { BackgroundEffects } from "../../../components/animated-background/BackgroundEffects";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { TOKEN_SUBMISSION_COST, TREASURY_WALLET } from "../../../config/config";
import { ddApi } from "../../../services/dd-api";

const SUBMISSION_COST = TOKEN_SUBMISSION_COST;
const RECIPIENT_WALLET = new PublicKey(TREASURY_WALLET);
const RPC_ENDPOINT =
  import.meta.env.VITE_SOLANA_RPC_MAINNET ||
  "https://api.mainnet-beta.solana.com";

export const TokenWhitelistPage: React.FC = () => {
  const { publicKey: walletPublicKey, signTransaction } = useWallet();
  const [contractAddress, setContractAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!walletPublicKey || !signTransaction) {
      toast.error("Please connect your wallet first!");
      return;
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

      const transaction = new Transaction();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletPublicKey;

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: RECIPIENT_WALLET,
          lamports: SUBMISSION_COST * 1e9, // Convert SOL to lamports
        })
      );

      // Sign and send transaction
      const signed = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature);
      if (confirmation.value.err) {
        throw new Error("Transaction failed!");
      }

      // 2. Submit to our API with the new endpoint
      const response = await ddApi.fetch(
        "https://data.degenduel.me/api/tokens/add-to-whitelist",
        {
          method: "POST",
          body: JSON.stringify({
            contractAddress,
            chain: "SOLANA",
            transactionSignature: signature,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to whitelist token");
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
                      <span className="text-white font-bold">
                        {SUBMISSION_COST} SOL
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !walletPublicKey}
                    className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : !walletPublicKey ? (
                      "Connect Wallet to Submit"
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
                    • The {SUBMISSION_COST} SOL fee is non-refundable and helps
                    maintain our services
                  </p>
                  <p>• Currently accepting Solana tokens only</p>
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
