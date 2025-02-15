import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";

interface AiTestResponse {
  output: string;
  metadata: {
    model: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    latency: number;
    finish_reason: string;
  };
  timestamp: string;
}

export const AiTesting: React.FC = () => {
  const { user } = useStore();
  const [assistantPrompt, setAssistantPrompt] = useState<string>("");
  const [assistedPrompt, setAssistedPrompt] = useState<string>("");
  const [userPrompt, setUserPrompt] = useState<string>("");
  const [responses, setResponses] = useState<AiTestResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4");

  const models = [
    { value: "gpt-4", label: "GPT-4" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
    { value: "gpt-4-turbo-preview", label: "GPT-4 Turbo" },
  ];

  const handleTest = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await ddApi.fetch("/api/admin/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistant_prompt: assistantPrompt,
          assisted_prompt: assistedPrompt,
          user_prompt: userPrompt,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to test AI endpoint");
      }

      const result = await response.json();
      setResponses((prev) => [result, ...prev].slice(0, 10)); // Keep last 10 responses
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const clearResponses = () => {
    setResponses([]);
  };

  if (!user?.is_superadmin) {
    return (
      <div className="p-4">
        <p className="text-red-500">
          Access Denied: Superadmin privileges required.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-4">
          AI Testing Panel
        </h1>
        <p className="text-gray-400">
          Test and debug AI responses with different prompts and models.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Input Panel */}
        <div className="col-span-8">
          <div className="bg-dark-200/50 backdrop-blur-lg p-6 rounded-lg border border-brand-500/20 space-y-6">
            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-dark-300 border border-gray-700 rounded-md p-2 text-gray-200"
              >
                {models.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assistant Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Assistant Prompt
              </label>
              <textarea
                value={assistantPrompt}
                onChange={(e) => setAssistantPrompt(e.target.value)}
                className="w-full bg-dark-300 border border-gray-700 rounded-md p-2 text-gray-200 font-mono"
                rows={4}
                placeholder="Enter the assistant's system prompt..."
              />
            </div>

            {/* Assisted Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Assisted Prompt
              </label>
              <textarea
                value={assistedPrompt}
                onChange={(e) => setAssistedPrompt(e.target.value)}
                className="w-full bg-dark-300 border border-gray-700 rounded-md p-2 text-gray-200 font-mono"
                rows={4}
                placeholder="Enter the assisted prompt..."
              />
            </div>

            {/* User Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                User Prompt
              </label>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full bg-dark-300 border border-gray-700 rounded-md p-2 text-gray-200 font-mono"
                rows={4}
                placeholder="Enter the user's prompt..."
              />
            </div>

            {/* Control Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleTest}
                disabled={isLoading || !userPrompt}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Testing..." : "Test AI Response"}
              </button>
              <button
                onClick={clearResponses}
                className="px-4 py-2 bg-dark-300 text-gray-300 rounded-lg hover:bg-dark-400 transition-colors"
              >
                Clear Results
              </button>
            </div>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <div className="text-red-400 mt-0.5">⚠</div>
                      <div className="flex-1">
                        <div className="text-red-400 font-medium">Error</div>
                        <div className="text-red-400/90 text-sm">{error}</div>
                      </div>
                      <button
                        onClick={() => setError(null)}
                        className="text-red-400/50 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Results Panel */}
        <div className="col-span-4">
          <div className="bg-dark-200/50 backdrop-blur-lg rounded-lg border border-brand-500/20 h-full">
            <div className="p-4 border-b border-dark-300">
              <h2 className="text-xl font-semibold text-gray-100">
                Test Results
              </h2>
              <p className="text-sm text-gray-400">Last 10 responses</p>
            </div>
            <div className="p-4 space-y-4 max-h-[800px] overflow-y-auto">
              {responses.map((response, index) => (
                <div
                  key={index}
                  className="bg-dark-300/50 rounded-lg p-4 border border-dark-400"
                >
                  <div className="mb-2 pb-2 border-b border-dark-400">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-300">
                        {response.metadata.model}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(response.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <div>Tokens: {response.metadata.tokens.total}</div>
                      <div>Latency: {response.metadata.latency}ms</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                    {response.output}
                  </div>
                </div>
              ))}
              {responses.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No test results yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
