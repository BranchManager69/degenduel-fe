# Biometric Authentication Service Documentation

## Overview

The Biometric Authentication system enables users to register and authenticate using biometric credentials (fingerprint, face ID, etc.) via the Web Authentication API (WebAuthn). This implementation provides a secure, passwordless authentication method that can be used alongside existing authentication mechanisms.

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
  const credentialId = await bioAuth.registerCredential(userId, username);
  
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
- Handles loading states
- Provides visual feedback
- Error handling

**Props:**
```typescript
interface BiometricAuthButtonProps {
  mode?: 'register' | 'authenticate'; // Default: 'authenticate'
  className?: string;                // Additional CSS classes
  onSuccess?: () => void;           // Success callback
  onError?: (error: string) => void; // Error callback
}
```

**Usage:**
```tsx
// For registration
<BiometricAuthButton 
  mode="register"
  onSuccess={() => console.log('Registration successful')}
  onError={(err) => console.error(err)}
/>

// For authentication
<BiometricAuthButton 
  mode="authenticate"
  className="custom-button-class"
  onSuccess={() => console.log('Authentication successful')}
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

## Security Considerations

### 1. Browser Support

WebAuthn is supported in all modern browsers, but not in older ones. The implementation includes feature detection to gracefully handle unsupported browsers.

### 2. Platform vs Cross-Platform Authenticators

This implementation prioritizes platform authenticators (integrated biometrics) by setting:
```javascript
authenticatorAttachment: 'platform'
```

### 3. User Verification

The implementation requests user verification:
```javascript
userVerification: 'preferred'
```
This ensures the user verifies their identity (e.g., with a fingerprint) during authentication.

### 4. Token Management

Authentication tokens received after successful biometric authentication are managed by the TokenManager service:
- Tokens are stored securely
- Expiration is tracked
- Automatic refresh is attempted when possible

## Error Handling

The biometric authentication system implements comprehensive error handling:

1. **Availability Errors**: Detect and handle when WebAuthn is not available
2. **User Cancellation**: Handle when users cancel the biometric prompt
3. **Failed Authentication**: Handle failed authentication attempts
4. **Network Errors**: Handle API errors when communicating with backend
5. **Timeout Errors**: Handle when operations take too long

Errors are propagated to the UI with descriptive messages, and logging is provided for debugging.

## API Endpoints

The biometric authentication system communicates with the following backend REST endpoints:

### Registration
- `POST /api/auth/biometric/register-options`: Get registration options
- `POST /api/auth/biometric/register-verify`: Verify and store credential

### Authentication
- `POST /api/auth/biometric/login-options`: Get authentication options
- `POST /api/auth/biometric/login-verify`: Verify credential and get token

### Status
- `GET /api/auth/biometric/has-credential`: Check if user has registered credentials

## Debugging

The biometric authentication system includes debugging utilities:

1. **Browser Console**: Uses authDebug() for console logging in development mode
2. **Window Object**: Exposes a global debugging function
   ```javascript
   window.debugBiometricAuth()
   ```
   This returns information about the current state of biometric authentication

## Future Enhancements

1. **Multiple Credentials**: Support for registering and managing multiple biometric devices
2. **Credential Management**: UI for viewing and deleting registered credentials
3. **WebSocket Integration**: Migrate from REST to WebSocket for better performance
4. **Session Management**: Enhanced session management with biometric reauthentication
5. **Recovery Options**: Fallback mechanisms when biometric authentication fails

## Technical References

- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [MDN Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [Browser Compatibility](https://caniuse.com/webauthn)

## Code Examples

### Registering a Credential

```typescript
// Using the service directly
const bioAuth = BiometricAuthService.getInstance();
try {
  const credentialId = await bioAuth.registerCredential(
    'user123', 
    'John Doe'
  );
  console.log('Registered credential:', credentialId);
} catch (error) {
  console.error('Registration failed:', error);
}

// Using the React hook
const { registerCredential, isRegistering, error } = useBiometricAuth();
const handleRegister = async () => {
  const success = await registerCredential('user123', 'John Doe');
  if (success) {
    console.log('Registration successful');
  }
};
```

### Authenticating with Biometrics

```typescript
// Using the service directly
const bioAuth = BiometricAuthService.getInstance();
try {
  const token = await bioAuth.authenticate('user123');
  console.log('Authenticated, received token:', token);
} catch (error) {
  console.error('Authentication failed:', error);
}

// Using the React hook
const { authenticate, isAuthenticating, error } = useBiometricAuth();
const handleLogin = async () => {
  const success = await authenticate('user123');
  if (success) {
    console.log('Authentication successful');
  }
};
```

## Implementation Notes

### Base64URL Encoding/Decoding

WebAuthn requires base64url encoding/decoding for data exchange. The service includes utility functions:

```typescript
// Encode ArrayBuffer to Base64URL
private arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Decode Base64URL to ArrayBuffer
private base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  const paddedBase64 = base64Url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // Add padding if needed
  const padding = paddedBase64.length % 4;
  const padded = padding 
    ? paddedBase64 + '===='.substring(0, 4 - padding) 
    : paddedBase64;
  
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  return bytes.buffer;
}
```

---

This documentation is intended for developers working on the DegenDuel platform and should be kept up-to-date as the biometric authentication system evolves.