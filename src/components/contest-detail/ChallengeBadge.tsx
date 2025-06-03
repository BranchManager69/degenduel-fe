/**
 * ChallengeBadge.tsx
 * 
 * @description Component for displaying challenge status and actions
 * 
 * @author BranchManager69
 * @version 1.0.0
 * @created 2025-01-29
 */

import React from "react";
import { toast } from "react-hot-toast";
import { useMigratedAuth } from "../../hooks/auth/useMigratedAuth";
import { Button } from "../ui/Button";

interface ChallengeBadgeProps {
  challengeStatus: string;
  challengerWallet: string;
  challengedWallet: string;
  contestId: string;
  challengeExpiresAt?: string;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
}

export const ChallengeBadge: React.FC<ChallengeBadgeProps> = ({
  challengeStatus,
  challengerWallet,
  challengedWallet,
  contestId,
  challengeExpiresAt,
  onAccept,
  onReject,
  onCancel,
}) => {
  const { user } = useMigratedAuth();
  const [loading, setLoading] = React.useState(false);

  const userWallet = user?.wallet_address;
  const isChallenger = userWallet === challengerWallet;
  const isChallenged = userWallet === challengedWallet;

  const formatTimeUntilExpiry = () => {
    if (!challengeExpiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(challengeExpiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const handleAcceptChallenge = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contests/${contestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'accept' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to accept challenge');
      }

      toast.success("Challenge accepted! Good luck!", {
        duration: 4000,
        position: "bottom-right",
        style: {
          background: "#1a1a1a",
          color: "#fff",
          border: "1px solid #262626",
        },
      });

      onAccept?.();
    } catch (error) {
      console.error("Accept challenge error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to accept challenge",
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

  const handleRejectChallenge = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contests/${contestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'reject' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to reject challenge');
      }

      toast.success("Challenge rejected", {
        duration: 4000,
        position: "bottom-right",
        style: {
          background: "#1a1a1a",
          color: "#fff",
          border: "1px solid #262626",
        },
      });

      onReject?.();
    } catch (error) {
      console.error("Reject challenge error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to reject challenge",
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

  const handleCancelChallenge = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contests/${contestId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to cancel challenge');
      }

      toast.success("Challenge cancelled and refund issued", {
        duration: 4000,
        position: "bottom-right",
        style: {
          background: "#1a1a1a",
          color: "#fff",
          border: "1px solid #262626",
        },
      });

      onCancel?.();
    } catch (error) {
      console.error("Cancel challenge error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel challenge",
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

  const getStatusColor = () => {
    switch (challengeStatus) {
      case "PENDING_ACCEPTANCE":
        return "border-yellow-400/30 bg-yellow-400/10 text-yellow-300";
      case "ACCEPTED":
        return "border-green-400/30 bg-green-400/10 text-green-300";
      case "REJECTED":
        return "border-red-400/30 bg-red-400/10 text-red-300";
      case "EXPIRED":
        return "border-gray-400/30 bg-gray-400/10 text-gray-300";
      default:
        return "border-brand-400/30 bg-brand-400/10 text-brand-300";
    }
  };

  const getStatusIcon = () => {
    switch (challengeStatus) {
      case "PENDING_ACCEPTANCE":
        return "⏳";
      case "ACCEPTED":
        return "✅";
      case "REJECTED":
        return "❌";
      case "EXPIRED":
        return "⏰";
      default:
        return "⚔️";
    }
  };

  const getStatusText = () => {
    switch (challengeStatus) {
      case "PENDING_ACCEPTANCE":
        return isChallenged ? "Challenge Received" : isChallenger ? "Challenge Sent" : "Challenge Pending";
      case "ACCEPTED":
        return "Challenge Accepted";
      case "REJECTED":
        return "Challenge Rejected";
      case "EXPIRED":
        return "Challenge Expired";
      default:
        return "Challenge";
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className="font-medium">{getStatusText()}</span>
        </div>
        {challengeStatus === "PENDING_ACCEPTANCE" && (
          <div className="text-sm opacity-75">
            {formatTimeUntilExpiry()}
          </div>
        )}
      </div>

      {challengeStatus === "PENDING_ACCEPTANCE" && (
        <>
          {isChallenged && (
            <div className="space-y-3">
              <p className="text-sm opacity-75">
                You've been challenged to a 1v1 duel! Accept to begin the contest.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleAcceptChallenge}
                  disabled={loading}
                  size="sm"
                  variant="primary"
                  className="bg-green-600 hover:bg-green-700 flex-1"
                >
                  {loading ? "Accepting..." : "Accept Challenge"}
                </Button>
                <Button
                  onClick={handleRejectChallenge}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  className="border-red-400/50 text-red-400 hover:bg-red-400/10 flex-1"
                >
                  {loading ? "Rejecting..." : "Reject"}
                </Button>
              </div>
            </div>
          )}

          {isChallenger && (
            <div className="space-y-3">
              <p className="text-sm opacity-75">
                Waiting for opponent to accept your challenge...
              </p>
              <Button
                onClick={handleCancelChallenge}
                disabled={loading}
                size="sm"
                variant="outline"
                className="border-red-400/50 text-red-400 hover:bg-red-400/10"
              >
                {loading ? "Cancelling..." : "Cancel Challenge"}
              </Button>
            </div>
          )}

          {!isChallenged && !isChallenger && (
            <p className="text-sm opacity-75">
              This is a private challenge between two players.
            </p>
          )}
        </>
      )}

      {challengeStatus === "ACCEPTED" && (
        <p className="text-sm opacity-75">
          Challenge accepted! The duel will begin at the scheduled time.
        </p>
      )}

      {challengeStatus === "REJECTED" && (
        <p className="text-sm opacity-75">
          Challenge was rejected. The challenger has been refunded.
        </p>
      )}

      {challengeStatus === "EXPIRED" && (
        <p className="text-sm opacity-75">
          Challenge expired without response. The challenger has been refunded.
        </p>
      )}
    </div>
  );
}; 