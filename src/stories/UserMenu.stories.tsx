import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { UserMenu } from '../components/layout/user-menu/UserMenu';

// Mock the useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAdmin: () => false,
    isSuperAdmin: () => false,
  })
}));

// Mock the useStore hook
jest.mock('../store/useStore', () => ({
  useStore: () => ({
    achievements: {
      userProgress: {
        level: 15
      }
    }
  })
}));

// Mock the useNotifications hook
jest.mock('../hooks/websocket/topic-hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: [
      {
        id: '1',
        userId: 'user123',
        type: 'contest',
        title: 'Contest Starting Soon',
        content: 'The Solana Sprint contest is starting in 15 minutes. Prepare your portfolio!',
        isRead: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        priority: 'high',
        link: '/contests/123'
      },
      {
        id: '2',
        userId: 'user123',
        type: 'achievement',
        title: 'Achievement Unlocked',
        content: 'Congratulations! You\'ve unlocked the "First Win" achievement.',
        isRead: false,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        link: '/me'
      }
    ],
    unreadCount: 2,
    isLoading: false,
    error: null,
    isConnected: true,
    markAsRead: () => console.log('Mark as read'),
    markAllAsRead: () => console.log('Mark all as read'),
    refreshNotifications: () => console.log('Refresh notifications'),
    connect: () => {},
    close: () => {}
  })
}));

// Create a mock user for our stories
const mockUser = {
  wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
  nickname: 'CryptoDegen',
  last_login: '2023-01-01T00:00:00Z',
  role: 'user',
  total_contests: 100,
  total_wins: 50,
  rank_score: 1000,
  balance: '1000',
  total_earnings: '1000',
  settings: {
    notifications: true,
    email_notifications: true,
    push_notifications: true
  },
  is_banned: false,
  ban_reason: null,
  risk_level: 'low',
  profile_image: {
    url: 'https://i.pravatar.cc/150?img=3',
    thumbnail_url: 'https://i.pravatar.cc/150?img=3'
  },
  email: 'user@example.com',
  social: {
    twitter: 'cryptodegen',
    discord: 'cryptodegen#1234'
  },
  referral_code: 'DEGEN123',
  contests_participated: 12,
  contests_won: 3,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
};

/**
 * The UserMenu component provides the main user navigation for desktop devices.
 * It displays a stylized button with username and profile picture that opens a dropdown menu.
 */
const meta = {
  title: 'Components/Navigation/UserMenu',
  component: UserMenu,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#121212' },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ 
        padding: '20px', 
        background: '#121212',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '768px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '10px 20px',
          height: '70px',
          background: 'rgba(30, 30, 30, 0.8)',
          borderRadius: '8px',
          backdropFilter: 'blur(4px)'
        }}>
          <MemoryRouter>
            <Story />
          </MemoryRouter>
        </div>
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state for regular users. Shows username and profile picture with level badge.
 */
export const Default: Story = {
  args: {
    user: mockUser,
    unreadNotifications: 2,
    onDisconnect: () => console.log('Wallet disconnected')
  },
};

/**
 * State with no unread notifications.
 */
export const NoNotifications: Story = {
  args: {
    user: mockUser,
    unreadNotifications: 0,
    onDisconnect: () => console.log('Wallet disconnected')
  },
};

/**
 * Compact version for smaller screens.
 */
export const Compact: Story = {
  args: {
    user: mockUser,
    unreadNotifications: 2,
    isCompact: true,
    onDisconnect: () => console.log('Wallet disconnected')
  },
};

/**
 * User with just wallet address (no nickname).
 */
export const NoNickname: Story = {
  args: {
    user: {
      ...mockUser,
      nickname: null
    },
    unreadNotifications: 2,
    onDisconnect: () => console.log('Wallet disconnected')
  },
};

/**
 * State for admin users.
 */
export const Admin: Story = {
  args: {
    user: mockUser,
    unreadNotifications: 2,
    onDisconnect: () => console.log('Wallet disconnected')
  },
  parameters: {
    mockData: {
      useAuth: {
        isAdmin: () => true,
        isSuperAdmin: () => false,
      }
    }
  }
};

/**
 * State for super admin users.
 */
export const SuperAdmin: Story = {
  args: {
    user: mockUser,
    unreadNotifications: 2,
    onDisconnect: () => console.log('Wallet disconnected')
  },
  parameters: {
    mockData: {
      useAuth: {
        isAdmin: () => true,
        isSuperAdmin: () => true,
      }
    }
  }
};

/**
 * High level user (level 40+). Shows gold-colored styling.
 */
export const HighLevel: Story = {
  args: {
    user: {
      ...mockUser,
      nickname: 'DegenMaster'
    },
    unreadNotifications: 2,
    onDisconnect: () => console.log('Wallet disconnected')
  },
  parameters: {
    mockData: {
      useStore: {
        achievements: {
          userProgress: {
            level: 42
          }
        }
      }
    }
  }
};