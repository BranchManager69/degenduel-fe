import React from "react";

import { BackgroundEffects } from "../../components/animated-background/BackgroundEffects";
import { ReferralDashboard } from "../../components/referrals-dashboard/ReferralDashboard";

export const ReferralPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <BackgroundEffects />

      {/* Content Section */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <ReferralDashboard />
        </div>
      </div>
    </div>
  );
};
