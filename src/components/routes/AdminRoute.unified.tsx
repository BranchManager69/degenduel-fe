import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";

/**
 * Route guard that only allows admin users to access admin routes.
 * If user is not an admin, redirects to the home page.
 */
export const AdminRoute: React.FC = () => {
  const { isAuthenticated, isLoading, isAdministrator } = useMigratedAuth();
  const location = useLocation();

  // Show loading spinner while authentication state is being determined
  if (isLoading) {
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

  // Check if user is authenticated and has admin privileges
  // We now use the isAdmin property directly from the migrated auth hook
  const hasAdminRole = isAuthenticated && isAdministrator;

  // If not admin, redirect to home
  if (!hasAdminRole) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If admin, render the protected route
  return <Outlet />;
};

export default AdminRoute;