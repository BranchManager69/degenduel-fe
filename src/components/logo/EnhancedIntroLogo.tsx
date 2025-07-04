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
        // Dramatic pause with purple DEGEN and cyan DUEL
        .to(degenLetters, {
          textShadow: "0 0 30px rgba(157, 78, 221, 0.8), 0 0 60px rgba(157, 78, 221, 0.4)",
          duration: 0.4,
          ease: "power2.inOut"
        }, "+=0.1")
        .to(duelLetters, {
          textShadow: "0 0 30px rgba(0, 225, 255, 0.8), 0 0 60px rgba(0, 225, 255, 0.4)",
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
      className="relative flex justify-center items-center"
    >
      {/* Trading atmosphere for extreme mode - BEHIND the logo */}
      {isExtreme && animationComplete && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* One dynamic live-building candle chart */}
          {(() => {
            const candleDelay = 0.05; // Fast candles
            let currentY = 0;
            const maxCandles = 120;
            let momentum = 0; // For more realistic movement
            
            return (
              <div
                className="absolute flex items-end"
                style={{
                  bottom: 'calc(50% - 40px)',
                  left: 'calc(-5% + 150px)',
                  opacity: 0.55
                }}
              >
                {Array.from({ length: maxCandles }).map((_, i) => {
                  // Create realistic trends with momentum
                  const trendStrength = Math.random();
                  if (trendStrength > 0.85) {
                    // Strong trend change
                    momentum = (Math.random() - 0.5) * 40;
                  }
                  
                  const isGreen = momentum > 0 ? Math.random() > 0.3 : Math.random() > 0.7;
                  
                  // Varied candle sizes - sometimes tiny, sometimes huge
                  const sizeType = Math.random();
                  let bodyHeight, wickTop, wickBottom;
                  
                  if (sizeType < 0.1) {
                    // Doji - tiny body
                    bodyHeight = Math.random() * 3 + 1;
                    wickTop = Math.random() * 15 + 5;
                    wickBottom = Math.random() * 15 + 5;
                  } else if (sizeType > 0.9) {
                    // Massive candle
                    bodyHeight = Math.random() * 40 + 35;
                    wickTop = Math.random() * 5 + 1;
                    wickBottom = Math.random() * 5 + 1;
                  } else {
                    // Normal candle
                    bodyHeight = Math.random() * 20 + 10;
                    wickTop = Math.random() * 10 + 3;
                    wickBottom = Math.random() * 10 + 3;
                  }
                  
                  // Update momentum with decay
                  momentum = momentum * 0.95 + (isGreen ? 1 : -1) * (Math.random() * 8 + 2);
                  
                  // Big moves on volume candles
                  if (sizeType > 0.9) {
                    currentY += isGreen ? -(bodyHeight * 0.8) : (bodyHeight * 0.8);
                  } else {
                    currentY += momentum;
                  }
                  
                  // Consolidation periods
                  if (Math.random() < 0.15) {
                    momentum = momentum * 0.3; // Slow down
                  }
                  
                  return (
                    <div 
                      key={i} 
                      className="relative flex flex-col items-center"
                      style={{ 
                        transform: `translateY(${currentY}px)`,
                        marginLeft: i === 0 ? '0' : '3px',
                        opacity: 0,
                        animation: `appearCandle 0.05s ease-out forwards, ${isGreen ? 'floatUp' : 'floatDown'} ${2 + Math.random() * 2}s ease-in-out infinite`,
                        animationDelay: `${i * candleDelay}s, ${i * candleDelay + 0.05}s`
                      }}
                    >
                      {/* Top wick */}
                      <div
                        style={{
                          width: '1px',
                          height: `${wickTop}px`,
                          backgroundColor: isGreen ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'
                        }}
                      />
                      {/* Candle body */}
                      <div
                        style={{
                          width: '6px',
                          height: `${bodyHeight}px`,
                          backgroundColor: isGreen ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                          boxShadow: isGreen 
                            ? '0 0 6px rgba(34, 197, 94, 0.4)' 
                            : '0 0 6px rgba(239, 68, 68, 0.4)'
                        }}
                      />
                      {/* Bottom wick */}
                      <div
                        style={{
                          width: '1px',
                          height: `${wickBottom}px`,
                          backgroundColor: isGreen ? 'rgba(34, 197, 94, 0.9)' : 'rgba(239, 68, 68, 0.9)'
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })()}
          
          {/* Subtle moving price lines */}
          <div 
            className="absolute w-full h-px"
            style={{
              bottom: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(157, 78, 221, 0.2), transparent)',
              animation: 'pulse 6s ease-in-out infinite'
            }}
          />
          <div 
            className="absolute w-full h-px"
            style={{
              bottom: '60%',
              background: 'linear-gradient(90deg, transparent, rgba(0, 225, 255, 0.2), transparent)',
              animation: 'pulse 8s ease-in-out infinite',
              animationDelay: '2s'
            }}
          />
          
          {/* Add CSS for animations */}
          <style>{`
            @keyframes appearCandle {
              from {
                opacity: 0;
                transform: translateY(10px) scale(0.8);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            @keyframes floatUp {
              0%, 100% { 
                transform: translateY(0) scale(1);
                filter: brightness(1);
              }
              50% { 
                transform: translateY(-8px) scale(1.05);
                filter: brightness(1.2);
              }
            }
            @keyframes floatDown {
              0%, 100% { 
                transform: translateY(0) scale(1);
                filter: brightness(1);
              }
              50% { 
                transform: translateY(8px) scale(0.95);
                filter: brightness(0.8);
              }
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.3; transform: scaleX(0.5); }
              50% { opacity: 0.7; transform: scaleX(1); }
            }
          `}</style>
        </div>
      )}

      <div 
        className="flex justify-center items-center min-h-[300px] perspective-1000 relative z-10"
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
                lineHeight: 1,
                position: 'relative',
                zIndex: 10
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
                lineHeight: 1,
                position: 'relative',
                zIndex: 10
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
    </div>
  );
};

export default EnhancedIntroLogo;