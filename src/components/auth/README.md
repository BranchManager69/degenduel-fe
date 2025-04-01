# Authentication Components

This directory contains components related to user authentication in DegenDuel.

## Components

- **LoginOptions.tsx**: Main component that displays all login options including wallet connection, Twitter login, and Privy login. Displays either login options or account linking UI based on authentication state.
- **ConnectWalletButton.tsx**: Button for connecting via wallet (Phantom, etc.)
- **TwitterLoginButton.tsx**: Button for Twitter social login
- **PrivyLoginButton.tsx**: Button for Privy authentication (email/social)
- **ReferralCodeInput.tsx**: Component for entering referral codes during registration
- **LoginOptions.mock.tsx**: Mock version of LoginOptions for use in Storybook that doesn't rely on contexts

## Authentication Flow

1. **Wallet Connection**: Primary method - users connect their wallets
2. **Social Login**: Alternative methods via Twitter or Privy
3. **Account Linking**: Users who logged in with wallet can link social accounts for future logins

## Related Files

- **/src/contexts/AuthContext.tsx**: Main authentication context
- **/src/contexts/PrivyAuthContext.tsx**: Privy-specific authentication context
- **/src/hooks/useAuth.ts**: Core authentication hook
- **/src/pages/public/general/LoginPage.tsx**: Full login page

## Authentication Endpoints

- **/api/auth/verify-privy**: For logging in with Privy
- **/api/auth/link-privy**: For linking Privy to existing accounts
- **/api/auth/status**: For checking authentication status
- **/api/auth/twitter/login**: Twitter OAuth endpoint

## Storybook

Available stories:
- **Auth/LoginOptions**: Shows the LoginOptions component with all options
- **Auth/TwitterLoginButton**: Shows the Twitter login button in various states
- **Auth/PrivyLoginButton**: Shows the Privy login button in various states
- **Pages/LoginPage**: Shows the full login page with all animations and layout

## States

The LoginOptions component has two main states:

1. **Login State**: Shows all login options (wallet, Twitter, Privy)
2. **Link Account State**: When a user is logged in with wallet but doesn't have Privy linked