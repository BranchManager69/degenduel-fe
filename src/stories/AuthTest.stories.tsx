import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { useMigratedAuth } from '../hooks/auth/useMigratedAuth';

// Simple component that uses auth
const AuthTestComponent: React.FC = () => {
  const { user, isAuthenticated, loading } = useMigratedAuth();
  
  return (
    <div className="p-6 bg-dark-400 rounded-lg text-white">
      <h2 className="text-xl font-bold mb-4">Auth Mock Test</h2>
      <div className="space-y-2">
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong></p>
        <pre className="bg-dark-500 p-3 rounded text-sm overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  );
};

const meta: Meta<typeof AuthTestComponent> = {
  title: 'Testing/AuthMock',
  component: AuthTestComponent,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a2e' },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {}; 