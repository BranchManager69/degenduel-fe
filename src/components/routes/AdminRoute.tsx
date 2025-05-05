import { Navigate, useLocation } from "react-router-dom";
import React from 'react';
import { useAuth } from "../../hooks/useAuth";

/**
 * @deprecated Use the AdminRoute from AdminRoute.unified.tsx instead
 */
interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  // Log deprecation warning
  React.useEffect(() => {
    console.warn(
      "%c[DEPRECATED] AdminRoute is deprecated and will be replaced in the next release. " +
      "Please use the AdminRoute from AdminRoute.unified.tsx instead. " +
      "See UNIFIED_AUTH_SYSTEM_README.md and src/AUTH_MIGRATION_PLAN.md for detailed migration instructions.",
      "color: red; font-weight: bold; background-color: yellow; padding: 2px 4px;"
    );
  }, []);

  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
