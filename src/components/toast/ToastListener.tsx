import React, { useEffect } from 'react';
import { useToast as useCustomToast } from './ToastContext';

/**
 * ToastListener component
 * 
 * This component listens for global toast events and displays them using the toast context.
 * It's useful for showing toast notifications from non-React code or from deep in the component tree.
 */
export const ToastListener: React.FC = () => {
  const { addToast } = useCustomToast();
  
  useEffect(() => {
    // Handler function for the custom 'show-toast' event
    const handleShowToast = (event: CustomEvent) => {
      const { type, message, title } = event.detail;
      
      if (type && message) {
        addToast(
          type as 'success' | 'error' | 'warning' | 'info', 
          message, 
          title
        );
      } else {
        console.error('ToastListener: Invalid toast event data', event.detail);
      }
    };
    
    // Add event listener
    window.addEventListener('show-toast', handleShowToast as EventListener);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('show-toast', handleShowToast as EventListener);
    };
  }, [addToast]);
  
  // This component doesn't render anything
  return null;
};

export default ToastListener;