// Mock ConnectWalletButton component

/**
 * Mock Connect Wallet Button for Storybook
 * This version doesn't use any contexts
 */
const MockConnectWalletButton = ({
  className = "",
  compact = false,
  onClick = () => {},
}) => {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 
        text-white font-medium transition-all duration-300 rounded-md
        ${
          compact
            ? "text-xs sm:text-sm py-1 sm:py-1.5 px-2 sm:px-3"
            : "text-sm sm:text-base py-1.5 sm:py-2 px-3 sm:px-4"
        } ${className}`}
    >
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2">
          <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15 8H9V6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8Z" fill="currentColor"/>
        </svg>
        <span>Connect Wallet</span>
      </div>
    </button>
  );
};

export default MockConnectWalletButton;