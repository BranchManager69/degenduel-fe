import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

const DoubleDLogo = ({ mode = 'standard' }: { mode?: 'standard' | 'epic' | 'extreme' }) => {
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
    const firstD = logoRef.current.querySelector('.first-d');
    const secondD = logoRef.current.querySelector('.second-d');
    const allLetters = [firstD, secondD];

    // Set initial state - both D's invisible and positioned for dramatic entry
    gsap.set(firstD, {
      opacity: 0,
      x: isExtreme ? -300 : (isEpic ? -150 : -50),
      rotationY: isExtreme ? -180 : (isEpic ? -90 : -45),
      scale: isExtreme ? 0.5 : 0.8,
      transformOrigin: "center center"
    });

    gsap.set(secondD, {
      opacity: 0,
      x: isExtreme ? 300 : (isEpic ? 150 : 50),
      rotationY: isExtreme ? 180 : (isEpic ? 90 : 45),
      scale: isExtreme ? 0.5 : 0.8,
      transformOrigin: "center center"
    });

    // Build the intro animation
    tl.current
      // Both D's fly in simultaneously
      .to(firstD, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0,
        scale: 1,
        duration: isExtreme ? 0.8 : (isEpic ? 1.0 : 0.6), 
        ease: isExtreme ? "power4.out" : "power2.out" 
      })
      .to(secondD, { 
        opacity: 1, 
        x: 0, 
        rotationY: 0,
        scale: 1,
        duration: isExtreme ? 0.8 : (isEpic ? 1.0 : 0.6), 
        ease: isExtreme ? "power4.out" : "power2.out" 
      }, "-=100%"); // Start at exactly the same time
      
    // Add final impact for extreme mode
    if (isExtreme) {
      tl.current
        // Dramatic collision effect
        .to(allLetters, {
          scale: 1.15,
          duration: 0.2,
          ease: "power2.out"
        }, "+=0.1")
        .to(firstD, {
          textShadow: "0 0 40px rgba(157, 78, 221, 0.9), 0 0 80px rgba(157, 78, 221, 0.5)",
          duration: 0.3,
          ease: "power2.out"
        }, "-=0.1")
        .to(secondD, {
          textShadow: "0 0 40px rgba(0, 225, 255, 0.9), 0 0 80px rgba(0, 225, 255, 0.5)",
          duration: 0.3,
          ease: "power2.out"
        }, "-=0.3")
        .to(allLetters, {
          scale: 1,
          duration: 0.4,
          ease: "elastic.out(1, 0.5)"
        })
        // Final glow
        .to(allLetters, {
          textShadow: "0 0 30px rgba(157, 78, 221, 0.6), 0 0 60px rgba(0, 225, 255, 0.3)",
          duration: 0.6,
          ease: "power2.inOut"
        }, "-=0.2");
    }

    // Create ongoing animation effects after intro is completed
    if (isEpic || isExtreme) {
      // Alternating pulse effect
      loopTl.current
        .to(firstD, {
          textShadow: "0 0 20px rgba(157, 78, 221, 0.8)",
          scale: 1.05,
          duration: 2,
          ease: "sine.inOut"
        })
        .to(firstD, {
          textShadow: "0 0 10px rgba(157, 78, 221, 0.4)",
          scale: 1,
          duration: 2,
          ease: "sine.inOut"
        })
        .to(secondD, {
          textShadow: "0 0 20px rgba(0, 225, 255, 0.8)",
          scale: 1.05,
          duration: 2,
          ease: "sine.inOut"
        }, "-=3")
        .to(secondD, {
          textShadow: "0 0 10px rgba(0, 225, 255, 0.4)",
          scale: 1,
          duration: 2,
          ease: "sine.inOut"
        }, "-=1");
      
      // Add rotation effect for extreme mode
      if (isExtreme) {
        loopTl.current
          .to([firstD, secondD], {
            rotationZ: 2,
            duration: 4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: 1
          }, 0)
          .to([firstD, secondD], {
            rotationZ: -2,
            duration: 4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: 1
          }, 4);
      }
    }

    // Set up the loop animation immediately if we're starting in a completed state
    if (mode === 'standard') {
      // For standard mode, skip the intro animation and just show the completed state
      gsap.set(allLetters, { opacity: 1, x: 0, rotationY: 0, scale: 1 });
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
  }, [isEpic, isExtreme, mode, animationComplete]);

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
          {/* Double D Logo */}
          <div className="flex items-center">
            {/* First D - Purple */}
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
                textShadow: '0 0 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 0, 0, 0.5)'
              }}
            >
              D
            </span>

            {/* Second D - White */}
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
                textShadow: '0 0 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 0, 0, 0.5)'
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

export default DoubleDLogo;