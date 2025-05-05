// src/components/templates/PageRegistry.tsx
// Component to render admin pages from the registry

import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AdminPageDefinition } from "../../config/adminPages";

interface PageRegistrySectionProps {
  title: string;
  pages: AdminPageDefinition[];
  selectedSection: string | null;
  setSelectedSection: (id: string | null) => void;
}

export const PageRegistrySection: React.FC<PageRegistrySectionProps> = ({
  title, 
  pages,
  selectedSection
}) => {
  
  if (pages.length === 0) return null;
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-display mb-3 relative group">
        <span className={`bg-gradient-to-r from-${pages[0]?.color || 'brand'}-400 to-${pages[0]?.color || 'brand'}-600 bg-clip-text text-transparent animate-gradientX`}>
          {title}
        </span>
        <span className={`absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-${pages[0]?.color || 'brand'}-400 to-${pages[0]?.color || 'brand'}-600 transform opacity-0 group-hover:opacity-100 transition-opacity`}></span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pages.map((page) => (
          <motion.div
            key={page.id}
            className={`
              bg-dark-200/75 backdrop-blur-lg border-2
              ${
                selectedSection === page.id
                  ? `border-${page.color}-500/60 shadow-lg shadow-${page.color}-500/20`
                  : `border-${page.color}-500/40 hover:border-${page.color}-500/60`
              }
              p-4 relative group overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-${page.color}-500/20
            `}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            {/* Scanner line effect */}
            <div className={`absolute inset-0 h-px w-full bg-${page.color}-500/30 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out`}></div>
            
            {page.isNew && (
              <div className="absolute -top-2 -right-2 z-10">
                <div className="px-2 py-0.5 text-xs font-bold rounded-md bg-brand-500/30 text-brand-100 font-mono">
                  NEW
                </div>
              </div>
            )}
            
            {/* Card content rendering */}
            <Link to={page.path} className="block h-full">
              <div className="flex items-center mb-3">
                <div className={`text-2xl text-${page.color}-300 mr-3 group-hover:scale-110 transition-transform duration-300`}>
                  {page.icon}
                </div>
                <h3 className={`text-lg font-bold text-${page.color}-300 font-display tracking-wide`}>
                  {page.title}
                </h3>
              </div>
              
              {/* Divider that matches the card's color theme */}
              <div className={`w-1/3 h-px bg-gradient-to-r from-${page.color}-500/70 to-transparent mb-3`}></div>
              
              {/* Enhanced description with better formatting */}
              <p className="text-gray-300 text-sm font-mono">
                <span className={`text-${page.color}-200`}>→</span> {page.description}
              </p>
              
              {/* Corner accent - sharper edge */}
              <div className="absolute -bottom-0 -right-0 w-8 h-8">
                <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-${page.color}-500/70`}></div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};