# Biometric Authentication Service Documentation

## Overview

DegenDuel supports biometric authentication (WebAuthn) enabling users to sign in with Face ID, Touch ID, or Windows Hello. This system securely links biometric authentication to user accounts and provides a seamless login experience.

## Architecture

The biometric authentication system consists of four main components:

1. **BiometricAuthService**: Core service that interfaces with the WebAuthn API
2. **useBiometricAuth**: React hook for easy integration in components
3. **BiometricAuthButton**: UI component for biometric authentication
4. **TokenManager**: Service for managing authentication tokens

```
┌─────────────────┐     ┌───────────────────┐     ┌──────────────┐
│                 │     │                   │     │              │
│  UI Components  │────▶│  useBiometricAuth │────▶│  WebAuthn    │
│                 │     │                   │     │   Browser    │
└─────────────────┘     └───────────────────┘     │     API      │
         │                       │                │              │
         │                       │                └──────────────┘
         │                       │                       │
         │                       ▼                       │
         │              ┌─────────────────┐             │
         │              │                 │             │
         └─────────────▶│ BiometricAuth   │◀────────────┘
                        │    Service      │
                        │                 │
                        └─────────────────┘
                                │
                                │
         ┌─────────────┐        │       ┌──────────────────┐
         │             │        │       │                  │
         │ TokenManager│◀───────┴──────▶│  Backend REST    │
         │             │                │      API         │
         └─────────────┘                │                  │
                                        └──────────────────┘
```

## Core Components

### 1. BiometricAuthService.ts

The service that interfaces directly with the WebAuthn API, handling credential creation, registration, and verification.

**Key Features:**
- WebAuthn feature detection
- Credential registration
- Authentication
- Credential status checking
- Base64URL encoding/decoding utilities
- Error handling

**Usage:**
```typescript
// Get instance
const bioAuth = BiometricAuthService.getInstance();

// Check if available
if (bioAuth.canUseBiometrics()) {
  // Register a credential
  const credentialId = await bioAuth.registerCredential(userId, username, {
    authenticatorType: 'platform' // or 'cross-platform' for security keys
  });
  
  // Authenticate with credential
  const token = await bioAuth.authenticate(userId);
}
```

### 2. useBiometricAuth.ts

A React hook that provides an easy-to-use interface for components to interact with the BiometricAuthService.

**Key Features:**
- Availability detection
- Credential status checking
- Registration flow
- Authentication flow
- Loading and error state management

**Usage:**
```typescript
const {
  isAvailable,      // Whether WebAuthn is supported
  isRegistered,     // Whether user has registered credentials
  isRegistering,    // Loading state for registration
  isAuthenticating, // Loading state for authentication
  error,            // Error state
  registerCredential, // Registration function
  authenticate,     // Authentication function
  checkRegistrationStatus // Check if user has credentials
} = useBiometricAuth();
```

### 3. BiometricAuthButton.tsx

A reusable UI component that provides a button for biometric authentication or registration.

**Key Features:**
- Supports both registration and authentication modes
- Multiple visual styles (default, minimal, icon-only)
- Support for platform and cross-platform authenticators
- Availability indication
- Loading states with visual feedback
- Comprehensive error handling

**Props:**
```typescript
interface BiometricAuthButtonProps {
  mode?: 'register' | 'authenticate'; // Default: 'authenticate'
  className?: string; // Additional CSS classes
  buttonStyle?: 'default' | 'minimal' | 'icon-only'; // Visual style
  authenticatorType?: 'platform' | 'cross-platform'; // Type of authenticator
  nickname?: string; // Display name for the credential
  walletAddress?: string; // User's wallet address
  showAvailabilityIndicator?: boolean; // Whether to show availability status
  onSuccess?: () => void; // Success callback
  onError?: (error: string) => void; // Error callback
  onAvailabilityChange?: (isAvailable: boolean) => void; // Availability callback
}
```

**Usage:**
```tsx
// For registration
<BiometricAuthButton 
  mode="register"
  buttonStyle="default"
  authenticatorType="platform"
  onSuccess={() => console.log('Registration successful')}
  onError={(err) => console.error(err)}
/>

// For authentication
<BiometricAuthButton 
  mode="authenticate"
  className="custom-button-class"
  buttonStyle="minimal"
  onSuccess={() => console.log('Authentication successful')}
  showAvailabilityIndicator={true}
/>

// Security key support
<BiometricAuthButton 
  mode="register"
  authenticatorType="cross-platform"
  onSuccess={() => console.log('Security key registered')}
/>
```

## Integration Points

### 1. User Menu Integration

The BiometricAuthMenuOption component in UserMenu.tsx adds biometric options to the user menu:
- Shows "Setup Biometrics" for users without registered credentials
- Shows "Use Biometrics" for users with registered credentials
- Hides itself if biometric authentication is not available

### 2. Login Options Integration

The LoginOptions.tsx component integrates biometric authentication as an alternative login method:
- Only appears if the user has previously registered biometric credentials
- Provides a streamlined, passwordless login experience

## API Endpoints

The biometric authentication system communicates with the following backend REST endpoints:

### Registration
- `POST /api/auth/biometric/register-options`: Get registration options
  - Request: `{ userId: string, nickname?: string, authenticatorType?: 'platform'|'cross-platform' }`
  - Response: Challenge and registration options

- `POST /api/auth/biometric/register-verify`: Verify and store credential
  - Request: Attestation response from WebAuthn
  - Response: Registration result and credential ID

### Authentication
- `POST /api/auth/biometric/login-options`: Get authentication options
  - Request: `{ userId: string }`
  - Response: Challenge and authentication options

- `POST /api/auth/biometric/login-verify`: Verify credential and get token
  - Request: Assertion response from WebAuthn
  - Response: Authentication result and JWT token

### Status
- `GET /api/auth/biometric/has-credential`: Check if user has registered credentials
  - Query param: `userId`
  - Response: `{ hasCredential: boolean }`

## Security Considerations

### 1. Browser Support

WebAuthn is supported in all modern browsers. The implementation includes feature detection to gracefully handle unsupported browsers.

### 2. Platform vs Cross-Platform Authenticators

The implementation supports both types of authenticators:
- **Platform authenticators**: Built-in biometrics like Face ID, Touch ID, Windows Hello
- **Cross-platform authenticators**: External devices like security keys (YubiKey, Titan)

### 3. User Verification

The implementation requests user verification with `userVerification: 'preferred'`, ensuring the user verifies their identity during authentication.

### 4. Token Management

Authentication tokens received after successful biometric authentication are managed by the TokenManager service:
- Tokens are stored securely
- Expiration is tracked
- Automatic refresh is attempted when possible

## Error Handling

The biometric authentication system implements comprehensive error handling:

1. **Availability Errors**: When WebAuthn is not available or not supported
   - Error: `NotSupportedError`
   - UI: Show alternative login methods

2. **User Cancellation**: When users cancel the biometric prompt
   - Error: `NotAllowedError`
   - UI: Allow retry or fallback to other auth methods

3. **No Credentials**: When user has no registered credentials
   - Error: `no_credentials` from backend
   - UI: Redirect to registration flow or other login methods

4. **Verification Failed**: When verification fails due to security issues
   - Error: `verification_failed` from backend
   - UI: Advise user to try again or use alternative method

5. **Timeout Errors**: When operations take too long
   - Biometric operations have a 60-second timeout by default
   - UI: Handle timeouts gracefully with appropriate messaging

## Device Support

- **iOS/Safari**: iPhone with Face ID, iPad with Touch ID (iOS 14+)
- **Android/Chrome**: Devices with fingerprint sensors (Android 7+)
- **Windows/Edge or Chrome**: Windows Hello (facial recognition, fingerprint)
- **macOS/Safari**: Touch ID on supported MacBooks

## Debugging

The biometric authentication system includes debugging utilities:

1. **Browser Console**: Uses authDebug() for console logging in development mode
2. **Window Object**: Exposes a global debugging function
   ```javascript
   window.debugBiometricAuth()
   ```
   This returns information about the current state of biometric authentication

## Example Implementations

### Complete Registration Flow

```tsx
import React, { useState, useEffect } from 'react';
import { BiometricAuthButton } from '../components/auth/BiometricAuthButton';

const BiometricRegistration = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('');
  
  // Check if biometric auth is available
  useEffect(() => {
    async function checkAvailability() {
      if (window.PublicKeyCredential &&
          PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setIsAvailable(available);
      }
    }
    
    checkAvailability();
  }, []);
  
  if (!isAvailable) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold text-lg">Biometric Setup</h3>
        <p className="text-gray-700 mt-2">
          Biometric authentication is not available on your device.
          Please use password authentication instead.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold text-lg">Biometric Setup</h3>
      <p className="text-gray-700 mt-2">
        Register your biometric credentials to enable quick and secure login
        using your device's biometric features.
      </p>
      
      <div className="mt-4">
        <BiometricAuthButton
          mode="register"
          showAvailabilityIndicator={true}
          onSuccess={() => setRegistrationStatus('Registration successful!')}
          onError={(error) => setRegistrationStatus(`Error: ${error}`)}
        />
      </div>
      
      {registrationStatus && (
        <p className={`mt-3 ${registrationStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {registrationStatus}
        </p>
      )}
    </div>
  );
};
```

### Authentication with Device Selection

```tsx
import React, { useState } from 'react';
import { BiometricAuthButton } from '../components/auth/BiometricAuthButton';

const BiometricLogin = () => {
  const [authenticatorType, setAuthenticatorType] = useState<'platform' | 'cross-platform'>('platform');
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg text-white">
      <h3 className="text-xl font-bold mb-4">Biometric Authentication</h3>
      
      <div className="mb-4">
        <label className="block text-sm mb-2">Authentication method:</label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="authenticatorType"
              value="platform"
              checked={authenticatorType === 'platform'}
              onChange={() => setAuthenticatorType('platform')}
              className="mr-2"
            />
            <span>
              Face ID / Touch ID / Windows Hello
            </span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="authenticatorType"
              value="cross-platform"
              checked={authenticatorType === 'cross-platform'}
              onChange={() => setAuthenticatorType('cross-platform')}
              className="mr-2"
            />
            <span>
              Security Key
            </span>
          </label>
        </div>
      </div>
      
      <BiometricAuthButton
        mode="authenticate"
        authenticatorType={authenticatorType}
        showAvailabilityIndicator={true}
        onSuccess={() => console.log('Authentication successful')}
        onError={(error) => console.error('Authentication error:', error)}
      />
    </div>
  );
};
```

## Troubleshooting

- If authentication fails with a generic error, check your browser's console for more details
- On iOS, ensure that you're using Safari as other browsers may not support WebAuthn
- On Windows, ensure that Windows Hello is properly set up in your system settings
- If using a cross-platform authenticator (security key), ensure it's properly connected

## Future Enhancements

1. **Multiple Credentials**: Support for registering and managing multiple biometric devices
2. **Credential Management**: UI for viewing and deleting registered credentials
3. **Advanced Options**: Support for additional registration and authentication options
4. **Session Management**: Enhanced session management with biometric reauthentication
5. **Recovery Options**: Fallback mechanisms when biometric authentication fails

---

This documentation is intended for developers working on the DegenDuel platform and should be kept up-to-date as the biometric authentication system evolves.