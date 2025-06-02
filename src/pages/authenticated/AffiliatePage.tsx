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
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { setupReferralOGMeta, resetToDefaultMeta } from "../../utils/ogImageUtils";

// This component should be renamed to AffiliatePage.tsx in a future update
export const ReferralPage: React.FC = () => {
  const { user } = useMigratedAuth();

  // Set page title and OG meta tags
  React.useEffect(() => {
    document.title = "Invite & Earn - DegenDuel";
    
    // Setup referral OG meta if user has wallet
    if (user?.wallet_address) {
      setupReferralOGMeta(user.wallet_address, user.nickname);
    }
    
    return () => {
      resetToDefaultMeta();
    };
  }, [user?.wallet_address, user?.nickname]);
  return (
    <div className="flex flex-col min-h-screen">

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