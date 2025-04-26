// src/pages/authenticated/ReferralPage.tsx

/**
 * Invite & Earn Dashboard page showing user's affiliate analytics and performance
 * 
 * @author @BranchManager69
 * @since 2025-04-02
 * @updated 2025-04-04
 */

import React from "react";
import { AffiliateDashboard } from "../../components/affiliate-dashboard/AffiliateDashboard";
import { BackgroundEffects } from "../../components/animated-background/BackgroundEffects";

// This component should be renamed to AffiliatePage.tsx in a future update
export const ReferralPage: React.FC = () => {
  // Set page title
  React.useEffect(() => {
    document.title = "Invite & Earn - DegenDuel";
    return () => {
      document.title = "DegenDuel";
    };
  }, []);
  return (
    <div className="flex flex-col min-h-screen">
      <BackgroundEffects />

      {/* Content Section */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          {/* Affiliate Dashboard (renamed from ReferralDashboard) */}
          <AffiliateDashboard />
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;