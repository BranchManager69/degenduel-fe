import React from 'react';

interface NanoLogoProps {
  showBeta?: boolean;
}

const NanoLogo: React.FC<NanoLogoProps> = ({ showBeta = false }) => {
  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="flex items-center gap-0">
        {/* First D - Russo One - Purple */}
        <span
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: '18px', // Adjusted size for nano
            color: '#9D4EDD',
            lineHeight: 1
          }}
        >
          D
        </span>

        {/* Second D - Russo One - White */}
        <span
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: '18px', // Adjusted size for nano
            color: '#FFFFFF',
            lineHeight: 1
          }}
        >
          D
        </span>
      </div>
      
      {/* BETA text - optional, underneath */}
      {showBeta && (
        <span
          style={{
            fontFamily: "'Russo One', sans-serif",
            fontSize: '5px',
            letterSpacing: '0.1em',
            color: '#9D4EDD',
            opacity: 0.6,
            position: 'absolute',
            bottom: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap'
          }}
        >
          BETA
        </span>
      )}
    </div>
  );
};

export default NanoLogo; 