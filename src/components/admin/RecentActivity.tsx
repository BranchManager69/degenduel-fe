import { formatDistanceToNow } from "date-fns";
import React from "react";
import { Card, CardContent, CardHeader } from "../ui/Card";

interface ActivityWithDate {
  id: string;
  type: "contest_join" | "contest_complete" | "user_register";
  timestamp: string;
  details: string;
  created_at: Date;
}

interface RecentActivityProps {
  activities: ActivityWithDate[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
}) => {
  const formatActivityTime = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      console.error("Failed to format date:", date, err);
      return "Invalid date";
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "contest_join":
        return "Joined Contest";
      case "contest_complete":
        return "Contest Completed";
      case "user_register":
        return "New User";
      default:
        return "Activity";
    }
  };

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100">Recent Activity</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start space-x-3 p-3 bg-dark-300/50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-100">
                    {getActivityLabel(activity.type)}
                  </span>
                  <span className="text-sm text-gray-400">
                    {formatActivityTime(activity.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{activity.details}</p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center text-gray-400 py-4">
              No recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
