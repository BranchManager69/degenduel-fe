import { useEffect, useState } from "react";
import { ContestSelect } from "./ContestContext";
import { ResponseDisplay } from "./ResponseDisplay";
import { WalletInput } from "./WalletInput";

interface Token {
  symbol: string;
  contractAddress: string;
  name: string;
}

interface TokenWeight {
  symbol: string;
  contractAddress: string;
  weight: number;
}

export function SetPortfolio() {
  const [selectedContestId, setSelectedContestId] = useState<number | "">("");
  const [walletAddress, setWalletAddress] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<TokenWeight[]>([]);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [tokenSearch, setTokenSearch] = useState("");

  // Fetch available tokens when component mounts
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch("https://degenduel.me/api/tokens");
        const data = await response.json();
        if (!response.ok) throw data;
        setTokens(data.tokens || []);
      } catch (err) {
        console.error("Failed to fetch tokens:", err);
      }
    };
    fetchTokens();
  }, []);

  const handleSetPortfolio = async () => {
    if (!selectedContestId) {
      alert("Please select a contest first");
      return;
    }
    if (!walletAddress) {
      alert("Please enter a wallet address");
      return;
    }
    if (selectedTokens.length === 0) {
      alert("Please select at least one token");
      return;
    }

    // Validate total weight is 100%
    const totalWeight = selectedTokens.reduce(
      (sum, token) => sum + token.weight,
      0
    );
    if (totalWeight !== 100) {
      alert("Total weight must equal 100%");
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `https://degenduel.me/api/contests/${selectedContestId}/portfolio`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            wallet_address: walletAddress,
            tokens: selectedTokens,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw data;
      setResponse(data);
    } catch (err) {
      setError(err);
      console.error("Set Portfolio Error:", err);
    }
  };

  const handleAddToken = (token: Token) => {
    if (
      selectedTokens.some((t) => t.contractAddress === token.contractAddress)
    ) {
      alert("Token already added to portfolio");
      return;
    }
    setSelectedTokens([...selectedTokens, { ...token, weight: 0 }]);
  };

  const handleRemoveToken = (contractAddress: string) => {
    setSelectedTokens(
      selectedTokens.filter((t) => t.contractAddress !== contractAddress)
    );
  };

  const handleWeightChange = (contractAddress: string, weight: number) => {
    setSelectedTokens(
      selectedTokens.map((token) =>
        token.contractAddress === contractAddress ? { ...token, weight } : token
      )
    );
  };

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(tokenSearch.toLowerCase()) ||
      token.name.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  return (
    <section className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Set Portfolio</h2>

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

      <div className="mb-4">
        <label className="text-gray-400 mb-1 block">Search Tokens</label>
        <input
          type="text"
          className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
          placeholder="Search by name or symbol"
          value={tokenSearch}
          onChange={(e) => setTokenSearch(e.target.value)}
        />
      </div>

      {tokenSearch && (
        <div className="mb-4 max-h-48 overflow-y-auto bg-gray-900 rounded border border-gray-700">
          {filteredTokens.map((token) => (
            <button
              key={token.contractAddress}
              onClick={() => handleAddToken(token)}
              className="w-full text-left px-3 py-2 hover:bg-gray-800 transition-colors"
            >
              <span className="text-white font-medium">{token.symbol}</span>
              <span className="text-gray-400 ml-2">{token.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="mb-4">
        <label className="text-gray-400 mb-1 block">Selected Tokens</label>
        <div className="space-y-2">
          {selectedTokens.map((token) => (
            <div
              key={token.contractAddress}
              className="flex items-center gap-4 bg-gray-900 p-3 rounded"
            >
              <div className="flex-1">
                <div className="text-white font-medium">{token.symbol}</div>
                <div className="text-gray-400 text-sm">
                  {token.contractAddress}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-20 bg-gray-800 text-white rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
                  placeholder="Weight"
                  value={token.weight}
                  onChange={(e) =>
                    handleWeightChange(
                      token.contractAddress,
                      Number(e.target.value)
                    )
                  }
                />
                <span className="text-gray-400">%</span>
                <button
                  onClick={() => handleRemoveToken(token.contractAddress)}
                  className="text-red-400 hover:text-red-300 p-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-400 mt-1">
          Total Weight:{" "}
          {selectedTokens.reduce((sum, token) => sum + token.weight, 0)}%
        </p>
      </div>

      <button
        onClick={handleSetPortfolio}
        disabled={
          !selectedContestId || !walletAddress || selectedTokens.length === 0
        }
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Set Portfolio
      </button>

      <ResponseDisplay response={response} error={error} />
    </section>
  );
}
