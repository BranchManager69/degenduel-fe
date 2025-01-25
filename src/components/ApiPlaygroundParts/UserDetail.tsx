import { useState } from "react";
import { UserSearch } from "../admin/UserSearch";

export function UserDetail() {
  const [walletAddress, setWalletAddress] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const handleGetUserDetail = async () => {
    if (!walletAddress) {
      setError("Please select a user");
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `https://degenduel.me/api/users/${walletAddress}`,
        {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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

  const handleSearch = (wallet: string) => {
    setWalletAddress(wallet);
    setError(null);
    setResponse(null);
  };

  return (
    <section className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          Search User
        </label>
        <UserSearch
          onSearch={handleSearch}
          placeholder="Search by wallet address or nickname..."
        />
      </div>

      <button
        onClick={handleGetUserDetail}
        disabled={!walletAddress}
        className="px-4 py-2 bg-dark-300 text-gray-100 rounded hover:bg-dark-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Get User Detail
      </button>

      {error && (
        <div className="p-3 bg-dark-300/20 rounded">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {response && (
        <div className="p-3 bg-dark-300/50 rounded space-y-2">
          <div className="font-mono text-sm space-y-1">
            <p className="text-gray-400">
              Wallet Address:{" "}
              <span className="text-gray-100">{response.wallet_address}</span>
            </p>
            <p className="text-gray-400">
              Nickname:{" "}
              <span className="text-gray-100">
                {response.nickname || "Anonymous"}
              </span>
            </p>
            <p className="text-gray-400">
              Balance:{" "}
              <span className="text-gray-100">
                {parseFloat(response.balance).toLocaleString()}
              </span>
            </p>
            <p className="text-gray-400">
              Role: <span className="text-gray-100">{response.role}</span>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
