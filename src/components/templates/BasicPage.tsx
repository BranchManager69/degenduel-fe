// src/components/templates/BasicPage.tsx
// Template for simple admin pages

import React from "react";

interface BasicPageProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

const BasicPage: React.FC<BasicPageProps> = ({ title, description, children }) => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="relative group">
        <h1 className="text-3xl font-display text-gray-100 relative">
          <span className="bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent animate-gradientX">
            {title}
          </span>
          <span className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-brand-400 to-cyber-400 transform opacity-0 group-hover:opacity-100 transition-opacity"></span>
        </h1>
        {description && (
          <p className="text-gray-400 mt-2 font-mono text-sm">
            {description}
            <span className="inline-block ml-1 w-2 h-4 bg-brand-500 opacity-80 animate-pulse"></span>
          </p>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-dark-200/50 backdrop-blur-lg p-6 rounded-lg border border-brand-500/20">
        {children || (
          <div className="text-gray-300 font-mono">
            <p>This is a basic template page. Add your content here.</p>
            <p className="mt-4 text-gray-400">
              Configure this page in <code className="bg-dark-300/50 px-2 rounded">src/config/adminPages.ts</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BasicPage;