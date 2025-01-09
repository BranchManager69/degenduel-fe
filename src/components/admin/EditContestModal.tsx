import React, { ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { Contest, ContestStatus } from "../../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { MultiSelect } from "../ui/MultiSelect";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

interface EditContestModalProps {
  contest: Contest | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contestId: number, data: Partial<Contest>) => Promise<void>;
}

interface FormData {
  name: string;
  description: string;
  entry_fee: string;
  prize_pool: string;
  current_prize_pool: string;
  start_time: string;
  end_time: string;
  entry_deadline: string;
  min_participants: number;
  max_participants: number;
  allowed_buckets: number[];
  participant_count: number;
  last_entry_time: string;
  status: ContestStatus;
  cancelled_at: string;
  cancellation_reason: string;
  settings: {
    difficulty: "guppy" | "tadpole" | "squid" | "dolphin" | "shark" | "whale";
    min_trades: number;
    token_types: string[];
    rules: string[];
  };
}

export const EditContestModal: React.FC<EditContestModalProps> = ({
  contest,
  isOpen,
  onClose,
  onSave,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [loading, setLoading] = React.useState(false);

  const getNextHourDateTime = () => {
    const now = new Date();
    const nextHour = new Date(now.setHours(now.getHours() + 1, 0, 0, 0));
    return nextHour.toISOString().slice(0, 16);
  };

  const formatSolAmount = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `${num} SOL`;
  };

  const calculateMaxPrizePool = (entryFee: string, maxParticipants: number) => {
    const fee = parseFloat(entryFee) || 0;
    return fee * maxParticipants * 0.9;
  };

  const [formData, setFormData] = React.useState<FormData>({
    name: "",
    description: "",
    entry_fee: "0.1",
    prize_pool: "0",
    current_prize_pool: "0",
    start_time: getNextHourDateTime(),
    end_time: new Date(
      new Date(getNextHourDateTime()).getTime() + 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 16),
    entry_deadline: getNextHourDateTime(),
    min_participants: 2,
    max_participants: 100,
    allowed_buckets: [1, 2, 3, 4, 5],
    participant_count: 0,
    last_entry_time: "",
    status: "pending",
    cancelled_at: "",
    cancellation_reason: "",
    settings: {
      difficulty: "guppy",
      min_trades: 1,
      token_types: [],
      rules: [],
    },
  });

  React.useEffect(() => {
    if (contest) {
      setFormData({
        name: contest.name,
        description: contest.description,
        entry_fee: contest.entry_fee.toString(),
        prize_pool: contest.prize_pool.toString(),
        current_prize_pool: contest.current_prize_pool?.toString() || "0",
        start_time: contest.start_time,
        end_time: contest.end_time,
        entry_deadline: contest.entry_deadline || "",
        min_participants: contest.settings?.min_participants || 2,
        max_participants: contest.settings?.max_participants || 10,
        allowed_buckets: contest.allowed_buckets || [1, 2, 3, 4, 5],
        participant_count: contest.participant_count || 0,
        last_entry_time: contest.last_entry_time || "",
        status: contest.status,
        cancelled_at: contest.cancelled_at || "",
        cancellation_reason: contest.cancellation_reason || "",
        settings: {
          difficulty: contest.settings?.difficulty || "guppy",
          min_trades: contest.settings?.min_trades || 1,
          token_types: contest.settings?.token_types || [],
          rules: contest.settings?.rules || [],
        },
      });
    }
  }, [contest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contest) return;

    try {
      setLoading(true);
      const apiData: Partial<Contest> = {
        name: formData.name,
        description: formData.description,
        entry_fee: String(parseFloat(formData.entry_fee)),
        prize_pool: String(
          calculateMaxPrizePool(formData.entry_fee, formData.max_participants)
        ),
        current_prize_pool: String(
          parseFloat(formData.current_prize_pool || "0")
        ),
        start_time: formData.start_time,
        end_time: formData.end_time,
        entry_deadline: formData.entry_deadline || undefined,
        allowed_buckets: formData.allowed_buckets,
        participant_count: formData.participant_count,
        last_entry_time: formData.last_entry_time || undefined,
        status: formData.status,
        cancelled_at: formData.cancelled_at || undefined,
        cancellation_reason: formData.cancellation_reason || undefined,
        settings: {
          difficulty: formData.settings.difficulty,
          min_trades: formData.settings.min_trades,
          max_participants: formData.max_participants,
          min_participants: formData.min_participants,
          token_types: formData.settings.token_types,
          rules: formData.settings.rules,
        },
      };

      console.log("Sending data to API:", JSON.stringify(apiData, null, 2));

      try {
        await onSave(contest.id, apiData);
        onClose();
      } catch (err) {
        if (err instanceof Error) {
          console.error("API Error:", {
            message: err.message,
            stack: err.stack,
            data: apiData,
          });
        } else {
          console.error("Unknown API Error:", err);
        }
        throw err;
      }
    } catch (err) {
      console.error("Failed to save contest:", err);
      // You might want to show an error message to the user here
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const bucketOptions = [
    { value: 1, label: "Bucket 1" },
    { value: 2, label: "Bucket 2" },
    { value: 3, label: "Bucket 3" },
    { value: 4, label: "Bucket 4" },
    { value: 5, label: "Bucket 5" },
  ];

  // Add click listener on mount
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-dark-200 rounded-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-6 border-b border-dark-300">
            <h2 className="text-xl font-bold text-gray-100">Edit Contest</h2>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
            >
              ✕
            </Button>
          </div>

          <div className="overflow-y-auto p-6 space-y-6 flex-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contest Name
                  </label>
                  <Input
                    name="name"
                    value={formData.name || ""}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Allowed Buckets
                  </label>
                  <MultiSelect
                    value={formData.allowed_buckets}
                    onChange={(buckets) =>
                      setFormData((prev) => ({
                        ...prev,
                        allowed_buckets: buckets,
                      }))
                    }
                    options={bucketOptions}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Participants
                  </label>
                  <Input
                    type="number"
                    name="min_participants"
                    value={formData.min_participants}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300"
                    min={2}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Participants
                  </label>
                  <Input
                    type="number"
                    name="max_participants"
                    value={formData.max_participants}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300"
                    min={2}
                    max={1000}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Entry Fee
                  </label>
                  <Input
                    type="number"
                    name="entry_fee"
                    value={formData.entry_fee || ""}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    SOL
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Prize Pool
                  </label>
                  <Input
                    type="text"
                    value={formatSolAmount(
                      calculateMaxPrizePool(
                        formData.entry_fee,
                        formData.max_participants
                      )
                    )}
                    className="w-full text-gray-100 bg-dark-300"
                    disabled
                  />
                  <p className="text-sm text-gray-400 mt-1">
                    90% of entry fee × max participants
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time
                  </label>
                  <Input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time?.slice(0, 16) || ""}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time
                  </label>
                  <Input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time?.slice(0, 16) || ""}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Entry Deadline
                  </label>
                  <Input
                    type="datetime-local"
                    name="entry_deadline"
                    value={formData.entry_deadline?.slice(0, 16) || ""}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Prize Pool
                  </label>
                  <Input
                    type="text"
                    name="current_prize_pool"
                    value={formatSolAmount(formData.current_prize_pool || "0")}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300"
                    disabled={formData.status !== "active"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Seats Claimed
                  </label>
                  <Input
                    type="number"
                    name="participant_count"
                    value={formData.participant_count}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300"
                    disabled={formData.status === "pending"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Entry Time
                  </label>
                  <Input
                    type="datetime-local"
                    name="last_entry_time"
                    value={formData.last_entry_time?.slice(0, 16) || ""}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300"
                    disabled
                  />
                </div>

                {formData.status === "cancelled" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Cancelled At
                      </label>
                      <Input
                        type="datetime-local"
                        name="cancelled_at"
                        value={formData.cancelled_at?.slice(0, 16) || ""}
                        onChange={handleInputChange}
                        className="w-full text-gray-100 bg-dark-300"
                        disabled
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Cancellation Reason
                      </label>
                      <Textarea
                        name="cancellation_reason"
                        value={formData.cancellation_reason || ""}
                        onChange={handleInputChange}
                        className="w-full text-gray-100 bg-dark-300"
                        rows={2}
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contest Settings
                  </label>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-dark-300 rounded-md">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Difficulty
                      </label>
                      <Select
                        value={formData.settings.difficulty}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, difficulty: value },
                          }))
                        }
                        options={[
                          { value: "guppy", label: "Guppy" },
                          { value: "tadpole", label: "Tadpole" },
                          { value: "squid", label: "Squid" },
                          { value: "dolphin", label: "Dolphin" },
                          { value: "shark", label: "Shark" },
                          { value: "whale", label: "Whale" },
                        ]}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Min Trades
                      </label>
                      <Input
                        type="number"
                        value={formData.settings.min_trades}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              min_trades: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full"
                        min={1}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <Textarea
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  className="w-full text-gray-100 bg-dark-300"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Difficulty
                </label>
                <Select<ContestStatus>
                  value={formData.status}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                  options={[
                    { value: "pending", label: "Pending" },
                    { value: "active", label: "Active" },
                    { value: "completed", label: "Completed" },
                    { value: "cancelled", label: "Cancelled" },
                  ]}
                  className="w-full text-gray-100 bg-dark-300"
                />
              </div>

              <div className="border-t border-dark-300 pt-6">
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="text-gray-300 border-gray-600 hover:bg-dark-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={loading}
                    className="min-w-[100px]"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
