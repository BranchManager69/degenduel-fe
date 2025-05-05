// AuthDebugPanel.tsx
import React from 'react';
import { useAuth } from '../../hooks/auth/legacy/useAuth';

interface AuthDebugPanelProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'floating';
  showByDefault?: boolean;
}

/**
 * Auth Debug Panel - A reusable component for debugging authentication state
 * 
 * @example
 * // Basic usage - shows when ?debug_auth is in URL
 * <AuthDebugPanel />
 * 
 * @example
 * // Always visible
 * <AuthDebugPanel showByDefault={true} />
 * 
 * @example
 * // Different position
 * <AuthDebugPanel position="bottom-right" />
 */
export const AuthDebugPanel: React.FC<AuthDebugPanelProps> = ({ 
  position = 'top-right',
  showByDefault = false
}) => {
  const { 
    isAuthenticated, 
    isWalletConnected,
    isFullyConnected, 
    activeAuthMethod, 
    authMethods,
    walletAddress,
    user
  } = useAuth();

  const [isVisible, setIsVisible] = React.useState(showByDefault);
  
  // Check URL for debug parameter
  React.useEffect(() => {
    if (showByDefault) {
      setIsVisible(true);
      return;
    }
    
    // Parse URL params to check for debug flag
    const params = new URLSearchParams(window.location.search);
    if (params.has('debug_auth')) {
      setIsVisible(true);
    }
  }, [showByDefault]);

  // Toggle visibility with keyboard shortcut (Ctrl+Shift+A)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!isVisible) return null;

  // Position classes
  const positionClasses = {
    'top-right': 'fixed top-20 right-4',
    'top-left': 'fixed top-20 left-4',
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'floating': 'absolute top-4 right-4'
  };

  return (
    <div className={`${positionClasses[position]} z-50 p-4 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg text-xs w-80 shadow-lg transition-all duration-300`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-yellow-400">Auth Debug Panel</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white text-xs px-2 rounded hover:bg-gray-700"
          >
            Hide
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-1">
        <p><span className="text-gray-400">Authenticated:</span> {isAuthenticated() ? '✅' : '❌'}</p>
        <p><span className="text-gray-400">Wallet Connected:</span> {isWalletConnected ? '✅' : '❌'}</p>
        <p><span className="text-gray-400">Fully Connected:</span> {isFullyConnected() ? '✅' : '❌'}</p>
        <p><span className="text-gray-400">Active Method:</span> {activeAuthMethod || 'none'}</p>
        <p><span className="text-gray-400">Wallet Address:</span> {walletAddress ? walletAddress.substring(0, 8) + '...' : 'none'}</p>
        
        {user && (
          <div className="mt-2">
            <p className="text-gray-400 font-bold">User Info:</p>
            <div className="bg-gray-900/50 p-2 rounded mt-1 text-[10px]">
              <p><span className="text-gray-500">ID:</span> {user.id}</p>
              <p><span className="text-gray-500">Nickname:</span> {user.nickname}</p>
              <p><span className="text-gray-500">Role:</span> {user.role}</p>
            </div>
          </div>
        )}
        
        <div className="mt-2">
          <p className="text-gray-400 font-bold">Auth Methods:</p>
          <pre className="overflow-x-auto bg-gray-900/50 p-2 rounded mt-1 text-[10px] max-h-40 overflow-y-auto">
            {JSON.stringify(authMethods, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-2 text-gray-500 text-[10px]">
        <p>Toggle with Ctrl+Shift+A or ?debug_auth in URL</p>
      </div>
    </div>
  );
};

export default AuthDebugPanel;