// src/components/auth/PrivyLoginButton.tsx

/**
 * PrivyLoginButton.tsx
 * 
 * This file contains the PrivyLoginButton component, which is used to display the Privy login button.
 *   
 * @author @BranchManager69
 * @last-modified 2025-04-02
 */

import React from 'react';
import { authDebug } from '../../config/config';
import { usePrivyAuth } from '../../contexts/PrivyAuthContext';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';

interface PrivyLoginButtonProps {
  className?: string;
  onClick?: () => void;
}

/**
 * Privy Login Button Component
 * 
 * Provides a button for users to login with Privy
 * It will also handle linking an existing wallet to Privy when appropriate
 */
const PrivyLoginButton: React.FC<PrivyLoginButtonProps> = ({ 
  className = '', 
  onClick 
}) => {
  const { login, isLoading, isAuthenticated, isPrivyLinked, linkPrivyToWallet } = usePrivyAuth();
  const { user } = useStore();
  const [isLinking, setIsLinking] = React.useState(false);

  const handleLogin = async () => {
    authDebug('PrivyBtn', 'Privy button clicked', { 
      hasUser: !!user, 
      isPrivyLinked, 
      isAuthenticated 
    });
    
    // If user is logged in with wallet but Privy isn't linked, attempt to link
    if (user && !isPrivyLinked && !isAuthenticated) {
      authDebug('PrivyBtn', 'Starting account linking flow', { hasUser: !!user });
      setIsLinking(true);
      try {
        const result = await linkPrivyToWallet();
        authDebug('PrivyBtn', 'Privy account linking completed', { success: result });
        
        // Call the external onClick handler if provided
        if (onClick) onClick();
      } catch (error) {
        authDebug('PrivyBtn', 'Error linking Privy account', { error });
        console.error('Error linking Privy account:', error);
      } finally {
        setIsLinking(false);
      }
    } else {
      // Standard login flow
      authDebug('PrivyBtn', 'Starting standard Privy login flow');
      login();
      
      // Call the external onClick handler if provided
      if (onClick) onClick();
    }
  };
  
  return (
    <Button
      variant="outline"
      className={`flex items-center justify-center space-x-2 ${className}`}
      onClick={handleLogin}
      disabled={isLoading || isLinking}
    >
      {isLoading || isLinking ? (
        <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full" />
      ) : (
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 156 156" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2"
        >
          <path d="M78 0L145.901 39V117L78 156L10.099 117V39L78 0Z" fill="currentColor" fillOpacity="0.1"/>
          <path d="M78 0L145.901 39V117L78 156L10.099 117V39L78 0Z" stroke="currentColor" strokeWidth="3"/>
          <path d="M78 39L112.55 58.5V97.5L78 117L43.4496 97.5V58.5L78 39Z" stroke="currentColor" strokeWidth="3"/>
          <path d="M78 78L95.7756 87.75V107.25L78 117L60.2244 107.25V87.75L78 78Z" fill="currentColor" stroke="currentColor" strokeWidth="3"/>
        </svg>
      )}
      <span>Sign in with Privy</span>
    </Button>
  );
};

export default PrivyLoginButton;