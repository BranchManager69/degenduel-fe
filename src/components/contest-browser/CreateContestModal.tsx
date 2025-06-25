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
import { Textarea } from "../ui/Textarea";
import { useSolanaTokenData } from "../../hooks/data/useSolanaTokenData";
import { config } from "../../config/config";
import { useStore } from "../../store/useStore";

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
  const isAdmin = userRole === 'admin';
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = React.useState(false);
  
  // Get user data and DUEL token balance
  const user = useStore(state => state.user);
  const { tokenData: duelTokenData } = useSolanaTokenData(
    config.SOLANA.DEGEN_TOKEN_ADDRESS,
    user?.wallet_address
  );
  
  // Total DUEL supply (1 billion for now, will be updated later)
  const TOTAL_DUEL_SUPPLY = 1_000_000_000;

  const getSmartStartTime = () => {
    const now = new Date();
    const minutesUntilNextHour = 60 - now.getMinutes();
    
    // If less than 5 minutes until next hour, go to the hour after that
    const hoursToAdd = minutesUntilNextHour < 5 ? 2 : 1;
    
    const smartTime = new Date(now);
    smartTime.setHours(smartTime.getHours() + hoursToAdd);
    smartTime.setMinutes(0, 0, 0); // Zero out minutes and seconds for clean hour
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM) in local timezone
    const year = smartTime.getFullYear();
    const month = String(smartTime.getMonth() + 1).padStart(2, '0');
    const day = String(smartTime.getDate()).padStart(2, '0');
    const hours = String(smartTime.getHours()).padStart(2, '0');
    const minutes = String(smartTime.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

  const [participantRange, setParticipantRange] = React.useState("3-20");

  const [duration, setDuration] = React.useState("1"); // Duration in hours
  const [formData, setFormData] = React.useState({
    name: `Degen Dustup ${Math.floor(Math.random() * 100)}`,
    description: `May the best Degen win.`,
    entry_fee: "0",
    prize_pool: "0", // Will be calculated based on entry fee × participants
    start_time: getSmartStartTime(),
    min_participants: 3,
    max_participants: 20,
    allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    settings: {
      difficulty: "guppy", // Hard-coded default
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

    // Additional validation for minimum participants
    if (formData.min_participants < 3) {
      setError("Contests must have at least 3 participants. Use Challenge Friend for 1v1 duels.");
      return;
    }

    if (formData.max_participants < formData.min_participants) {
      setError("Maximum participants must be greater than or equal to minimum participants.");
      return;
    }

    setLoading(true);

    let attempt = 0;
    const maxAttempts = 3;
    // Attempt to create the contest up to maxAttempts times
    while (attempt < maxAttempts) {
      try {
        // FIXED: Helper function to ensure datetime is in proper ISO format for backend
        // The datetime-local input is in local time, backend expects ISO 8601 with timezone
        const formatDateTime = (dateTimeLocal: string): string => {
          // Parse the local datetime and convert to ISO string
          const date = new Date(dateTimeLocal);
          return date.toISOString();
        };

        // FIXED: Helper function to format entry fee for backend compatibility
        // Backend expects "0" for free contests, not "0.0" or "0.00"
        const formatEntryFee = (fee: string): string => {
          // Treat empty string as 0
          const feeValue = fee.trim() === '' ? '0' : fee;
          const numericFee = parseFloat(feeValue);
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
          prize_pool: calculatedPrizePool.max.toString(), // ✅ Maximum prize pool based on max participants
          status: "pending" as const,
          start_time: formattedStartTime,
          end_time: formatDateTime(calculatedEndTime),
          entry_deadline: formattedStartTime, // ✅ Same as start time, no timezone conversion
          allowed_buckets: formData.allowed_buckets,
          min_participants: formData.min_participants,
          max_participants: formData.max_participants,
          settings: {
            difficulty: "guppy", // Hard-coded value
            tokenTypesAllowed: formData.settings.tokenTypesAllowed || [],
            startingPortfolioValue: formData.settings.startingPortfolioValue || "1000",
          } as ContestSettings,
        };

        // Validate required fields before sending
        const requiredFields = ['name', 'description', 'contest_code', 'entry_fee', 'prize_pool', 'start_time', 'end_time', 'allowed_buckets', 'min_participants', 'max_participants'];
        const missingFields = requiredFields.filter(field => !contestDataPayload[field as keyof typeof contestDataPayload]);
        
        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Create the contest
        console.log("Creating contest...", {
          contestData: contestDataPayload,
          attempt: attempt + 1,
          maxAttempts,
          timestamp: new Date().toISOString(),
          userRole,
          validationCheck: {
            hasAllRequiredFields: missingFields.length === 0,
            entryFeeFormat: contestDataPayload.entry_fee,
            prizePoolFormat: contestDataPayload.prize_pool,
            timeFormats: {
              start: contestDataPayload.start_time,
              end: contestDataPayload.end_time,
              deadline: contestDataPayload.entry_deadline
            }
          }
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
        let displayMessage = errorMessage;
        if ((err as any)?.status === 403 && errorMessage.includes('Insufficient Credits')) {
            displayMessage = "Insufficient Credits: You do not have enough credits to create a new contest.";
        } else if ((err as any)?.status === 403) {
            // Handle other potential 403 errors if necessary
            displayMessage = `Access denied: ${errorMessage}`;
        } else if ((err as any)?.status) {
            // Handle other HTTP errors
            displayMessage = `${errorMessage}`;
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

  const handleParticipantRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setParticipantRange(value);
    
    // Parse the range format "3-100"
    const match = value.match(/^(\d+)-(\d+)$/);
    if (match) {
      const min = parseInt(match[1]);
      const max = parseInt(match[2]);
      if (min >= 3 && max >= min && max <= 100) {
        setFormData(prev => ({
          ...prev,
          min_participants: min,
          max_participants: max
        }));
      } else {
        // If invalid range, don't update formData - keep previous valid values
        console.warn('Invalid participant range:', value, 'Min must be >= 3, Max must be <= 100');
      }
    }
  };

  // (Meaningless for now)
  const bucketOptions = [
    { value: 1, label: "1" },
    { value: 2, label: "2" },
    { value: 3, label: "3" },
    { value: 4, label: "4" },
    { value: 5, label: "5" },
    { value: 6, label: "6" },
    { value: 7, label: "7" },
    { value: 8, label: "8" },
    { value: 9, label: "9" },
    //{ value: 10, label: "10" },
  ];

  // Enhanced SOL input handler with better decimal support
  const handleSolInput = (e: React.ChangeEvent<HTMLInputElement>, field: 'entry_fee' | 'prize_pool') => {
    let value = e.target.value;
    
    // Allow empty string
    if (value === '') {
      setFormData(prev => ({ ...prev, [field]: '' }));
      return;
    }
    
    // Remove non-numeric except decimal
    value = value.replace(/[^0-9.]/g, '');
    
    // Remove leading zeros unless it's "0." or just "0"
    if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
      value = value.replace(/^0+/, '');
    }
    
    // Handle multiple decimals
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit decimal places to 3
    if (parts.length === 2 && parts[1].length > 3) {
      value = parts[0] + '.' + parts[1].slice(0, 3);
    }
    
    // Enforce maximum entry fee of 1 SOL
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 1) {
      return; // Don't update if over 1 SOL
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate end time based on start time + duration
  const calculatedEndTime = React.useMemo(() => {
    if (!formData.start_time || !duration) return '';
    const startDate = new Date(formData.start_time);
    const durationHours = parseFloat(duration) || 24;
    
    // Handle 5 minutes specially to avoid floating point errors
    let millisToAdd;
    if (duration === "0.0833333333333333" || Math.abs(durationHours - 1/12) < 0.0001) {
      millisToAdd = 5 * 60 * 1000; // Exactly 5 minutes
    } else {
      millisToAdd = durationHours * 60 * 60 * 1000;
    }
    
    const endDate = new Date(startDate.getTime() + millisToAdd);
    
    // Format for datetime-local input in local timezone (same format as start time)
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, '0');
    const day = String(endDate.getDate()).padStart(2, '0');
    const hours = String(endDate.getHours()).padStart(2, '0');
    const minutes = String(endDate.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, [formData.start_time, duration]);

  // Calculate prize pool range based on entry fee × participant range
  const calculatedPrizePool = React.useMemo(() => {
    const entryFee = parseFloat(formData.entry_fee || '0') || 0;
    const minTotal = entryFee * formData.min_participants;
    const maxTotal = entryFee * formData.max_participants;
    
    // Helper to format numbers without unnecessary decimals
    const formatAmount = (amount: number) => {
      return amount % 1 === 0 ? amount.toString() : amount.toFixed(3).replace(/\.?0+$/, '');
    };
    
    return {
      min: minTotal,
      max: maxTotal,
      minFormatted: formatAmount(minTotal),
      maxFormatted: formatAmount(maxTotal),
      range: minTotal === maxTotal ? formatAmount(minTotal) : `${formatAmount(minTotal)}-${formatAmount(maxTotal)}`
    };
  }, [formData.entry_fee, formData.min_participants, formData.max_participants]);

  // Format date for display
  const formatDatePreview = (dateStr: string) => {
    if (!dateStr) return { dateStr: '', timeStr: '' };
    const date = new Date(dateStr);
    
    // Format date
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    };
    const dateFormatted = date.toLocaleDateString('en-US', dateOptions);
    
    // Format time
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    const timeFormatted = date.toLocaleTimeString('en-US', timeOptions);
    
    // Get UTC time
    const utcHours = date.getUTCHours().toString().padStart(2, '0');
    const utcMinutes = date.getUTCMinutes().toString().padStart(2, '0');
    const utcStr = `${utcHours}:${utcMinutes} UTC`;
    
    return { 
      dateStr: dateFormatted,
      timeStr: `${timeFormatted} (${utcStr})`
    };
  };

  // Format duration for display
  // const formatDurationDisplay = () => {
  //   const durationHours = parseFloat(duration) || 0;
    
  //   if (durationHours < 1) {
  //     const minutes = Math.round(durationHours * 60);
  //     return `${minutes}m`;
  //   } else if (durationHours < 24) {
  //     const hours = Math.floor(durationHours);
  //     const minutes = Math.round((durationHours - hours) * 60);
  //     return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  //   } else {
  //     const days = Math.floor(durationHours / 24);
  //     const remainingHours = durationHours % 24;
  //     return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  //   }
  // };

  // Check if start time is too close to now (less than 2 minutes)
  const isStartTimeTooSoon = React.useMemo(() => {
    if (!formData.start_time) return false;
    const startDate = new Date(formData.start_time);
    const now = new Date();
    const diffMinutes = (startDate.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes < 2;
  }, [formData.start_time]);

  // Check periodically if start time becomes invalid while modal is open
  React.useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      // If start time becomes too soon, update to next smart time
      if (isStartTimeTooSoon) {
        setFormData(prev => ({
          ...prev,
          start_time: getSmartStartTime()
        }));
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [isOpen, isStartTimeTooSoon]);

  if (!isOpen) return null;

  // Create the modal
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center" onClick={onClose}>
        <div className="bg-dark-200/80 backdrop-blur-lg rounded-t-2xl sm:rounded-lg w-full sm:max-w-lg lg:max-w-4xl flex flex-col max-h-[85vh] sm:max-h-[90vh] border border-dark-100/20 relative group overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />
          
          <div className="flex justify-between items-center p-4 sm:p-5 border-b border-dark-300/50 relative z-10 bg-dark-200/40 backdrop-blur-sm">
            <h2 className="text-lg sm:text-xl font-bold text-gray-100">Create a Contest</h2>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {userRole === 'user' && (!availableCredits || availableCredits === 0) && (
                <div className="p-3 rounded-lg border bg-red-900/20 border-red-600/30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center text-red-400 text-sm font-medium">
                        <span className="mr-2">⚠</span>
                        No Credits
                      </div>
                    </div>
                    <a 
                      href="/contest-credits" 
                      className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
                    >
                      Get Credits
                    </a>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Contest Details */}
                <div className="space-y-4">

                  {/* Contest Details */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                      <span className="w-1 h-4 bg-brand-500 rounded-full mr-2"></span>
                      Contest Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Contest Name</label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full text-gray-100 bg-dark-300/70 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-10 focus:bg-dark-300 transition-colors"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Description</label>
                        <Textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="w-full text-gray-100 bg-dark-300/70 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg resize-none focus:bg-dark-300 transition-all duration-200 min-h-[2.5rem]"
                          rows={1}
                          placeholder="Describe your contest..."
                          maxLength={280}
                          style={{
                            height: 'auto',
                            minHeight: '2.5rem'
                          }}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                          }}
                          required
                        />
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-gray-500">Brief description of your contest</p>
                          <span className={`text-xs ${formData.description.length > 250 ? 'text-yellow-500' : formData.description.length === 280 ? 'text-red-500' : 'text-gray-500'}`}>
                            {formData.description.length}/280
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className="text-xs text-gray-500 hover:text-gray-400 transition-colors"
                    >
                      {showAdvancedOptions ? '− Hide' : '+ Show'} advanced options
                    </button>
                    
                    {showAdvancedOptions && (
                      <div className="mt-2 p-3 bg-dark-300/30 rounded-lg space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Starting Portfolio Value</label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">◎</div>
                            <Input
                              type="text"
                              value={formData.settings.startingPortfolioValue}
                              onChange={(e) => {
                                let value = e.target.value;
                                
                                // Allow empty string
                                if (value === '') {
                                  setFormData(prev => ({...prev, settings: {...prev.settings, startingPortfolioValue: ''}}));
                                  return;
                                }
                                
                                // Remove non-numeric except decimal
                                value = value.replace(/[^0-9.]/g, '');
                                
                                // Remove leading zeros unless it's "0." or just "0"
                                if (value.length > 1 && value.startsWith('0') && value[1] !== '.') {
                                  value = value.replace(/^0+/, '');
                                }
                                
                                // Handle multiple decimals
                                const parts = value.split('.');
                                if (parts.length > 2) {
                                  value = parts[0] + '.' + parts.slice(1).join('');
                                }
                                
                                // Limit decimal places to 3
                                if (parts.length === 2 && parts[1].length > 3) {
                                  value = parts[0] + '.' + parts[1].slice(0, 3);
                                }
                                
                                // Enforce 1-100 SOL range
                                const numericValue = parseFloat(value);
                                if (!isNaN(numericValue) && numericValue > 100) {
                                  return; // Don't update if over 100
                                }
                                
                                setFormData(prev => ({...prev, settings: {...prev.settings, startingPortfolioValue: value}}));
                              }}
                              className="w-full text-gray-100 bg-dark-300/70 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-10 pl-8 focus:bg-dark-300 transition-colors"
                              placeholder="100"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">SOL</div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Token Buckets ({formData.allowed_buckets.length} Selected)
                            {!isAdmin && <span className="ml-2 text-xs text-gray-500">(Admin Only)</span>}
                          </label>
                          <MultiSelect
                            value={formData.allowed_buckets}
                            onChange={isAdmin ? (buckets) =>
                              setFormData((prev) => ({
                                ...prev,
                                allowed_buckets: buckets,
                              })) : () => {/* No-op for non-admins */}}
                            options={bucketOptions}
                            className={`w-full ${!isAdmin ? 'opacity-50 pointer-events-none' : ''}`}
                            disabled={!isAdmin}
                          />
                          {!isAdmin && (
                            <p className="mt-1 text-xs text-gray-500">Category selection coming soon</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* Right Column - Schedule & Financials */}
                <div className="space-y-4">
                  {userRole === 'user' && availableCredits !== undefined && availableCredits > 0 && (
                    <div className="p-3 rounded-lg border bg-green-900/20 border-green-600/30">
                      <div className="flex items-center text-green-400 text-sm font-medium">
                        <span className="mr-2">✓</span>
                        {availableCredits} Credit{availableCredits > 1 ? 's' : ''} Available
                      </div>
                    </div>
                  )}

                  {/* Schedule */}
                  <div>
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-gray-300 flex items-center">
                        <span className="w-1 h-4 bg-cyber-500 rounded-full mr-2"></span>
                        Schedule
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Start Time</label>
                        <Input
                          type="datetime-local"
                          name="start_time"
                          value={formData.start_time}
                          onChange={handleInputChange}
                          className={`w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-10 ${
                            isStartTimeTooSoon ? 'border-red-500' : ''
                          }`}
                          required
                        />
                        {isStartTimeTooSoon && (
                          <p className="mt-1 text-xs text-red-400">Start time must be at least 2 minutes in the future</p>
                        )}
                        {formData.start_time && !isStartTimeTooSoon && (() => {
                          const { dateStr, timeStr } = formatDatePreview(formData.start_time);
                          return (
                            <div className="mt-1 text-xs">
                              <div className="text-gray-400 font-medium">{dateStr}</div>
                              <div className="text-gray-500">{timeStr}</div>
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Duration</label>
                        <select
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          className="w-full text-gray-100 bg-dark-300 border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent h-10 px-3"
                          required
                        >
                          <option value="0.0833333333333333">5 minutes</option>
                          <option value="0.25">15 minutes</option>
                          <option value="0.5">30 minutes</option>
                          <option value="0.75">45 minutes</option>
                          <option value="1">1 hour</option>
                          <option value="2">2 hours</option>
                          <option value="3">3 hours</option>
                        </select>
                        {calculatedEndTime && (() => {
                          const { dateStr, timeStr } = formatDatePreview(calculatedEndTime);
                          return (
                            <div className="mt-1 text-xs">
                              <div className="text-gray-400 font-medium">Ends {dateStr}</div>
                              <div className="text-gray-500">{timeStr}</div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Participation & Entry Fee */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                      <span className="w-1 h-4 bg-neon-500 rounded-full mr-2"></span>
                      Participation & Stakes
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Participant Range</label>
                        <div className="relative">
                          <Input
                            type="text"
                            value={participantRange}
                            onChange={handleParticipantRangeChange}
                            placeholder="3-50"
                            pattern="\d+-\d+"
                            className="w-full text-gray-100 bg-dark-300/70 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-10 focus:bg-dark-300 transition-colors"
                            required
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                            participants
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Format: min-max (e.g., 3-20)</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Entry Fee</label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">◎</div>
                          <Input
                            type="text"
                            name="entry_fee"
                            value={formData.entry_fee}
                            onChange={(e) => handleSolInput(e, 'entry_fee')}
                            className="w-full text-gray-100 bg-dark-300/70 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-10 pl-8 focus:bg-dark-300 transition-colors"
                            placeholder="0.000"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">SOL</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Max: 1 SOL</p>
                      </div>
                    </div>
                  </div>

                  {/* Prize Pool Calculation */}
                  <div className={`${(parseFloat(formData.entry_fee) || 0) === 0 
                    ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/20 border border-green-500/40' 
                    : 'bg-gradient-to-br from-cyan-900/25 to-blue-900/20 border border-cyan-500/30'
                  } rounded-lg p-4 relative overflow-hidden transition-all duration-300`}>
                    {(parseFloat(formData.entry_fee) || 0) === 0 ? (
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-green-500/10 opacity-60"></div>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/8 via-blue-500/4 to-purple-500/6 opacity-70"></div>
                    )}
                    
                    {/* Contest Type Badges */}
                    {(parseFloat(formData.entry_fee) || 0) === 0 ? (
                      <div className="absolute top-0 right-0 z-20">
                        <div className="backdrop-blur-sm bg-green-500/20 text-green-300 text-xs font-medium px-2 py-1 rounded-bl-md shadow-lg">
                          FREE CONTEST
                        </div>
                      </div>
                    ) : (
                      <div className="absolute top-0 right-0 z-20">
                        <div className="backdrop-blur-sm bg-cyan-500/20 text-cyan-300 text-xs font-medium px-2 py-1 rounded-bl-md shadow-lg">
                          PAID CONTEST
                        </div>
                      </div>
                    )}
                    
                    <div className="relative z-10">
                    {calculatedPrizePool.max > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-400">Prize Pool</div>
                          <div className="text-lg text-brand-400">
                            ◎ {calculatedPrizePool.min === calculatedPrizePool.max 
                              ? (calculatedPrizePool.min * 0.9).toFixed(3).replace(/\.?0+$/, '')
                              : `${(calculatedPrizePool.min * 0.9).toFixed(3).replace(/\.?0+$/, '')}-${(calculatedPrizePool.max * 0.9).toFixed(3).replace(/\.?0+$/, '')}`
                            } SOL
                          </div>
                          <div className="text-xs text-gray-500">
                            <div>{formData.min_participants === formData.max_participants 
                              ? formData.max_participants 
                              : `${formData.min_participants}-${formData.max_participants}`} participants</div>
                            <div>× {formData.entry_fee.trim() === '' ? '0' : formData.entry_fee} SOL per entry</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-400">Degen Dividends</div>
                          <div className="text-lg text-purple-400">
                            ◎ {calculatedPrizePool.min === calculatedPrizePool.max 
                              ? (calculatedPrizePool.min * 0.1).toFixed(3).replace(/\.?0+$/, '')
                              : `${(calculatedPrizePool.min * 0.1).toFixed(3).replace(/\.?0+$/, '')}-${(calculatedPrizePool.max * 0.1).toFixed(3).replace(/\.?0+$/, '')}`
                            } SOL
                          </div>
                          <div className="text-xs text-gray-500">
                            <div>Airdropped to DUEL</div>
                            <div>holders daily
                              <a href="/wallets" className="ml-1 text-purple-400 hover:text-purple-300 transition-colors underline">
                                more info
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs text-gray-400">Prize Pool</div>
                        <div className="text-lg text-brand-400">◎ 0 SOL</div>
                        <div className="text-xs text-gray-500">
                          <div>{formData.min_participants === formData.max_participants 
                            ? formData.max_participants 
                            : `${formData.min_participants}-${formData.max_participants}`} participants</div>
                          <div>× {formData.entry_fee || '0'} SOL per entry</div>
                        </div>
                        {(parseFloat(formData.entry_fee) || 0) === 0 && (
                          <div className="mt-2 text-xs text-green-400 font-medium flex items-center">
                            <span className="mr-1">✨</span>
                            Free to join • Play for glory and bragging rights.
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Personal Degen Dividend Estimate */}
                    {user && duelTokenData?.userBalance !== undefined && duelTokenData.userBalance > 0 && calculatedPrizePool.max > 0 && (
                      <div className="mt-3 pt-3 border-t border-purple-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs text-purple-300">Your Estimated Dividend</div>
                            <div className="text-xs text-gray-500">
                              Based on your {duelTokenData.userBalance.toLocaleString()} DUEL
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-purple-300">
                              ◎ {(() => {
                                const ownershipPercentage = duelTokenData.userBalance / TOTAL_DUEL_SUPPLY;
                                const totalDividends = calculatedPrizePool.max * 0.1;
                                const personalDividend = totalDividends * ownershipPercentage;
                                return personalDividend.toFixed(6).replace(/\.?0+$/, '');
                              })()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {((duelTokenData.userBalance / TOTAL_DUEL_SUPPLY) * 100).toFixed(4)}% of total
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                  </div>

                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Actions - Compact */}
              <div className="flex gap-3 pt-2 border-t border-dark-400">
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
