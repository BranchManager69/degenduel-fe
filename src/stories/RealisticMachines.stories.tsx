import type { Meta, StoryObj } from '@storybook/react';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStandardizedTokenData } from '../hooks/data/useStandardizedTokenData';
import { AllProviders } from './mockProviders';

// ACTUAL SLOT MACHINE - Vertical Spinning Reels
const RealSlotMachine: React.FC = () => {
  const { tokens: realTokens, loading, error } = useStandardizedTokenData({ limit: 50 });
  const [isSpinning, setIsSpinning] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<any[]>([]);
  const [reels, setReels] = useState([
    { position: 0, targetPosition: 0, isSpinning: false },
    { position: 0, targetPosition: 0, isSpinning: false },
    { position: 0, targetPosition: 0, isSpinning: false },
  ]);

  // Use real tokens, filter to only those with images
  const tokensWithImages = realTokens.filter(token => 
    token.image || token.imageUri || token.token_info?.image_uri || token.logoURI || token.image_url
  ).slice(0, 50);
  

  // Each reel shows 3 tokens at a time, we need to show many copies for smooth spinning
  const extendedTokens = [...tokensWithImages, ...tokensWithImages, ...tokensWithImages, ...tokensWithImages];
  const ITEM_HEIGHT = 120;
  const VISIBLE_ITEMS = 3;

  const pullLever = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setShowResult(false);
    setLeverPulled(true);
    
    // Lever animation
    setTimeout(() => setLeverPulled(false), 800);
    
    // Make sure we have tokens to work with
    if (tokensWithImages.length === 0) return;
    
    // Calculate results and spin each reel
    const results = reels.map(() => Math.floor(Math.random() * tokensWithImages.length));
    
    // Start spinning all reels
    setReels(reels.map((reel, index) => ({
      ...reel,
      isSpinning: true,
      targetPosition: 0 // Reset while spinning
    })));
    
    // Stop each reel at different times for cascade effect
    results.forEach((result, index) => {
      setTimeout(() => {
        const spins = 15 + index * 5; // More spins for later reels
        const finalPosition = -(result * ITEM_HEIGHT + (spins * tokensWithImages.length * ITEM_HEIGHT));
        
        setReels(prev => {
          const newReels = [...prev];
          newReels[index] = {
            position: finalPosition,
            targetPosition: finalPosition,
            isSpinning: false
          };
          return newReels;
        });
      }, 2000 + index * 500); // Stop reels in sequence
    });
    
    // Show results after all reels stop
    setTimeout(() => {
      setIsSpinning(false);
      setShowResult(true);
      setSelectedTokens(results.map(result => tokensWithImages[result]));
    }, 4000);
  };

  const reset = () => {
    setShowResult(false);
    setSelectedTokens([]);
  };

  // Helper to get token image URL
  const getTokenImage = (token: any) => {
    const imageUrl = token.image || 
           token.imageUri || 
           token.image_url ||
           token.token_info?.image_uri || 
           token.logoURI ||
           '/default-token.png';
    console.log('Getting image for token:', token.symbol, 'URL:', imageUrl);
    return imageUrl;
  };


  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Vegas-Style Slot Machine Cabinet */}
      <div className="relative">
        {/* Machine Body - Chrome and Red */}
        <div className="bg-gradient-to-b from-red-600 via-red-700 to-red-900 rounded-t-3xl rounded-b-lg p-8 shadow-2xl border-4 border-yellow-400">
          
          {/* Top Display */}
          <div className="text-center mb-6">
            <div className="bg-black rounded-lg p-4 border-4 border-yellow-400 shadow-inner">
              <h1 className="text-3xl font-black text-yellow-400 tracking-wider">
                TOKEN SLOTS
              </h1>
              <div className="flex justify-center gap-1 mt-2">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" 
                       style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Main Slot Window with Curved Glass */}
          <div className="relative bg-black p-6 rounded-xl border-4 border-yellow-400 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
            <div className="flex justify-center gap-4">
              {reels.map((reel, reelIndex) => (
                <div key={reelIndex} className="relative" style={{ perspective: '600px' }}>
                  {/* Reel Housing - Chrome Effect with 3D depth */}
                  <div className="w-36 h-96 relative">
                    {/* Back panel */}
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg transform rotateY-6" 
                         style={{ transformStyle: 'preserve-3d', transform: 'translateZ(-20px)' }} />
                    
                    {/* Main reel housing */}
                    <div className="relative w-full h-full bg-gradient-to-b from-gray-300 via-gray-400 to-gray-600 rounded-lg border-2 border-gray-700 shadow-2xl overflow-hidden"
                         style={{ transformStyle: 'preserve-3d' }}>
                      
                      {/* Inner Reel Area - Cylindrical appearance */}
                      <div className="absolute inset-3 rounded-md overflow-hidden"
                           style={{ 
                             background: 'radial-gradient(ellipse at center, #1a1a1a 0%, #000 70%)',
                             boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9), inset -8px 0 20px rgba(0,0,0,0.5), inset 8px 0 20px rgba(0,0,0,0.5)'
                           }}>
                        
                        {/* Vertical Spinning Reel with Motion Blur */}
                        <motion.div
                          className={`absolute left-0 right-0 ${reel.isSpinning ? 'blur-md' : ''}`}
                          animate={{ 
                            y: reel.isSpinning ? [0, -2000] : reel.position
                          }}
                          transition={
                            reel.isSpinning 
                              ? {
                                  duration: 0.3,
                                  ease: "linear",
                                  repeat: Infinity,
                                  repeatType: "loop"
                                }
                              : {
                                  duration: 0.8,
                                  ease: [0.25, 0.1, 0.25, 1],
                                }
                          }
                        >
                          {/* Token Strip - 3D curved effect */}
                          {extendedTokens.map((token, tokenIndex) => {
                            const yPos = tokenIndex * ITEM_HEIGHT;
                            return (
                              <div
                                key={tokenIndex}
                                className="absolute left-0 right-0 flex items-center justify-center"
                                style={{ 
                                  height: `${ITEM_HEIGHT}px`,
                                  top: `${yPos}px`,
                                  transform: 'translateZ(0)'
                                }}
                              >
                                {/* Token with 3D curve effect */}
                                <div className="relative w-28 h-28"
                                     style={{
                                       transform: 'rotateX(-5deg)',
                                       transformStyle: 'preserve-3d'
                                     }}>
                                  {/* Token background with depth */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-white to-gray-200 rounded-xl shadow-2xl"
                                       style={{
                                         boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 -2px 10px rgba(0,0,0,0.2)'
                                       }}>
                                    <div className="p-2 h-full flex flex-col items-center justify-center">
                                      <img 
                                        src={getTokenImage(token)} 
                                        alt={token.symbol || token.name || 'Token'}
                                        className="w-20 h-20 object-cover rounded-lg shadow-md"
                                        style={{ filter: reel.isSpinning ? 'blur(2px)' : 'none' }}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/default-token.png';
                                        }}
                                      />
                                      <div className="text-center mt-1 text-sm font-black text-gray-800 tracking-wider">
                                        {token.symbol || token.name || 'TOKEN'}
                                      </div>
                                    </div>
                                  </div>
                                  {/* 3D edge highlight */}
                                  <div className="absolute inset-0 rounded-xl"
                                       style={{
                                         background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
                                       }} />
                                </div>
                              </div>
                            );
                          })}
                        </motion.div>
                        
                        {/* Win Line Indicator - More prominent */}
                        <div className="absolute top-1/2 left-0 right-0 h-32 -translate-y-1/2 pointer-events-none z-10">
                          <div className="h-full border-t-4 border-b-4 border-red-600 bg-gradient-to-b from-red-600/20 via-transparent to-red-600/20 shadow-[0_0_20px_rgba(220,38,38,0.5)]"></div>
                        </div>
                        
                        {/* Cylinder shadow overlays for depth */}
                        <div className="absolute inset-0 pointer-events-none"
                             style={{
                               background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.4) 100%)'
                             }} />
                      </div>
                      
                      {/* Chrome frame highlights */}
                      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/50 via-white/20 to-transparent rounded-t-lg" />
                      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/50 via-black/20 to-transparent rounded-b-lg" />
                      
                      {/* Side chrome edges */}
                      <div className="absolute top-0 left-0 bottom-0 w-3 bg-gradient-to-r from-white/30 to-transparent" />
                      <div className="absolute top-0 right-0 bottom-0 w-3 bg-gradient-to-l from-white/30 to-transparent" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Curved Glass Front Panel */}
            <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
              <div className="absolute inset-0"
                   style={{
                     background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.15) 0%, transparent 50%)',
                     boxShadow: 'inset 0 10px 30px rgba(255,255,255,0.1)',
                   }}>
                {/* Glass reflections */}
                <div className="absolute top-10 left-10 right-10 h-32 bg-gradient-to-b from-white/10 to-transparent rounded-full blur-xl" />
                <div className="absolute top-1/3 -left-20 w-40 h-96 bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-12" />
              </div>
            </div>
          </div>

          {/* Simple Pull Lever */}
          <div className="mt-8 flex justify-center">
            <div className="relative">
              {/* Lever Mount */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-gradient-to-b from-gray-300 to-gray-500 rounded-t-lg border-2 border-gray-600"></div>
              
              <motion.div
                className="relative cursor-pointer"
                onClick={pullLever}
                animate={{
                  rotateZ: leverPulled ? 60 : 0,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ transformOrigin: 'center bottom' }}
              >
                {/* Lever Shaft - Thick chrome */}
                <div className="relative">
                  <div className="w-4 h-32 bg-gradient-to-r from-gray-300 via-white to-gray-300 rounded-full mx-auto shadow-2xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"></div>
                  </div>
                  
                  {/* Ball Handle at top */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-b from-red-500 to-red-700 rounded-full border-4 border-red-900 shadow-2xl">
                        <div className="absolute inset-2 bg-gradient-to-br from-red-400 via-red-500 to-red-800 rounded-full">
                          <div className="absolute top-2 left-2 w-8 h-8 bg-white/30 rounded-full blur-md"></div>
                        </div>
                      </div>
                      {/* Black grip band */}
                      <div className="absolute top-1/2 left-0 right-0 h-6 -translate-y-1/2 bg-black/80 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <div className="text-center mt-8">
                <div className="text-yellow-400 font-black text-lg animate-pulse">
                  PULL TO SPIN!
                </div>
              </div>
            </div>
          </div>

          {/* Winner Display */}
          {showResult && selectedTokens.length > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mt-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-lg p-6 border-4 border-yellow-700 shadow-2xl mx-auto max-w-md"
            >
              <div className="text-red-900 text-center font-black text-2xl mb-4 animate-pulse">YOUR TOKENS!</div>
              <div className="flex justify-center gap-3">
                {selectedTokens.map((token, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="w-20 h-20 bg-white rounded-full p-1 shadow-lg"
                  >
                    <img 
                      src={getTokenImage(token)} 
                      alt={token.symbol || token.name || 'Token'} 
                      className="w-full h-full rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/default-token.png';
                      }}
                    />
                  </motion.div>
                ))}
              </div>
              <button
                onClick={reset}
                className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 px-6 rounded-lg shadow-lg transition-colors"
              >
                SPIN AGAIN
              </button>
            </motion.div>
          )}
        </div>

        {/* Machine Base */}
        <div className="bg-gradient-to-b from-gray-600 to-gray-800 h-8 rounded-b-3xl border-4 border-yellow-400 border-t-0"></div>
      </div>
    </div>
  );
};

// ACTUAL PLINKO MACHINE - The Price is Right Style
const RealPlinkoMachine: React.FC = () => {
  const [balls, setBalls] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    token: typeof mockTokens[0];
  }>>([]);
  const [winningSlot, setWinningSlot] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const animationRef = useRef<number>();

  const BOARD_WIDTH = 500;
  const BOARD_HEIGHT = 600;
  const PEG_ROWS = 12;
  const GRAVITY = 1.2;
  const DAMPING = 0.92;
  const BOUNCE = 0.5;

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
            const pegsInRow = row + 3; // More pegs as we go down
            const rowY = 80 + row * 40;
            const pegSpacing = (BOARD_WIDTH - 100) / (pegsInRow - 1);
            
            for (let col = 0; col < pegsInRow; col++) {
              const pegX = 50 + col * pegSpacing;
              const dx = x - pegX;
              const dy = y - rowY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              
              if (distance < 25) {
                // Collision with peg
                const angle = Math.atan2(dy, dx);
                const speed = Math.sqrt(vx * vx + vy * vy);
                
                vx = Math.cos(angle) * speed * BOUNCE + (Math.random() - 0.5) * 0.5;
                vy = Math.sin(angle) * speed * BOUNCE;
                
                // Move ball outside peg
                x = pegX + Math.cos(angle) * 25;
                y = rowY + Math.sin(angle) * 25;
              }
            }
          }
          
          // Wall collisions
          if (x < 30) {
            x = 30;
            vx = Math.abs(vx) * BOUNCE;
          }
          if (x > BOARD_WIDTH - 30) {
            x = BOARD_WIDTH - 30;
            vx = -Math.abs(vx) * BOUNCE;
          }
          
          // Apply damping
          vx *= DAMPING;
          vy *= DAMPING;
          
          return { ...ball, x, y, vx, vy };
        }).filter(ball => {
          if (ball.y > BOARD_HEIGHT - 80) {
            // Ball reached bottom
            const slotWidth = (BOARD_WIDTH - 60) / mockTokens.length;
            const slot = Math.floor((ball.x - 30) / slotWidth);
            const finalSlot = Math.min(Math.max(slot, 0), mockTokens.length - 1);
            
            setWinningSlot(finalSlot);
            setShowResult(true);
            setResults(prev => [...prev.slice(-2), mockTokens[finalSlot].symbol]);
            return false;
          }
          return true;
        });
      });
      
      if (balls.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
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
    if (balls.length > 0) return;
    
    setWinningSlot(null);
    setShowResult(false);
    
    const token = mockTokens[Math.floor(Math.random() * mockTokens.length)];
    const newBall = {
      id: Date.now(),
      x: BOARD_WIDTH / 2 + (Math.random() - 0.5) * 60,
      y: 30,
      vx: (Math.random() - 0.5) * 3,
      vy: 0,
      token
    };
    
    setBalls([newBall]);
  };

  const reset = () => {
    setBalls([]);
    setWinningSlot(null);
    setShowResult(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Price is Right Style Plinko Board */}
      <div className="relative">
        {/* Board Frame - Wood Effect */}
        <div className="bg-gradient-to-b from-yellow-600 via-yellow-700 to-yellow-800 p-6 rounded-3xl border-8 border-yellow-900 shadow-2xl">
          
          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-4xl font-black text-red-800 tracking-wider">
              TOKEN PLINKO
            </h1>
            <div className="text-yellow-900 font-bold">Drop the chip and win!</div>
          </div>

          {/* Plinko Board */}
          <div 
            className="relative bg-gradient-to-b from-blue-400 to-blue-600 rounded-2xl border-4 border-blue-800 shadow-[inset_0_0_30px_rgba(0,0,0,0.3)]"
            style={{ width: `${BOARD_WIDTH}px`, height: `${BOARD_HEIGHT}px` }}
          >
            {/* Pegs - More realistic placement */}
            {Array(PEG_ROWS).fill(0).map((_, row) => {
              const pegsInRow = row + 3;
              const rowY = 80 + row * 40;
              const pegSpacing = (BOARD_WIDTH - 100) / (pegsInRow - 1);
              
              return (
                <div key={row} className="absolute" style={{ top: `${rowY}px` }}>
                  {Array(pegsInRow).fill(0).map((_, col) => {
                    const pegX = 50 + col * pegSpacing;
                    return (
                      <div
                        key={col}
                        className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${pegX}px` }}
                      >
                        {/* 3D Peg Effect */}
                        <div className="w-full h-full rounded-full bg-gradient-to-b from-gray-300 via-gray-400 to-gray-600 border-2 border-gray-700 shadow-lg">
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-white/40 to-transparent"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            
            {/* Prize Slots at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex">
              {mockTokens.map((token, i) => (
                <div
                  key={i}
                  className={`
                    flex-1 h-16 border-l-2 border-yellow-600 first:border-l-0 
                    flex flex-col items-center justify-center transition-all duration-500
                    ${winningSlot === i 
                      ? 'bg-gradient-to-t from-yellow-400 to-yellow-200 scale-105 border-4 border-yellow-600' 
                      : 'bg-gradient-to-t from-red-600 to-red-400'
                    }
                  `}
                >
                  <img 
                    src={token.image} 
                    alt={token.symbol}
                    className={`
                      w-8 h-8 rounded-full transition-all duration-300 border-2 border-white
                      ${winningSlot === i ? 'scale-125 shadow-lg' : ''}
                    `}
                  />
                  <div className="text-xs font-bold text-white mt-1">{token.symbol}</div>
                </div>
              ))}
            </div>
            
            {/* Falling Balls - Realistic chip appearance */}
            {balls.map(ball => (
              <div
                key={ball.id}
                className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  left: `${ball.x}px`, 
                  top: `${ball.y}px`,
                }}
              >
                <div className="w-full h-full rounded-full bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 border-2 border-yellow-700 shadow-lg">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
                  <div className="absolute inset-2 rounded-full overflow-hidden">
                    <img 
                      src={ball.token.image} 
                      alt={ball.token.symbol}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mt-6">
            {/* Drop Zone */}
            <div className="flex-1">
              <div className="text-center">
                <div className="text-yellow-900 font-bold mb-2">DROP ZONE</div>
                <div className="w-20 h-8 bg-black rounded-full mx-auto border-2 border-yellow-800"></div>
              </div>
            </div>

            {/* Winner Display */}
            {showResult && winningSlot !== null && (
              <div className="flex-1 text-center">
                <div className="bg-yellow-400 rounded-lg p-4 border-4 border-yellow-600">
                  <div className="text-red-800 font-black mb-2">WINNER!</div>
                  <div className="w-16 h-16 mx-auto bg-white rounded-full p-1">
                    <img 
                      src={mockTokens[winningSlot].image} 
                      alt={mockTokens[winningSlot].symbol}
                      className="w-full h-full rounded-full"
                    />
                  </div>
                  <div className="text-red-800 font-bold mt-2">
                    {mockTokens[winningSlot].symbol}
                  </div>
                </div>
              </div>
            )}

            {/* Control Button */}
            <div className="flex-1 text-center">
              {!showResult ? (
                <button
                  onClick={dropBall}
                  disabled={balls.length > 0}
                  className={`
                    px-8 py-4 rounded-full font-black text-white text-lg shadow-lg transform transition-all
                    ${balls.length > 0 
                      ? 'bg-gray-500 scale-95' 
                      : 'bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95'
                    }
                  `}
                >
                  {balls.length > 0 ? 'DROPPING...' : 'DROP CHIP!'}
                </button>
              ) : (
                <button
                  onClick={reset}
                  className="px-8 py-4 bg-green-600 hover:bg-green-500 rounded-full font-black text-white text-lg shadow-lg transform hover:scale-105 active:scale-95 transition-all"
                >
                  PLAY AGAIN!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const meta = {
  title: 'Contest/RealisticMachines',
  component: RealSlotMachine,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <AllProviders>
        <Story />
      </AllProviders>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof RealSlotMachine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SlotMachine: Story = {};

export const PlinkoMachine: Story = {
  render: () => (
    <AllProviders>
      <RealPlinkoMachine />
    </AllProviders>
  ),
};