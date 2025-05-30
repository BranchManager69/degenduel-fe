import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [copiedItems, setCopiedItems] = useState<{ [key: string]: boolean }>({});
  const { addToast } = useToast();

  // Listen for setup selection events from pill buttons
  useEffect(() => {
    const handleSetupSelection = (event: CustomEvent) => {
      setActiveSetup(event.detail);
    };

    window.addEventListener('selectSetup', handleSetupSelection as EventListener);
    return () => {
      window.removeEventListener('selectSetup', handleSetupSelection as EventListener);
    };
  }, []);

  const copyToClipboard = async (text: string, label: string, itemKey?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (itemKey) {
        setCopiedItems(prev => ({ ...prev, [itemKey]: true }));
        setTimeout(() => {
          setCopiedItems(prev => ({ ...prev, [itemKey]: false }));
        }, 2000);
      }
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
        "Show me the contest leaderboard and analyze top performers",
        "Which tokens should I consider for my next trade?",
        "Based on current market conditions, what's a good strategy?"
      ]
    },
    {
      category: "Token Research & Market Intelligence",
      icon: "🚀",
      prompts: [
        "What are the top trending tokens right now?",
        "Find me new token launches from today",
        "Show me the biggest gainers and losers",
        "What tokens have the highest volume today?",
        "Give me a market overview with insights",
        "What's driving today's market movements?",
        "Compare SOL vs TITCOIN performance this week",
        "Find tokens similar to ASSCOIN"
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
    <div className="space-y-6 sm:space-y-8 lg:space-y-12">
      {/* Hero Section */}
      <motion.div 
        className="text-center space-y-4 sm:space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.h1 
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text relative"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          Setup Guide
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 blur-2xl animate-pulse"></div>
        </motion.h1>
        <motion.p 
          className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Connect your AI assistant to DegenDuel in minutes. Get live market data, portfolio insights, and trading intelligence.
        </motion.p>
      </motion.div>

      {/* Benefits Grid */}
      <motion.div 
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {[
          { icon: "🧠", title: "Smart Trading Analysis", desc: "Get AI insights on your contest performance and strategies", color: "cyan" },
          { icon: "📡", title: "Real-Time Market Intel", desc: "Ask about any token's price, volume, market cap, and trends", color: "purple" },
          { icon: "🎯", title: "Portfolio Optimization", desc: "Analyze your holdings and get personalized trading suggestions", color: "pink" },
          { icon: "🔍", title: "Token Discovery", desc: "Find trending tokens, new launches, and hidden gems", color: "green" },
          { icon: "🏆", title: "Contest Strategy", desc: "Get AI help planning your next contest moves", color: "yellow" },
          { icon: "🔒", title: "Secure & Private", desc: "Your data stays safe with revokable, encrypted tokens", color: "red" }
        ].map((benefit, index) => (
          <motion.div 
            key={index} 
            className="relative group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className={`absolute -inset-1 bg-gradient-to-r ${
              benefit.color === 'cyan' ? 'from-cyan-500 to-cyan-600' :
              benefit.color === 'purple' ? 'from-purple-500 to-purple-600' :
              benefit.color === 'pink' ? 'from-pink-500 to-pink-600' :
              benefit.color === 'green' ? 'from-green-500 to-green-600' :
              benefit.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
              'from-red-500 to-red-600'
            } rounded-2xl blur opacity-0 group-hover:opacity-25 transition duration-1000`}></div>
            <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-4 sm:p-6 h-full">
              <motion.div 
                className="text-2xl sm:text-3xl lg:text-4xl mb-3 sm:mb-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              >
                {benefit.icon}
              </motion.div>
              <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-slate-100">{benefit.title}</h3>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">{benefit.desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Installation */}
      <motion.div 
        className="relative group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-8">
          <motion.div
            className="flex items-center gap-3 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <span className="text-2xl sm:text-3xl">📦</span>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 text-transparent bg-clip-text">
              Installation
            </h2>
          </motion.div>
          <motion.p 
            className="text-slate-300 mb-4 sm:mb-6 text-base sm:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            First, install the DegenDuel MCP server globally (one-time setup):
          </motion.p>
          <motion.div 
            className="relative group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-600/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-cyan-500/5"></div>
              <pre className="text-sm sm:text-base lg:text-lg text-slate-200 font-mono relative z-10 break-all">
                npm install -g degenduel-mcp-server
              </pre>
              <motion.button
                onClick={() => copyToClipboard("npm install -g degenduel-mcp-server", "Installation command", "install-cmd")}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-cyan-600 transition-all duration-200 flex items-center gap-1 sm:gap-2 text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {copiedItems["install-cmd"] ? (
                    <motion.span
                      key="copied"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      ✅ Copied!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      📋 Copy
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>
          <motion.p 
            className="text-slate-400 mt-4 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <span>✨</span>
            This only needs to be done once on your computer.
          </motion.p>
        </div>
      </motion.div>

      {/* How It Works */}
      <motion.div 
        className="relative group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-8">
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <span className="text-2xl sm:text-3xl">⚡</span>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              How It Works
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[
              { number: 1, title: "Install MCP Server", desc: "One-time npm install (above)", icon: "📦", color: "cyan" },
              { number: 2, title: "Generate Token", desc: "Create a secure token above (takes 5 seconds)", icon: "🔑", color: "purple" },
              { number: 3, title: "Configure AI", desc: "Add it to your AI assistant using our configs", icon: "⚙️", color: "pink" },
              { number: 4, title: "Start Trading", desc: "Ask questions like \"What tokens are trending?\"", icon: "🚀", color: "green" }
            ].map((step, index) => (
              <motion.div 
                key={index}
                className="text-center relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <motion.div 
                  className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-r ${
                    step.color === 'cyan' ? 'from-cyan-500 to-cyan-600' :
                    step.color === 'purple' ? 'from-purple-500 to-purple-600' :
                    step.color === 'pink' ? 'from-pink-500 to-pink-600' :
                    'from-green-500 to-green-600'
                  } rounded-full flex items-center justify-center text-lg sm:text-xl lg:text-2xl font-black mx-auto mb-3 sm:mb-4 text-white shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  animate={{ 
                    boxShadow: [
                      "0 0 0 0 rgba(99, 102, 241, 0)",
                      "0 0 0 10px rgba(99, 102, 241, 0.1)",
                      "0 0 0 20px rgba(99, 102, 241, 0)"
                    ]
                  }}
                  transition={{ 
                    boxShadow: { duration: 2, repeat: Infinity, delay: index * 0.3 },
                    scale: { type: "spring" },
                    rotate: { type: "spring" }
                  }}
                >
                  {step.number}
                </motion.div>
                <motion.div
                  className="text-xl sm:text-2xl mb-2 sm:mb-3"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5
                  }}
                >
                  {step.icon}
                </motion.div>
                <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 text-slate-100">{step.title}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Setup Instructions */}
      <motion.div 
        className="relative group"
        data-setup-section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-8">
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <span className="text-3xl">🛠️</span>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
              Setup Instructions
            </h2>
          </motion.div>
          
          {/* AI Assistant Tabs */}
          <motion.div 
            className="flex flex-wrap border-b border-slate-600/50 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            {Object.entries(setupSteps).map(([key, setup], index) => (
              <motion.button
                key={key}
                onClick={() => setActiveSetup(key)}
                className={`px-6 py-4 text-lg font-bold border-b-4 flex items-center gap-3 transition-all duration-200 ${
                  activeSetup === key
                    ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                    : "border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-700/30"
                }`}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + index * 0.1 }}
              >
                <motion.span 
                  className="text-2xl"
                  animate={activeSetup === key ? { rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 1, repeat: activeSetup === key ? Infinity : 0 }}
                >
                  {setup.icon}
                </motion.span>
                {setup.title}
              </motion.button>
            ))}
          </motion.div>

          {/* Active Setup Steps */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeSetup}
              className="space-y-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {setupSteps[activeSetup].steps.map((step, index) => (
                <motion.div 
                  key={index} 
                  className="flex gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.div 
                    className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-lg font-black flex-shrink-0 mt-2 text-white shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    animate={{ 
                      boxShadow: [
                        "0 0 0 0 rgba(6, 182, 212, 0)",
                        "0 0 0 10px rgba(6, 182, 212, 0.1)",
                        "0 0 0 20px rgba(6, 182, 212, 0)"
                      ]
                    }}
                    transition={{ 
                      boxShadow: { duration: 2, repeat: Infinity, delay: index * 0.2 }
                    }}
                  >
                    {index + 1}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl mb-3 text-slate-100">{step.step}</h3>
                    <p className="text-slate-300 mb-4 text-lg leading-relaxed">{step.description}</p>
                    
                    {step.note && (
                      <motion.div 
                        className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-6 mb-4 relative overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xl">📍</span>
                            <span className="font-semibold text-blue-300">File Locations</span>
                          </div>
                          <pre className="text-blue-200 whitespace-pre-wrap text-sm leading-relaxed font-mono">{step.note}</pre>
                        </div>
                      </motion.div>
                    )}
                    
                    {step.code && (
                      <motion.div 
                        className="relative group"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-600/50 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5"></div>
                          <pre className="text-slate-200 overflow-x-auto text-sm font-mono leading-relaxed relative z-10">
                            {step.code}
                          </pre>
                          <motion.button
                            onClick={() => copyToClipboard(step.code!, "Configuration", `step-${activeSetup}-${index}`)}
                            className="absolute top-3 right-3 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-purple-600 transition-all duration-200 flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <AnimatePresence mode="wait">
                              {copiedItems[`step-${activeSetup}-${index}`] ? (
                                <motion.span
                                  key="copied"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  ✅ Copied!
                                </motion.span>
                              ) : (
                                <motion.span
                                  key="copy"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  📋 Copy
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {/* Test Prompt */}
              <motion.div 
                className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 border border-green-500/30 rounded-xl p-6 relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-cyan-500/5"></div>
                <div className="relative">
                  <motion.div
                    className="flex items-center gap-3 mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <motion.span 
                      className="text-2xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🧪
                    </motion.span>
                    <h4 className="font-bold text-xl text-green-300">Test It Out:</h4>
                  </motion.div>
                  <motion.p 
                    className="text-green-200 text-lg italic leading-relaxed cursor-pointer hover:text-green-100 transition-colors"
                    onClick={() => copyToClipboard(setupSteps[activeSetup].testPrompt, "Test prompt", `test-${activeSetup}`)}
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    "{setupSteps[activeSetup].testPrompt}"
                  </motion.p>
                  <motion.p
                    className="text-green-400 text-sm mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    💡 Click to copy this test prompt
                  </motion.p>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Example Prompts */}
      <motion.div 
        className="relative group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-8">
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <span className="text-3xl">💬</span>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 text-transparent bg-clip-text">
              What You Can Ask Your AI Assistant
            </h2>
          </motion.div>
          <motion.div 
            className="grid md:grid-cols-2 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            {examplePrompts.map((category, index) => (
              <motion.div 
                key={index} 
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-slate-900/60 backdrop-blur-lg rounded-xl border border-slate-600/40 p-6 h-full">
                  <motion.div
                    className="flex items-center gap-3 mb-4"
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.span 
                      className="text-2xl"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                    >
                      {category.icon}
                    </motion.span>
                    <h3 className="font-bold text-lg text-slate-100">{category.category}</h3>
                  </motion.div>
                  <div className="space-y-3">
                    {category.prompts.map((prompt, promptIndex) => (
                      <motion.div
                        key={promptIndex}
                        className="relative group cursor-pointer"
                        onClick={() => copyToClipboard(prompt, "Prompt", `prompt-${index}-${promptIndex}`)}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.3 + index * 0.1 + promptIndex * 0.05 }}
                      >
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                        <div className="relative bg-slate-800/60 rounded-lg p-4 border border-slate-600/30 group-hover:border-cyan-400/50 transition-all duration-300">
                          <p className="text-slate-300 italic text-sm leading-relaxed">"{prompt}"</p>
                          <motion.div 
                            className="absolute top-2 right-2 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            initial={{ scale: 0 }}
                            whileHover={{ scale: 1 }}
                          >
                            <AnimatePresence mode="wait">
                              {copiedItems[`prompt-${index}-${promptIndex}`] ? (
                                <motion.span
                                  key="copied"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="text-green-400"
                                >
                                  ✅
                                </motion.span>
                              ) : (
                                <motion.span
                                  key="copy"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  📋
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Security Features */}
      <motion.div 
        className="relative group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-8">
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <motion.span 
              className="text-3xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🔒
            </motion.span>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text">
              Security & Privacy
            </h2>
          </motion.div>
          <motion.div 
            className="grid md:grid-cols-2 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {[
              "Your token is secure - Only you can see it",
              "Limited scope - AI can only access your DegenDuel data, nothing else"
            ].map((feature, index) => (
              <motion.div 
                key={index} 
                className="flex items-start gap-4 group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
              >
                <motion.div 
                  className="text-green-400 mt-1 text-xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                >
                  ✅
                </motion.div>
                <span className="text-green-200 leading-relaxed group-hover:text-green-100 transition-colors">
                  {feature}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Troubleshooting */}
      <motion.div 
        className="relative group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-8">
          <motion.button
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="w-full flex justify-between items-center mb-6 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <motion.div className="flex items-center gap-3">
              <motion.span 
                className="text-3xl"
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🛠️
              </motion.span>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-transparent bg-clip-text">
                Troubleshooting
              </h2>
            </motion.div>
            <motion.span 
              className={`text-2xl text-yellow-400 transform transition-transform duration-300 ${showTroubleshooting ? 'rotate-180' : ''}`}
              whileHover={{ scale: 1.1 }}
            >
              ▼
            </motion.span>
          </motion.button>
          
          <AnimatePresence>
            {showTroubleshooting && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {troubleshootingFAQs.map((faq, index) => (
                  <motion.div 
                    key={index} 
                    className="relative group"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                    <div className="relative bg-slate-900/60 backdrop-blur-lg rounded-xl border border-slate-600/40 p-6">
                      <motion.h3 
                        className="font-bold text-xl mb-4 text-yellow-300 flex items-center gap-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                        >
                          ⚠️
                        </motion.span>
                        {faq.question}
                      </motion.h3>
                      <motion.pre 
                        className="text-slate-300 whitespace-pre-wrap leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        {faq.answer}
                      </motion.pre>
                    </div>
                  </motion.div>
                ))}
                <motion.div 
                  className="relative group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: troubleshootingFAQs.length * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative bg-blue-900/30 backdrop-blur-lg rounded-xl border border-blue-500/30 p-6">
                    <motion.div
                      className="flex items-center gap-3 mb-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <motion.span
                        className="text-2xl"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      >
                        🎧
                      </motion.span>
                      <span className="font-bold text-xl text-blue-300">Still Need Help?</span>
                    </motion.div>
                    <motion.p 
                      className="text-blue-200 leading-relaxed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      Contact support with your error message and which AI assistant you're using. We're here to help!
                    </motion.p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Pro Tips */}
      <motion.div 
        className="relative group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-8">
          <motion.div
            className="flex items-center gap-3 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            <motion.span 
              className="text-3xl"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💡
            </motion.span>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 text-transparent bg-clip-text">
              Pro Tips
            </h2>
          </motion.div>
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            {[
              "Ask follow-up questions - Once AI analyzes your portfolio, ask \"What would you change?\"",
              "Combine insights - \"Compare my performance to the contest winners\"",
              "Real-time updates - Ask about the same token multiple times for live updates",
              "Strategy planning - \"If I have $1000, what's the optimal contest strategy?\""
            ].map((tip, index) => (
              <motion.div 
                key={index} 
                className="flex items-start gap-4 group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.5 + index * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
              >
                <motion.div 
                  className="text-orange-400 mt-1 text-xl flex-shrink-0"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    rotate: [0, 15, -15, 0]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
                >
                  🔥
                </motion.div>
                <span className="text-orange-200 leading-relaxed group-hover:text-orange-100 transition-colors">
                  {tip}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div 
        className="relative group text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4, type: "spring", bounce: 0.3 }}
          >
            <motion.p 
              className="text-2xl text-slate-200 italic leading-relaxed max-w-4xl mx-auto"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              style={{
                backgroundImage: "linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              Ready to supercharge your trading with AI? Generate your token above and connect your assistant in under 2 minutes!
            </motion.p>
            <motion.div
              className="flex justify-center mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.6 }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl"
              >
                🚀
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};