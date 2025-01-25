import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../ui/Card";

export interface ContestEntry {
  contest_id: number;
  contest_name: string;
  start_time: string;
  end_time: string;
  portfolio_return: string;
  rank: string;
}

interface ContestHistoryProps {
  contests: ContestEntry[];
}

export const ContestHistory: React.FC<ContestHistoryProps> = ({ contests }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100">Contest History</h3>
      </CardHeader>
      <CardContent>
        {contests.length > 0 ? (
          <div className="space-y-4">
            {contests.map((contest) => (
              <Link
                key={contest.contest_id}
                to={`/contests/${contest.contest_id}/results`}
                className="block hover:bg-dark-300/50 transition-colors"
              >
                <div className="p-4 rounded-lg border border-dark-300">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-100">
                        {contest.contest_name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDate(contest.start_time)} -{" "}
                        {formatDate(contest.end_time)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-100">
                        {contest.rank !== "-"
                          ? `Rank: ${contest.rank}`
                          : "In Progress"}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span
                      className={`font-medium ${
                        parseFloat(contest.portfolio_return) >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {contest.portfolio_return}
                    </span>
                    <span className="text-gray-400"> portfolio return</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No contests played yet. Join a contest to start building your
            history!
          </div>
        )}
      </CardContent>
    </Card>
  );
};
