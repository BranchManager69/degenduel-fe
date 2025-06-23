import React, { createContext, useContext, useEffect, useState } from "react";

import { Contest } from "./types";

interface ContestContextType {
  contests: Contest[];
  loading: boolean;
  error: any;
  refreshContests: () => Promise<void>;
  selectedContest: Contest | null;
  setSelectedContest: (contest: Contest | null) => void;
}

const ContestContext = createContext<ContestContextType | undefined>(undefined);

export function ContestProvider({ children }: { children: React.ReactNode }) {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);

  const refreshContests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("https://degenduel.me/api/contests?limit=1000");

      if (response.status === 503) {
        // Handle maintenance mode
        setContests([]);
        return;
      }

      const data = await response.json();
      if (!response.ok) throw data;
      setContests(Array.isArray(data.contests) ? data.contests : []);
    } catch (err) {
      setError(err);
      console.error("Error fetching contests:", err);
      setContests([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshContests();
  }, []);

  return (
    <ContestContext.Provider
      value={{
        contests,
        loading,
        error,
        refreshContests,
        selectedContest,
        setSelectedContest,
      }}
    >
      {children}
    </ContestContext.Provider>
  );
}

export function useContests() {
  const context = useContext(ContestContext);
  if (context === undefined) {
    throw new Error("useContests must be used within a ContestProvider");
  }
  return context;
}

export function ContestSelect({
  value,
  onChange,
  className = "",
}: {
  value: number | "";
  onChange: (id: number | "") => void;
  className?: string;
}) {
  const { contests, loading, error } = useContests();

  if (loading) {
    return (
      <select className={className} disabled>
        <option>Loading contests...</option>
      </select>
    );
  }

  if (error) {
    // Check if it's a maintenance mode error (503)
    if (error.status === 503) {
      return (
        <select className={className} disabled>
          <option>System is under maintenance</option>
        </select>
      );
    }
    return (
      <select className={className} disabled>
        <option>Error loading contests</option>
      </select>
    );
  }

  return (
    <select
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
    >
      <option value="">Select a Contest</option>
      {contests.map((contest) => (
        <option key={contest.id} value={contest.id}>
          {contest.name} ({contest.participant_count}/{contest.max_participants}
          )
        </option>
      ))}
    </select>
  );
}
