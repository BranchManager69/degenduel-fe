import { motion } from 'framer-motion';
import React from 'react';
import { usePlatformStats } from '../../hooks/usePlatformStats';
import { GlobalHighScore } from './GlobalHighScore';
import { RecentContestWinner } from './RecentContestWinner';

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
    
    <div className="relative p-3 sm:p-6 text-center">
      <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2 font-mono tracking-wider group-hover:text-emerald-200 transition-colors">{value}</h3>
      <p className="text-emerald-300/90 font-bold text-xs sm:text-sm uppercase tracking-widest">{label}</p>
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
            <h2 className="text-2xl font-bold mb-8 font-cyber tracking-wide bg-gradient-to-r from-green-400 to-brand-500 text-transparent bg-clip-text">Platform Statistics</h2>
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
      <span className="inline-flex items-center gap-1">
        {amount.toFixed(3)}
        <img 
          src="/assets/media/logos/solana.svg" 
          alt="SOL" 
          className="w-5 h-5 inline-block"
        />
      </span>
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };


  // Calculate winner payouts (90% of revenue)
  const winnerPayouts = stats.total_revenue * 0.9;

  // Categorize tokens by launch pad using address suffix heuristic
  const categorizeTokensByLaunchPad = () => {
    if (!stats.token_discovery?.recent_tokens) return [];
    
    const categories = {
      'Pump.fun': { count: 0, icon: '/assets/media/logos/pump.png' },
      'Believe': { count: 0, icon: '/assets/media/logos/believe.png' },
      'LetsBONK': { count: 0, icon: '/assets/media/logos/bonk_fun.png' },
      'Jupiter Studio': { count: 0, icon: '/assets/media/logos/jup.png' },
      'Other': { count: 0, icon: null }
    };
    
    stats.token_discovery.recent_tokens.forEach(token => {
      const address = token.address.toLowerCase();
      if (address.endsWith('pump')) {
        categories['Pump.fun'].count++;
      } else if (token.address.endsWith('BLV')) { // Case sensitive for Believe
        categories['Believe'].count++;
      } else if (address.endsWith('bonk')) {
        categories['LetsBONK'].count++;
      } else if (address.endsWith('jups')) {
        categories['Jupiter Studio'].count++;
      } else {
        categories['Other'].count++;
      }
    });
    
    // Convert to array and sort by count, but keep "Other" at the end
    const categoriesArray = Object.entries(categories)
      .map(([name, data]) => ({ name, ...data }));
    
    // Separate "Other" from the rest
    const other = categoriesArray.find(item => item.name === 'Other');
    const launchPads = categoriesArray.filter(item => item.name !== 'Other');
    
    // Sort launch pads by count (descending)
    launchPads.sort((a, b) => b.count - a.count);
    
    // Return sorted launch pads with "Other" at the end
    return other ? [...launchPads, other] : launchPads;
  };

  const launchPadBreakdown = categorizeTokensByLaunchPad();
  const totalRecentTokens = launchPadBreakdown.reduce((sum, item) => sum + item.count, 0);
  const maxCount = Math.max(...launchPadBreakdown.map(item => item.count), 1);



  return (
    <section className="py-4 bg-gradient-to-b from-transparent via-dark-200/10 to-transparent">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Total Revenue - First */}
        <div className="mb-4">
          <div className="max-w-sm mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:scale-110 relative z-10"
            >
              <div className="group relative bg-gradient-to-br from-purple-950/90 via-violet-950/80 to-purple-900/90 border-2 border-purple-700/60 hover:border-purple-500/80 transition-all duration-300 overflow-hidden backdrop-blur-sm shadow-[0_0_30px_rgba(147,51,234,0.3)]"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
                }}
              >
                <div className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity duration-500">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M10 10 L90 10 L90 90 L10 90 Z" stroke="#a855f7" strokeWidth="0.3" fill="none" strokeDasharray="1,2" />
                    <circle cx="50" cy="50" r="30" stroke="#a855f7" strokeWidth="0.2" fill="none" strokeDasharray="2,2" />
                  </svg>
                </div>
                
                <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-purple-400/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 bg-gradient-to-tr from-purple-400/60 to-transparent"></div>
                
                <div className="relative p-6">
                  <div className="flex items-center justify-center gap-8">
                    {/* Left - Winners */}
                    <div className="text-center">
                      <div className="text-purple-200/80 font-bold text-sm">{formatSOL(winnerPayouts)}</div>
                      <div className="text-purple-400/70 text-xs">Winners</div>
                    </div>
                    
                    {/* Center - Total Revenue */}
                    <div className="text-center">
                      <h3 className="text-3xl font-bold text-white mb-2 font-mono tracking-wider group-hover:text-purple-200 transition-colors">{formatSOL(stats.total_revenue)}</h3>
                      <p className="text-purple-300/90 font-bold text-sm uppercase tracking-widest">Activity</p>
                    </div>
                    
                    {/* Right - Holders */}
                    <div className="text-center">
                      <div className="text-purple-200/80 font-bold text-sm">{formatSOL(stats.estimated_dividends_distributed)}</div>
                      <div className="text-purple-400/70 text-xs">Holders</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/0 via-purple-500/0 to-purple-400/0 group-hover:from-purple-600/10 group-hover:via-purple-500/5 group-hover:to-purple-400/10 mix-blend-screen transition-all duration-500" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Platform Activity Section - Three side by side stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-3xl mx-auto mb-4">
          {/* Contest Breakdown - Modified StatItem */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
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
            
            <div className="relative p-3 sm:p-6">
              {/* Main content - same as other StatItems */}
              <h3 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2 font-mono tracking-wider group-hover:text-emerald-200 transition-colors text-center">{formatNumber(stats.total_contests)}</h3>
              <p className="text-emerald-300/90 font-bold text-xs sm:text-sm uppercase tracking-widest text-center">Contests</p>
              
              {/* Paid/Free indicators on sides */}
              <div className="absolute inset-y-0 left-3 flex items-center">
                <div className="text-center">
                  <div className="text-xs font-bold text-emerald-400 leading-tight">{stats.paid_contests}</div>
                  <div className="text-[9px] text-gray-400 uppercase leading-tight">paid</div>
                </div>
              </div>
              <div className="absolute inset-y-0 right-3 flex items-center">
                <div className="text-center">
                  <div className="text-xs font-bold text-emerald-400 leading-tight">{stats.free_contests}</div>
                  <div className="text-[9px] text-gray-400 uppercase leading-tight">free</div>
                </div>
              </div>
            </div>
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/0 via-emerald-500/0 to-emerald-400/0 group-hover:from-emerald-600/5 group-hover:via-emerald-500/3 group-hover:to-emerald-400/5 mix-blend-screen transition-all duration-500" />
          </motion.div>
          
          <StatItem
            label="Players"
            value={formatNumber(stats.total_users)}
            delay={0.3}
          />
          
          {/* Token Stats Combined */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="group relative bg-gradient-to-br from-slate-950/90 via-gray-950/80 to-slate-900/90 border-2 border-gray-700/40 hover:border-emerald-500/60 transition-all duration-300 overflow-hidden backdrop-blur-sm"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
            }}
          >
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="100" y2="20" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1,1" />
                <line x1="0" y1="80" x2="100" y2="80" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1,1" />
                <line x1="20" y1="0" x2="20" y2="100" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1,1" />
                <line x1="80" y1="0" x2="80" y2="100" stroke="#10b981" strokeWidth="0.3" strokeDasharray="1,1" />
              </svg>
            </div>
            
            <div className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-br from-emerald-500/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 bg-gradient-to-tr from-emerald-500/40 to-transparent"></div>
            
            <div className="relative p-3 sm:p-6 text-center">
              <div className="space-y-0.5 mb-1 sm:mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300/80 text-[10px] sm:text-xs">Active</span>
                  <span className="text-white font-bold text-xs sm:text-sm">{formatNumber(stats.active_tokens)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300/80 text-[10px] sm:text-xs">Total</span>
                  <span className="text-white font-bold text-xs sm:text-sm">{formatNumber(stats.token_discovery.by_source.dual_detection + stats.token_discovery.by_source.legacy)}</span>
                </div>
              </div>
              <p className="text-emerald-300/90 font-bold text-xs sm:text-sm uppercase tracking-widest">Tokens</p>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/0 via-emerald-500/0 to-emerald-400/0 group-hover:from-emerald-600/5 group-hover:via-emerald-500/3 group-hover:to-emerald-400/5 mix-blend-screen transition-all duration-500" />
          </motion.div>
        </div>

        {/* Winner Cards - Side by side on desktop, stacked on mobile */}
        <div className="mt-4 mb-6 w-full flex flex-col lg:flex-row gap-4">
          {/* Latest Winner */}
          <div className="flex-1">
            <RecentContestWinner data={stats.recent_contest_winner} delay={0.4} />
          </div>
          {/* All Time Best */}
          <div className="flex-1">
            <GlobalHighScore data={stats.global_high_score} delay={0.5} />
          </div>
        </div>

        {/* Token Discovery Section - TEMPORARILY REMOVED - only show Launch Pad Breakdown if we have 5+ recent tokens */}
        {false && stats?.token_discovery && totalRecentTokens >= 5 && (
          <div className="mt-6 mb-6">
            <div className="max-w-md mx-auto">
              
              {/* Launch Pad Breakdown Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="relative bg-gradient-to-br from-cyan-950/90 via-teal-950/80 to-cyan-900/90 border-2 border-cyan-600/50 hover:border-cyan-400/70 transition-all duration-300 overflow-hidden backdrop-blur-sm"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
                }}
              >
                {/* Tech grid background */}
                <div className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity duration-500">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <rect x="10" y="10" width="80" height="80" fill="none" stroke="#06b6d4" strokeWidth="0.3" strokeDasharray="2,2" />
                    <line x1="0" y1="30" x2="100" y2="30" stroke="#06b6d4" strokeWidth="0.2" strokeDasharray="1,1" />
                    <line x1="0" y1="70" x2="100" y2="70" stroke="#06b6d4" strokeWidth="0.2" strokeDasharray="1,1" />
                  </svg>
                </div>
                
                <div className="relative p-4 h-full flex flex-col">
                  <h3 className="text-sm font-bold text-cyan-200 mb-3">
                    TOKENS RECENTLY ADDED
                  </h3>
                  
                  <div className="flex justify-between items-end flex-1 gap-2" style={{ minHeight: '120px' }}>
                    {launchPadBreakdown.map((item) => {
                      const percentage = totalRecentTokens > 0 ? (item.count / totalRecentTokens * 100) : 0;
                      const barHeight = maxCount > 0 ? (item.count / maxCount * 80) : 0;
                      
                      return (
                        <div key={item.name} className="flex-1 flex flex-col items-center justify-end">
                          {/* Bar with percentage */}
                          <div className="relative w-full max-w-[60px] flex flex-col items-center">
                            {/* Percentage */}
                            <div className="mb-1 text-xs font-bold text-white">
                              {percentage.toFixed(0)}%
                            </div>
                            
                            {/* Bar */}
                            <motion.div
                              className="relative bg-gradient-to-t from-cyan-500/80 to-cyan-400/60 rounded-t w-full"
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(barHeight, 8)}px` }}
                              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                              style={{ minHeight: '8px' }}
                            >
                              {/* Count inside bar */}
                              {item.count > 0 && (
                                <div className="absolute inset-x-0 bottom-1 text-center">
                                  <div className="text-[9px] font-bold text-black/80">{item.count}</div>
                                </div>
                              )}
                            </motion.div>
                          </div>
                          
                          {/* Icon or placeholder */}
                          <div className="mt-1 w-6 h-6 flex items-center justify-center">
                            {item.icon ? (
                              item.name === 'Believe' ? (
                                <div className="w-6 h-6 rounded-full overflow-hidden bg-lime-400">
                                  <img 
                                    src={item.icon} 
                                    alt={item.name}
                                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                                  />
                                </div>
                              ) : (
                                <img 
                                  src={item.icon} 
                                  alt={item.name}
                                  className="w-full h-full object-contain opacity-80 hover:opacity-100 transition-opacity"
                                />
                              )
                            ) : item.name === 'Other' ? (
                              <div className="flex items-center justify-center">
                                <span className="text-[10px] text-cyan-400/70 uppercase tracking-wider">Other</span>
                              </div>
                            ) : (
                              <div className="w-full h-full rounded bg-cyan-600/20 flex items-center justify-center">
                                <span className="text-xs text-cyan-400 font-bold">
                                  {item.name.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Corner accents */}
                <div className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-br from-cyan-400/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 bg-gradient-to-tr from-cyan-400/40 to-transparent"></div>
              </motion.div>
              
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default PlatformStats;