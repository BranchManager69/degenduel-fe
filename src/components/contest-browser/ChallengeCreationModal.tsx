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
import { User } from "../../services/userService";
import { UserSearch } from "../admin/UserSearch";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
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
  const [selectedOpponent, setSelectedOpponent] = React.useState<User | null>(null);

  const getNextHourDateTime = () => {
    const now = new Date();
    const adjustedTime = new Date(now);
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
      new Date(getNextHourDateTime()).getTime() + 2 * 60 * 60 * 1000
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

  const handleSelectChange = (name: string, value: string) => {
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

  const handleOpponentSelect = (user: User) => {
    setSelectedOpponent(user);
    setFormData(prev => ({ 
      ...prev, 
      opponent_wallet: user.wallet_address 
    }));
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
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-dark-200 rounded-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-6 border-b border-dark-300">
            <h2 className="text-xl font-bold text-gray-100 flex items-center">
              <span className="mr-3">⚔️</span>
              Challenge Friend
            </h2>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200"
            >
              ✕
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
            {/* Opponent Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                <span className="w-2 h-2 bg-brand-500 rounded-full mr-3"></span>
                Select Opponent
              </h3>
              
              <div className="space-y-4">
                <UserSearch
                  onSearch={() => {}} // We don't need this callback
                  onSelectUser={handleOpponentSelect}
                  placeholder="Search by wallet address or nickname..."
                  variant="modern"
                />
                
                {selectedOpponent && (
                  <div className="bg-dark-300/40 border border-brand-400/30 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-lg font-medium text-gray-200">
                          {selectedOpponent.nickname || "Anonymous"}
                        </div>
                        <div className="text-sm text-gray-400 font-mono">
                          {selectedOpponent.wallet_address.substring(0, 8)}...
                          {selectedOpponent.wallet_address.substring(selectedOpponent.wallet_address.length - 4)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOpponent(null);
                          setFormData(prev => ({ ...prev, opponent_wallet: "" }));
                        }}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Challenge Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                <span className="w-2 h-2 bg-brand-500 rounded-full mr-3"></span>
                Challenge Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Challenge Name
                  </label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg"
                    rows={3}
                    placeholder="Describe your challenge..."
                    required
                  />
                </div>
              </div>
            </div>

            {/* Financial Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                Stakes
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Entry Fee (SOL)
                  </label>
                  <Input
                    type="text"
                    name="entry_fee"
                    value={formData.entry_fee}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20"
                    placeholder="0.01"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    You pay upfront, opponent pays if they accept
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Difficulty
                  </label>
                  <Select
                    value={formData.settings.difficulty}
                    onChange={(value) => handleSelectChange('settings.difficulty', value)}
                    options={[
                      { value: "guppy", label: "Guppy" },
                      { value: "tadpole", label: "Tadpole" },
                      { value: "squid", label: "Squid" },
                      { value: "dolphin", label: "Dolphin" },
                      { value: "shark", label: "Shark" },
                      { value: "whale", label: "Whale" },
                    ]}
                    className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Schedule
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duel Starts
                  </label>
                  <Input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20"
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
                    className="w-full text-gray-100 bg-dark-300 border-dark-400 focus:border-brand-500 focus:ring-brand-500/20"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="border-t border-dark-400 pt-6">
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="text-gray-300 border-gray-600 hover:bg-dark-300 px-6 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={loading || !selectedOpponent}
                  className="min-w-[140px] px-6 py-2"
                >
                  {loading ? "Sending..." : "Send Challenge"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}; 