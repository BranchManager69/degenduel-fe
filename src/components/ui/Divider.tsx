import React, { ReactNode } from 'react';

interface DividerProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Divider component with optional text content
 * Used for separating sections with an optional label in the middle
 */
export const Divider: React.FC<DividerProps> = ({ children, className = '' }) => {
  // If there are no children, render a simple divider
  if (!children) {
    return (
      <div className={`h-px bg-gray-200 dark:bg-gray-700 my-4 ${className}`} />
    );
  }

  // If there are children, render a divider with content in the center
  return (
    <div className={`relative flex items-center py-2 ${className}`}>
      <div className="flex-grow border-t border-gray-700/30"></div>
      <div className="px-2 text-gray-400 text-xs">{children}</div>
      <div className="flex-grow border-t border-gray-700/30"></div>
    </div>
  );
};