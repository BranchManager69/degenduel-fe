import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/UnifiedAuthContext";

/**
 * Route guard that only allows authenticated users to access protected routes.
 * If user is not authenticated, redirects to login page and preserves the
 * intended destination for post-login redirect.
 */
export const AuthenticatedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
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

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Store the path they were trying to access for post-login redirect
    if (location.pathname && location.pathname !== '/') {
      localStorage.setItem("auth_redirect_path", location.pathname);
    }
    
    // Navigate to login page with state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected route
  return <Outlet />;
};

export default AuthenticatedRoute;