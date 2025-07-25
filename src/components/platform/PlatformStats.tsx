import React from 'react';
import { motion } from 'framer-motion';
import { usePlatformStats } from '../../hooks/usePlatformStats';

interface StatItemProps {
  label: string;
  value: string | number | React.ReactNode;
  delay?: number;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className="group relative bg-gradient-to-br from-slate-950/90 via-gray-950/80 to-slate-900/90 border-2 border-gray-700/40 hover:border-emerald-500/60 transition-all duration-300 overflow-hidden backdrop-blur-sm"
    style={{
      clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
    }}
  >
    {/* Technical grid background */}
    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="0" y1="20" x2="100" y2="20" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1,1" />
        <line x1="0" y1="80" x2="100" y2="80" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1,1" />
        <line x1="20" y1="0" x2="20" y2="100" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1,1" />
        <line x1="80" y1="0" x2="80" y2="100" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1,1" />
      </svg>
    </div>
    
    {/* Corner accent */}
    <div className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-br from-emerald-500/40 to-transparent"></div>
    <div className="absolute bottom-0 left-0 w-3 h-3 bg-gradient-to-tr from-emerald-500/40 to-transparent"></div>
    
    <div className="relative p-8 text-center">
      <h3 className="text-3xl font-bold text-white mb-3 font-mono tracking-wider group-hover:text-emerald-200 transition-colors">{value}</h3>
      <p className="text-emerald-300/90 font-bold text-base uppercase tracking-widest">{label}</p>
    </div>
    
    {/* Subtle glow effect */}
    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/0 via-emerald-500/0 to-emerald-400/0 group-hover:from-emerald-600/5 group-hover:via-emerald-500/3 group-hover:to-emerald-400/5 mix-blend-screen transition-all duration-500" />
  </motion.div>
);

const PlatformStats: React.FC = () => {
  const { stats, loading, error } = usePlatformStats();

  if (loading) {
    return (
      <div className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Platform Statistics</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return null; // Fail silently - stats are supplementary
  }

  const formatSOL = (amount: number) => {
    return (
      <span className="inline-flex items-center gap-2">
        {amount.toFixed(3)}
        <img 
          src="/assets/media/logos/solana.svg" 
          alt="SOL" 
          className="w-6 h-6 inline-block"
        />
      </span>
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Calculate winner payouts (90% of revenue)
  const winnerPayouts = stats.total_revenue * 0.9;

  return (
    <section className="py-12 bg-gradient-to-b from-transparent via-dark-200/10 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Revenue Flow Section - Top Row */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 relative">
            {/* Flow indicators - hidden on mobile */}
            <div className="hidden lg:block absolute inset-0 pointer-events-none">
              {/* Left arrow from Total to Winners */}
              <svg className="absolute left-[33%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-20" viewBox="0 0 100 50">
                <path d="M 90 25 L 10 10 M 10 10 L 15 5 M 10 10 L 15 15" 
                  stroke="#10b981" 
                  strokeWidth="2" 
                  fill="none"
                  strokeDasharray="2,2"
                  opacity="0.3"
                />
                <text x="50" y="15" textAnchor="middle" fill="#10b981" fontSize="10" opacity="0.6">90%</text>
              </svg>
              {/* Right arrow from Total to Holders */}
              <svg className="absolute right-[33%] top-1/2 translate-x-1/2 -translate-y-1/2 w-32 h-20" viewBox="0 0 100 50">
                <path d="M 10 25 L 90 10 M 90 10 L 85 5 M 90 10 L 85 15" 
                  stroke="#10b981" 
                  strokeWidth="2" 
                  fill="none"
                  strokeDasharray="2,2"
                  opacity="0.3"
                />
                <text x="50" y="15" textAnchor="middle" fill="#10b981" fontSize="10" opacity="0.6">10%</text>
              </svg>
            </div>

            {/* Winner Payouts */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="order-2 lg:order-1"
            >
              <StatItem
                label="Winner Payouts"
                value={formatSOL(winnerPayouts)}
                delay={0.1}
              />
            </motion.div>
            
            {/* Total Revenue - Prominent Center Position */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2 lg:scale-110 relative z-10"
            >
              <div className="group relative bg-gradient-to-br from-purple-950/90 via-violet-950/80 to-purple-900/90 border-2 border-purple-700/60 hover:border-purple-500/80 transition-all duration-300 overflow-hidden backdrop-blur-sm shadow-[0_0_30px_rgba(147,51,234,0.3)]"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
                }}
              >
                {/* Special grid for total revenue */}
                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <circle cx="50" cy="50" r="30" fill="none" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2,2" className="animate-pulse" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#a855f7" strokeWidth="0.3" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#a855f7" strokeWidth="0.3" />
                  </svg>
                </div>
                
                <div className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-br from-purple-500/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 bg-gradient-to-tr from-purple-500/40 to-transparent"></div>
                
                <div className="relative p-8 text-center">
                  <h3 className="text-4xl font-bold text-white mb-3 font-mono tracking-wider group-hover:text-purple-200 transition-colors">{formatSOL(stats.total_revenue)}</h3>
                  <p className="text-purple-300 font-bold text-lg uppercase tracking-widest">Total Revenue</p>
                  <p className="text-xs text-purple-400/80 mt-2 font-medium">100% TO COMMUNITY</p>
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/0 via-purple-500/0 to-purple-400/0 group-hover:from-purple-600/5 group-hover:via-purple-500/3 group-hover:to-purple-400/5 mix-blend-screen transition-all duration-500" />
              </div>
            </motion.div>
            
            {/* Holder Dividends */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="order-3"
            >
              <StatItem
                label="Holder Dividends"
                value={formatSOL(stats.estimated_dividends_distributed)}
                delay={0.1}
              />
            </motion.div>
          </div>
        </div>

        {/* Platform Activity Section - Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <StatItem
            label="Total Contests"
            value={formatNumber(stats.total_contests)}
            delay={0.3}
          />
          
          <StatItem
            label="Active Players"
            value={formatNumber(stats.total_contest_entries)}
            delay={0.4}
          />
        </div>
      </div>
    </section>
  );
};

export default PlatformStats;