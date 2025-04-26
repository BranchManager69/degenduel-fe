// src/stories/UserWalletSearch.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { UserWalletSearch } from '../components/admin/UserWalletSearch';

const meta: Meta<typeof UserWalletSearch> = {
  title: 'Admin/UserWalletSearch',
  component: UserWalletSearch,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof UserWalletSearch>;

export const Default: Story = {
  args: {
    title: 'User Wallet Balance Search',
    description: 'Search for users by nickname or wallet address to view their balance history',
  },
};

export const CustomTitle: Story = {
  args: {
    title: 'Admin Wallet Monitor',
    description: 'Search and analyze wallet balances for any user',
  },
};

export const NoDescription: Story = {
  args: {
    title: 'User Wallet Tracker',
    description: '',
  },
};