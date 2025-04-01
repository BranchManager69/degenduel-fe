import React from "react";

import { formatCurrency } from "../../lib/utils";
import { Contest } from "../../types/index";
import { CreateContestButton } from "../contest-browser/CreateContestButton";
import { ContestDifficulty } from "../landing/contests-preview/ContestDifficulty";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader } from "../ui/Card";

interface ContestManagementProps {
  contests: Contest[];
  onEditContest: (id: string) => void;
  onDeleteContest: (id: string) => void;
  onContestCreated: () => void;
}

export const ContestManagement: React.FC<ContestManagementProps> = ({
  contests,
  onEditContest,
  onDeleteContest,
  onContestCreated,
}) => {
  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-100">
            Contest Management
          </h3>
          <CreateContestButton onCreateClick={onContestCreated} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contests.map((contest) => (
            <div key={contest.id} className="p-4 bg-dark-300/50 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="font-medium text-gray-100">
                      {contest.name}
                    </div>
                    <ContestDifficulty
                      prize_pool={contest.prize_pool}
                      participant_count={contest.participant_count}
                      max_participants={contest.max_participants}
                      isCancelled={contest.status === "cancelled"}
                    />
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {new Date(contest.start_time).toLocaleDateString()} -{" "}
                    {new Date(contest.end_time).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditContest(contest.id.toString())} // Bad form
                    className="text-brand-400 border-brand-400 hover:bg-brand-400/10"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteContest(contest.id.toString())}
                    className="text-red-400 border-red-400 hover:bg-red-400/10"
                  >
                    Delete
                  </Button>
                  {contest.image_url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => 
                        window.open(
                          `/admin/contest-management/regenerate-image/${contest.id}`,
                          "_blank"
                        )
                      }
                      className="text-purple-400 border-purple-400 hover:bg-purple-400/10"
                    >
                      Regenerate Image
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => 
                        window.open(
                          `/admin/contest-management/regenerate-image/${contest.id}`,
                          "_blank"
                        )
                      }
                      className="text-green-400 border-green-400 hover:bg-green-400/10"
                    >
                      Generate Image
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Entry Fee</div>
                  <div className="font-medium text-gray-100">
                    {formatCurrency(Number(contest.entry_fee))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Prize Pool</div>
                  <div className="font-medium text-brand-400">
                    {formatCurrency(Number(contest.prize_pool))}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Participants</div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-1.5 bg-dark-400 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{
                          width: `${
                            (Number(contest.participant_count) /
                              contest.max_participants) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-100">
                      {Number(contest.participant_count)}/
                      {contest.max_participants}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
