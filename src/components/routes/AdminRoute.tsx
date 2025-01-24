import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
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
