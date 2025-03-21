import { useState } from "react";

import { ContestSelect } from "./ContestContext";
import { ResponseDisplay } from "./ResponseDisplay";
import { WalletInput } from "./WalletInput";

export function JoinContest() {
  const [selectedContestId, setSelectedContestId] = useState<number | "">("");
  const [walletAddress, setWalletAddress] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const handleJoinContest = async () => {
    if (!selectedContestId) {
      alert("Please select a contest first");
      return;
    }
    if (!walletAddress) {
      alert("Please enter a wallet address");
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `https://degenduel.me/api/contests/${selectedContestId}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet_address: walletAddress }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw data;
      setResponse(data);
    } catch (err) {
      setError(err);
      console.error("Join Contest Error:", err);
    }
  };

  return (
    <section className="bg-dark-300/20 rounded-lg p-6 backdrop-blur-sm border border-dark-300/50 group hover:bg-dark-300/30 transition-all duration-300 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-cyber-500/5 group-hover:opacity-100 opacity-0 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] opacity-20" />

      <div className="relative">
        <h2 className="text-2xl font-semibold text-cyber-400 mb-6 group-hover:animate-glitch flex items-center gap-2">
          <span className="text-2xl group-hover:animate-bounce">🎮</span>
          Join Contest
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="group/input">
            <label className="text-neon-300 mb-2 block text-sm group-hover/input:animate-cyber-pulse">
              Select Contest
            </label>
            <ContestSelect
              value={selectedContestId}
              onChange={setSelectedContestId}
              className="w-full bg-dark-400/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 border border-dark-300/50 hover:border-brand-500/50 transition-all duration-300 placeholder-gray-500"
            />
          </div>

          <div className="group/input">
            <label className="text-neon-300 mb-2 block text-sm group-hover/input:animate-cyber-pulse">
              Wallet Address
            </label>
            <WalletInput
              value={walletAddress}
              onChange={setWalletAddress}
              placeholder="Enter wallet address"
            />
          </div>
        </div>

        <button
          onClick={handleJoinContest}
          disabled={!selectedContestId || !walletAddress}
          className="bg-gradient-to-r from-brand-500 to-cyber-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-brand-500/20 group-hover:animate-cyber-pulse flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
        >
          <span className="text-xl">🎮</span>
          Join Contest
        </button>

        <ResponseDisplay response={response} error={error} />
      </div>
    </section>
  );
}
