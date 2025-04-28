import React from "react";
import { BackgroundEffects } from "../../components/animated-background/BackgroundEffects";
import LiquiditySimulator from "../../components/LiquiditySimulator";

/**
 * Liquidity Simulator Page
 * 
 * This page provides access to the token liquidation simulation tool.
 * It is part of the super admin section and protected by appropriate access controls.
 */
const LiquiditySimulatorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-100 relative">
      <BackgroundEffects />
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <LiquiditySimulator />
      </div>
    </div>
  );
};

export default LiquiditySimulatorPage;