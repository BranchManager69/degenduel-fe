import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useSound from 'use-sound';
import { useStandardizedTokenData } from "../../../hooks/data/useStandardizedTokenData";
import { Token } from "../../../types";
import { formatNumber } from "../../../utils/format";

interface HotTokensListProps {
  maxTokens?: number;
  initialLoading?: boolean;
}

export const HotTokensList: React.FC<HotTokensListProps> = ({
  maxTokens = 5,
  initialLoading = false
}) => {
  const {
    hotTokens: standardizedHotTokens,
    isLoading: standardizedLoading,
    error: standardizedError,
    isConnected,
    connectionState,
    refresh
  } = useStandardizedTokenData("all", "hot", {}, 5, maxTokens);

  const [hotTokens, setHotTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(initialLoading || standardizedLoading);
  const [error, setError] = useState<string | null>(standardizedError);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [debugInfo, setDebugInfo] = useState<{
    connectionStatus: string;
    lastError: string | null;
    tokenCount: number;
    lastAttempt: string;
  }>({
    connectionStatus: 'initializing',
    lastError: null,
    tokenCount: 0,
    lastAttempt: new Date().toISOString()
  });
  
  const [lastSoundTime, setLastSoundTime] = useState<Record<string, number>>({
    up: 0,
    down: 0,
    rank: 0
  });
  
  const SOUND_COOLDOWN = 3000;
  const SIGNIFICANT_CHANGE_THRESHOLD = 2.5;
  
  const [playUpSound] = useSound('/assets/media/sounds/token-up.mp3', { 
    volume: 0.3,
    interrupt: true,
    soundEnabled
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
  
  const playThrottledSound = useCallback((
    soundType: 'up' | 'down' | 'rank',
    playFunction: () => void,
    isSignificant: boolean = true
  ) => {
    const now = Date.now();
    const lastPlayed = lastSoundTime[soundType];
    const timeSinceLastSound = now - lastPlayed;
    
    if (timeSinceLastSound > SOUND_COOLDOWN && (isSignificant || soundType === 'rank')) {
      playFunction();
      setLastSoundTime(prev => ({
        ...prev,
        [soundType]: now
      }));
    }
  }, [lastSoundTime]);
  
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
    return colors[symbol] || '#7F00FF';
  }, []);
  
  useEffect(() => {
    setDebugInfo(prev => ({
      ...prev,
      connectionStatus: connectionState || 'unknown',
      lastError: standardizedError || null,
      tokenCount: (standardizedHotTokens || []).length,
      lastAttempt: new Date().toISOString()
    }));
    
    console.log("[HotTokensList] Hook state update:", {
      connectionState,
      isConnected,
      errorMsg: standardizedError,
      tokensAvailable: (standardizedHotTokens || []).length
    });
    
    if (isConnected && (!standardizedHotTokens || standardizedHotTokens.length === 0)) {
      console.log("[HotTokensList] Connected but no tokens, requesting refresh via hook");
      refresh?.();
    }
    
  }, [isConnected, connectionState, standardizedError, standardizedHotTokens, refresh]);

  useEffect(() => {
    setLoading(standardizedLoading);
    setError(standardizedError);

    if (standardizedHotTokens && standardizedHotTokens.length > 0) {
      setHotTokens(standardizedHotTokens);
      setLoading(false);
    } else if (isConnected && !standardizedLoading) {
      setHotTokens([]);
    }
  }, [standardizedHotTokens, standardizedLoading, standardizedError, isConnected]);
  
  const retryFetch = useCallback(() => {
    console.log("[HotTokensList] Manually retrying token fetch...");
    setLoading(true);
    setError(null);
    
    if (refresh) {
      refresh();
    }
    
    setDebugInfo(prev => ({
      ...prev,
      lastAttempt: new Date().toISOString()
    }));
  }, [refresh]);

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
  
  if (error || hotTokens.length === 0) {
    return (
      <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg">
        <div className="text-center py-4">
          <div className="text-red-400 mb-2">
            {error || "No hot tokens data available"}
          </div>
          
          <details className="mt-3 text-left bg-dark-300/50 p-3 rounded-lg border border-gray-700/50 text-xs">
            <summary className="text-gray-400 cursor-pointer">Debug Information</summary>
            <div className="mt-2 text-gray-300 space-y-1 font-mono pl-2">
              <div>Connection Status: <span className="text-blue-400">{debugInfo.connectionStatus}</span></div>
              <div>WebSocket Connected: <span className={isConnected ? "text-green-400" : "text-red-400"}>{isConnected ? "Yes" : "No"}</span></div>
              <div>Tokens Available: <span className="text-blue-400">{debugInfo.tokenCount}</span></div>
              <div>Last Error: <span className="text-red-400">{debugInfo.lastError || "None"}</span></div>
              <div>Last Attempt: <span className="text-blue-400">{debugInfo.lastAttempt}</span></div>
            </div>
          </details>
          
          <button 
            onClick={retryFetch}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-dark-200/70 backdrop-blur-sm rounded-xl p-4 border border-dark-300/60 shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px),linear-gradient(90deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px)] bg-[length:25px_25px]"></div>
      </div>
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/10 via-transparent to-cyan-500/10 opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/10 to-brand-500/0 animate-pulse-slow opacity-70"></div>
      </div>
      
      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-brand-500/50 -translate-x-0.5 -translate-y-0.5 z-10"></div>
      <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-cyan-500/50 translate-x-0.5 -translate-y-0.5 z-10"></div>
      <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-brand-500/50 -translate-x-0.5 translate-y-0.5 z-10"></div>
      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-cyan-500/50 translate-x-0.5 translate-y-0.5 z-10"></div>
      
      <div className="relative mb-5 flex items-center">
        <div className="flex-1">
          <div className="relative">
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 font-cyber relative z-10">
              The Elite Token List
            </h3>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-yellow-500/70 via-amber-400 to-yellow-300/50"></div>
            
            <p className="text-xs text-gray-400 mt-1 flex items-center">
              <span className="mr-2">DegenDuel</span>
              <span className="font-mono text-yellow-500 animate-pulse">•</span>
              <span className="ml-2">Exclusive Selection</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
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
          
          <div className={`flex items-center ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-1.5`}></span>
            <span className="text-xs font-mono">{isConnected ? 'LIVE' : 'SYNC'}</span>
          </div>
          
          <button
            onClick={retryFetch}
            className="w-8 h-8 rounded-md flex items-center justify-center bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
            title="Refresh data"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="relative space-y-3">
        <AnimatePresence mode="popLayout">
          {hotTokens.map((token, index) => {
            const isPositive = Number(token.change24h) >= 0;
            
            return (
              <motion.div
                key={token.contractAddress}
                layout
                layoutId={token.contractAddress}
                initial={{ opacity: 0, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
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
                    <div 
                      className={`absolute inset-0 transition-opacity duration-300 ${
                        Number(token.change24h) >= 0 
                          ? 'bg-gradient-to-r from-green-500/5 via-transparent to-transparent' 
                          : 'bg-gradient-to-r from-red-500/5 via-transparent to-transparent'
                      } ${Number(token.change24h) >= 3 || Number(token.change24h) <= -3 ? 'opacity-100' : 'opacity-0'}`}
                    ></div>
                    
                    <div className="absolute -top-1 -left-1 w-8 h-8">
                      <div 
                        className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-br-lg flex items-center justify-center text-black font-bold text-xs shadow-lg z-10 transition-transform duration-300 group-hover:scale-110 origin-top-left"
                      >
                        #{index + 1}
                      </div>
                      <div className="absolute inset-0 bg-yellow-500/20 animate-pulse rounded-br-lg"></div>
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/5 to-transparent transform group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                    
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
                    
                    <div className="p-3 pl-9 flex items-center">
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
                        
                        <div 
                          className={`absolute bottom-0 left-0 right-0 h-1 ${isPositive ? 'bg-green-500' : 'bg-red-500'} opacity-90`}
                        ></div>
                      </div>
                      
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center">
                          <h4 className="text-base font-bold text-white group-hover:text-yellow-400 transition-colors duration-300">{token.symbol}</h4>
                          <span className="ml-2 text-xs text-gray-400 truncate">{token.name}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-sm font-mono text-white">${formatNumber(token.price)}</div>
                          
                          <div className="text-xs text-gray-400 flex items-center">
                            <span className="mr-1">Vol:</span>
                            <span className="font-mono">${formatNumber(Number(token.volume24h), 'compact' as any)}</span>
                          </div>
                        </div>
                      </div>
                      
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