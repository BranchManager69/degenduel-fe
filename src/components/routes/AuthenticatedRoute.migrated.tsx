import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";

/**
 * AuthenticatedRoute Component
 * 
 * This component is used to protect routes that require authentication.
 * It uses the migrated auth hook which dynamically chooses between the old
 * and new authentication systems based on the feature flag.
 * 
 * When a user is not authenticated and tries to access a protected route,
 * they are redirected to the login page.
 */
export const AuthenticatedRoute: React.FC = () => {
  // Use the migrated auth hook (switches between old and new auth based on feature flag)
  const { isLoading, loading, isAuthenticated } = useMigratedAuth();
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

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Store the path they were trying to access for post-login redirect
    if (location.pathname && location.pathname !== '/') {
      localStorage.setItem("auth_redirect_path", location.pathname);
    }
    
    // Navigate to login page with state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the outlet for child routes
  return <Outlet />;
};

export default AuthenticatedRoute;