import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationsDropdown } from '../components/layout/menu/NotificationsDropdown';
import { MobileMenuButton } from '../components/layout/MobileMenuButton';
import { UserMenu } from '../components/layout/user-menu/UserMenu';
import { User } from '../types';

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

// Create a Header wrapper component to demonstrate both mobile and desktop views
const Header = ({ isMobile = false }) => {
  // Create a complete mock user that satisfies the User type
  const user: User = {
    wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
    nickname: 'CryptoDegen',
    profile_image: {
      url: 'https://i.pravatar.cc/150?img=3',
      thumbnail_url: 'https://i.pravatar.cc/150?img=3'
    },
    created_at: '2023-01-01T00:00:00Z',
    last_login: '2023-06-15T12:30:45Z',
    role: 'user',
    total_contests: 42,
    total_wins: 7,
    total_earnings: '2500.00',
    rank_score: 875,
    settings: {},
    balance: '1250.75',
    is_banned: false,
    ban_reason: null,
    risk_level: 'low'
  };

  return (
    <div className="w-full bg-dark-200/90 backdrop-blur-md py-3 px-4 flex justify-between items-center border-b border-brand-500/20">
      {/* App Logo */}
      <div className="flex items-center">
        <div className="text-white font-bold text-xl">DegenDuel</div>
      </div>
      
      {/* Navigation */}
      <div className="flex items-center gap-2">
        {isMobile ? (
          <MobileMenuButton unreadNotifications={2} />
        ) : (
          <UserMenu 
            user={user} 
            unreadNotifications={2} 
            onDisconnect={() => console.log('Wallet disconnected')} 
          />
        )}
      </div>
    </div>
  );
};

/**
 * This story demonstrates how the navigation components appear in the header.
 * It shows both mobile and desktop views.
 */
const meta = {
  title: 'Layouts/HeaderNavigation',
  parameters: {
    layout: 'fullscreen',
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
        background: '#121212',
        minHeight: '100vh'
      }}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Desktop view with UserMenu in the header.
 */
export const Desktop: Story = {
  render: () => <Header isMobile={false} />
};

/**
 * Mobile view with MobileMenuButton in the header.
 */
export const Mobile: Story = {
  render: () => <Header isMobile={true} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Shows how the components would look in a more complete header.
 */
export const CompleteHeader: Story = {
  render: () => {
    // Create a complete mock user that satisfies the User type
    const user: User = {
      wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
      nickname: 'CryptoDegen',
      profile_image: {
        url: 'https://i.pravatar.cc/150?img=3',
        thumbnail_url: 'https://i.pravatar.cc/150?img=3'
      },
      created_at: '2023-01-01T00:00:00Z',
      last_login: '2023-06-15T12:30:45Z',
      role: 'user',
      total_contests: 42,
      total_wins: 7,
      total_earnings: '2500.00',
      rank_score: 875,
      settings: {},
      balance: '1250.75',
      is_banned: false,
      ban_reason: null,
      risk_level: 'low'
    };

    return (
      <div className="w-full bg-dark-200/90 backdrop-blur-md py-3 px-4 flex justify-between items-center border-b border-brand-500/20">
        {/* App Logo */}
        <div className="flex items-center">
          <div className="text-white font-bold text-xl">DegenDuel</div>
        </div>
        
        {/* Center Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-gray-300 hover:text-white transition-colors">Contests</a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">Tokens</a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">Rankings</a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors">Learn</a>
        </div>
        
        {/* Right-side Navigation */}
        <div className="flex items-center gap-2">
          {/* Standalone NotificationsDropdown */}
          <div className="hidden md:block">
            <NotificationsDropdown unreadCount={2} isMobile={false} />
          </div>
          
          {/* Responsive Menu */}
          <div className="block md:hidden">
            <MobileMenuButton unreadNotifications={2} />
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:block">
            <UserMenu 
              user={user}
              unreadNotifications={0} 
              onDisconnect={() => console.log('Wallet disconnected')} 
            />
          </div>
        </div>
      </div>
    );
  }
};