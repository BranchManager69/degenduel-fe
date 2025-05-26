// src/components/auth/index.ts

/**
 * Consolidated Login Button
 * 
 * @description This file exports all the auth-related components.
 * 
 * @author BranchManager69
 * @version 1.9.0
 * @created 2025-02-14
 * @updated 2025-05-24
 */

// Auth-related components

// Export biometric authentication components
export { default as BiometricAuthButton } from './BiometricAuthButton';
export { default as BiometricCredentialManager } from './BiometricCredentialManager';

// Export QR code authentication component
export { default as QRCodeAuth } from './QRCodeAuth';

// Export login components
export { default as ConnectWalletButton } from './ConnectWalletButton';
export { default as ConsolidatedLoginButton } from './ConsolidatedLoginButton';
export { default as LoginOptions } from './LoginOptions';
export { default as WalletDebugger } from './WalletDebugger';

// Export social login components
export { default as DiscordLoginButton } from './DiscordLoginButton';
export { default as TwitterLoginButton } from './TwitterLoginButton';

// Export mock components (for testing and development)
export { default as ConnectWalletButtonMock } from './ConnectWalletButton.mock';
export { default as LoginOptionsMock } from './LoginOptions.mock';
export { default as TwitterLoginButtonMock } from './TwitterLoginButton.mock';

// Corrected export for InviteCodeInput (originally ReferralCodeInput)
export { ReferralCodeInput as InviteCodeInput } from './InviteCodeInput';
