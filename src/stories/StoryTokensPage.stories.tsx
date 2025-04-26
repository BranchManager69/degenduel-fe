// StoryTokensPage stories - Simplified version for Storybook
import { Meta, StoryObj } from '@storybook/react';
import { withRouter } from 'storybook-addon-react-router-v6';

// Import the simplified story page with no API dependencies
import { StoryTokensPage } from '../pages/public/tokens/StoryTokensPage';

const meta: Meta<typeof StoryTokensPage> = {
  title: 'Pages/Tokens/StoryTokensPage',
  component: StoryTokensPage,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    withRouter,
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
    reactRouter: {
      routePath: '/tokens',
      browserPath: '/tokens',
    },
  },
};

export const WithBTC: Story = {
  parameters: {
    reactRouter: {
      routePath: '/tokens',
      browserPath: '/tokens?symbol=BTC',
      searchParams: { symbol: 'BTC' },
    },
  },
};

export const WithETH: Story = {
  parameters: {
    reactRouter: {
      routePath: '/tokens',
      browserPath: '/tokens?symbol=ETH', 
      searchParams: { symbol: 'ETH' },
    },
  },
};