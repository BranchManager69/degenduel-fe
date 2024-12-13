import React from 'react';

export const MovingBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-dark-100">
        <div className="absolute inset-0 opacity-50">
          {/* Animated shapes */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-radial from-brand-500/20 to-transparent rounded-full mix-blend-overlay animate-blob" />
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-radial from-brand-400/20 to-transparent rounded-full mix-blend-overlay animate-blob animation-delay-2000" />
          <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-radial from-brand-600/20 to-transparent rounded-full mix-blend-overlay animate-blob animation-delay-4000" />
          
          {/* Additional floating elements */}
          <div className="absolute top-1/3 left-1/3 w-24 h-24 border border-brand-400/20 rounded-lg rotate-12 animate-float" />
          <div className="absolute top-2/3 right-1/4 w-32 h-32 border border-brand-500/20 rounded-full animate-float animation-delay-2000" />
          <div className="absolute bottom-1/4 right-1/3 w-20 h-20 border border-brand-600/20 rounded-lg -rotate-12 animate-float animation-delay-4000" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f10_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f10_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>
    </div>
  );
};