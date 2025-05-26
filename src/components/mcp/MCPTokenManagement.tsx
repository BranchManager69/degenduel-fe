import React, { useState, useEffect } from "react";
import { useToast } from "../toast/ToastContext";
import { mcp } from "../../services/api/mcp";
import { TokenDisplay } from "./TokenDisplay";
import { SetupInstructions } from "./SetupInstructions";

export const MCPTokenManagement: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { addToast } = useToast();

  // Load existing token on mount
  useEffect(() => {
    const loadToken = async () => {
      try {
        const response = await mcp.getToken();
        if (response.success && response.mcp_token) {
          setToken(response.mcp_token);
        }
      } catch (error) {
        // Token doesn't exist yet, that's fine
        console.log("No existing token found");
      } finally {
        setInitialLoading(false);
      }
    };

    loadToken();
  }, []);

  const generateToken = async () => {
    setLoading(true);
    try {
      const response = await mcp.getToken();
      if (response.success && response.mcp_token) {
        setToken(response.mcp_token);
        addToast("success", "MCP token generated successfully!");
      } else {
        addToast("error", response.message || "Failed to generate token");
      }
    } catch (error) {
      console.error("Error generating token:", error);
      addToast("error", "Failed to generate token");
    } finally {
      setLoading(false);
    }
  };

  const regenerateToken = async () => {
    setLoading(true);
    try {
      const response = await mcp.regenerateToken();
      if (response.success && response.mcp_token) {
        setToken(response.mcp_token);
        addToast("success", "Token regenerated successfully! Previous token has been revoked.");
      } else {
        addToast("error", response.message || "Failed to regenerate token");
      }
    } catch (error) {
      console.error("Error regenerating token:", error);
      addToast("error", "Failed to regenerate token");
    } finally {
      setLoading(false);
    }
  };

  const revokeToken = async () => {
    setLoading(true);
    try {
      const response = await mcp.revokeToken();
      if (response.success) {
        setToken(null);
        addToast("success", "Token revoked successfully!");
      } else {
        addToast("error", response.message || "Failed to revoke token");
      }
    } catch (error) {
      console.error("Error revoking token:", error);
      addToast("error", "Failed to revoke token");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
          AI Assistant Access
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
        </h2>
        <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text relative group">
        AI Assistant Access
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 to-transparent blur-xl animate-pulse-slow" />
      </h2>

      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6">
        <p className="text-gray-300 mb-4">
          Generate secure tokens to connect AI assistants like Claude Desktop and Cursor to your DegenDuel account.
          This allows AI assistants to access your trading data, analyze performance, and provide market insights.
        </p>

        {token ? (
          <TokenDisplay
            token={token}
            onRegenerate={regenerateToken}
            onRevoke={revokeToken}
            loading={loading}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">You don't have an MCP token yet.</p>
            <button
              onClick={generateToken}
              disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white px-6 py-3 rounded-md font-medium"
            >
              {loading ? "Generating..." : "Generate MCP Token"}
            </button>
          </div>
        )}
      </div>

      <SetupInstructions token={token || undefined} />
    </div>
  );
};