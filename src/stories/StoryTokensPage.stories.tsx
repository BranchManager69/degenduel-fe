// StoryTokensPage stories - Simplified version for Storybook
import { Meta, StoryObj } from '@storybook/react';

// Import the simplified story page with no API dependencies
import { StoryTokensPage } from '../pages/public/tokens/StoryTokensPage';

const meta: Meta<typeof StoryTokensPage> = {
  title: 'Pages/Tokens/StoryTokensPage',
  component: StoryTokensPage,
  parameters: {
    layout: 'fullscreen',
    route: '/tokens',
  },
  decorators: [
    (Story) => (
      <div className="bg-dark-100 min-h-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StoryTokensPage>;

export const Default: Story = {
  parameters: {
    route: '/tokens',
  },
};

export const WithBTC: Story = {
  parameters: {
    route: '/tokens?symbol=BTC',
  },
};

export const WithETH: Story = {
  parameters: {
    route: '/tokens?symbol=ETH',
  },
};