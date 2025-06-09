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
import { ddApi } from "../../services/dd-api";
import { Contest, ContestSettings } from "../../types/index";
// import { Button } from "../ui/Button"; // Removed - using custom buttons now
import { Input } from "../ui/Input";
import { MultiSelect } from "../ui/MultiSelect";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";

// TODO: move to types/index.ts
// Removed: type ContestDifficulty =
//   | "guppy"
//   | "tadpole"
//   | "squid"
//   | "dolphin"
//   | "shark"
//   | "whale";

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
  const [showAdvancedOptions, setShowAdvancedOptions] = React.useState(false);

  const getNextHourDateTime = () => {
    const now = new Date();
    // Use user's local timezone, set to current hour with minutes/seconds zeroed
    const adjustedTime = new Date(now);
    adjustedTime.setHours(adjustedTime.getHours() + 6);
    adjustedTime.setMinutes(0, 0, 0); // Zero out minutes and seconds for clean hour
    return adjustedTime.toISOString().slice(0, 16);
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
    entry_fee: "0",
    prize_pool: "100",
    start_time: getNextHourDateTime(),
    end_time: new Date(
      new Date(getNextHourDateTime()).getTime() +
        24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 16),
    min_participants: 2,
    max_participants: 20,
    allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    settings: {
      difficulty: "guppy",
      tokenTypesAllowed: [],
      startingPortfolioValue: "100",
    } as Omit<ContestSettings, 'minParticipants' | 'maxParticipants'>,
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
        // FIXED: Helper function to ensure datetime has seconds for backend compatibility
        // The datetime-local input returns "2025-06-01T15:00" but backend expects "2025-06-01T15:00:00"
        const formatDateTime = (dateTimeLocal: string): string => {
          // If datetime-local format (missing seconds), add :00
          if (dateTimeLocal.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
            return `${dateTimeLocal}:00`;
          }
          return dateTimeLocal;
        };

        // FIXED: Helper function to format entry fee for backend compatibility
        // Backend expects "0" for free contests, not "0.0" or "0.00"
        const formatEntryFee = (fee: string): string => {
          const numericFee = parseFloat(fee);
          if (isNaN(numericFee) || numericFee <= 0) {
            return "0"; // Free contest format
          }
          // Format to 2 decimal places for paid contests
          return numericFee.toFixed(2);
        };

        // Entry deadline is the same as contest start time (no timezone conversion)
        const formattedStartTime = formatDateTime(formData.start_time);
        
        const contestDataPayload: Partial<Contest> = {
          name: formData.name,
          description: formData.description,
          contest_code: generateContestCode(formData.name, attempt),
          entry_fee: formatEntryFee(formData.entry_fee),
          prize_pool: String(formData.prize_pool), // ✅ Convert to string
          status: "pending" as const,
          start_time: formattedStartTime,
          end_time: formatDateTime(formData.end_time),
          entry_deadline: formattedStartTime, // ✅ Same as start time, no timezone conversion
          allowed_buckets: formData.allowed_buckets,
          min_participants: formData.min_participants,
          max_participants: formData.max_participants,
          settings: {
            difficulty: formData.settings.difficulty,
            tokenTypesAllowed: formData.settings.tokenTypesAllowed || [],
            startingPortfolioValue: formData.settings.startingPortfolioValue || "1000",
          } as ContestSettings,
        };

        // Create the contest
        console.log("Creating contest...", {
          contestData: contestDataPayload,
          attempt: attempt + 1,
          maxAttempts,
          timestamp: new Date().toISOString(),
          userRole,
        });

        const response = await ddApi.contests.create(contestDataPayload);

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

        if (response.contest_code === contestDataPayload.contest_code) {
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
            `Contest code mismatch. Expected: ${contestDataPayload.contest_code}, Got: ${response.contest_code}`,
          );
          toast.error(
            `Failed to create contest ${
              contestDataPayload.contest_code
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
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center">
        <div className="bg-dark-200/80 backdrop-blur-lg rounded-t-2xl sm:rounded-lg w-full sm:max-w-lg flex flex-col max-h-[85vh] sm:max-h-[90vh] border border-dark-100/20 relative group overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />
          
          <div className="flex justify-between items-center p-4 sm:p-5 border-b border-dark-300/50 relative z-10 bg-dark-200/40 backdrop-blur-sm">
            <h2 className="text-lg sm:text-xl font-bold text-gray-100">Create Contest</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-dark-300 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto p-4 sm:p-5 flex-1 scrollbar-thin scrollbar-thumb-dark-400 scrollbar-track-dark-300 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              {userRole === 'user' && (
                <div className={`p-3 rounded-lg border ${
                  availableCredits !== undefined && availableCredits > 0 
                    ? 'bg-green-900/20 border-green-600/30' 
                    : 'bg-red-900/20 border-red-600/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {availableCredits !== undefined && availableCredits > 0 ? (
                        <div className="flex items-center text-green-400 text-sm font-medium">
                          <span className="mr-2">✓</span>
                          {availableCredits} Credit{availableCredits > 1 ? 's' : ''} Available
                        </div>
                      ) : (
                        <div className="flex items-center text-red-400 text-sm font-medium">
                          <span className="mr-2">⚠</span>
                          No Credits
                        </div>
                      )}
                    </div>
                    {(!availableCredits || availableCredits === 0) && (
                      <a 
                        href="/contest-credits" 
                        className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                      >
                        Get Credits
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Contest Basics - Compact */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Contest Name</label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-9"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg resize-none"
                      rows={2}
                      placeholder="Describe your contest..."
                      required
                    />
                  </div>
                </div>

                {/* Participants & Finance - Inline */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Min Entries</label>
                    <Input
                      type="number"
                      min="2"
                      max="50"
                      name="min_participants"
                      value={formData.min_participants}
                      onChange={handleInputChange}
                      className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-9"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Max Entries</label>
                    <Input
                      type="number"
                      min="2"
                      max="1000"
                      name="max_participants"
                      value={formData.max_participants}
                      onChange={handleInputChange}
                      className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-9"
                      required
                    />
                  </div>
                </div>

                {/* Financial - Inline */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Entry Fee (SOL)</label>
                    <Input
                      type="text"
                      name="entry_fee"
                      value={formData.entry_fee}
                      onChange={handleSolInput}
                      className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-9"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Prize Pool (SOL)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      name="prize_pool"
                      value={formData.prize_pool}
                      onChange={handleInputChange}
                      className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-9"
                      placeholder="100"
                      required
                    />
                  </div>
                </div>

                {/* Schedule - Inline */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Contest Starts</label>
                    <Input
                      type="datetime-local"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-9"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Contest Ends</label>
                    <Input
                      type="datetime-local"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-9"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Options - Compact */}
              <div className="border-t border-dark-400 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex justify-between items-center w-full px-3 py-2 bg-dark-300 rounded-lg text-gray-300 hover:bg-dark-400 transition-all text-sm"
                >
                  <span>Advanced Options</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform ${
                      showAdvancedOptions ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showAdvancedOptions && (
                  <div className="mt-3 p-3 bg-dark-300/30 rounded-lg space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty</label>
                        <Select
                          value={formData.settings.difficulty}
                          onChange={(value: string) =>
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
                          className="w-full text-gray-100 bg-dark-400 border-dark-500 h-9"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Portfolio Value</label>
                        <Input
                          type="text"
                          name="settings.startingPortfolioValue"
                          value={formData.settings.startingPortfolioValue}
                          onChange={(e) => setFormData(prev => ({...prev, settings: {...prev.settings, startingPortfolioValue: e.target.value }}))}
                          className="w-full text-gray-100 bg-dark-400 border-dark-500 h-9"
                          placeholder="100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Token Buckets ({formData.allowed_buckets.length} Selected)
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
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Actions - Compact */}
              <div className="flex gap-3 pt-3 border-t border-dark-400">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm text-gray-300 border border-gray-600 rounded-lg hover:bg-dark-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Contest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
