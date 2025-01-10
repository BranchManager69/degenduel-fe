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
  const [hasChanges, setHasChanges] = React.useState(false);

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

  const suggestEndTime = (startTime: string, duration = 60) => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);
    return end.toISOString().slice(0, 16);
  };

  const calculateMinPrizePool = (fee: string, minParticipants: number) => {
    return Number(fee) * minParticipants * 0.9;
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

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.entries(errors)
        .map(([field, message]) => `${field}: ${message}`)
        .join("\n");
      alert(`Please fix the following errors:\n${errorMessages}`);
      return;
    }

    try {
      setLoading(true);

      // Convert to UTC before sending to server
      const utcStartTime = new Date(formData.start_time);
      const utcEndTime = new Date(formData.end_time);
      const utcEntryDeadline = formData.entry_deadline
        ? new Date(formData.entry_deadline)
        : undefined;

      const apiData: Partial<Contest> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        entry_fee: formData.entry_fee,
        prize_pool: String(
          calculateMaxPrizePool(formData.entry_fee, formData.max_participants)
        ),
        current_prize_pool: formData.current_prize_pool,
        start_time: utcStartTime.toISOString(),
        end_time: utcEndTime.toISOString(),
        entry_deadline: utcEntryDeadline?.toISOString(),
        allowed_buckets: formData.allowed_buckets,
        participant_count: Number(formData.participant_count),
        status: formData.status,
        settings: {
          difficulty: formData.settings.difficulty,
          min_trades: Number(formData.settings.min_trades),
          max_participants: Number(formData.max_participants) || 100,
          min_participants: Number(formData.min_participants) || 2,
          token_types: formData.settings.token_types,
          rules: formData.settings.rules,
        },
        // Only include these if status is cancelled
        ...(formData.status === "cancelled" && {
          cancelled_at: new Date().toISOString(),
          cancellation_reason: formData.cancellation_reason.trim(),
        }),
      };

      // Add validation for participant limits
      if (
        !apiData.settings?.max_participants ||
        apiData.settings.max_participants <= 0
      ) {
        throw new Error("Maximum participants must be set and greater than 0");
      }

      console.log("[EditContestModal] Submitting update:", {
        contestId: contest.id,
        data: apiData,
        timestamp: new Date().toISOString(),
      });

      await onSave(contest.id, apiData);
      onClose();
    } catch (err) {
      console.error("[EditContestModal] Update failed:", {
        error:
          err instanceof Error
            ? {
                message: err.message,
                stack: err.stack,
              }
            : err,
        contestId: contest.id,
        timestamp: new Date().toISOString(),
      });

      alert(
        `Failed to update contest: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setHasChanges(true);
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));

    if (name === "start_time") {
      // Auto-adjust end time when start time changes
      setFormData((prev) => ({
        ...prev,
        start_time: value,
        end_time: suggestEndTime(value),
        entry_deadline: value, // Or some time before start
      }));
    }

    if (name === "entry_fee" || name === "min_participants") {
      // Auto-adjust prize pool
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        prize_pool: String(
          calculateMinPrizePool(
            name === "entry_fee" ? value : prev.entry_fee,
            name === "min_participants" ? Number(value) : prev.min_participants
          )
        ),
      }));
    }
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

  // Add validation helpers
  const validateForm = (data: typeof formData) => {
    const errors: Record<string, string> = {};

    // Time validations
    const now = new Date();
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    const deadline = data.entry_deadline ? new Date(data.entry_deadline) : null;

    if (start <= now && data.status === "pending") {
      errors.start_time =
        "Start time must be in the future for pending contests";
    }
    if (end <= start) {
      errors.end_time = "End time must be after start time";
    }
    if (deadline && deadline >= start) {
      errors.entry_deadline = "Entry deadline must be before start time";
    }

    // Participant validations
    if (data.min_participants >= data.max_participants) {
      errors.min_participants = "Min participants must be less than max";
    }
    if (data.participant_count > data.max_participants) {
      errors.max_participants =
        "Max participants cannot be less than current participants";
    }

    // Prize pool validation
    const minPrizePool = Number(data.entry_fee) * data.min_participants * 0.9;
    if (Number(data.prize_pool) < minPrizePool) {
      errors.prize_pool = `Prize pool must be at least ${minPrizePool} SOL`;
    }

    // Participant limit validations
    if (!data.max_participants || data.max_participants <= 0) {
      errors.max_participants =
        "Maximum participants must be set and greater than 0";
    }

    if (!data.min_participants || data.min_participants <= 0) {
      errors.min_participants =
        "Minimum participants must be set and greater than 0";
    }

    if (data.min_participants >= data.max_participants) {
      errors.min_participants =
        "Minimum participants must be less than maximum";
    }

    // Ensure current participant count is valid
    if (data.participant_count > data.max_participants) {
      errors.participant_count = "Current participants cannot exceed maximum";
    }

    return errors;
  };

  // Add status transition validation
  const allowedStatusTransitions: Record<
    Contest["status"],
    Contest["status"][]
  > = {
    pending: ["active", "cancelled"],
    active: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const handleClose = () => {
    if (hasChanges) {
      if (
        window.confirm(
          "You have unsaved changes. Are you sure you want to close?"
        )
      ) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleStatusChange = (value: ContestStatus) => {
    if (!contest) return;

    if (!allowedStatusTransitions[contest.status].includes(value)) {
      alert(`Cannot change status from ${contest.status} to ${value}`);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      status: value,
      // Auto-set cancellation fields if needed
      ...(value === "cancelled" && {
        cancelled_at: new Date().toISOString(),
        cancellation_reason: "",
      }),
    }));
  };

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
              onClick={handleClose}
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
                <Select
                  value={formData.status}
                  onChange={handleStatusChange}
                  options={[
                    {
                      value: "pending" as ContestStatus,
                      label: "🟡 Pending",
                    },
                    {
                      value: "active" as ContestStatus,
                      label: "🟢 Active",
                    },
                    {
                      value: "completed" as ContestStatus,
                      label: "🔵 Completed",
                    },
                    {
                      value: "cancelled" as ContestStatus,
                      label: "🔴 Cancelled",
                    },
                  ].map((option) => ({
                    ...option,
                    disabled: contest
                      ? !allowedStatusTransitions[contest.status].includes(
                          option.value
                        )
                      : false,
                  }))}
                  className="w-full text-gray-100 bg-dark-300"
                />
              </div>

              <div className="border-t border-dark-300 pt-6">
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
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
