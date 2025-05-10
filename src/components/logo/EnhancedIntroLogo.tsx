import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

const EnhancedIntroLogo = ({ mode = 'standard' }: { mode?: 'standard' | 'epic' | 'extreme' }) => {
  const logoRef = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const loopTl = useRef<gsap.core.Timeline | null>(null);
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
    // Clear any existing animations
    if (tl.current) {
      tl.current.kill();
    }
    if (loopTl.current) {
      loopTl.current.kill();
    }

    tl.current = gsap.timeline({ 
      paused: true,
      onComplete: () => {
        setAnimationComplete(true);
        if (loopTl.current) loopTl.current.play(0);
      }
    });
    
    loopTl.current = gsap.timeline({ paused: true, repeat: -1 });

    if (!logoRef.current || !tl.current || !loopTl.current) return;

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

    // Set initial state - all parts invisible and positioned for dramatic entry
    gsap.set(degenLetters, {
      opacity: 0,
      x: isEpic ? -100 : -20,
      rotationY: isEpic ? -90 : -45,
      transformOrigin: "left center"
    });

    gsap.set(duelLetters, {
      opacity: 0,
      x: isEpic ? 100 : 20,
      rotationY: isEpic ? 90 : 45,
      transformOrigin: "right center"
    });

    // Add some glitchy flash effect if in extreme mode
    if (isExtreme) {
      gsap.set([degenD, duelD], {
        textShadow: "0 0 0px rgba(255,255,255,0)"
      });
    }

    // Build the intro animation
    tl.current
      // DEGEN Part - Flying in from left with rotation
      .to(degenD, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0, 
        duration: isEpic ? 0.7 : 0.5, 
        ease: "power2.out" 
      })
      .to(degenE, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0, 
        duration: isEpic ? 0.6 : 0.4, 
        ease: "back.out(1.2)" 
      }, "-=0.5")
      .to(degenG, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0, 
        duration: isEpic ? 0.6 : 0.4, 
        ease: "back.out(1.2)" 
      }, "-=0.45")
      .to(degenE2, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0, 
        duration: isEpic ? 0.6 : 0.4, 
        ease: "back.out(1.2)" 
      }, "-=0.4")
      .to(degenN, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0, 
        duration: isEpic ? 0.6 : 0.4, 
        ease: "back.out(1.2)" 
      }, "-=0.35")
      
      // Brief pause before DUEL part
      .addLabel("midPoint", "+=0.1")
      
      // DUEL Part - Flying in from right with rotation
      .to(duelD, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0, 
        duration: isEpic ? 0.7 : 0.5, 
        ease: "power2.out" 
      }, "midPoint")
      .to(duelU, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0, 
        duration: isEpic ? 0.6 : 0.4, 
        ease: "back.out(1.2)" 
      }, "midPoint+=0.2")
      .to(duelE, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0, 
        duration: isEpic ? 0.6 : 0.4, 
        ease: "back.out(1.2)" 
      }, "midPoint+=0.25")
      .to(duelL, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0, 
        duration: isEpic ? 0.6 : 0.4, 
        ease: "back.out(1.2)" 
      }, "midPoint+=0.3");
      
    // Add final impact for extreme mode
    if (isExtreme) {
      tl.current
        .to(allLetters, {
          scale: 1.1,
          duration: 0.2,
          ease: "power4.out"
        }, "+=0.1")
        .to(allLetters, {
          scale: 1,
          duration: 0.3,
          ease: "elastic.out(1, 0.3)"
        }, "+=0.1")
        .to([degenD, duelD], {
          textShadow: "0 0 20px rgba(255,255,255,0.8)",
          duration: 0.3,
          yoyo: true,
          repeat: 1
        }, "-=0.2");
    }

    // Create ongoing animation effects after intro is completed
    if (isEpic || isExtreme) {
      // Subtle breathing effect for DEGEN letters (purple glow)
      loopTl.current
        // DEGEN letters pulse purple
        .to(degenLetters, {
          textShadow: "0 0 10px rgba(157, 78, 221, 0.7)",
          scale: 1.02,
          duration: 2,
          stagger: {
            each: 0.1,
            from: "start",
            repeat: 1,
            yoyo: true
          },
          ease: "sine.inOut"
        })
        // DUEL letters pulse cyan
        .to(duelLetters, {
          textShadow: "0 0 10px rgba(0, 225, 255, 0.7)",
          scale: 1.02,
          duration: 2,
          stagger: {
            each: 0.1,
            from: "end", 
            repeat: 1,
            yoyo: true
          },
          ease: "sine.inOut"
        }, "-=1"); // Overlap with previous animation
      
      // Add glitch effect for extreme mode
      if (isExtreme) {
        // Random "glitch" effect - occasional letter flicker
        const applyGlitch = () => {
          // Pick a random letter
          const randomLetter = allLetters[Math.floor(Math.random() * allLetters.length)];
          
          // Apply quick glitch animation
          gsap.to(randomLetter, {
            opacity: 0.3,
            x: (Math.random() - 0.5) * 10,
            duration: 0.05,
            onComplete: () => {
              gsap.to(randomLetter, {
                opacity: 1,
                x: 0,
                duration: 0.05
              });
            }
          });
          
          // Schedule next glitch
          setTimeout(applyGlitch, Math.random() * 5000 + 2000);
        };
        
        // Start the glitch effect after the main animation completes
        setTimeout(applyGlitch, 3000);
      }
    }

    // Play the intro animation
    tl.current.play(0);

    return () => {
      // Clean up
      if (tl.current) {
        tl.current.kill();
      }
      if (loopTl.current) {
        loopTl.current.kill();
      }
    };
  }, [isEpic, isExtreme, mode]); // Re-run when animation mode changes

  return (
    <div 
      className="relative z-10 flex justify-center items-center"
    >
      <div 
        className="flex justify-center items-center min-h-[300px] perspective-1000"
        style={{ perspective: '1000px' }}
      >
        <div
          ref={logoRef}
          className="logo-container"
          style={{
            transformStyle: 'preserve-3d',
            WebkitFontSmoothing: 'antialiased',
            transform: `scale(${scale})`,
            transition: 'transform 0.3s ease-out'
          }}
        >
          {/* DEGEN DUEL Logo */}
          <div className="flex items-start gap-0">
            {/* First D - Russo One */}
            <span
              className="degen-d"
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: '144px',
                color: '#9D4EDD',
                marginRight: '-0.05em',
                lineHeight: 1
              }}
            >
              D
            </span>

            {/* EGEN - Orbitron Black - Individual spans */}
            <div className="flex" style={{ transform: 'translateY(0.15em)', lineHeight: 1 }}>
              <span className="degen-e degen-letters" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '96px', letterSpacing: '-0.05em', color: '#9D4EDD' }}>E</span>
              <span className="degen-g degen-letters" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '96px', letterSpacing: '-0.05em', color: '#9D4EDD' }}>G</span>
              <span className="degen-e2 degen-letters" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '96px', letterSpacing: '-0.05em', color: '#9D4EDD' }}>E</span>
              <span className="degen-n degen-letters" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '96px', letterSpacing: '-0.05em', color: '#9D4EDD' }}>N</span>
            </div>

            {/* Space between */}
            <span style={{ width: '0.15em' }}></span>

            {/* Second D - Russo One */}
            <span
              className="duel-d"
              style={{
                fontFamily: "'Russo One', sans-serif",
                fontSize: '144px',
                color: '#FFFFFF', 
                margin: '0 -0.05em',
                lineHeight: 1
              }}
            >
              D
            </span>

            {/* UEL - Orbitron Black - Individual spans */}
            <div className="flex" style={{ transform: 'translateY(0.15em)', lineHeight: 1 }}>
              <span className="duel-u duel-letters" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '96px', letterSpacing: '-0.05em', color: '#FFFFFF' }}>U</span>
              <span className="duel-e duel-letters" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '96px', letterSpacing: '-0.05em', color: '#FFFFFF' }}>E</span>
              <span className="duel-l duel-letters" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '96px', letterSpacing: '-0.05em', color: '#FFFFFF' }}>L</span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional: Add an electric arc effect connecting DEGEN and DUEL for extreme mode */}
      {isExtreme && animationComplete && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[-1] w-full h-full">
          <div className="animate-pulse absolute top-[45%] left-[48%] w-[4%] h-[10%] bg-gradient-to-r from-[#9D4EDD] to-[#00e1ff] blur-md opacity-70" />
        </div>
      )}
    </div>
  );
};

export default EnhancedIntroLogo;