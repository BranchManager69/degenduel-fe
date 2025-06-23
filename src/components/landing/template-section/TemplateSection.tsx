import { motion } from 'framer-motion';
import React from 'react';

interface TemplateSectionProps {
  title?: string;
  subtitle?: string;
  items?: Array<{
    id: number;
    title: string;
    description: string;
    metric?: string;
    trend?: 'up' | 'down' | 'stable';
  }>;
  ctaText?: string;
  onCtaClick?: () => void;
}

const TemplateSection: React.FC<TemplateSectionProps> = ({
  title = "MARKET INTELLIGENCE",
  subtitle = "Real-time insights and algorithmic analysis driving strategic decision making across digital asset markets.",
  items = [
    {
      id: 1,
      title: "Predictive Analytics",
      description: "Advanced machine learning algorithms analyze market patterns and sentiment to forecast price movements with 87% accuracy across major trading pairs.",
      metric: "87% Accuracy",
      trend: 'up'
    },
    {
      id: 2,
      title: "Risk Assessment", 
      description: "Proprietary risk scoring engine evaluates portfolio exposure and market volatility to optimize position sizing and capital allocation strategies.",
      metric: "15ms Latency",
      trend: 'stable'
    },
    {
      id: 3,
      title: "Liquidity Mapping",
      description: "Real-time liquidity analysis across multiple exchanges and DEXs to identify optimal entry and exit points for large volume transactions.",
      metric: "$2.4B Tracked",
      trend: 'up'
    }
  ],
  ctaText = "ACCESS INTELLIGENCE",
  onCtaClick
}) => {
  const secondaryVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch(trend) {
      case 'up': return 'text-emerald-400';
      case 'down': return 'text-red-400';
      default: return 'text-cyan-400';
    }
  };

  return (
    <motion.div
      className="relative w-full mt-12 md:mt-20"
      variants={secondaryVariants}
    >
      <div className="w-full max-w-none sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="relative inline-block">
            <h2 className="text-2xl md:text-4xl font-bold font-heading text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 tracking-wider uppercase relative inline-block mb-4">
              {title}
              <div className="absolute -bottom-2 md:-bottom-3 left-0 right-0 h-0.5 md:h-1 bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 rounded-full" />
            </h2>
          </div>
          <p className="text-base md:text-lg text-gray-300 mt-4 md:mt-6 max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Section Content - Sophisticated Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
            >
              {/* Glass morphism container */}
              <div className="relative h-full p-8 backdrop-blur-md bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 hover:border-purple-400/30 transition-all duration-500">
                
                {/* Geometric clip path */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 15px 100%, 0 calc(100% - 15px))'
                  }}
                />
                
                {/* Content */}
                <div className="relative z-10">
                  
                  {/* Header with metric */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">
                        {item.title}
                      </h3>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-sm font-mono ${getTrendColor(item.trend || 'stable')} flex items-center gap-1`}>
                        <span>{getTrendIcon(item.trend || 'stable')}</span>
                        <span>{item.metric}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {item.description}
                  </p>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-purple-400 to-cyan-400 group-hover:w-full transition-all duration-700 ease-out" />
                
                </div>
              </div>
            </motion.div>
          ))}

        </div>

        {/* Sophisticated CTA */}
        {ctaText && (
          <div className="text-center mt-16">
            <motion.button 
              onClick={onCtaClick}
              className="group relative px-10 py-4 bg-transparent border border-purple-400/30 text-purple-300 font-bold text-lg overflow-hidden transition-all duration-500 hover:border-purple-400/60"
              style={{
                clipPath: 'polygon(15px 0, 100% 0, calc(100% - 15px) 100%, 0 100%)'
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-purple-400/10 to-purple-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative z-10 tracking-wide">{ctaText}</span>
            </motion.button>
          </div>
        )}

      </div>
    </motion.div>
  );
};

export default TemplateSection; 