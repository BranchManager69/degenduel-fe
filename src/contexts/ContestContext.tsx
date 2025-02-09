import React, { createContext, useContext, useState } from "react";
import { ddApi } from "../services/dd-api";
import { useStore } from "../store/useStore";

export const ContestContext = createContext<any>(null);

export const ContestProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { maintenanceMode } = useStore();

  const refreshContests = async () => {
    try {
      // Skip fetching if in maintenance mode
      if (maintenanceMode) {
        setContests([]);
        setLoading(false);
        return;
      }

      const response = await ddApi.contests.getAll();
      const contests = Array.isArray(response) ? response : [];
      setContests(contests);
    } catch (err: any) {
      if (err?.status === 503 || err?.message?.includes("503")) {
        // Handle maintenance mode transition
        setContests([]);
      } else {
        console.error("Failed to refresh contests:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContestContext.Provider value={{ contests, loading, refreshContests }}>
      {children}
    </ContestContext.Provider>
  );
};

export const useContests = () => {
  const context = useContext(ContestContext);
  if (!context) {
    throw new Error("useContests must be used within a ContestProvider");
  }
  return context;
};
