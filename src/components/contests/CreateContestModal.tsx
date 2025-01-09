import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useState } from "react";
import { ddApi } from "../../services/dd-api";
import type { Contest, ContestSettings } from "../../types";
import { Button } from "../ui/Button";

interface CreateContestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const defaultContestData: Partial<Contest> = {
  name: "",
  description: "",
  entry_fee: "10",
  prize_pool: "1000",
  current_prize_pool: "0",
  start_time: new Date(Date.now() + 86400000).toISOString(),
  end_time: new Date(Date.now() + 172800000).toISOString(),
  entry_deadline: new Date(Date.now() + 86400000).toISOString(),
  allowed_buckets: [],
  participant_count: 0,
  status: "pending",
  settings: {
    difficulty: "guppy",
    min_trades: 1,
    max_participants: 100,
    min_participants: 2,
    token_types: ["SOL"],
    rules: ["Standard contest rules apply"],
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const CreateContestModal: React.FC<CreateContestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] =
    useState<Partial<Contest>>(defaultContestData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await ddApi.contests.create(formData);
      onSuccess?.();
      onClose();
      setFormData(defaultContestData); // Reset form
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create contest");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      if (parent === "settings") {
        setFormData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            [child]:
              child === "token_types" || child === "rules"
                ? [value]
                : child === "min_trades" ||
                  child === "min_participants" ||
                  child === "max_participants"
                ? parseInt(value)
                : value,
          } as ContestSettings,
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/75" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-dark-200 rounded-lg">
              <Dialog.Title className="text-2xl font-bold text-gray-100">
                Create New Contest
              </Dialog.Title>

              {error && (
                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-200">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
                        rows={3}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contest Parameters */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-200">
                    Contest Parameters
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Prize Pool
                      </label>
                      <input
                        type="number"
                        name="prize_pool"
                        value={formData.prize_pool}
                        onChange={handleInputChange}
                        className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Entry Fee
                      </label>
                      <input
                        type="number"
                        name="entry_fee"
                        value={formData.entry_fee}
                        onChange={handleInputChange}
                        className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contest Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-200">
                    Contest Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Difficulty
                      </label>
                      <select
                        name="settings.difficulty"
                        value={formData.settings?.difficulty}
                        onChange={handleInputChange}
                        className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
                        required
                      >
                        <option value="guppy">Guppy</option>
                        <option value="tadpole">Tadpole</option>
                        <option value="squid">Squid</option>
                        <option value="dolphin">Dolphin</option>
                        <option value="shark">Shark</option>
                        <option value="whale">Whale</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Min Trades
                      </label>
                      <input
                        type="number"
                        name="settings.min_trades"
                        value={formData.settings?.min_trades}
                        onChange={handleInputChange}
                        className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Min Participants
                      </label>
                      <input
                        type="number"
                        name="settings.min_participants"
                        value={formData.settings?.min_participants}
                        onChange={handleInputChange}
                        className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Max Participants
                      </label>
                      <input
                        type="number"
                        name="settings.max_participants"
                        value={formData.settings?.max_participants}
                        onChange={handleInputChange}
                        className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Timing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-200">
                    Contest Timing
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        name="start_time"
                        value={formData.start_time?.slice(0, 16)}
                        onChange={handleInputChange}
                        className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        End Time
                      </label>
                      <input
                        type="datetime-local"
                        name="end_time"
                        value={formData.end_time?.slice(0, 16)}
                        onChange={handleInputChange}
                        className="w-full bg-dark-300 border border-dark-400 rounded px-3 py-2 text-gray-100"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Contest"}
                  </Button>
                </div>
              </form>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};
