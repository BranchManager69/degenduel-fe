import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { UserMenu } from './UserMenu';

const mockUser = {
  id: '1',
  wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
  nickname: 'DegenChamp',
  profile_image: {
    url: 'https://i.pravatar.cc/300',
    thumbnail_url: 'https://i.pravatar.cc/150'
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock the hooks
const mockAuthHook = {
  isAdmin: () => false,
  isSuperAdmin: () => false,
};

const mockStoreHook = {
  achievements: {
    userProgress: {
      level: 5,
    },
  },
};

// Mock the hook implementations
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => mockAuthHook,
}));

jest.mock('../../../store/useStore', () => ({
  useStore: () => mockStoreHook,
}));

const meta: Meta<typeof UserMenu> = {
  title: 'Layout/UserMenu',
  component: UserMenu,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story: StoryObj<typeof UserMenu>) => (
      <BrowserRouter>
        <div className="bg-gray-900 p-10">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    user: { 
      control: 'object',
      description: 'User data object' 
    },
    onDisconnect: { action: 'disconnected' },
    isCompact: { 
      control: 'boolean',
      description: 'Display in compact mode'
    },
    unreadNotifications: { 
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: 'Number of unread notifications'
    },
  },
  args: {
    user: mockUser,
    onDisconnect: () => console.log('Disconnected'),
    isCompact: false,
    unreadNotifications: 0,
  },
};

export default meta;
type Story = StoryObj<typeof UserMenu>;

export const Default: Story = {};

export const WithNotifications: Story = {
  args: {
    unreadNotifications: 5,
  },
};

export const Compact: Story = {
  args: {
    isCompact: true,
  },
};

export const HighLevel: Story = {
  args: {},
  decorators: [
    (Story: StoryObj<typeof UserMenu>) => {
      // Override the mock for this specific story
      mockStoreHook.achievements.userProgress.level = 25;
      return <Story />;
    },
  ],
};

export const Admin: Story = {
  args: {},
  decorators: [
    (Story: StoryObj<typeof UserMenu>) => {
      // Override the mock for this specific story
      mockAuthHook.isAdmin = () => true;
      mockAuthHook.isSuperAdmin = () => false;
      return <Story />;
    },
  ],
};

export const SuperAdmin: Story = {
  args: {},
  decorators: [
    (Story: StoryObj<typeof UserMenu>) => {
      // Override the mock for this specific story
      mockAuthHook.isAdmin = () => true;
      mockAuthHook.isSuperAdmin = () => true;
      return <Story />;
    },
  ],
};

export const NoNickname: Story = {
  args: {
    user: {
      ...mockUser,
      nickname: null,
    },
  },
};

export const WithImageError: Story = {
  args: {
    user: {
      ...mockUser,
      profile_image: {
        url: 'https://invalid-url-that-will-fail.com/image.jpg',
        thumbnail_url: null,
      }
    },
  },
};