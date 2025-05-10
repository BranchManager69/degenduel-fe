import React from 'react';

const MiniLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-0">
      {/* First D - Russo One - Purple */}
      <span
        style={{
          fontFamily: "'Russo One', sans-serif",
          fontSize: '24px', // Adjusted size
          color: '#9D4EDD',
          marginRight: '-0.05em',
          lineHeight: 1
        }}
      >
        D
      </span>

      {/* DUEL - Orbitron Black - White */}
      <div className="flex" style={{ transform: 'translateY(0.05em)', lineHeight: 1 }}> {/* Adjusted vertical alignment */}
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '16px', letterSpacing: '-0.05em', color: '#FFFFFF' }}>D</span> {/* Changed E to D */}
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '16px', letterSpacing: '-0.05em', color: '#FFFFFF' }}>U</span>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '16px', letterSpacing: '-0.05em', color: '#FFFFFF' }}>E</span>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 900, fontSize: '16px', letterSpacing: '-0.05em', color: '#FFFFFF' }}>L</span>
      </div>
    </div>
  );
};

export default MiniLogo; 