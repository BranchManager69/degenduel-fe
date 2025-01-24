import { useState } from "react";
import { ResponseDisplay } from "./ResponseDisplay";
import { WalletInput } from "./WalletInput";

export function UserDetail() {
  const [walletAddress, setWalletAddress] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const handleGetUserDetail = async () => {
    if (!walletAddress) {
      alert("Please enter a wallet address");
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `https://degenduel.me/api/users/${walletAddress}`,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();
      if (!response.ok) throw data;
      setResponse(data);
    } catch (err) {
      setError(err);
      console.error("Get User Detail Error:", err);
    }
  };

  return (
    <section className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Get User Detail</h2>

      <div className="mb-4">
        <label className="text-gray-400 mb-1 block">Wallet Address</label>
        <WalletInput
          value={walletAddress}
          onChange={setWalletAddress}
          placeholder="Enter wallet address"
        />
      </div>

      <button
        onClick={handleGetUserDetail}
        disabled={!walletAddress}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Get User Detail
      </button>

      <ResponseDisplay response={response} error={error} />
    </section>
  );
}
