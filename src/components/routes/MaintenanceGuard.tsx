// src/components/routes/MaintenanceGuard.tsx

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useStore } from "../../store/useStore";

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({
  children,
}) => {
  const { maintenanceMode } = useStore();
  const { isAdmin } = useAuth();

  // If maintenance mode is active and user is not an admin, redirect to maintenance page
  if (maintenanceMode && !isAdmin()) {
    return <Navigate to="/maintenance" replace />;
  }

  // Otherwise, render the children
  return <>{children}</>;
};
