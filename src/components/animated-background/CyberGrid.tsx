// src/components/animated-background/CyberGrid.tsx


import { motion } from 'framer-motion';

// Modified to act as a standalone background layer instead of a wrapper
export function CyberGrid() { // Removed children prop
  return (
    // Changed to fixed position, full screen, negative z-index, removed overflow-hidden
    <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-darkGrey-dark via-darkGrey to-mauve-dark">
      {/* Grid overlay - still absolute within the fixed container */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(#9D4EDD 1px, transparent 1px), linear-gradient(90deg, #9D4EDD 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Particles - still absolute within the fixed container */}
      <FloatingParticles />
      
      {/* Removed the children wrapper div */}
    </div>
  );
}

function FloatingParticles() {
  // Ensure particles render within the new fixed container bounds
  // Using 100vw and 100vh for initial positioning relative to viewport
  const initialX = () => Math.random() * 100 + 'vw';
  const initialY = () => -20; // Start above the screen
  const animateY = () => window.innerHeight + 20; // Animate below the screen
  const animateX = (i: number) => `calc(${Math.random() * 100}vw + ${Math.sin(i) * 50}px)`;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-mauve-light rounded-full opacity-30"
          // Updated initial/animate props to use viewport units or explicit window dimensions
          initial={{ x: initialX(), y: initialY() }}
          animate={{
            y: animateY(),
            x: animateX(i),
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: "linear",
            // Ensure x animation stays within reasonable bounds if needed
            // The previous calculation seemed fine, retaining it
            x: {
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