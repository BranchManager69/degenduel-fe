import type { Meta, StoryObj } from '@storybook/react';
import { Terminal } from '../components/terminal/Terminal';

// Default configuration for the Terminal
const defaultConfig = {
  RELEASE_DATE: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  CONTRACT_ADDRESS: '0x1234...5678',
  DISPLAY: {
    DATE_SHORT: '2025-03-30',
    DATE_FULL: 'March 30, 2025',
    TIME: '12:00 UTC',
  }
};

// Define metadata for the component
const meta = {
  title: 'Components/Terminal',
  component: Terminal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    config: { control: 'object' },
    onCommandExecuted: { action: 'commandExecuted' }
  },
} satisfies Meta<typeof Terminal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    config: defaultConfig,
  },
};

// Story with countdown almost finished
export const AlmostReleased: Story = {
  args: {
    config: {
      ...defaultConfig,
      RELEASE_DATE: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      DISPLAY: {
        ...defaultConfig.DISPLAY,
        DATE_SHORT: new Date().toISOString().split('T')[0],
        DATE_FULL: new Date().toDateString(),
      }
    },
  },
};

// Story with released state
export const Released: Story = {
  args: {
    config: {
      ...defaultConfig,
      RELEASE_DATE: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      DISPLAY: {
        ...defaultConfig.DISPLAY,
        DATE_SHORT: new Date().toISOString().split('T')[0],
        DATE_FULL: new Date().toDateString(),
      }
    },
  },
};
