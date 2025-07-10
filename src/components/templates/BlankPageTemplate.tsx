import { motion } from "framer-motion";
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

interface BlankPageTemplateProps {
  title: string;
  subtitle?: string;
}

export const BlankPageTemplate: React.FC<BlankPageTemplateProps> = ({ title, subtitle }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative z-10 container mx-auto px-4 py-8"
      >
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-400 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Main Content Area */}
        <div className="space-y-8">
          {/* Content Section 1 */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
            <h2 className="text-2xl font-bold text-white mb-4">Section Title</h2>
            <p className="text-gray-400">
              Your content goes here. This is a simple container with the semi-transparent background effect.
            </p>
          </div>

          {/* Content Section 2 - Grid Example */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3">Grid Item 1</h3>
              <p className="text-gray-400">Content for grid item 1</p>
            </div>
            
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3">Grid Item 2</h3>
              <p className="text-gray-400">Content for grid item 2</p>
            </div>
          </div>

          {/* Action Buttons Example */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-4">
            <Link to="/">
              <Button variant="secondary" size="md">
                Secondary Action
              </Button>
            </Link>
            <Link to="/">
              <Button variant="primary" size="md">
                Primary Action
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Example usage for creating a new page
export const ExamplePage: React.FC = () => {
  return (
    <BlankPageTemplate 
      title="Example Page" 
      subtitle="This is an example of how to use the blank page template"
    />
  );
};