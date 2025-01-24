import { useState } from "react";
import { ContestSelect } from "./ContestContext";
import { ResponseDisplay } from "./ResponseDisplay";
import { WalletInput } from "./WalletInput";

export function GetPortfolio() {
  const [selectedContestId, setSelectedContestId] = useState<number | "">("");
  const [walletAddress, setWalletAddress] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const handleGetPortfolio = async () => {
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
        `https://degenduel.me/api/contests/${selectedContestId}/portfolio/${walletAddress}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (!response.ok) throw data;
      setResponse(data);
    } catch (err) {
      setError(err);
      console.error("Get Portfolio Error:", err);
    }
  };

  return (
    <section className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Get Portfolio</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-gray-400 mb-1 block">Select Contest</label>
          <ContestSelect
            value={selectedContestId}
            onChange={setSelectedContestId}
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">Wallet Address</label>
          <WalletInput
            value={walletAddress}
            onChange={setWalletAddress}
            placeholder="Enter wallet address"
          />
        </div>
      </div>

      <button
        onClick={handleGetPortfolio}
        disabled={!selectedContestId || !walletAddress}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Get Portfolio
      </button>

      <ResponseDisplay response={response} error={error} />
    </section>
  );
}
