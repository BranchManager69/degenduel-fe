import React, { useState } from "react";
import { useToast } from "../toast/ToastContext";

interface SetupStep {
  title: string;
  icon: string;
  steps: Array<{
    step: string;
    description: string;
    code?: string;
    note?: string;
  }>;
  testPrompt: string;
}

export const MCPUserGuide: React.FC = () => {
  const [activeSetup, setActiveSetup] = useState<string>("claude");
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const { addToast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast("success", `${label} copied to clipboard!`);
    } catch (error) {
      addToast("error", "Failed to copy to clipboard");
    }
  };

  const setupSteps: Record<string, SetupStep> = {
    claude: {
      title: "Claude Desktop",
      icon: "🤖",
      steps: [
        {
          step: "Generate your token",
          description: "Generate your secure token using the form above and copy it"
        },
        {
          step: "Open config file",
          description: "Navigate to your Claude Desktop configuration:",
          note: "Mac: ~/Library/Application Support/Claude/claude_desktop_config.json\nWindows: %APPDATA%\\Claude\\claude_desktop_config.json"
        },
        {
          step: "Add configuration",
          description: "Add this to your config file (replace YOUR_TOKEN_HERE):",
          code: `{
  "mcpServers": {
    "degenduel": {
      "command": "degenduel-mcp",
      "args": ["YOUR_TOKEN_HERE"]
    }
  }
}`
        },
        {
          step: "Restart Claude Desktop",
          description: "Close and reopen Claude Desktop to load the new configuration"
        }
      ],
      testPrompt: "What tokens are trending on DegenDuel?"
    },
    cursor: {
      title: "Cursor",
      icon: "💻",
      steps: [
        {
          step: "Generate your token",
          description: "Generate your secure token using the form above and copy it"
        },
        {
          step: "Open settings",
          description: "Press Cmd/Ctrl + , → Search 'MCP' → Click 'Edit in settings.json'"
        },
        {
          step: "Add configuration",
          description: "Add this to your settings:",
          code: `{
  "mcp.servers": {
    "degenduel": {
      "command": "degenduel-mcp",
      "args": ["YOUR_TOKEN_HERE"]
    }
  }
}`
        },
        {
          step: "Restart Cursor",
          description: "Restart Cursor to apply the new configuration"
        }
      ],
      testPrompt: "Show me my DegenDuel portfolio performance"
    },
    windsurf: {
      title: "Windsurf",
      icon: "🌊",
      steps: [
        {
          step: "Generate your token",
          description: "Generate your secure token using the form above and copy it"
        },
        {
          step: "Open settings",
          description: "Go to Settings → Extensions → Search 'MCP' → Configure"
        },
        {
          step: "Add server configuration",
          description: "Add this server configuration:",
          code: `{
  "name": "degenduel",
  "command": "degenduel-mcp",
  "args": ["YOUR_TOKEN_HERE"]
}`
        },
        {
          step: "Restart Windsurf",
          description: "Restart Windsurf to load the new server"
        }
      ],
      testPrompt: "Analyze the top performing tokens in DegenDuel contests"
    }
  };

  const examplePrompts = [
    {
      category: "Portfolio & Contest Analysis",
      icon: "📊",
      prompts: [
        "How is my portfolio performing in the current contest?",
        "What's my trading strategy success rate?",
        "Show me the contest leaderboard and analyze top performers",
        "Which tokens should I consider for my next trade?"
      ]
    },
    {
      category: "Token Research & Discovery",
      icon: "🚀",
      prompts: [
        "What are the top trending tokens right now?",
        "Find me new token launches from today",
        "Analyze BONK's price history and trends",
        "Show me the biggest gainers and losers",
        "What tokens have the highest volume today?"
      ]
    },
    {
      category: "Market Intelligence",
      icon: "📈",
      prompts: [
        "Give me a market overview with insights",
        "What's driving today's market movements?",
        "Compare SOL vs ETH performance this week",
        "Find tokens similar to [your favorite token]"
      ]
    },
    {
      category: "Trading Strategy",
      icon: "🎯",
      prompts: [
        "Based on current market conditions, what's a good strategy?",
        "Analyze risk levels of tokens in my watchlist",
        "What time frames show the best trading patterns?"
      ]
    }
  ];

  const troubleshootingFAQs = [
    {
      question: "\"Server not found\" or connection errors",
      answer: "1. Make sure you copied the full token (it's long!)\n2. Restart your AI assistant after adding the config\n3. Check that the config file syntax is valid JSON"
    },
    {
      question: "\"Authentication failed\"",
      answer: "1. Regenerate your token above\n2. Update the config with the new token\n3. Restart your AI assistant"
    },
    {
      question: "AI doesn't respond to DegenDuel questions",
      answer: "1. Try asking more specific questions like \"Search for SOL token data\"\n2. Make sure the AI assistant loaded the MCP server (look for \"Connected to DegenDuel\" message)"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold font-cyber tracking-wide bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 text-transparent bg-clip-text">
          DegenDuel MCP Portal
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Supercharge your DegenDuel trading with AI assistants like Claude, Cursor, and Windsurf
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: "🧠", title: "Smart Trading Analysis", desc: "Get AI insights on your contest performance and strategies" },
          { icon: "📡", title: "Real-Time Market Intel", desc: "Ask about any token's price, volume, market cap, and trends" },
          { icon: "🎯", title: "Portfolio Optimization", desc: "Analyze your holdings and get personalized trading suggestions" },
          { icon: "🔍", title: "Token Discovery", desc: "Find trending tokens, new launches, and hidden gems" },
          { icon: "🏆", title: "Contest Strategy", desc: "Get AI help planning your next contest moves" },
          { icon: "🔒", title: "Secure & Private", desc: "Your data stays safe with revokable, encrypted tokens" }
        ].map((benefit, index) => (
          <div key={index} className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6">
            <div className="text-3xl mb-3">{benefit.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
            <p className="text-gray-400 text-sm">{benefit.desc}</p>
          </div>
        ))}
      </div>

      {/* Installation */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6">
        <h2 className="text-2xl font-bold mb-4">Installation</h2>
        <p className="text-gray-300 mb-4">First, install the DegenDuel MCP server globally (one-time setup):</p>
        <div className="relative">
          <pre className="bg-dark-300/50 rounded-md p-4 border border-gray-600 text-sm text-gray-300 overflow-x-auto">
            npm install -g degenduel-mcp-server
          </pre>
          <button
            onClick={() => copyToClipboard("npm install -g degenduel-mcp-server", "Installation command")}
            className="absolute top-2 right-2 bg-brand-500 hover:bg-brand-600 text-white px-2 py-1 rounded text-xs"
          >
            Copy
          </button>
        </div>
        <p className="text-gray-400 text-sm mt-3">This only needs to be done once on your computer.</p>
      </div>

      {/* How It Works */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6">
        <h2 className="text-2xl font-bold mb-4">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">1</div>
            <h3 className="font-semibold mb-2">Install MCP Server</h3>
            <p className="text-gray-400 text-sm">One-time npm install (above)</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">2</div>
            <h3 className="font-semibold mb-2">Generate Token</h3>
            <p className="text-gray-400 text-sm">Create a secure token above (takes 5 seconds)</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">3</div>
            <h3 className="font-semibold mb-2">Configure AI</h3>
            <p className="text-gray-400 text-sm">Add it to your AI assistant using our configs</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">4</div>
            <h3 className="font-semibold mb-2">Start Trading</h3>
            <p className="text-gray-400 text-sm">Ask questions like "What tokens are trending?"</p>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6">
        <h2 className="text-2xl font-bold mb-6">Setup Instructions</h2>
        
        {/* AI Assistant Tabs */}
        <div className="flex border-b border-gray-600 mb-6">
          {Object.entries(setupSteps).map(([key, setup]) => (
            <button
              key={key}
              onClick={() => setActiveSetup(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 ${
                activeSetup === key
                  ? "border-brand-400 text-brand-400"
                  : "border-transparent text-gray-400 hover:text-gray-300"
              }`}
            >
              <span>{setup.icon}</span>
              {setup.title}
            </button>
          ))}
        </div>

        {/* Active Setup Steps */}
        <div className="space-y-6">
          {setupSteps[activeSetup].steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">{step.step}</h3>
                <p className="text-gray-300 mb-3">{step.description}</p>
                
                {step.note && (
                  <div className="bg-blue-900/20 border border-blue-500/20 rounded-md p-3 mb-3">
                    <pre className="text-sm text-blue-200 whitespace-pre-wrap">{step.note}</pre>
                  </div>
                )}
                
                {step.code && (
                  <div className="relative">
                    <pre className="bg-dark-300/50 rounded-md p-4 border border-gray-600 text-sm text-gray-300 overflow-x-auto">
                      {step.code}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(step.code!, "Configuration")}
                      className="absolute top-2 right-2 bg-brand-500 hover:bg-brand-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Test Prompt */}
          <div className="bg-green-900/20 border border-green-500/20 rounded-md p-4">
            <h4 className="font-semibold text-green-300 mb-2">Test It Out:</h4>
            <p className="text-green-200 italic">"{setupSteps[activeSetup].testPrompt}"</p>
          </div>
        </div>
      </div>

      {/* Example Prompts */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6">
        <h2 className="text-2xl font-bold mb-6">What You Can Ask Your AI Assistant</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {examplePrompts.map((category, index) => (
            <div key={index} className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <span>{category.icon}</span>
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.prompts.map((prompt, promptIndex) => (
                  <div
                    key={promptIndex}
                    className="bg-dark-300/50 rounded-md p-3 border border-gray-600 cursor-pointer hover:border-brand-500/50 transition-colors"
                    onClick={() => copyToClipboard(prompt, "Prompt")}
                  >
                    <p className="text-gray-300 italic text-sm">"{prompt}"</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Features */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-green-500/20 p-6">
        <h2 className="text-2xl font-bold mb-4 text-green-300">Security & Privacy</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            "Your token is secure - Only you can see it, encrypted in our database",
            "Limited scope - AI can only access your DegenDuel data, nothing else",
            "Revokable anytime - Instantly disable access with one click",
            "1-year expiration - Automatically expires for security",
            "No trading access - AI can view data but cannot make trades"
          ].map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="text-green-400 mt-1">✅</div>
              <span className="text-green-200 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-brand-500/20 p-6">
        <button
          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          className="w-full flex justify-between items-center text-2xl font-bold mb-4"
        >
          <span>Troubleshooting</span>
          <span className={`transform transition-transform ${showTroubleshooting ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        
        {showTroubleshooting && (
          <div className="space-y-4">
            {troubleshootingFAQs.map((faq, index) => (
              <div key={index} className="border border-gray-600 rounded-md">
                <div className="p-4">
                  <h3 className="font-semibold text-yellow-300 mb-2">{faq.question}</h3>
                  <pre className="text-gray-300 text-sm whitespace-pre-wrap">{faq.answer}</pre>
                </div>
              </div>
            ))}
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-md p-4">
              <p className="text-blue-200">
                <strong>Still having issues?</strong> Contact support with your error message and which AI assistant you're using.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pro Tips */}
      <div className="bg-dark-200/50 backdrop-blur-sm rounded-lg border border-orange-500/20 p-6">
        <h2 className="text-2xl font-bold mb-4 text-orange-300">Pro Tips</h2>
        <div className="space-y-3">
          {[
            "Ask follow-up questions - Once AI analyzes your portfolio, ask \"What would you change?\"",
            "Combine insights - \"Compare my performance to the contest winners\"",
            "Real-time updates - Ask about the same token multiple times for live updates",
            "Strategy planning - \"If I have $1000, what's the optimal contest strategy?\""
          ].map((tip, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="text-orange-400 mt-1">🔥</div>
              <span className="text-orange-200 text-sm">{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-gradient-to-r from-brand-500/20 to-purple-500/20 rounded-lg p-8 border border-brand-500/30">
        <p className="text-xl text-gray-200 italic">
          Ready to supercharge your trading with AI? Generate your token above and connect your assistant in under 2 minutes!
        </p>
      </div>
    </div>
  );
};