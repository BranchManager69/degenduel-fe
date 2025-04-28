import React from 'react';
import ContestScheduler from '../../components/admin/ContestScheduler';

const ContestSchedulerPage: React.FC = () => {
  return (
    <div className="p-4 md:p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-2xl font-bold text-gray-100 mb-4 md:mb-0">Contest Scheduler Management</h1>
      </div>
      
      <div className="space-y-4">
        <p className="text-gray-300">
          Manage contest schedules and create automated contests. The scheduler service runs in the background and creates contests based on schedules.
        </p>
        
        <div className="bg-dark-400/30 rounded-lg p-4 border border-dark-400 text-sm text-gray-300">
          <h3 className="font-medium text-gray-200 mb-2">How it works:</h3>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Create schedules with specific days and times</li>
            <li>Select contest templates to determine contest parameters</li>
            <li>The scheduler service will automatically create contests at the specified times</li>
            <li>You can also manually trigger contest creation from any schedule</li>
          </ul>
        </div>
      </div>
      
      <ContestScheduler />
      
      <div className="bg-dark-400/30 rounded-lg p-4 border border-dark-400">
        <h3 className="font-medium text-gray-200 mb-2">REST API for Contest Schedules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="text-gray-200 font-medium mb-1">Admin Endpoints</h4>
            <ul className="space-y-1 text-gray-400">
              <li><span className="text-green-400">GET</span> /api/admin/contest-scheduler/status</li>
              <li><span className="text-blue-400">POST</span> /api/admin/contest-scheduler/control/:action</li>
              <li><span className="text-green-400">GET</span> /api/admin/contest-scheduler/db-schedules</li>
              <li><span className="text-green-400">GET</span> /api/admin/contest-scheduler/db-schedules/:id</li>
              <li><span className="text-blue-400">POST</span> /api/admin/contest-scheduler/db-schedules</li>
              <li><span className="text-yellow-400">PUT</span> /api/admin/contest-scheduler/db-schedules/:id</li>
              <li><span className="text-red-400">DELETE</span> /api/admin/contest-scheduler/db-schedules/:id</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-gray-200 font-medium mb-1">Public Endpoints</h4>
            <ul className="space-y-1 text-gray-400">
              <li><span className="text-green-400">GET</span> /api/contests/schedules</li>
              <li><span className="text-green-400">GET</span> /api/contests/schedules/:id</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContestSchedulerPage;