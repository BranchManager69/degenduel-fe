import React from "react";

export const MovingBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-dark-100">
        <div className="absolute inset-0 opacity-50">
          {/* Primary animated blobs */}
          <div className="absolute top-0 -left-4 w-[600px] h-[600px] bg-gradient-radial from-brand-500/40 via-brand-500/20 to-transparent rounded-full mix-blend-soft-light animate-blob blur-3xl" />
          <div className="absolute top-0 -right-4 w-[600px] h-[600px] bg-gradient-radial from-cyber-400/40 via-cyber-400/20 to-transparent rounded-full mix-blend-soft-light animate-blob [animation-delay:2000ms] blur-3xl" />
          <div className="absolute -bottom-8 left-20 w-[600px] h-[600px] bg-gradient-radial from-neon-400/40 via-neon-400/20 to-transparent rounded-full mix-blend-soft-light animate-blob [animation-delay:4000ms] blur-3xl" />

          {/* Secondary smaller blobs */}
          <div className="absolute top-1/4 right-1/3 w-[300px] h-[300px] bg-gradient-radial from-brand-400/30 via-brand-400/10 to-transparent rounded-full mix-blend-soft-light animate-blob [animation-delay:1000ms] blur-2xl" />
          <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] bg-gradient-radial from-cyber-500/30 via-cyber-500/10 to-transparent rounded-full mix-blend-soft-light animate-blob [animation-delay:3000ms] blur-2xl" />

          {/* Floating elements with glow */}
          <div className="absolute top-1/4 left-1/4 w-24 h-24 border border-brand-400/30 rounded-lg rotate-12 animate-float shadow-[0_0_15px_0_rgba(127,0,255,0.3)] backdrop-blur-sm" />
          <div className="absolute top-3/4 right-1/4 w-32 h-32 border border-cyber-400/30 rounded-full animate-float [animation-delay:2000ms] shadow-[0_0_15px_0_rgba(0,225,255,0.3)] backdrop-blur-sm" />
          <div className="absolute bottom-1/4 right-1/3 w-20 h-20 border border-neon-400/30 rounded-lg -rotate-12 animate-float [animation-delay:4000ms] shadow-[0_0_15px_0_rgba(0,175,255,0.3)] backdrop-blur-sm" />
        </div>

        {/* Grid overlay with fade effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>
    </div>
  );
};
