// src/components/animated-background/CyberGrid.tsx


import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { usePerformanceMode } from '../ui/PerformanceToggle';

// Modified to act as a standalone background layer instead of a wrapper
export function CyberGrid() { // Removed children prop
  const [documentHeight, setDocumentHeight] = useState('100vh');
  const isPerformanceMode = usePerformanceMode();
  
  useEffect(() => {
    const updateHeight = () => {
      const height = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight,
        window.innerHeight
      );
      setDocumentHeight(`${height}px`);
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    // Also update when content changes
    const observer = new MutationObserver(updateHeight);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      observer.disconnect();
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
        className="absolute inset-0 opacity-10"
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
  // Use CSS viewport units for truly dynamic, responsive positioning
  const getInitialX = () => Math.random() * 100; // 0-100% of viewport width
  const getInitialY = () => -5; // Start slightly above viewport
  const getAnimateY = () => 105; // End slightly below viewport (105vh)
  const getAnimateX = (_i: number) => Math.random() * 100; // Random position across viewport width

  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-mauve-light rounded-full opacity-30"
          style={{
            left: `${getInitialX()}vw`,
            top: `${getInitialY()}vh`,
          }}
          animate={{
            top: `${getAnimateY()}vh`,
            left: `${getAnimateX(i)}vw`,
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: "linear",
            left: {
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: "easeInOut",
            }
          }}
        />
      ))}
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