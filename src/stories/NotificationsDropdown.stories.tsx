import type { Meta, StoryObj } from '@storybook/react';
import { NotificationsDropdown } from '../components/layout/menu/NotificationsDropdown';
import { MemoryRouter } from 'react-router-dom';

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
      },
      {
        id: '3',
        userId: 'user123',
        type: 'system',
        title: 'System Update Complete',
        content: 'DegenDuel has been updated to version 2.5. Check out the new features!',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        priority: 'low',
        link: '/updates'
      },
      {
        id: '4',
        userId: 'user123',
        type: 'wallet',
        title: 'Wallet Connected',
        content: 'Your wallet has been successfully connected.',
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'normal',
        link: '/wallet'
      },
      {
        id: '5',
        userId: 'user123',
        type: 'contest',
        title: 'Contest Results',
        content: 'The "Weekend Warriors" contest has ended. You placed 3rd!',
        isRead: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high',
        link: '/contests/456/results'
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
 * The NotificationsDropdown component provides a dropdown interface for viewing 
 * recent notifications and accessing the full notifications page.
 */
const meta = {
  title: 'Components/Notifications/NotificationsDropdown',
  component: NotificationsDropdown,
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
        padding: '50px', 
        background: '#121212',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingTop: '100px'
      }}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof NotificationsDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state of the notifications dropdown with 2 unread notifications.
 */
export const Default: Story = {
  args: {
    unreadCount: 2,
    isMobile: false,
  },
};

/**
 * State with no unread notifications.
 */
export const NoUnread: Story = {
  args: {
    unreadCount: 0,
    isMobile: false,
  },
};

/**
 * Mobile variant of the notifications dropdown.
 */
export const Mobile: Story = {
  args: {
    unreadCount: 2,
    isMobile: true,
  },
};

/**
 * Loading state when notifications are being fetched.
 */
export const Loading: Story = {
  args: {
    unreadCount: 0,
    isMobile: false,
  },
  parameters: {
    mockData: {
      useNotifications: {
        notifications: [],
        unreadCount: 0,
        isLoading: true,
        error: null,
        isConnected: true,
        markAsRead: () => {},
        markAllAsRead: () => {},
        refreshNotifications: () => {},
        connect: () => {},
        close: () => {}
      }
    }
  }
};

/**
 * Error state when there's an issue fetching notifications.
 */
export const Error: Story = {
  args: {
    unreadCount: 0,
    isMobile: false,
  },
  parameters: {
    mockData: {
      useNotifications: {
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        error: 'Failed to connect to notification service',
        isConnected: false,
        markAsRead: () => {},
        markAllAsRead: () => {},
        refreshNotifications: () => {},
        connect: () => {},
        close: () => {}
      }
    }
  }
};

/**
 * Empty state when the user has no notifications.
 */
export const Empty: Story = {
  args: {
    unreadCount: 0,
    isMobile: false,
  },
  parameters: {
    mockData: {
      useNotifications: {
        notifications: [],
        unreadCount: 0,
        isLoading: false,
        error: null,
        isConnected: true,
        markAsRead: () => {},
        markAllAsRead: () => {},
        refreshNotifications: () => {},
        connect: () => {},
        close: () => {}
      }
    }
  }
};

/**
 * Many unread notifications.
 */
export const ManyUnread: Story = {
  args: {
    unreadCount: 99,
    isMobile: false,
  },
};