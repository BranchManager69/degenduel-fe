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
  
  // Create a unique ID for this component instance for debugging
  const instanceId = React.useRef(`SWB-${Math.random().toString(36).substr(2, 9)}`).current;

  // Track when wallet connects
  React.useEffect(() => {
    if (connected && !hasConnected) {
      console.log(`[${instanceId}] Wallet connected, triggering authentication...`);
      setHasConnected(true);
    } else if (!connected && hasConnected) {
      setHasConnected(false);
    }
  }, [connected, hasConnected, instanceId]);

  // Handle authentication after wallet connects
  React.useEffect(() => {
    const authenticate = async () => {
      if (connected && publicKey && signMessage && hasConnected && !auth.isAuthenticated && !isAuthenticating) {
        setIsAuthenticating(true);
        
        try {
          const walletAddress = publicKey.toBase58();
          console.log(`[${instanceId}] SimpleWalletButton: Authenticating wallet...`);
          
          const signMessageWrapper = async (messageToSign: Uint8Array) => {
            if (!signMessage) {
              throw new Error('Wallet signing function not available.');
            }
            const signature = await signMessage(messageToSign);
            return { signature }; 
          };

          await auth.loginWithWallet(walletAddress, signMessageWrapper);
          console.log(`[${instanceId}] SimpleWalletButton: Authentication successful!`);
          onLoginComplete?.();
        } catch (error) {
          console.error(`[${instanceId}] SimpleWalletButton: Authentication failed:`, error);
        } finally {
          setIsAuthenticating(false);
        }
      }
    };

    authenticate();
  }, [connected, publicKey, signMessage, hasConnected, auth.isAuthenticated, auth.loginWithWallet, onLoginComplete, instanceId, isAuthenticating]);

  // Determine the wrapper class based on isCompact prop
  // isCompact=true means header button (small, square)
  // isCompact=false means login page button (large, rounded)
  const wrapperClass = isCompact ? 'header-wallet-button' : 'login-wallet-button w-full';
  
  return (
    <div className={`${wrapperClass} ${className}`}>
      <WalletMultiButton 
        className={isCompact ? 'compact-wallet' : ''}
      />
    </div>
  );
};

export default SimpleWalletButton;