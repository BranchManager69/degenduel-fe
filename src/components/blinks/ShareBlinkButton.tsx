import React, { useState } from 'react';

interface ShareBlinkButtonProps {
  blinkUrl: string;
  params?: Record<string, string>;
  className?: string;
  label?: string;
  iconClassName?: string;
}

export const ShareBlinkButton: React.FC<ShareBlinkButtonProps> = ({
  blinkUrl,
  params = {},
  className = '',
  label = 'Share',
  iconClassName = ''
}) => {
  const [copied, setCopied] = useState(false);
  
  // Construct the complete blink URL
  const fullBlinkUrl = React.useMemo(() => {
    const url = new URL(blinkUrl, window.location.origin);
    
    // Add params to the URL
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    return url.toString();
  }, [blinkUrl, params]);
  
  const handleShare = async () => {
    // Try to use the native share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DegenDuel Blink',
          text: 'Check out this DegenDuel action!',
          url: fullBlinkUrl
        });
        return;
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
    
    // Fallback to clipboard copy
    try {
      await navigator.clipboard.writeText(fullBlinkUrl);
      setCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };
  
  return (
    <button
      className={`flex items-center space-x-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors ${className}`}
      onClick={handleShare}
    >
      <span>{copied ? 'Copied!' : label}</span>
      <svg 
        className={`w-4 h-4 ${iconClassName}`} 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
      </svg>
    </button>
  );
};