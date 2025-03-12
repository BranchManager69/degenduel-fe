import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { ddApi } from "../../services/dd-api";

interface ComplexityAnalysis {
  complexity: number;
  isReasonable: boolean;
  estimatedTime: {
    estimatedAttempts: number;
    estimatedSeconds: number;
    cores: number;
  };
}

interface WorkerStatus {
  total: number;
  active: number;
  available: number;
  queue: number;
}

interface GeneratedWallet {
  publicKey: string;
  timestamp: number;
  metadata: {
    vanity: {
      pattern: string;
      position: string;
      isCaseSensitive: boolean;
    };
  };
}

export const VanityPool: React.FC = () => {
  const [pattern, setPattern] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [position, setPosition] = useState<"start" | "end" | "anywhere">(
    "start",
  );
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [metadata, setMetadata] = useState("");
  const [complexity, setComplexity] = useState<ComplexityAnalysis | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWallets, setGeneratedWallets] = useState<GeneratedWallet[]>(
    [],
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateAndAnalyzePattern = async () => {
    if (!pattern) return;

    try {
      const response = await ddApi.fetch("/api/admin/vanity-wallets/analyze", {
        method: "POST",
        body: JSON.stringify({ pattern }),
      });

      const data = await response.json();

      if (data.success) {
        setComplexity(data.analysis);
        setErrorMessage(null);
      } else {
        setErrorMessage(data.message || "Invalid pattern");
        setComplexity(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to analyze pattern");
      setComplexity(null);
    }
  };

  const fetchWorkerStatus = async () => {
    try {
      const response = await ddApi.fetch(
        "/api/admin/vanity-wallets/pool/workers",
      );
      const data = await response.json();

      if (data.success) {
        setWorkerStatus(data.status);
      } else {
        console.warn("Worker status update failed:", data.message);
      }
    } catch (err) {
      console.error(err);
      // Don't show error toast for worker status as it's not critical
    }
  };

  const generateVanityWallet = async () => {
    if (!pattern || !identifier) {
      toast.error("Pattern and identifier are required");
      return;
    }

    // Validate metadata JSON if provided
    if (metadata) {
      try {
        JSON.parse(metadata);
      } catch (err) {
        toast.error("Invalid metadata JSON format");
        return;
      }
    }

    try {
      setIsGenerating(true);
      setErrorMessage(null);

      const response = await ddApi.fetch("/api/admin/vanity-wallets/generate", {
        method: "POST",
        body: JSON.stringify({
          pattern,
          identifier,
          position,
          isCaseSensitive,
          metadata: metadata ? JSON.parse(metadata) : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Vanity wallet generated successfully");
        setGeneratedWallets((prev) => [data.wallet, ...prev]);
        // Clear form only on success
        setPattern("");
        setIdentifier("");
        setMetadata("");
      } else {
        throw new Error(data.message || "Generation failed");
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to generate vanity wallet",
      );
      setErrorMessage(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  // Add loading state for initial worker status fetch
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await fetchWorkerStatus();
      setInitialLoading(false);
    };
    init();
    const interval = setInterval(fetchWorkerStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pattern) {
      const timeout = setTimeout(validateAndAnalyzePattern, 500);
      return () => clearTimeout(timeout);
    } else {
      // Clear complexity when pattern is empty
      setComplexity(null);
    }
  }, [pattern]);

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-100">Vanity Pool</h2>
        {workerStatus && (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  workerStatus.available > 0 ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <span className="text-gray-400">
                {workerStatus.available} of {workerStatus.total} workers
                available
              </span>
            </div>
            {workerStatus.queue > 0 && (
              <span className="text-yellow-400">
                {workerStatus.queue} in queue
              </span>
            )}
          </div>
        )}
      </div>

      {/* Generation Form */}
      <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
        <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2">
          <span className="text-xl">🎯</span>
          Generate Vanity Wallet
        </h3>
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{errorMessage}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm text-gray-400">Pattern</label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter desired pattern"
              className="w-full px-3 py-2 bg-dark-400/30 border border-dark-400 rounded-lg text-gray-100 placeholder-gray-500"
            />
            {complexity && (
              <div
                className={`text-xs ${
                  complexity.isReasonable ? "text-green-400" : "text-yellow-400"
                }`}
              >
                Estimated time:{" "}
                {complexity.estimatedTime.estimatedSeconds < 60
                  ? `${complexity.estimatedTime.estimatedSeconds}s`
                  : `${Math.ceil(
                      complexity.estimatedTime.estimatedSeconds / 60,
                    )}m`}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-gray-400">Identifier</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter unique identifier"
              className="w-full px-3 py-2 bg-dark-400/30 border border-dark-400 rounded-lg text-gray-100 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="space-y-2">
            <label className="block text-sm text-gray-400">Position</label>
            <select
              value={position}
              onChange={(e) =>
                setPosition(e.target.value as "start" | "end" | "anywhere")
              }
              className="w-full px-3 py-2 bg-dark-400/30 border border-dark-400 rounded-lg text-gray-100"
            >
              <option value="start">Start</option>
              <option value="end">End</option>
              <option value="anywhere">Anywhere</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-gray-400">
              Case Sensitive
            </label>
            <div className="flex items-center h-[42px]">
              <input
                type="checkbox"
                checked={isCaseSensitive}
                onChange={(e) => setIsCaseSensitive(e.target.checked)}
                className="rounded border-gray-400 text-brand-500 focus:ring-brand-500"
              />
              <span className="ml-2 text-gray-400">Match case</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-gray-400">
              Metadata (Optional JSON)
            </label>
            <input
              type="text"
              value={metadata}
              onChange={(e) => setMetadata(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full px-3 py-2 bg-dark-400/30 border border-dark-400 rounded-lg text-gray-100 placeholder-gray-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={generateVanityWallet}
            disabled={
              isGenerating ||
              !pattern ||
              !identifier ||
              complexity?.isReasonable === false
            }
            className={`px-4 py-2 rounded-lg ${
              isGenerating ||
              !pattern ||
              !identifier ||
              complexity?.isReasonable === false
                ? "bg-brand-500/50"
                : "bg-brand-500 hover:bg-brand-600"
            } text-white transition-colors`}
          >
            {isGenerating ? "Generating..." : "Generate Wallet"}
          </button>
        </div>
      </div>

      {/* Generated Wallets */}
      <div className="bg-dark-300/30 rounded-lg p-4 border border-dark-300">
        <h3 className="text-lg font-medium text-gray-100 mb-4 flex items-center gap-2">
          <span className="text-xl">💎</span>
          Generated Vanity Wallets
        </h3>
        <div className="space-y-4">
          {generatedWallets.map((wallet, index) => (
            <div
              key={index}
              className="bg-dark-400/30 rounded-lg p-4 border border-dark-400"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm font-mono text-gray-100 break-all">
                    {wallet.publicKey}
                  </p>
                  <p className="text-xs text-gray-400">
                    Pattern: {wallet.metadata.vanity.pattern} (
                    {wallet.metadata.vanity.position})
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(wallet.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}

          {generatedWallets.length === 0 && (
            <p className="text-center text-gray-400">
              No vanity wallets generated yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
