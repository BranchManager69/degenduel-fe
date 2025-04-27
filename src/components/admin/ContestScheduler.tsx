import React, { useEffect, useState } from 'react';
import { useContestScheduler } from '../../hooks/websocket/topic-hooks/useContestScheduler';
import { admin } from '../../services/api/admin';

// Define interfaces for our component
interface ContestTemplate {
  id: number;
  name: string;
  description: string;
  entry_fee: string;
  min_participants: number;
  max_participants: number;
}

interface ContestSchedule {
  id: number;
  name: string;
  template_id: number;
  hour: number;
  minute: number;
  days: number[];
  duration_hours: number;
  enabled: boolean;
  entry_fee_override?: string;
  advance_notice_hours?: number;
  allow_multiple_hours?: boolean;
  template?: {
    id: number;
    name: string;
    description: string;
  };
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const ContestScheduler: React.FC = () => {
  // State for scheduler service
  const { 
    schedulerData, 
    isConnected, 
    requestSchedulerData, 
    controlSchedulerService 
  } = useContestScheduler();

  // State for schedules and templates
  const [schedules, setSchedules] = useState<ContestSchedule[]>([]);
  const [templates, setTemplates] = useState<ContestTemplate[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  
  // State for editing and creating schedules
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<ContestSchedule | null>(null);
  const [formSchedule, setFormSchedule] = useState<Partial<ContestSchedule>>({
    name: '',
    template_id: 0,
    hour: 12,
    minute: 0,
    days: [1, 2, 3, 4, 5], // Mon-Fri by default
    duration_hours: 1.5,
    enabled: true,
    entry_fee_override: '',
    advance_notice_hours: 1,
    allow_multiple_hours: false
  });

  // Load schedules and templates on component mount
  useEffect(() => {
    fetchSchedules();
    fetchTemplates();
  }, []);

  // Fetch schedules from the API
  const fetchSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const response = await admin.contestScheduler.getAllDbSchedules();
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  // Fetch templates from the API
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await admin.contestScheduler.getTemplates();
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Handle creating a new schedule
  const handleCreateSchedule = async () => {
    try {
      await admin.contestScheduler.createDbSchedule(formSchedule as Omit<ContestSchedule, 'id'>);
      setIsCreating(false);
      resetForm();
      fetchSchedules();
    } catch (error) {
      console.error('Failed to create schedule:', error);
    }
  };

  // Handle updating an existing schedule
  const handleUpdateSchedule = async () => {
    if (!currentSchedule) return;
    
    try {
      await admin.contestScheduler.updateDbSchedule(currentSchedule.id, formSchedule);
      setIsEditing(false);
      resetForm();
      fetchSchedules();
    } catch (error) {
      console.error('Failed to update schedule:', error);
    }
  };

  // Handle deleting a schedule
  const handleDeleteSchedule = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      await admin.contestScheduler.deleteDbSchedule(id);
      fetchSchedules();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  // Handle creating a contest from a schedule
  const handleCreateContest = async (scheduleId: number) => {
    try {
      const response = await admin.contestScheduler.createContestFromDb(scheduleId);
      alert(`Contest created: ${response.data.contest.name}`);
    } catch (error) {
      console.error('Failed to create contest:', error);
      alert('Failed to create contest');
    }
  };

  // Handle migrating config to database
  const handleMigrateConfig = async () => {
    if (!window.confirm('Are you sure you want to migrate config schedules to the database?')) return;
    
    try {
      await admin.contestScheduler.migrateConfig();
      fetchSchedules();
      alert('Config schedules migrated successfully');
    } catch (error) {
      console.error('Failed to migrate config:', error);
      alert('Failed to migrate config schedules');
    }
  };

  // Reset form state
  const resetForm = () => {
    setCurrentSchedule(null);
    setFormSchedule({
      name: '',
      template_id: templates.length > 0 ? templates[0].id : 0,
      hour: 12,
      minute: 0,
      days: [1, 2, 3, 4, 5],
      duration_hours: 1.5,
      enabled: true,
      entry_fee_override: '',
      advance_notice_hours: 1,
      allow_multiple_hours: false
    });
  };

  // Start editing a schedule
  const startEditing = (schedule: ContestSchedule) => {
    setCurrentSchedule(schedule);
    setFormSchedule({
      name: schedule.name,
      template_id: schedule.template_id,
      hour: schedule.hour,
      minute: schedule.minute,
      days: [...schedule.days],
      duration_hours: schedule.duration_hours,
      enabled: schedule.enabled,
      entry_fee_override: schedule.entry_fee_override || '',
      advance_notice_hours: schedule.advance_notice_hours || 1,
      allow_multiple_hours: schedule.allow_multiple_hours || false
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  // Start creating a new schedule
  const startCreating = () => {
    resetForm();
    setIsCreating(true);
    setIsEditing(false);
  };

  // Handle form field changes
  const handleFormChange = (field: string, value: any) => {
    setFormSchedule({
      ...formSchedule,
      [field]: value
    });
  };

  // Handle checkbox toggle for days of week
  const handleDayToggle = (day: number) => {
    const currentDays = formSchedule.days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    handleFormChange('days', newDays);
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
    
    return days
      .sort((a, b) => a - b)
      .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.label.substring(0, 3))
      .join(', ');
  };

  // Find template name by ID
  const getTemplateName = (templateId: number) => {
    const template = templates.find(t => t.id === templateId);
    return template ? template.name : 'Unknown template';
  };

  return (
    <div className="bg-dark-300/30 rounded-lg border border-dark-300 p-4 space-y-6">
      {/* Header with service status */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-100">Contest Scheduler</h2>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-400 mr-2">Service:</span>
            <span className={`text-sm font-medium ${schedulerData.status.isRunning ? 'text-green-400' : 'text-red-400'}`}>
              {schedulerData.status.isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => controlSchedulerService('start')}
              disabled={schedulerData.status.isRunning}
              className={`px-3 py-1 text-xs rounded ${
                schedulerData.status.isRunning 
                  ? 'bg-dark-500 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              Start
            </button>
            
            <button
              onClick={() => controlSchedulerService('stop')}
              disabled={!schedulerData.status.isRunning}
              className={`px-3 py-1 text-xs rounded ${
                !schedulerData.status.isRunning 
                  ? 'bg-dark-500 text-gray-500 cursor-not-allowed' 
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              Stop
            </button>
            
            <button
              onClick={() => controlSchedulerService('restart')}
              className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Restart
            </button>
            
            <button
              onClick={requestSchedulerData}
              className="px-3 py-1 text-xs rounded bg-dark-500 text-gray-300 hover:bg-dark-600"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {/* Service Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Health Status */}
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-400">
          <h3 className="text-md font-medium text-gray-200 mb-3">Health Status</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <p className={`text-lg font-semibold ${
                schedulerData.status.health.status === 'healthy' 
                  ? 'text-green-400' 
                  : schedulerData.status.health.status === 'degraded'
                    ? 'text-yellow-400'
                    : 'text-red-400'
              }`}>
                {schedulerData.status.health.status || 'Unknown'}
              </p>
            </div>
            
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Circuit Breaker</p>
              <p className={`text-lg font-semibold ${
                schedulerData.status.health.circuitBreaker.isOpen ? 'text-red-400' : 'text-green-400'
              }`}>
                {schedulerData.status.health.circuitBreaker.isOpen ? 'Open' : 'Closed'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-400">
          <h3 className="text-md font-medium text-gray-200 mb-3">Contest Stats</h3>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Created</p>
              <p className="text-lg font-semibold text-blue-400">{schedulerData.stats.contests.created}</p>
            </div>
            
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">DB Source</p>
              <p className="text-lg font-semibold text-purple-400">{schedulerData.stats.contests.createdFromDatabaseSchedules}</p>
            </div>
            
            <div className="bg-dark-500/30 p-3 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Maintenance</p>
              <p className="text-lg font-semibold text-orange-400">{schedulerData.stats.contests.createdDuringMaintenance}</p>
            </div>
          </div>
        </div>
        
        {/* Next Scheduled */}
        <div className="bg-dark-400/30 p-4 rounded-lg border border-dark-400">
          <h3 className="text-md font-medium text-gray-200 mb-3">Next Scheduled</h3>
          
          <div className="bg-dark-500/30 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Next contest at</p>
            <p className="text-lg font-semibold text-green-400">
              {schedulerData.stats.contests.nextScheduledAt 
                ? new Date(schedulerData.stats.contests.nextScheduledAt).toLocaleString() 
                : 'None scheduled'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Schedules List */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-100">Contest Schedules</h3>
          
          <div className="flex items-center gap-2">
            <button
              onClick={startCreating}
              className="px-3 py-1 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg transition-colors"
            >
              Create New Schedule
            </button>
            
            <button
              onClick={handleMigrateConfig}
              className="px-3 py-1 bg-dark-500 hover:bg-dark-600 text-gray-300 text-sm rounded-lg transition-colors"
            >
              Migrate From Config
            </button>
            
            <button
              onClick={fetchSchedules}
              className="p-1 bg-dark-500 hover:bg-dark-600 text-gray-300 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        
        {isLoadingSchedules ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-dark-400/20 rounded-lg p-6 text-center">
            <p className="text-gray-400">No schedules found. Create a new schedule or migrate from configuration.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead className="text-xs uppercase bg-dark-500/30 text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Template</th>
                  <th className="px-4 py-3 text-left">Days</th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Duration</th>
                  <th className="px-4 py-3 text-center">Enabled</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-400/30">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-dark-400/20">
                    <td className="px-4 py-3">{schedule.name}</td>
                    <td className="px-4 py-3">{getTemplateName(schedule.template_id)}</td>
                    <td className="px-4 py-3">{formatDays(schedule.days)}</td>
                    <td className="px-4 py-3">{formatTime(schedule.hour, schedule.minute)}</td>
                    <td className="px-4 py-3">{schedule.duration_hours} hrs</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-3 h-3 rounded-full ${
                        schedule.enabled ? 'bg-green-500' : 'bg-red-500'
                      }`}></span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEditing(schedule)}
                          className="p-1 text-blue-400 hover:text-blue-300"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-1 text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => handleCreateContest(schedule.id)}
                          className="p-1 text-green-400 hover:text-green-300"
                          title="Create Contest Now"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Create/Edit Form */}
      {(isCreating || isEditing) && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-dark-300 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-100 mb-4">
              {isCreating ? 'Create New Schedule' : 'Edit Schedule'}
            </h3>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Schedule Name</label>
                <input
                  type="text"
                  value={formSchedule.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="Daily Contest"
                />
              </div>
              
              {/* Template */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Contest Template</label>
                <select
                  value={formSchedule.template_id}
                  onChange={(e) => handleFormChange('template_id', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  {isLoadingTemplates ? (
                    <option>Loading templates...</option>
                  ) : templates.length === 0 ? (
                    <option>No templates available</option>
                  ) : (
                    templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Hour</label>
                  <select
                    value={formSchedule.hour}
                    onChange={(e) => handleFormChange('hour', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {Array.from({ length: 24 }).map((_, idx) => (
                      <option key={idx} value={idx}>
                        {idx % 12 || 12} {idx < 12 ? 'AM' : 'PM'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Minute</label>
                  <select
                    value={formSchedule.minute}
                    onChange={(e) => handleFormChange('minute', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <option key={idx} value={idx * 5}>
                        {(idx * 5).toString().padStart(2, '0')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Days */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Days of Week</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleDayToggle(day.value)}
                      className={`px-3 py-1 text-xs rounded-md ${
                        formSchedule.days?.includes(day.value)
                          ? 'bg-brand-500 text-white'
                          : 'bg-dark-500 text-gray-400 hover:bg-dark-600'
                      }`}
                    >
                      {day.label.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  value={formSchedule.duration_hours}
                  onChange={(e) => handleFormChange('duration_hours', parseFloat(e.target.value))}
                  step="0.5"
                  min="0.5"
                  max="24"
                  className="w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              
              {/* Entry Fee Override */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Entry Fee Override (optional)
                </label>
                <input
                  type="text"
                  value={formSchedule.entry_fee_override}
                  onChange={(e) => handleFormChange('entry_fee_override', e.target.value)}
                  placeholder="Leave empty to use template default"
                  className="w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              
              {/* Advance Notice */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Advance Notice (hours)
                </label>
                <input
                  type="number"
                  value={formSchedule.advance_notice_hours}
                  onChange={(e) => handleFormChange('advance_notice_hours', parseFloat(e.target.value))}
                  step="0.5"
                  min="0"
                  max="48"
                  className="w-full px-3 py-2 bg-dark-500 border border-dark-400 rounded-md text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              
              {/* Enabled */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formSchedule.enabled}
                  onChange={(e) => handleFormChange('enabled', e.target.checked)}
                  className="w-4 h-4 rounded bg-dark-500 border-dark-400 text-brand-500 focus:ring-brand-500 focus:ring-offset-dark-300"
                />
                <label htmlFor="enabled" className="ml-2 text-sm font-medium text-gray-300">
                  Enable Schedule
                </label>
              </div>
              
              {/* Multiple Hours */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="multiple-hours"
                  checked={formSchedule.allow_multiple_hours}
                  onChange={(e) => handleFormChange('allow_multiple_hours', e.target.checked)}
                  className="w-4 h-4 rounded bg-dark-500 border-dark-400 text-brand-500 focus:ring-brand-500 focus:ring-offset-dark-300"
                />
                <label htmlFor="multiple-hours" className="ml-2 text-sm font-medium text-gray-300">
                  Allow Multiple Hours
                </label>
              </div>
              
              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-dark-500 text-gray-300 rounded-md hover:bg-dark-600"
                >
                  Cancel
                </button>
                
                <button
                  type="button"
                  onClick={isCreating ? handleCreateSchedule : handleUpdateSchedule}
                  className="px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600"
                >
                  {isCreating ? 'Create Schedule' : 'Update Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Connection Status Indicator */}
      <div className="text-xs text-gray-500 mt-4">
        <span className={isConnected ? "text-green-400" : "text-red-400"}>
          {isConnected ? "●" : "○"} WebSocket {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </div>
  );
};

export default ContestScheduler;