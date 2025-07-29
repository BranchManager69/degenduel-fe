import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePlatformStats } from '../../hooks/usePlatformStats';
import { getContestImageUrl } from '../../lib/imageUtils';

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
    
    <div className="relative p-6 text-center">
      <h3 className="text-2xl font-bold text-white mb-2 font-mono tracking-wider group-hover:text-emerald-200 transition-colors">{value}</h3>
      <p className="text-emerald-300/90 font-bold text-sm uppercase tracking-widest">{label}</p>
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

  // Create hourly breakdown for the last 24 hours
  const getHourlyBreakdown = () => {
    if (!stats.token_discovery?.recent_tokens) return [];
    
    const now = new Date();
    const hourlyData: Array<{
      hour: number;
      'Pump.fun': number;
      'Believe': number;
      'LetsBONK': number;
      'Jupiter Studio': number;
      'Other': number;
      total: number;
    }> = [];
    
    // Initialize 24 hours of data
    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now);
      hourStart.setHours(now.getHours() - i, 0, 0, 0);
      
      hourlyData.push({
        hour: hourStart.getHours(),
        'Pump.fun': 0,
        'Believe': 0,
        'LetsBONK': 0,
        'Jupiter Studio': 0,
        'Other': 0,
        total: 0
      });
    }
    
    // Count tokens by hour and launch pad
    stats.token_discovery.recent_tokens.forEach(token => {
      const tokenDate = new Date(token.created_at);
      const hoursSinceToken = Math.floor((now.getTime() - tokenDate.getTime()) / (1000 * 60 * 60));
      
      if (hoursSinceToken < 24) {
        const hourIndex = 23 - hoursSinceToken;
        if (hourIndex >= 0 && hourIndex < 24) {
          const address = token.address.toLowerCase();
          let category = 'Other';
          
          if (address.endsWith('pump')) category = 'Pump.fun';
          else if (token.address.endsWith('BLV')) category = 'Believe';
          else if (address.endsWith('bonk')) category = 'LetsBONK';
          else if (address.endsWith('jups')) category = 'Jupiter Studio';
          
          (hourlyData[hourIndex] as any)[category]++;
          hourlyData[hourIndex].total++;
        }
      }
    });
    
    return hourlyData;
  };

  const hourlyBreakdown = getHourlyBreakdown();
  const maxHourlyTotal = Math.max(...hourlyBreakdown.map(h => h.total), 1);

  return (
    <section className="py-8 bg-gradient-to-b from-transparent via-dark-200/10 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Revenue Flow Section - Combined */}
        <div className="mb-6">
          <div className="max-w-2xl mx-auto">
            {/* Total Revenue with Distribution */}
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
                      <p className="text-purple-300/90 font-bold text-sm uppercase tracking-widest">Total Revenue</p>
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

        {/* Platform Activity Section - Bottom Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
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
            
            <div className="relative p-6">
              {/* Main content - same as other StatItems */}
              <h3 className="text-2xl font-bold text-white mb-2 font-mono tracking-wider group-hover:text-emerald-200 transition-colors text-center">{formatNumber(stats.total_contests)}</h3>
              <p className="text-emerald-300/90 font-bold text-sm uppercase tracking-widest text-center">Total Contests</p>
              
              {/* Paid/Free indicators on sides */}
              <div className="absolute inset-y-0 left-3 flex items-center">
                <div className="text-center">
                  <div className="text-xs font-bold text-emerald-400">{stats.paid_contests}</div>
                  <div className="text-[9px] text-gray-400 uppercase">paid</div>
                </div>
              </div>
              <div className="absolute inset-y-0 right-3 flex items-center">
                <div className="text-center">
                  <div className="text-xs font-bold text-emerald-400">{stats.free_contests}</div>
                  <div className="text-[9px] text-gray-400 uppercase">free</div>
                </div>
              </div>
            </div>
            
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/0 via-emerald-500/0 to-emerald-400/0 group-hover:from-emerald-600/5 group-hover:via-emerald-500/3 group-hover:to-emerald-400/5 mix-blend-screen transition-all duration-500" />
          </motion.div>
          
          <StatItem
            label="Active Players"
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
            
            <div className="relative p-4 text-center">
              <p className="text-emerald-300/90 font-bold text-sm uppercase tracking-widest mb-3">Token Stats</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300/80 text-xs">Active</span>
                  <span className="text-white font-bold text-sm">{formatNumber(stats.active_tokens)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300/80 text-xs">Total</span>
                  <span className="text-white font-bold text-sm">{formatNumber(stats.token_discovery.by_source.dual_detection + stats.token_discovery.by_source.legacy)}</span>
                </div>
              </div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/0 via-emerald-500/0 to-emerald-400/0 group-hover:from-emerald-600/5 group-hover:via-emerald-500/3 group-hover:to-emerald-400/5 mix-blend-screen transition-all duration-500" />
          </motion.div>
        </div>

        {/* Token Discovery Section - only show if we have 10+ recent tokens */}
        {stats.token_discovery && totalRecentTokens >= 10 && (
          <div className="mt-10 mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
              
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
                
                <div className="relative p-6">
                  <h3 className="text-lg font-bold text-cyan-200 mb-6">
                    TOKEN SOURCES
                  </h3>
                  
                  <div className="flex justify-between items-end h-40 gap-3">
                    {launchPadBreakdown.map((item) => {
                      const percentage = totalRecentTokens > 0 ? (item.count / totalRecentTokens * 100) : 0;
                      const barHeight = maxCount > 0 ? (item.count / maxCount * 100) : 0;
                      
                      return (
                        <div key={item.name} className="flex-1 flex flex-col items-center justify-end">
                          {/* Percentage above bar */}
                          <div className="mb-1 text-xs font-bold text-white">
                            {percentage.toFixed(0)}%
                          </div>
                          
                          {/* Bar */}
                          <div className="relative w-full max-w-[60px]">
                            <motion.div
                              className="relative bg-gradient-to-t from-cyan-500/80 to-cyan-400/60 rounded-t"
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(barHeight * 1.2, 3)}px` }}
                              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                              style={{ minHeight: '3px' }}
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
                          <div className="mt-2 w-8 h-8 flex items-center justify-center">
                            {item.icon ? (
                              item.name === 'Believe' ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-lime-400">
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
                  
                  <div className="mt-6 pt-3 border-t border-cyan-600/30">
                    <div className="text-center">
                      <span className="text-cyan-300/90 text-sm">Tokens recently added to DegenDuel:</span>
                      <span className="text-white font-bold font-mono ml-2">{totalRecentTokens}</span>
                    </div>
                  </div>
                </div>
                
                {/* Corner accents */}
                <div className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-br from-cyan-400/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 bg-gradient-to-tr from-cyan-400/40 to-transparent"></div>
              </motion.div>
              
              {/* Discovery Rate Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
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
                    <circle cx="50" cy="50" r="35" fill="none" stroke="#06b6d4" strokeWidth="0.3" strokeDasharray="3,3" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#06b6d4" strokeWidth="0.2" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#06b6d4" strokeWidth="0.2" />
                  </svg>
                </div>
                
                <div className="relative p-6">
                  <h3 className="text-lg font-bold text-cyan-200 mb-4">
                    24-HOUR DISCOVERY TIMELINE
                  </h3>
                  
                  {/* Hourly stacked bar chart */}
                  <div className="relative h-32">
                    <div className="absolute inset-0 flex items-end justify-between gap-[2px]">
                      {hourlyBreakdown.map((hourData, index) => {
                        const barHeight = maxHourlyTotal > 0 ? (hourData.total / maxHourlyTotal * 100) : 0;
                        
                        // Define colors for each launch pad based on their actual brand colors
                        const colors = {
                          'Pump.fun': 'from-emerald-600 to-emerald-500',
                          'Believe': 'from-lime-400 to-lime-300',
                          'LetsBONK': 'from-orange-500 to-orange-400',
                          'Jupiter Studio': 'from-teal-500 to-teal-400',
                          'Other': 'from-gray-500 to-gray-400'
                        };
                        
                        let cumulativeHeight = 0;
                        
                        return (
                          <div key={index} className="flex-1 relative flex flex-col justify-end">
                            <motion.div
                              className="relative w-full"
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(barHeight, 2)}%` }}
                              transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.02 }}
                              style={{ minHeight: hourData.total > 0 ? '4px' : '1px' }}
                            >
                              {/* Stack segments for each launch pad */}
                              {['Pump.fun', 'Believe', 'LetsBONK', 'Jupiter Studio', 'Other'].map(platform => {
                                if ((hourData as any)[platform] === 0) return null;
                                const segmentHeight = ((hourData as any)[platform] / hourData.total) * 100;
                                const bottom = cumulativeHeight;
                                cumulativeHeight += segmentHeight;
                                
                                return (
                                  <div
                                    key={platform}
                                    className={`absolute w-full bg-gradient-to-t ${(colors as any)[platform]} opacity-80`}
                                    style={{
                                      bottom: `${bottom}%`,
                                      height: `${segmentHeight}%`
                                    }}
                                  />
                                );
                              })}
                              
                              {/* Show count on hover */}
                              {hourData.total > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                  <span className="text-[8px] font-bold text-white bg-black/50 px-1 rounded">
                                    {hourData.total}
                                  </span>
                                </div>
                              )}
                            </motion.div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Time labels */}
                    <div className="absolute -bottom-6 inset-x-0 flex justify-between text-[8px] text-cyan-400/50">
                      <span>24h ago</span>
                      <span>18h</span>
                      <span>12h</span>
                      <span>6h</span>
                      <span>Now</span>
                    </div>
                  </div>
                  
                  {/* Legend with logos - spread out */}
                  <div className="mt-10 flex flex-wrap justify-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-t from-emerald-600 to-emerald-500 rounded"></div>
                      <img 
                        src="/assets/media/logos/pump.png" 
                        alt="Pump.fun"
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-t from-lime-400 to-lime-300 rounded"></div>
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-lime-400">
                        <img 
                          src="/assets/media/logos/believe.png" 
                          alt="Believe"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-t from-orange-500 to-orange-400 rounded"></div>
                      <img 
                        src="/assets/media/logos/bonk_fun.png" 
                        alt="LetsBONK"
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-t from-teal-500 to-teal-400 rounded"></div>
                      <img 
                        src="/assets/media/logos/jup.png" 
                        alt="Jupiter Studio"
                        className="w-5 h-5 object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-t from-gray-500 to-gray-400 rounded"></div>
                      <div className="w-5 h-5 flex items-center justify-center">
                        <span className="text-[9px] text-cyan-400/70 font-semibold">OTHER</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Summary stats */}
                  <div className="mt-6 pt-3 border-t border-cyan-600/30">
                    <div className="text-center">
                      <span className="text-cyan-300/90 text-sm">{stats.token_discovery.discovered_today} tokens today • {formatNumber(stats.token_discovery.discovered_this_week)} this week</span>
                    </div>
                  </div>
                </div>
                
                {/* Corner accents */}
                <div className="absolute top-0 right-0 w-3 h-3 bg-gradient-to-br from-cyan-400/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 bg-gradient-to-tr from-cyan-400/40 to-transparent"></div>
              </motion.div>
              
            </div>
          </div>
        )}

        {/* Global High Score Section */}
        <div className="mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative bg-gradient-to-br from-yellow-950/90 via-amber-950/80 to-yellow-900/90 border-2 border-yellow-600/60 hover:border-yellow-400/80 transition-all duration-300 overflow-hidden backdrop-blur-sm shadow-[0_0_40px_rgba(245,158,11,0.4)]"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))'
            }}
          >
            {/* Crown background pattern */}
            <div className="absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity duration-500">
              <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                <path d="M20 80 L40 20 L60 80 L80 30 L100 80 L120 25 L140 80 L160 35 L180 80" 
                  stroke="#f59e0b" strokeWidth="0.5" fill="none" strokeDasharray="2,2" />
                <circle cx="100" cy="50" r="25" fill="none" stroke="#f59e0b" strokeWidth="0.3" strokeDasharray="3,3" />
              </svg>
            </div>

            {/* Golden corner accents */}
            <div className="absolute top-0 right-0 w-4 h-4 bg-gradient-to-br from-yellow-400/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 bg-gradient-to-tr from-yellow-400/60 to-transparent"></div>

            {/* Contest Banner Image */}
            {stats.global_high_score.contest_image_url && (
              <div 
                className="absolute inset-x-0 top-0 h-40 overflow-hidden"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)'
                }}
              >
                <style>{`
                  @keyframes globalHighScoreScan {
                    0%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-20%); }
                    60% { transform: translateY(-20%); }
                  }
                `}</style>
                <img 
                  src={getContestImageUrl(stats.global_high_score.contest_image_url) || ""} 
                  alt={stats.global_high_score.contest_name}
                  className="w-full h-56 object-cover object-top group-hover:scale-110"
                  style={{
                    animation: 'globalHighScoreScan 20s ease-in-out infinite',
                    transition: 'transform 0.7s ease-out',
                    filter: 'brightness(0.85) saturate(1.1)'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className={`relative p-6 ${stats.global_high_score.contest_image_url ? 'pt-20' : ''}`}>
              <div className="text-center mb-4 relative z-10">
                <h3 className="text-3xl font-bold text-yellow-200 mb-1" style={{
                  textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                }}>
                  GLOBAL HIGH SCORE
                </h3>
                <p className="text-yellow-300/80 text-sm uppercase tracking-widest">All-Time Best Performance</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-4 items-stretch">
                {/* Player Info - Now takes 70% of space */}
                <div className="text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start gap-3 mb-2">
                    <img 
                      src={stats.global_high_score.profile_image_url} 
                      alt={stats.global_high_score.nickname}
                      className="w-12 h-12 rounded-full border-2 border-yellow-400/60 shadow-lg"
                    />
                    <div>
                      <h4 className="text-lg font-bold text-white">{stats.global_high_score.nickname}</h4>
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/contests/${stats.global_high_score.contest_id}`}
                          className="text-yellow-300/80 text-xs hover:text-yellow-200 hover:underline transition-colors"
                        >
                          {stats.global_high_score.contest_name}
                        </Link>
                        <span className="text-yellow-400/70 text-[10px]">
                          {new Date(stats.global_high_score.contest_start_time).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Stats side by side */}
                <div className="text-center flex justify-between gap-2">
                  <div className="flex-1">
                    <span className="text-yellow-300/80 text-xs block">Start</span>
                    <div className="text-white font-bold text-sm">
                      {formatSOL(stats.global_high_score.initial_balance_sol)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <span className="text-yellow-300/80 text-xs block">End</span>
                    <div className="text-white font-bold text-sm">
                      {formatSOL(stats.global_high_score.portfolio_value_sol)}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <span className="text-yellow-300/80 text-xs block">Gain</span>
                    <div className="text-xl font-bold text-yellow-300">
                      +{stats.global_high_score.percentage_gain.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Golden glow effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-600/0 via-yellow-500/0 to-yellow-400/0 hover:from-yellow-600/5 hover:via-yellow-500/3 hover:to-yellow-400/5 mix-blend-screen transition-all duration-500" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PlatformStats;