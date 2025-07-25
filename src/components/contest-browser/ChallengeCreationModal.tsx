/**
 * ChallengeCreationModal.tsx
 * 
 * @description Modal for creating challenge contests (1v1 duels between users)
 * 
 * @author BranchManager69
 * @version 1.0.0
 * @created 2025-01-29
 */

import React from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { PublicUserSearch } from "../common/PublicUserSearch";
// import { Button } from "../ui/Button"; // Removed - using custom buttons now
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";

interface ChallengeCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userRole: 'admin' | 'user';
  availableCredits?: number;
  currentUserNickname?: string;
}

interface ChallengeFormData {
  opponent_wallet: string;
  name: string;
  description: string;
  entry_fee: string;
  start_time: string;
  end_time: string;
  settings: {
    difficulty: string;
    startingPortfolioValue: string;
  };
}

export const ChallengeCreationModal: React.FC<ChallengeCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userRole,
  availableCredits,
  currentUserNickname,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedOpponent, setSelectedOpponent] = React.useState<any | null>(null);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const modalRef = React.useRef<HTMLDivElement>(null);

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

  const [duration, setDuration] = React.useState("1"); // Duration in hours
  const [formData, setFormData] = React.useState<ChallengeFormData>({
    opponent_wallet: "",
    name: `Duel Challenge ${Math.floor(Math.random() * 1000)}`,
    description: "May the best trader win this 1v1 duel!",
    entry_fee: "0.01",
    start_time: getSmartStartTime(),
    end_time: "", // Will be calculated based on duration
    settings: {
      difficulty: "shark",
      startingPortfolioValue: "1000",
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('settings.')) {
      const settingKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingKey]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Enhanced SOL input handler with better decimal support
  const handleSolInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Allow empty string
    if (value === '') {
      setFormData(prev => ({ ...prev, entry_fee: '' }));
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
    
    setFormData(prev => ({ ...prev, entry_fee: value }));
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

  // Calculate prize pool (winner takes all - opponent's entry fee)
  const calculatedPrizePool = React.useMemo(() => {
    const entryFee = parseFloat(formData.entry_fee) || 0;
    return (entryFee * 2).toFixed(3); // Both players pay, winner takes all
  }, [formData.entry_fee]);

  // Check if start time is too close to now (less than 2 minutes)
  const isStartTimeTooSoon = React.useMemo(() => {
    if (!formData.start_time) return false;
    const startDate = new Date(formData.start_time);
    const now = new Date();
    const diffMinutes = (startDate.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes < 2;
  }, [formData.start_time]);

  // Update end time when duration or start time changes
  React.useEffect(() => {
    if (calculatedEndTime) {
      setFormData(prev => ({ ...prev, end_time: calculatedEndTime }));
    }
  }, [calculatedEndTime]);


  const handleOpponentSelect = async (user: any) => {
    // Since PublicUserSearch doesn't return wallet addresses,
    // we need to fetch the full user details
    try {
      const response = await fetch(`/api/users/by-username/${encodeURIComponent(user.nickname)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      const fullUserData = await response.json();
      
      setSelectedOpponent(fullUserData);
      setFormData(prev => ({ 
        ...prev, 
        opponent_wallet: fullUserData.wallet_address 
      }));
    } catch (error) {
      console.error('Failed to fetch opponent details:', error);
      toast.error('Failed to select opponent. Please try again.');
    }
  };

  const formatEntryFee = (fee: string): string => {
    const parsed = parseFloat(fee);
    return isNaN(parsed) ? "0" : parsed.toString();
  };

  const formatDateTime = (dateTime: string): string => {
    return new Date(dateTime).toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Credit Check for regular users
    if (userRole === 'user') {
      if (availableCredits === undefined || availableCredits < 1) {
        const creditError = "You do not have enough credits to create a challenge.";
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

    // Validation
    if (!selectedOpponent) {
      setError("Please select an opponent");
      return;
    }

    if (!formData.name.trim()) {
      setError("Challenge name is required");
      return;
    }

    if (parseFloat(formData.entry_fee) < 0) {
      setError("Entry fee cannot be negative");
      return;
    }

    const startTime = new Date(formData.start_time);
    const endTime = new Date(formData.end_time);
    if (endTime <= startTime) {
      setError("End time must be after start time");
      return;
    }

    setLoading(true);

    try {
      const challengePayload = {
        contest_type: "CHALLENGE",
        name: formData.name,
        description: formData.description,
        entry_fee: formatEntryFee(formData.entry_fee),
        stake: formatEntryFee(formData.entry_fee), // Backend might expect 'stake' instead of 'entry_fee'
        start_time: formatDateTime(formData.start_time),
        end_time: formatDateTime(calculatedEndTime),
        challenged_wallet: formData.opponent_wallet,
        min_participants: 2,
        max_participants: 2,
        allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        settings: {
          difficulty: formData.settings.difficulty,
          tokenTypesAllowed: [],
          startingPortfolioValue: formData.settings.startingPortfolioValue,
        },
        // Add empty transaction_signature for now if backend requires it
        transaction_signature: null
      };

      console.log("Creating challenge...", challengePayload);

      const response = await fetch('/api/contests/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(challengePayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Failed to create challenge: ${response.status}`);
      }

      toast.success(
        `Challenge sent to ${selectedOpponent.nickname || selectedOpponent.wallet_address.slice(0, 8)}!`,
        {
          duration: 4000,
          position: "bottom-right",
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #262626",
          },
        }
      );

      onClose();
      onSuccess?.();

      // Navigate to the created challenge
      if (data.id) {
        window.location.href = `/contests/${data.id}`;
      } else {
        window.location.href = "/contests";
      }

    } catch (error) {
      console.error("Challenge creation error:", error);
      setError(error instanceof Error ? error.message : "Failed to create challenge");
      toast.error(
        error instanceof Error ? error.message : "Failed to create challenge",
        {
          duration: 4000,
          position: "bottom-right",
          style: {
            background: "#1a1a1a",
            color: "#fff",
            border: "1px solid #262626",
          },
        }
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
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
          className="bg-dark-200/80 backdrop-blur-lg rounded-t-2xl sm:rounded-lg w-full sm:max-w-lg lg:max-w-4xl flex flex-col max-h-[85vh] sm:max-h-[90vh] border border-dark-100/20 relative group overflow-hidden" 
          onClick={(e) => e.stopPropagation()}
          onMouseDown={() => {
            // Track if user starts selecting text inside modal
            const selection = window.getSelection();
            if (selection && selection.toString().length === 0) {
              // Starting a new selection
              setIsSelecting(true);
            }
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />
          
          <div className="flex justify-between items-center p-4 sm:p-5 border-b border-dark-300/50 relative z-10 bg-dark-200/40 backdrop-blur-sm">
            <h2 className="text-lg sm:text-xl font-bold text-gray-100 flex items-center">
              <span className="mr-2">⚔️</span>
              Challenge to a Duel
            </h2>
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

          <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 relative z-10">
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
            
            {/* Opponent Selection - Compact */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Opponent</label>
              <PublicUserSearch
                onSelectUser={handleOpponentSelect}
                placeholder="Search by username or @twitter..."
                variant="modern"
                currentUserNickname={currentUserNickname}
              />
              
              {selectedOpponent && (
                <div className="mt-2 bg-dark-300/40 border border-brand-400/30 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-200">
                        {selectedOpponent.nickname || "Anonymous"}
                      </div>
                      {selectedOpponent.twitter_handle && (
                        <div className="text-sm text-brand-400">
                          {selectedOpponent.twitter_handle}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOpponent(null);
                        setFormData(prev => ({ ...prev, opponent_wallet: "" }));
                      }}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Challenge Details - Compact */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Challenge Details */}
              <div className="space-y-4">
                {/* Challenge Details */}
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Challenge Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Challenge Name</label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-10"
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
                        placeholder="Describe your challenge..."
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
                        <p className="text-xs text-gray-500">Brief description of your challenge</p>
                        <span className={`text-xs ${formData.description.length > 250 ? 'text-yellow-500' : formData.description.length === 280 ? 'text-red-500' : 'text-gray-500'}`}>
                          {formData.description.length}/280
                        </span>
                      </div>
                    </div>
                  </div>
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
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-gray-300">Schedule</h3>
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

                {/* Entry Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Entry Fee</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">◎</div>
                    <Input
                      type="text"
                      name="entry_fee"
                      value={formData.entry_fee}
                      onChange={handleSolInput}
                      className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-10 pl-8"
                      placeholder="0.01"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">SOL</div>
                  </div>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-gray-500">You pay upfront, opponent pays if they accept</p>
                    <p className="text-xs text-gray-500">Maximum 1 SOL</p>
                  </div>
                </div>

                {/* Prize Pool Display */}
                <div className={`${(parseFloat(formData.entry_fee) || 0) === 0 
                  ? 'bg-gradient-to-br from-green-900/30 to-emerald-900/20 border border-green-500/40' 
                  : 'bg-gradient-to-br from-cyan-900/25 to-blue-900/20 border border-cyan-500/30'
                } rounded-lg p-4 relative overflow-hidden transition-all duration-300`}>
                  {(parseFloat(formData.entry_fee) || 0) === 0 ? (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-green-500/10 opacity-60"></div>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/8 via-blue-500/4 to-purple-500/6 opacity-70"></div>
                  )}
                  
                  {/* Challenge Type Badges */}
                  {(parseFloat(formData.entry_fee) || 0) === 0 ? (
                    <div className="absolute top-0 right-0 z-20">
                      <div className="backdrop-blur-sm bg-green-500/20 text-green-300 text-xs font-medium px-2 py-1 rounded-bl-md shadow-lg">
                        FREE DUEL
                      </div>
                    </div>
                  ) : (
                    <div className="absolute top-0 right-0 z-20">
                      <div className="backdrop-blur-sm bg-cyan-500/20 text-cyan-300 text-xs font-medium px-2 py-1 rounded-bl-md shadow-lg">
                        PAID DUEL
                      </div>
                    </div>
                  )}
                  
                  <div className="relative z-10">
                    <div>
                      <div className="text-xs text-gray-400">Winner Takes All</div>
                      <div className="text-lg text-brand-400">◎ {calculatedPrizePool} SOL</div>
                      <div className="text-xs text-gray-500">
                        <div>2 participants</div>
                        <div>× {formData.entry_fee || '0'} SOL per entry</div>
                      </div>
                      {parseFloat(calculatedPrizePool) === 0 && (
                        <div className="mt-2 text-xs text-green-400 font-medium flex items-center">
                          <span className="mr-1">✨</span>
                          Free duel • Play for glory and bragging rights
                        </div>
                      )}
                      {parseFloat(calculatedPrizePool) > 0 && (
                        <div className="mt-2 text-xs text-cyan-400 font-medium">
                          100% to the winner • No platform fees
                        </div>
                      )}
                    </div>
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
                disabled={loading || !selectedOpponent}
                className="flex-1 px-4 py-2 text-sm bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Challenge"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}; 