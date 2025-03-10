# Twitter Login Integration

## Overview

This document outlines the implementation of Twitter authentication for DegenDuel. The Twitter login feature allows **existing users** to link their Twitter accounts to their Solana wallets and subsequently use Twitter as an alternative login method.

> **IMPORTANT**: Twitter authentication is ONLY available for existing users who have already registered with a Solana wallet. Users MUST create an account with a wallet first, as the wallet address is the primary key in our users table.

## Backend Implementation

### Environment Variables

The following environment variables are required for Twitter integration:

```
X_APP_ID=30350552
X_CLIENT_ID=***REMOVED***
X_CLIENT_SECRET=***REMOVED***
X_CALLBACK_URI=***REMOVED***
X_CALLBACK_URI_DEVELOPMENT=***REMOVED***
```

### Dependencies

The Twitter integration requires the following dependencies:
- `express-session` - For maintaining session data during OAuth flow
- `axios` - For making HTTP requests to Twitter API

### Database Schema

The system leverages the existing `user_social_profiles` table with the following schema:

```
user_social_profiles {
  wallet_address    String
  platform          String
  platform_user_id  String
  username          String
  verified          Boolean?  @default(false)
  verification_date DateTime? @db.Timestamptz(6)
  last_verified     DateTime? @db.Timestamptz(6)
  metadata          Json?     @default("{}")
  created_at        DateTime? @default(now()) @db.Timestamptz(6)
  updated_at        DateTime? @default(now()) @db.Timestamptz(6)

  @@id([wallet_address, platform])
  @@unique([platform, platform_user_id], map: "unique_platform_user")
  @@index([platform, platform_user_id], map: "idx_user_social_profiles_platform")
  @@map("user_social_profiles")
}
```

The `metadata` field stores Twitter-specific information:
```json
{
  "name": "User's Twitter name",
  "profile_image_url": "https://twitter.com/profile_image_url",
  "access_token": "Twitter OAuth access token",
  "refresh_token": "Twitter OAuth refresh token"
}
```

### Authentication Flow

1. **Link Twitter Account (for existing authenticated users)**:
   - User must already be authenticated with wallet
   - User initiates Twitter connection from profile page
   - Backend redirects to Twitter OAuth
   - Twitter redirects back with OAuth code
   - Backend exchanges code for tokens
   - Backend links Twitter profile to user's wallet address

2. **Login with Twitter (for users who have already linked accounts)**:
   - User initiates Twitter login
   - Backend redirects to Twitter OAuth
   - Twitter redirects back with OAuth code
   - Backend exchanges code for tokens
   - Backend looks up user by Twitter ID
   - Backend creates session for the linked wallet

### Endpoints

#### 1. Initiate Twitter OAuth

```
GET /api/auth/twitter/login
```

- **Description**: Redirects user to Twitter OAuth authorization page
- **Authentication**: None required
- **Response**: Redirects to Twitter OAuth page

#### 2. Twitter OAuth Callback

```
GET /api/auth/twitter/callback
```

- **Description**: Handles callback from Twitter OAuth
- **Parameters**: 
  - `code` (query): OAuth authorization code
  - `state` (query): CSRF protection token
- **Response**:
  - If user is already authenticated with wallet: Links Twitter to that wallet and redirects to success page
  - If user is not authenticated: Redirects to connect wallet page with pending Twitter data

#### 3. Link Twitter to Wallet

```
POST /api/auth/twitter/link
```

- **Description**: Links Twitter account to connected wallet
- **Authentication**: Requires valid wallet session
- **Request Body**: None (Uses Twitter data from session)
- **Response**:
  - Success (200): `{ success: true, message: 'Twitter account linked successfully' }`
  - Error (400): `{ error: 'No Twitter authentication data found' }`
  - Error (500): `{ error: 'Failed to link Twitter account' }`

#### 4. Get User Social Profiles

```
GET /api/users/:wallet/social-profiles
```

- **Description**: Get user's linked social profiles
- **Authentication**: Requires valid wallet session (user can only view their own profiles)
- **Response**:
  - Success (200): Array of social profiles with platform, username, etc.
  - Error (401): `{ error: 'Not authorized to view these social profiles' }`

#### 5. Unlink Social Profile

```
DELETE /api/users/:wallet/social-profiles/:platform
```

- **Description**: Unlink a social profile
- **Authentication**: Requires valid wallet session (user can only unlink their own profiles)
- **Response**:
  - Success (200): `{ success: true, message: 'Twitter profile unlinked successfully' }`
  - Error (404): `{ error: 'Social profile not found' }`

## Frontend Integration

### 1. Link Twitter Account (For Logged-in Users)

Add the TwitterLoginButton component to the user's profile page:

```jsx
// src/components/auth/TwitterLoginButton.jsx
import React from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { FaTwitter } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const TwitterLoginButton = ({ linkMode = false, className = '' }) => {
  const { user } = useAuthContext();
  
  const handleTwitterAuth = () => {
    // Redirect to the Twitter OAuth endpoint
    window.location.href = '/api/auth/twitter/login';
  };

  // If in link mode, we need to be logged in
  if (linkMode && !user) {
    return null;
  }

  // Check for twitter_linked success parameter
  React.useEffect(() => {
    if (user) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('twitter_linked') === 'true') {
        toast.success('Twitter account linked successfully!');
      }
    }
  }, [user]);

  return (
    <Button
      onClick={handleTwitterAuth}
      variant={linkMode ? "outline" : "secondary"}
      className={`flex items-center justify-center gap-2 ${className}`}
    >
      <FaTwitter className="text-[#1DA1F2]" />
      {linkMode ? 'Link Twitter Account' : 'Login with Twitter'}
    </Button>
  );
};

export default TwitterLoginButton;
```

### 2. Social Accounts Panel (For Profile Page)

Add a component to display and manage social accounts:

```jsx
// src/components/profile/SocialAccountsPanel.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import TwitterLoginButton from '../auth/TwitterLoginButton';
import { useAuthContext } from '../../contexts/AuthContext';
import { FaTwitter, FaCheck, FaUnlink } from 'react-icons/fa';
import { Button } from '../ui/Button';

const SocialAccountsPanel = () => {
  const { user } = useAuthContext();
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSocialAccounts() {
      if (!user?.wallet_address) return;
      
      try {
        const response = await fetch(`/api/users/${user.wallet_address}/social-profiles`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setSocialAccounts(data);
        }
      } catch (error) {
        console.error('Failed to fetch social accounts:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSocialAccounts();
  }, [user]);
  
  // Check if Twitter is linked
  const twitterAccount = socialAccounts.find(account => account.platform === 'twitter');
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Social Accounts</CardTitle>
        <CardDescription>
          Connect your social media accounts for easier login
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading social accounts...</div>
        ) : (
          <div className="space-y-4">
            {/* Twitter Account */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <FaTwitter className="text-[#1DA1F2]" />
                <div>
                  <h4>Twitter</h4>
                  {twitterAccount ? (
                    <div>@{twitterAccount.username}</div>
                  ) : (
                    <p>Not connected</p>
                  )}
                </div>
              </div>
              
              <div>
                {twitterAccount ? (
                  <Button 
                    variant="ghost" 
                    onClick={() => handleUnlinkAccount('twitter')}
                  >
                    <FaUnlink /> Unlink
                  </Button>
                ) : (
                  <TwitterLoginButton linkMode={true} />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialAccountsPanel;
```

### 3. Login Options (For Login Page)

Add Twitter login option to the login page:

```jsx
// src/components/auth/LoginOptions.jsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { ConnectWalletButton } from './ConnectWalletButton';
import TwitterLoginButton from './TwitterLoginButton';
import { Divider } from '../ui/Divider';

const LoginOptions = () => {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Login to DegenDuel</CardTitle>
        <CardDescription>
          Connect with your wallet or use a linked social account
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Primary Login Method */}
        <div className="space-y-3">
          <h3>Connect Wallet</h3>
          <ConnectWalletButton className="w-full" />
        </div>
        
        {/* Alternative Login Methods */}
        <div className="space-y-3">
          <Divider>or continue with</Divider>
          <TwitterLoginButton className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginOptions;
```

## Security Considerations

1. **CSRF Protection**: OAuth state parameter is used to prevent CSRF attacks
2. **Session Security**: Session cookies are httpOnly and (in production) secure
3. **Proper Verification**: Twitter account linking requires an active wallet session
4. **Unique Constraint**: Each Twitter account can only be linked to one wallet (enforced by database)
5. **Sensitive Data**: Access tokens are stored securely and not exposed in API responses

## Testing Instructions

1. **Link Twitter Account**:
   - Log in with wallet
   - Go to profile page
   - Click "Link Twitter Account"
   - Complete Twitter OAuth
   - Verify account is linked in profile

2. **Login with Twitter**:
   - Ensure account is already linked
   - Log out
   - On login page, click "Login with Twitter"
   - Complete Twitter OAuth
   - Verify successful login with wallet session

3. **Unlink Twitter Account**:
   - Log in with wallet
   - Go to profile page
   - Find the Twitter entry in social accounts
   - Click "Unlink"
   - Verify Twitter account is removed

## Limitations and Future Improvements

1. **Account Recovery**: Currently, this system doesn't support account recovery via Twitter
2. **Profile Synchronization**: No automatic syncing of profile data between Twitter and DegenDuel
3. **Multiple Social Logins**: Framework exists for adding other social providers in the future
4. **Rate Limiting**: Consider implementing rate limiting for Twitter API calls

## Troubleshooting

Common issues:

1. **OAuth Callback URL Mismatch**: Ensure callback URLs in Twitter Developer Portal match those in `.env`
2. **Missing Session Data**: If session data is missing, check session configuration in `index.js`
3. **"Already Linked" Error**: If a Twitter account is already linked to another wallet, user will receive an error message
4. **Login Issues**: If Twitter login fails, ensure the user has previously linked their Twitter account

## Implementation Files

The implementation consists of the following files:

### Backend:
- `routes/auth.js` - Twitter OAuth endpoints
- `routes/users.js` - Social profile endpoints
- `index.js` - Session middleware configuration

### Frontend:
- `src/components/auth/TwitterLoginButton.jsx` - Reusable Twitter auth button
- `src/components/profile/SocialAccountsPanel.jsx` - Profile panel for managing social accounts
- `src/components/auth/LoginOptions.jsx` - Login page with Twitter option 