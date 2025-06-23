// src/components/animated-background/CyberGrid.tsx


import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { usePerformanceMode } from '../ui/PerformanceToggle';

// Modified to act as a standalone background layer instead of a wrapper
export function CyberGrid() { // Removed children prop
  const [documentHeight, setDocumentHeight] = useState('100vh');
  const isPerformanceMode = usePerformanceMode();
  
  useEffect(() => {
    let rafId: number | null = null;
    let cachedHeight = window.innerHeight;
    
    const updateHeight = () => {
      if (rafId) return;
      
      rafId = requestAnimationFrame(() => {
        const height = Math.max(
          document.documentElement.scrollHeight,
          document.documentElement.clientHeight,
          window.innerHeight
        );
        
        if (Math.abs(height - cachedHeight) > 10) {
          cachedHeight = height;
          setDocumentHeight(`${height}px`);
        }
        rafId = null;
      });
    };
    
    updateHeight();
    
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    
    resizeObserver.observe(document.documentElement);
    resizeObserver.observe(document.body);
    
    window.addEventListener('resize', updateHeight, { passive: true });
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateHeight);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    // Fixed positioning covering full viewport width and calculated document height
    <div className="fixed top-0 left-0 z-[-1] bg-gradient-to-br from-darkGrey-dark via-darkGrey to-mauve-dark"
         style={{ 
           height: documentHeight,
           width: '100vw',
           right: 0
         }}>
      {/* Grid overlay - responsive sizing based on viewport */}
      <div 
        className="absolute inset-0 opacity-10 will-change-transform"
        style={{
          backgroundImage: 'linear-gradient(#9D4EDD 1px, transparent 1px), linear-gradient(90deg, #9D4EDD 1px, transparent 1px)',
          backgroundSize: 'clamp(30px, 4vw, 60px) clamp(30px, 4vw, 60px)',
        }}
      />

      {/* Particles - conditional rendering based on performance mode */}
      {!isPerformanceMode ? (
        <FloatingParticles />
      ) : (
        // Static particles for performance mode - minimal visual impact
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-mauve-light rounded-full"
              style={{
                left: `${15 + (i * 12)}%`,
                top: `${20 + (i * 8)}%`,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Removed the children wrapper div */}
    </div>
  );
}

function FloatingParticles() {
  // Reduced particle count and optimized animations
  const particleCount = 12;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: particleCount }).map((_, i) => {
        const initialX = Math.random() * 100;
        const animateX = Math.random() * 100;
        const duration = Math.random() * 8 + 7;
        const horizontalDuration = Math.random() * 4 + 3;
        
        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-mauve-light rounded-full opacity-30 will-change-transform"
            style={{
              left: `${initialX}vw`,
              top: '-5vh',
            }}
            animate={{
              top: '105vh',
              left: `${animateX}vw`,
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5,
              left: {
                duration: horizontalDuration,
                repeat: Infinity,
                ease: "easeInOut",
              }
            }}
          />
        );
      })}
    </div>
  );
}

// CSS STYLES - Add to your CSS file
// 
// /* Main styles for cyberpunk scrollbar */
// .custom-scrollbar::-webkit-scrollbar {
//   width: 8px;
//   opacity: 1;
//   transition: opacity 0.7s ease;
// }
// 
// .custom-scrollbar::-webkit-scrollbar-track {
//   background: rgba(0, 0, 0, 0.3);
//   border-radius: 4px;
// }
// 
// .custom-scrollbar::-webkit-scrollbar-thumb {
//   background: rgba(157, 78, 221, 0.5);
//   border-radius: 4px;
// }
// 
// .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//   background: rgba(157, 78, 221, 0.8);
// }
// 
// /* Firefox scrollbar handling */
// .custom-scrollbar {
//   scrollbar-width: thin;
//   scrollbar-color: rgba(157, 78, 221, 0.5) rgba(0, 0, 0, 0.3);
// }

// TAILWIND CONFIG - Add to your tailwind.config.js
// 
// module.exports = {
//   theme: {
//     extend: {
//       colors: {
//         mauve: {
//           light: '#9D4EDD',
//           DEFAULT: '#7B2CBF',
//           dark: '#5A189A',
//         },
//         darkGrey: {
//           light: '#2D2D2D',
//           DEFAULT: '#1A1A1A',
//           dark: '#0D0D0D',
//         },
//       },
//       animation: {
//         'cybergrid-float': 'cybergrid-float 6s ease-in-out infinite',
//         'cybergrid-glow': 'cybergrid-glow 2s ease-in-out infinite',
//         'cybergrid-pulse-slow': 'cybergrid-pulse-slow 4s ease-in-out infinite',
//       },
//       keyframes: {
//         cybergrid-float: {
//           '0%, 100%': { transform: 'translateY(0)' },
//           '50%': { transform: 'translateY(-20px)' },
//         },
//         cybergrid-glow: {
//           '0%, 100%': { 
//             textShadow: '0 0 20px rgba(157, 78, 221, 0.5), 0 0 40px rgba(157, 78, 221, 0.2)' 
//           },
//           '50%': { 
//             textShadow: '0 0 40px rgba(157, 78, 221, 0.8), 0 0 80px rgba(157, 78, 221, 0.4)' 
//           },
//         },
//       },
//     },
//   },
// };

// USAGE EXAMPLE:
// 
// import { CyberBackground } from './extract-background';
// 
// function App() {
//   return (
//     <CyberBackground>
//       <div className="container mx-auto py-10 px-4">
//         <h1 className="text-mauve-light text-4xl">Your Application</h1>
//         <p className="text-white mt-4">Content goes here</p>
//       </div>
//     </CyberBackground>
//   );
// }