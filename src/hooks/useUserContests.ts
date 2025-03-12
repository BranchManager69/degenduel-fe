import { useEffect, useState } from "react";

import { getUserContests, UserContest } from "../services/contestService";

export const useUserContests = () => {
  const [contests, setContests] = useState<UserContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const userContests = await getUserContests();
      setContests(userContests);
      setError(null);
    } catch (err) {
      setError("Failed to load your contests");
      console.error("Error in useUserContests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();

    // Refresh contests every 5 minutes
    const intervalId = setInterval(fetchContests, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return {
    contests,
    loading,
    error,
    refetch: fetchContests,
  };
};
