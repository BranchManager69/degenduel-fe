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
    <section className="bg-dark-300/20 rounded-lg p-6 backdrop-blur-sm border border-dark-300/50 group hover:bg-dark-300/30 transition-all duration-300 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-cyber-500/5 group-hover:opacity-100 opacity-0 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] opacity-20" />

      <div className="relative">
        <h2 className="text-2xl font-semibold text-cyber-400 mb-6 group-hover:animate-glitch flex items-center gap-2">
          <span className="text-2xl group-hover:animate-bounce">🎮</span>
          Create New Contest
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="group/input">
            <label className="text-neon-300 mb-2 block text-sm group-hover/input:animate-cyber-pulse">
              Name
            </label>
            <input
              type="text"
              className="w-full bg-dark-400/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 border border-dark-300/50 hover:border-brand-500/50 transition-all duration-300 placeholder-gray-500"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Contest Name"
            />
          </div>

          <div className="group/input">
            <label className="text-neon-300 mb-2 block text-sm group-hover/input:animate-cyber-pulse">
              Contest Code
            </label>
            <input
              type="text"
              className="w-full bg-dark-400/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 border border-dark-300/50 hover:border-brand-500/50 transition-all duration-300 placeholder-gray-500"
              value={form.contest_code}
              onChange={(e) =>
                setForm((f) => ({ ...f, contest_code: e.target.value }))
              }
              placeholder="FEB-2025-02-1"
            />
          </div>

          <div className="group/input">
            <label className="text-neon-300 mb-2 block text-sm group-hover/input:animate-cyber-pulse">
              Description
            </label>
            <input
              type="text"
              className="w-full bg-dark-400/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 border border-dark-300/50 hover:border-brand-500/50 transition-all duration-300 placeholder-gray-500"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Contest Description"
            />
          </div>

          <div className="group/input">
            <label className="text-neon-300 mb-2 block text-sm group-hover/input:animate-cyber-pulse">
              Entry Fee
            </label>
            <input
              type="text"
              className="w-full bg-dark-400/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 border border-dark-300/50 hover:border-brand-500/50 transition-all duration-300 placeholder-gray-500"
              value={form.entry_fee}
              onChange={(e) =>
                setForm((f) => ({ ...f, entry_fee: e.target.value }))
              }
              placeholder="6969"
            />
          </div>

          <div className="group/input">
            <label className="text-neon-300 mb-2 block text-sm group-hover/input:animate-cyber-pulse">
              Start Time
            </label>
            <input
              type="text"
              className="w-full bg-dark-400/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 border border-dark-300/50 hover:border-brand-500/50 transition-all duration-300 placeholder-gray-500"
              value={form.start_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, start_time: e.target.value }))
              }
              placeholder="2025-02-01T00:00:00Z"
            />
          </div>

          <div className="group/input">
            <label className="text-neon-300 mb-2 block text-sm group-hover/input:animate-cyber-pulse">
              End Time
            </label>
            <input
              type="text"
              className="w-full bg-dark-400/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 border border-dark-300/50 hover:border-brand-500/50 transition-all duration-300 placeholder-gray-500"
              value={form.end_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, end_time: e.target.value }))
              }
              placeholder="2025-02-28T23:59:59Z"
            />
          </div>

          <div className="group/input">
            <label className="text-neon-300 mb-2 block text-sm group-hover/input:animate-cyber-pulse">
              Min Participants
            </label>
            <input
              type="number"
              className="w-full bg-dark-400/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 border border-dark-300/50 hover:border-brand-500/50 transition-all duration-300 placeholder-gray-500"
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

          <div className="group/input">
            <label className="text-neon-300 mb-2 block text-sm group-hover/input:animate-cyber-pulse">
              Max Participants
            </label>
            <input
              type="number"
              className="w-full bg-dark-400/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 border border-dark-300/50 hover:border-brand-500/50 transition-all duration-300 placeholder-gray-500"
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

          <div className="group/input">
            <label className="text-neon-300 mb-2 block text-sm group-hover/input:animate-cyber-pulse">
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
          onClick={handleCreateContest}
          className="bg-gradient-to-r from-brand-500 to-cyber-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-brand-500/20 group-hover:animate-cyber-pulse flex items-center gap-2"
        >
          <span className="text-xl">🎯</span>
          Create Contest
        </button>

        <ResponseDisplay response={response} error={error} />
      </div>
    </section>
  );
}
