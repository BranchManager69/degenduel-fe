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
    // Prevent multiple initializations
    if (animationComplete) return;

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
      x: isExtreme ? -200 : (isEpic ? -100 : -20),
      rotationY: isExtreme ? -120 : (isEpic ? -90 : -45),
      scale: isExtreme ? 0.8 : 1,
      transformOrigin: "left center"
    });

    gsap.set(duelLetters, {
      opacity: 0,
      x: isExtreme ? 200 : (isEpic ? 100 : 20),
      rotationY: isExtreme ? 120 : (isEpic ? 90 : 45),
      scale: isExtreme ? 0.8 : 1,
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
        scale: 1,
        duration: isExtreme ? 0.5 : (isEpic ? 0.7 : 0.5), 
        ease: isExtreme ? "power3.out" : "power2.out" 
      })
      .to(degenE, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0,
        scale: 1, 
        duration: isExtreme ? 0.4 : (isEpic ? 0.6 : 0.4), 
        ease: isExtreme ? "power3.out" : "back.out(1.2)" 
      }, isExtreme ? "-=0.4" : "-=0.5")
      .to(degenG, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0,
        scale: 1, 
        duration: isExtreme ? 0.4 : (isEpic ? 0.6 : 0.4), 
        ease: isExtreme ? "power3.out" : "back.out(1.2)" 
      }, isExtreme ? "-=0.35" : "-=0.45")
      .to(degenE2, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0,
        scale: 1, 
        duration: isExtreme ? 0.4 : (isEpic ? 0.6 : 0.4), 
        ease: isExtreme ? "power3.out" : "back.out(1.2)" 
      }, isExtreme ? "-=0.3" : "-=0.4")
      .to(degenN, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0,
        scale: 1, 
        duration: isExtreme ? 0.4 : (isEpic ? 0.6 : 0.4), 
        ease: isExtreme ? "power3.out" : "back.out(1.2)" 
      }, isExtreme ? "-=0.25" : "-=0.35")
      
      // Brief pause before DUEL part (shorter in extreme mode)
      .addLabel("midPoint", isExtreme ? "+=0.05" : "+=0.1")
      
      // DUEL Part - Flying in from right with rotation (more aggressive timing in extreme)
      .to(duelD, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0,
        scale: 1, 
        duration: isExtreme ? 0.5 : (isEpic ? 0.7 : 0.5), 
        ease: isExtreme ? "power3.out" : "power2.out" 
      }, "midPoint")
      .to(duelU, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0,
        scale: 1, 
        duration: isExtreme ? 0.4 : (isEpic ? 0.6 : 0.4), 
        ease: isExtreme ? "power3.out" : "back.out(1.2)" 
      }, isExtreme ? "midPoint+=0.15" : "midPoint+=0.2")
      .to(duelE, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0,
        scale: 1, 
        duration: isExtreme ? 0.4 : (isEpic ? 0.6 : 0.4), 
        ease: isExtreme ? "power3.out" : "back.out(1.2)" 
      }, isExtreme ? "midPoint+=0.2" : "midPoint+=0.25")
      .to(duelL, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0,
        scale: 1, 
        duration: isExtreme ? 0.4 : (isEpic ? 0.6 : 0.4), 
        ease: isExtreme ? "power3.out" : "back.out(1.2)" 
      }, isExtreme ? "midPoint+=0.25" : "midPoint+=0.3");
      
    // Add final impact for extreme mode - more cinematic
    if (isExtreme) {
      tl.current
        // Dramatic pause with green DEGEN and red DUEL
        .to(degenLetters, {
          textShadow: "0 0 30px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.4)",
          duration: 0.4,
          ease: "power2.inOut"
        }, "+=0.1")
        .to(duelLetters, {
          textShadow: "0 0 30px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.4)",
          duration: 0.4,
          ease: "power2.inOut"
        }, "-=0.4")
        // Subtle scale pulse (more refined)
        .to(allLetters, {
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out"
        }, "-=0.2")
        .to(allLetters, {
          scale: 1,
          duration: 0.5,
          ease: "power2.inOut"
        }, "+=0.1")
        // Final impact - back to original colors
        .to(allLetters, {
          textShadow: "0 0 20px rgba(0,0,0,0.8), 0 0 40px rgba(157, 78, 221, 0.6), 0 0 60px rgba(0, 225, 255, 0.3)",
          duration: 0.6,
          ease: "power2.inOut"
        }, "-=0.4");
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
      
      // Add sophisticated energy effect for extreme mode
      if (isExtreme) {
        // Enhanced pulsing with energy waves
        loopTl.current
          .to(degenLetters, {
            textShadow: "0 0 15px rgba(157, 78, 221, 0.9), 0 0 30px rgba(157, 78, 221, 0.6), 0 0 45px rgba(157, 78, 221, 0.3)",
            duration: 1.5,
            ease: "sine.inOut",
            stagger: {
              each: 0.05,
              from: "start"
            }
          }, 2)
          .to(duelLetters, {
            textShadow: "0 0 15px rgba(0, 225, 255, 0.9), 0 0 30px rgba(0, 225, 255, 0.6), 0 0 45px rgba(0, 225, 255, 0.3)",
            duration: 1.5,
            ease: "sine.inOut",
            stagger: {
              each: 0.05,
              from: "end"
            }
          }, "-=0.8")
          // Subtle letter rotation for dynamic feel
          .to([degenD, duelD], {
            rotationZ: 1,
            duration: 3,
            ease: "sine.inOut",
            yoyo: true,
            repeat: 1
          }, "-=2");
      }
    }

    // Set up the loop animation immediately if we're starting in a completed state
    if (mode === 'standard') {
      // For standard mode, skip the intro animation and just show the completed state
      gsap.set(allLetters, { opacity: 1, x: 0, rotationY: 0 });
      setAnimationComplete(true);
      if (loopTl.current && (isEpic || isExtreme)) loopTl.current.play(0);
    } else {
      // Play the intro animation for epic/extreme modes
      tl.current.play(0);
    }

    return () => {
      // Clean up
      if (tl.current) {
        tl.current.kill();
      }
      if (loopTl.current) {
        loopTl.current.kill();
      }
    };
  }, [isEpic, isExtreme, mode, animationComplete]); // Re-run when animation mode changes or completion state changes

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

      {/* Clean energy field for extreme mode */}
      {isExtreme && animationComplete && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Subtle energy waves */}
          <div className="absolute top-[40%] left-[20%] w-16 h-0.5 bg-gradient-to-r from-transparent via-green-400/30 to-transparent rotate-12 animate-pulse" style={{ animationDelay: '0s', animationDuration: '3s' }} />
          <div className="absolute top-[60%] right-[20%] w-16 h-0.5 bg-gradient-to-l from-transparent via-red-400/30 to-transparent -rotate-12 animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '3.5s' }} />
          
          {/* Corner accent glows */}
          <div className="absolute top-[10%] left-[5%] w-8 h-8 bg-green-500/10 rounded-full blur-md animate-pulse" style={{ animationDelay: '0s', animationDuration: '4s' }} />
          <div className="absolute top-[10%] right-[5%] w-8 h-8 bg-red-500/10 rounded-full blur-md animate-pulse" style={{ animationDelay: '2s', animationDuration: '4.5s' }} />
          <div className="absolute bottom-[10%] left-[5%] w-6 h-6 bg-purple-500/10 rounded-full blur-md animate-pulse" style={{ animationDelay: '1s', animationDuration: '3.8s' }} />
          <div className="absolute bottom-[10%] right-[5%] w-6 h-6 bg-cyan-500/10 rounded-full blur-md animate-pulse" style={{ animationDelay: '3s', animationDuration: '4.2s' }} />
        </div>
      )}
    </div>
  );
};

export default EnhancedIntroLogo;