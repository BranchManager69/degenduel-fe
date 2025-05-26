import React, { useState } from "react";
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
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.div 
        className="text-center space-y-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.h1 
          className="text-5xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-transparent bg-clip-text relative"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          Setup Guide
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 blur-2xl animate-pulse"></div>
        </motion.h1>
        <motion.p 
          className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Connect your AI assistant to DegenDuel in minutes. Get live market data, portfolio insights, and trading intelligence.
        </motion.p>
      </motion.div>

      {/* Benefits Grid */}
      <motion.div 
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
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
            <div className="relative bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 p-6 h-full">
              <motion.div 
                className="text-4xl mb-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
              >
                {benefit.icon}
              </motion.div>
              <h3 className="font-bold text-xl mb-3 text-slate-100">{benefit.title}</h3>
              <p className="text-slate-400 leading-relaxed">{benefit.desc}</p>
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
            <span className="text-3xl">📦</span>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 text-transparent bg-clip-text">
              Installation
            </h2>
          </motion.div>
          <motion.p 
            className="text-slate-300 mb-6 text-lg"
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
              <pre className="text-lg text-slate-200 font-mono relative z-10">
                npm install -g degenduel-mcp-server
              </pre>
              <motion.button
                onClick={() => copyToClipboard("npm install -g degenduel-mcp-server", "Installation command", "install-cmd")}
                className="absolute top-3 right-3 px-4 py-2 bg-gradient-to-r from-green-500 to-cyan-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-cyan-600 transition-all duration-200 flex items-center gap-2"
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
            <span className="text-3xl">⚡</span>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              How It Works
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-8">
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
                  className={`w-16 h-16 bg-gradient-to-r ${
                    step.color === 'cyan' ? 'from-cyan-500 to-cyan-600' :
                    step.color === 'purple' ? 'from-purple-500 to-purple-600' :
                    step.color === 'pink' ? 'from-pink-500 to-pink-600' :
                    'from-green-500 to-green-600'
                  } rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-4 text-white shadow-lg`}
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
                  className="text-2xl mb-3"
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
                <h3 className="font-bold text-lg mb-3 text-slate-100">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Setup Instructions */}
      <motion.div 
        className="relative group"
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