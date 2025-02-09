// src/components/routes/MaintenanceGuard.tsx

import React from "react";
import { Navigate } from "react-router-dom";
import { useStore } from "../../store/useStore";

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({
  children,
}) => {
  const { maintenanceMode, user } = useStore();

  // Allow admin and superadmin users to bypass maintenance mode
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  // If in maintenance mode and not admin, redirect to maintenance page
  if (maintenanceMode && !isAdmin) {
    return <Navigate to="/maintenance" replace />;
  }

  return <>{children}</>;
};
