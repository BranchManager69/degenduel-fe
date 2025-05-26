import React, { useState } from "react";
import { useToast } from "../toast/ToastContext";

interface TokenDisplayProps {
  token: string;
  onRegenerate: () => void;
  onRevoke: () => void;
  loading: boolean;
}

export const TokenDisplay: React.FC<TokenDisplayProps> = ({
  token,
  onRegenerate,
  onRevoke,
  loading,
}) => {
  const [showFullToken, setShowFullToken] = useState(false);
  const { addToast } = useToast();

  const maskedToken = `${token.substring(0, 8)}...${token.substring(token.length - 8)}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(token);
      addToast("success", "Token copied to clipboard!");
    } catch (error) {
      addToast("error", "Failed to copy token");
    }
  };

  const handleRegenerate = () => {
    if (confirm("Are you sure you want to regenerate your token? This will invalidate your current token.")) {
      onRegenerate();
    }
  };

  const handleRevoke = () => {
    if (confirm("Are you sure you want to revoke your token? This will prevent AI assistants from accessing your data.")) {
      onRevoke();
    }
  };

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6">
      <h3 className="text-lg font-semibold mb-4">Your MCP Token</h3>
      
      <div className="space-y-4">
        <div className="bg-dark-300/50 rounded-md p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div className="font-mono text-sm text-gray-300 break-all">
              {showFullToken ? token : maskedToken}
            </div>
            <button
              onClick={() => setShowFullToken(!showFullToken)}
              className="ml-4 text-brand-400 hover:text-brand-300 text-sm"
            >
              {showFullToken ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyToClipboard}
            disabled={loading}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm"
          >
            Copy Token
          </button>
          
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm"
          >
            {loading ? "Regenerating..." : "Regenerate"}
          </button>
          
          <button
            onClick={handleRevoke}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm"
          >
            {loading ? "Revoking..." : "Revoke"}
          </button>
        </div>

        <div className="text-sm text-gray-400">
          <p>• This token expires in 1 year</p>
          <p>• Keep this token secure and don't share it publicly</p>
          <p>• Regenerating will invalidate the previous token</p>
        </div>
      </div>
    </div>
  );
};