import React from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { ddApi } from "../../services/dd-api";
import { Contest, ContestSettings } from "../../types/index";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { MultiSelect } from "../ui/MultiSelect";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

const DD_CONTEST_VIG = 0.1; // 10% cut

type ContestDifficulty =
  | "guppy"
  | "tadpole"
  | "squid"
  | "dolphin"
  | "shark"
  | "whale";

interface CreateContestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateContestModal: React.FC<CreateContestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const getNextHourDateTime = () => {
    const now = new Date();
    const nextHour = new Date(now.setHours(now.getHours() + 1, 0, 0, 0));
    return nextHour.toISOString().slice(0, 16);
  };

  const formatSolAmount = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return `${num.toFixed(2)} SOL`;
  };

  const calculateMaxPrizePool = (entryFee: string, maxParticipants: number) => {
    const fee = parseFloat(entryFee) || 0;
    return Math.floor(fee * maxParticipants * (1 - DD_CONTEST_VIG));
  };

  const calculateCurrentPrizePool = (
    entryFee: string,
    currentParticipants: number
  ) => {
    const fee = parseFloat(entryFee) || 0;
    return Math.floor(fee * currentParticipants * (1 - DD_CONTEST_VIG));
  };

  const generateContestCode = (name: string, attempt = 0) => {
    // Get initials from words in the name
    const initials = name
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");

    // Get current timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-4);

    // If this is a retry, append the attempt number
    const suffix = attempt > 0 ? `-${attempt}` : "";

    return `${initials}-${timestamp}${suffix}`;
  };

  const [formData, setFormData] = React.useState({
    name: `Degen Dustup ${Math.floor(Math.random() * 100)}`,
    description: `Degen for all the glory.`,
    entry_fee: "0.25", // Default 0.25 SOL
    prize_pool: "5.00",
    current_prize_pool: "0.00", // = entry_fee * min_participants
    start_time: getNextHourDateTime(),
    end_time: new Date(
      new Date(getNextHourDateTime()).getTime() + 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 16),
    entry_deadline: getNextHourDateTime(),
    participant_count: 0, // brand new contest
    min_participants: 2, // Default 2
    max_participants: 20, // Default 20
    allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9], // Default All Buckets
    settings: {
      difficulty: "shark" as ContestDifficulty,
      min_trades: 1,
      token_types: [],
      rules: [
        {
          id: "1",
          title: "Participation",
          description:
            "Democrats are strictly forbidden from playing DegenDuel at all times.",
        },
      ],
    } satisfies ContestSettings,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let attempt = 0;
    const maxAttempts = 5;

    while (attempt < maxAttempts) {
      try {
        const contestData: Partial<Contest> = {
          name: formData.name,
          description: formData.description,
          contest_code: generateContestCode(formData.name, attempt),
          entry_fee: formData.entry_fee,
          status: "pending" as const,
          prize_pool: String(
            calculateMaxPrizePool(formData.entry_fee, formData.max_participants)
          ),
          current_prize_pool: String(
            calculateCurrentPrizePool(
              formData.entry_fee,
              formData.min_participants
            )
          ),
          start_time: formData.start_time, // UTC
          end_time: formData.end_time, // UTC
          entry_deadline: formData.entry_deadline, // UTC
          allowed_buckets: formData.allowed_buckets, // Default All 9 Buckets
          participant_count: 0, // brand new contest
          min_participants: formData.min_participants, // Default 2
          max_participants: formData.max_participants, // Default 20
          settings: {
            difficulty: formData.settings.difficulty,
            min_trades: formData.settings.min_trades,
            token_types: formData.settings.token_types || [],
            rules: [
              {
                id: "1",
                title: "Platform Rules",
                description:
                  "All platform rules must be followed at all times.",
              },
              {
                id: "2",
                title: "Fair Play",
                description: "No market manipulation or collusion is allowed.",
              },
              {
                id: "3",
                title: "Participation",
                description:
                  "Democrats are strictly forbidden from playing DegenDuel at all times.",
              },
            ],
          } as ContestSettings,
        };

        // Create the contest
        console.log(
          `Creating contest...`,
          JSON.stringify(contestData, null, 2)
        );
        const response = await ddApi.contests.create(contestData);

        // Log the response
        console.log("API Response:", response);
        if (response.contest_code === contestData.contest_code) {
          toast.success(`Contest ${contestData.contest_code} was created!`, {
            duration: 4000, // 4 seconds
            position: "bottom-right",
            style: {
              background: "#1a1a1a", // dark-200
              color: "#fff", // white
              border: "1px solid #262626", // dark-300
            },
          });

          onSuccess?.();
          onClose();
          break;
        } else {
          toast.error(
            `Failed to create contest ${
              contestData.contest_code
            }. Try again later (${attempt + 1}/${maxAttempts})`,
            {
              duration: 4000, // 4
              position: "bottom-right",
              style: {
                background: "#1a1a1a", // dark-200
                color: "#fff", // white
                border: "1px solid #262626", // dark-300
              },
            }
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";

        // If it's a duplicate code error, try again
        if (
          errorMessage.includes("contest_code") &&
          attempt < maxAttempts - 1
        ) {
          console.log(
            `Whoops! Contest code ${generateContestCode(
              formData.name,
              attempt
            )} already exists. Trying again... (${attempt + 1}/${maxAttempts})`
          );
          attempt++;
          continue;
        }

        // If it's another error or we've run out of attempts, throw it
        console.error("Create contest error:", err);
        setError(errorMessage);
        break;
      }
    }

    setLoading(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  // (Meaningless for now)
  const bucketOptions = [
    { value: 1, label: "Bucket 1" },
    { value: 2, label: "Bucket 2" },
    { value: 3, label: "Bucket 3" },
    { value: 4, label: "Bucket 4" },
    { value: 5, label: "Bucket 5" },
    { value: 6, label: "Bucket 6" },
    { value: 7, label: "Bucket 7" },
    { value: 8, label: "Bucket 8" },
    { value: 9, label: "Bucket 9" },
    //{ value: 10, label: "Bucket 10" },
  ];

  if (!isOpen) return null;

  // Create the modal
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-dark-200 rounded-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-6 border-b border-dark-300">
            <h2 className="text-xl font-bold text-gray-100">Create Contest</h2>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
            >
              ✕
            </Button>
          </div>

          <div className="overflow-y-auto p-6 space-y-6 flex-1 scrollbar-thin scrollbar-thumb-dark-400 scrollbar-track-dark-300">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contest Name
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
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
                    Min Entries
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
                    Max. Entries
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
                    Duel Ticket
                  </label>
                  <Input
                    type="text"
                    name="entry_fee"
                    value={formatSolAmount(formData.entry_fee)}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, "");
                      setFormData((prev) => ({
                        ...prev,
                        entry_fee: value,
                      }));
                    }}
                    className="w-full text-gray-100 bg-dark-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max. Prize Pool
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duel Starts
                  </label>
                  <Input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duel Ends
                  </label>
                  <Input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contest Settings
                  </label>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-dark-300 rounded-md">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Class
                      </label>
                      <Select
                        value={formData.settings.difficulty}
                        onChange={(value: ContestDifficulty) =>
                          setFormData((prev) => ({
                            ...prev,
                            settings: { ...prev.settings, difficulty: value },
                          }))
                        }
                        options={
                          [
                            { value: "guppy", label: "Guppy" },
                            { value: "tadpole", label: "Tadpole" },
                            { value: "squid", label: "Squid" },
                            { value: "dolphin", label: "Dolphin" },
                            { value: "shark", label: "Shark" },
                            { value: "whale", label: "Whale" },
                          ] as const
                        }
                        className="w-full text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Min. Level
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
                        className="w-full text-gray-100"
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
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full text-gray-100 bg-dark-300"
                  rows={4}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

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
                    {loading ? "Creating..." : "Create Contest"}
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
