import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';

const IntroLogo = () => {
  const logoRef = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [scale, setScale] = useState(1);

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
    tl.current = gsap.timeline({ paused: true });

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

    const allLetters = [degenD, degenE, degenG, degenE2, degenN, duelD, duelU, duelE, duelL];

    // Set initial state - all parts invisible
    gsap.set(allLetters, {
      opacity: 0,
      y: 20,
      // rotationX: -45, // Optional: add a slight 3D rotation
      // transformOrigin: "center bottom"
    });

    // Build the intro animation
    tl.current
      .to(degenD, { opacity: 1, y: 0, /*rotationX:0,*/ duration: 0.5, ease: "power2.out" })
      .to(degenE, { opacity: 1, y: 0, /*rotationX:0,*/ duration: 0.4, ease: "power2.out" }, "-=0.35") // Stagger start
      .to(degenG, { opacity: 1, y: 0, /*rotationX:0,*/ duration: 0.4, ease: "power2.out" }, "-=0.3")
      .to(degenE2, { opacity: 1, y: 0, /*rotationX:0,*/ duration: 0.4, ease: "power2.out" }, "-=0.3")
      .to(degenN, { opacity: 1, y: 0, /*rotationX:0,*/ duration: 0.4, ease: "power2.out" }, "-=0.3")
      
      .to(duelD, { opacity: 1, y: 0, /*rotationX:0,*/ duration: 0.5, ease: "power2.out" }, "-=0.2") // Slight overlap with DegenN
      .to(duelU, { opacity: 1, y: 0, /*rotationX:0,*/ duration: 0.4, ease: "power2.out" }, "-=0.35")
      .to(duelE, { opacity: 1, y: 0, /*rotationX:0,*/ duration: 0.4, ease: "power2.out" }, "-=0.3")
      .to(duelL, { opacity: 1, y: 0, /*rotationX:0,*/ duration: 0.4, ease: "power2.out" }, "-=0.3");

    // Play the animation
    if (tl.current) {
      tl.current.play(0);
    }

    return () => {
      // Clean up
      if (tl.current) {
        tl.current.kill();
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
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
        {/* DEGEN Part */}
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

          {/* EGEN - Orbitron Black - Now individual spans */}
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

          {/* UEL - Orbitron Black - Now individual spans */}
          <div className="flex" style={{ transform: 'translateY(0.15em)', lineHeight: 1 }}>
            <span className="duel-u duel-letters" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '96px', letterSpacing: '-0.05em', color: '#FFFFFF' }}>U</span>
            <span className="duel-e duel-letters" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '96px', letterSpacing: '-0.05em', color: '#FFFFFF' }}>E</span>
            <span className="duel-l duel-letters" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '96px', letterSpacing: '-0.05em', color: '#FFFFFF' }}>L</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntroLogo; 