# Admin Wallet Monitoring Components

This document provides implementation guidelines for adding wallet balance monitoring features to various parts of the DegenDuel platform.

## Overview

The wallet monitoring system allows administrators to track and visualize user wallet balances over time. These components are specifically designed to **only show data to admin and superadmin users**, while gracefully hiding when viewed by regular users.

## Available Components

### 1. AdminWalletBalanceChart

This is the main component for adding admin-only wallet charts to user profiles or other pages.

```jsx
import { AdminWalletBalanceChart } from '../components';

// Inside your component
<AdminWalletBalanceChart 
  walletAddress="HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrn"
  title="User's Wallet History"
  description="Balance tracking for this wallet"
  height={250}
  showControls={true}
/>
```

**Props:**
- `walletAddress` (required): The wallet address to display history for
- `height`: Chart height (number or string, default: 250)
- `title`: Chart title (default: 'Wallet Balance History')
- `description`: Chart description text
- `showControls`: Whether to show time period controls (default: true)
- `className`: Additional CSS classes
- `fallbackComponent`: Component to show for non-admin users (default: null)

### 2. UserProfileExtras

A component specifically designed to enhance user profile pages with admin-only features.

```jsx
import { UserProfileExtras } from '../components';

// Inside your user profile component
<UserProfileExtras 
  walletAddress={user.wallet_address}
  nickname={user.nickname}
/>
```

**Props:**
- `walletAddress` (required): The wallet address
- `nickname`: User's nickname for display purposes
- `className`: Additional CSS classes

### 3. WalletBalanceAnalytics (Admin Dashboard)

A comprehensive analytics component for admin dashboards.

```jsx
import { WalletBalanceAnalytics } from '../components';

// Inside your admin dashboard
<WalletBalanceAnalytics 
  title="Platform Balance Analytics"
  showControls={true}
  showInsights={true}
/>
```

**Props:**
- `className`: Additional CSS classes
- `walletAddress`: Specific wallet to display (optional)
- `title`: Component title (default: 'Wallet Balance Analytics')
- `showControls`: Whether to show view controls (default: true)
- `showInsights`: Whether to show insights panel (default: true)

## Implementation Recommendations

### User Profile Pages

Add the `UserProfileExtras` component to all user profile pages. This component handles all the permission checks internally, so it's safe to include it everywhere:

```jsx
// In UserProfilePage.jsx
import { UserProfileExtras } from '../components';

const UserProfilePage = ({ user }) => {
  return (
    <div>
      {/* User profile main content */}
      <UserInfo user={user} />
      <ActivityFeed userId={user.id} />
      
      {/* Admin-only extras (only visible to admins) */}
      <UserProfileExtras 
        walletAddress={user.wallet_address}
        nickname={user.nickname}
      />
    </div>
  );
};
```

### Admin Dashboard

Use the full `WalletBalanceAnalytics` component in the admin dashboard:

```jsx
// In AdminDashboard.jsx
import { WalletBalanceAnalytics } from '../components';

const AdminDashboard = () => {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      
      {/* Other dashboard sections */}
      
      {/* Wallet monitoring section */}
      <WalletBalanceAnalytics />
    </div>
  );
};
```

### Custom Pages

For custom pages or specialized views, use the `AdminWalletBalanceChart` component directly:

```jsx
// In ContestDetailPage.jsx (for example)
import { AdminWalletBalanceChart } from '../components';

const ContestDetailPage = ({ contest }) => {
  return (
    <div>
      {/* Contest details */}
      
      {/* Show wallet chart only for admins */}
      <AdminWalletBalanceChart 
        walletAddress={contest.wallet_address}
        title="Contest Wallet Balance"
        description={`Balance history for contest #${contest.id}`}
      />
    </div>
  );
};
```

## Technical Implementation Notes

1. **Data Access**: All wallet balance data is fetched via the unified WebSocket system, using the topic `admin` and appropriate actions.

2. **Permission Checking**: The `AdminWalletBalanceChart` component uses the global store to check if the current user has admin or superadmin permissions.

3. **Graceful Degradation**: When a non-admin user views a page with these components, they simply render nothing (or an optional fallback component if provided).

4. **Visual Indicators**: For admin users, these components include visual indicators that they're viewing admin-only data.

5. **Unified WebSocket**: All data is fetched using the new unified WebSocket system to avoid direct API calls.

## API Reference

The components use the following WebSocket actions:

1. `wallet-balance/history` - Get balance history for a specific wallet
2. `wallet-balance/total` - Get total balance across all wallets over time
3. `wallet-balance/average` - Get average balance per wallet over time
4. `wallet-balance/top` - Get top wallets by balance over time
5. `wallet-balance/exists` - Check if a wallet exists in the database
6. `wallet-balance/compare` - Compare multiple wallets

Each action accepts the following parameters:
- `range`: Time range ('last_24_hours', 'last_7_days', 'last_30_days', 'all')
- `wallet`: Wallet address (for single wallet actions)