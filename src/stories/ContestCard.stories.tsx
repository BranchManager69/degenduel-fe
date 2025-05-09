import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { ContestCard } from '../components/contest-browser/ContestCard';

// Mock contest data - UPDATED
const mockContest = {
  id: 123,
  name: "Weekly Trading Competition",
  description: "Join our weekly trading competition and test your skills against other traders. Pick the best performing tokens and win big prizes!",
  entry_fee: "25",
  prize_pool: "2500",
  start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
  participant_count: 42,
  min_participants: 10,
  max_participants: 100,
  status: "pending" as const,
  settings: {
    difficulty: "dolphin",
    tokenTypesAllowed: ["crypto"],
    startingPortfolioValue: "10000",
    minParticipants: 10,
    maxParticipants: 100,
  },
  contest_code: "W33K-TR4D1NG",
  is_participating: false,
  created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  allowed_buckets: [1, 2, 3],
  image_url: "https://picsum.photos/seed/degen1/1024"
};

// Mock active contest 
const mockActiveContest = {
  ...mockContest,
  id: 124,
  name: "LIVE Crypto Showdown",
  start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
  participant_count: 78,
  status: "active" as const,
  contest_code: "L1V3-SH0WD0WN",
  image_url: "https://picsum.photos/seed/degen2/1024"
};

// Mock completed contest
const mockCompletedContest = {
  ...mockContest,
  id: 125,
  name: "Crypto Masters Finals",
  description: "The finals are over! Check the results to see who took home the grand prize.",
  start_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  end_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  participant_count: 100,
  status: "completed" as const,
  contest_code: "M4ST3R-F1N4L",
  image_url: "https://picsum.photos/seed/degen3/1024"
};

// Define metadata for the component
const meta: Meta<typeof ContestCard> = {
  title: 'Components/ContestCard',
  component: ContestCard,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  argTypes: {
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ContestCard>;

// Default story with upcoming contest
export const UpcomingContest: Story = {
  args: {
    contest: mockContest,
  },
};

// Active contest story
export const ActiveContest: Story = {
  args: {
    contest: mockActiveContest,
  },
};

// Completed contest story
export const CompletedContest: Story = {
  args: {
    contest: mockCompletedContest,
  },
};

// Participating contest story
export const ParticipatingContest: Story = {
  args: {
    contest: {
      ...mockContest,
      is_participating: true,
    },
  },
};

// Contest with AI-generated image
export const ContestWithAIImage: Story = {
  args: {
    contest: {
      ...mockContest,
      name: "Cyberpunk Trading Challenge",
      description: "Enter the neon-lit digital realm and compete for massive crypto prizes in this futuristic trading competition.",
      image_url: "https://picsum.photos/seed/cyberpunk/1024"
    },
  },
};

// Contest with no image
export const ContestWithoutImage: Story = {
  args: {
    contest: {
      ...mockContest,
      image_url: undefined
    },
  },
};

// Live contest with emphasized corner
export const LiveContestCorner: Story = {
  args: {
    contest: {
      ...mockActiveContest,
      name: "LIVE Corner Test",
      description: "This story specifically tests the LIVE corner indicator functionality",
    },
  },
};

// Cancelled contest with reason
export const CancelledContest: Story = {
  args: {
    contest: {
      ...mockContest,
      id: 126,
      name: "Cancelled Trading Event",
      description: "This was supposed to be an amazing trading competition with unique rules and challenges.",
      status: "cancelled" as const,
      cancellation_reason: "MARKET VOLATILITY",
      contest_code: "C4NC3L-3V3NT",
      image_url: "https://picsum.photos/seed/cancelled/1024"
    },
  },
};

// Cancelled contest with long reason
export const CancelledContestLongReason: Story = {
  args: {
    contest: {
      ...mockContest,
      id: 127,
      name: "Cancelled High Stakes",
      description: "High stakes competition with larger entry fees and prize pools.",
      status: "cancelled" as const,
      cancellation_reason: "TECHNICAL DIFFICULTIES WITH EXCHANGE API INTEGRATION",
      contest_code: "C4NC3L-H1GH",
      image_url: "https://picsum.photos/seed/cancelled2/1024"
    },
  },
};