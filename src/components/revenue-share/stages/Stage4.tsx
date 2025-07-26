import { motion } from 'framer-motion';

export const Stage4 = () => {
  const holders = Array.from({ length: 5 });
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Step 4</p>
        <h3 className="step-label">Holders Earn SOL Daily</h3>
      </div>
      
      {/* Space for incoming pie slice */}
      <div className="h-16 mb-4"></div>

      {/* Money rain container - rain FROM the slice position */}
      <div className="relative h-24 w-40 overflow-visible">
        {holders.map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3"
            style={{
              left: `${10 + i * 20}%`,
              top: '0px'
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              y: [0, 10, 80, 90] 
            }}
            transition={{ 
              delay: 2.8 + i * 0.3, 
              duration: 1.3, 
              repeat: Infinity,
              repeatDelay: 5
            }}
          >
            <img 
              src="/assets/media/logos/solana.svg" 
              alt="SOL" 
              className="w-full h-full" 
            />
          </motion.div>
        ))}
      </div>

      {/* Token holders - 5 stick figures with DUEL tokens */}
      <div className="flex gap-4">
        {holders.map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            {/* DUEL token indicator */}
            <div className="w-5 h-5 bg-brand-500/20 border border-brand-500 rounded-full mb-2 flex items-center justify-center">
              <span className="text-xs font-bold text-brand-400">D</span>
            </div>
            {/* Stick figure */}
            <svg width="30" height="40" viewBox="0 0 30 40">
              {/* Head */}
              <circle cx="15" cy="6" r="5" className="fill-gray-500" />
              {/* Body */}
              <line x1="15" y1="11" x2="15" y2="25" stroke="#6B7280" strokeWidth="2" />
              {/* Arms */}
              <line x1="15" y1="15" x2="8" y2="22" stroke="#6B7280" strokeWidth="2" />
              <line x1="15" y1="15" x2="22" y2="22" stroke="#6B7280" strokeWidth="2" />
              {/* Legs */}
              <line x1="15" y1="25" x2="10" y2="35" stroke="#6B7280" strokeWidth="2" />
              <line x1="15" y1="25" x2="20" y2="35" stroke="#6B7280" strokeWidth="2" />
            </svg>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-500 mt-2 text-center">DUEL Holders</div>
    </div>
  );
};