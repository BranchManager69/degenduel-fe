import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import useSound from 'use-sound';
import { Token } from "../../../types";
import { formatNumber } from "../../../utils/format";
import { ddApi } from "../../../services/dd-api";
import useTokenData from "../../../hooks/useTokenData";

interface HotTokensListProps {
  maxTokens?: number;
  initialLoading?: boolean;
}

export const HotTokensList: React.FC<HotTokensListProps> = ({
  maxTokens = 5,
  initialLoading = false
}) => {
  const [hotTokens, setHotTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [isWebSocketActive, setIsWebSocketActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true); // User can toggle sounds
  const wsRef = useRef<WebSocket | null>(null);
  
  // Sound throttling to prevent audio spam
  const [lastSoundTime, setLastSoundTime] = useState<Record<string, number>>({
    up: 0,
    down: 0,
    rank: 0
  });
  
  // Sound cooldown time in milliseconds
  const SOUND_COOLDOWN = 3000; // 3 seconds between same type of sound
  const SIGNIFICANT_CHANGE_THRESHOLD = 2.5; // Only play for changes >= 2.5%
  
  // Use the useSound hook for better sound handling
  const [playUpSound] = useSound('/assets/media/sounds/token-up.mp3', { 
    volume: 0.3,
    interrupt: true,
    soundEnabled // Respects the soundEnabled state
  });
  
  const [playDownSound] = useSound('/assets/media/sounds/token-down.mp3', { 
    volume: 0.3,
    interrupt: true,
    soundEnabled 
  });
  
  const [playRankChangeSound] = useSound('/assets/media/sounds/rank-change.mp3', { 
    volume: 0.4,
    interrupt: true,
    soundEnabled 
  });
  
  // Throttled sound functions to prevent audio spam
  const playThrottledSound = useCallback((
    soundType: 'up' | 'down' | 'rank',
    playFunction: () => void,
    isSignificant: boolean = true
  ) => {
    const now = Date.now();
    const lastPlayed = lastSoundTime[soundType];
    const timeSinceLastSound = now - lastPlayed;
    
    // Only play if:
    // 1. We haven't played this sound type recently
    // 2. The change is significant enough (price movements)
    // 3. For rank changes, we always play but obey cooldown
    if (timeSinceLastSound > SOUND_COOLDOWN && (isSignificant || soundType === 'rank')) {
      playFunction();
      setLastSoundTime(prev => ({
        ...prev,
        [soundType]: now
      }));
    }
  }, [lastSoundTime]);
  
  // Function to calculate a color for the token's visual identity
  const getTokenColor = useCallback((symbol: string): string => {
    const colors: Record<string, string> = {
      SOL: '#14F195',
      BTC: '#F7931A',
      ETH: '#627EEA',
      DOGE: '#C3A634',
      ADA: '#0033AD',
      WIF: '#9945FF',
      PEPE: '#479F53',
      BONK: '#F2A900',
      SHIB: '#FFA409'
    };
    return colors[symbol] || '#7F00FF'; // Default to brand purple
  }, []);
  
  // Use WebSocket-based token data hook
  const { tokens: wsTokens, isConnected } = useTokenData("all");

  // Process tokens when WebSocket data is available
  useEffect(() => {
    try {
      if (wsTokens && wsTokens.length > 0) {
        setLoading(false);
        
        // Transform tokens to match our expected format
        const transformedTokens = wsTokens.map((token: any) => ({
          contractAddress: token.contractAddress || token.address,
          name: token.name,
          symbol: token.symbol,
          price: token.price?.toString() || "0",
          marketCap: token.marketCap?.toString() || "0",
          volume24h: token.volume24h?.toString() || "0",
          change24h: token.change24h?.toString() || "0",
          liquidity: {
            usd: token.liquidity?.usd?.toString() || "0",
            base: token.liquidity?.base?.toString() || "0",
            quote: token.liquidity?.quote?.toString() || "0",
          },
          images: {
            imageUrl: token.imageUrl || token.image,
            headerImage: token.headerImage,
            openGraphImage: token.openGraphImage,
          },
          socials: token.socials,
          websites: token.websites,
        }));
        
        // Apply hot tokens algorithm
        const sortedTokens = transformedTokens
          .filter((token: Token) => Number(token.volume24h) > 0) // Basic filter
          .sort((a: Token, b: Token) => {
            // Sample algorithm: Combination of change and volume with a bit of randomness
            const aScore = (
              (Number(a.change24h) * 0.6) + 
              (Math.log10(Number(a.volume24h)) * 0.4) +
              (Math.random() * 0.1) // Small random factor to simulate your unique algorithm
            );
            
            const bScore = (
              (Number(b.change24h) * 0.6) + 
              (Math.log10(Number(b.volume24h)) * 0.4) +
              (Math.random() * 0.1)
            );
            
            return bScore - aScore;
          });
        
        // Take only the top N tokens
        setHotTokens(sortedTokens.slice(0, maxTokens));
        
        // Setup WebSocket connection for token updates
        setupWebSocket();
      }
    } catch (err) {
      console.error("Failed to process hot tokens:", err);
      setError("Failed to process hot tokens data");
      setLoading(false);
    }
  }, [wsTokens, maxTokens]);
  
  // Set WebSocket connection status
  useEffect(() => {
    setIsWebSocketActive(isConnected);
    
    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isConnected]);
  
  // Setup WebSocket connection
  const setupWebSocket = useCallback(() => {
    // Get the environment WebSocket URL
    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://dev.degenduel.me';
    
    // Create WebSocket connection
    const ws = new WebSocket(`${wsUrl}/api/v69/ws`);
    wsRef.current = ws;
    
    // Connection opened
    ws.addEventListener('open', () => {
      console.log('WebSocket connected for hot tokens');
      setIsWebSocketActive(true);
      
      // Subscribe to market-data topic
      ws.send(JSON.stringify({
        type: 'SUBSCRIBE',
        topics: ['market-data']
      }));
    });
    
    // Listen for messages
    ws.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle market data updates
        if (message.type === 'DATA' && message.topic === 'market-data') {
          // In a real implementation, this would filter for 'hot tokens' specifically
          // For now, we'll just refresh our algorithm if we get any market data
          
          // This is where you'd update tokens based on your algorithm when data comes in
          // For demo purposes, we'll just simulate a token update every now and then
          if (Math.random() < 0.2) { // 20% chance to "update" on each message
            updateRandomToken();
          }
        }
      } catch (err) {
        console.error('Error processing WebSocket message', err);
      }
    });
    
    // Handle errors & reconnection
    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setIsWebSocketActive(false);
    });
    
    ws.addEventListener('close', () => {
      console.log('WebSocket closed');
      setIsWebSocketActive(false);
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        setupWebSocket();
      }, 3000);
    });
  }, []);
  
  // Simulate token updates for demo purposes
  // In production, this would be triggered by real WebSocket data
  const updateRandomToken = useCallback(() => {
    if (hotTokens.length === 0) return;
    
    setHotTokens(prevTokens => {
      // Make a copy of the tokens
      const updatedTokens = [...prevTokens];
      
      // Pick a random token to update
      const randomIndex = Math.floor(Math.random() * updatedTokens.length);
      const tokenToUpdate = { ...updatedTokens[randomIndex] };
      
      // Keep track of old properties to detect changes
      const oldPrice = Number(tokenToUpdate.price);
      // Using oldRank to detect position changes
      const oldRank = randomIndex;
      
      // Update with "new data"
      const changeDirection = Math.random() > 0.5 ? 1 : -1;
      const changeAmount = (Math.random() * 3).toFixed(2);
      const currentChange = Number(tokenToUpdate.change24h);
      
      tokenToUpdate.change24h = (currentChange + (changeDirection * Number(changeAmount))).toFixed(2);
      
      // Update the price based on the change
      const currentPrice = Number(tokenToUpdate.price);
      const priceChange = currentPrice * (Number(changeAmount) / 100) * changeDirection;
      tokenToUpdate.price = (currentPrice + priceChange).toFixed(6);
      
      // Replace the token in the array
      updatedTokens[randomIndex] = tokenToUpdate;
      
      // Re-sort the list based on our algorithm
      const sortedTokens = [...updatedTokens].sort((a: Token, b: Token) => {
        // Sample algorithm: Combination of change and volume with a bit of randomness
        const aScore = (
          (Number(a.change24h) * 0.6) + 
          (Math.log10(Number(a.volume24h)) * 0.4) +
          (Math.random() * 0.1) // Small random factor to simulate your unique algorithm
        );
        
        const bScore = (
          (Number(b.change24h) * 0.6) + 
          (Math.log10(Number(b.volume24h)) * 0.4) +
          (Math.random() * 0.1)
        );
        
        return bScore - aScore;
      });
      
      // Find the new rank of the updated token
      const newRank = sortedTokens.findIndex(t => t.contractAddress === tokenToUpdate.contractAddress);
      
      // Play sounds based on changes if sounds are enabled
      if (soundEnabled) {
        // Calculate percentage change for significance check
        const priceChange = Number(tokenToUpdate.price) - oldPrice;
        const percentChange = (priceChange / oldPrice) * 100;
        const isSignificantChange = Math.abs(percentChange) >= SIGNIFICANT_CHANGE_THRESHOLD;
        
        // Price change sounds - only play for significant changes
        if (priceChange > 0) {
          playThrottledSound('up', playUpSound, isSignificantChange);
        } else if (priceChange < 0) {
          playThrottledSound('down', playDownSound, isSignificantChange);
        }
        
        // Rank change sound - only play for meaningful position changes (not just tiny reorderings)
        const rankDifference = Math.abs(oldRank - newRank);
        if (oldRank !== newRank && rankDifference >= 1) { // At least 1 position change
          playThrottledSound('rank', playRankChangeSound);
        }
      }
      
      return sortedTokens;
    });
  }, [hotTokens, soundEnabled, playUpSound, playDownSound, playRankChangeSound, playThrottledSound, SIGNIFICANT_CHANGE_THRESHOLD]);
  
  // Loading state UI
  if (loading) {
    return (
      <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg">
        <div className="flex items-center mb-4">
          <div className="h-6 bg-dark-300/50 rounded w-2/3 animate-pulse"></div>
          <div className="ml-auto h-5 w-20 bg-dark-300/30 rounded animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
          {[...Array(maxTokens)].map((_, i) => (
            <div key={i} className="h-20 bg-dark-300/30 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }
  
  // Error state UI
  if (error || hotTokens.length === 0) {
    return (
      <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg">
        <div className="text-red-400 text-center py-6">
          {error || "No hot tokens data available"}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg relative overflow-hidden">
      {/* Circuit board backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px),linear-gradient(90deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px)] bg-[length:25px_25px]"></div>
      </div>
      
      {/* Energy pulse effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/10 via-transparent to-cyan-500/10 opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/10 to-brand-500/0 animate-pulse-slow opacity-70"></div>
      </div>
      
      {/* Corner cuts for cyberpunk aesthetic */}
      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-brand-500/50 -translate-x-0.5 -translate-y-0.5 z-10"></div>
      <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-cyan-500/50 translate-x-0.5 -translate-y-0.5 z-10"></div>
      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-brand-500/50 -translate-x-0.5 translate-y-0.5 z-10"></div>
      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-cyan-500/50 translate-x-0.5 translate-y-0.5 z-10"></div>
      
      {/* Header section */}
      <div className="relative mb-5 flex items-center">
        <div className="flex-1">
          <div className="relative">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 font-cyber relative z-10">
              The Elite Token List
            </h3>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-yellow-500/70 via-amber-400 to-yellow-300/50"></div>
            
            {/* Subtitle with platform name */}
            <p className="text-xs text-gray-400 mt-1 flex items-center">
              <span className="mr-2">DegenDuel</span>
              <span className="font-mono text-yellow-500 animate-pulse">•</span>
              <span className="ml-2">Exclusive Selection</span>
            </p>
          </div>
        </div>
        
        {/* Interactive controls - sound toggle and connection indicator */}
        <div className="flex items-center gap-3">
          {/* Sound toggle button */}
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
              soundEnabled 
                ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' 
                : 'bg-gray-800/30 text-gray-500 hover:bg-gray-700/50 hover:text-gray-400'
            }`}
            title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
          >
            {soundEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
          
          {/* Connection indicator */}
          <div className={`flex items-center ${isWebSocketActive ? 'text-green-500' : 'text-red-500'}`}>
            <span className={`w-2 h-2 rounded-full ${isWebSocketActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-1.5`}></span>
            <span className="text-xs font-mono">{isWebSocketActive ? 'LIVE' : 'SYNC'}</span>
          </div>
        </div>
      </div>
      
      {/* Hot tokens list with improved transitions */}
      <div className="relative space-y-3">
        {/* Use AnimatePresence with custom mode for smoother transitions */}
        <AnimatePresence mode="popLayout">
          {hotTokens.map((token, index) => {
            const isPositive = Number(token.change24h) >= 0;
            
            return (
              <motion.div
                key={token.contractAddress}
                // Use layout animation for position changes
                layout
                layoutId={token.contractAddress}
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  // Add scale pulse on update
                  scale: [1, 1.02, 1],
                  transition: {
                    scale: { duration: 0.5 }
                  }
                }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30,
                  delay: index * 0.1 
                }}
                className="relative"
              >
                <Link 
                  to={`/tokens?symbol=${token.symbol}`}
                  className="block"
                >
                  <div className="relative bg-dark-300/40 backdrop-blur-sm rounded-lg border border-dark-400/30 overflow-hidden transition-all duration-300 hover:border-yellow-500/30 group">
                    {/* Dynamic background based on price changes */}
                    <div 
                      className={`absolute inset-0 transition-opacity duration-300 ${
                        Number(token.change24h) >= 0 
                          ? 'bg-gradient-to-r from-green-500/5 via-transparent to-transparent' 
                          : 'bg-gradient-to-r from-red-500/5 via-transparent to-transparent'
                      } ${Number(token.change24h) >= 3 || Number(token.change24h) <= -3 ? 'opacity-100' : 'opacity-0'}`}
                    ></div>
                    
                    {/* Ranking badge with animation */}
                    <div className="absolute -top-1 -left-1 w-8 h-8">
                      <div 
                        className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-br-lg flex items-center justify-center text-black font-bold text-xs shadow-lg z-10 transition-transform duration-300 group-hover:scale-110 origin-top-left"
                      >
                        #{index + 1}
                      </div>
                      <div className="absolute inset-0 bg-yellow-500/20 animate-pulse rounded-br-lg"></div>
                    </div>
                    
                    {/* Heat effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent transform group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                    
                    {/* Pulse effect for price changes */}
                    <motion.div
                      className={`absolute inset-0 ${
                        Number(token.change24h) >= 0 
                          ? 'bg-green-500/10' 
                          : 'bg-red-500/10'
                      }`}
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: [0, 0.2, 0],
                        transition: { duration: 1.5, repeat: 0 }
                      }}
                      key={`pulse-${token.contractAddress}-${token.price}`}
                    ></motion.div>
                    
                    {/* Main content container */}
                    <div className="p-3 pl-9 flex items-center">
                      {/* Token logo/color */}
                      <div 
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden shadow-md mr-3"
                        style={{
                          background: `linear-gradient(135deg, ${getTokenColor(token.symbol)} 0%, rgba(18, 16, 25, 0.8) 100%)`,
                        }}
                      >
                        {token.images?.imageUrl ? (
                          <img 
                            src={token.images.imageUrl} 
                            alt={token.symbol}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-white">{token.symbol.slice(0, 3)}</span>
                        )}
                        
                        {/* Price change indicator overlay */}
                        <div 
                          className={`absolute bottom-0 left-0 right-0 h-1 ${isPositive ? 'bg-green-500' : 'bg-red-500'} opacity-90`}
                        ></div>
                      </div>
                      
                      {/* Token info */}
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center">
                          <h4 className="text-base font-bold text-white group-hover:text-yellow-400 transition-colors duration-300">{token.symbol}</h4>
                          <span className="ml-2 text-xs text-gray-400 truncate">{token.name}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-sm font-mono text-white">${formatNumber(token.price)}</div>
                          
                          {/* Volume badge */}
                          <div className="text-xs text-gray-400 flex items-center">
                            <span className="mr-1">Vol:</span>
                            <span className="font-mono">${formatNumber(Number(token.volume24h), 'compact' as any)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Price change - animated for attention */}
                      <div 
                        className={`flex-shrink-0 flex items-center justify-center px-3 py-1.5 rounded-lg ${
                          isPositive 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        } transition-all duration-300`}
                      >
                        <span className="font-mono text-base font-semibold">
                          {isPositive ? '+' : ''}{formatNumber(token.change24h)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      {/* Footer section */}
      <div className="mt-4 text-center">
        <Link 
          to="/tokens" 
          className="inline-flex items-center px-4 py-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20
            border border-yellow-500/30 text-yellow-400 transition-all duration-300 text-sm font-cyber"
        >
          <span>VIEW ALL TOKENS</span>
          <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  );
};