import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../ui/Card";

interface Participant {
  address: string;
  nickname: string;
  score?: number;
}

interface ParticipantsListProps {
  participants: Participant[];
  contestStatus: "upcoming" | "live" | "completed";
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  contestStatus,
}) => {
  const sortedParticipants = [...participants].sort((a, b) => {
    if (contestStatus === "upcoming") {
      return 0; // No sorting for upcoming contests
    }
    return (b.score || 0) - (a.score || 0); // Sort by score for live/completed contests
  });

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100">Participants</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedParticipants.map((participant, index) => (
            <div
              key={participant.address}
              className="flex items-center justify-between p-2 rounded bg-dark-300/50 hover:bg-dark-300 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <span className="text-gray-400 text-sm">#{index + 1}</span>
                <div className="flex items-center gap-3">
                  {/* Profile Picture or Placeholder */}
                  <div className="h-8 w-8 rounded-full bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                    <span className="text-lg">👤</span>
                  </div>
                  {/* Username/Address with Link */}
                  <Link
                    to={`/profile/${participant.nickname}`}
                    className="text-gray-300 hover:text-brand-400 transition-colors"
                  >
                    {participant.nickname}
                  </Link>
                </div>
              </div>
              {contestStatus !== "upcoming" &&
                participant.score !== undefined && (
                  <span
                    className={`text-sm font-medium ${
                      participant.score >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {participant.score >= 0 ? "+" : ""}
                    {participant.score.toFixed(2)}%
                  </span>
                )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
