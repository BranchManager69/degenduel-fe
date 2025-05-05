import React from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../hooks/auth/legacy/useAuth";

export const AdminControls: React.FC = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin()) return null;

  return (
    <div className="px-2 pt-2 pb-1">
      <div className="flex gap-1">
        {isAdmin() && (
          <button
            onClick={() => navigate("/admin")}
            className={`
              relative group flex-1 px-3 py-1.5 rounded bg-dark-300/50 overflow-hidden
              ${isSuperAdmin() ? "flex-1" : "w-full"}
            `}
          >
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-brand-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] opacity-0 group-hover:opacity-30 group-hover:animate-shine" />

            {/* Scan line effect */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] animate-scan-fast opacity-0 group-hover:opacity-100" />
            </div>

            {/* Content */}
            <span className="relative text-sm font-cyber text-red-400 group-hover:text-red-300 transition-colors">
              ADMIN
            </span>
          </button>
        )}

        {isSuperAdmin() && (
          <button
            onClick={() => navigate("/superadmin")}
            className="relative group flex-1 px-3 py-1.5 rounded bg-dark-300/50 overflow-hidden"
          >
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/30 via-brand-500/30 to-purple-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] opacity-0 group-hover:opacity-30 group-hover:animate-shine" />

            {/* Scan line effect */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] animate-scan-fast opacity-0 group-hover:opacity-100" />
            </div>

            {/* Content */}
            <span className="relative text-sm font-cyber">
              <span className="bg-gradient-to-r from-red-400 via-brand-400 to-purple-400 bg-clip-text text-transparent group-hover:from-red-300 group-hover:via-brand-300 group-hover:to-purple-300 transition-all duration-300">
                SUPER
              </span>
              <span className="text-red-400 group-hover:text-red-300 transition-colors">
                ADMIN
              </span>
            </span>
          </button>
        )}
      </div>

      {/* Separator */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent mt-2" />
    </div>
  );
};
