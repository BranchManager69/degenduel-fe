// src/pages/admin/AdminDashboardExample.tsx
// Example of how to integrate the page registry
// NOTE: This is an alternative implementation and doesn't replace the current AdminDashboard
// It shows how to use the registry system

import React, { useState } from "react";

import AdminLogsPanel from "../../components/admin/AdminLogsPanel";
import { PageRegistrySection } from "../../components/templates";
import { LazyLoad } from "../../components/shared/LazyLoad";
import { adminPages, AdminPageDefinition } from "../../config/adminPages";

// Group pages by category
function groupPagesByCategory(pages: AdminPageDefinition[]): Record<string, AdminPageDefinition[]> {
  return pages.reduce((acc, page) => {
    if (!page.superAdminOnly) { // Filter out superadmin-only pages
      if (!acc[page.category]) {
        acc[page.category] = [];
      }
      acc[page.category].push(page);
    }
    return acc;
  }, {} as Record<string, AdminPageDefinition[]>);
}

export const AdminDashboardExample: React.FC = () => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  // Group pages by category
  const pagesByCategory = groupPagesByCategory(adminPages);
  
  return (
    <div data-testid="admin-dashboard-example">
      <div className="container mx-auto p-6 space-y-8 relative z-10">
        {/* Header with animated gradient */}
        <div className="flex items-center justify-between">
          <div className="relative group">
            <h1 className="text-3xl font-display text-gray-100 relative">
              <span className="bg-gradient-to-r from-brand-400 to-cyber-400 bg-clip-text text-transparent animate-gradientX">
                Admin Control Center
              </span>
              <span className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-brand-400 to-cyber-400 transform opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </h1>
            <p className="text-gray-400 mt-2 font-mono text-sm">
              System management and monitoring interface
              <span className="inline-block ml-1 w-2 h-4 bg-brand-500 opacity-80 animate-pulse"></span>
            </p>
          </div>
        </div>

        {/* Dashboard Layout - main content and admin logs panel */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content - 75% width on desktop */}
          <div className="lg:col-span-3 space-y-6">
            {/* Render each category section */}
            {Object.entries(pagesByCategory).map(([category, pages]) => (
              <LazyLoad 
                key={category}
                placeholder={
                  <div className="mb-8">
                    <div className="animate-pulse bg-dark-300/30 h-8 w-48 rounded mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse bg-dark-200/40 h-40 rounded-lg border border-blue-500/10"></div>
                      ))}
                    </div>
                  </div>
                }
                rootMargin="200px"
              >
                <PageRegistrySection 
                  title={category} 
                  pages={pages}
                  selectedSection={selectedSection}
                  setSelectedSection={setSelectedSection}
                />
              </LazyLoad>
            ))}
          </div>

          {/* Admin Logs Panel - 25% width on desktop, full width on mobile */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6 max-h-screen overflow-hidden">
              <LazyLoad
                placeholder={
                  <div className="animate-pulse">
                    <div className="bg-dark-300/30 h-10 w-full rounded-t-lg"></div>
                    <div className="bg-dark-200/40 p-4 rounded-b-lg space-y-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-dark-300/20 h-16 rounded"></div>
                      ))}
                    </div>
                  </div>
                }
                rootMargin="50px" // Smaller margin as this is typically visible at page load
              >
                <AdminLogsPanel />
              </LazyLoad>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};