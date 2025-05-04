import type { Meta, StoryObj } from '@storybook/react';
import { MobileMenuButton } from '../components/layout/MobileMenuButton';

// Mock the useStore hook
jest.mock('../store/useStore', () => ({
  useStore: () => ({
    user: {
      wallet_address: '0x1234...5678',
      nickname: 'CryptoDegen',
      profile_image: {
        url: 'https://i.pravatar.cc/150?img=3',
        thumbnail_url: 'https://i.pravatar.cc/150?img=3'
      }
    },
    achievements: {
      userProgress: {
        level: 15
      }
    },
    disconnectWallet: () => console.log('Wallet disconnected')
  })
}));

// Mock the useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    isAdmin: () => false,
    isSuperAdmin: () => false,
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

/**
 * The MobileMenuButton component provides the main navigation for mobile devices.
 * It displays a profile avatar for logged-in users or a hamburger icon for visitors.
 * When clicked, it opens a full menu with navigation options.
 */
const meta = {
  title: 'Components/Navigation/MobileMenuButton',
  component: MobileMenuButton,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#121212' },
      ],
    },
    route: '/',
  },
  decorators: [
    (Story) => (
      <div style={{ 
        padding: '20px', 
        background: '#121212',
        minHeight: '100vh',
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '10px',
          height: '60px',
          background: 'rgba(30, 30, 30, 0.8)',
          borderRadius: '8px',
          backdropFilter: 'blur(4px)'
        }}>
          <Story />
        </div>
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof MobileMenuButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state for logged-in users. Shows profile avatar with level badge and notifications.
 */
export const LoggedIn: Story = {
  args: {
    unreadNotifications: 2,
  },
};

/**
 * State with no unread notifications.
 */
export const NoNotifications: Story = {
  args: {
    unreadNotifications: 0,
  },
};

/**
 * Compact version for smaller screens.
 */
export const Compact: Story = {
  args: {
    unreadNotifications: 2,
    isCompact: true,
  },
};

/**
 * State for non-logged-in users. Shows hamburger icon instead of profile avatar.
 */
export const LoggedOut: Story = {
  args: {},
  parameters: {
    mockData: {
      useStore: {
        user: null,
        achievements: null,
        disconnectWallet: () => console.log('Wallet disconnected')
      }
    }
  }
};

/**
 * State for admin users. When menu is opened, it shows admin controls.
 */
export const Admin: Story = {
  args: {
    unreadNotifications: 2,
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
 * State for super admin users. When menu is opened, it shows both admin and super admin controls.
 */
export const SuperAdmin: Story = {
  args: {
    unreadNotifications: 2,
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
 * High level user (level 40+). Shows gold-colored badge.
 */
export const HighLevel: Story = {
  args: {
    unreadNotifications: 2,
  },
  parameters: {
    mockData: {
      useStore: {
        user: {
          wallet_address: '0x1234...5678',
          nickname: 'DegenMaster',
          profile_image: {
            url: 'https://i.pravatar.cc/150?img=5',
            thumbnail_url: 'https://i.pravatar.cc/150?img=5'
          }
        },
        achievements: {
          userProgress: {
            level: 42
          }
        },
        disconnectWallet: () => console.log('Wallet disconnected')
      }
    }
  }
};