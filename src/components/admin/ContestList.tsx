import React from "react";
import { formatCurrency } from "../../lib/utils";
import { Contest } from "../../types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface ContestListProps {
  contests: Contest[];
  onEditContest: (id: string) => void;
}

export const ContestList: React.FC<ContestListProps> = ({
  contests,
  onEditContest,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-100">Recent Contests</h2>
      <div className="space-y-4">
        {contests.map((contest) => (
          <Card
            key={contest.id}
            className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:bg-dark-300/50 transition-colors"
          >
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100">
                    {contest.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(contest.start_time).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Entry Fee</p>
                    <p className="text-lg font-medium text-gray-100">
                      {formatCurrency(Number(contest.entry_fee))}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEditContest(String(contest.id))}
                  >
                    Edit
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <div>
                  <span className="text-gray-400">Status: </span>
                  <span className="text-gray-100 capitalize">
                    {contest.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Participants: </span>
                  <span className="text-gray-100">
                    {contest.participant_count}/
                    {contest.settings.max_participants}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
