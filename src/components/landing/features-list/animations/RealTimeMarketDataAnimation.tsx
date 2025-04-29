// src/components/landing/features-list/animations/RealTimeMarketDataAnimation.tsx

/**
 * Animation component for the Real-Time Market Data feature card
 * Visualizes live token data streams with WebSocket latency indicators
 */

import React from 'react';
import { motion } from 'framer-motion';

export const RealTimeMarketDataAnimation: React.FC = () => {
  // Sample token data
  const tokens = [
    { symbol: 'SOL', price: '198.75', change: '+2.4%', color: 'green' },
    { symbol: 'BTC', price: '62,841', change: '-0.7%', color: 'red' },
    { symbol: 'BONK', price: '0.00028', change: '+5.2%', color: 'green' },
    { symbol: 'DEGEN', price: '0.065', change: '+12.7%', color: 'green' },
    { symbol: 'ETH', price: '3,418', change: '+0.8%', color: 'green' },
    { symbol: 'PYTH', price: '0.86', change: '-1.2%', color: 'red' },
  ];
  
  // WebSocket performance metrics
  const wsMetrics = {
    latency: '12ms',
    uptime: '99.97%',
    connections: '12,485',
    messagesPerSecond: '9,427',
    status: 'Operational'
  };
  
  // Candlestick data for the chart
  const candlesticks = [
    { open: 35, high: 45, low: 30, close: 40, volume: 12, bullish: true },
    { open: 40, high: 50, low: 38, close: 39, volume: 18, bullish: false },
    { open: 39, high: 41, low: 36, close: 40, volume: 15, bullish: true },
    { open: 40, high: 44, low: 39, close: 43, volume: 21, bullish: true },
    { open: 43, high: 48, low: 41, close: 42, volume: 24, bullish: false },
    { open: 42, high: 43, low: 38, close: 41, volume: 18, bullish: false },
    { open: 41, high: 45, low: 40, close: 44, volume: 22, bullish: true },
    { open: 44, high: 46, low: 42, close: 45, volume: 20, bullish: true },
    { open: 45, high: 48, low: 43, close: 47, volume: 23, bullish: true },
    { open: 47, high: 49, low: 44, close: 48, volume: 25, bullish: true },
    { open: 48, high: 52, low: 47, close: 50, volume: 30, bullish: true },
    { open: 50, high: 52, low: 48, close: 49, volume: 28, bullish: false },
  ];
  
  // Animation for data packets
  const packetVariants = {
    animate: (custom: number) => ({
      y: [0, 40],
      opacity: [0, 1, 0],
      transition: {
        y: { 
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: 1.2,
          delay: custom * 0.15
        },
        opacity: { 
          duration: 0.6, 
          repeat: Infinity,
          repeatDelay: 1.2,
          delay: custom * 0.15,
          times: [0, 0.2, 1]
        }
      }
    })
  };
  
  // Pulse animation for connection indicators
  const pulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity
      }
    }
  };
  
  // Ticker tape animation
  const tickerVariants = {
    animate: {
      x: [0, -1000],
      transition: {
        x: {
          repeat: Infinity,
          duration: 20,
          ease: "linear"
        }
      }
    }
  };
  
  // Animation for the data points in the chart
  const dataPointVariants = {
    initial: { y: 10, opacity: 0 },
    animate: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.3
      }
    })
  };
  
  // Convert price value to viewBox height (inverted for chart)
  const scaleY = (value: number) => {
    const min = 30; // Lowest value in dataset
    const max = 52; // Highest value in dataset
    const range = max - min;
    const scaledValue = ((value - min) / range) * 90;
    return 100 - scaledValue; // Invert for SVG coords (0 is top)
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-dark-300/60 rounded-lg text-xs">
      {/* Main app container */}
      <div className="flex-1 flex flex-col">
        {/* Header with metrics */}
        <div className="bg-dark-400/50 p-2 flex justify-between items-center border-b border-dark-500">
          <div className="font-mono text-gray-300">
            WebSocket Status
          </div>
          <div className="flex items-center">
            <motion.div 
              className="h-2 w-2 rounded-full bg-green-500 mr-1.5"
              variants={pulseVariants}
              animate="animate"
            />
            <span className="text-green-400 font-mono">{wsMetrics.status}</span>
          </div>
        </div>
        
        {/* WebSocket metrics */}
        <div className="grid grid-cols-4 gap-0.5 p-2 border-b border-dark-500 bg-dark-400/30">
          <div className="flex flex-col">
            <span className="text-gray-400 font-mono text-[9px]">LATENCY</span>
            <span className="text-green-400 font-mono font-bold">{wsMetrics.latency}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 font-mono text-[9px]">UPTIME</span>
            <span className="text-green-400 font-mono font-bold">{wsMetrics.uptime}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 font-mono text-[9px]">CONNECTIONS</span>
            <span className="text-white font-mono font-bold">{wsMetrics.connections}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 font-mono text-[9px]">MSG/SEC</span>
            <span className="text-white font-mono font-bold">{wsMetrics.messagesPerSecond}</span>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex">
          {/* Left sidebar - token prices */}
          <div className="w-1/3 border-r border-dark-500 bg-dark-400/20 flex flex-col">
            {/* Token list header */}
            <div className="p-1.5 border-b border-dark-500/50 bg-dark-400/40 flex justify-between">
              <div className="text-gray-400 font-mono text-[9px]">SYMBOL</div>
              <div className="text-gray-400 font-mono text-[9px]">PRICE</div>
            </div>
            
            {/* Scrollable token list */}
            <div className="flex-1 overflow-hidden">
              {/* Tokens with animated updates */}
              {tokens.map((token, idx) => (
                <div 
                  key={token.symbol}
                  className="p-1.5 border-b border-dark-500/30 flex justify-between items-center"
                >
                  <div className="flex items-center">
                    <motion.div 
                      className="h-1.5 w-1.5 rounded-full bg-brand-500 mr-1"
                      animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: idx * 0.3
                      }}
                    />
                    <span className="font-mono text-white">{token.symbol}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <motion.span 
                      className="font-mono text-white"
                      animate={{
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: idx * 0.2
                      }}
                    >
                      ${token.price}
                    </motion.span>
                    <span className={`font-mono text-${token.color}-500 text-[8px]`}>
                      {token.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right panel - candlestick chart */}
          <div className="w-2/3 flex flex-col">
            {/* Chart header */}
            <div className="p-1.5 border-b border-dark-500 bg-dark-400/40 flex justify-between">
              <div className="text-white font-mono">SOL/USD</div>
              <div className="text-green-500 font-mono">$198.75 +2.4%</div>
            </div>
            
            {/* Chart container */}
            <div className="flex-1 p-1 relative">
              {/* Chart grid */}
              <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_19px,#3f3f4605_20px,#3f3f4605_21px,transparent_22px),linear-gradient(90deg,transparent_19px,#3f3f4605_20px,#3f3f4605_21px,transparent_22px)] bg-[length:20px_20px]"></div>
              
              {/* Candlestick chart */}
              <svg viewBox="0 0 120 100" className="w-full h-full">
                {/* Price levels */}
                <line x1="0" y1={scaleY(30)} x2="120" y2={scaleY(30)} stroke="#1f2937" strokeWidth="0.5" />
                <line x1="0" y1={scaleY(40)} x2="120" y2={scaleY(40)} stroke="#1f2937" strokeWidth="0.5" />
                <line x1="0" y1={scaleY(50)} x2="120" y2={scaleY(50)} stroke="#1f2937" strokeWidth="0.5" />
                
                {/* Price indicators */}
                <text x="2" y={scaleY(30) + 3} fontSize="3" fill="#6b7280">$30</text>
                <text x="2" y={scaleY(40) + 3} fontSize="3" fill="#6b7280">$40</text>
                <text x="2" y={scaleY(50) + 3} fontSize="3" fill="#6b7280">$50</text>
                
                {/* Candlesticks */}
                {candlesticks.map((candle, i) => {
                  const x = i * 10;
                  const width = 6;
                  const halfWidth = width / 2;
                  
                  return (
                    <motion.g 
                      key={i}
                      variants={dataPointVariants}
                      initial="initial"
                      animate="animate"
                      custom={i}
                    >
                      {/* Wick */}
                      <line 
                        x1={x + halfWidth} 
                        y1={scaleY(candle.low)} 
                        x2={x + halfWidth} 
                        y2={scaleY(candle.high)} 
                        stroke={candle.bullish ? "#10b981" : "#ef4444"} 
                        strokeWidth="0.7" 
                      />
                      
                      {/* Body */}
                      <rect 
                        x={x} 
                        y={scaleY(Math.max(candle.open, candle.close))} 
                        width={width} 
                        height={Math.abs(scaleY(candle.open) - scaleY(candle.close))} 
                        fill={candle.bullish ? "#10b981" : "#ef4444"} 
                      />
                      
                      {/* Volume indicator */}
                      <rect 
                        x={x} 
                        y={95} 
                        width={width} 
                        height={candle.volume / 10} 
                        fill={candle.bullish ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"} 
                      />
                    </motion.g>
                  );
                })}
                
                {/* Current price line */}
                <motion.line 
                  x1="0" 
                  y1={scaleY(50)} 
                  x2="120" 
                  y2={scaleY(50)} 
                  stroke="#d946ef" 
                  strokeWidth="0.5" 
                  strokeDasharray="2,1"
                  animate={{
                    y1: [scaleY(50), scaleY(51), scaleY(49.5), scaleY(50.5), scaleY(50)],
                    y2: [scaleY(50), scaleY(51), scaleY(49.5), scaleY(50.5), scaleY(50)]
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity
                  }}
                />
              </svg>
              
              {/* Realtime indicator */}
              <div className="absolute top-2 right-2 flex items-center bg-dark-800/70 rounded px-1.5 py-0.5 border border-dark-700/80">
                <motion.div 
                  className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"
                  variants={pulseVariants}
                  animate="animate"
                />
                <span className="text-[8px] font-mono text-green-400">LIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom: WebSocket visualization */}
      <div className="h-14 bg-dark-800/50 border-t border-dark-500 relative overflow-hidden">
        {/* Server node */}
        <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 bg-dark-700 rounded-lg border border-dark-600 px-2 py-1">
          <div className="flex items-center">
            <motion.div 
              className="h-2 w-2 rounded-full bg-brand-500 mr-1"
              variants={pulseVariants}
              animate="animate"
            />
            <span className="text-[9px] font-mono text-white">DegenDuel WSS</span>
          </div>
        </div>
        
        {/* Client nodes */}
        <div className="absolute bottom-1 left-0 right-0 flex justify-around">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-dark-700 rounded border border-dark-600 px-1.5 py-0.5">
              <div className="flex items-center">
                <motion.div 
                  className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"
                  variants={pulseVariants}
                  animate="animate"
                  custom={i}
                />
                <span className="text-[8px] font-mono text-white">Client {i}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Data packet animations */}
        <div className="absolute inset-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              {/* Downlink packets */}
              <motion.div 
                className="absolute top-7 w-2 h-2 bg-gradient-to-br from-brand-400 to-purple-600 rounded-full opacity-0"
                style={{ left: `${10 + i * 20}%` }}
                variants={packetVariants}
                animate="animate"
                custom={i}
              />
              {/* Uplink packets */}
              <motion.div 
                className="absolute bottom-7 w-1.5 h-1.5 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full opacity-0"
                style={{ left: `${15 + i * 15}%` }}
                variants={packetVariants}
                animate="animate"
                custom={i + 2.5}
              />
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Ticker tape footer */}
      <motion.div 
        className="h-5 bg-dark-900/70 border-t border-dark-500 flex items-center whitespace-nowrap overflow-hidden"
        variants={tickerVariants}
        animate="animate"
      >
        <div className="flex space-x-4 px-2 py-1">
          {Array(10).fill(null).map((_, i) => [
            <span key={`g-${i}`} className="text-[8px] font-mono text-green-500">SOL $198.75 +2.4%</span>,
            <span key={`r-${i}`} className="text-[8px] font-mono text-red-500">BTC $62,841 -0.7%</span>,
            <span key={`g2-${i}`} className="text-[8px] font-mono text-green-500">BONK $0.00028 +5.2%</span>,
            <span key={`g3-${i}`} className="text-[8px] font-mono text-green-500">DEGEN $0.065 +12.7%</span>,
          ]).flat()}
        </div>
      </motion.div>
    </div>
  );
};