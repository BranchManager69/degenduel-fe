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
  const { connected, publicKey, signMessage } = useWallet();
  const [authAttempted, setAuthAttempted] = React.useState(false);

  // Auto-authenticate when wallet connects (with proper guards)
  React.useEffect(() => {
    const handleAutoAuth = async () => {
      // Guard: Only try once per wallet connection
      if (connected && publicKey && signMessage && !auth.isAuthenticated && !auth.loading && !authAttempted) {
        console.log('SimpleWalletButton: Auto-authenticating wallet...');
        setAuthAttempted(true); // Prevent retriggering
        
        try {
          const walletAddress = publicKey.toBase58();
          
          // Create the same signature wrapper that ConnectWalletButton uses
          const signMessageWrapper = async (messageToSign: Uint8Array) => {
            if (!signMessage) {
              throw new Error('Wallet signing function not available.');
            }
            const signature = await signMessage(messageToSign);
            return { signature }; 
          };

          await auth.loginWithWallet(walletAddress, signMessageWrapper);
          console.log('SimpleWalletButton: Authentication successful!');
          onLoginComplete?.();
        } catch (error) {
          console.error('SimpleWalletButton: Auto-authentication failed:', error);
          // Don't reset authAttempted - let user manually retry if needed
        }
      }
    };

    handleAutoAuth();
  }, [connected, publicKey, signMessage, auth.isAuthenticated, auth.loading, authAttempted, auth.loginWithWallet, onLoginComplete]);

  // Reset auth attempt when wallet disconnects
  React.useEffect(() => {
    if (!connected) {
      setAuthAttempted(false);
    }
  }, [connected]);

  return (
    <div className={className}>
      <WalletMultiButton 
        style={{
          backgroundColor: 'transparent',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: isCompact ? '4px' : '8px',
          fontSize: isCompact ? '11px' : '16px', 
          height: isCompact ? '24px' : '48px',
          padding: isCompact ? '0 8px' : '0 24px',
          fontWeight: '600',
          transition: 'all 0.3s ease', // Smooth transition when header compacts
          minWidth: isCompact ? '80px' : '160px', // Prevent button from getting too small
        }}
        className={`hover:scale-105 hover:shadow-lg transition-all duration-300 ${
          isCompact ? 'text-xs' : 'text-base'
        }`}
      />
    </div>
  );
};

export default SimpleWalletButton;