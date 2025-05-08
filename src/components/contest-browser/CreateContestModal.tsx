// src/components/contest-browser/CreateContestModal.tsx

/**
 * CreateContestModal.tsx
 * 
 * @description This component is responsible for displaying the CreateContestModal.
 * 
 * @author BranchManager69
 * @version 1.9.1
 * @created 2025-02-14
 * @updated 2025-05-07
 */

import React from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
//import { useEffect } from "react";
//import { Link } from "react-router-dom";
import { DD_PLATFORM_FEE } from "../../config/config";
import { ddApi } from "../../services/dd-api";
import { Contest, ContestSettings } from "../../types/index";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { MultiSelect } from "../ui/MultiSelect";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

// TODO: move to types/index.ts
type ContestDifficulty =
  | "guppy"
  | "tadpole"
  | "squid"
  | "dolphin"
  | "shark"
  | "whale";

// TODO: move to types/index.ts
interface CreateContestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userRole: 'admin' | 'user';
  availableCredits?: number;
}

export const CreateContestModal: React.FC<CreateContestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userRole,
  availableCredits,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showBucketOptions, setShowBucketOptions] = React.useState(false);

  const getNextHourDateTime = () => {
    const now = new Date();
    // Subtract 5 hours from the current time, then set to the next hour
    const adjustedTime = new Date(
      now.setHours(now.getHours() - 5 + 1, 0, 0, 0),
    );
    return adjustedTime.toISOString().slice(0, 16);
  };

  const formatSolAmount = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return "0 SOL";

    // For very small amounts (less than 0.01), show all decimal places up to 9
    if (num < 0.01) {
      return `${num.toFixed(9).replace(/\.?0+$/, "")} SOL`;
    }

    // For amounts between 0.01 and 1, show 3 decimal places
    if (num < 1) {
      return `${num.toFixed(3).replace(/\.?0+$/, "")} SOL`;
    }

    // For larger amounts, show 2 decimal places
    return `${num.toFixed(2)} SOL`;
  };

  const calculateMaxPrizePool = (entryFee: string, maxParticipants: number) => {
    const fee = parseFloat(entryFee) || 0;
    // Don't use Math.floor to preserve decimal precision
    return fee * maxParticipants * (1 - DD_PLATFORM_FEE);
  };

  const calculateCurrentPrizePool = (
    entryFee: string,
    currentParticipants: number,
  ) => {
    const fee = parseFloat(entryFee) || 0;
    return Math.floor(fee * currentParticipants * (1 - DD_PLATFORM_FEE));
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
    description: `May the best Degen win.`,
    entry_fee: "0.01", // Default 0.01 SOL
    prize_pool: "9.99",
    current_prize_pool: "0.00", // = entry_fee * min_participants
    start_time: getNextHourDateTime(),
    end_time: new Date(
      new Date(getNextHourDateTime()).getTime() +
        60 * 60 * 1000 -
        5 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 16),
    entry_deadline: getNextHourDateTime(),
    participant_count: 0, // New contest
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
    } as ContestSettings,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Credit Check for regular users
    if (userRole === 'user') {
      if (availableCredits === undefined || availableCredits < 1) {
        const creditError = "You do not have enough credits to create a contest.";
        setError(creditError);
        toast.error(creditError, {
          duration: 4000,
          position: "bottom-right",
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #262626",
          },
        });
        return;
      }
    }

    setLoading(true);

    let attempt = 0;
    const maxAttempts = 3;
    // Attempt to create the contest up to maxAttempts times
    while (attempt < maxAttempts) {
      try {
        const contestData: Partial<Contest> = {
          name: formData.name,
          description: formData.description,
          contest_code: generateContestCode(formData.name, attempt),
          entry_fee: formData.entry_fee,
          status: "pending" as const,
          prize_pool: String(
            calculateMaxPrizePool(
              formData.entry_fee,
              formData.max_participants,
            ),
          ),
          current_prize_pool: String(
            calculateCurrentPrizePool(
              formData.entry_fee,
              formData.min_participants,
            ),
          ),
          start_time: formData.start_time,
          end_time: formData.end_time,
          entry_deadline: formData.entry_deadline,
          allowed_buckets: formData.allowed_buckets,
          participant_count: 0,
          min_participants: formData.min_participants,
          max_participants: formData.max_participants,
          settings: {
            difficulty: formData.settings.difficulty,
            min_trades: formData.settings.min_trades,
            token_types: formData.settings.token_types || [],
            rules: [
              {
                id: "1",
                title: "DegenDuel Rules",
                description: "Be a good Degen.",
              },
              {
                id: "2",
                title: "Fair Play",
                description: "No collusion is allowed. Don't do it.",
              },
              {
                id: "3",
                title: "No Hacking",
                description: "Don't hack the game and take all the money.",
              },
            ],
          } as ContestSettings,
        };

        // Create the contest
        console.log("Creating contest...", {
          contestData,
          attempt: attempt + 1,
          maxAttempts,
          timestamp: new Date().toISOString(),
          userRole,
        });

        const response = await ddApi.contests.create(contestData);

        // Verify the response
        if (!response || !response.contest_code) {
          throw new Error("Invalid response from server");
        }

        // Log the successful creation
        console.log("Contest created successfully:", {
          contest: response,
          contestCode: response.contest_code,
          timestamp: new Date().toISOString(),
        });

        if (response.contest_code === contestData.contest_code) {
          toast.success(
            `Contest ${
              response.name || response.contest_code
            } created successfully!`,
            {
              duration: 4000,
              position: "bottom-right",
              style: {
                background: "#1a1a1a",
                color: "#fff",
                border: "1px solid #262626",
              },
            },
          );

          // Reset form and close modal
          onClose();

          // Trigger success callback
          onSuccess?.();

          // Navigate to the contest detail page instead of refreshing
          if (response.id) {
            window.location.href = `/contests/${response.id}`;
          } else {
            // Fallback to contest browser if no ID is available
            window.location.href = "/contests";
          }
          break;
        } else {
          console.warn(
            `Contest code mismatch. Expected: ${contestData.contest_code}, Got: ${response.contest_code}`,
          );
          toast.error(
            `Failed to create contest ${
              contestData.contest_code
            }. Try again later (${attempt + 1}/${maxAttempts})`,
            {
              duration: 4000,
              position: "bottom-right",
              style: {
                background: "#1a1a1a",
                color: "#fff",
                border: "1px solid #262626",
              },
            },
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
            `Contest code ${generateContestCode(
              formData.name,
              attempt,
            )} already exists. Retrying... (${attempt + 1}/${maxAttempts})`,
          );
          attempt++;
          continue;
        }

        // If it's another error or we've run out of attempts, show the error
        console.error("Create contest error:", {
          error: err,
          errorMessage,
          attempt: attempt + 1,
          maxAttempts,
          timestamp: new Date().toISOString(),
        });

        // Check if it's the specific 403 Insufficient Credits error
        // We assume the fetch wrapper or ddApi might attach status to the error
        let displayMessage = `Failed to create contest: ${errorMessage}`;
        if ((err as any)?.status === 403 && errorMessage.includes('Insufficient Credits')) {
            displayMessage = "Insufficient Credits: You do not have enough credits to create a new contest.";
        } else if ((err as any)?.status === 403) {
            // Handle other potential 403 errors if necessary
            displayMessage = `Forbidden: ${errorMessage}`;
        } else if ((err as any)?.status) {
            // Handle other HTTP errors
            displayMessage = `Error ${ (err as any).status }: ${errorMessage}`;
        }
        // Network errors or non-HTTP errors will use the default errorMessage

        setError(displayMessage); // Set the potentially more specific error for UI state
        toast.error(displayMessage, {
          duration: 4000,
          position: "bottom-right",
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #262626",
          },
        });
        break;
      }
    }

    setLoading(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

  // Options for min participants dropdown
  const minParticipantsOptions = Array.from({ length: 9 }, (_, i) => ({
    value: String(i + 2),
    label: `${i + 2} participants`,
  }));

  // Options for max participants dropdown
  const maxParticipantsOptions = Array.from({ length: 99 }, (_, i) => ({
    value: String(i + 2),
    label: `${i + 2} participants`,
  }));

  // Handle SOL amount input with simple decimal validation
  const handleSolInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    const parts = value.split(".");

    // Allow only one decimal point
    if (parts.length > 2) return;

    // Limit to 3 decimal places
    if (parts[1] && parts[1].length > 3) return;

    // Prevent more than 7 digits before decimal
    if (parts[0] && parts[0].length > 7) return;

    setFormData((prev) => ({
      ...prev,
      entry_fee: value,
    }));
  };

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
              {userRole === 'user' && (
                <div className="p-3 bg-brand-900/30 border border-brand-500/30 rounded-md text-sm text-brand-300">
                  {availableCredits !== undefined && availableCredits > 0 ? (
                    <p>This will use 1 of your {availableCredits} available credit(s).</p>
                  ) : (
                    <p className="text-yellow-400">You currently have no contest credits. <a href="/contest-credits" className="underline hover:text-yellow-300">Get credits</a>.</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
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

                {/* Collapsible Bucket Selection */}
                <div className="col-span-2">
                  <button
                    type="button"
                    onClick={() => setShowBucketOptions(!showBucketOptions)}
                    className="flex justify-between items-center w-full px-4 py-2 bg-dark-300 rounded-lg text-gray-300 hover:bg-dark-400 transition-colors"
                  >
                    <span className="text-sm font-medium">
                      Token Buckets ({formData.allowed_buckets.length} Selected)
                    </span>
                    <svg
                      className={`w-5 h-5 transform transition-transform ${
                        showBucketOptions ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {showBucketOptions && (
                    <div className="mt-2">
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
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Entries
                  </label>
                  <Select
                    value={String(formData.min_participants)}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        min_participants: parseInt(value, 10),
                      }))
                    }
                    options={minParticipantsOptions}
                    className="w-full text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max. Entries
                  </label>
                  <Select
                    value={String(formData.max_participants)}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        max_participants: parseInt(value, 10),
                      }))
                    }
                    options={maxParticipantsOptions}
                    className="w-full text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Entry Fee (SOL)
                  </label>
                  <Input
                    type="text"
                    name="entry_fee"
                    value={formData.entry_fee}
                    onChange={handleSolInput}
                    className="w-full text-gray-100 bg-dark-300"
                    placeholder="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max. Prize Pool
                  </label>
                  <div className="w-full px-4 py-2 bg-dark-300 rounded-lg text-gray-100">
                    {formatSolAmount(
                      calculateMaxPrizePool(
                        formData.entry_fee,
                        formData.max_participants,
                      ),
                    )}
                  </div>
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
                  <div className="grid grid-cols-2 gap-4 p-4 bg-dark-300 rounded-md border border-dark-400">
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
                        className="w-full text-gray-100 bg-dark-400 border-dark-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Min. Level
                      </label>
                      <Select
                        value={String(formData.settings.min_trades)}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            settings: {
                              ...prev.settings,
                              min_trades: parseInt(value, 10),
                            },
                          }))
                        }
                        options={Array.from({ length: 50 }, (_, i) => ({
                          value: String(i + 1),
                          label: `Level ${i + 1}`,
                        }))}
                        className="w-full text-gray-100 bg-dark-400 border-dark-500"
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
                  className="w-full text-gray-100 bg-dark-300 border border-dark-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  rows={4}
                  placeholder="Describe your contest rules and objectives..."
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  Provide details about your contest to attract participants.
                </p>
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
    document.body,
  );
};
