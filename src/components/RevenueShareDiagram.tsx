// src/components/RevenueShareDiagram.tsx

/**
 * Revenue Share Diagram Component
 * 
 * @description Visual explanation of how contest revenue is distributed
 * Shows 90% to winner, 10% to DUEL token holders
 * 
 * TARGET DESIGN SPECIFICATION:
 * 
 * STAGE 1 - Contest Entry:
 * - Show 5 stick figures positioned around a dynamic contest circle
 * - Contest circle should be visually engaging (not a boring square) with rotating elements and glow effects
 * - Each figure sends Solana logos that animate diagonally toward the contest center (not just left/right/up/down)
 * - Animations should be precisely targeted from each player's position to the contest center
 * - Contest shows example name like "Dinnertime Duel" with "Entry fee: 1 SOL" 
 * - No arrows needed - the animated Solana flow tells the story clearly
 * - Staggered timing so each player's payment appears sequentially
 * 
 * STAGE 2 - Revenue Distribution:
 * - Pie chart showing EXACT visual 90/10 proportions (10% = 36 degrees, not fake 2/3 split)
 * - 90% slice in green, 10% slice in purple
 * - The actual 10% pie slice should animate OUT of the pie chart
 * - Slice travels physically from Stage 2 to Stage 3 position
 * - 90% should flow back to contest winners (players 4&5 get crowns/transform)
 * - Curved arrows showing money flow directions with proper physics
 * - No straight boring arrows - dynamic curved paths
 * 
 * STAGE 3 - DUEL Holder Distribution:
 * - The SAME 10% pie slice from Stage 2 arrives and positions at top
 * - Slice "opens up" and distributes Solana diagonally to each individual DUEL holder
 * - 5 DUEL holder stick figures with token symbols above heads
 * - Each holder receives targeted Solana rain (not generic vertical drops)
 * - Staggered delays so distribution appears one-by-one to each holder
 * - After distribution, pie slice returns to Stage 2 and cycle repeats
 * 
 * MASTER ANIMATION CYCLE (8-10 seconds):
 * - Stage 1: Players pay entry fees into contest
 * - Stage 2: Revenue splits, 10% slice detaches and travels to Stage 3
 * - Stage 3: Slice distributes to holders, then returns to Stage 2
 * - Seamless loop with all three stages coordinated in perfect timing
 * - Dynamic directional animations throughout - no boring straight lines
 * 
 * @author BranchManager69
 * @created 2025-07-24
 */

import React from 'react';

export const RevenueShareDiagram: React.FC = () => {
  return (
    <div className="py-12 flex justify-center">
      <div className="flex gap-20 items-start">
        {/* Stage 1: Contest Entry */}
        <div className="flex flex-col items-center">
          <div className="mb-8 h-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <span className="text-gray-300 text-sm font-medium uppercase tracking-wider">Step One</span>
            </div>
          </div>
          <div className="relative w-48 h-56">
            {/* Contest box - centered in larger space */}
            <div className="absolute top-8 left-4 right-4 bottom-8">
              <div className="relative w-full h-full">
                {/* Rotating outer ring - subtle */}
                <div className="absolute inset-0 rounded-full border-2 border-gray-700/20 border-dashed animate-spin-slow"></div>
                {/* Inner circle with gradient */}
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-green-900/20 to-purple-900/20 border border-gray-600/30">
                  {/* Contest text and entry fee */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-gray-200 italic text-xs whitespace-nowrap">Dinnertime Duel</span>
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent my-1"></div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span className="text-[10px]">Entry fee: 1</span>
                      <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-2 h-2 opacity-70" />
                    </div>
                  </div>
                </div>
                {/* Pulse effect - subtle */}
                <div className="absolute inset-0 rounded-full bg-brand-500/10 animate-pulse"></div>
              </div>
            </div>
            
            {/* Player 1 (left) with money flow */}
            <div className="absolute -left-10 top-20">
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              </div>
              <div 
                className="absolute left-7 top-1 w-3 h-3"
                style={{ 
                  animation: 'slideToCenter1 1.5s ease-out infinite',
                  animationDelay: '0s' 
                }}
              >
                <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
              </div>
            </div>
            
            {/* Player 2 (bottom left) with money flow */}
            <div className="absolute -left-8 bottom-4">
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              </div>
              <div 
                className="absolute left-7 top-0 w-3 h-3"
                style={{ 
                  animation: 'slideToCenter2 1.5s ease-out infinite',
                  animationDelay: '0.3s' 
                }}
              >
                <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
              </div>
            </div>
            
            {/* Player 3 (bottom) with money flow */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              </div>
              <div 
                className="absolute left-1 -top-5 w-3 h-3"
                style={{ 
                  animation: 'slideToCenter3 1.5s ease-out infinite',
                  animationDelay: '0.6s' 
                }}
              >
                <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
              </div>
            </div>
            
            {/* Player 4 (right - future winner #1) */}
            <div className="absolute -right-10 top-12" id="winner1">
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              </div>
              <div 
                className="absolute right-7 top-1 w-3 h-3"
                style={{ 
                  animation: 'slideToCenter4 1.5s ease-out infinite',
                  animationDelay: '0.9s' 
                }}
              >
                <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
              </div>
            </div>
            
            {/* Player 5 (right bottom - future winner #2) */}
            <div className="absolute -right-8 bottom-12" id="winner2">
              <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
              </div>
              <div 
                className="absolute right-7 top-0 w-3 h-3"
                style={{ 
                  animation: 'slideToCenter5 1.5s ease-out infinite',
                  animationDelay: '1.2s' 
                }}
              >
                <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Arrow to Stage 2 */}
        <div className="flex items-center pt-20">
          <svg className="w-12 h-12 text-gray-600" viewBox="0 0 48 48">
            <path d="M12 24 L32 24 L28 20 M32 24 L28 28" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        </div>

        {/* Stage 2: Revenue Split */}
        <div className="flex flex-col items-center">
          <div className="mb-8 h-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <span className="text-gray-300 text-sm font-medium uppercase tracking-wider">Step Two</span>
            </div>
          </div>
          <div className="relative w-40 h-40 flex items-center justify-center">
            {/* Pie chart - exact 90/10 split */}
            <svg className="w-32 h-32" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle cx="50" cy="50" r="45" fill="none" stroke="#374151" strokeWidth="1"/>
              {/* 10% = 36 degrees starting from top (12 o'clock) */}
              {/* 10% slice - purple (36 degrees from top) */}
              <path d="M 50,50 L 50,5 A 45,45 1 0,1 85.1,35.5 z" fill="#A855F7" stroke="none" />
              {/* 90% slice - green (remaining 324 degrees) */}
              <path d="M 50,50 L 85.1,35.5 A 45,45 1 1,1 50,5 z" fill="#10B981" stroke="none" />
              <text x="60" y="50" textAnchor="middle" className="fill-white text-lg font-bold">90%</text>
              <text x="67" y="22" textAnchor="middle" className="fill-white text-sm font-bold">10%</text>
            </svg>
            
            {/* Arrow from 90% back to Stage 1 winners */}
            <svg className="absolute -left-32 -top-8 w-40 h-32" viewBox="0 0 160 128">
              <defs>
                <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#10B981" />
                </marker>
              </defs>
              <path d="M120 64 Q60 20 20 40" stroke="#10B981" strokeWidth="3" fill="none" markerEnd="url(#arrowGreen)"/>
              <text x="60" y="40" fontSize="10" fill="#10B981" className="font-bold">90%</text>
            </svg>
            
            {/* Arrow from 10% forward to Stage 3 */}
            <svg className="absolute -right-8 -top-4 w-24 h-32" viewBox="0 0 96 128">
              <defs>
                <marker id="arrowPurple" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L0,6 L9,3 z" fill="#A855F7" />
                </marker>
              </defs>
              <path d="M8 30 Q40 50 70 40" stroke="#A855F7" strokeWidth="3" fill="none" markerEnd="url(#arrowPurple)"/>
              <text x="30" y="45" fontSize="10" fill="#A855F7" className="font-bold">10%</text>
            </svg>
            
            {/* Crown indicators that will appear on winners */}
            <div className="absolute -left-40 -top-12 opacity-0" id="crown1">
              <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
            <div className="absolute -left-38 bottom-8 opacity-0" id="crown2">
              <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Arrow to Stage 3 */}
        <div className="flex items-center pt-20">
          <svg className="w-12 h-12 text-gray-600" viewBox="0 0 48 48">
            <path d="M12 24 L32 24 L28 20 M32 24 L28 28" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        </div>

        {/* Stage 3: Token Holder Distribution */}
        <div className="flex flex-col items-center">
          <div className="mb-8 h-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <span className="text-gray-300 text-sm font-medium uppercase tracking-wider">Step Three</span>
            </div>
          </div>
          <div className="relative w-40">
            {/* Animated 10% pie slice that travels from Step 2 */}
            <div className="mb-4 relative h-16">
              <div 
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  animation: 'pieSliceJourney 8s infinite',
                  transformOrigin: 'center center'
                }}
              >
                <svg className="w-24 h-16" viewBox="0 0 100 64">
                  {/* Exact 10% pie slice matching Step 2 */}
                  <path d="M 50,50 L 50,5 A 45,45 1 0,1 85.1,35.5 z" 
                        fill="#A855F7" 
                        stroke="none" 
                        transform="translate(-50, -25) scale(0.8)" />
                  <text x="50" y="35" textAnchor="middle" className="fill-white text-sm font-bold">10%</text>
                </svg>
              </div>
            </div>
            
            {/* Animated money rain - targeted to each holder */}
            <div className="relative h-24 overflow-hidden">
              <div className="absolute inset-0">
                {/* Rain targeting holder 1 */}
                <div
                  className="absolute w-3 h-3"
                  style={{
                    left: '35%',
                    top: '0px',
                    animation: 'rainToHolder1 1s infinite',
                    animationDelay: '2.8s'
                  }}
                >
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
                </div>
                <div
                  className="absolute w-3 h-3"
                  style={{
                    left: '40%',
                    top: '0px',
                    animation: 'rainToHolder1 1s infinite',
                    animationDelay: '4.5s'
                  }}
                >
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
                </div>
                
                {/* Rain targeting holder 2 */}
                <div
                  className="absolute w-3 h-3"
                  style={{
                    left: '42%',
                    top: '0px',
                    animation: 'rainToHolder2 1s infinite',
                    animationDelay: '3.0s'
                  }}
                >
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
                </div>
                <div
                  className="absolute w-3 h-3"
                  style={{
                    left: '45%',
                    top: '0px',
                    animation: 'rainToHolder2 1s infinite',
                    animationDelay: '4.8s'
                  }}
                >
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
                </div>
                
                {/* Rain targeting holder 3 (center) */}
                <div
                  className="absolute w-3 h-3"
                  style={{
                    left: '48%',
                    top: '0px',
                    animation: 'rainToHolder3 1s infinite',
                    animationDelay: '3.2s'
                  }}
                >
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
                </div>
                <div
                  className="absolute w-3 h-3"
                  style={{
                    left: '52%',
                    top: '0px',
                    animation: 'rainToHolder3 1s infinite',
                    animationDelay: '5.0s'
                  }}
                >
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
                </div>
                
                {/* Rain targeting holder 4 */}
                <div
                  className="absolute w-3 h-3"
                  style={{
                    left: '55%',
                    top: '0px',
                    animation: 'rainToHolder4 1s infinite',
                    animationDelay: '3.4s'
                  }}
                >
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
                </div>
                <div
                  className="absolute w-3 h-3"
                  style={{
                    left: '58%',
                    top: '0px',
                    animation: 'rainToHolder4 1s infinite',
                    animationDelay: '5.2s'
                  }}
                >
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
                </div>
                
                {/* Rain targeting holder 5 */}
                <div
                  className="absolute w-3 h-3"
                  style={{
                    left: '60%',
                    top: '0px',
                    animation: 'rainToHolder5 1s infinite',
                    animationDelay: '3.6s'
                  }}
                >
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
                </div>
                <div
                  className="absolute w-3 h-3"
                  style={{
                    left: '65%',
                    top: '0px',
                    animation: 'rainToHolder5 1s infinite',
                    animationDelay: '5.4s'
                  }}
                >
                  <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-full h-full" />
                </div>
              </div>
            </div>
            
            {/* Token holders - 5 stick figures with DUEL tokens above */}
            <div className="flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  {/* DUEL token indicator */}
                  <div className="w-4 h-4 bg-brand-500/20 border border-brand-500 rounded-full mb-2 flex items-center justify-center">
                    <span className="text-xs font-bold text-brand-400">D</span>
                  </div>
                  {/* Stick figure */}
                  <div className="flex flex-col items-center">
                    <div className="w-5 h-5 bg-gray-500 rounded-full"></div>
                    <div className="w-0.5 h-6 bg-gray-500"></div>
                    <div className="flex">
                      <div className="w-0.5 h-5 bg-gray-500 rotate-12 origin-top"></div>
                      <div className="w-0.5 h-5 bg-gray-500 -rotate-12 origin-top"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">DUEL Holders</div>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes rainToHolder1 {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-20px, 60px);
            opacity: 0;
          }
        }
        
        @keyframes rainToHolder2 {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-10px, 65px);
            opacity: 0;
          }
        }
        
        @keyframes rainToHolder3 {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(0, 70px);
            opacity: 0;
          }
        }
        
        @keyframes rainToHolder4 {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(10px, 65px);
            opacity: 0;
          }
        }
        
        @keyframes rainToHolder5 {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(20px, 60px);
            opacity: 0;
          }
        }
        
        @keyframes slideToCenter1 {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(30px, -8px);
            opacity: 0;
          }
        }
        
        @keyframes slideToCenter2 {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(25px, -15px);
            opacity: 0;
          }
        }
        
        @keyframes slideToCenter3 {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(0, -25px);
            opacity: 0;
          }
        }
        
        @keyframes slideToCenter4 {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-30px, -5px);
            opacity: 0;
          }
        }
        
        @keyframes slideToCenter5 {
          0% {
            transform: translate(0, 0);
            opacity: 1;
          }
          100% {
            transform: translate(-25px, -18px);
            opacity: 0;
          }
        }
        
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        @keyframes pieSliceJourney {
          0% {
            transform: translate(-180px, -60px) scale(0.6);
            opacity: 0;
          }
          10% {
            transform: translate(-180px, -60px) scale(0.6);
            opacity: 1;
          }
          25% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          35% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          65% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          75% {
            transform: translate(-180px, -60px) scale(0.6);
            opacity: 1;
          }
          90% {
            transform: translate(-180px, -60px) scale(0.6);
            opacity: 1;
          }
          100% {
            transform: translate(-180px, -60px) scale(0.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default RevenueShareDiagram;