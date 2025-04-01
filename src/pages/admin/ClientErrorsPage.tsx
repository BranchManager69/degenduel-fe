import React from 'react';
import { ClientErrorManagement } from '../../components/admin/ClientErrorManagement';
import { BackgroundEffects } from '../../components/animated-background/BackgroundEffects';
import { AdminRoute } from '../../components/routes/AdminRoute';

const ClientErrorsPage: React.FC = () => {
  return (
    <AdminRoute>
      <BackgroundEffects />
      <div className="container mx-auto p-6 space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Client Error Management</h1>
            <p className="text-gray-400 mt-2">Track, analyze, and resolve client-side errors</p>
          </div>
        </div>
        
        <ClientErrorManagement limit={15} />
      </div>
    </AdminRoute>
  );
};

export default ClientErrorsPage;