// Developer Updates Management System
// This file provides utilities for managing developer updates

export interface DeveloperUpdate {
  id: string;
  title: string;
  content: string;
  category: 'feature' | 'bugfix' | 'announcement' | 'technical';
  date: string;
  author: string;
  tags?: string[];
}

// Default updates that come with the system
const DEFAULT_UPDATES: DeveloperUpdate[] = [
  {
    id: '1',
    title: 'New System Health Indicators',
    content: `We've added small status indicators at the bottom of your screen to show you when DegenDuel is running smoothly.

What's new:
• Four simple shapes show system status - green means everything's working great!
• You'll see connection speed, success rates, and how many people are active
• Token counts now show as "1k" or "2.5M" for easier reading
• Less background data usage means faster page loads for you`,
    category: 'feature',
    date: '2025-05-28',
    author: 'DegenDuel Team',
    tags: ['performance', 'interface']
  },
  {
    id: '2',
    title: 'Prettier Footer with Smooth Animations',
    content: `The bottom of every page now looks better and feels more responsive, especially on mobile devices.

What's improved:
• Buttons and links have smooth hover effects that feel more premium
• Everything is properly sized and spaced for easier tapping on phones
• Social media links are grouped together for quicker access
• Faster animations that don't lag or feel choppy
• Better contrast and shadows make everything easier to see`,
    category: 'feature',
    date: '2025-05-27',
    author: 'Design Team',
    tags: ['design', 'mobile', 'animations']
  },
  {
    id: '3',
    title: 'Much Faster Token Search',
    content: `Finding tokens is now lightning fast! Search by name, symbol, or paste a contract address.

What you'll notice:
• Instant results as you type - no more waiting
• Search through thousands of tokens without lag
• Smooth scrolling even with huge lists
• Loading animations show progress while data loads
• Your searches feel more responsive and accurate`,
    category: 'feature',
    date: '2025-05-26',
    author: 'Product Team',
    tags: ['tokens', 'search', 'speed']
  },
  {
    id: '4',
    title: 'More Stable Real-Time Updates',
    content: `Fixed connection issues that were causing delays and disconnections. Everything updates faster now.

Improvements you'll feel:
• Price updates and contest data refresh more reliably
• Less "connection lost" messages
• Faster recovery when your internet has hiccups
• Reduced data usage on mobile connections
• Overall smoother experience with fewer glitches`,
    category: 'technical',
    date: '2025-05-25',
    author: 'Engineering Team',
    tags: ['stability', 'performance']
  },
  {
    id: '5',
    title: 'Easier Login with Passkeys',
    content: `Login is now more secure and works better with Face ID, Touch ID, and other biometric options.

What's better:
• Works with all modern devices and browsers
• Clearer messages when something goes wrong
• Faster recognition of your fingerprint or face
• Better support for password managers
• More secure than ever before`,
    category: 'feature',
    date: '2025-05-24',
    author: 'Security Team',
    tags: ['login', 'security']
  },
  {
    id: '6',
    title: 'Smoother Contest Experience',
    content: `Contests now load faster and update in real-time without refreshing the page.

Improvements:
• See live updates of contest standings instantly
• Pick your tokens faster when creating a portfolio
• Contest status updates happen automatically
• Better tracking of your performance during contests
• Smoother transitions between contest stages`,
    category: 'feature',
    date: '2025-05-23',
    author: 'Contest Team',
    tags: ['contests', 'performance']
  },
  {
    id: '7',
    title: 'Fixed Connection Problems',
    content: `Solved an issue that was making the site slow for some users. Everything should feel snappier now.

What we fixed:
• No more random disconnections
• Pages load 30x faster than before
• Better error messages when something goes wrong
• The site stays connected even during maintenance
• More reliable experience overall`,
    category: 'bugfix',
    date: '2025-05-22',
    author: 'Technical Team',
    tags: ['fixes', 'speed', 'reliability']
  }
];

/**
 * Get all developer updates - currently returns default updates only
 * TODO: Connect to backend API for persistent storage
 */
export const getDeveloperUpdates = (): DeveloperUpdate[] => {
  return DEFAULT_UPDATES;
};

// Management functions removed - will be replaced with proper backend integration
// TODO: Implement proper CRUD operations with backend API

// Console helper functions removed - use proper admin interface instead