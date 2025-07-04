import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

const DoubleDLogoClean = ({ mode = 'standard' }: { mode?: 'standard' | 'epic' | 'extreme' }) => {
  const logoRef = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [scale, setScale] = useState(1);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Determine whether to use the extreme animations
  const isEpic = mode === 'epic' || mode === 'extreme';
  const isExtreme = mode === 'extreme';

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setScale(0.6);
      } else {
        setScale(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Prevent multiple initializations
    if (animationComplete) return;

    // Clear any existing animations
    if (tl.current) {
      tl.current.kill();
    }

    tl.current = gsap.timeline({
      paused: true,
      onComplete: () => {
        setAnimationComplete(true);
        // Animation fully completes with outro - ready for external looping
      }
    });

    if (!logoRef.current || !tl.current) return;

    // Select logo parts
    const firstD = logoRef.current.querySelector('.first-d');
    const secondD = logoRef.current.querySelector('.second-d');
    const allLetters = [firstD, secondD];

    // Set initial state - both D's invisible and positioned for entry
    gsap.set(firstD, {
      opacity: 0,
      scale: isExtreme ? 0 : (isEpic ? 0.8 : 0.9),
      transformOrigin: "center center"
    });

    gsap.set(secondD, {
      opacity: 0,
      scale: isExtreme ? 0 : (isEpic ? 0.8 : 0.9),
      transformOrigin: "center center"
    });

    // Build the intro animation - modern and clean
    tl.current
      // Both D's scale in with slight stagger
      .to(firstD, { 
        opacity: 1, 
        scale: 1,
        duration: isExtreme ? 0.8 : (isEpic ? 0.6 : 0.4), 
        ease: "expo.out" 
      })
      .to(secondD, { 
        opacity: 1, 
        scale: 1,
        duration: isExtreme ? 0.8 : (isEpic ? 0.6 : 0.4), 
        ease: "expo.out" 
      }, isExtreme ? "-=0.6" : (isEpic ? "-=0.4" : "-=0.3")); // Slight overlap
      
    // Add subtle impact effects for epic/extreme modes
    if (isExtreme) {
      tl.current
        // Subtle scale overshoot
        .to(allLetters, {
          scale: 1.02,
          duration: 0.2,
          ease: "power2.out"
        }, "-=0.1")
        .to(allLetters, {
          scale: 1,
          duration: 0.3,
          ease: "power2.inOut"
        });
    }

    // Hold the logo visible for a moment
    tl.current.to({}, { duration: isExtreme ? 2 : (isEpic ? 1.5 : 1) });

    // Add outro animation - fade out in reverse
    tl.current
      .to(secondD, { 
        opacity: 0, 
        scale: isExtreme ? 0 : (isEpic ? 0.8 : 0.9),
        duration: isExtreme ? 0.8 : (isEpic ? 0.6 : 0.4), 
        ease: "expo.in" 
      })
      .to(firstD, { 
        opacity: 0, 
        scale: isExtreme ? 0 : (isEpic ? 0.8 : 0.9),
        duration: isExtreme ? 0.8 : (isEpic ? 0.6 : 0.4), 
        ease: "expo.in" 
      }, isExtreme ? "-=0.6" : (isEpic ? "-=0.4" : "-=0.3"));

    // No looping animations - the intro+outro completes once for clean recording

    // Always play the full intro+outro animation
    tl.current.play(0);

    return () => {
      // Clean up
      if (tl.current) {
        tl.current.kill();
      }
    };
  }, [isEpic, isExtreme, mode, animationComplete]);

  return (
    <div 
      className="relative z-10 flex justify-center items-center"
    >
      <div 
        className="flex justify-center items-center min-h-[300px]"
      >
        <div
          ref={logoRef}
          className="logo-container"
          style={{
            WebkitFontSmoothing: 'antialiased',
            transform: `scale(${scale})`,
            transition: 'transform 0.3s ease-out'
          }}
        >
          {/* Double D Logo - Clean version with minimal effects */}
          <div className="flex items-center">
            {/* First D - Purple with clean edges */}
            <span
              className="first-d"
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: '200px',
                color: '#9D4EDD',
                lineHeight: 1,
                display: 'block',
                position: 'relative',
                zIndex: 2,
                // Minimal, crisp shadow for definition only
                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
                // Clean edges
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                outline: '2px solid transparent'
              }}
            >
              D
            </span>

            {/* Second D - White with clean edges */}
            <span
              className="second-d"
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: '200px',
                color: '#FFFFFF',
                lineHeight: 1,
                display: 'block',
                marginLeft: '-80px',
                position: 'relative',
                zIndex: 1,
                // Minimal, crisp shadow for definition only
                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
                // Clean edges
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                outline: '2px solid transparent'
              }}
            >
              D
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DoubleDLogoClean;