import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import React from 'react';

interface SimpleWalletButtonProps {
  className?: string;
  onLoginComplete?: () => void;
  isCompact?: boolean;
}

export const SimpleWalletButton: React.FC<SimpleWalletButtonProps> = ({
  className = '',
  onLoginComplete, // Note: WalletMultiButton handles its own state, this is for consistency with other components
  isCompact = false
}) => {
  // WalletMultiButton handles its own connection state
  // onLoginComplete could be used for additional logic if needed
  React.useEffect(() => {
    // Placeholder for potential future use of onLoginComplete
  }, [onLoginComplete]);

  return (
    <div className={className}>
      <WalletMultiButton 
        style={{
          backgroundColor: 'transparent',
          background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: isCompact ? '4px' : '8px',
          fontSize: isCompact ? '11px' : '14px', 
          height: isCompact ? '24px' : '32px',
          padding: isCompact ? '0 8px' : '0 16px',
          fontWeight: '600',
          transition: 'all 0.3s ease', // Smooth transition when header compacts
          minWidth: isCompact ? '80px' : '120px', // Prevent button from getting too small
        }}
        className={`hover:scale-105 hover:shadow-lg transition-all duration-300 ${
          isCompact ? 'text-xs' : 'text-sm'
        }`}
      />
    </div>
  );
};

export default SimpleWalletButton;