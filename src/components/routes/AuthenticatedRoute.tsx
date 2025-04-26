import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

interface AuthenticatedRouteProps {
  children: React.ReactNode;
}

export function AuthenticatedRoute({ children }: AuthenticatedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
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
