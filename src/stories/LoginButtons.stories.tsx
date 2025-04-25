import type { Meta, StoryObj } from '@storybook/react';
import { MockTwitterLoginButton, MockPrivyLoginButton } from '../../.storybook/authComponents';

// Twitter Button Stories
const TwitterLoginMeta: Meta<typeof MockTwitterLoginButton> = {
  title: 'Auth/TwitterLoginButton',
  component: MockTwitterLoginButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default TwitterLoginMeta;
type TwitterStory = StoryObj<typeof MockTwitterLoginButton>;

export const TwitterLogin: TwitterStory = {
  args: {
    linkMode: false,
    className: 'w-64'
  },
};

export const TwitterLinkAccount: TwitterStory = {
  args: {
    linkMode: true,
    className: 'w-64'
  },
};

// Privy Button Stories
export const PrivyMeta: Meta<typeof MockPrivyLoginButton> = {
  title: 'Auth/PrivyLoginButton',
  component: MockPrivyLoginButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

type PrivyStory = StoryObj<typeof MockPrivyLoginButton>;

export const PrivyLogin: PrivyStory = {
  args: {
    linkMode: false,
    className: 'w-64'
  },
};

export const PrivyLinkAccount: PrivyStory = {
  args: {
    linkMode: true,
    className: 'w-64'
  },
};