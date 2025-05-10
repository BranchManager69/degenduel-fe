import React from 'react';

const NanoLogo: React.FC = () => {
  return (
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
  );
};

export default NanoLogo; 