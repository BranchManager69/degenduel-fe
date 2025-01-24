import { useState } from "react";
import { JsonInput } from "./JsonInput";
import { ResponseDisplay } from "./ResponseDisplay";

export function BulkPriceHistory() {
  const [tokenAddresses, setTokenAddresses] = useState<string[]>([]);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const handleGetPriceHistory = async () => {
    if (tokenAddresses.length === 0) {
      alert("Please enter at least one token address");
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        "https://degenduel.me/api/tokens/price-history",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token_addresses: tokenAddresses }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw data;
      setResponse(data);
    } catch (err) {
      setError(err);
      console.error("Get Price History Error:", err);
    }
  };

  return (
    <section className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Bulk Price History
      </h2>

      <div className="mb-4">
        <label className="text-gray-400 mb-1 block">
          Token Addresses
          <span className="text-sm ml-2">
            (Format: ["ADDRESS1", "ADDRESS2"])
          </span>
        </label>
        <JsonInput
          value={tokenAddresses}
          onChange={setTokenAddresses}
          placeholder={JSON.stringify(
            [
              "So11111111111111111111111111111111111111112",
              "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
            ],
            null,
            2
          )}
        />
      </div>

      <button
        onClick={handleGetPriceHistory}
        disabled={tokenAddresses.length === 0}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Get Price History
      </button>

      <ResponseDisplay response={response} error={error} />
    </section>
  );
}
