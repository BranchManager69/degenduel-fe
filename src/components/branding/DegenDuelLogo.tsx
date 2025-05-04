import { useEffect } from 'react';

type LogoVariant = 'primary' | 'blackDuel' | 'whiteDuel';

const DegenDuelLogo = ({
  variant = 'primary'
}: { variant?: LogoVariant }) => {
  useEffect(() => {
    const link1 = document.createElement('link');
    link1.href = 'https://fonts.googleapis.com/css2?family=Russo+One&display=swap';
    link1.rel = 'stylesheet';
    const link2 = document.createElement('link');
    link2.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap';
    link2.rel = 'stylesheet';
    document.head.appendChild(link1);
    document.head.appendChild(link2);
    return () => {
      document.head.removeChild(link1);
      document.head.removeChild(link2);
    };
  }, []);
  const colors = {
    primary: {
      degen: '#9D4EDD',
      duel: '#FFFFFF'
    },
    blackDuel: {
      degen: '#9D4EDD',
      duel: '#000000'
    },
    whiteDuel: {
      degen: '#9D4EDD', 
      duel: '#FFFFFF'
    }
  } as const;
  const currentColors = colors[variant];
  return <div className="relative">
      {/* Logo Text Container */}
      <div className="flex items-start gap-0">
        {/* First D - Russo One */}
        <span style={{
        fontFamily: "'Russo One', sans-serif",
        fontSize: '144px',
        color: currentColors.degen,
        marginRight: '-0.05em',
        WebkitFontSmoothing: 'antialiased',
        lineHeight: 1
      }}>
          D
        </span>
        {/* EGEN - Orbitron Black */}
        <span style={{
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: 900,
        fontSize: '96px',
        letterSpacing: '-0.05em',
        color: currentColors.degen,
        WebkitFontSmoothing: 'antialiased',
        transform: 'translateY(0.15em)',
        lineHeight: 1
      }}>
          EGEN
        </span>
        {/* Space between DEGEN and DUEL - reduced */}
        <span style={{
        width: '0.15em'
      }}></span>
        {/* Second D - Russo One */}
        <span style={{
        fontFamily: "'Russo One', sans-serif",
        fontSize: '144px',
        color: currentColors.duel,
        margin: '0 -0.05em',
        WebkitFontSmoothing: 'antialiased',
        lineHeight: 1
      }}>
          D
        </span>
        {/* UEL - Orbitron Black */}
        <span style={{
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: 900,
        fontSize: '96px',
        letterSpacing: '-0.05em',
        color: currentColors.duel,
        WebkitFontSmoothing: 'antialiased',
        transform: 'translateY(0.15em)',
        lineHeight: 1
      }}>
          UEL
        </span>
      </div>
    </div>;
};
export default DegenDuelLogo;