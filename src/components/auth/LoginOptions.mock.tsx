import React from 'react';
import MockConnectWalletButton from "./ConnectWalletButton.mock";
import MockTwitterLoginButton from "./TwitterLoginButton.mock";
import MockPrivyLoginButton from "./PrivyLoginButton.mock";

// Simpler UI components that don't depend on external libraries
const Card = ({ className = "", children }: { className?: string; children: any }) => (
  <div className={`bg-dark-200/70 backdrop-blur-lg border border-brand-500/30 shadow-xl rounded-md overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ className = "", children }: { className?: string; children: any }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ className = "", children }: { className?: string; children: any }) => (
  <h2 className={`text-2xl font-bold ${className}`}>
    {children}
  </h2>
);

const CardDescription = ({ className = "", children }: { className?: string; children: any }) => (
  <p className={`text-gray-300 mt-1 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ className = "", children }: { className?: string; children: any }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ className = "", children }: { className?: string; children: any }) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

const Divider = ({ children }: { children: any }) => (
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-700/30"></div>
    </div>
    <div className="relative flex justify-center">
      {children}
    </div>
  </div>
);

/**
 * Login Options Component - Mock version for Storybook
 * This version doesn't use any external contexts
 */
const MockLoginOptions = () => {
  const [isLinking, setIsLinking] = React.useState(false);
  const [showLinkPrivy, setShowLinkPrivy] = React.useState(false); // Toggle with a button for demo
  
  return (
    <div className="space-y-2">
      {/* Demo toggle - only for storybook */}
      <button 
        onClick={() => setShowLinkPrivy(!showLinkPrivy)}
        className="text-xs text-gray-400 hover:text-white bg-dark-300/50 rounded px-2 py-1 mb-2"
      >
        Toggle Link Mode (Storybook only)
      </button>
      
      <Card className="w-full max-w-md mx-auto relative">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(127,0,255,0.15),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-400/5 via-transparent to-brand-600/5"></div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-400/50 via-purple-500/50 to-brand-600/50"></div>
        
        <CardHeader className="text-center relative">
          <CardTitle className="text-2xl font-cyber bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-purple-300">
            Login to DegenDuel
          </CardTitle>
          <CardDescription>
            {showLinkPrivy 
              ? "Link your social accounts for additional login options" 
              : "Connect with your wallet or use a linked social account"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* If user is logged in with wallet but Privy isn't linked, show link option */}
          {showLinkPrivy ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500">Link Social Account</h3>
              <p className="text-xs text-gray-400 mb-2">
                Linking your wallet to a Privy account allows you to log in with email or social accounts in the future.
              </p>
              <button
                onClick={() => setIsLinking(!isLinking)}
                disabled={isLinking}
                className="w-full py-3 px-4 bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white font-cyber rounded-md flex items-center justify-center transition-all duration-300 shadow-md"
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
          ) : (
            <>
              {/* Primary Login Method */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-500">Connect Wallet</h3>
                <div className="relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-400/20 via-transparent to-brand-600/20 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <MockConnectWalletButton className="w-full py-4" />
                </div>
              </div>

              {/* Alternative Login Methods */}
              <div className="space-y-4">
                <Divider>
                  <span className="px-3 text-xs font-semibold text-gray-400 bg-dark-200 rounded-full">
                    or continue with
                  </span>
                </Divider>

                <div className="grid grid-cols-1 gap-3">
                  {/* Twitter Login */}
                  <div className="relative p-0.5 bg-gradient-to-r from-[#1DA1F2]/40 to-[#1DA1F2]/80 rounded-md group overflow-hidden shadow-md">
                    <div className="absolute inset-0 bg-[#1DA1F2]/10 group-hover:bg-[#1DA1F2]/20 transition-colors duration-300"></div>
                    <MockTwitterLoginButton className="w-full h-12 bg-transparent" />
                  </div>
                  
                  {/* Privy Login */}
                  <div className="relative p-0.5 bg-gradient-to-r from-purple-500/40 to-brand-500/80 rounded-md group overflow-hidden shadow-md">
                    <div className="absolute inset-0 bg-brand-500/10 group-hover:bg-brand-500/20 transition-colors duration-300"></div>
                    <MockPrivyLoginButton className="w-full h-12 bg-transparent border-0" />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-center text-sm text-gray-400 relative pt-2 pb-4 border-t border-brand-500/10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"></div>
          {showLinkPrivy ? (
            <p className="max-w-xs text-center">You can skip this step and link accounts later from your profile.</p>
          ) : (
            <p className="max-w-xs text-center">Don't have an account? Connect your wallet to create one instantly.</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default MockLoginOptions;