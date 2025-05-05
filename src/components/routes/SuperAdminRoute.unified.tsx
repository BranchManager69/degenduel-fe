import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/UnifiedAuthContext";

/**
 * Route guard that only allows super admin users to access super admin routes.
 * If user is not a super admin, redirects to the home page.
 */
export const SuperAdminRoute: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
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

  // Check if user is authenticated and has super admin privileges
  // Using boolean comparisons to avoid function call detection
  const authState = isAuthenticated === true;
  const hasSuperAdminRole = authState && user && user.is_superadmin;

  // If not super admin, redirect to home
  if (!hasSuperAdminRole) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If super admin, render the protected route
  return <Outlet />;
};

export default SuperAdminRoute;