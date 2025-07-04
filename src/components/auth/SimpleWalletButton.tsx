import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import React from 'react';
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';

interface SimpleWalletButtonProps {
  className?: string;
  onLoginComplete?: () => void;
  isCompact?: boolean;
}

export const SimpleWalletButton: React.FC<SimpleWalletButtonProps> = ({
  className = '',
  onLoginComplete,
  isCompact = false
}) => {
  const auth = useMigratedAuth();
  const { publicKey, connected, signMessage } = useWallet();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  const [hasConnected, setHasConnected] = React.useState(false);
  const [authAttempts, setAuthAttempts] = React.useState(0);
  const [authError, setAuthError] = React.useState<string | null>(null);
  
  // Create a unique ID for this component instance for debugging
  const instanceId = React.useRef(`SWB-${Math.random().toString(36).substr(2, 9)}`).current;

  // Track when wallet connects
  React.useEffect(() => {
    if (connected && !hasConnected) {
      console.log(`[${instanceId}] Wallet connected, triggering authentication...`);
      setHasConnected(true);
      setAuthAttempts(0); // Reset attempts on new connection
      setAuthError(null);
    } else if (!connected && hasConnected) {
      setHasConnected(false);
      setAuthAttempts(0); // Reset attempts on disconnect
      setAuthError(null);
    }
  }, [connected, hasConnected, instanceId]);

  // Handle authentication after wallet connects
  React.useEffect(() => {
    const authenticate = async () => {
      // Max 3 attempts before giving up
      if (authAttempts >= 3) {
        console.error(`[${instanceId}] SimpleWalletButton: Max auth attempts reached. Server may be down.`);
        setAuthError('Server is temporarily offline');
        return;
      }

      if (connected && publicKey && signMessage && hasConnected && !auth.isAuthenticated && !isAuthenticating) {
        setIsAuthenticating(true);
        
        try {
          const walletAddress = publicKey.toBase58();
          console.log(`[${instanceId}] SimpleWalletButton: Authenticating wallet... (attempt ${authAttempts + 1}/3)`);
          
          const signMessageWrapper = async (messageToSign: Uint8Array) => {
            if (!signMessage) {
              throw new Error('Wallet signing function not available.');
            }
            const signature = await signMessage(messageToSign);
            return { signature }; 
          };

          await auth.loginWithWallet(walletAddress, signMessageWrapper);
          console.log(`[${instanceId}] SimpleWalletButton: Authentication successful!`);
          setAuthError(null);
          onLoginComplete?.();
        } catch (error: any) {
          console.error(`[${instanceId}] SimpleWalletButton: Authentication failed:`, error);
          setAuthAttempts(prev => prev + 1);
          
          // Check if it's a server error
          if (error?.code === 'ERR_BAD_RESPONSE' || error?.response?.status >= 500) {
            setAuthError('Server is temporarily offline');
          }
        } finally {
          setIsAuthenticating(false);
        }
      }
    };

    authenticate();
  }, [connected, publicKey, signMessage, hasConnected, auth.isAuthenticated, auth.loginWithWallet, onLoginComplete, instanceId, isAuthenticating, authAttempts]);

  // Determine the wrapper class based on isCompact prop
  // isCompact=true means header button (small, square)
  // isCompact=false means login page button (large, rounded)
  const wrapperClass = isCompact ? 'header-wallet-button' : 'login-wallet-button w-full';
  
  return (
    <div className={`${wrapperClass} ${className}`}>
      <WalletMultiButton 
        className={isCompact ? 'compact-wallet' : ''}
      />
      {authError && !isCompact && (
        <div className="mt-2 text-sm text-red-400 text-center">
          {authError}
        </div>
      )}
    </div>
  );
};

export default SimpleWalletButton;