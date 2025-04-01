// Mock TwitterLoginButton component
import { FaTwitter } from "react-icons/fa";

/**
 * Mock Twitter Login Button for Storybook
 * This version doesn't use any contexts
 */
const MockTwitterLoginButton = ({ linkMode = false, className = "", onClick = () => {} }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 ${className} bg-[#1DA1F2] hover:bg-[#1a94df] text-white font-medium py-2 px-4 rounded-md transition-colors`}
      aria-label={linkMode ? "Link Twitter Account" : "Login with Twitter"}
    >
      <FaTwitter />
      {linkMode ? "Link Twitter Account" : "Login with Twitter"}
    </button>
  );
};

export default MockTwitterLoginButton;