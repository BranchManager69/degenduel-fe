// Type definitions for authComponents.jsx
import React from 'react';

export interface MockTwitterLoginButtonProps {
  linkMode?: boolean;
  className?: string;
  onClick?: () => void;
}

export interface MockPrivyLoginButtonProps {
  linkMode?: boolean;
  className?: string;
  onClick?: () => void;
}

export interface MockConnectWalletButtonProps {
  className?: string;
  onClick?: () => void;
}

export interface MockLoginOptionsProps {
  className?: string;
  showLinkView?: boolean;
}

export const MockTwitterLoginButton: React.FC<MockTwitterLoginButtonProps>;
export const MockPrivyLoginButton: React.FC<MockPrivyLoginButtonProps>;
export const MockConnectWalletButton: React.FC<MockConnectWalletButtonProps>;
export const MockLoginOptions: React.FC<MockLoginOptionsProps>;