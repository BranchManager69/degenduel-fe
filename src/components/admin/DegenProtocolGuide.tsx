import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import {
    FaBurn, FaChartLine,
    FaCheckCircle,
    FaChevronDown,
    FaCog,
    FaExchangeAlt,
    FaExclamationTriangle,
    FaFire, FaGhost,
    FaInfoCircle,
    FaRandom,
    FaRocket,
    FaShieldAlt,
    FaSkull,
    FaTimesCircle,
    FaTint,
    FaWater,
    FaWind
} from 'react-icons/fa';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'primary' | 'warning' | 'success' | 'danger';
}

const Section: React.FC<SectionProps> = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  variant = 'primary' 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantStyles = {
    primary: 'border-purple-500/30 bg-purple-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    success: 'border-green-500/30 bg-green-500/5',
    danger: 'border-red-500/30 bg-red-500/5'
  };

  const iconColors = {
    primary: 'text-purple-400',
    warning: 'text-yellow-400',
    success: 'text-green-400',
    danger: 'text-red-400'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg overflow-hidden mb-4 ${variantStyles[variant]}`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={`text-xl ${iconColors[variant]}`}>{icon}</span>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FaChevronDown className="text-gray-400" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10"
          >
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CodeBlock: React.FC<{ children: string; language?: string }> = ({ 
  children 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-black/50 border border-gray-700 rounded-lg p-4 overflow-x-auto">
        <code className="text-sm text-gray-300 font-mono">{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
};

const InfoBox: React.FC<{ 
  type: 'warning' | 'info' | 'success' | 'danger';
  children: React.ReactNode;
}> = ({ type, children }) => {
  const styles = {
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
    success: 'bg-green-500/10 border-green-500/30 text-green-200',
    danger: 'bg-red-500/10 border-red-500/30 text-red-200'
  };

  const icons = {
    warning: <FaExclamationTriangle />,
    info: <FaInfoCircle />,
    success: <FaCheckCircle />,
    danger: <FaTimesCircle />
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${styles[type]}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">{icons[type]}</span>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

export const DegenProtocolGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'implementation' | 'operations'>('overview');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <FaSkull className="text-purple-400" />
          THE DEGEN PROTOCOL
          <FaSkull className="text-purple-400" />
        </h1>
        <p className="text-xl text-gray-400">Leave No Trace, Make It Rain</p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-gray-700">
        {[
          { id: 'overview', label: 'Overview', icon: <FaInfoCircle /> },
          { id: 'implementation', label: 'Implementation', icon: <FaCog /> },
          { id: 'operations', label: 'Operations', icon: <FaRocket /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Critical Warning */}
            <InfoBox type="danger">
              <h3 className="font-bold mb-2">⚠️ Critical Bubblemaps Detection Risk</h3>
              <p>Direct wallet-to-wallet transfers create permanent, visible connections on Bubblemaps. 
              With 286 wallets, traditional approaches would create a massive, easily detectable cluster!</p>
            </InfoBox>

            {/* Core Philosophy */}
            <Section title="Core Philosophy" icon={<FaGhost />} defaultOpen={true}>
              <div className="space-y-4">
                <p className="text-gray-300">
                  The DEGEN PROTOCOL ensures your wallet operations remain undetectable by blockchain analysis tools.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { rule: "NEVER direct wallet-to-wallet transfers", icon: <FaTimesCircle /> },
                    { rule: "ALWAYS route through DEXs/legitimate contracts", icon: <FaExchangeAlt /> },
                    { rule: "BURN wallets after limited use", icon: <FaBurn /> },
                    { rule: "MIMIC organic trading patterns", icon: <FaChartLine /> },
                    { rule: "CHAOS is your friend", icon: <FaWind /> }
                  ].map((principle, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ scale: 1.02 }}
                      className="bg-black/30 border border-purple-500/20 rounded-lg p-4 flex items-center gap-3"
                    >
                      <span className="text-purple-400 text-xl">{principle.icon}</span>
                      <span className="text-sm text-gray-300">{principle.rule}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Section>

            {/* How Bubblemaps Works */}
            <Section title="How Bubblemaps Detects Clusters" icon={<FaExclamationTriangle />} variant="warning">
              <div className="space-y-4">
                <InfoBox type="info">
                  <p>Two wallets are connected if there was <strong>at least ONE historical transaction</strong> between them in the native token (SOL on Solana).</p>
                </InfoBox>
                
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">What This Means:</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li>• Every wallet that sends to another creates a permanent link</li>
                    <li>• 286 wallets jumbling = potentially thousands of connections</li>
                    <li>• This would create a GIANT BUBBLE showing all wallets are related</li>
                  </ul>
                </div>
              </div>
            </Section>

            {/* The Solution */}
            <Section title="The Solution: Ghost Wallets" icon={<FaGhost />} variant="success">
              <div className="space-y-4">
                <h4 className="font-semibold text-white">Burn After Use Strategy:</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h5 className="font-semibold text-green-400 mb-2">No Persistent Connections</h5>
                    <p className="text-sm text-gray-300">Each wallet is used once then discarded</p>
                  </div>
                  
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h5 className="font-semibold text-green-400 mb-2">No Clustering Pattern</h5>
                    <p className="text-sm text-gray-300">Wallets never interact with each other twice</p>
                  </div>
                  
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <h5 className="font-semibold text-green-400 mb-2">Clean Slate</h5>
                    <p className="text-sm text-gray-300">New wallets have no transaction history</p>
                  </div>
                </div>
              </div>
            </Section>
          </motion.div>
        )}

        {activeTab === 'implementation' && (
          <motion.div
            key="implementation"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Wallet Lifecycle */}
            <Section title="Wallet Lifecycle Management" icon={<FaCog />} defaultOpen={true}>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-white mb-3">The SPAWNER - Wallet Generation</h4>
                  <CodeBlock>{`{
  action: 'spawnWallets',
  config: {
    batchSize: 50,              // Generate in batches
    fundingStrategy: 'cascade', // How to fund them
    initialSol: 0.05,          // Just enough for ops
    metadata: {
      birthBlock: currentBlock,
      maxUses: 5,             // Burn after 5 operations
      role: 'trader'          // Can be: trader, sniper, dumper, accumulator
    }
  }
}`}</CodeBlock>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-3">Wallet Roles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { 
                        role: 'Trader', 
                        desc: 'Normal DeFi user behavior',
                        activities: 'Swaps, LP, Staking'
                      },
                      { 
                        role: 'Whale', 
                        desc: 'Large holder behavior',
                        activities: 'Large swaps, Major LP positions'
                      },
                      { 
                        role: 'Degen', 
                        desc: 'Aggressive trader behavior',
                        activities: 'Frequent swaps, New tokens, Quick flips'
                      },
                      { 
                        role: 'Sleeper', 
                        desc: 'Dormant then active',
                        activities: 'Hold, Occasional trades'
                      }
                    ].map((role) => (
                      <div key={role.role} className="bg-black/30 border border-gray-700 rounded-lg p-4">
                        <h5 className="font-semibold text-purple-400 mb-1">{role.role}</h5>
                        <p className="text-sm text-gray-400 mb-2">{role.desc}</p>
                        <p className="text-xs text-gray-500">{role.activities}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* Movement Patterns */}
            <Section title="Movement Patterns" icon={<FaExchangeAlt />} variant="primary">
              <div className="space-y-6">
                {/* DEX Hopping */}
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <FaRandom className="text-purple-400" />
                    Pattern 1: DEX Hopping
                  </h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>→ Wallet A → Raydium (swap SOL→USDC)</p>
                    <p>→ Wait 5-30 minutes</p>
                    <p>→ Raydium → Wallet B (different amount)</p>
                    <p>→ Wallet B → Orca (swap USDC→SOL)</p>
                    <p>→ Wait 10-60 minutes</p>
                    <p>→ Orca → Wallet C (different amount)</p>
                  </div>
                  <p className="text-green-400 text-sm mt-2">✓ Result: Funds moved A→C with no direct connection</p>
                </div>

                {/* LP Washing */}
                <div className="bg-black/30 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <FaWater className="text-blue-400" />
                    Pattern 2: Liquidity Pool Washing
                  </h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>→ Wallet A → Add liquidity to Pool</p>
                    <p>→ Wait 2-24 hours</p>
                    <p>→ Wallet B → Remove liquidity from same pool</p>
                    <p>→ Natural fees/IL create amount differences</p>
                  </div>
                  <p className="text-green-400 text-sm mt-2">✓ Result: Clean fund movement with legitimate purpose</p>
                </div>
              </div>
            </Section>

            {/* OPSEC Rules */}
            <Section title="OPSEC Commandments" icon={<FaShieldAlt />} variant="danger">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Never Reuse Burned Wallets",
                  "Randomize Everything",
                  "Create Losers (20% lose money)",
                  "Mix Real DeFi Activity",
                  "Time Zone Awareness",
                  "Never Connect Controlled Wallets",
                  "Maintain Wallet Diversity",
                  "Leave No Pattern",
                  "Create Natural Losses",
                  "Document Nothing On-Chain"
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-red-400 font-bold">{idx + 1}.</span>
                    <span className="text-sm text-gray-300">{rule}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}

        {activeTab === 'operations' && (
          <motion.div
            key="operations"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Operation Modes */}
            <div className="space-y-4">
              {/* Accumulation Mode */}
              <Section title="ACCUMULATION MODE - The Vacuum" icon={<FaTint />} variant="primary">
                <div className="space-y-4">
                  <p className="text-gray-300">Use 50-100 wallets to slowly accumulate your target token.</p>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <h5 className="font-semibold text-white mb-2">Strategy:</h5>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li>• Duration: 7-14 days</li>
                      <li>• Trades: 2-5 per wallet per day</li>
                      <li>• Amounts: $100-$1000 per trade</li>
                      <li>• Camouflage: Buy other tokens, provide liquidity, make mistakes</li>
                    </ul>
                  </div>
                </div>
              </Section>

              {/* Distribution Mode */}
              <Section title="DISTRIBUTION MODE - The Sprinkler" icon={<FaWater />} variant="success">
                <div className="space-y-4">
                  <p className="text-gray-300">Distribute accumulated tokens across the market.</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-400">30%</p>
                      <p className="text-sm text-gray-400">Profit Takers</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-400">40%</p>
                      <p className="text-sm text-gray-400">Holders</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-purple-400">30%</p>
                      <p className="text-sm text-gray-400">Reinvestors</p>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Chaos Mode */}
              <Section title="CHAOS MODE - The Tornado" icon={<FaWind />} variant="warning">
                <div className="space-y-4">
                  <InfoBox type="warning">
                    <p>Create massive activity to hide real operations. Make it impossible to distinguish real ops from noise!</p>
                  </InfoBox>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <h5 className="font-semibold text-white mb-2">Activities:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        "Random swaps between 20+ tokens",
                        "Arbitrage attempts (some fail)",
                        "MEV sandwich attacks",
                        "Liquidation hunting",
                        "New token sniping",
                        "Rug pull victims (small amounts)"
                      ].map((activity) => (
                        <div key={activity} className="text-sm text-gray-300 flex items-center gap-2">
                          <FaFire className="text-orange-400 text-xs" />
                          {activity}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            </div>

            {/* Implementation Timeline */}
            <Section title="Implementation Timeline" icon={<FaRocket />} variant="success">
              <div className="space-y-4">
                {[
                  { 
                    phase: "Phase 1: Infrastructure", 
                    duration: "Week 1",
                    tasks: ["Wallet generation system", "DEX integration", "Operation scheduler", "Monitoring dashboard"]
                  },
                  { 
                    phase: "Phase 2: Testing", 
                    duration: "Week 2",
                    tasks: ["Test with 10 wallets", "Verify no Bubblemaps clustering", "Optimize gas usage", "Refine algorithms"]
                  },
                  { 
                    phase: "Phase 3: Rollout", 
                    duration: "Week 3-4",
                    tasks: ["Start with 50 wallets", "Implement all patterns", "Monitor detection", "Scale to 286 wallets"]
                  },
                  { 
                    phase: "Phase 4: Operations", 
                    duration: "Ongoing",
                    tasks: ["Run all modes", "Continuous refresh", "Adapt patterns", "Monitor analytics"]
                  }
                ].map((phase) => (
                  <div key={phase.phase} className="bg-black/30 border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-semibold text-white">{phase.phase}</h5>
                      <span className="text-sm text-purple-400">{phase.duration}</span>
                    </div>
                    <ul className="space-y-1">
                      {phase.tasks.map((task) => (
                        <li key={task} className="text-sm text-gray-300 flex items-center gap-2">
                          <FaCheckCircle className="text-green-400 text-xs" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            {/* Success Metrics */}
            <Section title="Success Metrics" icon={<FaChartLine />} variant="primary">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/30 border border-purple-500/30 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">500+</p>
                  <p className="text-sm text-gray-400">Daily Transactions</p>
                </div>
                <div className="bg-black/30 border border-green-500/30 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">0</p>
                  <p className="text-sm text-gray-400">Bubblemaps Clusters</p>
                </div>
                <div className="bg-black/30 border border-blue-500/30 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">100%</p>
                  <p className="text-sm text-gray-400">Organic Looking</p>
                </div>
                <div className="bg-black/30 border border-yellow-500/30 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-400">&lt;1%</p>
                  <p className="text-sm text-gray-400">Detection Rate</p>
                </div>
              </div>
            </Section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <p className="text-gray-400 text-sm">
          The DEGEN PROTOCOL: Where chaos meets calculation, and every wallet tells a different story! 🚀
        </p>
      </motion.div>
    </div>
  );
}; 