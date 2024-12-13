import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'contest_join' | 'contest_complete' | 'user_register';
  timestamp: string;
  details: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'contest_join':
        return <span className="text-green-400">🎮</span>;
      case 'contest_complete':
        return <span className="text-brand-400">🏆</span>;
      case 'user_register':
        return <span className="text-blue-400">👤</span>;
      default:
        return <span className="text-gray-400">📝</span>;
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
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-dark-300/50">
              <div className="text-xl mt-1">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-100 line-clamp-2">{activity.details}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};