import React from "react";
import { useNavigate } from "react-router-dom";

import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";

export const AdminControls: React.FC = () => {
  const { isAdministrator, isSuperAdmin } = useMigratedAuth();
  const navigate = useNavigate();

  if (!isAdministrator) return null;

  return (
    <div className="px-2 pt-2 pb-1">
      <div className="flex gap-1">
        {isAdministrator && (
          <button
            onClick={() => navigate("/admin")}
            className={`
              relative group flex-1 text-center py-2 overflow-hidden transition-all duration-300
              bg-black/80 border border-red-600/50 hover:border-red-500
              text-red-500 hover:text-red-400
              text-xs font-mono uppercase tracking-[0.2em] font-bold
              hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]
              ${isSuperAdmin ? "flex-1" : "w-full"}
            `}
          >
            {/* Matrix-style background */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-red-900/10 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Scan lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(239,68,68,0.03)_50%,transparent_100%)] bg-[length:100%_4px] animate-pulse opacity-60" />
            
            {/* Terminal cursor effect */}
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-1 h-3 bg-red-500 opacity-0 group-hover:opacity-100 animate-pulse" />
            
            <span className="relative">ADMIN</span>
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => navigate("/superadmin")}
            className="relative group flex-1 text-center py-2 overflow-hidden transition-all duration-300
              bg-black/80 border border-amber-600/50 hover:border-amber-500
              text-amber-500 hover:text-amber-400
              text-xs font-mono uppercase tracking-[0.2em] font-bold
              hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
          >
            {/* Matrix-style background */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-amber-900/10 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Scan lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(245,158,11,0.03)_50%,transparent_100%)] bg-[length:100%_4px] animate-pulse opacity-60" />
            
            {/* Terminal cursor effect */}
            <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-1 h-3 bg-amber-500 opacity-0 group-hover:opacity-100 animate-pulse" />
            
            <span className="relative">SUPERADMIN</span>
          </button>
        )}
      </div>

      {/* Separator */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent mt-2" />
    </div>
  );
};
