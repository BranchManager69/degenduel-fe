// TokenDetailModal stories
import { Meta, StoryObj } from '@storybook/react';
import { TokenDetailModal } from '../components/tokens-list/TokenDetailModal';
import { Token } from '../types';

const meta: Meta<typeof TokenDetailModal> = {
  title: 'Components/Tokens/TokenDetailModal',
  component: TokenDetailModal,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    isOpen: { control: 'boolean' },
    onClose: { action: 'closed' },
  },
};

export default meta;
type Story = StoryObj<typeof TokenDetailModal>;

const mockToken: Token = {
  contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
  name: 'Solana',
  symbol: 'SOL',
  price: '103.45',
  marketCap: '42000000000',
  volume24h: '1500000000',
  change24h: '5.63',
  status: 'active', // Add required status field
  liquidity: {
    usd: '120000000',
    base: '1000000',
    quote: '2000000',
  },
  images: {
    imageUrl: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    headerImage: 'https://www.exodus.com/img/news/content/2022/09/solana-min.png',
    openGraphImage: '',
  },
  socials: {
    twitter: { url: 'https://twitter.com/solana', count: null },
    telegram: { url: 'https://t.me/solanaio', count: null },
    discord: { url: 'https://discord.com/invite/solana', count: null },
  },
  websites: [{ url: 'https://solana.com', label: 'Website' }],
};

const negativeMockToken: Token = {
  ...mockToken,
  symbol: 'BTC',
  name: 'Bitcoin',
  price: '67245.21',
  marketCap: '1320000000000',
  volume24h: '28500000000',
  change24h: '-2.34',
  images: {
    imageUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    headerImage: 'https://bitcoinmagazine.com/.image/t_share/MTk2MDIyNzQ3NTc4NzUxNzQx/bitcoin-magazine-new-website.png',
    openGraphImage: '',
  },
  websites: [{ url: 'https://bitcoin.org', label: 'Website' }],
};

const noImageMockToken: Token = {
  ...mockToken,
  symbol: 'LINK',
  name: 'Chainlink',
  price: '14.78',
  marketCap: '8500000000',
  volume24h: '450000000',
  change24h: '1.21',
  images: {
    imageUrl: '',
    headerImage: '',
    openGraphImage: '',
  },
  socials: {
    twitter: { url: 'https://twitter.com/chainlink', count: null },
  },
  websites: [],
};

export const Default: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Modal closed'),
    token: mockToken,
  },
};

export const NegativeChange: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Modal closed'),
    token: negativeMockToken,
  },
};

export const NoImage: Story = {
  args: {
    isOpen: true,
    onClose: () => console.log('Modal closed'),
    token: noImageMockToken,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => console.log('Modal closed'),
    token: mockToken,
  },
};