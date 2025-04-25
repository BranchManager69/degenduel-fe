# Hooks Migration Reference Guide

## Referral System Refactoring

The original `useReferral.ts` hook has been refactored and split into two distinct systems to better separate concerns:

1. **Invite System** (`useInviteSystem.ts`)
   - Handles invite code processing
   - Manages the welcome flow for new users
   - Tracks invite code conversions
   - Stores the invite code in local storage
   - Shows the welcome modal when a user arrives via an invite link

2. **Affiliate System** (`useAffiliateSystem.ts`)
   - Tracks analytics for invite links
   - Provides the dashboard data
   - Manages tracking of UTM parameters
   - Handles affiliate rewards and statistics

## Migration Status

| Component | Old Name | New Name | Status |
|-----------|----------|----------|--------|
| Hooks | `useReferral.ts` | `useInviteSystem.ts` + `useAffiliateSystem.ts` | ✅ Complete |
| Welcome Modal | `ReferralWelcomeModal.tsx` | `InviteWelcomeModal.tsx` | ✅ Complete |
| Dashboard | `ReferralDashboard.tsx` | `AffiliateDashboard.tsx` | ✅ Complete |
| Page | `ReferralPage.tsx` | Should be renamed to `AffiliatePage.tsx` | ⚠️ Pending |
| Directory | `/components/referrals-dashboard/` | Should be renamed to `/components/affiliate-dashboard/` | ⚠️ Pending |
| URL Path | `/referrals` | Should be updated to `/invite` or `/affiliate` | ⚠️ Pending |
| Input Component | `ReferralCodeInput.tsx` | Should be renamed to `InviteCodeInput.tsx` | ⚠️ Pending |

## API Endpoints

The backend API endpoints continue to use the `referrals` prefix for backward compatibility. The frontend code maps these consistently:

| Endpoint | Purpose | Used By |
|----------|---------|---------|
| `/api/referrals/details` | Get information about an invite code | Invite System |
| `/api/referrals/signup` | Track a new user signup with an invite code | Invite System |
| `/api/referrals/code` | Get the current user's invite code | Affiliate System |
| `/api/referrals/stats` | Get the current user's invite statistics | Affiliate System |
| `/api/referrals/analytics` | Get detailed analytics for the user's invite links | Affiliate System |
| `/api/referrals/leaderboard/stats` | Get affiliate leaderboard statistics | Affiliate System |
| `/api/referrals/leaderboard/rankings` | Get affiliate leaderboard rankings | Affiliate System |

## Integration Points

The two systems communicate through well-defined interfaces:

1. `InviteSystem` provides:
   - `inviteCode`: The user's own invite code
   - `inviterProfile`: Information about who invited the current user
   - `trackSignup`: Function to record when a user signs up through an invite

2. `AffiliateSystem` provides:
   - `analytics`: Detailed statistics about the user's invite performance
   - `refreshAnalytics`: Function to refresh analytics data
   - `trackConversion`: Function to record a conversion event

## Next Steps

1. Complete the renaming of components and directories for consistency
2. Update the URL route from `/referrals` to `/invite` or `/affiliate`
3. Update any remaining UI references to "referral" to use "invite" or "affiliate" as appropriate
4. Add more unit tests for both systems

## Implementation Notes

- Both systems are implemented as React Context providers with corresponding hooks
- The implementation maintains backward compatibility with existing API endpoints
- The systems are designed to be used together but can function independently
- The providers are added to the App.tsx component hierarchy