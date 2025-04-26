// Mock PrivyLoginButton component

/**
 * Mock Privy Login Button for Storybook
 * This version doesn't use any contexts
 */
const MockPrivyLoginButton = ({ className = "", onClick = () => {} }) => {
  return (
    <button
      className={`flex items-center justify-center space-x-2 ${className} border border-brand-500/30 bg-dark-300/40 text-gray-300 hover:bg-brand-500/20 hover:text-white rounded-md py-2 px-4 transition-colors`}
      onClick={onClick}
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 156 156" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="mr-2"
      >
        <path d="M78 0L145.901 39V117L78 156L10.099 117V39L78 0Z" fill="currentColor" fillOpacity="0.1"/>
        <path d="M78 0L145.901 39V117L78 156L10.099 117V39L78 0Z" stroke="currentColor" strokeWidth="3"/>
        <path d="M78 39L112.55 58.5V97.5L78 117L43.4496 97.5V58.5L78 39Z" stroke="currentColor" strokeWidth="3"/>
        <path d="M78 78L95.7756 87.75V107.25L78 117L60.2244 107.25V87.75L78 78Z" fill="currentColor" stroke="currentColor" strokeWidth="3"/>
      </svg>
      <span>Sign in with Privy</span>
    </button>
  );
};

export default MockPrivyLoginButton;