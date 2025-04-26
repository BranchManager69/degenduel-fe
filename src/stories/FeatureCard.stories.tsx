import type { Meta, StoryObj } from '@storybook/react';
// React is used in JSX transformation

import { FeatureCard } from '../components/landing/features-list/FeatureCard';
import { ReflectionSystemAnimation } from '../components/landing/features-list/animations/ReflectionSystemAnimation';
import { DuelDripAnimation } from '../components/landing/features-list/animations/DuelDripAnimation';

// Meta data for the FeatureCard component
const meta: Meta<typeof FeatureCard> = {
  title: 'Landing/FeatureCard',
  component: FeatureCard,
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f0a1f' }
      ],
    },
    // Set a fixed width to prevent stretching
    layout: 'centered',
  },
  // Add decorators for better visualization
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ width: '400px', maxWidth: '100%', margin: '0 auto', overflowWrap: 'break-word', wordWrap: 'break-word' }}>
        <Story />
      </div>
    )
  ],
  tags: ['autodocs'],
  argTypes: {
    isUpcoming: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof FeatureCard>;

// Create sample icon
const sampleIcon = (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 3L4 7L12 11L20 7L12 3Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 12L12 16L20 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 17L12 21L20 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Reflection system icon
const reflectionIcon = (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 3L4 7L12 11L20 7L12 3Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 12L12 16L20 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 17L12 21L20 17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// DUEL Drip icon
const duelDripIcon = (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 2L8 6H16L12 2Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M12 6V17M12 22C8.13401 22 5 18.866 5 15C5 11.134 12 6 12 6C12 6 19 11.134 19 15C19 18.866 15.866 22 12 22Z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Create a simple animation for demo
const SampleAnimation = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center animate-pulse">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 8L12 12L20 8L12 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 12L12 16L20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center animate-bounce">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Basic feature card story
export const Default: Story = {
  args: {
    title: 'Feature Title',
    description: 'This is a short description of the feature that explains its main benefit to the user.',
    icon: sampleIcon,
  },
};

// Feature card with extended description
export const WithExtendedDescription: Story = {
  args: {
    title: 'Feature With Details',
    description: 'This is a short description that appears in the compact card view.',
    extendedDescription: 'This is a more detailed description that will appear when the card is expanded.\n\nIt can include multiple paragraphs and more in-depth information about the feature, how it works, and its benefits to the user.',
    icon: sampleIcon,
  },
};

// Upcoming feature card
export const UpcomingFeature: Story = {
  args: {
    title: 'Coming Soon Feature',
    description: 'This feature is coming soon to the platform. Stay tuned for updates!',
    extendedDescription: 'This upcoming feature will provide significant benefits to users when it launches. We are currently finalizing development and testing.\n\nExpected release: Q3 2025',
    icon: sampleIcon,
    isUpcoming: true,
  },
};

// Feature card with sample animation
export const WithAnimation: Story = {
  args: {
    title: 'Animated Feature',
    description: 'This feature card includes a custom animation in the expanded view.',
    extendedDescription: 'When you click on this card, it expands to show a custom animation that demonstrates how the feature works visually.',
    icon: sampleIcon,
    animation: <SampleAnimation />,
  },
};

// Reflections system feature card
export const ReflectionsSystem: Story = {
  args: {
    title: 'Reflections System',
    description: 'Half of all DegenDuel profits are returned to token holders through daily Solana rewards.',
    extendedDescription: 
      "Our unique reflections system ensures that the community benefits directly from platform success. Token holders who meet the minimum criteria receive daily Solana rewards automatically sent to their connected wallets.\n\nThe system tracks platform revenue in real-time and allocates 50% to the community rewards pool, which is then distributed proportionally based on token holdings. No staking or lock-up periods required - simply hold your tokens in a compatible wallet.",
    icon: reflectionIcon,
    animation: <ReflectionSystemAnimation />,
  },
};

// DUEL Drip system feature card
export const DuelDrip: Story = {
  args: {
    title: 'DUEL Drip',
    description: 'Infinite character customization with unique NFT accessories purchased using DUEL tokens.',
    extendedDescription: 
      "The DUEL Drip system allows players to customize their profiles with unique accessories, skins, and visual effects purchased with DUEL tokens. Half of all tokens used for purchases are permanently burned, creating deflationary pressure.\n\nUnlock exclusive items based on your Degen Level or through special achievements. Create one-of-a-kind looks that stand out in competitions and on leaderboards. All purchases are minted as SPL tokens that can be traded in our upcoming marketplace.",
    icon: duelDripIcon,
    animation: <DuelDripAnimation />,
  },
};