import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

const EnhancedIntroLogoClean = ({ mode = 'standard' }: { mode?: 'standard' | 'epic' | 'extreme' }) => {
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
        setScale(0.4);
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
    const degenD = logoRef.current.querySelector('.degen-d');
    const degenE = logoRef.current.querySelector('.degen-e');
    const degenG = logoRef.current.querySelector('.degen-g');
    const degenE2 = logoRef.current.querySelector('.degen-e2');
    const degenN = logoRef.current.querySelector('.degen-n');
    
    const duelD = logoRef.current.querySelector('.duel-d');
    const duelU = logoRef.current.querySelector('.duel-u');
    const duelE = logoRef.current.querySelector('.duel-e');
    const duelL = logoRef.current.querySelector('.duel-l');

    const degenLetters = [degenD, degenE, degenG, degenE2, degenN];
    const duelLetters = [duelD, duelU, duelE, duelL];
    const allLetters = [...degenLetters, ...duelLetters];

    // Set initial state - all parts invisible and positioned for clean entry
    gsap.set(degenLetters, {
      opacity: 0,
      y: isExtreme ? -30 : (isEpic ? -20 : -10),
      scale: 0.95,
      transformOrigin: "center center"
    });

    gsap.set(duelLetters, {
      opacity: 0,
      y: isExtreme ? 30 : (isEpic ? 20 : 10),
      scale: 0.95,
      transformOrigin: "center center"
    });

    // Build the intro animation - modern and sophisticated
    tl.current
      // DEGEN Part - Smooth fade and slide
      .to(degenLetters, { 
        opacity: 1, 
        y: 0,
        scale: 1,
        duration: isExtreme ? 0.8 : (isEpic ? 0.6 : 0.4), 
        ease: "expo.out",
        stagger: isExtreme ? 0.05 : 0.03
      })
      
      // DUEL Part - Smooth fade and slide with overlap
      .to(duelLetters, { 
        opacity: 1, 
        y: 0,
        scale: 1,
        duration: isExtreme ? 0.8 : (isEpic ? 0.6 : 0.4), 
        ease: "expo.out",
        stagger: isExtreme ? 0.05 : 0.03
      }, isExtreme ? "-=0.6" : (isEpic ? "-=0.4" : "-=0.3"));
      
    // Add subtle finishing touch for extreme mode only
    if (isExtreme) {
      tl.current
        // Very subtle scale settle
        .to(allLetters, {
          scale: 1.01,
          duration: 0.3,
          ease: "power2.out"
        }, "-=0.2")
        .to(allLetters, {
          scale: 1,
          duration: 0.4,
          ease: "power2.inOut"
        });
    }

    // Hold the logo visible for a moment
    tl.current.to({}, { duration: isExtreme ? 2.5 : (isEpic ? 2 : 1.5) });

    // Add outro animation - fade out in reverse
    tl.current
      // DUEL Part fades out first
      .to(duelLetters, { 
        opacity: 0, 
        y: isExtreme ? 30 : (isEpic ? 20 : 10),
        scale: 0.95,
        duration: isExtreme ? 0.8 : (isEpic ? 0.6 : 0.4), 
        ease: "expo.in",
        stagger: {
          each: isExtreme ? 0.05 : 0.03,
          from: "end"
        }
      })
      
      // DEGEN Part fades out with overlap
      .to(degenLetters, { 
        opacity: 0, 
        y: isExtreme ? -30 : (isEpic ? -20 : -10),
        scale: 0.95,
        duration: isExtreme ? 0.8 : (isEpic ? 0.6 : 0.4), 
        ease: "expo.in",
        stagger: {
          each: isExtreme ? 0.05 : 0.03,
          from: "end"
        }
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
      className="relative flex justify-center items-center"
    >
      <div 
        className="flex justify-center items-center min-h-[300px] relative z-10"
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
          {/* DEGEN DUEL Logo - Clean version */}
          <div className="flex items-start gap-0">
            {/* First D - Russo One with clean edges */}
            <span
              className="degen-d"
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: '144px',
                color: '#9D4EDD',
                marginRight: '-0.05em',
                lineHeight: 1,
                position: 'relative',
                zIndex: 10,
                // Minimal, crisp shadow
                textShadow: '3px 3px 0px rgba(0, 0, 0, 0.9)',
                // Clean edges
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden'
              }}
            >
              D
            </span>

            {/* EGEN - Orbitron Black - Individual spans */}
            <div className="flex" style={{ transform: 'translateY(0.15em)', lineHeight: 1 }}>
              <span className="degen-e degen-letters" style={{ 
                fontFamily: "'Orbitron', sans-serif", 
                fontWeight: 900, 
                fontSize: '96px', 
                letterSpacing: '-0.05em', 
                color: '#9D4EDD',
                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.9)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden'
              }}>E</span>
              <span className="degen-g degen-letters" style={{ 
                fontFamily: "'Orbitron', sans-serif", 
                fontWeight: 900, 
                fontSize: '96px', 
                letterSpacing: '-0.05em', 
                color: '#9D4EDD',
                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.9)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden'
              }}>G</span>
              <span className="degen-e2 degen-letters" style={{ 
                fontFamily: "'Orbitron', sans-serif", 
                fontWeight: 900, 
                fontSize: '96px', 
                letterSpacing: '-0.05em', 
                color: '#9D4EDD',
                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.9)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden'
              }}>E</span>
              <span className="degen-n degen-letters" style={{ 
                fontFamily: "'Orbitron', sans-serif", 
                fontWeight: 900, 
                fontSize: '96px', 
                letterSpacing: '-0.05em', 
                color: '#9D4EDD',
                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.9)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden'
              }}>N</span>
            </div>

            {/* Space between */}
            <span style={{ width: '0.15em' }}></span>

            {/* Second D - Russo One with clean edges */}
            <span
              className="duel-d"
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: '144px',
                color: '#FFFFFF', 
                margin: '0 -0.05em',
                lineHeight: 1,
                position: 'relative',
                zIndex: 10,
                // Minimal, crisp shadow
                textShadow: '3px 3px 0px rgba(0, 0, 0, 0.9)',
                // Clean edges
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden'
              }}
            >
              D
            </span>

            {/* UEL - Orbitron Black - Individual spans */}
            <div className="flex" style={{ transform: 'translateY(0.15em)', lineHeight: 1 }}>
              <span className="duel-u duel-letters" style={{ 
                fontFamily: "'Orbitron', sans-serif", 
                fontWeight: 900, 
                fontSize: '96px', 
                letterSpacing: '-0.05em', 
                color: '#FFFFFF',
                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.9)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden'
              }}>U</span>
              <span className="duel-e duel-letters" style={{ 
                fontFamily: "'Orbitron', sans-serif", 
                fontWeight: 900, 
                fontSize: '96px', 
                letterSpacing: '-0.05em', 
                color: '#FFFFFF',
                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.9)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden'
              }}>E</span>
              <span className="duel-l duel-letters" style={{ 
                fontFamily: "'Orbitron', sans-serif", 
                fontWeight: 900, 
                fontSize: '96px', 
                letterSpacing: '-0.05em', 
                color: '#FFFFFF',
                textShadow: '2px 2px 0px rgba(0, 0, 0, 0.9)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden'
              }}>L</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedIntroLogoClean;