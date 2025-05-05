import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";

/**
 * SuperAdminRoute Component
 * 
 * This component is used to protect routes that require super admin privileges.
 * It uses the migrated auth hook which dynamically chooses between the old
 * and new authentication systems based on the feature flag.
 * 
 * When a user is not a super admin and tries to access a super admin route,
 * they are redirected to the home page.
 */
export const SuperAdminRoute: React.FC = () => {
  // Use the migrated auth hook (switches between old and new auth based on feature flag)
  const { isLoading, loading, isAuthenticated, isSuperAdmin } = useMigratedAuth();
  const location = useLocation();
  
  // Use either isLoading or loading (for backward compatibility)
  const isAuthLoading = isLoading || loading;

  // Show loading spinner while authentication state is being determined
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"
          role="status"
          aria-label="Loading"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and has super admin privileges
  const isAuth = isAuthenticated;
  const hasSuperAdminAccess = isAuth && isSuperAdmin;

  // If not super admin, redirect to home
  if (!hasSuperAdminAccess) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If super admin, render the outlet for child routes
  return <Outlet />;
};

export default SuperAdminRoute;