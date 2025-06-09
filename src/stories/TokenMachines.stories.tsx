import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Token data with real images
const mockTokens = [
  { symbol: 'SOL', image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png', color: '#9945FF' },
  { symbol: 'BONK', image: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I', color: '#F2A900' },
  { symbol: 'WIF', image: 'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betidfwy3ajsav2vjzyum.ipfs.nftstorage.link', color: '#E542FF' },
  { symbol: 'PEPE', image: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg', color: '#479F53' },
  { symbol: 'POPCAT', image: 'https://dd.dexscreener.com/ds-data/tokens/solana/7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr.png', color: '#FF6B6B' },
  { symbol: 'MEW', image: 'https://dd.dexscreener.com/ds-data/tokens/solana/MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5.png', color: '#FFE66D' },
];

// Industrial Slot Machine - Premium Materials & Precise Engineering
const IndustrialSlotMachine: React.FC = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<typeof mockTokens>([]);
  const [reels, setReels] = useState([
    { offset: 0, result: 0 },
    { offset: 0, result: 0 },
    { offset: 0, result: 0 },
  ]);

  const ITEM_HEIGHT = 90;

  const spin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setShowResult(false);
    
    // Calculate results
    const results = reels.map(() => Math.floor(Math.random() * mockTokens.length));
    
    // Reset reels to base position first, then animate
    setReels(prev => prev.map((reel, index) => ({
      offset: reel.offset % (mockTokens.length * ITEM_HEIGHT),
      result: reel.result
    })));
    
    // Animate reels with mechanical precision
    setTimeout(() => {
      results.forEach((result, index) => {
        const currentOffset = reels[index].offset % (mockTokens.length * ITEM_HEIGHT);
        const spins = 15 + index * 3;
        const finalOffset = currentOffset + (result * ITEM_HEIGHT) + (spins * mockTokens.length * ITEM_HEIGHT);
        
        setTimeout(() => {
          setReels(prev => {
            const newReels = [...prev];
            newReels[index] = { offset: finalOffset, result };
            return newReels;
          });
        }, index * 150);
      });
    }, 50);
    
    // Show results after all reels stop
    setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
      setSelectedTokens(results.map(result => mockTokens[result]));
    }, 2500);
  };

  const reset = () => {
    setShowResult(false);
    setSelectedTokens([]);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Machined Aluminum Housing */}
      <div className="bg-gradient-to-b from-gray-100 to-gray-200 p-1 rounded-lg shadow-2xl">
        <div className="bg-gradient-to-b from-gray-900 via-gray-950 to-black rounded-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
          
          {/* Display Panel - OLED Style */}
          <div className="bg-black p-4">
            <div className="bg-gray-950 rounded p-3 border border-gray-800 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
              <div className="flex justify-between items-center text-brand-400 font-mono text-xs">
                <span>SYS.STATUS: READY</span>
                <span>TOKEN.SELECT.V2</span>
                <span>PWR: 100%</span>
              </div>
            </div>
          </div>

          {/* Main Viewport */}
          <div className="px-6 pb-6">
            <div className="bg-black rounded-sm p-1 shadow-[0_0_20px_rgba(0,0,0,0.8)_inset]">
              <div className="bg-gradient-to-b from-gray-950 to-black p-4">
                
                {/* Precision Reel Assembly */}
                <div className="flex justify-center gap-0.5">
                  {reels.map((reel, reelIndex) => (
                    <div key={reelIndex} className="relative">
                      {/* Individual Reel Chamber */}
                      <div className="w-24 h-72 bg-black overflow-hidden relative shadow-[inset_0_0_15px_rgba(0,0,0,0.9)]">
                        {/* Subtle Edge Highlight */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 pointer-events-none" />
                        
                        {/* Reel Strip */}
                        <motion.div
                          className="absolute top-0 left-0 right-0"
                          animate={{ y: -reel.offset }}
                          transition={{
                            duration: 2 + reelIndex * 0.3,
                            ease: [0.25, 0.1, 0.25, 1],
                            delay: reelIndex * 0.15
                          }}
                        >
                          {Array(25).fill(mockTokens).flat().map((token, idx) => (
                            <div key={idx} className="h-[90px] flex items-center justify-center">
                              <div className="relative">
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-900 p-0.5">
                                  <div className="w-full h-full rounded-md overflow-hidden bg-black">
                                    <img 
                                      src={token.image} 
                                      alt={token.symbol}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                        
                        {/* Top/Bottom Fade for Depth */}
                        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black via-black/50 to-transparent pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />
                      </div>
                      
                      {/* Reel Separators */}
                      {reelIndex < 2 && (
                        <div className="absolute -right-0.5 top-0 bottom-0 w-1 bg-gradient-to-b from-gray-800 via-gray-700 to-gray-800" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Precision Scan Line */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] pointer-events-none">
                  <div className="h-full bg-brand-400/30" />
                  <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-brand-400 to-transparent" />
                  <div className="absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-brand-400 to-transparent" />
                </div>
              </div>
            </div>
          </div>

          {/* Control Interface - Minimalist */}
          <div className="px-6 pb-6">
            <div className="flex justify-center gap-4">
              {!showResult ? (
                <button
                  onClick={spin}
                  disabled={isSpinning}
                  className="relative group"
                >
                  <div className="bg-gradient-to-b from-gray-700 to-gray-800 p-1 rounded-full shadow-lg">
                    <div className={`
                      bg-gradient-to-b from-gray-600 to-gray-900 px-12 py-4 rounded-full
                      shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]
                      transition-all duration-200
                      ${isSpinning ? 'translate-y-1 opacity-75' : 'hover:translate-y-0.5'}
                    `}>
                      <span className={`
                        font-mono text-sm tracking-wider
                        ${isSpinning ? 'text-gray-500' : 'text-brand-400'}
                        transition-colors
                      `}>
                        {isSpinning ? 'PROCESSING' : 'INITIATE'}
                      </span>
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={reset}
                  className="relative group"
                >
                  <div className="bg-gradient-to-b from-brand-600 to-brand-700 p-1 rounded-full shadow-lg animate-pulse">
                    <div className="bg-gradient-to-b from-brand-500 to-brand-800 px-12 py-4 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] hover:translate-y-0.5 transition-all duration-200">
                      <span className="font-mono text-sm tracking-wider text-white">
                        NEW SELECTION
                      </span>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Winner Display */}
          {showResult && selectedTokens.length > 0 && (
            <div className="px-6 pb-6">
              <div className="bg-black rounded p-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                <div className="text-brand-400 font-mono text-xs text-center mb-3 tracking-wider">
                  SELECTED TOKENS
                </div>
                <div className="flex justify-center gap-4">
                  {selectedTokens.map((token, i) => (
                    <div key={i} className="text-center">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-900 p-1 mx-auto mb-2 animate-pulse">
                        <div className="w-full h-full rounded-md overflow-hidden bg-black">
                          <img 
                            src={token.image} 
                            alt={token.symbol}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="text-brand-400 font-mono text-xs tracking-wider">
                        {token.symbol}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="px-6 pb-4 flex justify-center gap-4">
            {['PWR', 'RDY', 'SYS'].map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`
                  w-2 h-2 rounded-full
                  ${i === 0 ? 'bg-green-500' : 
                    i === 1 && showResult ? 'bg-brand-400' :
                    i === 1 && !isSpinning ? 'bg-brand-400' : 
                    'bg-gray-600'}
                  ${i === 1 && isSpinning ? 'animate-pulse' : ''}
                `} />
                <span className="text-xs text-gray-500 font-mono">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Precision Plinko Machine - Laboratory Equipment Aesthetic
const PrecisionPlinko: React.FC = () => {
  const [balls, setBalls] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    token: typeof mockTokens[0];
  }>>([]);
  const [results, setResults] = useState<string[]>([]);
  const [winningSlot, setWinningSlot] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const animationRef = useRef<number>();
  const boardRef = useRef<HTMLDivElement>(null);

  const PEG_ROWS = 10;
  const PEG_SPACING = 45;
  const BOARD_WIDTH = 360;
  const GRAVITY = 0.8;  // Much faster fall
  const DAMPING = 0.95;  // Less friction
  const BOUNCE = 0.6;   // Less bouncy, more sliding

  // Physics simulation
  useEffect(() => {
    const animate = () => {
      setBalls(prevBalls => {
        return prevBalls.map(ball => {
          let { x, y, vx, vy } = ball;
          
          // Apply gravity
          vy += GRAVITY;
          
          // Update position
          x += vx;
          y += vy;
          
          // Check peg collisions
          for (let row = 0; row < PEG_ROWS; row++) {
            const pegsInRow = row % 2 === 0 ? 8 : 7;
            const rowY = 60 + row * PEG_SPACING;
            
            for (let col = 0; col < pegsInRow; col++) {
              const pegX = (row % 2 === 0 ? 30 : 50) + col * 45;
              const dx = x - pegX;
              const dy = y - rowY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 20) { // Ball radius + peg radius
                // Collision detected - more sliding behavior
                const angle = Math.atan2(dy, dx);
                const speed = Math.sqrt(vx * vx + vy * vy);
                
                // Add some randomness for natural movement
                const randomFactor = 0.3;
                vx = Math.cos(angle) * speed * BOUNCE + (Math.random() - 0.5) * randomFactor;
                vy = Math.sin(angle) * speed * BOUNCE;
                
                // Move ball outside peg
                x = pegX + Math.cos(angle) * 20;
                y = rowY + Math.sin(angle) * 20;
              }
            }
          }
          
          // Wall collisions
          if (x < 20) {
            x = 20;
            vx = Math.abs(vx) * BOUNCE;
          }
          if (x > BOARD_WIDTH - 20) {
            x = BOARD_WIDTH - 20;
            vx = -Math.abs(vx) * BOUNCE;
          }
          
          // Apply damping
          vx *= DAMPING;
          vy *= DAMPING;
          
          return { ...ball, x, y, vx, vy };
        }).filter(ball => {
          if (ball.y > 480) {
            // Ball reached bottom
            const slotWidth = BOARD_WIDTH / mockTokens.length;
            const slot = Math.floor(ball.x / slotWidth);
            const finalSlot = Math.min(Math.max(slot, 0), mockTokens.length - 1);
            const selectedToken = mockTokens[finalSlot];
            
            setWinningSlot(finalSlot);
            setShowResult(true);
            setResults(prev => [...prev.slice(-2), selectedToken.symbol]);
            return false;
          }
          return true;
        });
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    if (balls.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [balls.length]);

  const dropBall = () => {
    if (balls.length > 0) return; // Prevent multiple balls
    
    setWinningSlot(null);
    setShowResult(false);
    
    const token = mockTokens[Math.floor(Math.random() * mockTokens.length)];
    const newBall = {
      id: Date.now(),
      x: BOARD_WIDTH / 2 + (Math.random() - 0.5) * 40,
      y: 20,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      token
    };
    
    setBalls(prev => [...prev, newBall]);
  };

  const reset = () => {
    setBalls([]);
    setWinningSlot(null);
    setShowResult(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Laboratory-Style Frame */}
      <div className="bg-gradient-to-b from-gray-100 to-gray-200 p-1 rounded-lg shadow-2xl">
        <div className="bg-gradient-to-b from-gray-950 to-black rounded-md">
          
          {/* Header Display */}
          <div className="bg-black p-4 border-b border-gray-800">
            <div className="bg-gray-950 rounded p-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
              <div className="text-brand-400 font-mono text-sm text-center">
                STOCHASTIC TOKEN SELECTOR
              </div>
            </div>
          </div>

          {/* Plinko Board */}
          <div className="p-6">
            <div ref={boardRef} className="relative w-[360px] h-[520px] mx-auto bg-black rounded shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]">
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'linear-gradient(0deg, #333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }} />
              </div>
              
              {/* Pegs - Precision Placed */}
              {Array(PEG_ROWS).fill(0).map((_, row) => {
                const pegsInRow = row % 2 === 0 ? 8 : 7;
                const rowY = 60 + row * PEG_SPACING;
                
                return (
                  <div key={row} className="absolute left-0 right-0" style={{ top: `${rowY}px` }}>
                    {Array(pegsInRow).fill(0).map((_, col) => {
                      const pegX = (row % 2 === 0 ? 30 : 50) + col * 45;
                      return (
                        <div
                          key={col}
                          className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2"
                          style={{ left: `${pegX}px` }}
                        >
                          <div className="w-full h-full rounded-full bg-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.5)]" />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              
              {/* Collection Bins */}
              <div className="absolute bottom-0 left-0 right-0 flex">
                {mockTokens.map((token, i) => (
                  <div
                    key={i}
                    className={`
                      flex-1 h-12 border-l border-gray-800 first:border-l-0 
                      flex items-center justify-center transition-all duration-300
                      ${winningSlot === i 
                        ? 'bg-gradient-to-t from-brand-500/40 to-brand-400/20 border-t-2 border-brand-400' 
                        : 'bg-gradient-to-t from-gray-900 to-transparent'
                      }
                    `}
                  >
                    <img 
                      src={token.image} 
                      alt={token.symbol}
                      className={`
                        w-6 h-6 rounded transition-all duration-300
                        ${winningSlot === i ? 'opacity-100 scale-125' : 'opacity-50'}
                      `}
                    />
                  </div>
                ))}
              </div>
              
              {/* Falling Balls */}
              {balls.map(ball => (
                <div
                  key={ball.id}
                  className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    left: `${ball.x}px`, 
                    top: `${ball.y}px`,
                  }}
                >
                  <div className="w-full h-full rounded-full overflow-hidden shadow-lg">
                    <img 
                      src={ball.token.image} 
                      alt={ball.token.symbol}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Control Panel */}
          <div className="px-6 pb-6">
            <div className="flex justify-center gap-4">
              {!showResult ? (
                <button
                  onClick={dropBall}
                  disabled={balls.length > 0}
                  className="bg-gradient-to-b from-gray-700 to-gray-800 p-1 rounded shadow-lg"
                >
                  <div className={`
                    bg-gradient-to-b from-gray-600 to-gray-900 px-8 py-3 rounded 
                    shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] transition-all
                    ${balls.length > 0 ? 'opacity-50' : 'hover:translate-y-0.5'}
                  `}>
                    <span className={`
                      font-mono text-sm tracking-wider
                      ${balls.length > 0 ? 'text-gray-500' : 'text-brand-400'}
                    `}>
                      {balls.length > 0 ? 'SAMPLING...' : 'RELEASE SAMPLE'}
                    </span>
                  </div>
                </button>
              ) : (
                <button
                  onClick={reset}
                  className="bg-gradient-to-b from-brand-600 to-brand-700 p-1 rounded shadow-lg animate-pulse"
                >
                  <div className="bg-gradient-to-b from-brand-500 to-brand-800 px-8 py-3 rounded shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] hover:translate-y-0.5 transition-transform">
                    <span className="text-white font-mono text-sm tracking-wider">
                      NEW SAMPLE
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Winner Display */}
          {showResult && winningSlot !== null && (
            <div className="px-6 pb-6">
              <div className="bg-black rounded p-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                <div className="text-brand-400 font-mono text-xs text-center mb-3 tracking-wider">
                  SELECTED TOKEN
                </div>
                <div className="flex justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-900 p-1 mx-auto mb-2 animate-pulse">
                      <div className="w-full h-full rounded-md overflow-hidden bg-black">
                        <img 
                          src={mockTokens[winningSlot].image} 
                          alt={mockTokens[winningSlot].symbol}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="text-brand-400 font-mono text-sm tracking-wider">
                      {mockTokens[winningSlot].symbol}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent History */}
          {results.length > 0 && (
            <div className="px-6 pb-6">
              <div className="bg-gray-950 rounded p-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                <div className="text-xs text-gray-500 font-mono mb-1">RECENT SAMPLES:</div>
                <div className="flex justify-center gap-3">
                  {results.map((symbol, i) => (
                    <div key={i} className="text-gray-400 font-mono text-xs">
                      {symbol}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const meta = {
  title: 'Contest/TokenMachines',
  component: IndustrialSlotMachine,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof IndustrialSlotMachine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SlotMachine: Story = {};

export const PlinkoMachine: Story = {
  render: () => <PrecisionPlinko />,
};