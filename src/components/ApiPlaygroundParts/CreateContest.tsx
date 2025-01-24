import { useState } from "react";
import { useContests } from "./ContestContext";
import { JsonInput } from "./JsonInput";
import { ResponseDisplay } from "./ResponseDisplay";

interface CreateContestForm {
  name: string;
  contest_code: string;
  description: string;
  entry_fee: string;
  start_time: string;
  end_time: string;
  min_participants: number;
  max_participants: number;
  allowed_buckets: number[];
}

export function CreateContest() {
  const { refreshContests } = useContests();
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [form, setForm] = useState<CreateContestForm>({
    name: "The Game is My Valentine",
    contest_code: "FEB-2025-02-1",
    description: "My girlfriend is crypto",
    entry_fee: "6969",
    start_time: "2025-02-01T00:00:00Z",
    end_time: "2025-02-28T23:59:59Z",
    min_participants: 31,
    max_participants: 69,
    allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  });

  const handleCreateContest = async () => {
    try {
      setError(null);
      const response = await fetch("https://degenduel.me/api/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw data;
      setResponse(data);
      refreshContests(); // Refresh the contests list after creating
    } catch (err) {
      setError(err);
      console.error("Create Contest Error:", err);
    }
  };

  return (
    <section className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">
        Create New Contest
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-gray-400 mb-1 block">Name</label>
          <input
            type="text"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Contest Name"
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">Contest Code</label>
          <input
            type="text"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            value={form.contest_code}
            onChange={(e) =>
              setForm((f) => ({ ...f, contest_code: e.target.value }))
            }
            placeholder="FEB-2025-02-1"
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">Description</label>
          <input
            type="text"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Contest Description"
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">Entry Fee</label>
          <input
            type="text"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            value={form.entry_fee}
            onChange={(e) =>
              setForm((f) => ({ ...f, entry_fee: e.target.value }))
            }
            placeholder="6969"
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">Start Time</label>
          <input
            type="text"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            value={form.start_time}
            onChange={(e) =>
              setForm((f) => ({ ...f, start_time: e.target.value }))
            }
            placeholder="2025-02-01T00:00:00Z"
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">End Time</label>
          <input
            type="text"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            value={form.end_time}
            onChange={(e) =>
              setForm((f) => ({ ...f, end_time: e.target.value }))
            }
            placeholder="2025-02-28T23:59:59Z"
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">Min Participants</label>
          <input
            type="number"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            value={form.min_participants}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                min_participants: Number(e.target.value),
              }))
            }
            placeholder="31"
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">Max Participants</label>
          <input
            type="number"
            className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
            value={form.max_participants}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                max_participants: Number(e.target.value),
              }))
            }
            placeholder="69"
          />
        </div>

        <div>
          <label className="text-gray-400 mb-1 block">Allowed Buckets</label>
          <JsonInput
            value={form.allowed_buckets}
            onChange={(buckets) =>
              setForm((f) => ({ ...f, allowed_buckets: buckets }))
            }
            placeholder="[1, 2, 3, 4, 5, 6, 7, 8, 9]"
          />
        </div>
      </div>

      <button
        onClick={handleCreateContest}
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
      >
        Create Contest
      </button>

      <ResponseDisplay response={response} error={error} />
    </section>
  );
}
