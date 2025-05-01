// TokensGrid stories
import { Meta, StoryObj } from '@storybook/react';
import { TokensGrid } from '../components/tokens-list/TokensGrid';
import { Token } from '../types';

const meta: Meta<typeof TokensGrid> = {
  title: 'Components/Tokens/TokensGrid',
  component: TokensGrid,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dark',
    },
  },
  argTypes: {
    selectedTokenSymbol: { control: 'text' },
  },
  decorators: [
    (Story) => (
      <div className="bg-dark-100 p-8 min-h-screen">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TokensGrid>;

// Create an array of mock tokens
const createMockTokens = (): Token[] => {
  const baseTokens: Token[] = [
    {
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
    },
    {
      contractAddress: '0x2345678901abcdef2345678901abcdef23456789',
      name: 'Bitcoin',
      symbol: 'BTC',
      price: '67245.21',
      marketCap: '1320000000000',
      volume24h: '28500000000',
      change24h: '-2.34',
      status: 'active', // Add required status field
      liquidity: {
        usd: '820000000',
        base: '12000000',
        quote: '18000000',
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
        headerImage: 'https://bitcoinmagazine.com/.image/t_share/MTk2MDIyNzQ3NTc4NzUxNzQx/bitcoin-magazine-new-website.png',
        openGraphImage: '',
      },
      socials: {
        twitter: { url: 'https://twitter.com/bitcoin', count: null },
        telegram: { url: 'https://t.me/bitcoin', count: null },
        discord: { url: 'https://discord.com/invite/bitcoin', count: null },
      },
      websites: [{ url: 'https://bitcoin.org', label: 'Website' }],
    },
    {
      contractAddress: '0x3456789012abcdef3456789012abcdef34567890',
      name: 'Ethereum',
      symbol: 'ETH',
      price: '3420.89',
      marketCap: '410000000000',
      volume24h: '12500000000',
      change24h: '2.25',
      status: 'active', // Add required status field
      liquidity: {
        usd: '450000000',
        base: '8000000',
        quote: '10000000',
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        headerImage: 'https://ethereum.org/static/28214bb68eb5445dcb063a72535bc90c/9019e/hero.png',
        openGraphImage: '',
      },
      socials: {
        twitter: { url: 'https://twitter.com/ethereum', count: null },
        telegram: { url: 'https://t.me/ethereum', count: null },
        discord: { url: 'https://discord.com/invite/ethereum', count: null },
      },
      websites: [{ url: 'https://ethereum.org', label: 'Website' }],
    },
    {
      contractAddress: '0x4567890123abcdef4567890123abcdef45678901',
      name: 'Chainlink',
      symbol: 'LINK',
      price: '14.78',
      marketCap: '8500000000',
      volume24h: '450000000',
      change24h: '1.21',
      status: 'active', // Add required status field
      liquidity: {
        usd: '120000000',
        base: '5000000',
        quote: '6000000',
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/chainlink-link-logo.png',
        headerImage: '',
        openGraphImage: '',
      },
      socials: {
        twitter: { url: 'https://twitter.com/chainlink', count: null },
        // Use undefined instead of null for optional properties
      },
      websites: [{ url: 'https://chain.link', label: 'Website' }],
    },
    {
      contractAddress: '0x5678901234abcdef5678901234abcdef56789012',
      name: 'Cardano',
      symbol: 'ADA',
      price: '0.45',
      marketCap: '16000000000',
      volume24h: '350000000',
      change24h: '-1.85',
      status: 'active', // Add required status field
      liquidity: {
        usd: '95000000',
        base: '4000000',
        quote: '5000000',
      },
      images: {
        imageUrl: 'https://cryptologos.cc/logos/cardano-ada-logo.png',
        headerImage: 'https://roadmap.cardano.org/en/images/og-cardano.png',
        openGraphImage: '',
      },
      socials: {
        twitter: { url: 'https://twitter.com/cardano', count: null },
        telegram: { url: 'https://t.me/cardano', count: null },
        discord: { url: 'https://discord.com/invite/cardano', count: null },
      },
      websites: [{ url: 'https://cardano.org', label: 'Website' }],
    },
  ];

  // Generate additional tokens to have at least 15 items
  const additionalTokens: Token[] = [];
  const symbols = ['DOT', 'AVAX', 'MATIC', 'XRP', 'DOGE', 'SHIB', 'UNI', 'FTM', 'ATOM', 'XLM'];
  const names = ['Polkadot', 'Avalanche', 'Polygon', 'Ripple', 'Dogecoin', 'Shiba Inu', 'Uniswap', 'Fantom', 'Cosmos', 'Stellar'];

  for (let i = 0; i < symbols.length; i++) {
    const randomPrice = (Math.random() * 100).toFixed(2);
    const randomMarketCap = (Math.random() * 10000000000).toFixed(0);
    const randomVolume = (Math.random() * 1000000000).toFixed(0);
    const randomChange = (Math.random() * 10 * (Math.random() > 0.5 ? 1 : -1)).toFixed(2);

    additionalTokens.push({
      contractAddress: `0x${i}234567890abcdef${i}234567890abcdef${i}2345678`,
      name: names[i],
      symbol: symbols[i],
      price: randomPrice,
      marketCap: randomMarketCap,
      volume24h: randomVolume,
      change24h: randomChange,
      status: 'active', // Add required status field
      liquidity: {
        usd: (Number(randomVolume) / 10).toFixed(0),
        base: (Number(randomVolume) / 100).toFixed(0),
        quote: (Number(randomVolume) / 80).toFixed(0),
      },
      images: {
        imageUrl: `https://cryptologos.cc/logos/${names[i].toLowerCase()}-${symbols[i].toLowerCase()}-logo.png`,
        headerImage: '',
        openGraphImage: '',
      },
      socials: {
        twitter: { url: `https://twitter.com/${symbols[i].toLowerCase()}`, count: null },
        ...(Math.random() > 0.3 ? { telegram: { url: `https://t.me/${symbols[i].toLowerCase()}`, count: null } } : {}),
        ...(Math.random() > 0.5 ? { discord: { url: `https://discord.com/invite/${symbols[i].toLowerCase()}`, count: null } } : {}),
      },
      websites: [{ url: `https://${symbols[i].toLowerCase()}.org`, label: 'Website' }],
    });
  }

  return [...baseTokens, ...additionalTokens];
};

const mockTokens = createMockTokens();

export const Default: Story = {
  args: {
    tokens: mockTokens,
  },
};

export const WithSelectedToken: Story = {
  args: {
    tokens: mockTokens,
    selectedTokenSymbol: 'BTC',
  },
};

export const FewTokens: Story = {
  args: {
    tokens: mockTokens.slice(0, 4),
  },
};

export const TokensWithNegativeChanges: Story = {
  args: {
    tokens: mockTokens.map(token => ({
      ...token,
      change24h: (-Math.abs(Number(token.change24h))).toString()
    })),
  },
};