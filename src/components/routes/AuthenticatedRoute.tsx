import React from 'react';
import { Navigate, useLocation } from "react-router-dom";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";

/**
 * @deprecated Use the AuthenticatedRoute from AuthenticatedRoute.unified.tsx instead
 */
interface AuthenticatedRouteProps {
  children: React.ReactNode;
}

export function AuthenticatedRoute({ children }: AuthenticatedRouteProps) {
  // Log deprecation warning
  React.useEffect(() => {
    console.warn(
      "%c[DEPRECATED] AuthenticatedRoute is deprecated and will be replaced in the next release. " +
      "Please use the AuthenticatedRoute from AuthenticatedRoute.unified.tsx instead. " +
      "See UNIFIED_AUTH_SYSTEM_README.md and src/AUTH_MIGRATION_PLAN.md for detailed migration instructions.",
      "color: red; font-weight: bold; background-color: yellow; padding: 2px 4px;"
    );
  }, []);

  const { user, isLoading, loading } = useMigratedAuth();
  const location = useLocation();

  // Use either isLoading or loading (for backward compatibility)
  const isAuthLoading = isLoading || loading;
  
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

  if (!user) {
    // Store the path they were trying to access in localStorage
    // This makes it available even after social auth redirects
    if (location.pathname && location.pathname !== '/') {
      localStorage.setItem("auth_redirect_path", location.pathname);
    }
    
    // Navigate to login page with state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
