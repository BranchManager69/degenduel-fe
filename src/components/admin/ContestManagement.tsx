// src/components/admin/ContestManagement.tsx

/**
 * Contest Management Component
 * 
 * @description This component is used to manage contests
 * 
 * @author BranchManager69
 * @version 2.1.0
 * @created 2025-02-14
 * @updated 2025-05-08
 */

import React from "react";
import { formatCurrency } from "../../lib/utils";
import { Contest } from "../../types/index";
import { CreateContestButton } from "../contest-browser/CreateContestButton";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader } from "../ui/Card";

// Contest Management Component
interface ContestManagementProps {
  contests: Contest[];
  onEditContest: (id: string) => void;
  onDeleteContest: (id: string) => void;
  onContestCreated: () => void;
}

// Contest Management Component
export const ContestManagement: React.FC<ContestManagementProps> = ({
  contests,
  onEditContest,
  onDeleteContest,
  onContestCreated,
}) => {
  return (

    // Contest Management Card
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      
      {/* Contest Management Header */}
      <CardHeader>

        {/* Contest Management Header Content */}
        <div className="flex justify-between items-center">

          {/* Contest Management Header Title */}
          <h3 className="text-lg font-semibold text-gray-100">
            Contest Management
          </h3>

          {/* Create Contest Button */}
          <CreateContestButton onCreateClick={onContestCreated} />
        
        </div>

      </CardHeader>

      {/* Contest Cards Content */}
      <CardContent>

        {/* Contest Cards Container */}
        <div className="space-y-4">

          {/* Contest Cards */}
          {contests.map((contest) => (
            
            // Contest Card
            <div key={contest.id} className="p-4 bg-dark-300/50 rounded-lg">
              
              {/* Contest Header and Actions */}
              <div className="flex justify-between items-start mb-4">

                {/* Contest Header */}
                <div>

                  {/* Contest Name and Difficulty */}
                  <div className="flex items-center space-x-2">

                    {/* Contest Name */}
                    <div className="font-medium text-gray-100">
                      {contest.name}
                    </div>

                    {/* Contest Difficulty */}
                    <span className="text-xs text-gray-500 italic">(Difficulty: {contest.settings.difficulty || 'N/A'})</span>

                  </div>

                  {/* Contest Dates */}
                  <div className="text-sm text-gray-400 mt-1">
                    {new Date(contest.start_time).toLocaleDateString()} -{" "}
                    {new Date(contest.end_time).toLocaleDateString()}
                  </div>

                </div>

                {/* Contest Actions */}
                <div className="flex space-x-2">

                  {/* Edit Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditContest(contest.id.toString())} // Bad form
                    className="text-brand-400 border-brand-400 hover:bg-brand-400/10"
                  >
                    Edit
                  </Button>

                  {/* Delete Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteContest(contest.id.toString())}
                    className="text-red-400 border-red-400 hover:bg-red-400/10"
                  >
                    Delete
                  </Button>

                  {/* Regenerate Image Button */}
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

              {/* Contest Details */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  
                  {/* Entry Fee Label */}
                  <div className="text-sm text-gray-400">Entry Fee</div>
                  
                  {/* Entry Fee */}
                  <div className="font-medium text-gray-100">
                    {formatCurrency(Number(contest.entry_fee))}
                  </div>

                </div>

                {/* Prize Pool */}
                <div>

                  {/* Prize Pool Label */}
                  <div className="text-sm text-gray-400">Prize Pool</div>
                  
                  {/* Prize Pool */}
                  <div className="font-medium text-brand-400">
                    {formatCurrency(Number(contest.prize_pool))}
                  </div>

                </div>
                <div>

                  {/* Participants Label */}
                  <div className="text-sm text-gray-400">Participants</div>

                  {/* Participants */}
                  <div className="flex items-center space-x-2">
                    
                    {/* Participants Bar Container */}
                    <div className="w-24 h-1.5 bg-dark-400 rounded-full overflow-hidden">
                      
                      {/* Participants Bar */}
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

                    {/* Participants Count */}
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
