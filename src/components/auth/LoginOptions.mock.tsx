import MockConnectWalletButton from "./ConnectWalletButton.mock";
import MockTwitterLoginButton from "./TwitterLoginButton.mock";

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
  
  return (
    <div className="space-y-2">
      
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
            Connect with your wallet
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
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
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center text-sm text-gray-400 relative pt-2 pb-4 border-t border-brand-500/10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"></div>
          <p className="max-w-xs text-center">Don't have an account? Connect your wallet to create one instantly.</p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MockLoginOptions;