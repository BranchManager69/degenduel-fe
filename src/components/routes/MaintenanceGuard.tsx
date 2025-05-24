// src/components/routes/MaintenanceGuard.tsx

import React from "react";
import { Navigate } from "react-router-dom";

import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { useStore } from "../../store/useStore";

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({
  children,
}) => {
  const { maintenanceMode } = useStore();
  const { isAdministrator } = useMigratedAuth();

  // If in maintenance mode and not admin, redirect to maintenance page
  if (maintenanceMode && !isAdministrator) {
    return <Navigate to="/maintenance" replace />;
  }

  return <>{children}</>;
};
