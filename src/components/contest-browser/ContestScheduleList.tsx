import React, { useEffect, useState } from 'react';
import { contests, ContestSchedule } from '../../services/api/contests';

interface ContestScheduleListProps {
  limit?: number;
}

const ContestScheduleList: React.FC<ContestScheduleListProps> = ({ limit = 5 }) => {
  const [schedules, setSchedules] = useState<ContestSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await contests.getSchedules();
      
      // Sort schedules by closest upcoming contest
      const sortedSchedules = response.data.sort((a, b) => {
        const aNext = a.upcoming_contests[0]?.start_time ? new Date(a.upcoming_contests[0].start_time).getTime() : Infinity;
        const bNext = b.upcoming_contests[0]?.start_time ? new Date(b.upcoming_contests[0].start_time).getTime() : Infinity;
        return aNext - bNext;
      });
      
      setSchedules(sortedSchedules.slice(0, limit));
    } catch (err) {
      setError('Failed to load contest schedules');
      console.error('Error fetching contest schedules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Format time from hour and minute
  const formatTime = (hour: number, minute: number) => {
    const hourFormatted = hour % 12 || 12;
    const minuteFormatted = minute.toString().padStart(2, '0');
    const period = hour < 12 ? 'AM' : 'PM';
    return `${hourFormatted}:${minuteFormatted} ${period}`;
  };

  // Format days array to readable string
  const formatDays = (days: number[]) => {
    if (days.length === 7) return 'Every day';
    if (days.length === 0) return 'No days selected';
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days
      .sort((a, b) => a - b)
      .map(day => dayNames[day])
      .join(', ');
  };

  // Format date for readability
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Get time until next contest
  const getTimeUntil = (dateString: string) => {
    const now = new Date();
    const contestDate = new Date(dateString);
    const diffTime = contestDate.getTime() - now.getTime();
    
    if (diffTime <= 0) return 'Starting now';
    
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} away`;
    }
    
    if (diffHours === 0) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} away`;
    }
    
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}, ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} away`;
  };

  if (isLoading) {
    return (
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4 flex justify-center items-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchSchedules}
          className="mt-2 px-3 py-1 bg-dark-400 hover:bg-dark-500 text-gray-200 text-sm rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
        <p className="text-gray-400">No upcoming contest schedules found.</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4">
      <h3 className="text-lg font-medium text-gray-100 mb-4">Upcoming Contest Schedule</h3>
      
      <div className="space-y-4">
        {schedules.map((schedule) => (
          <div key={schedule.id} className="bg-dark-400/30 rounded-lg p-4 border border-dark-400">
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-md font-medium text-gray-200">{schedule.name}</h4>
              <div className="text-xs bg-dark-500 text-gray-300 rounded px-2 py-1">
                {formatTime(schedule.hour, schedule.minute)} • {formatDays(schedule.days)}
              </div>
            </div>
            
            <div className="text-sm text-gray-300 mb-3">
              Duration: {schedule.duration_hours} hours • Entry Fee: {schedule.entry_fee}
            </div>
            
            {schedule.upcoming_contests.length > 0 ? (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-400">Next Contests:</h5>
                <ul className="space-y-2">
                  {schedule.upcoming_contests.slice(0, 3).map((contest) => (
                    <li key={contest.id} className="bg-dark-500/40 rounded-lg p-2 flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-brand-300">{contest.name}</div>
                        <div className="text-xs text-gray-400">{formatDate(contest.start_time)}</div>
                      </div>
                      <div className="text-xs text-green-400 font-medium">
                        {getTimeUntil(contest.start_time)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-xs text-gray-400">No upcoming contests for this schedule</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContestScheduleList;