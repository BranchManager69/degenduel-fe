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
import { API_URL } from "../../config/config";
// import { Button } from "../ui/Button"; // Removed - using custom buttons now
import { Input } from "../ui/Input";
import { MultiSelect } from "../ui/MultiSelect";
import { Textarea } from "../ui/Textarea";
import { useSolanaTokenData } from "../../hooks/data/useSolanaTokenData";
import { config } from "../../config/config";
import { useStore } from "../../store/useStore";
import { useIndividualToken } from "../../hooks/websocket/topic-hooks/useIndividualToken";
import { TokenSearch } from "../common/TokenSearch";
import type { SearchToken } from "../../types";

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
  const [isSelecting, setIsSelecting] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);
  // const [userDividendRank, setUserDividendRank] = React.useState<number | null>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const dividendRef = React.useRef<HTMLDivElement>(null);
  const [selectedTokens, setSelectedTokens] = React.useState<SearchToken[]>([]);
  
  // Pre-populate DUEL token on component mount
  React.useEffect(() => {
    const loadDuelToken = async () => {
      try {
        const response = await fetch(`/api/tokens/search?search=DUEL&limit=1`);
        if (response.ok) {
          const data = await response.json();
          if (data.tokens && data.tokens.length > 0) {
            setSelectedTokens([data.tokens[0]]);
          }
        }
      } catch (error) {
        console.warn('Failed to pre-populate DUEL token:', error);
      }
    };
    
    loadDuelToken();
  }, []);
  
  // Get user data and DUEL token balance
  const user = useStore(state => state.user);
  const { tokenData: duelTokenData } = useSolanaTokenData(
    config.SOLANA.DEGEN_TOKEN_ADDRESS,
    user?.wallet_address
  );
  
  // Get SOL price for USD conversion
  const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
  const { token: solToken } = useIndividualToken(SOL_ADDRESS);
  const solPrice = solToken?.price || 0;
  
  // Total DUEL supply registered to users (from API data)
  // This is the actual circulating supply that receives dividends
  const TOTAL_DUEL_SUPPLY = 153_700_935; // ~153.7M DUEL registered

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

  const [participantRange, setParticipantRange] = React.useState("3-10");

  const [duration, setDuration] = React.useState("1"); // Duration in hours
  const [formData, setFormData] = React.useState({
    name: `Degen Dustup ${Math.floor(Math.random() * 100)}`,
    description: `May the best Degen win.`,
    entry_fee: "0",
    prize_pool: "0", // Will be calculated based on entry fee × participants
    start_time: getSmartStartTime(),
    min_participants: 3,
    max_participants: 10,
    allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    settings: {
      difficulty: "guppy", // Hard-coded default
      tokenTypesAllowed: [],
      startingPortfolioValue: "100",
    } as Omit<ContestSettings, 'minParticipants' | 'maxParticipants'>,
    ai_image_prompt: "Incorporate Jewish and gay and lesbian themes throughout the token imagery", // New field for AI image generation
    featured_token_addresses: [] as string[], // Array for multiple featured tokens (max 5)
    payout_mode: "double_up" as "double_up" | "top_heavy",
    payout_percentage: 30, // % of players who win (for top heavy)
    payout_steepness: 4, // Curve steepness (1-5 scale) - Steep default
  });

  // Payout structure calculation
  const payoutStructure = React.useMemo(() => {
    if (formData.payout_mode === "double_up") {
      // Double up: top 50% get ~1.9x entry fee (accounting for platform fee)
      const payingPositions = Math.floor(formData.max_participants * 0.5);
      const payout: Record<string, number> = {};
      for (let i = 1; i <= payingPositions; i++) {
        payout[`place_${i}`] = Math.round(100 / payingPositions) / 100;
      }
      return payout;
    } else {
      // Top heavy: exponential decay curve
      const totalParticipants = formData.max_participants;
      const payingPositions = Math.max(1, Math.floor(totalParticipants * formData.payout_percentage / 100));
      
      if (payingPositions === 1) {
        return { place_1: 1.0 };
      }
      
      // Exponential decay curve with steepness control
      const steepness = formData.payout_steepness * 0.3; // Scale to reasonable range
      const positions: number[] = [];
      let total = 0;
      
      // Calculate raw exponential values
      for (let i = 0; i < payingPositions; i++) {
        const value = Math.exp(-steepness * i);
        positions.push(value);
        total += value;
      }
      
      // Convert to percentages and round
      const payouts = positions.map(value => Math.round((value / total) * 100));
      
      // Adjust to ensure total equals 100
      const currentTotal = payouts.reduce((sum, val) => sum + val, 0);
      const difference = 100 - currentTotal;
      
      if (difference !== 0) {
        // Distribute difference among top positions
        for (let i = 0; i < Math.abs(difference) && i < payouts.length; i++) {
          payouts[i] += difference > 0 ? 1 : -1;
        }
      }
      
      // Convert to backend format
      const payout: Record<string, number> = {};
      payouts.forEach((percentage, index) => {
        payout[`place_${index + 1}`] = percentage / 100;
      });
      
      return payout;
    }
  }, [formData.payout_mode, formData.max_participants, formData.payout_percentage, formData.payout_steepness]);

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
            startingPortfolioValue: formData.settings.startingPortfolioValue || "100",
          } as ContestSettings,
          image_prompt: formData.ai_image_prompt || "",
          image_headliner_token_ca: formData.featured_token_addresses.length === 1 
            ? formData.featured_token_addresses[0] 
            : "",
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
    
    // Enforce maximum entry fee of 10 SOL
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 10) {
      return; // Don't update if over 10 SOL
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

  // Fetch user's dividend rank when modal opens
  React.useEffect(() => {
    if (!isOpen || !user?.wallet_address) return;
    
    const fetchDividendRank = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_URL}/user/public/dividend-percentages?date=${today}`);
        if (response.ok) {
          await response.json();
          // const userIndex = data.holders.findIndex((h: any) => h.wallet_address === user.wallet_address);
          // if (userIndex !== -1) {
          //   setUserDividendRank(userIndex + 1); // Rank is 1-based
          // }
        }
      } catch (error) {
        console.error('Failed to fetch dividend rank:', error);
      }
    };
    
    fetchDividendRank();
  }, [isOpen, user?.wallet_address]);

  // Position tooltip
  React.useEffect(() => {
    if (showTooltip && dividendRef.current && tooltipRef.current) {
      const rect = dividendRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      tooltipRef.current.style.position = 'fixed';
      tooltipRef.current.style.top = `${rect.top - tooltipRect.height - 8}px`;
      tooltipRef.current.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
    }
  }, [showTooltip]);

  if (!isOpen) return null;

  // Create the modal
  return (<>
    {createPortal(
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div 
        className="fixed inset-0 flex items-end sm:items-center justify-center" 
        onClick={(e) => {
          // Don't close if we're selecting text
          if (isSelecting) {
            setIsSelecting(false);
            return;
          }
          // Only close if clicking on the backdrop itself, not its children
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
        onMouseUp={() => {
          // Reset selection state after mouse up
          if (isSelecting) {
            setTimeout(() => setIsSelecting(false), 100);
          }
        }}
      >
        <div 
          ref={modalRef}
          className="bg-dark-200/80 backdrop-blur-lg rounded-t-2xl sm:rounded-lg w-full sm:max-w-lg lg:max-w-4xl flex flex-col max-h-[85vh] sm:max-h-[90vh] border border-dark-100/20 relative overflow-visible" 
          onClick={(e) => e.stopPropagation()}
          onMouseDown={() => {
            // Track if user starts selecting text inside modal
            const selection = window.getSelection();
            if (selection && selection.toString().length === 0) {
              // Starting a new selection
              setIsSelecting(true);
            }
          }}
          onWheel={(e) => {
            // Prevent scroll chaining - stop scroll events from reaching the page behind
            const target = e.currentTarget.querySelector('.overflow-y-auto') as HTMLElement;
            if (target) {
              const { scrollTop, scrollHeight, clientHeight } = target;
              const deltaY = e.deltaY;
              
              // Check if we're at scroll boundaries
              const isAtTop = scrollTop === 0 && deltaY < 0;
              const isAtBottom = scrollTop + clientHeight >= scrollHeight && deltaY > 0;
              const isNotScrollable = scrollHeight <= clientHeight;
              
              // Always prevent propagation to stop scroll chaining
              if (isAtTop || isAtBottom || isNotScrollable) {
                e.preventDefault();
                e.stopPropagation();
              }
            } else {
              // If no scrollable content found, always prevent
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          
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

          <div className="overflow-y-auto p-4 sm:p-5 flex-1 scrollbar-thin scrollbar-thumb-dark-400 scrollbar-track-dark-300 relative z-10" style={{overflow: 'visible'}}>
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

                  {/* Contest Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                      <span className="w-1 h-4 bg-brand-500 rounded-full mr-2"></span>
                      Contest Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Contest Title</label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full text-gray-100 bg-dark-300/70 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-10 focus:bg-dark-300 transition-colors"
                          required
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs text-gray-400">Description</label>
                          <span className={`text-xs ${formData.description.length > 250 ? 'text-yellow-500' : formData.description.length === 280 ? 'text-red-500' : 'text-gray-500'}`}>
                            {formData.description.length}/280
                          </span>
                        </div>
                        <Textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="w-full text-gray-100 bg-dark-300/70 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg resize-none focus:bg-dark-300 transition-all duration-200 min-h-[2.5rem]"
                          rows={1}
                          placeholder="Brief description of your contest..."
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
                      </div>
                      
                      {/* Featured Tokens */}
                      <div className="relative">
                        <label className="block text-xs text-gray-400 mb-1.5">Featured Tokens</label>
                        
                        {/* Token Search - only show if less than 5 tokens selected */}
                        {selectedTokens.length < 5 && (
                          <div className="relative mb-3">
                            <TokenSearch
                              onSelectToken={(token) => {
                                // Check if token already selected
                                if (selectedTokens.some(t => t.address === token.address)) {
                                  return;
                                }
                                const newTokens = [...selectedTokens, token];
                                setSelectedTokens(newTokens);
                                setFormData(prev => ({ 
                                  ...prev, 
                                  featured_token_addresses: newTokens.map(t => t.address) 
                                }));
                              }}
                              placeholder={selectedTokens.length > 0 
                                ? `Add another token (${5 - selectedTokens.length} remaining)...` 
                                : "Search for tokens to feature..."
                              }
                              variant="modern"
                              className="w-full"
                              onDropdownOpen={() => {}}
                              onDropdownClose={() => {}}
                              clearOnSelect={true}
                              useAbsolutePositioning={true}
                            />
                          </div>
                        )}
                        
                        {/* Selected Tokens Display */}
                        {selectedTokens.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedTokens.map((token, index) => (
                              <div 
                                key={token.address}
                                className="flex items-center gap-1.5 bg-dark-300/50 border border-dark-400/50 rounded-full px-2 py-1 group hover:border-red-400/50 transition-colors"
                              >
                                {token.image_url && (
                                  <img 
                                    src={token.image_url} 
                                    alt={token.symbol || 'Token'} 
                                    className="w-5 h-5 rounded-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                )}
                                <span className="text-sm font-medium text-gray-200">{token.symbol}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newTokens = selectedTokens.filter((_, i) => i !== index);
                                    setSelectedTokens(newTokens);
                                    setFormData(prev => ({ 
                                      ...prev, 
                                      featured_token_addresses: newTokens.map(t => t.address) 
                                    }));
                                  }}
                                  className="text-gray-400 hover:text-red-400 transition-colors ml-0.5"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {selectedTokens.length === 5 && (
                          <div className="text-xs text-yellow-500 mt-2">
                            Maximum of 5 featured tokens reached
                          </div>
                        )}
                      </div>
                      
                      {/* Narrative */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs text-gray-400">Narrative</label>
                          <span className={`text-xs ${formData.ai_image_prompt.length > 180 ? 'text-yellow-500' : formData.ai_image_prompt.length === 200 ? 'text-red-500' : 'text-gray-500'}`}>
                            {formData.ai_image_prompt.length}/200
                          </span>
                        </div>
                        <Textarea
                          value={formData.ai_image_prompt}
                          onChange={(e) => setFormData(prev => ({ ...prev, ai_image_prompt: e.target.value }))}
                          className="w-full text-gray-100 bg-dark-300/70 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg resize-none focus:bg-dark-300 transition-all duration-200"
                          rows={1}
                          placeholder="Incorporate Jewish and gay and lesbian themes throughout the token imagery"
                          maxLength={200}
                        />
                        <p className="text-[9px] text-gray-500 leading-tight pl-2 mt-1">DegenDuel uses the most advanced AI model for meme image generation in the world to breathe personality into each contest with a gorgeous and meta-aware contest banner.</p>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                      <span className="w-1 h-4 bg-orange-500 rounded-full mr-2"></span>
                      Advanced Options
                      <button
                        type="button"
                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        className="ml-auto text-xs text-gray-500 hover:text-gray-400 transition-colors"
                      >
                        {showAdvancedOptions ? '− Hide' : '+ Show'}
                      </button>
                    </h3>
                    
                    {showAdvancedOptions && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">Starting Portfolio Value</label>
                          <div className="relative">
                            <img src="/assets/media/logos/solana.svg" alt="SOL" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
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
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-medium text-gray-300">
                              Token Buckets
                              {!isAdmin && <span className="ml-2 text-xs text-gray-500">(Admin Only)</span>}
                            </label>
                            {isAdmin && (
                              <button
                                  type="button"
                                  onClick={() => {
                                    if (formData.allowed_buckets.length === bucketOptions.length) {
                                      setFormData(prev => ({ ...prev, allowed_buckets: [] }));
                                    } else {
                                      setFormData(prev => ({ ...prev, allowed_buckets: bucketOptions.map(opt => opt.value) }));
                                    }
                                  }}
                                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                                    formData.allowed_buckets.length === bucketOptions.length
                                      ? 'text-red-400 hover:text-red-300 border-red-400/30 hover:border-red-400/50'
                                      : 'text-green-400 hover:text-green-300 border-green-400/30 hover:border-green-400/50'
                                  }`}
                                >
                                  {formData.allowed_buckets.length === bucketOptions.length ? "Deselect All" : "Select All"}
                                </button>
                            )}
                          </div>
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
                            hideSelectAll={true}
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
                          className={`w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-10 text-sm ${
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
                          {isAdmin && (
                            <>
                              <option value="0.0833333333333333">5 minutes</option>
                              <option value="0.25">15 minutes</option>
                              <option value="0.5">30 minutes</option>
                              <option value="0.75">45 minutes</option>
                            </>
                          )}
                          <option value="1">1 hour</option>
                          <option value="2">2 hours</option>
                          <option value="3">3 hours</option>
                          <option value="6">6 hours</option>
                          <option value="12">12 hours</option>
                          <option value="24">24 hours</option>
                          {isAdmin && (
                            <>
                              <option value="48">48 hours</option>
                              <option value="72">72 hours</option>
                              <option value="168">1 week</option>
                            </>
                          )}
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
                        <p className="text-xs text-gray-500 mt-1">Format: min-max (e.g., 3-10)</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Entry Fee</label>
                        <div className="relative">
                          <img src="/assets/media/logos/solana.svg" alt="SOL" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
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
                        <p className="text-xs text-gray-500 mt-1">Max: 10 SOL</p>
                      </div>
                    </div>
                  </div>

                  {/* Payout Structure - Only show for paid contests */}
                  {(parseFloat(formData.entry_fee) || 0) > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
                        <span className="w-1 h-4 bg-yellow-500 rounded-full mr-2"></span>
                        Payout Structure
                      </h3>
                      
                      {/* Mode Selection - Tab Style */}
                      <div className="space-y-4">
                        <div className="flex p-1 bg-dark-400/50 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, payout_mode: "double_up" }))}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                              formData.payout_mode === "double_up"
                                ? "bg-brand-500 text-white shadow-lg"
                                : "text-gray-400 hover:text-gray-200"
                            }`}
                          >
                            Double Up
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, payout_mode: "top_heavy" }))}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                              formData.payout_mode === "top_heavy"
                                ? "bg-brand-500 text-white shadow-lg"
                                : "text-gray-400 hover:text-gray-200"
                            }`}
                          >
                            Top Heavy
                          </button>
                        </div>
                        
                        {/* Double Up Description */}
                        {formData.payout_mode === "double_up" && (
                          <div className="p-3 bg-dark-300/30 rounded-lg">
                            <p className="text-xs text-gray-400">
                              Top 50% of participants win approximately double their entry fee
                            </p>
                          </div>
                        )}
                        
                        {/* Top Heavy Controls */}
                        {formData.payout_mode === "top_heavy" && (
                          <div className="space-y-4">
                            <div className="space-y-4">
                              <div className="p-3 bg-dark-300/30 rounded-lg">
                                <label className="block text-xs text-gray-400 mb-3">Players Who Win</label>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <input
                                      type="range"
                                      min="5"
                                      max="50"
                                      step="5"
                                      value={formData.payout_percentage}
                                      onChange={(e) => setFormData(prev => ({ ...prev, payout_percentage: parseInt(e.target.value) }))}
                                      className="w-full h-2 bg-dark-400 rounded-lg appearance-none cursor-pointer slider accent-brand-400"
                                      style={{
                                        background: `linear-gradient(to right, #00d4ff 0%, #00d4ff ${(formData.payout_percentage - 5) / 45 * 100}%, #374151 ${(formData.payout_percentage - 5) / 45 * 100}%, #374151 100%)`
                                      }}
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                      <span>5%</span>
                                      <span>50%</span>
                                    </div>
                                  </div>
                                  <div className="text-2xl font-bold text-brand-400 min-w-[4rem] text-center">
                                    {formData.payout_percentage}%
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-3 bg-dark-300/30 rounded-lg">
                                <label className="block text-xs text-gray-400 mb-3">Distribution Curve</label>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <input
                                      type="range"
                                      min="1"
                                      max="5"
                                      step="1"
                                      value={formData.payout_steepness}
                                      onChange={(e) => setFormData(prev => ({ ...prev, payout_steepness: parseInt(e.target.value) }))}
                                      className="w-full h-2 bg-dark-400 rounded-lg appearance-none cursor-pointer slider accent-purple-400"
                                      style={{
                                        background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${(formData.payout_steepness - 1) / 4 * 100}%, #374151 ${(formData.payout_steepness - 1) / 4 * 100}%, #374151 100%)`
                                      }}
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                      <span>Gentle</span>
                                      <span>Extreme</span>
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium text-purple-400 min-w-[5rem] text-center">
                                    {formData.payout_steepness === 1 ? 'Gentle' : 
                                     formData.payout_steepness === 2 ? 'Mild' :
                                     formData.payout_steepness === 3 ? 'Medium' :
                                     formData.payout_steepness === 4 ? 'Steep' : 'Extreme'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Payout Preview - Visual Chart */}
                        <div className="p-3 bg-dark-300/30 rounded-lg">
                          <h4 className="text-xs text-gray-400 mb-3">Payout Distribution ({formData.max_participants} participants)</h4>
                          <div className="h-32 flex items-end gap-1">
                            {(() => {
                              const totalPositions = formData.max_participants;
                              const maxPercent = Math.round((Object.values(payoutStructure)[0] as number) * 100);
                              
                              // Create array for all positions
                              const positions = [];
                              for (let i = 1; i <= Math.min(totalPositions, 20); i++) {
                                const payout = payoutStructure[`place_${i}`];
                                positions.push({
                                  place: i,
                                  percentage: payout ? Math.round(payout * 100) : 0,
                                  isPaying: !!payout
                                });
                              }
                              
                              return positions.map((pos) => {
                                const entryFee = parseFloat(formData.entry_fee) || 0;
                                const minPrize = pos.percentage > 0 ? (pos.percentage / 100) * entryFee * formData.min_participants * 0.9 : 0;
                                const maxPrize = pos.percentage > 0 ? (pos.percentage / 100) * entryFee * formData.max_participants * 0.9 : 0;
                                
                                return (
                                  <div key={pos.place} className="flex-1 flex flex-col items-center">
                                    <div className="w-full relative group">
                                      <div 
                                        className={`w-full rounded-t transition-all relative cursor-pointer ${
                                          pos.isPaying 
                                            ? 'bg-gradient-to-t from-brand-400 to-brand-500 hover:from-brand-300 hover:to-brand-400' 
                                            : 'bg-gray-600/30'
                                        }`}
                                        style={{ 
                                          height: pos.percentage > 0 
                                            ? `${(pos.percentage / maxPercent) * 104}px` 
                                            : '2px',
                                          minHeight: pos.isPaying ? '20px' : '2px'
                                        }}
                                      >
                                        {pos.percentage > 0 && (
                                          <div className="absolute left-1/2 -top-4 text-[10px] text-white font-medium whitespace-nowrap flex items-center gap-0.5" style={{ transform: 'translateX(-75%)' }}>
                                            <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-2.5 h-2.5" />
                                            {maxPrize.toFixed(2)}
                                          </div>
                                        )}
                                        
                                        {/* USD equivalent inside bar */}
                                        {pos.percentage > 0 && solPrice > 0 && (
                                          <div className="absolute left-1/2 -translate-x-1/2 top-0.5 text-[11px] text-gray-900 font-bold whitespace-nowrap">
                                            ${Math.round(maxPrize * solPrice)}
                                          </div>
                                        )}
                                        
                                        {/* Hover Tooltip */}
                                        {pos.isPaying && (
                                          <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            <div className="bg-dark-400 text-gray-200 text-xs rounded px-2 py-1 whitespace-nowrap border border-dark-300">
                                              <div className="font-medium">Place #{pos.place}</div>
                                              <div className="text-brand-400 flex items-center gap-1">
                                                {minPrize === maxPrize 
                                                  ? `${minPrize.toFixed(2)}`
                                                  : `${minPrize.toFixed(2)}-${maxPrize.toFixed(2)}`
                                                }
                                                <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                                              </div>
                                              {solPrice > 0 && (
                                                <div className="text-gray-400 text-xs">
                                                  ${(() => {
                                                    const minUSD = minPrize * solPrice;
                                                    const maxUSD = maxPrize * solPrice;
                                                    return minUSD === maxUSD 
                                                      ? minUSD.toFixed(2)
                                                      : `${minUSD.toFixed(2)}-${maxUSD.toFixed(2)}`;
                                                  })()}
                                                </div>
                                              )}
                                            </div>
                                            <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-dark-400 border-r border-b border-dark-300 transform rotate-45"></div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {pos.place}
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                            {formData.max_participants > 20 && (
                              <div className="flex-1 flex flex-col items-center justify-end">
                                <div className="text-xs text-gray-500">...</div>
                              </div>
                            )}
                          </div>
                          <div className="mt-3 pt-3 border-t border-dark-400/50">
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-gray-400">Total Prize Pool:</span>
                              <span className="text-brand-400 font-medium">
                                {(() => {
                                  const entryFee = parseFloat(formData.entry_fee) || 0;
                                  const minPool = entryFee * formData.min_participants * 0.9;
                                  const maxPool = entryFee * formData.max_participants * 0.9;
                                  return minPool === maxPool 
                                    ? `${minPool.toFixed(3)} SOL`
                                    : `${minPool.toFixed(3)}-${maxPool.toFixed(3)} SOL`;
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-400">Winners/Losers:</span>
                              <span>
                                <span className="text-green-400">{Object.keys(payoutStructure).length}</span>
                                <span className="text-gray-400"> / </span>
                                <span className="text-red-400">{formData.max_participants - Object.keys(payoutStructure).length}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                            <span className="inline-flex items-center gap-1">
                              <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                              {calculatedPrizePool.min === calculatedPrizePool.max 
                              ? (calculatedPrizePool.min * 0.9).toFixed(3).replace(/\.?0+$/, '')
                              : `${(calculatedPrizePool.min * 0.9).toFixed(3).replace(/\.?0+$/, '')}-${(calculatedPrizePool.max * 0.9).toFixed(3).replace(/\.?0+$/, '')}`
                            }
                            </span>
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
                            <span className="inline-flex items-center gap-1">
                              <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                              {calculatedPrizePool.min === calculatedPrizePool.max 
                              ? (calculatedPrizePool.min * 0.1).toFixed(3).replace(/\.?0+$/, '')
                              : `${(calculatedPrizePool.min * 0.1).toFixed(3).replace(/\.?0+$/, '')}-${(calculatedPrizePool.max * 0.1).toFixed(3).replace(/\.?0+$/, '')}`
                            }
                            </span>
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
                        <div className="text-lg text-brand-400">
                          <span className="inline-flex items-center gap-1">
                            <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                            0
                          </span>
                        </div>
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
                            <div className="text-xs text-purple-300">Your Dividend from this Contest</div>
                            <div className="text-xs text-gray-500">
                              Based on your {Math.floor(duelTokenData.userBalance).toLocaleString()} DUEL
                            </div>
                          </div>
                          <div className="text-right">
                            <div 
                              ref={dividendRef}
                              className="text-sm font-medium text-purple-300 inline-block cursor-help"
                              onMouseEnter={() => setShowTooltip(true)}
                              onMouseLeave={() => setShowTooltip(false)}
                            >
                              <span className="inline-flex items-center gap-1">
                              <img src="/assets/media/logos/solana.svg" alt="SOL" className="w-3 h-3" />
                              {(() => {
                              const ownershipPercentage = duelTokenData.userBalance / TOTAL_DUEL_SUPPLY;
                              const minDividends = calculatedPrizePool.min * 0.1;
                              const maxDividends = calculatedPrizePool.max * 0.1;
                              const minPersonalDividend = minDividends * ownershipPercentage;
                              const maxPersonalDividend = maxDividends * ownershipPercentage;
                              
                              if (minPersonalDividend === maxPersonalDividend) {
                                return minPersonalDividend.toFixed(3).replace(/\.?0+$/, '');
                              } else {
                                return `${minPersonalDividend.toFixed(3).replace(/\.?0+$/, '')}-${maxPersonalDividend.toFixed(3).replace(/\.?0+$/, '')}`;
                              }
                            })()}
                              </span>
                            </div>
                            <div className="text-xs text-green-400">
                              {solPrice > 0 ? (
                                <>
                                  ${(() => {
                                  const ownershipPercentage = duelTokenData.userBalance / TOTAL_DUEL_SUPPLY;
                                  const minDividends = calculatedPrizePool.min * 0.1;
                                  const maxDividends = calculatedPrizePool.max * 0.1;
                                  const minPersonalDividend = minDividends * ownershipPercentage;
                                  const maxPersonalDividend = maxDividends * ownershipPercentage;
                                  const minUSD = minPersonalDividend * solPrice;
                                  const maxUSD = maxPersonalDividend * solPrice;
                                  
                                  if (minUSD === maxUSD) {
                                    return minUSD.toFixed(2);
                                  } else {
                                    return `${minUSD.toFixed(2)}-${maxUSD.toFixed(2)}`;
                                  }
                                })()}
                              </>
                              ) : (
                                <span className="text-gray-400 italic animate-pulse">Loading...</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 p-2 bg-purple-900/20 rounded text-xs text-purple-200">
                          <span className="text-purple-400">💡</span> Dividends are distributed based on DUEL held by members
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

            </form>
          </div>
          
          {/* Fixed Footer - Action Buttons */}
          <div className="flex-shrink-0 p-4 sm:p-5 border-t border-dark-400 bg-dark-200/90 backdrop-blur-sm">
            <div className="flex gap-4 items-center">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-red-400 bg-red-900/10 border border-red-600/50 rounded-lg hover:bg-red-900/20 hover:border-red-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-6 py-3 text-base font-semibold text-green-300 bg-green-900/15 border border-green-500/60 rounded-lg hover:bg-green-900/25 hover:border-green-400 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Contest...
                  </span>
                ) : (
                  "Create Contest"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )}
  
  {/* Tooltip Portal */}
  {showTooltip && createPortal(
    <div 
      ref={tooltipRef}
      className="fixed z-[100] pointer-events-none"
    >
      <div className="bg-dark-400 text-gray-200 text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg border border-dark-300">
        <div className="font-medium mb-1">Dividend Range</div>
        <div className="text-gray-400">
          {formData.min_participants === formData.max_participants 
            ? `Based on ${formData.min_participants} participants`
            : `Min: ${formData.min_participants} participants → Low dividend`
          }
        </div>
        {formData.min_participants !== formData.max_participants && (
          <div className="text-gray-400">
            Max: {formData.max_participants} participants → High dividend
          </div>
        )}
        <div className="absolute bottom-[-4px] left-1/2 transform -translate-x-1/2 w-2 h-2 bg-dark-400 border-r border-b border-dark-300 transform rotate-45"></div>
      </div>
    </div>,
    document.body
  )}
  </>);
};
