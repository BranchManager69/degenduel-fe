import { useState } from "react";
import { ContestSelect } from "./ContestContext";
import { ResponseDisplay } from "./ResponseDisplay";

export function EndContest() {
  const [selectedContestId, setSelectedContestId] = useState<number | "">("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const handleEndContest = async () => {
    if (!selectedContestId) {
      alert("Please select a contest first");
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `https://degenduel.me/api/contests/${selectedContestId}/end`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await response.json();
      if (!response.ok) throw data;
      setResponse(data);
    } catch (err) {
      setError(err);
      console.error("End Contest Error:", err);
    }
  };

  return (
    <section className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">End Contest</h2>

      <div className="mb-4">
        <label className="text-gray-400 mb-1 block">Select Contest</label>
        <ContestSelect
          value={selectedContestId}
          onChange={setSelectedContestId}
          className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
        />
      </div>

      <button
        onClick={handleEndContest}
        disabled={!selectedContestId}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        End Contest
      </button>

      <ResponseDisplay response={response} error={error} />
    </section>
  );
}
