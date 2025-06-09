import React from 'react';
import { useMigratedAuth } from '../../hooks/auth/useMigratedAuth';
import BiometricAuthButton from './BiometricAuthButton';
import DiscordLoginButton from './DiscordLoginButton';
import TelegramLoginButton from './TelegramLoginButton';
import TwitterLoginButton from './TwitterLoginButton';

interface SocialAuthPanelProps {
  mode: 'login' | 'link';
  className?: string;
  onComplete?: () => void;
  layout?: 'horizontal' | 'vertical' | 'grid';
}

export const SocialAuthPanel: React.FC<SocialAuthPanelProps> = ({
  mode,
  className = '',
  onComplete,
  layout = 'horizontal'
}) => {
  const { isAuthenticated, isTwitterLinked, isTelegramLinked } = useMigratedAuth();
  
  // Determine if we should show buttons based on mode and auth status
  const shouldShow = mode === 'login' ? !isAuthenticated : isAuthenticated;
  
  if (!shouldShow) return null;

  const layoutClasses = {
    horizontal: 'flex flex-row gap-3',
    vertical: 'flex flex-col gap-3',
    grid: 'grid grid-cols-4 gap-3'
  };

  const buttonSize = layout === 'grid' ? 'w-full aspect-square' : 'px-4 py-2';

  return (
    <div className={`${layoutClasses[layout]} ${className}`}>
      {/* Twitter */}
      <div className="relative">
        <TwitterLoginButton
          linkMode={mode === 'link'}
          className={`${buttonSize} bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white border-0 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2`}
          onClick={() => onComplete?.()}
        />
        {mode === 'link' && isTwitterLinked() && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>

      {/* Discord */}
      <div className="relative">
        <DiscordLoginButton
          linkMode={mode === 'link'}
          className={`${buttonSize} bg-[#5865F2] hover:bg-[#4752c4] text-white border-0 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2`}
          onClick={() => onComplete?.()}
        />
      </div>

      {/* Telegram */}
      <div className="relative">
        <TelegramLoginButton
          linkMode={mode === 'link'}
          className={`${buttonSize} bg-[#0088cc] hover:bg-[#006ba3] text-white border-0 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2`}
          onSuccess={() => onComplete?.()}
        />
        {mode === 'link' && isTelegramLinked() && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>

      {/* Passkey */}
      <div className="relative">
        <BiometricAuthButton
          mode={mode === 'link' ? 'register' : 'authenticate'}
          className={`${buttonSize} bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2`}
          buttonStyle={layout === 'grid' ? 'icon-only' : 'default'}
          onSuccess={() => onComplete?.()}
          onError={(error) => console.error('Passkey error:', error)}
        />
      </div>
    </div>
  );
};

export default SocialAuthPanel;