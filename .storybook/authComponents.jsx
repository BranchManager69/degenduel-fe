import React from 'react';

// Mock Button component for our auth components
const Button = ({ 
  children, 
  variant = "primary", 
  className = "", 
  onClick = () => {},
  ...props
}) => {
  // Styles based on variant
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white';
      case 'secondary':
        return 'bg-dark-300/80 text-white hover:bg-dark-300';
      case 'outline':
        return 'bg-transparent border border-brand-500/30 text-gray-200 hover:border-brand-500/60';
      default:
        return 'bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md flex items-center justify-center transition-all duration-300 ${getVariantClasses()} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Mock Twitter Login Button component
export const MockTwitterLoginButton = ({ 
  linkMode = false, 
  className = "",
  onClick = () => {} 
}) => {
  const handleTwitterAuth = () => {
    console.log('Mock Twitter auth called');
    onClick();
  };

  return (
    <Button
      onClick={handleTwitterAuth}
      variant={linkMode ? "outline" : "secondary"}
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label={linkMode ? "Link Twitter Account" : "Login with Twitter"}
    >
      <svg className="w-5 h-5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.162 5.656a8.384 8.384 0 01-2.402.658A4.196 4.196 0 0021.6 4c-.82.488-1.719.83-2.656 1.015a4.182 4.182 0 00-7.126 3.814 11.874 11.874 0 01-8.62-4.37 4.168 4.168 0 00-.566 2.103c0 1.45.738 2.731 1.86 3.481a4.168 4.168 0 01-1.894-.523v.052a4.185 4.185 0 003.355 4.101 4.21 4.21 0 01-1.89.072A4.185 4.185 0 007.97 16.65a8.394 8.394 0 01-6.191 1.732 11.83 11.83 0 006.41 1.88c7.693 0 11.9-6.373 11.9-11.9 0-.18-.005-.362-.013-.54a8.496 8.496 0 002.087-2.165z" />
      </svg>
      {linkMode ? "Link Twitter Account" : "Login with Twitter"}
    </Button>
  );
};

// Mock Privy Login Button
export const MockPrivyLoginButton = ({ 
  linkMode = false, 
  className = "",
  onClick = () => {} 
}) => {
  const handlePrivyAuth = () => {
    console.log('Mock Privy auth called');
    onClick();
  };

  return (
    <Button
      onClick={handlePrivyAuth}
      variant={linkMode ? "outline" : "primary"}
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label={linkMode ? "Link Privy Account" : "Login with Privy"}
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 156 156" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2"
      >
        <path d="M78 0L145.901 39V117L78 156L10.099 117V39L78 0Z" fill="currentColor" fillOpacity="0.3"/>
        <path d="M78 0L145.901 39V117L78 156L10.099 117V39L78 0Z" stroke="currentColor" strokeWidth="3"/>
        <path d="M78 39L112.55 58.5V97.5L78 117L43.4496 97.5V58.5L78 39Z" stroke="currentColor" strokeWidth="3"/>
      </svg>
      {linkMode ? "Link Email Account" : "Continue with Email"}
    </Button>
  );
};

// Mock Connect Wallet Button
export const MockConnectWalletButton = ({ 
  className = "",
  onClick = () => {} 
}) => {
  const handleWalletConnect = () => {
    console.log('Mock wallet connect called');
    onClick();
  };

  return (
    <Button
      onClick={handleWalletConnect}
      variant="primary"
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label="Connect Wallet"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 7.5V6.75C21 5.51 20.38 4.26 19.5 3.37C18.62 2.49 17.38 2 16.12 2H7.88C6.62 2 5.38 2.49 4.5 3.37C3.62 4.26 3 5.51 3 6.75V17.25C3 19.45 4.8 21.25 7 21.25H17C19.2 21.25 21 19.45 21 17.25V16.5C21.83 16.5 22.5 15.83 22.5 15V9C22.5 8.17 21.83 7.5 21 7.5ZM19.5 8.25V15H15.75C14.5 15 13.5 16 13.5 17.25C13.5 17.87 13.19 18.64 12.03 18.64C10.86 18.64 10.5 17.87 10.5 17.25V11.37C10.5 10.03 9.34 9 8.01 9H4.5V6.75C4.5 6.04 4.8 5.37 5.34 4.87C5.88 4.37 6.62 4.1 7.37 4.1H16.13C16.88 4.1 17.62 4.37 18.16 4.87C18.7 5.37 19 6.04 19 6.75V7.5C19.16 7.5 19.34 7.53 19.5 7.58V8.25Z" fill="currentColor"/>
      </svg>
      Connect Wallet
    </Button>
  );
};

// Mock LoginOptions component with all login options
export const MockLoginOptions = ({ 
  className = "",
  showLinkView = false 
}) => {
  const [isLinking, setIsLinking] = React.useState(false);
  
  // Card components for structure
  const Card = ({ children, className = "" }) => (
    <div className={`rounded-lg overflow-hidden relative border border-brand-500/30 shadow-xl bg-dark-200/70 backdrop-blur-lg ${className}`}>
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(127,0,255,0.15),transparent_70%)]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5"></div>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400/50 via-purple-500/50 to-brand-600/50"></div>
      {children}
    </div>
  );
  
  // Content for linked account view
  const LinkedAccountContent = () => (
    <div>
      <div className="text-center p-6 relative border-b border-brand-500/10">
        <h2 className="text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-purple-300">
          Link Your Account
        </h2>
        <p className="text-gray-300 mt-1">
          Link your social accounts for additional login options
        </p>
      </div>
      
      <div className="p-6 space-y-4">
        <h3 className="text-sm font-medium text-gray-500">Link Social Account</h3>
        <p className="text-xs text-gray-400 mb-2">
          Linking your wallet to a Privy account allows you to log in with email or social accounts in the future.
        </p>
        <button
          onClick={() => setIsLinking(!isLinking)}
          disabled={isLinking}
          className="w-full py-3 px-4 bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white font-medium rounded-md flex items-center justify-center transition-all duration-300 shadow-md"
        >
          {isLinking ? (
            <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full" />
          ) : (
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 156 156" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2"
            >
              <path d="M78 0L145.901 39V117L78 156L10.099 117V39L78 0Z" fill="currentColor" fillOpacity="0.3"/>
              <path d="M78 0L145.901 39V117L78 156L10.099 117V39L78 0Z" stroke="currentColor" strokeWidth="3"/>
              <path d="M78 39L112.55 58.5V97.5L78 117L43.4496 97.5V58.5L78 39Z" stroke="currentColor" strokeWidth="3"/>
            </svg>
          )}
          Link Privy to Wallet
        </button>
      </div>
      
      <div className="px-6 pb-4 text-center text-sm text-gray-400">
        <p>You can skip this step and link accounts later from your profile.</p>
      </div>
    </div>
  );
  
  // Content for all login options
  const LoginOptionsContent = () => (
    <div>
      <div className="text-center p-6 relative border-b border-brand-500/10">
        <h2 className="text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-purple-300">
          Login to DegenDuel
        </h2>
        <p className="text-gray-300 mt-1">
          Connect with your wallet or use a linked social account
        </p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Primary Login Method */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-500">Connect Wallet</h3>
          <div className="relative group overflow-hidden rounded-md">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 via-transparent to-brand-600/20 group-hover:opacity-100 transition-opacity duration-500"></div>
            <MockConnectWalletButton className="w-full py-4" />
          </div>
        </div>

        {/* Alternative Login Methods */}
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700/30"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs font-medium text-gray-400 bg-dark-200 rounded-full">
                or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Twitter Login */}
            <div className="relative p-0.5 bg-gradient-to-r from-[#1DA1F2]/40 to-[#1DA1F2]/80 rounded-md group overflow-hidden shadow-md">
              <div className="absolute inset-0 bg-[#1DA1F2]/10 group-hover:bg-[#1DA1F2]/20 transition-colors duration-300"></div>
              <MockTwitterLoginButton className="w-full h-12 bg-transparent" />
            </div>
            
            {/* Privy Login */}
            <div className="relative p-0.5 bg-gradient-to-r from-purple-500/40 to-brand-500/80 rounded-md group overflow-hidden shadow-md">
              <div className="absolute inset-0 bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors duration-300"></div>
              <MockPrivyLoginButton className="w-full h-12 bg-transparent" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-6 pb-4 text-center text-sm text-gray-400 pt-2 border-t border-brand-500/10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"></div>
        <p>Don't have an account? Connect your wallet to create one instantly.</p>
      </div>
    </div>
  );
  
  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <Card>
        {showLinkView ? <LinkedAccountContent /> : <LoginOptionsContent />}
      </Card>
    </div>
  );
};