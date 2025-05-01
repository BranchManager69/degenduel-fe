// CreateContestModal stories
import { Meta, StoryObj } from '@storybook/react';
import { CreateContestModal } from '../components/contest-browser/CreateContestModal';

// Mock the ddApi to prevent actual API calls during Storybook rendering
jest.mock('../services/dd-api', () => ({
  ddApi: {
    contests: {
      create: async () => ({ 
        contest_code: 'TEST-12345',
        id: '123',
        name: 'Test Contest'
      }),
    },
  },
}));

// Prevent any real navigation in Storybook:
const original = window.location;
Object.defineProperty(window, 'location', {
  configurable: true,
  value: {
    ...original,
    href: 'about:blank',
    assign: () => { /* no-op */ },
    replace: () => { /* no-op */ },
  },
});

const meta: Meta<typeof CreateContestModal> = {
  title: 'Components/Contests/CreateContestModal',
  component: CreateContestModal,
  parameters: {
    layout: 'fullscreen',
    // Add some backgrounds to make the modal visible
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#121212' },
        { name: 'darker', value: '#0a0a0a' },
      ],
    },
  },
  argTypes: {
    isOpen: { control: 'boolean' },
    onClose: { action: 'closed' },
    onSuccess: { action: 'success' },
  },
  // Add decorators if needed for providing context
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CreateContestModal>;

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Modal closed'),
    onSuccess: () => console.log('Contest created successfully'),
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => console.log('Modal closed'),
    onSuccess: () => console.log('Contest created successfully'),
  },
};

// You can add more variations of the modal with different pre-filled data
export const WithCustomData: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Modal closed'),
    onSuccess: () => console.log('Contest created successfully'),
    // Add custom props if needed to showcase different modal states
  },
  parameters: {
    // You could potentially add specific docs or notes about this variation
    docs: {
      description: {
        story: 'The modal with custom pre-filled data for a high-stakes contest.',
      },
    },
  },
};