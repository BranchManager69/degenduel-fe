// src/pages/superadmin/LiquiditySimulatorPage.tsx

/**
 * @author @BranchManager69 
 * @since 2025-04-28
 * @updated 2025-04-28
 * 
 * This page provides access to the token liquidation simulation tool.
 * It is part of the super admin section and protected by appropriate access controls.
 * 
 */

import React from "react";
import LiquiditySimulator from "../../components/LiquiditySimulator";

/**
 * Liquidity Simulator Page
 * 
 */
const LiquiditySimulatorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-100 relative">
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <LiquiditySimulator />
      </div>
    </div>
  );
};

export default LiquiditySimulatorPage;