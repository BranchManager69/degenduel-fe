import { useEffect, useState } from "react";
import { ContestSelect, useContests } from "./ContestContext";
import { JsonInput } from "./JsonInput";
import { ResponseDisplay } from "./ResponseDisplay";

interface UpdateContestForm {
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

export function UpdateContest() {
  const { refreshContests } = useContests();
  const [selectedContestId, setSelectedContestId] = useState<number | "">("");
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [form, setForm] = useState<UpdateContestForm>({
    name: "",
    contest_code: "",
    description: "",
    entry_fee: "",
    start_time: "",
    end_time: "",
    min_participants: 0,
    max_participants: 0,
    allowed_buckets: [],
  });

  // Load contest details when selected
  useEffect(() => {
    if (selectedContestId) {
      fetch(`https://degenduel.me/api/contests/${selectedContestId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.contest) {
            setForm({
              name: data.contest.name,
              contest_code: data.contest.contest_code,
              description: data.contest.description,
              entry_fee: data.contest.entry_fee,
              start_time: data.contest.start_time,
              end_time: data.contest.end_time,
              min_participants: data.contest.min_participants,
              max_participants: data.contest.max_participants,
              allowed_buckets: data.contest.allowed_buckets,
            });
          }
        })
        .catch(console.error);
    }
  }, [selectedContestId]);

  const handleUpdateContest = async () => {
    if (!selectedContestId) {
      alert("Please select a contest first");
      return;
    }

    try {
      setError(null);
      const response = await fetch(
        `https://degenduel.me/api/contests/${selectedContestId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const data = await response.json();
      if (!response.ok) throw data;
      setResponse(data);
      refreshContests(); // Refresh the contests list after updating
    } catch (err) {
      setError(err);
      console.error("Update Contest Error:", err);
    }
  };

  return (
    <section className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-4">Update Contest</h2>

      <div className="mb-6">
        <label className="text-gray-400 mb-1 block">Select Contest</label>
        <ContestSelect
          value={selectedContestId}
          onChange={setSelectedContestId}
          className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
        />
      </div>

      {selectedContestId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-gray-400 mb-1 block">Name</label>
              <input
                type="text"
                className="w-full bg-gray-900 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-700"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
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
              />
            </div>

            <div>
              <label className="text-gray-400 mb-1 block">
                Min Participants
              </label>
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
              />
            </div>

            <div>
              <label className="text-gray-400 mb-1 block">
                Max Participants
              </label>
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
              />
            </div>

            <div>
              <label className="text-gray-400 mb-1 block">
                Allowed Buckets
              </label>
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
            onClick={handleUpdateContest}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Update Contest
          </button>
        </>
      )}

      <ResponseDisplay response={response} error={error} />
    </section>
  );
}
