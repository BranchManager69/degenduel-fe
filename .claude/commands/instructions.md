# Instructions

## IMPORTANT

THESE INSTRUCTIONS ORIGINATE FROM THE ACTUAL BACKEND IMPLEMENTATION AND MUST BE FOLLOWED CLOSELY.

## Your Task

Implement the backend functionality.  Before creating any new pages or components, check to see if there are any that can be enhanced rather than starting anew.  If you have any questions, ask me beforehand.

# INSTRUCTIONS FROM BACKEND TEAM:

  DegenDuel Privy Integration Guide for Frontend

  Overview

  We've implemented Privy authentication with three main endpoints:

  1. /api/auth/verify-privy - Log in with a Privy account
  2. /api/auth/link-privy - Link an existing Privy account to an already authenticated wallet
  3. /api/auth/status - Check Privy authentication and linking status

  Endpoint Details

  1. Login with Privy (/api/auth/verify-privy)

  Purpose: Authenticate a user using their Privy account credentials.

  Method: POST

  Requires Authentication: No

  Request Body:
  {
    "token": "privy-auth-token-from-sdk",
    "userId": "privy-user-id-from-sdk",
    "device_id": "optional-device-identifier",
    "device_name": "optional-device-name",
    "device_type": "optional-device-type"
  }

  Response (Success - 200):
  {
    "verified": true,
    "user": {
      "wallet_address": "solana-wallet-address",
      "role": "user",
      "nickname": "user_nickname"
    },
    "device": {
      "device_authorized": true,
      "device_id": "device-id",
      "device_name": "Device Name",
      "requires_authorization": false
    }
  }

  Response (Error):
  - 400: Missing required fields
  - 401: Invalid Privy token
  - 404: No user found with this wallet address (if auto-creation is disabled)
  - 500: Server error

  Notes:
  - Sets a session cookie for maintaining the authenticated session
  - The wallet address comes from the Privy user object
  - Account auto-creation can be enabled/disabled on the server

  2. Link Privy to Existing Account (/api/auth/link-privy)

  Purpose: Link a Privy account to an existing authenticated wallet.

  Method: POST

  Requires Authentication: Yes (via JWT cookie)

  Request Body:
  {
    "token": "privy-auth-token-from-sdk",
    "userId": "privy-user-id-from-sdk"
  }

  Response (Success - 200):
  {
    "success": true,
    "message": "Privy account linked successfully",
    "wallet": "user-wallet-address",
    "privy_user_id": "privy-user-id"
  }

  Response (Error):
  - 400: Missing required fields or Privy account already linked to different wallet
  - 401: Invalid Privy token or not authenticated
  - 500: Server error

  Notes:
  - Use this after a user has already logged in with their wallet
  - Allows user to link their existing DegenDuel account to a Privy account

  3. Check Auth Status (/api/auth/status)

  Purpose: Get comprehensive authentication status including Privy.

  Method: GET

  Requires Authentication: No (provides more info if authenticated)

  Response (Success - 200):
  {
    "timestamp": "2025-04-01T12:34:56Z",
    "authenticated": true,
    "methods": {
      "jwt": {
        "active": true,
        "method": "jwt",
        "details": {
          "wallet_address": "user-wallet-address",
          "role": "user",
          "nickname": "user_nickname",
          "expires": "2025-04-01T23:59:59Z"
        }
      },
      "privy": {
        "active": true,
        "linked": true,
        "method": "privy",
        "details": {
          "linked": {
            "userId": "privy-user-id",
            "username": "user@example.com",
            "verified": true,
            "last_verified": "2025-04-01T12:00:00Z"
          },
          "last_login": {
            "timestamp": "2025-04-01T11:00:00Z",
            "success": true,
            "userId": "privy-user-id"
          }
        }
      },
      // Other auth methods...
    }
  }

  Frontend Implementation Flow

  1. Initial Privy Setup

  // Initialize Privy in your frontend app
  import { PrivyClient } from '@privy-io/privy-browser';

  const privy = new PrivyClient({
    appId: 'your-privy-app-id',
    // other config options
  });

  // Listen for authentication
  privy.on('authenticated', handlePrivyAuth);

  2. Logging in with Privy

  async function handlePrivyAuth(user) {
    // Get Privy token and user ID
    const token = await privy.getAccessToken();
    const userId = user.id;

    // Optional device info
    const deviceId = getOrCreateDeviceId(); // Implement this helper

    // Call DegenDuel backend
    const response = await fetch('/api/auth/verify-privy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important for cookies
      body: JSON.stringify({
        token,
        userId,
        device_id: deviceId,
        device_name: navigator.userAgent,
        device_type: 'browser'
      })
    });

    if (response.ok) {
      const data = await response.json();
      // User is logged in, redirect or update UI
      updateUserState(data.user);

      // Handle device authorization if needed
      if (data.device && data.device.requires_authorization) {
        showDeviceAuthPrompt();
      }
    } else {
      // Handle errors
      const error = await response.json();
      showErrorMessage(error.error);
    }
  }

  3. Linking Privy to Existing Account

  async function linkPrivyToWallet(privyUser) {
    // User must already be logged in with wallet
    if (!isUserLoggedIn()) {
      showMessage('Please log in with your wallet first');
      return;
    }

    // Get Privy token and user ID
    const token = await privy.getAccessToken();
    const userId = privyUser.id;

    // Call linking endpoint
    const response = await fetch('/api/auth/link-privy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token, userId })
    });

    if (response.ok) {
      const data = await response.json();
      showSuccessMessage('Privy account linked successfully');
      // Update UI to show linked status
      updatePrivyLinkStatus(true);
    } else {
      const error = await response.json();
      showErrorMessage(error.error);
    }
  }

  4. Checking Auth Status

  async function checkAuthStatus() {
    const response = await fetch('/api/auth/status', {
      credentials: 'include'
    });

    if (response.ok) {
      const status = await response.json();

      // Check if user is authenticated
      if (status.authenticated) {
        // User is logged in
        updateUserState(status.methods.jwt.details);

        // Check Privy status
        const privyStatus = status.methods.privy;

        // Update UI based on Privy link status
        if (privyStatus.linked) {
          showPrivyLinkedUI(privyStatus.details.linked);
        } else {
          showPrivyLinkPrompt();
        }
      } else {
        // User is not logged in
        showLoginOptions();
      }
    }
  }

  // Call this on page load and after authentication events
  checkAuthStatus();

  Environment Variable

  The backend has a config flag to control automatic account creation:
  - PRIVY_AUTO_CREATE_ACCOUNTS - When "true", automatically creates DegenDuel accounts for new Privy users.

  Common Scenarios

  1. First-time Privy Login Flow

  For new users who haven't used DegenDuel before:
  1. User logs in with Privy
  2. Backend creates a new DegenDuel account if auto_create_accounts is enabled
  3. User is authenticated and receives a session cookie

  2. Existing Wallet User Linking Privy

  For users who already have a DegenDuel account:
  1. User logs in with their wallet (traditional auth)
  2. User links their Privy account using the "Link Privy" button in UI
  3. Frontend calls /api/auth/link-privy with the Privy token
  4. User can now log in with either method

  3. Checking if User Has Linked Privy

  To determine if the "Link Privy" option should be shown:
  1. Call /api/auth/status to get auth status
  2. Check status.methods.privy.linked boolean
  3. If true, show "Privy Linked" UI
  4. If false, show "Link your Privy Account" button