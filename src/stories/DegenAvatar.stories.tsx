import type { Meta, StoryObj } from '@storybook/react';
import DegenAvatar, { AVATAR_TYPES } from '../components/character-avatars/DegenAvatar';
import AvatarExamples from '../components/character-avatars/AvatarExamples';

const meta: Meta<typeof DegenAvatar> = {
  title: 'Components/DegenAvatar',
  component: DegenAvatar,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#111827' },
        { name: 'light', value: '#F9FAFB' },
      ]
    },
  },
  tags: ['autodocs'],
  argTypes: {
    topType: {
      control: 'select',
      options: [
        'NoHair', 'Eyepatch', 'Hat', 'Hijab', 'Turban', 
        'WinterHat1', 'WinterHat2', 'WinterHat3', 'WinterHat4', 
        'LongHairBigHair', 'LongHairBob', 'LongHairBun', 'LongHairCurly', 
        'LongHairCurvy', 'LongHairDreads', 'LongHairFrida', 'LongHairFro', 
        'LongHairFroBand', 'LongHairNotTooLong', 'LongHairShavedSides', 
        'LongHairMiaWallace', 'LongHairStraight', 'LongHairStraight2', 
        'LongHairStraightStrand', 'ShortHairDreads01', 'ShortHairDreads02', 
        'ShortHairFrizzle', 'ShortHairShaggyMullet', 'ShortHairShortCurly', 
        'ShortHairShortFlat', 'ShortHairShortRound', 'ShortHairShortWaved', 
        'ShortHairSides', 'ShortHairTheCaesar', 'ShortHairTheCaesarSidePart'
      ],
      description: 'The type of top/hair style',
    },
    accessoriesType: {
      control: 'select',
      options: [
        'Blank', 'Kurt', 'Prescription01', 'Prescription02', 
        'Round', 'Sunglasses', 'Wayfarers'
      ],
      description: 'The type of accessories',
    },
    hairColor: {
      control: 'select',
      options: [
        'Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 
        'BrownDark', 'PastelPink', 'Platinum', 'Red', 'SilverGray'
      ],
      description: 'The hair color',
    },
    facialHairType: {
      control: 'select',
      options: [
        'Blank', 'BeardMedium', 'BeardLight', 'BeardMajestic', 
        'MoustacheFancy', 'MoustacheMagnum'
      ],
      description: 'The type of facial hair',
    },
    size: {
      control: 'text',
      description: 'The size of the avatar (can be px, rem, etc.)',
    },
    animate: {
      control: 'boolean',
      description: 'Whether to animate the avatar',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DegenAvatar>;

// Basic avatars
export const Default: Story = {
  args: {
    size: '150px',
  },
};

// Predefined types
export const DegenType: Story = {
  args: {
    // Use type assertion to satisfy TypeScript
    ...(AVATAR_TYPES.DEGEN as any),
    size: '150px',
    animate: true,
  },
};

export const TraderType: Story = {
  args: {
    ...(AVATAR_TYPES.TRADER as any),
    size: '150px',
    animate: true,
  },
};

export const WinnerType: Story = {
  args: {
    ...(AVATAR_TYPES.WINNER as any),
    size: '150px',
    animate: true,
  },
};

export const LoserType: Story = {
  args: {
    ...(AVATAR_TYPES.LOSER as any),
    size: '150px',
    animate: true,
  },
};

export const AdminType: Story = {
  args: {
    ...(AVATAR_TYPES.ADMIN as any),
    size: '150px',
    animate: true,
  },
};

// Username-based generation
export const UsernameBasedAvatar: Story = {
  args: {
    username: 'cryptoking',
    size: '150px',
    animate: true,
  },
};

// Example gallery
export const AvatarGallery: Story = {
  render: () => <AvatarExamples />,
  parameters: {
    layout: 'fullscreen',
  },
};