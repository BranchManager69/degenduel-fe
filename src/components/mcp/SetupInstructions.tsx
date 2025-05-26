import React, { useState } from "react";
import { useToast } from "../toast/ToastContext";

interface SetupInstructionsProps {
  token?: string;
}

export const SetupInstructions: React.FC<SetupInstructionsProps> = ({ token }) => {
  const [activeTab, setActiveTab] = useState("claude");
  const { addToast } = useToast();

  const claudeConfig = {
    mcpServers: {
      degenduel: {
        command: "degenduel-mcp",
        args: [token || "YOUR_TOKEN_HERE"]
      }
    }
  };

  const cursorConfig = {
    "mcp.servers": {
      degenduel: {
        command: "degenduel-mcp",
        args: [token || "YOUR_TOKEN_HERE"]
      }
    }
  };

  const copyConfig = async (config: any, assistant: string) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      addToast("success", `${assistant} configuration copied to clipboard!`);
    } catch (error) {
      addToast("error", "Failed to copy configuration");
    }
  };

  return (
    <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6">
      <h3 className="text-lg font-semibold mb-4">Setup Instructions</h3>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600 mb-4">
        <button
          onClick={() => setActiveTab("claude")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "claude"
              ? "border-brand-400 text-brand-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
        >
          Claude Desktop
        </button>
        <button
          onClick={() => setActiveTab("cursor")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "cursor"
              ? "border-brand-400 text-brand-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
        >
          Cursor
        </button>
      </div>

      {/* Claude Desktop Tab */}
      {activeTab === "claude" && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Configuration File Location:</h4>
            <div className="bg-dark-300/50 rounded-md p-3 border border-gray-600">
              <code className="text-sm text-gray-300">
                ~/Library/Application Support/Claude/claude_desktop_config.json
              </code>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Configuration:</h4>
              <button
                onClick={() => copyConfig(claudeConfig, "Claude Desktop")}
                className="bg-brand-500 hover:bg-brand-600 text-white px-3 py-1 rounded text-sm"
              >
                Copy Config
              </button>
            </div>
            <div className="bg-dark-300/50 rounded-md p-3 border border-gray-600 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                {JSON.stringify(claudeConfig, null, 2)}
              </pre>
            </div>
          </div>

          <div className="text-sm text-gray-400 space-y-1">
            <p>1. Open Claude Desktop</p>
            <p>2. Create or edit the configuration file at the location above</p>
            <p>3. Copy the configuration and replace "paste_your_token_here" with your actual token</p>
            <p>4. Restart Claude Desktop</p>
            <p>5. You can now ask Claude to help with your DegenDuel trading!</p>
          </div>
        </div>
      )}

      {/* Cursor Tab */}
      {activeTab === "cursor" && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Configuration File Location:</h4>
            <div className="bg-dark-300/50 rounded-md p-3 border border-gray-600">
              <code className="text-sm text-gray-300">
                ~/.cursor/mcp_settings.json
              </code>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Configuration:</h4>
              <button
                onClick={() => copyConfig(cursorConfig, "Cursor")}
                className="bg-brand-500 hover:bg-brand-600 text-white px-3 py-1 rounded text-sm"
              >
                Copy Config
              </button>
            </div>
            <div className="bg-dark-300/50 rounded-md p-3 border border-gray-600 overflow-x-auto">
              <pre className="text-sm text-gray-300">
                {JSON.stringify(cursorConfig, null, 2)}
              </pre>
            </div>
          </div>

          <div className="text-sm text-gray-400 space-y-1">
            <p>1. Open Cursor</p>
            <p>2. Create or edit the configuration file at the location above</p>
            <p>3. Copy the configuration and replace "paste_your_token_here" with your actual token</p>
            <p>4. Restart Cursor</p>
            <p>5. You can now use AI assistance for your DegenDuel account!</p>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-md">
        <h4 className="font-medium text-blue-300 mb-2">What You Can Do:</h4>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• Access your contest portfolios and trading history</li>
          <li>• Get real-time token data and market insights</li>
          <li>• Analyze trading strategies and performance</li>
          <li>• Search and discover tokens with comprehensive market data</li>
          <li>• View contest leaderboards and details</li>
        </ul>
      </div>
    </div>
  );
};