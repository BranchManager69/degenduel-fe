import type { Meta, StoryObj } from '@storybook/react';
import { MockLoginOptions } from '../../.storybook/authComponents';

// Login Options Component Stories
const meta: Meta<typeof MockLoginOptions> = {
  title: 'Auth/Components/LoginOptions',
  component: MockLoginOptions,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    }
  },
};

export default meta;
type Story = StoryObj<typeof MockLoginOptions>;

// All Login Options View
export const AllLoginOptions: Story = {
  args: {
    showLinkView: false,
    className: ''
  },
};

// Link Account View
export const LinkAccountView: Story = {
  args: {
    showLinkView: true,
    className: ''
  },
};

// With Background Effects
export const WithBackgroundEffects: Story = {
  args: {
    showLinkView: false,
    className: ''
  },
  decorators: [
    (Story: React.ComponentType) => (
      <div className="p-10 relative overflow-hidden rounded-lg" style={{minHeight: '600px', minWidth: '450px'}}>
        {/* Background effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(93,52,221,0.1),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(114,9,183,0.1),transparent_70%)]"></div>
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-purple-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-brand-500/5 blur-[120px] rounded-full"></div>
        
        {/* Decorative lines */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute top-[10%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent"></div>
          <div className="absolute top-[90%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
          <div className="absolute bottom-[40%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-200/50 to-transparent"></div>
          <div className="absolute left-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500 to-transparent"></div>
          <div className="absolute right-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-500 to-transparent"></div>
        </div>
        
        <Story />
      </div>
    ),
  ]
};