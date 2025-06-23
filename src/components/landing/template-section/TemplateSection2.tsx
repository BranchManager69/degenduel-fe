import { motion } from 'framer-motion';
import React from 'react';

interface TemplateSection2Props {
  title?: string;
  subtitle?: string;
  items?: Array<{
    id: number;
    title: string;
    description: string;
    status?: string;
    performance?: string;
  }>;
}

const TemplateSection2: React.FC<TemplateSection2Props> = ({
  title = "INSTITUTIONAL SOLUTIONS",
  subtitle = "Enterprise-grade infrastructure and advanced trading protocols designed for institutional portfolio management and algorithmic execution strategies.",
  items = [
    {
      id: 1,
      title: "Quantum Execution Engine",
      description: "Ultra-low latency order routing system leveraging quantum computing principles to optimize trade execution across fragmented liquidity pools. Proprietary algorithms minimize market impact while maximizing fill rates through advanced order flow analysis and dynamic liquidity detection protocols.",
      status: "OPERATIONAL",
      performance: "99.97% Uptime"
    },
    {
      id: 2,
      title: "Institutional API Gateway", 
      description: "Professional-grade RESTful and WebSocket APIs with enterprise security protocols, comprehensive rate limiting, and institutional-level SLA guarantees. Advanced authentication, real-time market data streaming, and programmatic portfolio management capabilities designed for algorithmic trading systems.",
      status: "ENHANCED",
      performance: "< 5ms Response"
    }
  ]
}) => {
  const secondaryVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

  return (
    <motion.div
      className="relative w-full mt-12 md:mt-20"
      variants={secondaryVariants}
    >
      <div className="w-full max-w-none sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="relative inline-block">
            <h2 className="text-2xl md:text-4xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-brand-400 to-cyan-500 tracking-wider uppercase relative inline-block mb-4">
              {title}
              <div className="absolute -bottom-2 md:-bottom-3 left-0 right-0 h-0.5 md:h-1 bg-gradient-to-r from-cyan-400 via-brand-400 to-cyan-500 rounded-full" />
            </h2>
          </div>
          <p className="text-base md:text-lg text-gray-300 mt-4 md:mt-6 max-w-4xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Section Content - Advanced Layout */}
        <div className="space-y-12">
          
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className="group relative"
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
            >
              {/* Advanced container with angled design */}
              <div className="relative overflow-hidden">
                
                {/* Background layers */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5" />
                <div 
                  className="absolute inset-0 border-l-2 border-r-2 border-cyan-400/20 group-hover:border-cyan-400/40 transition-all duration-700"
                  style={{
                    transform: index % 2 === 0 ? 'skewX(-2deg)' : 'skewX(2deg)'
                  }}
                />
                
                {/* Content area */}
                <div 
                  className="relative p-12 backdrop-blur-sm bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-y border-white/10"
                  style={{
                    transform: index % 2 === 0 ? 'skewX(-1deg)' : 'skewX(1deg)'
                  }}
                >
                  <div style={{ transform: index % 2 === 0 ? 'skewX(1deg)' : 'skewX(-1deg)' }}>
                    
                    {/* Header section */}
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-1 h-12 bg-gradient-to-b from-cyan-400 to-blue-500" />
                          <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-500">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-3 py-1 border border-cyan-400/20">
                                {item.status}
                              </span>
                              <span className="text-xs font-mono text-gray-400">
                                {item.performance}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Performance indicator */}
                      <div className="text-right">
                        <div className="w-16 h-16 border border-cyan-400/30 flex items-center justify-center">
                          <div className="w-8 h-8 bg-cyan-400/20 animate-pulse" style={{
                            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-gray-300 text-base leading-relaxed max-w-4xl">
                      {item.description}
                    </div>

                    {/* Bottom accent */}
                    <div className="mt-8 flex items-center gap-4">
                      <div className="flex-1 h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/50 to-cyan-400/0" />
                      <div className="text-xs font-mono text-cyan-400 opacity-60">
                        TIER {item.id} INFRASTRUCTURE
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-cyan-400/0 via-cyan-400/50 to-cyan-400/0" />
                    </div>
                    
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

        </div>

        {/* Sophisticated CTA Section */}
        <div className="text-center mt-16">
          <motion.button 
            className="group relative px-12 py-4 bg-transparent border border-cyan-400/30 text-cyan-300 font-bold text-lg overflow-hidden transition-all duration-500 hover:border-cyan-400/60"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%)'
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 via-cyan-400/10 to-cyan-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <span className="relative z-10">EXPLORE INFRASTRUCTURE</span>
          </motion.button>
        </div>

      </div>
    </motion.div>
  );
};

export default TemplateSection2; 