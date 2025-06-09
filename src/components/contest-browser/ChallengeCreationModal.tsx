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
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedOpponent, setSelectedOpponent] = React.useState<any | null>(null);

  const getNextHourDateTime = () => {
    const now = new Date();
    const adjustedTime = new Date(now);
    adjustedTime.setHours(adjustedTime.getHours() + 6);
    adjustedTime.setMinutes(0, 0, 0);
    return adjustedTime.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = React.useState<ChallengeFormData>({
    opponent_wallet: "",
    name: `Duel Challenge ${Math.floor(Math.random() * 1000)}`,
    description: "May the best trader win this 1v1 duel!",
    entry_fee: "0.01",
    start_time: getNextHourDateTime(),
    end_time: new Date(
      new Date(getNextHourDateTime()).getTime() + 24 * 60 * 60 * 1000
    ).toISOString().slice(0, 16),
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
        start_time: formatDateTime(formData.start_time),
        end_time: formatDateTime(formData.end_time),
        challenged_wallet: formData.opponent_wallet,
        min_participants: 2,
        max_participants: 2,
        allowed_buckets: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        settings: {
          difficulty: formData.settings.difficulty,
          tokenTypesAllowed: [],
          startingPortfolioValue: formData.settings.startingPortfolioValue,
        },
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
      <div className="fixed inset-0 flex items-end sm:items-center justify-center">
        <div className="bg-dark-200/80 backdrop-blur-lg rounded-t-2xl sm:rounded-lg w-full sm:max-w-lg flex flex-col max-h-[85vh] sm:max-h-[90vh] border border-dark-100/20 relative group overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none" />
          
          <div className="flex justify-between items-center p-4 sm:p-5 border-b border-dark-300/50 relative z-10 bg-dark-200/40 backdrop-blur-sm">
            <h2 className="text-lg sm:text-xl font-bold text-gray-100 flex items-center">
              <span className="mr-2">⚔️</span>
              Challenge Friend
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
            {/* Opponent Selection - Compact */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Opponent</label>
              <PublicUserSearch
                onSelectUser={handleOpponentSelect}
                placeholder="Search by username or @twitter..."
                variant="modern"
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
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Challenge Name</label>
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
                  placeholder="Describe your challenge..."
                  required
                />
              </div>
            </div>

            {/* Stakes & Schedule - Inline */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Entry Fee (SOL)</label>
                <Input
                  type="text"
                  name="entry_fee"
                  value={formData.entry_fee}
                  onChange={handleInputChange}
                  className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 h-9"
                  placeholder="0.01"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">You pay upfront, opponent pays if they accept</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Duel Starts</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-1">Duel Ends</label>
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